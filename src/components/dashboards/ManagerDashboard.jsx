import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Building2, BarChart3, Users, 
  ArrowUpRight, ArrowDownRight, Search, Send, MessageSquare 
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { 
  STORAGE_KEYS, getFromStorage, saveToStorage, 
  DORMS, PORTION_VALUES 
} from '../../utils/storage';

const ManagerDashboard = ({ user }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMeal, setSelectedMeal] = useState('lunch');
  const [dormData, setDormData] = useState([]);
  const [stats, setStats] = useState({ totalStudents: 0, totalPortions: 0, publishedMenus: 0 });
  const [message, setMessage] = useState('');

  const relevantDorms = user.dorm 
    ? DORMS.filter(d => d.id === user.dorm)
    : DORMS;

  useEffect(() => {
    const allUsers = getFromStorage(STORAGE_KEYS.USERS);
    const allMenus = getFromStorage(STORAGE_KEYS.MENUS);
    const allPrefs = getFromStorage(STORAGE_KEYS.PREFERENCES);
    const allCons = getFromStorage(STORAGE_KEYS.CONSUMPTION);

    const data = relevantDorms.map(dorm => {
      const menuId = `${selectedDate}_${selectedMeal}_${dorm.id}`;
      const menu = allMenus.find(m => m.id === menuId);
      const dormPrefs = allPrefs.filter(p => p.menuId === menuId);
      const consumption = allCons.find(c => c.menuId === menuId);

      const totals = dormPrefs.reduce((acc, curr) => {
        acc.soup += PORTION_VALUES[curr.selections?.soup] || 0;
        acc.main += PORTION_VALUES[curr.selections?.main] || 0;
        acc.side += PORTION_VALUES[curr.selections?.side] || 0;
        acc.extra += PORTION_VALUES[curr.selections?.extra] || 0;
        return acc;
      }, { soup: 0, main: 0, side: 0, extra: 0 });

      return {
        ...dorm,
        hasMenu: !!menu,
        submissionCount: dormPrefs.length,
        predicted: totals,
        actual: consumption?.values || null
      };
    });

    setDormData(data);

    // Global Stats
    setStats({
      totalStudents: allUsers.filter(u => u.role === 'student').length,
      totalPortions: data.reduce((acc, d) => acc + d.predicted.main, 0),
      publishedMenus: data.filter(d => d.hasMenu).length
    });
  }, [selectedDate, selectedMeal]);

  const handleSendMessage = () => {
    if (!message.trim()) return;
    const allMessages = getFromStorage(STORAGE_KEYS.MESSAGES);
    const newMessage = {
      id: Date.now(),
      senderId: user.id,
      senderName: user.name,
      dormId: user.dorm,
      content: message,
      timestamp: new Date().toISOString(),
      read: false
    };
    saveToStorage(STORAGE_KEYS.MESSAGES, [...allMessages, newMessage]);
    setMessage('');
    toast.success('Mesaj mutfağa iletildi!');
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Filters & Stats */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <div className="w-full lg:w-1/3 space-y-6">
          <div className="card space-y-6">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Search size={20} className="text-purple-600" />
              Görünüm Filtresi
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase">Tarih</label>
                <input 
                  type="date" 
                  className="input-field"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase">Öğün</label>
                <div className="flex gap-2">
                  {['lunch', 'dinner'].map(m => (
                    <button
                      key={m}
                      onClick={() => setSelectedMeal(m)}
                      className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all border ${
                        selectedMeal === m 
                        ? 'bg-purple-600 border-purple-600 text-white' 
                        : 'bg-white border-slate-200 text-slate-500'
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
              { label: 'Toplam Öğrenci', value: stats.totalStudents, icon: Users, color: 'bg-blue-500' },
              { label: 'Tahmini Ana Yemek', value: stats.totalPortions, icon: BarChart3, color: 'bg-purple-500' },
              { label: 'Yayınlanan Menüler', value: `${stats.publishedMenus}/${relevantDorms.length}`, icon: Building2, color: 'bg-emerald-500' },
            ].map((s, i) => (
              <div key={i} className="card !p-4 flex items-center gap-4">
                <div className={`w-10 h-10 ${s.color} text-white rounded-xl flex items-center justify-center`}>
                  <s.icon size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">{s.label}</p>
                  <p className="text-xl font-black text-slate-800">{s.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Kitchen Feedback Card */}
          <div className="card space-y-4 border-purple-100 bg-purple-50/20">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <MessageSquare size={18} className="text-purple-600" />
              Mutfağa Not Gönder
            </h3>
            <p className="text-xs text-slate-500">Yemek kalitesi, tuz oranı veya diğer geri bildirimlerinizi doğrudan şefe iletin.</p>
            <div className="space-y-3">
              <textarea 
                className="input-field min-h-[100px] !bg-white resize-none text-sm"
                placeholder="Örn: Bu akşamki yemek çok tuzluydu, dikkat edelim..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <button 
                onClick={handleSendMessage}
                className="btn-primary !bg-purple-600 hover:!bg-purple-700 w-full flex items-center justify-center gap-2 py-3"
              >
                <Send size={18} />
                Mutfağa İlet
              </button>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-2/3 space-y-4">
          <h2 className="text-2xl font-black text-slate-900 px-2">Yurt Bazlı Raporlar</h2>
          
          <div className="grid grid-cols-1 gap-4">
            {dormData.map((dorm) => (
              <motion.div 
                layout
                key={dorm.id}
                className="card flex flex-col md:flex-row items-center gap-6 group hover:border-purple-200 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="font-bold text-lg text-slate-800">{dorm.name}</h4>
                    {dorm.hasMenu ? (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-200">MENÜ VAR</span>
                    ) : (
                      <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-[10px] font-bold rounded-full border border-rose-200">MENÜ YOK</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-400 font-medium">{dorm.submissionCount} öğrenci tercih bildirdi</p>
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
                      <div key={cat.key} className="text-center min-w-[80px]">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">{cat.label}</p>
                        <p className="text-lg font-black text-slate-800">{dorm.predicted[cat.key]}</p>
                        {diff !== null && (
                          <div className={`flex items-center justify-center gap-0.5 text-[10px] font-bold ${diff >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
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

          {/* 30-Day Menu List Card */}
          <div className="card space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-800">Aylık Yemek Listesi Raporu</h3>
              <span className="text-xs font-bold text-slate-400 uppercase">Seçili Ay: {new Date(selectedDate).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 font-bold">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-xl">Tarih</th>
                    <th className="px-4 py-3">Yurt</th>
                    <th className="px-4 py-3">Öğün</th>
                    <th className="px-4 py-3">Menü İçeriği</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(() => {
                    const allMenus = getFromStorage(STORAGE_KEYS.MENUS);
                    const selectedMonth = selectedDate.substring(0, 7);
                    const monthlyMenus = allMenus
                      .filter(m => {
                        const isMatch = m.date.startsWith(selectedMonth);
                        if (user.dorm) return isMatch && m.dorm === user.dorm;
                        return isMatch;
                      })
                      .sort((a, b) => a.date.localeCompare(b.date) || a.meal.localeCompare(b.meal));
                    
                    if (monthlyMenus.length === 0) {
                      return (
                        <tr>
                          <td colSpan="4" className="px-4 py-8 text-center text-slate-400 italic">
                            Bu ay için yayınlanmış menü bulunamadı.
                          </td>
                        </tr>
                      );
                    }

                    return monthlyMenus.map((m, idx) => {
                      const dormName = DORMS.find(d => d.id === m.dorm)?.name || m.dorm;
                      return (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3 font-bold text-slate-700 whitespace-nowrap">
                            {new Date(m.date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })}
                          </td>
                          <td className="px-4 py-3 text-slate-500 text-xs">{dormName}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              m.meal === 'lunch' ? 'bg-orange-100 text-orange-700' : 'bg-indigo-100 text-indigo-700'
                            }`}>
                              {m.meal === 'lunch' ? 'Öğle' : 'Akşam'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-slate-600 text-xs">
                              <span className="font-bold">{m.soup}</span>, {m.mainCourse}, {m.sideDish}, {m.extra}
                            </div>
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
