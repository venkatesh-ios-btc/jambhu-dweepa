import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Film, BarChart3, Users, MapPin, Ticket, Settings,
  TrendingUp, DollarSign, FileText, Plus, Upload,
  Image, Star, X, LogOut, Eye, Download, ScanLine, QrCode, ClipboardList,
} from 'lucide-react';
import Header from '@/components/Header';
import { getApiBase } from '@/lib/apiBase';
import { TicketQrThumb } from '@/components/TicketQrThumb';

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
        <motion.circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeLinecap="round" strokeDasharray={c} initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }} transition={{ duration: 1, ease: 'easeOut' }} />
      </svg>
      <p className="text-xl font-bold text-foreground tabular-nums">{pct.toFixed(0)}%</p>
      <p className="text-xs text-muted-foreground text-center">{label}</p>
    </div>
  );
};

const demoMovies = [
  { id: '1', title: 'Devaloka', status: 'current', collection: 6225000, target: 10000000, ticketsSold: 12450, theaters: 24 },
  { id: '2', title: 'Kailasa', status: 'upcoming', collection: 0, target: 8000000, ticketsSold: 0, theaters: 0 },
];

const demoTheaters = [
  { name: 'PVR Orion', location: 'Rajajinagar', screens: 4, capacity: 1200 },
  { name: 'INOX Mantri', location: 'Malleshwaram', screens: 3, capacity: 900 },
  { name: 'Cinepolis Royal', location: 'JP Nagar', screens: 5, capacity: 1500 },
];

const sidebarItems = [
  { key: 'movies', icon: Film },
  { key: 'bookings', icon: Ticket },
  { key: 'digitalTickets', icon: QrCode },
  { key: 'ticketDetails', icon: ClipboardList },
  { key: 'verify', icon: ScanLine },
  { key: 'theaters', icon: MapPin },
  { key: 'customers', icon: Users },
  { key: 'analytics', icon: BarChart3 },
  { key: 'settings', icon: Settings },
];

type Tab =
  | 'movies'
  | 'bookings'
  | 'digitalTickets'
  | 'ticketDetails'
  | 'verify'
  | 'theaters'
  | 'customers'
  | 'analytics'
  | 'settings';

type PaidTicketRow = {
  code: string;
  customerMobile: string;
  customerArea: string;
  razorpayPaymentId: string;
  paidAt: string | null;
  entryVerifiedAt: string | null;
  pdfDownloadedAt: string | null;
  qrTokenSuffix: string;
  qrToken: string | null;
};

/* ── Export Helpers ── */
const exportTableAsXls = (title: string, headers: string[], rows: string[][]) => {
  let html = `<html><head><meta charset="utf-8"></head><body><h2>${title}</h2><table border="1"><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>`;
  rows.forEach(r => { html += `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`; });
  html += '</table></body></html>';
  const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${title.replace(/\s+/g, '_')}.xls`;
  a.click();
};

const exportTableAsPdf = (title: string, headers: string[], rows: string[][]) => {
  const w = window.open('', '_blank');
  if (!w) return;
  w.document.write(`<html><head><title>${title}</title><style>body{font-family:sans-serif;padding:24px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#FF9933;color:#fff}h1{color:#FF9933}</style></head><body>`);
  w.document.write(`<h1>${title}</h1><table><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>`);
  rows.forEach(r => { w.document.write(`<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`); });
  w.document.write('</table></body></html>');
  w.document.close();
  w.print();
};

const ExportButtons = ({ onExportXls, onExportPdf }: { onExportXls: () => void; onExportPdf: () => void }) => {
  const { t } = useTranslation();
  return (
    <div className="flex gap-2">
      <motion.button whileTap={{ scale: 0.95 }} onClick={onExportXls}
        className="flex items-center gap-2 bg-muted text-sm text-foreground px-3 py-2 rounded-lg hover:bg-muted/80 transition-cinematic">
        <Download className="w-4 h-4 text-primary" /> {t('admin.exportExcel')}
      </motion.button>
      <motion.button whileTap={{ scale: 0.95 }} onClick={onExportPdf}
        className="flex items-center gap-2 bg-muted text-sm text-foreground px-3 py-2 rounded-lg hover:bg-muted/80 transition-cinematic">
        <FileText className="w-4 h-4 text-primary" /> {t('admin.exportPdf')}
      </motion.button>
    </div>
  );
};

const VALID_ADMIN_TABS: Tab[] = [
  'movies', 'bookings', 'digitalTickets', 'ticketDetails', 'verify', 'theaters', 'customers', 'analytics', 'settings',
];

type TicketDetailRow = {
  id: string;
  type: 'individual' | 'bulk';
  ticketNumber?: string;
  startTicketNumber?: string;
  endTicketNumber?: string;
  ticketCount?: number | null;
  holderName: string;
  entryDate: string;
  createdAt?: string;
};

function stripJdPrefix(s: string) {
  return s.replace(/^\s*JD-?/i, '').trim();
}

function parseNumericTicketRange(start: string, end: string): { count: number } | null {
  const a = stripJdPrefix(start);
  const b = stripJdPrefix(end);
  const n1 = Number.parseInt(a, 10);
  const n2 = Number.parseInt(b, 10);
  if (!Number.isFinite(n1) || !Number.isFinite(n2) || String(n1) !== a || String(n2) !== b) return null;
  if (n2 < n1) return null;
  return { count: n2 - n1 + 1 };
}

const AdminDashboard = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const isKn = i18n.language === 'kn';
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    const tab = (location.state as { activeTab?: Tab } | null)?.activeTab;
    if (tab && VALID_ADMIN_TABS.includes(tab)) return tab;
    return 'movies';
  });
  const [showAddMovie, setShowAddMovie] = useState(false);
  const [paidTickets, setPaidTickets] = useState<PaidTicketRow[]>([]);
  const [paidTicketsError, setPaidTicketsError] = useState('');
  const [bookingsLoading, setBookingsLoading] = useState(false);

  const [ticketDetailRows, setTicketDetailRows] = useState<TicketDetailRow[]>([]);
  const [ticketDetailsLoading, setTicketDetailsLoading] = useState(false);
  const [ticketDetailsError, setTicketDetailsError] = useState('');
  const [individualTicketForm, setIndividualTicketForm] = useState({ ticketNumber: '', holderName: '', entryDate: '' });
  const [bulkTicketForm, setBulkTicketForm] = useState({
    start: '', end: '', count: '', holderName: '', entryDate: '',
  });
  const [individualSaving, setIndividualSaving] = useState(false);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [ticketDetailsMessage, setTicketDetailsMessage] = useState('');

  const [movieForm, setMovieForm] = useState({
    title: '', tagline: '', about: '', genre: '', duration: '', releaseDate: '',
    trailerLink: '', bannerImage: '', rating: '',
    cast: [{ name: '', role: '', photo: '' }],
    galleryImages: [''],
  });

  const handleLogout = () => { localStorage.removeItem('adminAuth'); navigate('/login'); };

  const appOrigin = typeof window !== 'undefined' ? window.location.origin : '';

  useEffect(() => {
    if (activeTab !== 'bookings' && activeTab !== 'digitalTickets') return;
    setPaidTicketsError('');
    setBookingsLoading(true);
    const api = getApiBase();
    fetch(`${api}/admin/paid-tickets`)
      .then(async (r) => {
        const data = (await r.json()) as { tickets?: PaidTicketRow[]; error?: string };
        if (!r.ok) throw new Error(data.error || 'fetch_failed');
        setPaidTickets(data.tickets || []);
      })
      .catch(() => {
        setPaidTickets([]);
        setPaidTicketsError(t('admin.bookingsLoadError'));
      })
      .finally(() => setBookingsLoading(false));
  }, [activeTab, t]);

  useEffect(() => {
    if (activeTab !== 'ticketDetails') return;
    setTicketDetailsError('');
    setTicketDetailsLoading(true);
    const api = getApiBase();
    fetch(`${api}/admin/ticket-details`)
      .then(async (r) => {
        const data = (await r.json()) as { entries?: TicketDetailRow[]; error?: string };
        if (!r.ok) throw new Error(data.error || 'fetch_failed');
        setTicketDetailRows(data.entries || []);
      })
      .catch(() => {
        setTicketDetailRows([]);
        setTicketDetailsError(t('admin.ticketDetailsLoadError'));
      })
      .finally(() => setTicketDetailsLoading(false));
  }, [activeTab, t]);

  const refreshTicketDetails = () => {
    const api = getApiBase();
    fetch(`${api}/admin/ticket-details`)
      .then(async (r) => {
        const data = (await r.json()) as { entries?: TicketDetailRow[]; error?: string };
        if (!r.ok) throw new Error(data.error || 'fetch_failed');
        setTicketDetailRows(data.entries || []);
      })
      .catch(() => {
        setTicketDetailsError(t('admin.ticketDetailsLoadError'));
      });
  };

  const saveIndividualTicketDetails = (e: React.FormEvent) => {
    e.preventDefault();
    setTicketDetailsMessage('');
    const ticketNumber = stripJdPrefix(individualTicketForm.ticketNumber);
    if (!ticketNumber || !individualTicketForm.holderName.trim() || !individualTicketForm.entryDate) {
      setTicketDetailsMessage(t('admin.ticketDetailsSaveError'));
      return;
    }
    setIndividualSaving(true);
    const api = getApiBase();
    fetch(`${api}/admin/ticket-details`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'individual',
        ticketNumber,
        holderName: individualTicketForm.holderName.trim(),
        entryDate: individualTicketForm.entryDate,
      }),
    })
      .then(async (r) => {
        const data = (await r.json()) as { ok?: boolean; error?: string };
        if (!r.ok) {
          if (data.error === 'duplicate_code') {
            setTicketDetailsMessage(t('admin.ticketDetailsDuplicateCode'));
            return;
          }
          throw new Error(data.error || 'save_failed');
        }
        setIndividualTicketForm({ ticketNumber: '', holderName: '', entryDate: '' });
        setTicketDetailsMessage(t('admin.ticketDetailsSaved'));
        refreshTicketDetails();
      })
      .catch(() => setTicketDetailsMessage(t('admin.ticketDetailsSaveError')))
      .finally(() => setIndividualSaving(false));
  };

  const saveBulkTicketDetails = (e: React.FormEvent) => {
    e.preventDefault();
    setTicketDetailsMessage('');
    const range = parseNumericTicketRange(bulkTicketForm.start, bulkTicketForm.end);
    let ticketCount: number | undefined;
    if (range) {
      ticketCount = range.count;
    } else {
      const c = Number.parseInt(String(bulkTicketForm.count).trim(), 10);
      if (!Number.isFinite(c) || c < 1) {
        setTicketDetailsMessage(t('admin.ticketDetailsSaveError'));
        return;
      }
      ticketCount = c;
    }
    if (!bulkTicketForm.holderName.trim() || !bulkTicketForm.entryDate) {
      setTicketDetailsMessage(t('admin.ticketDetailsSaveError'));
      return;
    }
    if (range && bulkTicketForm.count.trim()) {
      const manual = Number.parseInt(bulkTicketForm.count.trim(), 10);
      if (Number.isFinite(manual) && manual !== range.count) {
        setTicketDetailsMessage(t('admin.ticketDetailsCountMismatch'));
        return;
      }
    }
    setBulkSaving(true);
    const api = getApiBase();
    fetch(`${api}/admin/ticket-details`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'bulk',
        startTicketNumber: stripJdPrefix(bulkTicketForm.start),
        endTicketNumber: stripJdPrefix(bulkTicketForm.end),
        ticketCount,
        holderName: bulkTicketForm.holderName.trim(),
        entryDate: bulkTicketForm.entryDate,
      }),
    })
      .then(async (r) => {
        const data = (await r.json()) as { ok?: boolean; error?: string; expected?: number };
        if (!r.ok) {
          if (data.error === 'invalid_range') throw new Error('invalid_range');
          if (data.error === 'count_mismatch') throw new Error('count_mismatch');
          if (data.error === 'duplicate_code') {
            setTicketDetailsMessage(t('admin.ticketDetailsDuplicateCode'));
            return;
          }
          if (data.error === 'duplicate_codes') {
            setTicketDetailsMessage(t('admin.ticketDetailsDuplicateCodes'));
            return;
          }
          throw new Error(data.error || 'save_failed');
        }
        setBulkTicketForm({ start: '', end: '', count: '', holderName: '', entryDate: '' });
        setTicketDetailsMessage(t('admin.ticketDetailsSaved'));
        refreshTicketDetails();
      })
      .catch((err) => {
        if (err?.message === 'invalid_range') setTicketDetailsMessage(t('admin.ticketDetailsInvalidRange'));
        else if (err?.message === 'count_mismatch') setTicketDetailsMessage(t('admin.ticketDetailsCountMismatch'));
        else setTicketDetailsMessage(t('admin.ticketDetailsSaveError'));
      })
      .finally(() => setBulkSaving(false));
  };

  const bulkRangePreview = parseNumericTicketRange(bulkTicketForm.start, bulkTicketForm.end);

  useEffect(() => {
    if (activeTab !== 'ticketDetails') return;
    const r = parseNumericTicketRange(bulkTicketForm.start, bulkTicketForm.end);
    if (r) setBulkTicketForm((p) => ({ ...p, count: String(r.count) }));
  }, [activeTab, bulkTicketForm.start, bulkTicketForm.end]);

  const addCastMember = () => setMovieForm(p => ({ ...p, cast: [...p.cast, { name: '', role: '', photo: '' }] }));
  const removeCastMember = (i: number) => setMovieForm(p => ({ ...p, cast: p.cast.filter((_, idx) => idx !== i) }));
  const updateCast = (i: number, field: string, val: string) => {
    setMovieForm(p => ({ ...p, cast: p.cast.map((c, idx) => idx === i ? { ...c, [field]: val } : c) }));
  };
  const addGallerySlot = () => setMovieForm(p => ({ ...p, galleryImages: [...p.galleryImages, ''] }));
  const updateGallery = (i: number, val: string) => {
    setMovieForm(p => ({ ...p, galleryImages: p.galleryImages.map((g, idx) => idx === i ? val : g) }));
  };

  const movieHeaders = ['Movie', 'Status', 'Tickets Sold', 'Collection (₹)', 'Target (₹)', 'Progress'];
  const movieRows = demoMovies.map(m => [m.title, m.status, m.ticketsSold.toLocaleString(), m.collection.toLocaleString(), m.target.toLocaleString(), `${m.target ? ((m.collection / m.target) * 100).toFixed(1) : 0}%`]);
  const bookingHeaders = [
    t('admin.ticketCodeCol'),
    t('booking.mobile'),
    t('booking.area'),
    t('admin.paymentIdCol'),
    t('admin.paidAt'),
    t('admin.verifiedAt'),
    t('admin.pdfSaved'),
  ];
  const fmt = (iso: string | null) =>
    iso ? new Date(iso).toLocaleString(isKn ? 'en-IN' : undefined) : '—';
  const bookingRows = paidTickets.map((b) => [
    `JD-${b.code}`,
    b.customerMobile,
    b.customerArea,
    b.razorpayPaymentId,
    fmt(b.paidAt),
    b.entryVerifiedAt ? fmt(b.entryVerifiedAt) : t('admin.gatePending'),
    b.pdfDownloadedAt ? fmt(b.pdfDownloadedAt) : t('admin.pdfNotSaved'),
  ]);
  const theaterHeaders = ['Theater', 'Location', 'Screens', 'Capacity'];
  const theaterRows = demoTheaters.map(th => [th.name, th.location, String(th.screens), String(th.capacity)]);
  const analyticsHeaders = ['Metric', 'Value', 'Trend'];
  const analyticsRows = [['Total Sold', '12,450', '+18%'], ['Total Revenue', '₹62,25,000', '+24%'], ['Theaters', '24', '+4'], ['Customers', '9,820', '+12%']];

  const statusColors: Record<string, string> = {
    confirmed: 'bg-emerald-500/20 text-emerald-400',
    pending: 'bg-yellow-500/20 text-yellow-400',
    cancelled: 'bg-destructive/20 text-destructive',
    notValid: 'bg-muted text-muted-foreground',
  };

  const inputClass = "w-full bg-muted text-foreground rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-cinematic placeholder:text-muted-foreground/50";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-16 flex">
        <aside className="hidden md:flex flex-col w-60 min-h-[calc(100vh-4rem)] bg-card saffron-border p-4 justify-between">
          <div>
            <h2 className={`${isKn ? 'font-kannada' : 'font-display'} text-lg text-primary mb-6`}>{t('admin.dashboard')}</h2>
            <nav className="space-y-1">
              {sidebarItems.map(({ key, icon: Icon }) => (
                <button key={key} onClick={() => setActiveTab(key as Tab)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-cinematic ${activeTab === key ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}>
                  <Icon className="w-4 h-4" /> {t(`admin.${key}`)}
                </button>
              ))}
            </nav>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2.5 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-cinematic">
            <LogOut className="w-4 h-4" /> {t('login.logout')}
          </button>
        </aside>

        <main className="flex-1 p-6 md:p-8 overflow-auto">
          <div className="md:hidden flex gap-2 overflow-x-auto pb-4 mb-4">
            {sidebarItems.map(({ key, icon: Icon }) => (
              <button key={key} onClick={() => setActiveTab(key as Tab)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs whitespace-nowrap ${activeTab === key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                <Icon className="w-3.5 h-3.5" /> {t(`admin.${key}`)}
              </button>
            ))}
          </div>

          {/* ───── MOVIES ───── */}
          {activeTab === 'movies' && (
            <div>
              <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <h1 className={`${isKn ? 'font-kannada' : 'font-display'} text-2xl text-foreground`}>{t('admin.movies')}</h1>
                <div className="flex gap-2 flex-wrap">
                  <ExportButtons onExportXls={() => exportTableAsXls('Movies', movieHeaders, movieRows)} onExportPdf={() => exportTableAsPdf('Movies', movieHeaders, movieRows)} />
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowAddMovie(true)}
                    className="flex items-center gap-2 bg-primary text-primary-foreground text-sm px-4 py-2 rounded-lg hover:bg-primary/90 transition-cinematic">
                    <Plus className="w-4 h-4" /> {t('admin.addMovie')}
                  </motion.button>
                </div>
              </div>

              <div className="grid gap-4">
                {demoMovies.map(movie => (
                  <motion.div key={movie.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl p-6 saffron-border">
                    <div className="flex flex-col md:flex-row md:items-center gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-foreground">{movie.title}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${movie.status === 'current' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>{t(`admin.${movie.status}`)}</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4 text-sm">
                          <div><p className="text-muted-foreground">{t('admin.totalSold')}</p><p className="text-foreground font-semibold tabular-nums">{movie.ticketsSold.toLocaleString()}</p></div>
                          <div><p className="text-muted-foreground">{t('admin.totalRevenue')}</p><p className="text-foreground font-semibold tabular-nums">₹{movie.collection.toLocaleString()}</p></div>
                          <div><p className="text-muted-foreground">{t('admin.theaters')}</p><p className="text-foreground font-semibold tabular-nums">{movie.theaters}</p></div>
                        </div>
                      </div>
                      <CircularProgress value={movie.collection} max={movie.target} label={t('admin.collectionTarget')} />
                    </div>
                  </motion.div>
                ))}
              </div>

              <AnimatePresence>
                {showAddMovie && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center pt-20 px-4 overflow-y-auto">
                    <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }} className="bg-card rounded-2xl saffron-border w-full max-w-2xl p-6 mb-10">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className={`${isKn ? 'font-kannada' : 'font-display'} text-xl text-foreground`}>{t('admin.addMovie')}</h2>
                        <button onClick={() => setShowAddMovie(false)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
                      </div>
                      <div className="space-y-5 max-h-[65vh] overflow-y-auto pr-2">
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
                        <div className="space-y-3">
                          <h3 className="text-sm font-medium text-primary flex items-center gap-2"><Upload className="w-4 h-4" /> {t('admin.mediaSection')}</h3>
                          <input className={inputClass} placeholder={t('admin.bannerImageUrl')} value={movieForm.bannerImage} onChange={e => setMovieForm(p => ({ ...p, bannerImage: e.target.value }))} />
                          <input className={inputClass} placeholder={t('admin.trailerLinkUrl')} value={movieForm.trailerLink} onChange={e => setMovieForm(p => ({ ...p, trailerLink: e.target.value }))} />
                        </div>
                        <div className="space-y-3">
                          <h3 className="text-sm font-medium text-primary flex items-center gap-2"><Star className="w-4 h-4" /> {t('admin.starCast')}</h3>
                          {movieForm.cast.map((c, i) => (
                            <div key={i} className="flex gap-2 items-start">
                              <div className="flex-1 grid grid-cols-3 gap-2">
                                <input className={inputClass} placeholder={t('admin.castName')} value={c.name} onChange={e => updateCast(i, 'name', e.target.value)} />
                                <input className={inputClass} placeholder={t('admin.castRole')} value={c.role} onChange={e => updateCast(i, 'role', e.target.value)} />
                                <input className={inputClass} placeholder={t('admin.castPhoto')} value={c.photo} onChange={e => updateCast(i, 'photo', e.target.value)} />
                              </div>
                              {movieForm.cast.length > 1 && <button onClick={() => removeCastMember(i)} className="mt-2 text-destructive hover:text-destructive/80"><X className="w-4 h-4" /></button>}
                            </div>
                          ))}
                          <button onClick={addCastMember} className="text-xs text-primary hover:underline flex items-center gap-1"><Plus className="w-3 h-3" /> {t('admin.addCast')}</button>
                        </div>
                        <div className="space-y-3">
                          <h3 className="text-sm font-medium text-primary flex items-center gap-2"><Image className="w-4 h-4" /> {t('admin.galleryImages')}</h3>
                          {movieForm.galleryImages.map((g, i) => (
                            <input key={i} className={inputClass} placeholder={`${t('admin.imageUrl')} ${i + 1}`} value={g} onChange={e => updateGallery(i, e.target.value)} />
                          ))}
                          <button onClick={addGallerySlot} className="text-xs text-primary hover:underline flex items-center gap-1"><Plus className="w-3 h-3" /> {t('admin.addImage')}</button>
                        </div>
                      </div>
                      <div className="flex gap-3 mt-6">
                        <motion.button whileTap={{ scale: 0.95 }} className="flex-1 py-3 rounded-lg font-semibold text-sm bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-saffron-glow">{t('common.save')}</motion.button>
                        <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowAddMovie(false)} className="px-6 py-3 rounded-lg text-sm bg-muted text-muted-foreground hover:bg-muted/80 transition-cinematic">{t('common.cancel')}</motion.button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* ───── BOOKINGS ───── */}
          {activeTab === 'bookings' && (
            <div>
              <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <h1 className={`${isKn ? 'font-kannada' : 'font-display'} text-2xl text-foreground`}>{t('admin.bookings')}</h1>
                <div className="flex gap-2 flex-wrap items-center">
                  <Link
                    to="/admin/scan"
                    className="flex items-center gap-2 bg-primary text-primary-foreground text-sm px-4 py-2 rounded-lg hover:bg-primary/90 transition-cinematic"
                  >
                    <ScanLine className="w-4 h-4" /> {t('admin.openScanner')}
                  </Link>
                  <ExportButtons
                    onExportXls={() => exportTableAsXls('Bookings', bookingHeaders, bookingRows)}
                    onExportPdf={() => exportTableAsPdf('Bookings', bookingHeaders, bookingRows)}
                  />
                </div>
              </div>
              {paidTicketsError ? (
                <p className="text-sm text-destructive mb-4">{paidTicketsError}</p>
              ) : null}
              <div className="bg-card rounded-xl saffron-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-4 text-muted-foreground font-medium">{t('admin.ticketCodeCol')}</th>
                        <th className="text-left p-4 text-muted-foreground font-medium">{t('booking.mobile')}</th>
                        <th className="text-left p-4 text-muted-foreground font-medium">{t('booking.area')}</th>
                        <th className="text-left p-4 text-muted-foreground font-medium">{t('admin.paymentIdCol')}</th>
                        <th className="text-left p-4 text-muted-foreground font-medium">{t('admin.paidAt')}</th>
                        <th className="text-left p-4 text-muted-foreground font-medium">{t('admin.status')}</th>
                        <th className="text-left p-4 text-muted-foreground font-medium">{t('admin.pdfSaved')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookingsLoading ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-muted-foreground text-sm">
                            {t('common.loading')}
                          </td>
                        </tr>
                      ) : null}
                      {!bookingsLoading && paidTickets.length === 0 && !paidTicketsError ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-muted-foreground text-sm">
                            {t('admin.noPaidBookings')}
                          </td>
                        </tr>
                      ) : null}
                      {paidTickets.map((b) => (
                        <tr key={b.code} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                          <td className="p-4 text-primary font-mono text-xs">JD-{b.code}</td>
                          <td className="p-4 text-foreground">{b.customerMobile}</td>
                          <td className="p-4 text-muted-foreground">{b.customerArea}</td>
                          <td className="p-4 text-xs font-mono text-muted-foreground break-all max-w-[140px]">
                            {b.razorpayPaymentId}
                          </td>
                          <td className="p-4 text-muted-foreground tabular-nums whitespace-nowrap">{fmt(b.paidAt)}</td>
                          <td className="p-4">
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                b.entryVerifiedAt ? statusColors.confirmed : statusColors.pending
                              }`}
                            >
                              {b.entryVerifiedAt ? t('admin.gateVerified') : t('admin.gatePending')}
                            </span>
                          </td>
                          <td className="p-4 text-muted-foreground text-xs tabular-nums whitespace-nowrap">
                            {b.pdfDownloadedAt ? fmt(b.pdfDownloadedAt) : t('admin.pdfNotSaved')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'digitalTickets' && (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h1 className={`${isKn ? 'font-kannada' : 'font-display'} text-2xl text-foreground`}>
                    {t('admin.digitalTickets')}
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">{t('admin.digitalTicketsHint')}</p>
                </div>
                <Link
                  to="/admin/scan"
                  className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground text-sm px-4 py-2 rounded-lg hover:bg-primary/90 transition-cinematic shrink-0"
                >
                  <ScanLine className="w-4 h-4" /> {t('admin.openScanner')}
                </Link>
              </div>
              {paidTicketsError ? (
                <p className="text-sm text-destructive mb-4">{paidTicketsError}</p>
              ) : null}
              {bookingsLoading ? (
                <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {paidTickets.map((b) => {
                    const verifyUrl =
                      b.qrToken && appOrigin
                        ? `${appOrigin}/admin/scan?t=${encodeURIComponent(b.qrToken)}`
                        : '';
                    return (
                      <div
                        key={b.code}
                        className="bg-card rounded-xl saffron-border p-4 flex flex-col sm:flex-row gap-4"
                      >
                        <div className="shrink-0 flex justify-center sm:block">
                          {verifyUrl ? (
                            <TicketQrThumb verifyUrl={verifyUrl} size={112} />
                          ) : (
                            <div className="w-28 h-28 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground text-center px-2">
                              {t('admin.noQrYet')}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 space-y-1.5 text-sm">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="font-mono text-primary text-xs">JD-{b.code}</span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                b.entryVerifiedAt ? statusColors.confirmed : statusColors.pending
                              }`}
                            >
                              {b.entryVerifiedAt ? t('admin.gateVerified') : t('admin.gatePending')}
                            </span>
                          </div>
                          <p>
                            <span className="text-muted-foreground">{t('booking.mobile')}: </span>
                            <span className="text-foreground">{b.customerMobile}</span>
                          </p>
                          <p>
                            <span className="text-muted-foreground">{t('booking.area')}: </span>
                            <span className="text-foreground">{b.customerArea}</span>
                          </p>
                          <p className="text-xs text-muted-foreground break-all">
                            {t('admin.paymentIdCol')}: {b.razorpayPaymentId}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {t('admin.paidAt')}: {fmt(b.paidAt)}
                          </p>
                          {b.entryVerifiedAt ? (
                            <p className="text-xs text-emerald-500/90">
                              {t('admin.verifiedAt')}: {fmt(b.entryVerifiedAt)}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {!bookingsLoading && paidTickets.length === 0 && !paidTicketsError ? (
                <p className="text-sm text-muted-foreground">{t('admin.noPaidBookings')}</p>
              ) : null}
            </div>
          )}

          {activeTab === 'ticketDetails' && (
            <div className="space-y-8">
              <div>
                <h1 className={`${isKn ? 'font-kannada' : 'font-display'} text-2xl text-foreground`}>
                  {t('admin.ticketDetails')}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">{t('admin.ticketDetailsHint')}</p>
              </div>

              {ticketDetailsMessage ? (
                <p
                  className={`text-sm ${
                    ticketDetailsMessage === t('admin.ticketDetailsSaved')
                      ? 'text-emerald-500'
                      : 'text-destructive'
                  }`}
                >
                  {ticketDetailsMessage}
                </p>
              ) : null}

              <div className="grid gap-6 lg:grid-cols-2">
                <form
                  onSubmit={saveIndividualTicketDetails}
                  className="bg-card rounded-xl saffron-border p-6 space-y-4"
                >
                  <h2 className="text-sm font-semibold text-primary flex items-center gap-2">
                    <Ticket className="w-4 h-4" /> {t('admin.individualTicket')}
                  </h2>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5">{t('admin.ticketNumber')}</label>
                    <input
                      className={inputClass}
                      placeholder="e.g. JD-12345 or 12345"
                      value={individualTicketForm.ticketNumber}
                      onChange={(e) =>
                        setIndividualTicketForm((p) => ({ ...p, ticketNumber: e.target.value }))
                      }
                      autoComplete="off"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5">{t('admin.holderName')}</label>
                    <input
                      className={inputClass}
                      value={individualTicketForm.holderName}
                      onChange={(e) =>
                        setIndividualTicketForm((p) => ({ ...p, holderName: e.target.value }))
                      }
                      autoComplete="name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5">{t('admin.entryDate')}</label>
                    <input
                      type="date"
                      className={inputClass}
                      value={individualTicketForm.entryDate}
                      onChange={(e) =>
                        setIndividualTicketForm((p) => ({ ...p, entryDate: e.target.value }))
                      }
                    />
                  </div>
                  <motion.button
                    type="submit"
                    disabled={individualSaving}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-2.5 rounded-lg font-semibold text-sm bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-cinematic"
                  >
                    {individualSaving ? t('common.loading') : t('admin.saveEntry')}
                  </motion.button>
                </form>

                <form onSubmit={saveBulkTicketDetails} className="bg-card rounded-xl saffron-border p-6 space-y-4">
                  <h2 className="text-sm font-semibold text-primary flex items-center gap-2">
                    <ClipboardList className="w-4 h-4" /> {t('admin.bulkTickets')}
                  </h2>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1.5">
                        {t('admin.startTicketNumber')}
                      </label>
                      <input
                        className={inputClass}
                        value={bulkTicketForm.start}
                        onChange={(e) => setBulkTicketForm((p) => ({ ...p, start: e.target.value }))}
                        autoComplete="off"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1.5">
                        {t('admin.endTicketNumber')}
                      </label>
                      <input
                        className={inputClass}
                        value={bulkTicketForm.end}
                        onChange={(e) => setBulkTicketForm((p) => ({ ...p, end: e.target.value }))}
                        autoComplete="off"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5">{t('admin.ticketCount')}</label>
                    <input
                      className={inputClass}
                      inputMode="numeric"
                      value={bulkTicketForm.count}
                      onChange={(e) => setBulkTicketForm((p) => ({ ...p, count: e.target.value }))}
                      placeholder={bulkRangePreview ? String(bulkRangePreview.count) : ''}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {bulkRangePreview ? t('admin.ticketCountAuto') : t('admin.ticketDetailsBulkCountHint')}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5">{t('admin.holderName')}</label>
                    <input
                      className={inputClass}
                      value={bulkTicketForm.holderName}
                      onChange={(e) => setBulkTicketForm((p) => ({ ...p, holderName: e.target.value }))}
                      autoComplete="name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5">{t('admin.entryDate')}</label>
                    <input
                      type="date"
                      className={inputClass}
                      value={bulkTicketForm.entryDate}
                      onChange={(e) => setBulkTicketForm((p) => ({ ...p, entryDate: e.target.value }))}
                    />
                  </div>
                  <motion.button
                    type="submit"
                    disabled={bulkSaving}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-2.5 rounded-lg font-semibold text-sm bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-cinematic"
                  >
                    {bulkSaving ? t('common.loading') : t('admin.saveEntry')}
                  </motion.button>
                </form>
              </div>

              <div>
                <h2 className={`${isKn ? 'font-kannada' : 'font-display'} text-lg text-foreground mb-4`}>
                  {t('admin.recentTicketDetails')}
                </h2>
                {ticketDetailsError ? (
                  <p className="text-sm text-destructive mb-4">{ticketDetailsError}</p>
                ) : null}
                <div className="bg-card rounded-xl saffron-border overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left p-4 text-muted-foreground font-medium">
                            {t('admin.ticketDetailsColType')}
                          </th>
                          <th className="text-left p-4 text-muted-foreground font-medium">
                            {t('admin.ticketDetailsColDetail')}
                          </th>
                          <th className="text-left p-4 text-muted-foreground font-medium">
                            {t('admin.ticketCount')}
                          </th>
                          <th className="text-left p-4 text-muted-foreground font-medium">
                            {t('admin.holderName')}
                          </th>
                          <th className="text-left p-4 text-muted-foreground font-medium">
                            {t('admin.entryDate')}
                          </th>
                          <th className="text-left p-4 text-muted-foreground font-medium">
                            {t('admin.ticketDetailsSavedAt')}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {ticketDetailsLoading ? (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-muted-foreground">
                              {t('common.loading')}
                            </td>
                          </tr>
                        ) : null}
                        {!ticketDetailsLoading && ticketDetailRows.length === 0 && !ticketDetailsError ? (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-muted-foreground">
                              {t('admin.noTicketDetailsYet')}
                            </td>
                          </tr>
                        ) : null}
                        {ticketDetailRows.map((row) => {
                          const detail =
                            row.type === 'individual'
                              ? `JD-${row.ticketNumber || ''}`
                              : `JD-${row.startTicketNumber || ''} → JD-${row.endTicketNumber || ''}`;
                          const countCell =
                            row.type === 'bulk' && row.ticketCount != null ? String(row.ticketCount) : '—';
                          const savedAt = row.createdAt
                            ? new Date(row.createdAt).toLocaleString(isKn ? 'en-IN' : undefined)
                            : '—';
                          return (
                            <tr
                              key={row.id}
                              className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                            >
                              <td className="p-4 text-foreground">
                                {row.type === 'individual'
                                  ? t('admin.ticketDetailsKindIndividual')
                                  : t('admin.ticketDetailsKindBulk')}
                              </td>
                              <td className="p-4 font-mono text-xs text-primary break-all max-w-[200px]">
                                {detail}
                              </td>
                              <td className="p-4 text-foreground tabular-nums">{countCell}</td>
                              <td className="p-4 text-foreground">{row.holderName}</td>
                              <td className="p-4 text-muted-foreground tabular-nums whitespace-nowrap">
                                {row.entryDate}
                              </td>
                              <td className="p-4 text-muted-foreground text-xs tabular-nums whitespace-nowrap">
                                {savedAt}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'verify' && (
            <div className="max-w-lg">
              <h1 className={`${isKn ? 'font-kannada' : 'font-display'} text-2xl text-foreground mb-2`}>
                {t('admin.scanVerify')}
              </h1>
              <p className="text-sm text-muted-foreground mb-6">{t('admin.scanVerifyHint')}</p>
              <Link
                to="/admin/scan"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold text-sm px-6 py-3 rounded-lg shadow-saffron-glow"
              >
                <ScanLine className="w-5 h-5" /> {t('admin.openScanner')}
              </Link>
            </div>
          )}

          {/* ───── THEATERS ───── */}
          {activeTab === 'theaters' && (
            <div>
              <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <h1 className={`${isKn ? 'font-kannada' : 'font-display'} text-2xl text-foreground`}>{t('admin.theaters')}</h1>
                <ExportButtons onExportXls={() => exportTableAsXls('Theaters', theaterHeaders, theaterRows)} onExportPdf={() => exportTableAsPdf('Theaters', theaterHeaders, theaterRows)} />
              </div>
              <div className="bg-card rounded-xl saffron-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-4 text-muted-foreground font-medium">{t('admin.theaters')}</th>
                      <th className="text-left p-4 text-muted-foreground font-medium">Location</th>
                      <th className="text-left p-4 text-muted-foreground font-medium">Screens</th>
                      <th className="text-left p-4 text-muted-foreground font-medium">Capacity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {demoTheaters.map(th => (
                      <tr key={th.name} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="p-4 text-foreground font-medium">{th.name}</td>
                        <td className="p-4 text-muted-foreground">{th.location}</td>
                        <td className="p-4 text-foreground tabular-nums">{th.screens}</td>
                        <td className="p-4 text-foreground tabular-nums">{th.capacity.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ───── ANALYTICS ───── */}
          {activeTab === 'analytics' && (
            <div id="admin-report">
              <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <h1 className={`${isKn ? 'font-kannada' : 'font-display'} text-2xl text-foreground`}>{t('admin.analytics')}</h1>
                <ExportButtons onExportXls={() => exportTableAsXls('Analytics', analyticsHeaders, analyticsRows)} onExportPdf={() => exportTableAsPdf('Analytics Report', analyticsHeaders, analyticsRows)} />
              </div>

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
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center"><Icon className="w-6 h-6 text-primary" /></div>
                    </div>
                    <div className="flex items-center gap-1 mt-3 text-xs text-emerald-500"><TrendingUp className="w-3 h-3" /> {trend}</div>
                  </motion.div>
                ))}
              </div>

              <div className="bg-card rounded-xl p-6 saffron-border mb-6">
                <h3 className="text-sm text-muted-foreground mb-6">{t('admin.collectionProgress')}</h3>
                <div className="flex flex-wrap justify-center gap-10">
                  {demoMovies.map(m => (<CircularProgress key={m.id} value={m.collection} max={m.target} label={m.title} />))}
                  <CircularProgress value={75} max={100} label={t('admin.occupancy')} color="hsl(var(--accent))" />
                  <CircularProgress value={92} max={100} label={t('admin.satisfaction')} color="hsl(142 76% 36%)" />
                </div>
              </div>

              <div className="bg-card rounded-xl p-6 saffron-border">
                <h3 className="text-sm text-muted-foreground mb-4">{t('admin.monthlyRevenue')}</h3>
                <div className="h-48 flex items-end gap-2 px-4">
                  {[40, 65, 45, 80, 55, 90, 70, 85, 60, 75, 95, 50].map((h, i) => (
                    <motion.div key={i} initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ delay: i * 0.05, duration: 0.5 }}
                      className="flex-1 bg-gradient-to-t from-primary to-accent rounded-t-sm relative group cursor-pointer">
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">₹{(h * 7000).toLocaleString()}</div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {(activeTab === 'customers' || activeTab === 'settings') && (
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