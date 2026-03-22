import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Globe, ChevronDown } from 'lucide-react';

const Header = () => {
  const { t, i18n } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const location = useLocation();

  const switchLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setLangOpen(false);
  };

  const navItems = [
    { path: '/', label: t('nav.home') },
    { path: '/booking', label: t('nav.tickets') },
    { path: '/login', label: t('nav.login') },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl saffron-border">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        {/* Logo */}
        <Link to="/" className="font-display text-2xl tracking-wider text-primary">
          {i18n.language === 'kn' ? 'ಜಂಬೂದ್ವೀಪ' : 'JAMBHU DWEEPA'}
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`text-sm font-medium transition-cinematic ${
                isActive(item.path) ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {item.label}
            </Link>
          ))}

          {/* Language Switcher */}
          <div className="relative">
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-cinematic"
            >
              <Globe className="w-4 h-4" />
              <span>{i18n.language === 'kn' ? 'ಕನ್ನಡ' : 'EN'}</span>
              <ChevronDown className="w-3 h-3" />
            </button>
            <AnimatePresence>
              {langOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-8 bg-card saffron-border rounded-md overflow-hidden min-w-[120px]"
                >
                  <button
                    onClick={() => switchLanguage('kn')}
                    className={`block w-full text-left px-4 py-2 text-sm transition-cinematic ${
                      i18n.language === 'kn' ? 'text-primary bg-primary/10' : 'text-foreground hover:bg-muted'
                    }`}
                  >
                    ಕನ್ನಡ
                  </button>
                  <button
                    onClick={() => switchLanguage('en')}
                    className={`block w-full text-left px-4 py-2 text-sm transition-cinematic ${
                      i18n.language === 'en' ? 'text-primary bg-primary/10' : 'text-foreground hover:bg-muted'
                    }`}
                  >
                    English
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Link to="/booking">
            <motion.button
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-primary to-accent text-primary-foreground px-5 py-2 rounded-md text-sm font-semibold shadow-saffron-glow hover:shadow-saffron-lg transition-cinematic"
            >
              {t('nav.buyTickets')}
            </motion.button>
          </Link>
        </nav>

        {/* Mobile Toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden text-foreground"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-card saffron-border overflow-hidden"
          >
            <div className="px-4 py-4 space-y-3">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`block py-2 text-sm font-medium ${
                    isActive(item.path) ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <div className="flex gap-3 py-2">
                <button
                  onClick={() => switchLanguage('kn')}
                  className={`text-sm px-3 py-1 rounded ${
                    i18n.language === 'kn' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  ಕನ್ನಡ
                </button>
                <button
                  onClick={() => switchLanguage('en')}
                  className={`text-sm px-3 py-1 rounded ${
                    i18n.language === 'en' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  English
                </button>
              </div>
              <Link to="/booking" onClick={() => setMobileOpen(false)}>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground py-2.5 rounded-md text-sm font-semibold shadow-saffron-glow"
                >
                  {t('nav.buyTickets')}
                </motion.button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
