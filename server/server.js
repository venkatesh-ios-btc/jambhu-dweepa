import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB, { getDbDiagnostics } from './db.js';
import { normalizeTicketCode } from './ticketCode.js';
import Ticket from './models/Ticket.js';
import cors from 'cors';
import { registerPaymentRoutes } from './payments.js';
import { registerTicketAdminRoutes } from './ticketsAdmin.js';
import { loadRazorpayCredentials } from './razorpayEnv.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '.env');
const envLoaded = dotenv.config({ path: envPath });
if (envLoaded.error) {
  console.warn('⚠️  Could not load', envPath, '— using process.env only');
} else {
  console.log('✅ Env loaded from', envPath);
}

const app = express();

app.use(cors());
app.use(express.json());

registerPaymentRoutes(app);
registerTicketAdminRoutes(app);
console.log('→ Payments: GET /payments/health | POST /payments/create-order | POST /payments/verify');
console.log(
  '→ Tickets/Admin: GET /tickets/pickup | POST /tickets/pdf-downloaded | POST /admin/verify-scan | GET /admin/paid-tickets | GET/POST /admin/ticket-details',
);

{
  const { keyId: kid, keySecret: sec } = loadRazorpayCredentials();
  if (kid && sec) {
    const mode = kid.startsWith('rzp_test_') ? 'test' : kid.startsWith('rzp_live_') ? 'live' : 'unknown';
    console.log(
      `✅ Razorpay: ${mode} mode | key_id ${kid.length} chars | secret ${sec.length} chars (expect ~24–40)`,
    );
    console.log(
      `   Key ID prefix in .env: ${kid.slice(0, 20)}… — must match Account & Settings → API keys (same test/live mode).`,
    );
    console.log(
      '   If payments say "Authentication failed": reveal Key secret in Dashboard, paste BOTH id+secret into server/.env, restart.',
    );
  } else {
    console.warn(
      '⚠️  Razorpay: missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET — add both to server/.env (no spaces around =)',
    );
  }
}

/** readyState: 0 disconnected, 1 connected, 2 connecting, 3 disconnecting */
app.get('/health/db', async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    const { hasMongoUri, lastError } = getDbDiagnostics();
    return res.status(503).json({
      ok: false,
      connected: false,
      readyState: mongoose.connection.readyState,
      hasMongoUri,
      /** First line of last connect failure (no password). */
      hint: lastError || (hasMongoUri ? 'connect_failed_check_server_log' : 'set_MONGO_URI_in_server_env'),
    });
  }
  try {
    await mongoose.connection.db.admin().command({ ping: 1 });
    return res.json({ ok: true, connected: true });
  } catch (err) {
    return res.status(503).json({
      ok: false,
      connected: false,
      error: err.message,
    });
  }
});

app.post('/validate', async (req, res) => {
  const code = normalizeTicketCode(req.body?.code);

  if (!code) {
    return res.status(400).json({ valid: false, reason: 'not_found' });
  }

  try {
    const ticket = await Ticket.findOne({ code });

    if (!ticket) {
      return res.json({ valid: false, reason: 'not_found' });
    }

    if (ticket.isUsed) {
      return res.json({ valid: false, reason: 'used' });
    }

    return res.json({ valid: true });
  } catch (err) {
    console.error('validate error:', err.message);
    return res.status(500).json({ valid: false, reason: 'server_error' });
  }
});

const PORT = Number(process.env.PORT) || 5050;
const HOST = process.env.HOST || '0.0.0.0';
// macOS AirPlay Receiver uses 5000 — use 5050 (or set PORT in .env).

async function boot() {
  await connectDB();
  app.listen(PORT, HOST, () => {
    console.log(`🚀 Server http://127.0.0.1:${PORT} (bound ${HOST}:${PORT})`);
  });
}

boot().catch((err) => {
  console.error('❌ Server boot failed:', err);
  process.exit(1);
});