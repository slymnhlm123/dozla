import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, User, Lock, Mail, MapPin, School, ArrowRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../utils/supabase';
import { DORMS, CLASSES, ROLE_TABLE } from '../utils/storage';

const AuthScreen = ({ role, onBack, onLogin }) => {
  const [isLogin, setIsLogin] = useState(role !== 'student');
  const [formData, setFormData] = useState({
    name: '',
    email: '',      // öğrenci için
    username: '',   // öğretmen / aşçı / mesul için
    dorm: '',
    class: '',
    password: '',
  });

  const tableName = ROLE_TABLE[role];

  const handleAction = async (e) => {
    e.preventDefault();

    if (isLogin) {
      // --- GİRİŞ ---
      try {
        let query = supabase.from(tableName).select('*');

        if (role === 'student') {
          query = query.eq('email', formData.email);
        } else {
          query = query.eq('username', formData.username);
        }

        const { data: users, error: fetchError } = await query;

        if (fetchError) {
          console.error('Sorgu hatası:', fetchError);
          toast.error(`Hata: ${fetchError.message}`);
          return;
        }

        if (!users || users.length === 0) {
          toast.error('Kullanıcı bulunamadı. Bilgilerinizi kontrol edin.');
          return;
        }

        const matchedUser = users.find(u => u.password === formData.password);

        if (!matchedUser) {
          toast.error('Şifre hatalı');
        } else {
          toast.success(`Hoş geldiniz, ${matchedUser.name}!`);
          onLogin({ ...matchedUser, role });
        }
      } catch (err) {
        console.error('Giriş hatası:', err);
        toast.error('Giriş yapılırken bir hata oluştu');
      }

    } else {
      // --- KAYIT (yalnızca öğrenci) ---
      if (formData.password.length < 8 || !/[A-Z]/.test(formData.password)) {
        toast.error('Şifre en az 8 karakter ve 1 büyük harf içermelidir');
        return;
      }
      if (!formData.dorm || !formData.class) {
        toast.error('Lütfen yurt ve sınıf seçiniz');
        return;
      }

      try {
        // E-posta daha önce kayıtlı mı?
        const { data: existing } = await supabase
          .from('students')
          .select('id')
          .eq('email', formData.email)
          .maybeSingle();

        if (existing) {
          toast.error('Bu e-posta adresi zaten kayıtlı!');
          return;
        }

        const newStudent = {
          name: formData.name,
          email: formData.email,
          dorm: formData.dorm,
          class: formData.class,
          password: formData.password,
          role: 'student',
        };

        const { data: inserted, error: insertError } = await supabase
          .from('students')
          .insert([newStudent])
          .select()
          .single();

        if (insertError) {
          console.error('Kayıt hatası:', insertError);
          toast.error(`Kayıt başarısız: ${insertError.message}`);
        } else {
          toast.success('Kayıt başarıyla tamamlandı!');
          onLogin({ ...inserted, role: 'student' });
        }
      } catch (err) {
        console.error('Kayıt hatası:', err);
        toast.error('Kayıt sırasında beklenmedik bir hata oluştu');
      }
    }
  };

  const roleConfig = {
    student: { label: 'Öğrenci', gradient: 'from-teal-500 to-emerald-600' },
    teacher: { label: 'Etüt Hocası', gradient: 'from-blue-500 to-indigo-600' },
    chef: { label: 'Mutfak Şefi', gradient: 'from-orange-500 to-amber-600' },
    manager: { label: 'Yemekhane Mesul Hocası', gradient: 'from-purple-500 to-violet-600' },
  };

  const config = roleConfig[role];

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 via-white to-teal-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors duration-500">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-teal-500/5 dark:bg-teal-400/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/5 dark:bg-blue-400/5 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-lg relative z-10">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 mb-8 transition-colors font-medium group"
        >
          <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          Role Seçimine Dön
        </button>

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="card relative overflow-hidden"
        >
          {/* Top gradient bar */}
          <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${config.gradient}`}></div>

          <div className="text-center mb-8 pt-2">
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">
              {config.label} {isLogin ? 'Girişi' : 'Kaydı'}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Devam etmek için bilgilerinizi girin</p>
          </div>

          <form onSubmit={handleAction} className="space-y-5">

            {/* KAYIT FORMU – yalnızca öğrenci */}
            {role === 'student' && !isLogin ? (
              <>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Ad Soyad</label>
                  <div className="relative">
                    <User className="absolute left-4 top-3.5 text-slate-400 dark:text-slate-500" size={20} />
                    <input
                      type="text"
                      required
                      placeholder="Örn: Ahmet Yılmaz"
                      className="input-field pl-12"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">E-posta Adresi</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-3.5 text-slate-400 dark:text-slate-500" size={20} />
                    <input
                      type="email"
                      required
                      placeholder="ornek@ogrenci.com"
                      className="input-field pl-12"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Yurt</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-3.5 text-slate-400 dark:text-slate-500" size={20} />
                      <select
                        required
                        className="input-field pl-12 appearance-none"
                        value={formData.dorm}
                        onChange={(e) => setFormData({ ...formData, dorm: e.target.value })}
                      >
                        <option value="">Seçiniz</option>
                        {DORMS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Sınıf</label>
                    <div className="relative">
                      <School className="absolute left-4 top-3.5 text-slate-400 dark:text-slate-500" size={20} />
                      <select
                        required
                        className="input-field pl-12 appearance-none"
                        value={formData.class}
                        onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                      >
                        <option value="">Seçiniz</option>
                        {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* GİRİŞ FORMU – tüm roller */
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">
                  {role === 'student' ? 'E-posta Adresi' : 'Kullanıcı Adı'}
                </label>
                <div className="relative">
                  {role === 'student'
                    ? <Mail className="absolute left-4 top-3.5 text-slate-400 dark:text-slate-500" size={20} />
                    : <User className="absolute left-4 top-3.5 text-slate-400 dark:text-slate-500" size={20} />
                  }
                  <input
                    type={role === 'student' ? 'email' : 'text'}
                    required
                    placeholder={role === 'student' ? 'ornek@ogrenci.com' : 'Kullanıcı adınız'}
                    className="input-field pl-12"
                    value={role === 'student' ? formData.email : formData.username}
                    onChange={(e) => setFormData({
                      ...formData,
                      [role === 'student' ? 'email' : 'username']: e.target.value,
                    })}
                  />
                </div>
              </div>
            )}

            {/* ŞIFRE – her zaman göster */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Şifre</label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 text-slate-400 dark:text-slate-500" size={20} />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="input-field pl-12"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
            </div>

            <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2 group mt-4">
              {isLogin ? 'Giriş Yap' : 'Kayıt Ol'}
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          {role === 'student' && (
            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700/50 text-center">
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                {isLogin ? 'Henüz hesabın yok mu?' : 'Zaten hesabın var mı?'}
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="ml-2 text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-bold underline underline-offset-4"
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
