import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Film, BarChart3, Users, MapPin, Ticket, Settings,
  TrendingUp, DollarSign, FileSpreadsheet, FileText
} from 'lucide-react';
import Header from '@/components/Header';

const stats = [
  { key: 'totalSold', value: '12,450', icon: Ticket, trend: '+18%' },
  { key: 'totalRevenue', value: '₹62,25,000', icon: DollarSign, trend: '+24%' },
];

const sidebarItems = [
  { key: 'movies', icon: Film, path: '#' },
  { key: 'bookings', icon: Ticket, path: '#' },
  { key: 'theaters', icon: MapPin, path: '#' },
  { key: 'customers', icon: Users, path: '#' },
  { key: 'analytics', icon: BarChart3, path: '#' },
  { key: 'settings', icon: Settings, path: '#' },
];

const AdminDashboard = () => {
  const { t, i18n } = useTranslation();
  const isKn = i18n.language === 'kn';

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-16 flex">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col w-60 min-h-[calc(100vh-4rem)] bg-card saffron-border p-4">
          <h2 className={`${isKn ? 'font-kannada' : 'font-display'} text-lg text-primary mb-6`}>
            {t('admin.dashboard')}
          </h2>
          <nav className="space-y-1">
            {sidebarItems.map(({ key, icon: Icon }) => (
              <button
                key={key}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-cinematic"
              >
                <Icon className="w-4 h-4" />
                {t(`admin.${key}`)}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 p-6 md:p-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className={`${isKn ? 'font-kannada' : 'font-display'} text-3xl text-foreground`}>
              {t('admin.analytics')}
            </h1>
            <div className="flex gap-2">
              <motion.button whileTap={{ scale: 0.95 }} className="flex items-center gap-2 bg-muted text-sm text-foreground px-4 py-2 rounded-lg hover:bg-muted/80 transition-cinematic">
                <FileSpreadsheet className="w-4 h-4 text-primary" /> {t('admin.exportExcel')}
              </motion.button>
              <motion.button whileTap={{ scale: 0.95 }} className="flex items-center gap-2 bg-muted text-sm text-foreground px-4 py-2 rounded-lg hover:bg-muted/80 transition-cinematic">
                <FileText className="w-4 h-4 text-primary" /> {t('admin.exportPdf')}
              </motion.button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {stats.map(({ key, value, icon: Icon, trend }) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-xl p-5 saffron-border"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{t(`admin.${key}`)}</p>
                    <p className="text-2xl font-semibold text-foreground tabular-nums mt-1">{value}</p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-3 text-xs text-emerald-500">
                  <TrendingUp className="w-3 h-3" /> {trend}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Chart Placeholder */}
          <div className="bg-card rounded-xl p-6 saffron-border">
            <h3 className="text-sm text-muted-foreground mb-4">{t('admin.analytics')}</h3>
            <div className="h-64 flex items-end gap-2 px-4">
              {[40, 65, 45, 80, 55, 90, 70, 85, 60, 75, 95, 50].map((h, i) => (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{ delay: i * 0.05, duration: 0.5 }}
                  className="flex-1 bg-gradient-to-t from-primary to-accent rounded-t-sm"
                />
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            {[
              { key: 'addMovie', icon: Film },
              { key: 'uploadPoster', icon: FileText },
              { key: 'ticketCodes', icon: Ticket },
              { key: 'gallery', icon: Settings },
            ].map(({ key, icon: Icon }) => (
              <motion.button
                key={key}
                whileTap={{ scale: 0.95 }}
                className="bg-card saffron-border rounded-lg p-4 text-center hover:bg-muted transition-cinematic"
              >
                <Icon className="w-5 h-5 text-primary mx-auto" />
                <p className="text-xs text-muted-foreground mt-2">{t(`admin.${key}`)}</p>
              </motion.button>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
