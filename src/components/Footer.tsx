import { useTranslation } from 'react-i18next';
import { Instagram, Youtube, Twitter, Facebook } from 'lucide-react';

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-card saffron-border py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-muted-foreground text-sm">{t('common.copyright')}</p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground mr-2">{t('common.followUs')}</span>
            {[Instagram, Youtube, Twitter, Facebook].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-cinematic"
              >
                <Icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
