import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, User, Lock, Hash, MapPin, School, ArrowRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { DORMS, CLASSES, STORAGE_KEYS, getFromStorage, saveToStorage } from '../utils/storage';

const AuthScreen = ({ role, onBack, onLogin }) => {
  const [isLogin, setIsLogin] = useState(role !== 'student');
  const [formData, setFormData] = useState({
    name: '',
    studentId: '',
    dorm: '',
    class: '',
    password: '',
    username: '', // for chef/manager
  });

  const handleAction = (e) => {
    e.preventDefault();
    const users = getFromStorage(STORAGE_KEYS.USERS);

    if (isLogin) {
      // Login Logic
      const user = users.find(u => {
        const roleMatch = u.role === role;
        const identityMatch = role === 'student' 
          ? (u.studentId === formData.studentId || u.name === formData.name)
          : (u.username === formData.username || u.name === formData.username); // handle cases where name might be used as username
        const passwordMatch = u.password === formData.password;
        
        return roleMatch && identityMatch && passwordMatch;
      });

      if (user) {
        toast.success(`Hoş geldiniz, ${user.name}`);
        onLogin(user);
      } else {
        toast.error('Giriş bilgileri hatalı');
      }
    } else {
      // Register Logic (Only for students)
      if (formData.password.length < 8 || !/[A-Z]/.test(formData.password)) {
        toast.error('Şifre en az 8 karakter ve 1 büyük harf içermelidir');
        return;
      }

      if (!formData.dorm || !formData.class) {
        toast.error('Lütfen yurt ve sınıf seçiniz');
        return;
      }

      const newUser = {
        id: Date.now().toString(),
        role: 'student',
        ...formData
      };

      saveToStorage(STORAGE_KEYS.USERS, [...users, newUser]);
      toast.success('Kayıt başarıyla tamamlandı');
      onLogin(newUser);
    }
  };

  const roleLabels = {
    student: 'Öğrenci',
    teacher: 'Etüt Hocası',
    chef: 'Mutfak Şefi',
    manager: 'Yemekhane Mesul Hocası'
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <div className="w-full max-w-lg">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-slate-600 mb-8 transition-colors font-medium group"
        >
          <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          Role Seçimine Dön
        </button>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card"
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-2">
              {roleLabels[role]} {isLogin ? 'Girişi' : 'Kaydı'}
            </h2>
            <p className="text-slate-500 font-medium">Devam etmek için bilgilerinizi girin</p>
          </div>

          <form onSubmit={handleAction} className="space-y-5">
            {role === 'student' && !isLogin ? (
              <>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 ml-1">Ad Soyad</label>
                  <div className="relative">
                    <User className="absolute left-4 top-3.5 text-slate-400" size={20} />
                    <input 
                      type="text" 
                      required
                      placeholder="Örn: Ahmet Yılmaz"
                      className="input-field pl-12"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 ml-1">Öğrenci Numarası</label>
                  <div className="relative">
                    <Hash className="absolute left-4 top-3.5 text-slate-400" size={20} />
                    <input 
                      type="text" 
                      required
                      placeholder="12345"
                      className="input-field pl-12"
                      value={formData.studentId}
                      onChange={(e) => setFormData({...formData, studentId: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700 ml-1">Yurt</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-3.5 text-slate-400" size={20} />
                      <select 
                        required
                        className="input-field pl-12 appearance-none"
                        value={formData.dorm}
                        onChange={(e) => setFormData({...formData, dorm: e.target.value})}
                      >
                        <option value="">Seçiniz</option>
                        {DORMS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700 ml-1">Sınıf</label>
                    <div className="relative">
                      <School className="absolute left-4 top-3.5 text-slate-400" size={20} />
                      <select 
                        required
                        className="input-field pl-12 appearance-none"
                        value={formData.class}
                        onChange={(e) => setFormData({...formData, class: e.target.value})}
                      >
                        <option value="">Seçiniz</option>
                        {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700 ml-1">
                  {role === 'student' ? 'Öğrenci No / Ad' : 'Kullanıcı Adı'}
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-3.5 text-slate-400" size={20} />
                  <input 
                    type="text" 
                    required
                    placeholder={role === 'student' ? "12345 veya Ad Soyad" : "asci / mesul / hoca adı"}
                    className="input-field pl-12"
                    value={role === 'student' ? formData.studentId : formData.username}
                    onChange={(e) => setFormData({
                      ...formData, 
                      [role === 'student' ? 'studentId' : 'username']: e.target.value
                    })}
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700 ml-1">Şifre</label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 text-slate-400" size={20} />
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  className="input-field pl-12"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
              </div>
            </div>

            <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2 group mt-4">
              {isLogin ? 'Giriş Yap' : 'Kayıt Ol'}
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          {role === 'student' && (
            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
              <p className="text-slate-500 text-sm font-medium">
                {isLogin ? 'Henüz hesabın yok mu?' : 'Zaten hesabın var mı?'}
                <button 
                  onClick={() => setIsLogin(!isLogin)}
                  className="ml-2 text-teal-600 hover:text-teal-700 font-bold underline underline-offset-4"
                >
                  {isLogin ? 'Hemen Kaydol' : 'Giriş Yap'}
                </button>
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default AuthScreen;
