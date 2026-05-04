import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Send, CheckCircle2, UtensilsCrossed, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { toast } from 'react-hot-toast';
import { PORTION_LABELS } from '../../utils/storage';
import { supabase } from '../../utils/supabase';

const StudentDashboard = ({ user }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMeal, setSelectedMeal] = useState('lunch');
  const [menu, setMenu] = useState(null);
  const [selections, setSelections] = useState({ soup: 'Normal', main: 'Normal', side: 'Normal', extra: 'Normal' });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const menuId = `${selectedDate}_${selectedMeal}_${user.dorm}`;
        const { data: menuData, error: menuError } = await supabase.from('menus').select('*').eq('id', menuId).single();
        if (menuError && menuError.code !== 'PGRST116') console.error("Menü çekme hatası:", menuError);
        if (menuData) setMenu({ ...menuData.items, ...menuData }); 
        else setMenu(null);

        const { data: prefData, error: prefError } = await supabase.from('preferences').select('*').eq('user_id', user.id).eq('menu_id', menuId).single();
        if (prefError && prefError.code !== 'PGRST116') console.error("Tercih çekme hatası:", prefError);
        if (prefData) { setSelections(JSON.parse(prefData.portion)); setIsSubmitted(true); }
        else { setSelections({ soup: 'Normal', main: 'Normal', side: 'Normal', extra: 'Normal' }); setIsSubmitted(false); }
      } catch (err) { console.error("Veri çekme hatası:", err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [selectedDate, selectedMeal, user.id, user.dorm]);

  const handleSubmit = async () => {
    const menuId = `${selectedDate}_${selectedMeal}_${user.dorm}`;
    try {
      const { error } = await supabase.from('preferences').upsert({ id: `${user.id}_${menuId}`, menu_id: menuId, user_id: user.id, portion: JSON.stringify(selections) });
      if (error) throw error;
      setIsSubmitted(true);
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#14b8a6', '#2dd4bf', '#10b981'] });
      toast.success('Tercihleriniz mutfakla başarıyla paylaşıldı!');
    } catch (err) { console.error("Tercih kaydetme hatası:", err); toast.error('Tercihler kaydedilirken hata oluştu.'); }
  };

  const categories = [
    { id: 'soup', label: 'Çorba', dish: menu?.soup },
    { id: 'main', label: 'Ana Yemek', dish: menu?.mainCourse },
    { id: 'side', label: 'Yan Ürün', dish: menu?.sideDish },
    { id: 'extra', label: 'Tatlı / Meyve / İçecek', dish: menu?.extra },
  ];

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card !p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-2xl flex items-center justify-center"><Calendar size={24} /></div>
          <div className="flex-1">
            <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Tarih</label>
            <input type="date" className="w-full bg-transparent font-bold text-slate-700 dark:text-slate-200 outline-none" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
          </div>
        </div>
        <div className="card !p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-2xl flex items-center justify-center"><Clock size={24} /></div>
          <div className="flex-1">
            <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Öğün</label>
            <div className="flex gap-3 mt-1">
              {['lunch', 'dinner'].map(meal => (
                <button key={meal} onClick={() => setSelectedMeal(meal)}
                  className={`text-sm font-bold px-4 py-1.5 rounded-xl transition-all duration-300 ${selectedMeal === meal ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-lg shadow-teal-500/25' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}>
                  {meal === 'lunch' ? 'Öğle' : 'Akşam'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20 text-teal-600 dark:text-teal-400"><Loader2 size={40} className="animate-spin" /></div>
      ) : !menu ? (
        <div className="card flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 bg-slate-50 dark:bg-slate-700/50 text-slate-300 dark:text-slate-600 rounded-3xl flex items-center justify-center mb-6"><UtensilsCrossed size={40} /></div>
          <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">Henüz Menü Yayınlanmadı</h3>
          <p className="text-slate-400 dark:text-slate-500">Mutfak şefi bu tarih ve öğün için henüz menü oluşturmadı.</p>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {categories.map((cat) => (
            <div key={cat.id} className="card relative overflow-hidden group hover:shadow-xl dark:hover:shadow-teal-500/5 transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50 dark:bg-teal-500/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-125 duration-500"></div>
              <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="inline-block px-3 py-1 bg-teal-100 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400 text-[10px] font-bold uppercase tracking-widest rounded-full mb-2">{cat.label}</span>
                  <h3 className="text-xl font-extrabold text-slate-800 dark:text-white">{cat.dish}</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {PORTION_LABELS.map(label => (
                    <button key={label} disabled={isSubmitted} onClick={() => setSelections({...selections, [cat.id]: label})}
                      className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 border-2 ${selections[cat.id] === label ? 'bg-gradient-to-r from-teal-500 to-emerald-600 border-teal-500 text-white shadow-lg shadow-teal-500/20' : 'bg-white dark:bg-slate-700/50 border-slate-100 dark:border-slate-600 text-slate-400 hover:border-teal-300 dark:hover:border-teal-500/50 hover:text-teal-600 dark:hover:text-teal-400'} ${isSubmitted ? 'cursor-default' : 'active:scale-95'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
          <div className="flex justify-center pt-4">
            {isSubmitted ? (
              <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-8 py-4 rounded-2xl border border-emerald-100 dark:border-emerald-500/20 font-bold shadow-lg"><CheckCircle2 size={24} />Tercihleriniz Kaydedildi</div>
            ) : (
              <button onClick={handleSubmit} className="btn-primary flex items-center gap-3 px-12 py-5 text-lg rounded-2xl group">
                Bildirimi Mutfakla Paylaş <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </button>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default StudentDashboard;
