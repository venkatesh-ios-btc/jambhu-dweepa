import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { User, Smartphone, KeyRound } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const LoginPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isKn = i18n.language === 'kn';
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [accessCode, setAccessCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Demo: ADMIN123 = admin, anything else = user
    if (accessCode === 'ADMIN123') {
      navigate('/admin');
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-md">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className={`${isKn ? 'font-kannada' : 'font-display'} text-4xl text-foreground`}>
              {t('login.title')}
            </h1>
            <div className="w-16 h-1 bg-primary mt-3 rounded-full" />
          </motion.div>

          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-10 space-y-5"
          >
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">{t('login.name')}</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  value={name} onChange={e => setName(e.target.value)}
                  placeholder={t('login.enterName')}
                  className="w-full bg-muted text-foreground rounded-lg pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-cinematic placeholder:text-muted-foreground/50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">{t('login.mobile')}</label>
              <div className="relative">
                <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  value={mobile} onChange={e => setMobile(e.target.value)}
                  placeholder={t('login.enterMobile')}
                  className="w-full bg-muted text-foreground rounded-lg pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-cinematic placeholder:text-muted-foreground/50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">{t('login.accessCode')}</label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  value={accessCode} onChange={e => setAccessCode(e.target.value)}
                  placeholder={t('login.enterCode')}
                  className="w-full bg-muted text-foreground rounded-lg pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-cinematic placeholder:text-muted-foreground/50"
                />
              </div>
            </div>

            <motion.button
              type="submit"
              whileTap={{ scale: 0.95 }}
              className="w-full py-3.5 rounded-lg font-semibold text-sm bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-saffron-glow hover:shadow-saffron-lg transition-cinematic"
            >
              {t('login.submit')}
            </motion.button>
          </motion.form>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default LoginPage;
