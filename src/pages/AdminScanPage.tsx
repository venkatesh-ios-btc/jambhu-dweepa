import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Html5Qrcode } from 'html5-qrcode';
import { ScanLine, ArrowLeft, CheckCircle, XCircle, AlertTriangle, Camera } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getApiBase } from '@/lib/apiBase';

const READER_ELEMENT_ID = 'admin-qr-reader';

type ScanStatus = 'idle' | 'loading' | 'verified' | 'already_verified' | 'invalid' | 'not_paid' | 'error';

export type VerifyTicket = {
  code: string;
  customerMobile: string;
  customerArea: string;
  razorpayPaymentId: string;
  paidAt: string | null;
  entryVerifiedAt: string | null;
  pdfDownloadedAt: string | null;
};

function extractQrToken(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  try {
    const u = new URL(trimmed);
    const t = u.searchParams.get('t');
    if (t) return t.trim();
  } catch {
    /* not a URL */
  }
  if (/^[a-f0-9]{40}$/i.test(trimmed)) return trimmed;
  return null;
}

const AdminScanPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isKn = i18n.language === 'kn';
  const apiBase = getApiBase();
  const urlTokenParam = searchParams.get('t');

  const [status, setStatus] = useState<ScanStatus>(() => (urlTokenParam ? 'loading' : 'idle'));
  const [ticket, setTicket] = useState<VerifyTicket | null>(null);
  const busyRef = useRef(false);
  const verifyTokenRef = useRef<(raw: string) => Promise<void>>(async () => {});
  const html5Ref = useRef<Html5Qrcode | null>(null);
  const scanHandledRef = useRef(false);
  const [cameraStarting, setCameraStarting] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const stopScannerInstance = useCallback(async () => {
    const inst = html5Ref.current;
    if (!inst) return;
    html5Ref.current = null;
    try {
      await inst.stop();
    } catch {
      /* not running */
    }
    try {
      inst.clear();
    } catch {
      /* ignore */
    }
  }, []);

  const verifyToken = useCallback(
    async (raw: string) => {
      const token = extractQrToken(raw);
      if (!token) {
        setStatus('invalid');
        setTicket(null);
        return;
      }
      if (busyRef.current) return;
      busyRef.current = true;
      setStatus('loading');
      try {
        const res = await fetch(`${apiBase}/admin/verify-scan`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ qrToken: token }),
        });
        const data = (await res.json()) as {
          status?: string;
          ticket?: VerifyTicket;
          error?: string;
        };
        if (!res.ok || data.error) {
          setStatus('error');
          setTicket(null);
          return;
        }
        if (data.status === 'verified') {
          setStatus('verified');
          setTicket(data.ticket ?? null);
        } else if (data.status === 'already_verified') {
          setStatus('already_verified');
          setTicket(data.ticket ?? null);
        } else if (data.status === 'not_paid') {
          setStatus('not_paid');
          setTicket(null);
        } else {
          setStatus('invalid');
          setTicket(null);
        }
      } catch {
        setStatus('error');
        setTicket(null);
      } finally {
        busyRef.current = false;
      }
    },
    [apiBase],
  );

  verifyTokenRef.current = verifyToken;

  const startScanner = useCallback(async () => {
    setCameraError(null);
    setCameraStarting(true);
    scanHandledRef.current = false;
    await stopScannerInstance();
    const config = { fps: 10, qrbox: { width: 260, height: 260 }, aspectRatio: 1.777778 as const };
    const onSuccess = (decodedText: string) => {
      if (scanHandledRef.current) return;
      scanHandledRef.current = true;
      void (async () => {
        await stopScannerInstance();
        await verifyTokenRef.current(decodedText);
      })();
    };
    try {
      const html5 = new Html5Qrcode(READER_ELEMENT_ID, { verbose: false });
      html5Ref.current = html5;
      await html5.start({ facingMode: 'environment' }, config, onSuccess, () => {});
    } catch {
      try {
        await stopScannerInstance();
        const cameras = await Html5Qrcode.getCameras();
        if (cameras.length === 0) {
          setCameraError(t('admin.cameraUnavailable'));
          return;
        }
        const preferred =
          cameras.find((c) => /back|rear|environment|wide/i.test(c.label)) ?? cameras[0];
        const html5 = new Html5Qrcode(READER_ELEMENT_ID, { verbose: false });
        html5Ref.current = html5;
        await html5.start(preferred.id, config, onSuccess, () => {});
      } catch {
        setCameraError(t('admin.cameraUnavailable'));
      }
    } finally {
      setCameraStarting(false);
    }
  }, [stopScannerInstance, t]);

  useEffect(() => {
    if (localStorage.getItem('adminAuth') === 'true') return;
    const next = encodeURIComponent(`${location.pathname}${location.search}`);
    navigate(`/login?next=${next}`, { replace: true });
  }, [navigate, location.pathname, location.search]);

  useEffect(() => {
    if (!urlTokenParam || localStorage.getItem('adminAuth') !== 'true') return;
    void verifyToken(urlTokenParam);
  }, [urlTokenParam, verifyToken]);

  useEffect(() => {
    return () => {
      void stopScannerInstance();
    };
  }, [stopScannerInstance]);

  useEffect(() => {
    if (status === 'idle') return;
    void stopScannerInstance();
  }, [status, stopScannerInstance]);

  const resetScanner = () => {
    window.location.href = '/admin/scan';
  };

  const formatDt = (iso: string | null) => {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleString(i18n.language === 'kn' ? 'en-IN' : undefined);
    } catch {
      return iso;
    }
  };

  const dashboardLink = (className: string) => (
    <Link
      to="/admin"
      state={{ activeTab: 'digitalTickets' }}
      className={className}
    >
      {t('admin.viewInDashboard')}
    </Link>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-24 pb-16 container mx-auto px-4 max-w-lg">
        <div className="flex items-center gap-3 mb-6">
          <Link
            to="/admin"
            state={{ activeTab: 'digitalTickets' }}
            className="p-2 rounded-lg bg-muted text-foreground hover:bg-muted/80 transition-cinematic"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className={`${isKn ? 'font-kannada' : 'font-display'} text-2xl text-foreground`}>
            {t('admin.scanVerify')}
          </h1>
        </div>

        <p className="text-sm text-muted-foreground mb-4">{t('admin.scanVerifyHint')}</p>

        {status === 'idle' && (
          <div className="rounded-xl overflow-hidden bg-card saffron-border p-4 space-y-4">
            <button
              type="button"
              onClick={() => void startScanner()}
              disabled={cameraStarting}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-60"
            >
              <Camera className="w-5 h-5 shrink-0" />
              {cameraStarting ? t('common.loading') : t('admin.startCamera')}
            </button>
            {cameraError ? (
              <p className="text-sm text-destructive text-center">{cameraError}</p>
            ) : null}
            <div id={READER_ELEMENT_ID} className="w-full min-h-[280px] rounded-lg overflow-hidden bg-muted/40" />
          </div>
        )}

        {status === 'loading' && (
          <div className="rounded-xl p-12 bg-card saffron-border flex flex-col items-center justify-center gap-3 text-primary">
            <ScanLine className="w-10 h-10 animate-pulse" />
            <span className="text-sm">{t('qr.scanning')}</span>
          </div>
        )}

        {status === 'verified' && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl p-6 bg-emerald-500/15 border border-emerald-500/40"
          >
            <CheckCircle className="w-14 h-14 text-emerald-500 mx-auto" />
            <p className={`${isKn ? 'font-kannada' : 'font-display'} text-xl text-center text-foreground mt-3`}>
              {t('admin.scanVerified')}
            </p>
            <TicketDetails ticket={ticket} formatDt={formatDt} />
            <div className="mt-5 space-y-3">
              {dashboardLink(
                'block w-full text-center py-3 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted/80 transition-colors',
              )}
              <button
                type="button"
                onClick={resetScanner}
                className="w-full py-3 rounded-lg bg-primary text-primary-foreground text-sm font-semibold"
              >
                {t('admin.scanAnother')}
              </button>
            </div>
          </motion.div>
        )}

        {status === 'already_verified' && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl p-6 bg-amber-500/15 border border-amber-500/40"
          >
            <AlertTriangle className="w-14 h-14 text-amber-500 mx-auto" />
            <p className={`${isKn ? 'font-kannada' : 'font-display'} text-xl text-center text-foreground mt-3`}>
              {t('admin.scanAlreadyVerified')}
            </p>
            <p className="text-sm text-center text-muted-foreground mt-2">{t('admin.alreadyVerifiedDetail')}</p>
            <TicketDetails ticket={ticket} formatDt={formatDt} />
            <div className="mt-5 space-y-3">
              {dashboardLink(
                'block w-full text-center py-3 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted/80 transition-colors',
              )}
              <button
                type="button"
                onClick={resetScanner}
                className="w-full py-3 rounded-lg bg-muted text-foreground text-sm font-semibold"
              >
                {t('admin.scanAnother')}
              </button>
            </div>
          </motion.div>
        )}

        {(status === 'invalid' || status === 'not_paid') && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl p-6 bg-destructive/10 border border-destructive/30 text-center"
          >
            <XCircle className="w-14 h-14 text-destructive mx-auto" />
            <p className="text-lg text-foreground mt-3">
              {status === 'not_paid' ? t('admin.scanNotPaid') : t('admin.scanInvalid')}
            </p>
            <div className="mt-5 space-y-3">
              {dashboardLink(
                'block w-full text-center py-3 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted/80 transition-colors',
              )}
              <button
                type="button"
                onClick={resetScanner}
                className="w-full py-3 rounded-lg bg-primary text-primary-foreground text-sm font-semibold"
              >
                {t('admin.scanAnother')}
              </button>
            </div>
          </motion.div>
        )}

        {status === 'error' && (
          <div className="rounded-xl p-6 bg-destructive/10 text-center text-sm text-destructive">
            {t('admin.scanServerError')}
            <div className="mt-4 space-y-3">
              {dashboardLink(
                'block w-full text-center py-3 rounded-lg border border-border text-foreground font-medium hover:bg-muted/80 transition-colors',
              )}
              <button
                type="button"
                onClick={resetScanner}
                className="block w-full py-3 rounded-lg bg-muted text-foreground font-medium"
              >
                {t('admin.scanAnother')}
              </button>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

function TicketDetails({
  ticket,
  formatDt,
}: {
  ticket: VerifyTicket | null;
  formatDt: (iso: string | null) => string;
}) {
  const { t } = useTranslation();
  if (!ticket) return null;
  return (
    <dl className="mt-5 space-y-2 text-sm">
      <div className="flex justify-between gap-2">
        <dt className="text-muted-foreground">{t('payment.bookingId')}</dt>
        <dd className="font-mono text-right break-all">JD-{ticket.code.toUpperCase()}</dd>
      </div>
      <div className="flex justify-between gap-2">
        <dt className="text-muted-foreground">{t('booking.mobile')}</dt>
        <dd className="text-right">{ticket.customerMobile || '—'}</dd>
      </div>
      <div className="flex justify-between gap-2">
        <dt className="text-muted-foreground">{t('booking.area')}</dt>
        <dd className="text-right">{ticket.customerArea || '—'}</dd>
      </div>
      <div className="flex justify-between gap-2">
        <dt className="text-muted-foreground">Payment ID</dt>
        <dd className="text-xs text-right break-all">{ticket.razorpayPaymentId || '—'}</dd>
      </div>
      <div className="flex justify-between gap-2">
        <dt className="text-muted-foreground">{t('admin.paidAt')}</dt>
        <dd className="text-right tabular-nums">{formatDt(ticket.paidAt)}</dd>
      </div>
      <div className="flex justify-between gap-2">
        <dt className="text-muted-foreground">{t('admin.verifiedAt')}</dt>
        <dd className="text-right tabular-nums">{formatDt(ticket.entryVerifiedAt)}</dd>
      </div>
    </dl>
  );
}

export default AdminScanPage;
