import React from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, BookOpen, ChefHat, ShieldCheck, Sun, Moon, ArrowRight } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const ROLES = [
  {
    id: 'student',
    title: 'Öğrenci Girişi',
    description: 'Yemek tercihlerinizi belirleyin ve mutfakla anında paylaşarak israfı önleyin.',
    icon: GraduationCap,
    gradient: 'from-teal-500 to-emerald-600',
    hoverGlow: 'hover:shadow-teal-500/25',
    color: 'text-teal-600 dark:text-teal-400',
    bg: 'bg-teal-50 dark:bg-teal-500/10'
  },
  {
    id: 'teacher',
    title: 'Etüt Hocası',
    description: 'Sınıfınızdaki öğrencilerin tercihlerini takip edin ve toplu bildirimler yapın.',
    icon: BookOpen,
    gradient: 'from-blue-500 to-indigo-600',
    hoverGlow: 'hover:shadow-blue-500/25',
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-500/10'
  },
  {
    id: 'chef',
    title: 'Mutfak Şefi',
    description: 'Aylık menüleri yükleyin, günlük porsiyonları görün ve mutfağı yönetin.',
    icon: ChefHat,
    gradient: 'from-orange-500 to-amber-600',
    hoverGlow: 'hover:shadow-orange-500/25',
    color: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-50 dark:bg-orange-500/10'
  },
  {
    id: 'manager',
    title: 'Yurt Mesulü',
    description: 'Tüm yurtlardaki yemekhane verilerini, öğrenci istatistiklerini ve raporları inceleyin.',
    icon: ShieldCheck,
    gradient: 'from-purple-500 to-violet-600',
    hoverGlow: 'hover:shadow-purple-500/25',
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-500/10'
  },
];

const RoleSelector = ({ onSelect }) => {
  const { isDark, toggleTheme } = useTheme();

  const scrollToRoles = () => {
    document.getElementById('roles-section').scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-500 overflow-x-hidden font-sans selection:bg-teal-500/30">
      
      {/* Background Ornaments */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-400/20 dark:bg-teal-600/10 rounded-full blur-[120px] animate-pulse-soft"></div>
        <div className="absolute top-[20%] right-[-10%] w-[30%] h-[50%] bg-blue-400/20 dark:bg-blue-600/10 rounded-full blur-[120px] animate-pulse-soft" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[40%] bg-emerald-400/20 dark:bg-emerald-600/10 rounded-full blur-[120px] animate-pulse-soft" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Header / Navbar */}
      <header className="relative z-50 w-full pt-6 px-6 lg:px-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-teal-500/30">
            D
          </div>
          <span className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Dozla<span className="text-teal-500">.</span>
          </span>
        </div>
        
        <motion.button
          whileTap={{ scale: 0.9, rotate: 180 }}
          transition={{ type: 'spring', stiffness: 300 }}
          onClick={toggleTheme}
          className="p-3 rounded-2xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 shadow-sm transition-all"
          aria-label="Tema Değiştir"
        >
          {isDark ? <Sun size={24} /> : <Moon size={24} />}
        </motion.button>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center justify-center min-h-[85vh] px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400 font-bold text-sm mb-8 border border-teal-100 dark:border-teal-500/20">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500"></span>
            </span>
            Enderun Bilişim Sistemleri
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black text-slate-900 dark:text-white tracking-tighter mb-8 leading-tight">
            Akıllı <br className="md:hidden" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600 animate-gradient-x">Porsiyon Yönetimi</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 mb-12 max-w-2xl mx-auto font-medium leading-relaxed">
            Yemek israfını önleyin, mutfak planlamasını optimize edin ve tüm süreci tek bir ekrandan yönetin.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={scrollToRoles}
              className="px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold text-lg hover:scale-105 hover:shadow-xl hover:shadow-slate-900/20 dark:hover:shadow-white/20 transition-all flex items-center gap-3 w-full sm:w-auto justify-center"
            >
              Hemen Başla
              <ArrowRight size={20} />
            </button>
            <a 
              href="#about"
              className="px-8 py-4 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl font-bold text-lg hover:bg-white dark:hover:bg-slate-800 transition-all w-full sm:w-auto justify-center text-center"
            >
              Daha Fazla Bilgi
            </a>
          </div>
        </motion.div>
      </section>

      {/* Roles / Login Options Section */}
      <section id="roles-section" className="relative z-10 py-24 px-6 lg:px-12 bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl border-t border-slate-200/50 dark:border-slate-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">Kullanıcı Girişi</h2>
            <p className="text-lg text-slate-500 dark:text-slate-400 font-medium">Sisteme giriş yapmak için rolünüzü seçin</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 xl:gap-8">
            {ROLES.map((role, index) => (
              <motion.button
                key={role.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                onClick={() => onSelect(role.id)}
                className={`group text-left p-8 rounded-[2rem] bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 shadow-xl shadow-slate-200/20 dark:shadow-none hover:-translate-y-2 transition-all duration-300 overflow-hidden relative ${role.hoverGlow}`}
              >
                {/* Decorative Background Gradient on Hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${role.gradient} opacity-0 group-hover:opacity-5 dark:group-hover:opacity-10 transition-opacity duration-300`}></div>
                
                <div className="relative z-10">
                  <div className={`w-16 h-16 ${role.bg} ${role.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <role.icon size={32} strokeWidth={2} />
                  </div>
                  
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-slate-900 group-hover:to-slate-600 dark:group-hover:from-white dark:group-hover:to-slate-300 transition-all">
                    {role.title}
                  </h3>
                  
                  <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                    {role.description}
                  </p>
                </div>
                
                <div className="absolute bottom-8 right-8 opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${role.gradient} flex items-center justify-center text-white shadow-lg`}>
                    <ArrowRight size={20} />
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-12 px-6 border-t border-slate-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-950/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center text-white font-black text-lg">D</div>
            <span className="font-bold text-slate-800 dark:text-slate-200">Dozla.</span>
          </div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-500 text-center md:text-left">
            &copy; {new Date().getFullYear()} Enderun Bilişim Sistemleri. Tüm hakları saklıdır.
          </p>
          <div className="flex gap-4">
            <a href="#" className="text-sm font-medium text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 transition-colors">Gizlilik Politikası</a>
            <a href="#" className="text-sm font-medium text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 transition-colors">İletişim</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default RoleSelector;
