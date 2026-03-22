import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { CheckCircle, Download, Eye } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const PaymentSuccess = () => {
  const { t, i18n } = useTranslation();
  const isKn = i18n.language === 'kn';
  const bookingId = 'DVK-2026-' + Math.random().toString(36).substring(2, 8).toUpperCase();

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

          {/* Digital Ticket */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-8 bg-card rounded-xl overflow-hidden saffron-border"
          >
            {/* Top */}
            <div className="bg-gradient-to-r from-primary to-accent p-5">
              <h2 className={`${isKn ? 'font-kannada text-2xl' : 'font-display text-3xl'} text-primary-foreground`}>
                {isKn ? 'ಜಂಬೂದ್ವೀಪ' : 'JAMBHU DWEEPA'}
              </h2>
              <p className="text-primary-foreground/80 text-sm mt-1">PVR Orion Mall, Bangalore</p>
            </div>

            {/* Perforated edge */}
            <div className="relative h-4 bg-card">
              <div className="absolute inset-x-0 top-0 flex justify-between px-[-8px]">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div key={i} className="w-2 h-4 bg-background rounded-b-full" />
                ))}
              </div>
            </div>

            {/* QR Code Placeholder */}
            <div className="p-5 flex flex-col items-center">
              <div className="w-40 h-40 bg-foreground rounded-md flex items-center justify-center">
                <div className="w-36 h-36 bg-background rounded-sm grid grid-cols-6 gap-0.5 p-2">
                  {Array.from({ length: 36 }).map((_, i) => (
                    <div key={i} className={`rounded-sm ${Math.random() > 0.4 ? 'bg-foreground' : 'bg-background'}`} />
                  ))}
                </div>
              </div>

              <div className="mt-5 w-full space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('payment.bookingId')}</span>
                  <span className="text-foreground tabular-nums font-mono">{bookingId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('payment.theater')}</span>
                  <span className="text-foreground">PVR Orion Mall</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('payment.dateTime')}</span>
                  <span className="text-foreground tabular-nums">28 Mar 2026, 7:00 PM</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <motion.button
              whileTap={{ scale: 0.95 }}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold text-sm shadow-saffron-glow"
            >
              <Download className="w-4 h-4" /> {t('payment.downloadPdf')}
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border-2 border-primary/50 text-primary font-medium text-sm hover:bg-primary/10 transition-cinematic"
            >
              <Eye className="w-4 h-4" /> {t('payment.viewTicket')}
            </motion.button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PaymentSuccess;
