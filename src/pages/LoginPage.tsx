import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { User, Lock, AlertCircle } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin@123';

const LoginPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isKn = i18n.language === 'kn';
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      localStorage.setItem('adminAuth', 'true');
      const next = searchParams.get('next');
      if (next && next.startsWith('/')) {
        navigate(next);
      } else {
        navigate('/admin');
      }
    } else {
      setError(t('login.invalidCredentials'));
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
            {error && (
              <div className="flex items-center gap-2 bg-destructive/10 text-destructive rounded-lg px-4 py-3 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">{t('login.username')}</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  value={username} onChange={e => setUsername(e.target.value)}
                  placeholder={t('login.enterUsername')}
                  className="w-full bg-muted text-foreground rounded-lg pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-cinematic placeholder:text-muted-foreground/50"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">{t('login.password')}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="password"
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder={t('login.enterPassword')}
                  className="w-full bg-muted text-foreground rounded-lg pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-cinematic placeholder:text-muted-foreground/50"
                  required
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

            <div className="bg-muted/50 rounded-lg p-4 mt-4">
              <p className="text-xs text-muted-foreground text-center">
                {t('login.adminHint')}<br />
                <span className="text-primary font-mono">admin</span> / <span className="text-primary font-mono">admin@123</span>
              </p>
            </div>
          </motion.form>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default LoginPage;
