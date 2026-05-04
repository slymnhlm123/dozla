import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Building2, BarChart3, Users, 
  ArrowUpRight, ArrowDownRight, Search, Send, MessageSquare, Loader2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { 
  DORMS, PORTION_VALUES 
} from '../../utils/storage';
import { supabase } from '../../utils/supabase';

const ManagerDashboard = ({ user }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMeal, setSelectedMeal] = useState('lunch');
  const [dormData, setDormData] = useState([]);
  const [stats, setStats] = useState({ totalStudents: 0, totalPortions: 0, publishedMenus: 0 });
  const [message, setMessage] = useState('');
  const [monthlyMenus, setMonthlyMenus] = useState([]);
  const [loading, setLoading] = useState(true);

  const relevantDorms = user.dorm 
    ? DORMS.filter(d => d.id === user.dorm)
    : DORMS;

  useEffect(() => {
    const fetchManagerData = async () => {
      setLoading(true);
      try {
        const monthPrefix = selectedDate.substring(0, 7);

        const { data: allUsers } = await supabase.from('students').select('id');
        const studentsCount = allUsers ? allUsers.length : 0;
        const { data: monthMenus } = await supabase.from('menus').select('*').like('date', `${monthPrefix}%`);
        
        const { data: allPrefs } = await supabase.from('preferences').select('*');
        const { data: allCons } = await supabase.from('consumption').select('*');

        const data = relevantDorms.map(dorm => {
          const menuId = `${selectedDate}_${selectedMeal}_${dorm.id}`;
          const menu = monthMenus?.find(m => m.id === menuId);
          const dormPrefs = allPrefs?.filter(p => p.menu_id === menuId) || [];
          const consumption = allCons?.find(c => c.menu_id === menuId);

          const totals = dormPrefs.reduce((acc, curr) => {
            const sels = JSON.parse(curr.portion);
            acc.soup += PORTION_VALUES[sels?.soup] || 0;
            acc.main += PORTION_VALUES[sels?.main] || 0;
            acc.side += PORTION_VALUES[sels?.side] || 0;
            acc.extra += PORTION_VALUES[sels?.extra] || 0;
            return acc;
          }, { soup: 0, main: 0, side: 0, extra: 0 });

          return {
            ...dorm,
            hasMenu: !!menu,
            submissionCount: dormPrefs.length,
            predicted: totals,
            actual: consumption ? JSON.parse(consumption.portions_consumed) : null
          };
        });

        setDormData(data);

        setStats({
          totalStudents: studentsCount,
          totalPortions: data.reduce((acc, d) => acc + d.predicted.main, 0),
          publishedMenus: data.filter(d => d.hasMenu).length
        });

        if (monthMenus) {
           const filtered = monthMenus
              .filter(m => user.dorm ? m.dorm === user.dorm : true)
              .map(m => ({ ...m.items, date: m.date, dorm: m.dorm }));
           filtered.sort((a, b) => a.date.localeCompare(b.date) || a.meal.localeCompare(b.meal));
           setMonthlyMenus(filtered);
        }
      } catch (err) {
        console.error("Yönetici verileri alınırken hata:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchManagerData();
  }, [selectedDate, selectedMeal]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
    const { error } = await supabase.from('messages').insert({
      sender_name: user.name || 'Mesul Hoca',
      sender_dorm: user.dorm || null,
      content: message.trim(),
      read: false,
    });

    if (error) {
      console.error('Mesaj gönderilemedi:', error);
      toast.error('Mesaj gönderilemedi: ' + error.message);
    } else {
      toast.success('Mesaj mutfağa iletildi!');
      setMessage('');
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Filters & Stats */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <div className="w-full lg:w-1/3 space-y-6">
          <div className="card space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 dark:bg-purple-500/5 rounded-full -mr-16 -mt-16 pointer-events-none"></div>

            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 relative z-10">
              <Search size={20} className="text-purple-600 dark:text-purple-400" />
              Görünüm Filtresi
            </h3>
            
            <div className="space-y-4 relative z-10">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Tarih</label>
                <input 
                  type="date" 
                  className="input-field"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Öğün</label>
                <div className="flex gap-2">
                  {['lunch', 'dinner'].map(m => (
                    <button
                      key={m}
                      onClick={() => setSelectedMeal(m)}
                      className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all border shadow-sm ${
                        selectedMeal === m 
                        ? 'bg-gradient-to-r from-purple-500 to-violet-600 border-purple-500 text-white shadow-purple-500/20' 
                        : 'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 text-slate-500 dark:text-slate-400 hover:border-purple-300 dark:hover:border-purple-500/50 hover:text-purple-600 dark:hover:text-purple-400'
                      }`}
                    >
                      {m === 'lunch' ? 'Öğle' : 'Akşam'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {[
              { label: 'Toplam Öğrenci', value: stats.totalStudents, icon: Users, color: 'from-blue-500 to-indigo-600' },
              { label: 'Tahmini Ana Yemek', value: stats.totalPortions, icon: BarChart3, color: 'from-purple-500 to-violet-600' },
              { label: 'Yayınlanan Menüler', value: `${stats.publishedMenus}/${relevantDorms.length}`, icon: Building2, color: 'from-emerald-500 to-teal-600' },
            ].map((s, i) => (
              <div key={i} className="card !p-4 flex items-center gap-4 hover:scale-[1.02] transition-transform">
                <div className={`w-12 h-12 bg-gradient-to-br ${s.color} text-white rounded-xl flex items-center justify-center shadow-lg`}>
                  <s.icon size={24} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">{s.label}</p>
                  <p className="text-2xl font-black text-slate-800 dark:text-white">{s.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Kitchen Feedback Card */}
          <div className="card space-y-4 border-purple-100 dark:border-purple-500/20 bg-purple-50/20 dark:bg-purple-500/5 group">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <MessageSquare size={18} className="text-purple-600 dark:text-purple-400" />
              Mutfağa Not Gönder
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Yemek kalitesi, tuz oranı veya diğer geri bildirimlerinizi doğrudan şefe iletin.</p>
            <div className="space-y-3">
              <textarea 
                className="input-field min-h-[100px] resize-none text-sm focus:ring-purple-500/20 focus:border-purple-500 dark:focus:border-purple-400"
                placeholder="Örn: Bu akşamki yemek çok tuzluydu, dikkat edelim..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <button 
                onClick={handleSendMessage}
                className="btn-primary !bg-gradient-to-r !from-purple-500 !to-violet-600 w-full flex items-center justify-center gap-2 py-3 shadow-purple-500/20 group-hover:shadow-lg transition-all"
              >
                <Send size={18} />
                Mutfağa İlet
              </button>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-2/3 space-y-4">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white px-2">Yurt Bazlı Raporlar</h2>
          
          {loading ? (
             <div className="flex justify-center items-center py-20 text-purple-600 dark:text-purple-400">
               <Loader2 size={40} className="animate-spin" />
             </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {dormData.map((dorm) => (
                <motion.div 
                  layout
                  key={dorm.id}
                  className="card flex flex-col md:flex-row items-center gap-6 group hover:border-purple-300 dark:hover:border-purple-500/30 transition-all hover:shadow-xl dark:hover:shadow-purple-500/5"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="font-bold text-lg text-slate-800 dark:text-white">{dorm.name}</h4>
                      {dorm.hasMenu ? (
                        <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-200 dark:border-emerald-500/30 uppercase tracking-wider">Menü Var</span>
                      ) : (
                        <span className="px-2 py-0.5 bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 text-[10px] font-bold rounded-full border border-rose-200 dark:border-rose-500/30 uppercase tracking-wider">Menü Yok</span>
                      )}
                    </div>
                    <p className="text-sm text-slate-400 dark:text-slate-500 font-medium">{dorm.submissionCount} öğrenci tercih bildirdi</p>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full md:w-auto">
                    {[
                      { label: 'Çorba', key: 'soup' },
                      { label: 'Ana Yemek', key: 'main' },
                      { label: 'Yan Ürün', key: 'side' },
                      { label: 'Ekstra', key: 'extra' },
                    ].map(cat => {
                      const diff = dorm.actual ? (parseFloat(dorm.actual[cat.key]) - dorm.predicted[cat.key]) : null;
                      return (
                        <div key={cat.key} className="text-center min-w-[80px] p-2 rounded-xl bg-slate-50/50 dark:bg-slate-800/30">
                          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1 tracking-wider">{cat.label}</p>
                          <p className="text-xl font-black text-slate-800 dark:text-slate-200">{dorm.predicted[cat.key]}</p>
                          {diff !== null && (
                            <div className={`flex items-center justify-center gap-0.5 text-[10px] font-bold mt-0.5 ${diff >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                              {diff >= 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                              {Math.abs(diff)}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* 30-Day Menu List Card */}
          <div className="card space-y-4 mt-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/50 pb-4">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Aylık Yemek Listesi Raporu</h3>
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">Seçili Ay: {new Date(selectedDate).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}</span>
            </div>
            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex justify-center items-center py-10 text-purple-600 dark:text-purple-400">
                  <Loader2 size={30} className="animate-spin" />
                </div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-bold">
                    <tr>
                      <th className="px-4 py-3 rounded-tl-xl">Tarih</th>
                      <th className="px-4 py-3">Yurt</th>
                      <th className="px-4 py-3">Öğün</th>
                      <th className="px-4 py-3 rounded-tr-xl">Menü İçeriği</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                    {(() => {
                      if (monthlyMenus.length === 0) {
                        return (
                          <tr>
                            <td colSpan="4" className="px-4 py-8 text-center text-slate-400 dark:text-slate-500 italic">
                              Bu ay için yayınlanmış menü bulunamadı.
                            </td>
                          </tr>
                        );
                      }

                      return monthlyMenus.map((m, idx) => {
                        const dormName = DORMS.find(d => d.id === m.dorm)?.name || m.dorm;
                        return (
                          <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                              {new Date(m.date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })}
                            </td>
                            <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs font-medium">{dormName}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                m.meal === 'lunch' ? 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400' : 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400'
                              }`}>
                                {m.meal === 'lunch' ? 'Öğle' : 'Akşam'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-slate-600 dark:text-slate-300 text-xs">
                                <span className="font-bold">{m.soup}</span>, {m.mainCourse}, {m.sideDish}, {m.extra}
                              </div>
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
