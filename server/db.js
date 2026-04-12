import mongoose from 'mongoose';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Base options for MongoDB Atlas (Node driver + Atlas). */
const baseOptions = {
  serverSelectionTimeoutMS: 25_000,
};

let lastConnectError = '';
let hasMongoUri = false;

/** Safe for /health/db — no secrets. */
export function getDbDiagnostics() {
  return {
    hasMongoUri,
    lastError: lastConnectError || undefined,
  };
}

async function disconnectIfNeeded() {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  } catch {
    /* ignore */
  }
}

/**
 * Try mongoose.connect with retries and two strategies:
 * 1) IPv4-first (fixes many macOS TLS/SRV issues)
 * 2) Default address resolution (if ISP/network only works with the other stack)
 */
async function connectWithStrategies(uri) {
  const strategies = [
    { label: 'IPv4-first', opts: { ...baseOptions, family: 4 } },
    { label: 'default (IPv4/IPv6)', opts: { ...baseOptions } },
  ];

  const perStrategyAttempts = 3;
  const pauseMs = 2500;

  let lastErr = null;

  for (const { label, opts } of strategies) {
    for (let attempt = 1; attempt <= perStrategyAttempts; attempt++) {
      try {
        await disconnectIfNeeded();
        await mongoose.connect(uri, opts);
        if (label !== 'IPv4-first') {
          console.log(`✅ MongoDB Connected (${label})`);
        } else {
          console.log('✅ MongoDB Connected');
        }
        return true;
      } catch (err) {
        lastErr = err;
        const msg = err instanceof Error ? err.message : String(err);
        lastConnectError = msg;
        console.error(`❌ DB Error [${label}] attempt ${attempt}/${perStrategyAttempts}:`, msg);
        if (attempt < perStrategyAttempts) await sleep(pauseMs);
      }
    }
  }

  const msg = lastErr instanceof Error ? lastErr.message : String(lastErr);
  console.error('❌ DB Error (all attempts failed):', msg);
  printAtlasHints(msg);
  return false;
}

function printAtlasHints(msg) {
  const lower = msg.toLowerCase();
  if (/whitelist|ip|network|could not connect|serverselection/i.test(lower)) {
    console.error(
      '   → Atlas: Security → Network Access → add your IP, or temporarily 0.0.0.0/0 to test. ' +
        'Wait 1–2 min after saving.',
    );
    console.error(
      '   → Confirm MONGO_URI is copied from Connect → Drivers for this same cluster (host must match).',
    );
  }
  if (/tls|ssl|alert internal/i.test(msg)) {
    console.error(
      '   → TLS: ensure password in MONGO_URI is URL-encoded if it contains @ : / # ? [ ] etc.',
    );
  }
  if (/authentication|bad auth|invalid.*password/i.test(lower)) {
    console.error('   → Auth: reset database user password in Atlas and update MONGO_URI.');
  }
}

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  hasMongoUri = Boolean(uri && typeof uri === 'string' && uri.trim());
  if (!hasMongoUri) {
    lastConnectError = 'MONGO_URI is not set in server/.env';
    console.error('❌ DB Error:', lastConnectError);
    return false;
  }

  const trimmed = uri.trim();
  lastConnectError = '';
  const ok = await connectWithStrategies(trimmed);
  return ok;
};

export default connectDB;
