import React from 'react';
import { LogOut, User, Bell, ChevronDown } from 'lucide-react';

const ROLE_THEMES = {
  student: { label: 'Öğrenci', color: 'bg-teal-100 text-teal-700 border-teal-200' },
  teacher: { label: 'Hoca', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  chef: { label: 'Aşçı', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  manager: { label: 'Mesul', color: 'bg-purple-100 text-purple-700 border-purple-200' },
};

const Navbar = ({ user, onLogout }) => {
  const theme = ROLE_THEMES[user.role] || ROLE_THEMES.student;

  return (
    <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-slate-200/60 px-4 md:px-8 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-teal-600/20">
            D
          </div>
          <span className="text-2xl font-bold text-slate-900 tracking-tight hidden md:block">
            Dozla<span className="text-teal-600">.</span>
          </span>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100">
            <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${theme.color}`}>
              {theme.label}
            </div>
            <div className="h-4 w-[1px] bg-slate-200"></div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-700">{user.name}</span>
              {user.dorm && (
                <span className="text-[11px] font-medium text-slate-400 bg-slate-200/50 px-1.5 py-0.5 rounded">
                  {user.dorm.toUpperCase()}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all">
              <Bell size={20} />
            </button>
            <button 
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl font-semibold text-sm transition-all border border-rose-100 shadow-sm shadow-rose-200/20"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">Çıkış Yap</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
