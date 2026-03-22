import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ScanLine, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

type Status = 'idle' | 'scanning' | 'valid' | 'invalid' | 'used';

const statusConfig = {
  valid: { icon: CheckCircle, color: 'bg-emerald-500', label: 'qr.valid' },
  invalid: { icon: XCircle, color: 'bg-red-500', label: 'qr.invalid' },
  used: { icon: AlertTriangle, color: 'bg-amber-500', label: 'qr.used' },
};

const QRVerification = () => {
  const { t, i18n } = useTranslation();
  const isKn = i18n.language === 'kn';
  const [status, setStatus] = useState<Status>('idle');

  const simulateScan = (result: 'valid' | 'invalid' | 'used') => {
    setStatus('scanning');
    setTimeout(() => setStatus(result), 1200);
  };

  const config = status !== 'idle' && status !== 'scanning' ? statusConfig[status] : null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-md text-center">
          <h1 className={`${isKn ? 'font-kannada' : 'font-display'} text-4xl text-foreground`}>
            {t('qr.title')}
          </h1>
          <div className="w-16 h-1 bg-primary mt-3 rounded-full mx-auto" />

          {/* Scanner Area */}
          {(status === 'idle' || status === 'scanning') && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="mt-12 aspect-square max-w-[280px] mx-auto rounded-xl bg-muted saffron-border flex items-center justify-center"
            >
              {status === 'scanning' ? (
                <div className="animate-pulse text-primary">
                  <ScanLine className="w-16 h-16" />
                  <p className="text-sm mt-2">{t('qr.scanning')}</p>
                </div>
              ) : (
                <div className="text-muted-foreground">
                  <ScanLine className="w-16 h-16 mx-auto" />
                  <p className="text-sm mt-2">{t('qr.scan')}</p>
                </div>
              )}
            </motion.div>
          )}

          {/* Result */}
          {config && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
              className={`mt-12 ${config.color} rounded-xl p-12`}
            >
              <config.icon className="w-20 h-20 mx-auto text-foreground" />
              <p className={`${isKn ? 'font-kannada' : 'font-display'} text-2xl text-foreground mt-4`}>
                {t(config.label)}
              </p>
            </motion.div>
          )}

          {/* Demo Buttons */}
          <div className="flex gap-3 mt-8 justify-center">
            {(['valid', 'invalid', 'used'] as const).map((s) => (
              <motion.button
                key={s}
                whileTap={{ scale: 0.95 }}
                onClick={() => simulateScan(s)}
                className="px-4 py-2 rounded-lg bg-muted text-sm text-muted-foreground hover:text-foreground transition-cinematic"
              >
                {s.toUpperCase()}
              </motion.button>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default QRVerification;
