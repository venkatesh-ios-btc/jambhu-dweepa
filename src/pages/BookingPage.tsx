import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Smartphone, MapPin, KeyRound, CreditCard, Wallet, Building2, QrCode } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const paymentMethods = [
  { icon: QrCode, key: 'upi' },
  { icon: Building2, key: 'netBanking' },
  { icon: CreditCard, key: 'cards' },
  { icon: Wallet, key: 'wallets' },
];

const BookingPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isKn = i18n.language === 'kn';
  const [mobile, setMobile] = useState('');
  const [area, setArea] = useState('');
  const [ticketCode, setTicketCode] = useState('');
  const [verified, setVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const handleVerify = () => {
    if (!mobile || !area || !ticketCode) return;
    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
      setVerified(true);
    }, 1500);
  };

  const handlePayment = () => {
    // Razorpay integration placeholder
    navigate('/payment-success');
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
                  className="w-full bg-muted text-foreground rounded-lg pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-cinematic placeholder:text-muted-foreground/50"
                />
              </div>
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
            )}

            {/* Payment Methods */}
            {verified && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                <p className="text-sm text-muted-foreground">{t('booking.paymentMethods')}</p>
                <div className="grid grid-cols-2 gap-3">
                  {paymentMethods.map(({ icon: Icon, key }) => (
                    <div key={key} className="flex items-center gap-2 bg-muted rounded-lg px-4 py-3 saffron-border">
                      <Icon className="w-4 h-4 text-primary" />
                      <span className="text-sm text-foreground">{t(`booking.${key}`)}</span>
                    </div>
                  ))}
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handlePayment}
                  className="w-full py-3.5 rounded-lg font-semibold text-sm bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-saffron-glow hover:shadow-saffron-lg transition-cinematic"
                >
                  {t('booking.proceedPayment')}
                </motion.button>
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
