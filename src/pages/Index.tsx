import { useTranslation } from 'react-i18next';
import { motion, type Variants } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Play, Calendar, Clock, Star } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import heroPoster from '@/assets/banner.png';
import cast1 from '@/assets/image1.png';
import cast2 from '@/assets/image3.png';
import cast3 from '@/assets/image2.png';
import cast4 from '@/assets/image4.png';
import cast5 from '@/assets/image5.png';
import cast6 from '@/assets/image6.png';
import cast7 from '@/assets/image7.png';
import cast8 from '@/assets/image8.png';
import cast9 from '@/assets/image9.png';
import cast10 from '@/assets/image10.png';
import cast11 from '@/assets/image11.png';
import cast12 from '@/assets/image12.png';
import gallery1 from '@/assets/gallery-1.jpg';
import gallery2 from '@/assets/gallery-2.jpg';
import { useEffect, useState } from 'react';


const castMembers = [
  { img: cast1, nameKn: 'ಅರ್ಜುನ್ ದೇವ್', nameEn: 'SHIVARAM GANGATGAR', roleKn: 'ದೇವರಾಜ', roleEn: 'As a Mahaguru' },
  { img: cast2, nameKn: 'ಪ್ರಿಯಾ ಶರ್ಮಾ', nameEn: 'Karthik', roleKn: 'ದೇವಿ ಅನನ್ಯಾ', roleEn: 'As a Chintan' },
  { img: cast3, nameKn: 'ಅರ್ಚನಾ ಗೌಡ', nameEn: 'Archana Gowda', roleKn: 'ಗುರು ವಿಶ್ವಾಮಿತ್ರ', roleEn: 'As a Mandara' },
  { img: cast4, nameKn: 'ರಾಮಚಂದ್ರ', nameEn: 'Chiranth', roleKn: 'ಗುರು ವಿಶ್ವಾಮಿತ್ರ', roleEn: 'Tejaswi' },
  { img: cast5, nameKn: 'ರಾಮಚಂದ್ರ', nameEn: 'Chiranth', roleKn: 'ಗುರು ವಿಶ್ವಾಮಿತ್ರ', roleEn: 'Tejaswi' },
  { img: cast6, nameKn: 'ರಾಮಚಂದ್ರ', nameEn: 'Chiranth', roleKn: 'ಗುರು ವಿಶ್ವಾಮಿತ್ರ', roleEn: 'Tejaswi' },
  { img: cast7, nameKn: 'ರಾಮಚಂದ್ರ', nameEn: 'Chiranth', roleKn: 'ಗುರು ವಿಶ್ವಾಮಿತ್ರ', roleEn: 'Tejaswi' },
  { img: cast8, nameKn: 'ರಾಮಚಂದ್ರ', nameEn: 'Chiranth', roleKn: 'ಗುರು ವಿಶ್ವಾಮಿತ್ರ', roleEn: 'Tejaswi' },
  { img: cast9, nameKn: 'ರಾಮಚಂದ್ರ', nameEn: 'Chiranth', roleKn: 'ಗುರು ವಿಶ್ವಾಮಿತ್ರ', roleEn: 'Tejaswi' },
  { img: cast10, nameKn: 'ರಾಮಚಂದ್ರ', nameEn: 'Chiranth', roleKn: 'ಗುರು ವಿಶ್ವಾಮಿತ್ರ', roleEn: 'Tejaswi' },
  { img: cast11, nameKn: 'ರಾಮಚಂದ್ರ', nameEn: 'Chiranth', roleKn: 'ಗುರು ವಿಶ್ವಾಮಿತ್ರ', roleEn: 'Tejaswi' },
  { img: cast12, nameKn: 'ರಾಮಚಂದ್ರ', nameEn: 'Chiranth', roleKn: 'ಗುರು ವಿಶ್ವಾಮಿತ್ರ', roleEn: 'Tejaswi' },
];

const trailerUrl = "https://www.youtube.com/embed/mjGFKYiVh7g";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.15, duration: 0.6 },
  }),
};
const banners = [heroPoster, gallery1, gallery2];
const Index = () => {
  const { t, i18n } = useTranslation();
  const isKn = i18n.language === 'kn';

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
  
    return () => clearInterval(interval);
  }, []);


  const aboutText = t('movie.aboutText', { returnObjects: true }) as string[];

  return (
    
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="w-full px-4 md:px-10 mt-20">

  {/* Banner */}
  <div className="relative w-full h-[60vh] md:h-[80vh] rounded-2xl overflow-hidden bg-black border border-primary/40 shadow-[0_0_30px_rgba(255,140,0,0.3)]">

    {/* Background */}
    <img
      src={banners[currentIndex]}
      className="absolute inset-0 w-full h-full object-cover blur-2xl scale-125 opacity-50"
      alt=""
    />

    {/* Main */}
    <img
      src={banners[currentIndex]}
      className="relative w-full h-full object-fill z-10"
      alt="Banner"
    />

  </div>

  {/* ✅ INDICATOR BELOW IMAGE */}
  <div className="flex justify-center gap-2 mt-4">
    {banners.map((_, index) => (
      <div
        key={index}
        className={`h-2 rounded-full transition-all duration-300 ${
          index === currentIndex
            ? 'w-6 bg-primary'
            : 'w-2 bg-white/40'
        }`}
      />
    ))}
  </div>

</section>

        <section className="py-24 bg-card">
        <div className="relative container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            className="max-w-2xl"
          >
            <h1 className={`${isKn ? 'font-kannada text-5xl md:text-7xl' : 'font-display text-6xl md:text-8xl'} text-foreground tracking-wide text-saffron-glow`}>
              {t('movie.title')}
            </h1>
            <p className="mt-3 text-sm md:text-base text-primary/80 font-medium tracking-wide">
  Directed & Written by <span className="text-primary font-semibold">Shivaram Gangatgar</span>
</p>
            <p className={`mt-4 text-xl md:text-2xl text-primary font-medium ${isKn ? 'font-kannada' : 'font-display tracking-wider'}`}>
              {t('hero.tagline')}
            </p>
            <p className="mt-3 text-muted-foreground text-base md:text-lg max-w-lg">
              {t('hero.subtitle')}
            </p>

            <div className="flex items-center gap-6 mt-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-primary" /> 2026</span>
              <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-primary" /> 2h 8m</span>
              <span className="flex items-center gap-1.5"><Star className="w-4 h-4 text-primary" /> 8.5</span>
            </div>

            <div className="flex flex-wrap gap-4 mt-8">
              <Link to="/booking">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-r from-primary to-accent text-primary-foreground px-8 py-3.5 rounded-lg font-semibold shadow-saffron-glow hover:shadow-saffron-lg transition-cinematic text-base"
                >
                  {t('hero.bookNow')}
                </motion.button>
              </Link>
              <motion.button
  whileTap={{ scale: 0.95 }}
  onClick={() => {
    const section = document.getElementById('trailer');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  }}
  className="flex items-center gap-2 border-2 border-primary/50 text-primary px-6 py-3.5 rounded-lg font-medium hover:bg-primary/10 transition-cinematic"
>
  <Play className="w-5 h-5" />
  {t('hero.watchTrailer')}
</motion.button>
            </div>
          </motion.div>
        </div>
        </section>

      {/* About Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <h2 className={`${isKn ? 'font-kannada' : 'font-display'} text-4xl md:text-5xl text-foreground`}>
              {t('movie.about')}
            </h2>
            <div className="w-16 h-1 bg-primary mt-4 rounded-full" />
          </motion.div>
          <motion.div
  initial="hidden"
  whileInView="visible"
  viewport={{ once: true }}
  variants={fadeUp}
  custom={1}
  className="mt-8 text-muted-foreground text-lg leading-relaxed max-w-3xl"
>
  {aboutText.map((para, i) => (
    <p key={i} className="mb-4">
      {para}
    </p>
  ))}
</motion.div>
        </div>
      </section>

      {/* Cast Section */}
      <section className="py-24 bg-card">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <h2 className={`${isKn ? 'font-kannada' : 'font-display'} text-4xl md:text-5xl text-foreground`}>
              {t('movie.casting')}
            </h2>
            <div className="w-16 h-1 bg-primary mt-4 rounded-full" />
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-12">
            {castMembers.map((member, i) => (
              <motion.div
                key={i}
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i + 1}
                className="flex flex-col items-center text-center"
              >
                <div className="w-40 h-40 rounded-full overflow-hidden outline outline-2 outline-primary outline-offset-4">
                  <img src={member.img} alt={isKn ? member.nameKn : member.nameEn} className="w-full h-full object-cover" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-foreground">
                  {isKn ? member.nameKn : member.nameEn}
                </h3>
                <p className="text-primary text-sm mt-1">{isKn ? member.roleKn : member.roleEn}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trailer Section */}
      <section id="trailer" className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <h2 className={`${isKn ? 'font-kannada' : 'font-display'} text-4xl md:text-5xl text-foreground`}>
              {t('movie.trailer')}
            </h2>
            <div className="w-16 h-1 bg-primary mt-4 rounded-full" />
          </motion.div>
          <motion.div
  initial="hidden"
  whileInView="visible"
  viewport={{ once: true }}
  variants={fadeUp}
  custom={1}
  className="mt-12 relative aspect-video rounded-lg overflow-hidden saffron-border border-t-2 border-primary"
>
  <iframe
    className="w-full h-full"
    src={trailerUrl}
    title="Movie Trailer"
    frameBorder="0"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    allowFullScreen
  />
</motion.div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="py-24 bg-card">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <h2 className={`${isKn ? 'font-kannada' : 'font-display'} text-4xl md:text-5xl text-foreground`}>
              {t('movie.gallery')}
            </h2>
            <div className="w-16 h-1 bg-primary mt-4 rounded-full" />
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-12">
            {[gallery1, gallery2, heroPoster].map((img, i) => (
              <motion.div
                key={i}
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i + 1}
                className="aspect-video rounded-lg overflow-hidden saffron-border"
              >
                <img src={img} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover hover:scale-110 transition duration-500" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Floating CTA */}
      <Link to="/booking" className="fixed bottom-8 right-8 z-40 md:hidden">
        <motion.button
          whileTap={{ scale: 0.95 }}
          className="bg-gradient-to-r from-primary to-accent text-primary-foreground px-6 py-3 rounded-full font-semibold shadow-saffron-lg text-sm"
        >
          {t('nav.buyTickets')}
        </motion.button>
      </Link>

      <Footer />
    </div>
  );
};

export default Index;
