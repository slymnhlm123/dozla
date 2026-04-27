import React from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, BookOpen, ChefHat, ShieldCheck } from 'lucide-react';

const ROLES = [
  {
    id: 'student',
    title: 'Öğrenci',
    description: 'Yemek tercihlerinizi mutfakla paylaşın.',
    icon: GraduationCap,
    color: 'bg-teal-500',
    hover: 'hover:bg-teal-600',
    shadow: 'shadow-teal-200',
  },
  {
    id: 'teacher',
    title: 'Etüt Hocası',
    description: 'Sınıfınızdaki öğrencilerin tercihlerini yönetin.',
    icon: BookOpen,
    color: 'bg-blue-500',
    hover: 'hover:bg-blue-600',
    shadow: 'shadow-blue-200',
  },
  {
    id: 'chef',
    title: 'Mutfak Şefi',
    description: 'Menü oluşturun ve porsiyonları takip edin.',
    icon: ChefHat,
    color: 'bg-orange-500',
    hover: 'hover:bg-orange-600',
    shadow: 'shadow-orange-200',
  },
  {
    id: 'manager',
    title: 'Mesul Hoca',
    description: 'Tüm yurtlardaki raporları ve istatistikleri görün.',
    icon: ShieldCheck,
    color: 'bg-purple-500',
    hover: 'hover:bg-purple-600',
    shadow: 'shadow-purple-200',
  },
];

const RoleSelector = ({ onSelect }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-teal-100 via-slate-50 to-blue-100">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">
          Dozla<span className="text-teal-600">.</span>
        </h1>
        <p className="text-slate-500 text-lg font-medium">Akıllı Porsiyon Yönetim Sistemi</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl w-full">
        {ROLES.map((role, index) => (
          <motion.button
            key={role.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -10, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(role.id)}
            className="group relative flex flex-col items-center p-8 bg-white/70 backdrop-blur-md rounded-[2.5rem] border border-white shadow-2xl shadow-slate-200/50 transition-all duration-300"
          >
            <div className={`w-20 h-20 ${role.color} rounded-3xl flex items-center justify-center text-white mb-6 shadow-xl ${role.shadow} group-hover:scale-110 transition-transform duration-300`}>
              <role.icon size={40} strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">{role.title}</h3>
            <p className="text-slate-500 text-center text-sm leading-relaxed">
              {role.description}
            </p>
            <div className={`absolute bottom-4 right-8 w-12 h-1 bg-gradient-to-r from-transparent to-${role.color.split('-')[1]}-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity`}></div>
          </motion.button>
        ))}
      </div>
      
      <footer className="mt-16 text-slate-400 text-sm font-medium">
        &copy; 2024 Enderun Bilişim. Tüm hakları saklıdır.
      </footer>
    </div>
  );
};

export default RoleSelector;
