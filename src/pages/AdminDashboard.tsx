import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Film, BarChart3, Users, MapPin, Ticket, Settings,
  TrendingUp, DollarSign, FileText, Plus, Upload, Link as LinkIcon,
  Image, Star, X, LogOut, Eye
} from 'lucide-react';
import Header from '@/components/Header';

/* ── Circular Progress ── */
const CircularProgress = ({ value, max, label, color = 'hsl(var(--primary))' }: { value: number; max: number; label: string; color?: string }) => {
  const pct = Math.min((value / max) * 100, 100);
  const r = 40;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="100" height="100" className="-rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
        <motion.circle
          cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeLinecap="round" strokeDasharray={c} initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }} transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      <p className="text-xl font-bold text-foreground tabular-nums">{pct.toFixed(0)}%</p>
      <p className="text-xs text-muted-foreground text-center">{label}</p>
    </div>
  );
};

/* ── Dummy movie data ── */
const demoMovies = [
  { id: '1', title: 'Devaloka', status: 'current', collection: 6225000, target: 10000000, ticketsSold: 12450, theaters: 24 },
  { id: '2', title: 'Kailasa', status: 'upcoming', collection: 0, target: 8000000, ticketsSold: 0, theaters: 0 },
];

const sidebarItems = [
  { key: 'movies', icon: Film },
  { key: 'bookings', icon: Ticket },
  { key: 'theaters', icon: MapPin },
  { key: 'customers', icon: Users },
  { key: 'analytics', icon: BarChart3 },
  { key: 'settings', icon: Settings },
];

type Tab = 'movies' | 'bookings' | 'theaters' | 'customers' | 'analytics' | 'settings';

const AdminDashboard = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isKn = i18n.language === 'kn';
  const [activeTab, setActiveTab] = useState<Tab>('movies');
  const [showAddMovie, setShowAddMovie] = useState(false);

  // Movie form state
  const [movieForm, setMovieForm] = useState({
    title: '', tagline: '', about: '', genre: '', duration: '', releaseDate: '',
    trailerLink: '', bannerImage: '', rating: '',
    cast: [{ name: '', role: '', photo: '' }],
    galleryImages: [''],
  });

  const handleLogout = () => {
    localStorage.removeItem('adminAuth');
    navigate('/login');
  };

  const addCastMember = () => setMovieForm(p => ({ ...p, cast: [...p.cast, { name: '', role: '', photo: '' }] }));
  const removeCastMember = (i: number) => setMovieForm(p => ({ ...p, cast: p.cast.filter((_, idx) => idx !== i) }));
  const updateCast = (i: number, field: string, val: string) => {
    setMovieForm(p => ({ ...p, cast: p.cast.map((c, idx) => idx === i ? { ...c, [field]: val } : c) }));
  };
  const addGallerySlot = () => setMovieForm(p => ({ ...p, galleryImages: [...p.galleryImages, ''] }));
  const updateGallery = (i: number, val: string) => {
    setMovieForm(p => ({ ...p, galleryImages: p.galleryImages.map((g, idx) => idx === i ? val : g) }));
  };

  const handleExportPdf = () => {
    const printContent = document.getElementById('admin-report');
    if (!printContent) return;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<html><head><title>Report</title><style>body{font-family:sans-serif;padding:24px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#FF9933;color:#fff}.stat{display:inline-block;margin:12px;text-align:center}.circle{font-size:28px;font-weight:bold;color:#FF9933}</style></head><body>`);
    w.document.write('<h1>Devaloka Productions — Report</h1><hr/>');
    w.document.write('<h2>Movie Collection Summary</h2><table><tr><th>Movie</th><th>Status</th><th>Tickets Sold</th><th>Collection (₹)</th><th>Target (₹)</th><th>Progress</th></tr>');
    demoMovies.forEach(m => {
      const pct = m.target ? ((m.collection / m.target) * 100).toFixed(1) : '0';
      w.document.write(`<tr><td>${m.title}</td><td>${m.status}</td><td>${m.ticketsSold.toLocaleString()}</td><td>${m.collection.toLocaleString()}</td><td>${m.target.toLocaleString()}</td><td>${pct}%</td></tr>`);
    });
    w.document.write('</table></body></html>');
    w.document.close();
    w.print();
  };

  const inputClass = "w-full bg-muted text-foreground rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-cinematic placeholder:text-muted-foreground/50";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-16 flex">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col w-60 min-h-[calc(100vh-4rem)] bg-card saffron-border p-4 justify-between">
          <div>
            <h2 className={`${isKn ? 'font-kannada' : 'font-display'} text-lg text-primary mb-6`}>
              {t('admin.dashboard')}
            </h2>
            <nav className="space-y-1">
              {sidebarItems.map(({ key, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as Tab)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-cinematic ${activeTab === key ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                >
                  <Icon className="w-4 h-4" />
                  {t(`admin.${key}`)}
                </button>
              ))}
            </nav>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2.5 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-cinematic">
            <LogOut className="w-4 h-4" /> {t('login.logout')}
          </button>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 md:p-8 overflow-auto">
          {/* Mobile tab bar */}
          <div className="md:hidden flex gap-2 overflow-x-auto pb-4 mb-4">
            {sidebarItems.map(({ key, icon: Icon }) => (
              <button key={key} onClick={() => setActiveTab(key as Tab)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs whitespace-nowrap ${activeTab === key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                <Icon className="w-3.5 h-3.5" /> {t(`admin.${key}`)}
              </button>
            ))}
          </div>

          {/* ───── MOVIES TAB ───── */}
          {activeTab === 'movies' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h1 className={`${isKn ? 'font-kannada' : 'font-display'} text-2xl text-foreground`}>{t('admin.movies')}</h1>
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowAddMovie(true)}
                  className="flex items-center gap-2 bg-primary text-primary-foreground text-sm px-4 py-2 rounded-lg hover:bg-primary/90 transition-cinematic">
                  <Plus className="w-4 h-4" /> {t('admin.addMovie')}
                </motion.button>
              </div>

              {/* Movie Cards */}
              <div className="grid gap-4">
                {demoMovies.map(movie => (
                  <motion.div key={movie.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-card rounded-xl p-6 saffron-border">
                    <div className="flex flex-col md:flex-row md:items-center gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-foreground">{movie.title}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${movie.status === 'current' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                            {t(`admin.${movie.status}`)}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">{t('admin.totalSold')}</p>
                            <p className="text-foreground font-semibold tabular-nums">{movie.ticketsSold.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">{t('admin.totalRevenue')}</p>
                            <p className="text-foreground font-semibold tabular-nums">₹{movie.collection.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">{t('admin.theaters')}</p>
                            <p className="text-foreground font-semibold tabular-nums">{movie.theaters}</p>
                          </div>
                        </div>
                      </div>
                      <CircularProgress value={movie.collection} max={movie.target} label={t('admin.collectionTarget')} />
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* ── Add Movie Modal ── */}
              <AnimatePresence>
                {showAddMovie && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center pt-20 px-4 overflow-y-auto">
                    <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }}
                      className="bg-card rounded-2xl saffron-border w-full max-w-2xl p-6 mb-10">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className={`${isKn ? 'font-kannada' : 'font-display'} text-xl text-foreground`}>{t('admin.addMovie')}</h2>
                        <button onClick={() => setShowAddMovie(false)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
                      </div>

                      <div className="space-y-5 max-h-[65vh] overflow-y-auto pr-2">
                        {/* Basic Info */}
                        <div className="space-y-3">
                          <h3 className="text-sm font-medium text-primary flex items-center gap-2"><Film className="w-4 h-4" /> {t('admin.movieDetails')}</h3>
                          <input className={inputClass} placeholder={t('admin.movieTitle')} value={movieForm.title} onChange={e => setMovieForm(p => ({ ...p, title: e.target.value }))} />
                          <input className={inputClass} placeholder={t('admin.movieTagline')} value={movieForm.tagline} onChange={e => setMovieForm(p => ({ ...p, tagline: e.target.value }))} />
                          <textarea className={`${inputClass} min-h-[80px]`} placeholder={t('admin.movieAbout')} value={movieForm.about} onChange={e => setMovieForm(p => ({ ...p, about: e.target.value }))} />
                          <div className="grid grid-cols-2 gap-3">
                            <input className={inputClass} placeholder={t('admin.movieGenre')} value={movieForm.genre} onChange={e => setMovieForm(p => ({ ...p, genre: e.target.value }))} />
                            <input className={inputClass} placeholder={t('admin.movieDuration')} value={movieForm.duration} onChange={e => setMovieForm(p => ({ ...p, duration: e.target.value }))} />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <input type="date" className={inputClass} value={movieForm.releaseDate} onChange={e => setMovieForm(p => ({ ...p, releaseDate: e.target.value }))} />
                            <input className={inputClass} placeholder={t('admin.movieRating')} value={movieForm.rating} onChange={e => setMovieForm(p => ({ ...p, rating: e.target.value }))} />
                          </div>
                        </div>

                        {/* Banner & Trailer */}
                        <div className="space-y-3">
                          <h3 className="text-sm font-medium text-primary flex items-center gap-2"><Upload className="w-4 h-4" /> {t('admin.mediaSection')}</h3>
                          <input className={inputClass} placeholder={t('admin.bannerImageUrl')} value={movieForm.bannerImage} onChange={e => setMovieForm(p => ({ ...p, bannerImage: e.target.value }))} />
                          <input className={inputClass} placeholder={t('admin.trailerLinkUrl')} value={movieForm.trailerLink} onChange={e => setMovieForm(p => ({ ...p, trailerLink: e.target.value }))} />
                        </div>

                        {/* Star Cast */}
                        <div className="space-y-3">
                          <h3 className="text-sm font-medium text-primary flex items-center gap-2"><Star className="w-4 h-4" /> {t('admin.starCast')}</h3>
                          {movieForm.cast.map((c, i) => (
                            <div key={i} className="flex gap-2 items-start">
                              <div className="flex-1 grid grid-cols-3 gap-2">
                                <input className={inputClass} placeholder={t('admin.castName')} value={c.name} onChange={e => updateCast(i, 'name', e.target.value)} />
                                <input className={inputClass} placeholder={t('admin.castRole')} value={c.role} onChange={e => updateCast(i, 'role', e.target.value)} />
                                <input className={inputClass} placeholder={t('admin.castPhoto')} value={c.photo} onChange={e => updateCast(i, 'photo', e.target.value)} />
                              </div>
                              {movieForm.cast.length > 1 && (
                                <button onClick={() => removeCastMember(i)} className="mt-2 text-destructive hover:text-destructive/80"><X className="w-4 h-4" /></button>
                              )}
                            </div>
                          ))}
                          <button onClick={addCastMember} className="text-xs text-primary hover:underline flex items-center gap-1"><Plus className="w-3 h-3" /> {t('admin.addCast')}</button>
                        </div>

                        {/* Gallery */}
                        <div className="space-y-3">
                          <h3 className="text-sm font-medium text-primary flex items-center gap-2"><Image className="w-4 h-4" /> {t('admin.galleryImages')}</h3>
                          {movieForm.galleryImages.map((g, i) => (
                            <input key={i} className={inputClass} placeholder={`${t('admin.imageUrl')} ${i + 1}`} value={g} onChange={e => updateGallery(i, e.target.value)} />
                          ))}
                          <button onClick={addGallerySlot} className="text-xs text-primary hover:underline flex items-center gap-1"><Plus className="w-3 h-3" /> {t('admin.addImage')}</button>
                        </div>
                      </div>

                      <div className="flex gap-3 mt-6">
                        <motion.button whileTap={{ scale: 0.95 }}
                          className="flex-1 py-3 rounded-lg font-semibold text-sm bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-saffron-glow">
                          {t('common.save')}
                        </motion.button>
                        <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowAddMovie(false)}
                          className="px-6 py-3 rounded-lg text-sm bg-muted text-muted-foreground hover:bg-muted/80 transition-cinematic">
                          {t('common.cancel')}
                        </motion.button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* ───── ANALYTICS TAB ───── */}
          {activeTab === 'analytics' && (
            <div id="admin-report">
              <div className="flex items-center justify-between mb-6">
                <h1 className={`${isKn ? 'font-kannada' : 'font-display'} text-2xl text-foreground`}>{t('admin.analytics')}</h1>
                <motion.button whileTap={{ scale: 0.95 }} onClick={handleExportPdf}
                  className="flex items-center gap-2 bg-muted text-sm text-foreground px-4 py-2 rounded-lg hover:bg-muted/80 transition-cinematic">
                  <FileText className="w-4 h-4 text-primary" /> {t('admin.exportPdf')}
                </motion.button>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                  { label: t('admin.totalSold'), value: '12,450', trend: '+18%', icon: Ticket },
                  { label: t('admin.totalRevenue'), value: '₹62,25,000', trend: '+24%', icon: DollarSign },
                  { label: t('admin.theaters'), value: '24', trend: '+4', icon: MapPin },
                  { label: t('admin.customers'), value: '9,820', trend: '+12%', icon: Users },
                ].map(({ label, value, trend, icon: Icon }) => (
                  <motion.div key={label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl p-5 saffron-border">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{label}</p>
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

              {/* Collection Progress Circles */}
              <div className="bg-card rounded-xl p-6 saffron-border mb-6">
                <h3 className="text-sm text-muted-foreground mb-6">{t('admin.collectionProgress')}</h3>
                <div className="flex flex-wrap justify-center gap-10">
                  {demoMovies.map(m => (
                    <CircularProgress key={m.id} value={m.collection} max={m.target} label={m.title} />
                  ))}
                  <CircularProgress value={75} max={100} label={t('admin.occupancy')} color="hsl(var(--accent))" />
                  <CircularProgress value={92} max={100} label={t('admin.satisfaction')} color="hsl(142 76% 36%)" />
                </div>
              </div>

              {/* Bar chart */}
              <div className="bg-card rounded-xl p-6 saffron-border">
                <h3 className="text-sm text-muted-foreground mb-4">{t('admin.monthlyRevenue')}</h3>
                <div className="h-48 flex items-end gap-2 px-4">
                  {[40, 65, 45, 80, 55, 90, 70, 85, 60, 75, 95, 50].map((h, i) => (
                    <motion.div key={i} initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ delay: i * 0.05, duration: 0.5 }}
                      className="flex-1 bg-gradient-to-t from-primary to-accent rounded-t-sm relative group cursor-pointer">
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        ₹{(h * 7000).toLocaleString()}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ───── BOOKINGS TAB ───── */}
          {activeTab === 'bookings' && (
            <div>
              <h1 className={`${isKn ? 'font-kannada' : 'font-display'} text-2xl text-foreground mb-6`}>{t('admin.bookings')}</h1>
              <div className="bg-card rounded-xl saffron-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-4 text-muted-foreground font-medium">ID</th>
                      <th className="text-left p-4 text-muted-foreground font-medium">{t('admin.customers')}</th>
                      <th className="text-left p-4 text-muted-foreground font-medium">{t('admin.movies')}</th>
                      <th className="text-left p-4 text-muted-foreground font-medium">{t('admin.theaters')}</th>
                      <th className="text-left p-4 text-muted-foreground font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { id: 'DVL-001', customer: 'Ramesh K', movie: 'Devaloka', theater: 'PVR Orion', status: 'Confirmed' },
                      { id: 'DVL-002', customer: 'Suresh M', movie: 'Devaloka', theater: 'INOX Mantri', status: 'Confirmed' },
                      { id: 'DVL-003', customer: 'Priya R', movie: 'Devaloka', theater: 'Cinepolis Royal', status: 'Pending' },
                    ].map(b => (
                      <tr key={b.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="p-4 text-primary font-mono text-xs">{b.id}</td>
                        <td className="p-4 text-foreground">{b.customer}</td>
                        <td className="p-4 text-foreground">{b.movie}</td>
                        <td className="p-4 text-muted-foreground">{b.theater}</td>
                        <td className="p-4"><span className={`text-xs px-2 py-0.5 rounded-full ${b.status === 'Confirmed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{b.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ───── THEATERS / CUSTOMERS / SETTINGS ───── */}
          {(activeTab === 'theaters' || activeTab === 'customers' || activeTab === 'settings') && (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <Eye className="w-10 h-10 mb-3 text-primary/40" />
              <p className="text-sm">{t(`admin.${activeTab}`)} — {t('admin.comingSoon')}</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
