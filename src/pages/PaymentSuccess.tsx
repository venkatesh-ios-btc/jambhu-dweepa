import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import QRCode from 'qrcode';
import { CheckCircle, Download, Eye, Loader2 } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getApiBase } from '@/lib/apiBase';
import { readTicketPickup, type TicketPickupStored } from '@/lib/ticketPickupStorage';

const THEATER = 'PVR Orion Mall';
const SHOW_LINE = '28 Mar 2026, 7:00 PM';

export type PaymentSuccessState = {
  paymentId?: string;
  qrToken?: string;
  ticketCode?: string;
  mobile?: string;
  area?: string;
};

function stateComplete(s: Partial<PaymentSuccessState> | null): s is Required<PaymentSuccessState> {
  return Boolean(s?.qrToken && s?.ticketCode);
}

const PaymentSuccess = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isKn = i18n.language === 'kn';
  const apiBase = getApiBase();

  const paymentQuery = searchParams.get('p')?.trim() || '';
  const ticketCodeQuery = searchParams.get('c')?.trim() || '';

  const [resolved, setResolved] = useState<Required<PaymentSuccessState> | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function resolve() {
      setLoading(true);
      setFetchError(false);

      const fromRouter = (location.state || {}) as PaymentSuccessState;
      if (stateComplete(fromRouter)) {
        if (!cancelled) {
          setResolved({
            paymentId: fromRouter.paymentId || '',
            qrToken: fromRouter.qrToken,
            ticketCode: fromRouter.ticketCode,
            mobile: fromRouter.mobile || '',
            area: fromRouter.area || '',
          });
          setLoading(false);
        }
        return;
      }

      const stored = readTicketPickup();
      if (stored && stored.qrToken && stored.ticketCode) {
        if (
          !paymentQuery ||
          stored.paymentId === paymentQuery ||
          !paymentQuery.startsWith('pay_')
        ) {
          if (!cancelled) {
            setResolved({
              paymentId: stored.paymentId,
              qrToken: stored.qrToken,
              ticketCode: stored.ticketCode,
              mobile: stored.mobile,
              area: stored.area,
            });
            setLoading(false);
          }
          return;
        }
      }

      if (paymentQuery.startsWith('pay_')) {
        try {
          const q = new URLSearchParams({ paymentId: paymentQuery });
          if (ticketCodeQuery) q.set('ticketCode', ticketCodeQuery);
          const res = await fetch(`${apiBase}/tickets/pickup?${q.toString()}`);
          const data = (await res.json()) as {
            error?: string;
            qrToken?: string;
            ticketCode?: string;
            paymentId?: string;
            mobile?: string;
            area?: string;
          };
          if (!cancelled && res.ok && data.qrToken && data.ticketCode) {
            setResolved({
              paymentId: data.paymentId || paymentQuery,
              qrToken: data.qrToken,
              ticketCode: data.ticketCode,
              mobile: data.mobile || '',
              area: data.area || '',
            });
            setLoading(false);
            return;
          }
          if (!cancelled) setFetchError(true);
        } catch {
          if (!cancelled) setFetchError(true);
        }
        if (!cancelled) setLoading(false);
        return;
      }

      if (!cancelled) setLoading(false);
    }

    void resolve();
    return () => {
      cancelled = true;
    };
  }, [location.state, paymentQuery, ticketCodeQuery, apiBase]);

  const { paymentId, qrToken, ticketCode, mobile, area } = resolved || {
    paymentId: '',
    qrToken: '',
    ticketCode: '',
    mobile: '',
    area: '',
  };

  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const verifyUrl = useMemo(() => {
    if (typeof window === 'undefined' || !qrToken) return '';
    const u = new URL(`${window.location.origin}/admin/scan`);
    u.searchParams.set('t', qrToken);
    return u.toString();
  }, [qrToken]);

  useEffect(() => {
    if (!verifyUrl) return;
    let cancelled = false;
    QRCode.toDataURL(verifyUrl, { width: 200, margin: 2, color: { dark: '#0a0a0a', light: '#ffffff' } })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [verifyUrl]);

  const bookingRef = ticketCode ? `JD-${String(ticketCode).toUpperCase()}` : '—';

  const handleDownloadPdf = async () => {
    if (qrToken) {
      try {
        await fetch(`${apiBase}/tickets/pdf-downloaded`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ qrToken }),
        });
      } catch {
        /* still open printable ticket */
      }
    }

    const w = window.open('', '_blank');
    if (!w) return;
    const qrImg = qrDataUrl
      ? `<img src="${qrDataUrl}" width="200" height="200" alt="QR" style="display:block;margin:16px auto" />`
      : '';
    w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${bookingRef}</title>
      <style>
        body{font-family:system-ui,sans-serif;padding:24px;max-width:400px;margin:0 auto;color:#111}
        h1{font-size:1.25rem;color:#c2410c}
        .row{display:flex;justify-content:space-between;margin:8px 0;font-size:14px}
        .muted{color:#666}
      </style></head><body>
      <h1>Jambhu Dweepa</h1>
      <p class="muted">${THEATER}</p>
      ${qrImg}
      <div class="row"><span class="muted">${t('payment.bookingId')}</span><strong>${bookingRef}</strong></div>
      <div class="row"><span class="muted">${t('payment.theater')}</span><span>${THEATER}</span></div>
      <div class="row"><span class="muted">${t('payment.dateTime')}</span><span>${SHOW_LINE}</span></div>
      ${mobile ? `<div class="row"><span class="muted">${t('booking.mobile')}</span><span>${mobile}</span></div>` : ''}
      ${area ? `<div class="row"><span class="muted">${t('booking.area')}</span><span>${area}</span></div>` : ''}
      ${paymentId ? `<div class="row"><span class="muted">Payment</span><span style="font-size:11px;word-break:break-all">${paymentId}</span></div>` : ''}
      <p class="muted" style="margin-top:24px;font-size:12px">${t('payment.printSaveHint')}</p>
      </body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 300);
  };

  const scrollToQr = () => {
    document.getElementById('ticket-qr')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-24 pb-16 flex flex-col items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm">{t('payment.loadingTicket')}</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!resolved || !qrToken || !ticketCode) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-24 pb-16 container mx-auto px-4 max-w-md text-center">
          <p className="text-muted-foreground text-sm">
            {fetchError ? t('payment.pickupFailed') : t('payment.missingTicketState')}
          </p>
          <Link to="/booking" className="inline-block mt-4 text-primary font-medium hover:underline">
            {t('payment.goBooking')}
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>
            <h1 className={`${isKn ? 'font-kannada' : 'font-display'} text-3xl text-foreground mt-5`}>
              {t('payment.success')}
            </h1>
            <p className="text-muted-foreground text-sm mt-2">{t('payment.ticketReady')}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-8 bg-card rounded-xl overflow-hidden saffron-border"
          >
            <div className="bg-gradient-to-r from-primary to-accent p-5">
              <h2 className={`${isKn ? 'font-kannada text-2xl' : 'font-display text-3xl'} text-primary-foreground`}>
                {isKn ? 'ಜಂಬೂದ್ವೀಪ' : 'JAMBHU DWEEPA'}
              </h2>
              <p className="text-primary-foreground/80 text-sm mt-1">{THEATER}, Bangalore</p>
            </div>

            <div className="relative h-4 bg-card">
              <div className="absolute inset-x-0 top-0 flex justify-between px-[-8px]">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div key={i} className="w-2 h-4 bg-background rounded-b-full" />
                ))}
              </div>
            </div>

            <div className="p-5 flex flex-col items-center" id="ticket-qr">
              <div className="w-44 h-44 bg-white rounded-md flex items-center justify-center p-2">
                {qrDataUrl ? (
                  <img src={qrDataUrl} width={200} height={200} className="rounded-sm" alt="" />
                ) : (
                  <div className="w-full h-full animate-pulse bg-muted rounded-sm" />
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center max-w-[280px]">
                {t('payment.qrScanHint')}
              </p>

              <div className="mt-5 w-full space-y-3 text-sm">
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground shrink-0">{t('payment.bookingId')}</span>
                  <span className="text-foreground tabular-nums font-mono text-right break-all">{bookingRef}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('payment.theater')}</span>
                  <span className="text-foreground text-right">{THEATER}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('payment.dateTime')}</span>
                  <span className="text-foreground tabular-nums text-right">{SHOW_LINE}</span>
                </div>
                {mobile ? (
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">{t('booking.mobile')}</span>
                    <span className="text-foreground text-right">{mobile}</span>
                  </div>
                ) : null}
                {area ? (
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">{t('booking.area')}</span>
                    <span className="text-foreground text-right">{area}</span>
                  </div>
                ) : null}
              </div>
            </div>
          </motion.div>

          <div className="flex gap-3 mt-6">
            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() => void handleDownloadPdf()}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold text-sm shadow-saffron-glow"
            >
              <Download className="w-4 h-4" /> {t('payment.downloadPdf')}
            </motion.button>
            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={scrollToQr}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border-2 border-primary/50 text-primary font-medium text-sm hover:bg-primary/10 transition-cinematic"
            >
              <Eye className="w-4 h-4" /> {t('payment.viewTicket')}
            </motion.button>
          </div>

          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full mt-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-cinematic"
          >
            {t('payment.backHome')}
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PaymentSuccess;
