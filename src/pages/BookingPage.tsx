import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Smartphone, MapPin, KeyRound, CreditCard, Wallet, Building2, QrCode } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getApiBase } from '@/lib/apiBase';
import { saveTicketPickup } from '@/lib/ticketPickupStorage';

const apiBase = getApiBase();

const paymentMethods = [
  { icon: QrCode, key: 'upi' as const },
  { icon: Building2, key: 'netBanking' as const },
  { icon: CreditCard, key: 'cards' as const },
  { icon: Wallet, key: 'wallets' as const },
];

type PaymentMethodKey = (typeof paymentMethods)[number]['key'];

/**
 * 10-digit numbers without + are treated as India (+91). Avoids 5959595959 → +595 (Paraguay) breaking UPI prefs.
 */
function razorpayPrefillContact(raw: string): string | undefined {
  const trimmed = raw.replace(/\s/g, '');
  if (!trimmed) return undefined;
  if (trimmed.startsWith('+')) return trimmed;
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 11 && digits.startsWith('0')) return `+91${digits.slice(1)}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  return trimmed;
}

type RazorpayHandlerResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

function loadRazorpayScript(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('razorpay_script'));
    document.body.appendChild(s);
  });
}

const BookingPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isKn = i18n.language === 'kn';
  const [mobile, setMobile] = useState('');
  const [area, setArea] = useState('');
  const [ticketCode, setTicketCode] = useState('');
  const [verified, setVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [paymentFocus, setPaymentFocus] = useState<PaymentMethodKey | null>(null);
  const [payProcessing, setPayProcessing] = useState(false);
  const [payError, setPayError] = useState('');

  useEffect(() => {
    setVerified(false);
    setVerifyError('');
    setPaymentFocus(null);
    setPayError('');
  }, [ticketCode]);

  const handleVerify = async () => {
    if (!mobile || !area || !ticketCode.trim()) return;
    setVerifying(true);
    setVerifyError('');
    try {
      const res = await fetch(`${apiBase}/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: ticketCode.trim() }),
      });
      const data = (await res.json()) as {
        valid?: boolean;
        reason?: string;
      };

      if (data.valid === true) {
        setVerified(true);
        return;
      }

      if (data.reason === 'used') {
        setVerifyError(t('booking.codeAlreadyUsed'));
        return;
      }
      if (data.reason === 'not_found') {
        setVerifyError(t('booking.codeNotFound'));
        return;
      }
      setVerifyError(t('booking.verifyFailed'));
    } catch {
      setVerifyError(t('booking.verifyFailed'));
    } finally {
      setVerifying(false);
    }
  };

  /**
   * Start Razorpay checkout. Pass `methodKey` from a payment tile (opens immediately with that choice highlighted).
   * Omit or call from "Proceed" to use the currently selected tile, if any.
   */
  const startPayment = async (methodKey?: PaymentMethodKey) => {
    const code = ticketCode.trim();
    if (!code) return;

    if (methodKey !== undefined) {
      setPaymentFocus(methodKey);
    }

    setPayError('');
    setPayProcessing(true);
    try {
      await loadRazorpayScript();
      const RazorpayCtor = window.Razorpay;
      if (!RazorpayCtor) {
        setPayError(t('booking.payInitFailed'));
        setPayProcessing(false);
        return;
      }

      const res = await fetch(`${apiBase}/payments/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketCode: code }),
      });
      let data: {
        error?: string;
        message?: string;
        orderId?: string;
        amount?: number;
        currency?: string;
        keyId?: string;
      } = {};
      try {
        data = (await res.json()) as typeof data;
      } catch {
        /* non-JSON body */
      }

      if (!res.ok || !data.orderId || !data.keyId || data.amount == null || !data.currency) {
        if (res.status === 404) {
          setPayError(t('booking.payApi404'));
        } else if (res.status === 503 && data.error === 'payments_unconfigured') {
          setPayError(t('booking.payRazorpayNotConfigured'));
        } else if (res.status === 400 && data.error === 'ticket_used') {
          setPayError(t('booking.codeAlreadyUsed'));
        } else if (res.status === 400 && data.error === 'ticket_not_found') {
          setPayError(t('booking.codeNotFound'));
        } else if (res.status === 502 && data.error === 'order_failed' && data.message) {
          setPayError(t('booking.payOrderFailedDetail', { detail: data.message }));
        } else {
          setPayError(t('booking.payInitFailed'));
        }
        setPayProcessing(false);
        return;
      }

      const rzp = new RazorpayCtor({
        key: data.keyId,
        amount: String(data.amount),
        currency: data.currency,
        name: 'Jambhu Dweepa',
        description: t('booking.title'),
        order_id: data.orderId,
        prefill: { contact: razorpayPrefillContact(mobile) },
        theme: { color: '#c2410c' },
        modal: {
          ondismiss: () => setPayProcessing(false),
        },
        handler: async (response: RazorpayHandlerResponse) => {
          try {
            const v = await fetch(`${apiBase}/payments/verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                ticketCode: code,
                customerMobile: mobile.trim(),
                customerArea: area.trim(),
              }),
            });
            const out = (await v.json()) as {
              ok?: boolean;
              error?: string;
              qrToken?: string;
              ticketCode?: string;
              paymentId?: string;
            };
            if (!v.ok || !out.ok) {
              if (out.error === 'bad_signature') {
                setPayError(t('booking.payVerifyBadSignature'));
              } else if (out.error === 'invalid_ticket') {
                setPayError(t('booking.payVerifyInvalidTicket'));
              } else if (out.error === 'server_error') {
                setPayError(t('booking.payVerifyServerError'));
              } else if (out.error === 'bad_request') {
                setPayError(t('booking.payVerifyBadRequest'));
              } else {
                setPayError(t('booking.payVerifyFailed'));
              }
              setPayProcessing(false);
              return;
            }
            setPayProcessing(false);
            const paymentId = out.paymentId ?? response.razorpay_payment_id;
            const ticketCodeOk = out.ticketCode ?? code;
            const qrTok = out.qrToken;
            if (paymentId && qrTok && ticketCodeOk) {
              saveTicketPickup({
                paymentId,
                qrToken: qrTok,
                ticketCode: ticketCodeOk,
                mobile: mobile.trim(),
                area: area.trim(),
              });
            }
            navigate(
              `/payment-success?p=${encodeURIComponent(paymentId)}&c=${encodeURIComponent(ticketCodeOk)}`,
              {
                replace: true,
                state: {
                  paymentId,
                  qrToken: out.qrToken,
                  ticketCode: ticketCodeOk,
                  mobile: mobile.trim(),
                  area: area.trim(),
                },
              },
            );
          } catch {
            setPayError(t('booking.payVerifyFailed'));
            setPayProcessing(false);
          }
        },
      });

      rzp.open();
    } catch {
      setPayError(t('booking.payInitFailed'));
      setPayProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-lg">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className={`${isKn ? 'font-kannada' : 'font-display'} text-4xl text-foreground`}>
              {t('booking.title')}
            </h1>
            <div className="w-16 h-1 bg-primary mt-3 rounded-full" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mt-10 space-y-5"
          >
            {/* Mobile */}
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">{t('booking.mobile')}</label>
              <div className="relative">
                <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  value={mobile} onChange={e => setMobile(e.target.value)}
                  placeholder={t('booking.enterMobile')}
                  inputMode="numeric"
                  autoComplete="tel"
                  className="w-full bg-muted text-foreground rounded-lg pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-cinematic placeholder:text-muted-foreground/50"
                />
              </div>
              <p className="text-xs text-muted-foreground/80">{t('booking.mobileRazorpayHint')}</p>
            </div>

            {/* Area */}
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">{t('booking.area')}</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  value={area} onChange={e => setArea(e.target.value)}
                  placeholder={t('booking.enterArea')}
                  className="w-full bg-muted text-foreground rounded-lg pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-cinematic placeholder:text-muted-foreground/50"
                />
              </div>
            </div>

            {/* Ticket Code */}
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">{t('booking.ticketCode')}</label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  value={ticketCode} onChange={e => setTicketCode(e.target.value)}
                  placeholder={t('booking.enterCode')}
                  className="w-full bg-muted text-foreground rounded-lg pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-cinematic placeholder:text-muted-foreground/50"
                />
              </div>
            </div>

            {/* Verify Button */}
            {!verified && (
              <div className="space-y-2">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleVerify}
                  disabled={verifying}
                  className={`w-full py-3.5 rounded-lg font-semibold text-sm transition-cinematic ${
                    verifying
                      ? 'bg-muted text-muted-foreground animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-muted via-primary/20 to-muted'
                      : 'bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-saffron-glow hover:shadow-saffron-lg'
                  }`}
                >
                  {verifying ? t('booking.verifying') : t('booking.verify')}
                </motion.button>
                {verifyError ? <p className="text-sm text-destructive">{verifyError}</p> : null}
              </div>
            )}

            {/* Payment Methods */}
            {verified && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                <p className="text-sm text-muted-foreground">{t('booking.paymentMethods')}</p>
                <p className="text-xs text-muted-foreground/80">{t('booking.selectMethodHint')}</p>
                <p className="text-xs text-muted-foreground/80">{t('booking.razorpayUpiDashboardHint')}</p>
                <div className="grid grid-cols-2 gap-3">
                  {paymentMethods.map(({ icon: Icon, key }) => (
                    <button
                      key={key}
                      type="button"
                      disabled={payProcessing}
                      onClick={() => void startPayment(key)}
                      className={`flex items-center gap-2 bg-muted rounded-lg px-4 py-3 saffron-border text-left transition-cinematic cursor-pointer disabled:opacity-50 disabled:pointer-events-none ${
                        paymentFocus === key ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''
                      }`}
                    >
                      <Icon className="w-4 h-4 text-primary shrink-0" />
                      <span className="text-sm text-foreground">{t(`booking.${key}`)}</span>
                    </button>
                  ))}
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => void startPayment()}
                  disabled={payProcessing}
                  className={`w-full py-3.5 rounded-lg font-semibold text-sm transition-cinematic ${
                    payProcessing
                      ? 'bg-muted text-muted-foreground'
                      : 'bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-saffron-glow hover:shadow-saffron-lg'
                  }`}
                >
                  {payProcessing ? t('booking.processingPayment') : t('booking.proceedPayment')}
                </motion.button>
                {payError ? <p className="text-sm text-destructive">{payError}</p> : null}
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default BookingPage;
