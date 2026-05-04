import React from 'react';
import { LogOut, Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';

const ROLE_THEMES = {
  student: { label: 'Öğrenci', color: 'bg-teal-500/10 text-teal-600 dark:bg-teal-400/10 dark:text-teal-400 border-teal-500/20' },
  teacher: { label: 'Hoca', color: 'bg-blue-500/10 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400 border-blue-500/20' },
  chef: { label: 'Aşçı', color: 'bg-orange-500/10 text-orange-600 dark:bg-orange-400/10 dark:text-orange-400 border-orange-500/20' },
  manager: { label: 'Mesul', color: 'bg-purple-500/10 text-purple-600 dark:bg-purple-400/10 dark:text-purple-400 border-purple-500/20' },
};

const Navbar = ({ user, onLogout }) => {
  const theme = ROLE_THEMES[user.role] || ROLE_THEMES.student;
  const { isDark, toggleTheme } = useTheme();

  return (
    <nav className="sticky top-0 z-50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-700/50 px-4 md:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-lg shadow-teal-500/25">
            D
          </div>
          <span className="text-2xl font-black tracking-tight hidden md:block text-slate-900 dark:text-white">
            Dozla<span className="bg-gradient-to-r from-teal-500 to-emerald-500 bg-clip-text text-transparent">.</span>
          </span>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* User Info */}
          <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50">
            <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${theme.color}`}>
              {theme.label}
            </div>
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700"></div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{user.name}</span>
              {user.dorm && (
                <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 bg-slate-200/50 dark:bg-slate-700/50 px-1.5 py-0.5 rounded">
                  {user.dorm.toUpperCase()}
                </span>
              )}
            </div>
          </div>

          {/* Theme Toggle */}
          <motion.button
            whileTap={{ scale: 0.9, rotate: 180 }}
            transition={{ type: 'spring', stiffness: 300 }}
            onClick={toggleTheme}
            className="p-2.5 rounded-xl transition-all duration-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
            aria-label="Tema Değiştir"
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </motion.button>

          {/* Logout */}
          <button 
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 rounded-xl font-semibold text-sm transition-all border border-rose-100 dark:border-rose-500/20"
          >
            <LogOut size={18} />
            <span className="hidden sm:inline">Çıkış</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
