import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChefHat, Plus, History, PieChart,
  ChevronRight, Save, TrendingUp, AlertCircle,
  MessageSquare, Bell, Loader2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  DORMS, PORTION_VALUES
} from '../../utils/storage';
import { supabase } from '../../utils/supabase';
import * as XLSX from 'xlsx';

const ChefDashboard = ({ user }) => {
  const [activeTab, setActiveTab] = useState('menu'); // 'menu', 'report', 'feedback'
  const [selectedDorm, setSelectedDorm] = useState(DORMS[0].id);
  const [menuData, setMenuData] = useState({
    date: new Date().toISOString().split('T')[0],
    meal: 'lunch',
    soup: '',
    mainCourse: '',
    sideDish: '',
    extra: ''
  });

  const [liveReport, setLiveReport] = useState({ soup: 0, main: 0, side: 0, count: 0 });
  const [feedbackData, setFeedbackData] = useState({ soup: '', main: '', side: '' });
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [monthlyMenus, setMonthlyMenus] = useState([]);

  useEffect(() => {
    const fetchChefData = async () => {
      const menuId = `${menuData.date}_${menuData.meal}_${selectedDorm}`;

      // Calculate live report
      const { data: relevantPrefs } = await supabase.from('preferences').select('*').eq('menu_id', menuId);
      let soup = 0, main = 0, side = 0, extra = 0, count = 0;

      if (relevantPrefs) {
        relevantPrefs.forEach(curr => {
          const sels = JSON.parse(curr.portion);
          soup += PORTION_VALUES[sels?.soup] || 0;
          main += PORTION_VALUES[sels?.main] || 0;
          side += PORTION_VALUES[sels?.side] || 0;
          extra += PORTION_VALUES[sels?.extra] || 0;
          count += 1;
        });
      }
      setLiveReport({ soup, main, side, extra, count });

      // Load existing menu
      const { data: existingMenu } = await supabase.from('menus').select('*').eq('id', menuId).single();
      if (existingMenu) {
        setMenuData({ ...existingMenu.items, date: existingMenu.date, meal: existingMenu.items.meal || menuData.meal });
      } else {
        setMenuData({ ...menuData, soup: '', mainCourse: '', sideDish: '', extra: '' });
      }

      // Load existing consumption for feedback
      const { data: existingCons } = await supabase.from('consumption').select('*').eq('menu_id', menuId).single();
      if (existingCons) {
        setFeedbackData(JSON.parse(existingCons.portions_consumed));
      } else {
        setFeedbackData({ soup: '', main: '', side: '' });
      }

    };


    fetchChefData();
  }, [menuData.date, menuData.meal, selectedDorm]);

  // Mesajları Supabase'den çek
  useEffect(() => {
    let prevCount = 0;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Mesajlar alınırken hata:', error);
        return;
      }

      if (data) {
        const formatted = data.map(m => ({
          id: m.id,
          senderName: m.sender_name,
          senderDorm: m.sender_dorm,
          content: m.content,
          read: m.read,
          timestamp: m.created_at,
        }));

        // Yeni mesaj geldiğinde bildirim göster
        const newUnread = formatted.filter(m => !m.read).length;
        if (newUnread > prevCount && prevCount !== 0) {
          toast('🔔 Yeni mesaj geldi!', { icon: '📩' });
        }
        prevCount = newUnread;

        setMessages(formatted);
        setUnreadCount(newUnread);
      }
    };

    fetchMessages();

    // Realtime subscription - yeni mesajlar geldiğinde otomatik güncelle
    const channel = supabase
      .channel('messages-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        fetchMessages();
      })
      .subscribe();

    // Polling fallback - realtime çalışmasa bile 30 saniyede bir kontrol et
    const pollInterval = setInterval(fetchMessages, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, []);

  // Yeni useEffect: Aylık raporu getirmek için
  useEffect(() => {
    if (activeTab === 'report') {
      const fetchMonthly = async () => {
        const monthPrefix = menuData.date.substring(0, 7);
        const { data } = await supabase.from('menus').select('*').eq('dorm', selectedDorm).like('date', `${monthPrefix}%`);
        if (data) {
          const formatted = data.map(m => ({ ...m.items, date: m.date, dorm: m.dorm }));
          formatted.sort((a, b) => a.date.localeCompare(b.date) || a.meal.localeCompare(b.meal));
          setMonthlyMenus(formatted);
        }
      };
      fetchMonthly();
    }
  }, [activeTab, menuData.date, selectedDorm]);

  const handleSaveMenu = async (e) => {
    e.preventDefault();
    const menuId = `${menuData.date}_${menuData.meal}_${selectedDorm}`;

    const items = {
      meal: menuData.meal,
      soup: menuData.soup,
      mainCourse: menuData.mainCourse,
      sideDish: menuData.sideDish,
      extra: menuData.extra
    };

    const { error } = await supabase.from('menus').upsert({
      id: menuId,
      date: menuData.date,
      items: items,
      dorm: selectedDorm
    });

    if (error) {
      toast.error('Menü kaydedilirken hata oluştu!');
      console.error(error);
    } else {
      toast.success('Menü başarıyla yayınlandı!');
    }
  };

  const handleSaveFeedback = async () => {
    const menuId = `${menuData.date}_${menuData.meal}_${selectedDorm}`;

    const { error } = await supabase.from('consumption').upsert({
      id: menuId,
      menu_id: menuId,
      portions_consumed: JSON.stringify(feedbackData),
      leftover: 0
    });

    if (error) {
      toast.error('Geri dönüş raporu kaydedilemedi!');
    } else {
      toast.success('Geri dönüş raporu kaydedildi!');
    }
  };

  const markAsRead = async (id) => {
    const { error } = await supabase
      .from('messages')
      .update({ read: true })
      .eq('id', id);

    if (!error) {
      setMessages(prev => prev.map(m => m.id === id ? { ...m, read: true } : m));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const TURKISH_MONTHS = {

    'OCAK': '01', 'SUBAT': '02', 'ŞUBAT': '02', 'MART': '03', 'NISAN': '04', 'NİSAN': '04',
    'MAYIS': '05', 'HAZIRAN': '06', 'HAZİRAN': '06', 'TEMMUZ': '07', 'AGUSTOS': '08', 'AĞUSTOS': '08',
    'EYLUL': '09', 'EYLÜL': '09', 'EKIM': '10', 'EKİM': '10', 'KASIM': '11', 'ARALIK': '12'
  };


  const handleExcelUpload = (e, mealType) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary', cellDates: true });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];

        const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
        const newMenus = [];

        for (let r = 0; r < rows.length; r++) {
          const currentRow = rows[r];
          if (!currentRow) continue;

          for (let c = 0; c < currentRow.length; c++) {
            let cellValue = currentRow[c];
            if (!cellValue) continue;

            let formattedDate = null;
            if (cellValue instanceof Date) {
              const y = cellValue.getFullYear();
              const m = String(cellValue.getMonth() + 1).padStart(2, '0');
              const d = String(cellValue.getDate()).padStart(2, '0');
              formattedDate = `${y}-${m}-${d}`;
            } else {
              const strVal = String(cellValue).trim().toUpperCase();
              const dateMatch = strVal.match(/^(\d{1,2})\s+([A-ZÇĞİÖŞÜ]+)\s+(\d{4})/);
              if (dateMatch) {
                const day = dateMatch[1].padStart(2, '0');
                const month = TURKISH_MONTHS[dateMatch[2]];
                if (month) formattedDate = `${dateMatch[3]}-${month}-${day}`;
              }
              if (!formattedDate) {
                const standardMatch = strVal.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})/);
                if (standardMatch) {
                  formattedDate = `${standardMatch[3]}-${standardMatch[2].padStart(2, '0')}-${standardMatch[1].padStart(2, '0')}`;
                }
              }
            }

            if (formattedDate) {
              const items = [];
              for (let i = 1; i <= 4; i++) {
                if (rows[r + i] && rows[r + i][c]) {
                  let item = String(rows[r + i][c]).trim();
                  item = item.replace(/\s*\(\s*\d+\s*KCAL\s*\)/i, '').trim();
                  if (item && !['RESMİ TATİL', 'TATİL'].includes(item.toUpperCase())) {
                    items.push(item);
                  }
                }
              }

              if (items.length > 0) {
                newMenus.push({
                  id: `${formattedDate}_${mealType}_${selectedDorm}`,
                  date: formattedDate,
                  dorm: selectedDorm,
                  items: {
                    meal: mealType,
                    soup: items[0] || '',
                    mainCourse: items[1] || '',
                    sideDish: items[2] || '',
                    extra: items[3] || '',
                  }
                });
              }
            }
          }
        }

        if (newMenus.length === 0) {
          toast.error('Excel dosyasında uygun formatta menü bulunamadı.');
          return;
        }

        const { error } = await supabase.from('menus').upsert(newMenus);
        if (error) throw error;

        toast.success(`${newMenus.length} günlük ${mealType === 'lunch' ? 'Öğle' : 'Akşam'} menüsü başarıyla yüklendi!`);

        // Yeniden yüklemek için seçili günü tetikle
        setMenuData({ ...menuData });
      } catch (err) {
        console.error('Excel Error:', err);
        toast.error('Excel dosyası işlenirken hata oluştu.');
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Role Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/50 rounded-2xl w-fit border border-slate-200 dark:border-slate-700">
        {[
          { id: 'menu', label: 'Menü Yönetimi', icon: Plus },
          { id: 'report', label: 'İhtiyaç Raporu', icon: PieChart },
          { id: 'feedback', label: 'Geri Dönüş', icon: History },
          { id: 'messages', label: `Mesajlar ${unreadCount > 0 ? `(${unreadCount})` : ''}`, icon: MessageSquare }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === tab.id
              ? 'bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Dorm & Date Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card !p-3">
          <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">Yurt Seçimi</label>
          <select
            className="w-full bg-transparent font-bold text-slate-700 dark:text-slate-200 outline-none"
            value={selectedDorm}
            onChange={(e) => setSelectedDorm(e.target.value)}
          >
            {DORMS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <div className="card !p-3">
          <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">Tarih</label>
          <input
            type="date"
            className="w-full bg-transparent font-bold text-slate-700 dark:text-slate-200 outline-none"
            value={menuData.date}
            onChange={(e) => setMenuData({ ...menuData, date: e.target.value })}
          />
        </div>
        <div className="card !p-3 flex items-center gap-4">
          <div className="flex-1">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">Öğün</label>
            <div className="flex gap-2">
              {['lunch', 'dinner'].map(m => (
                <button
                  key={m}
                  onClick={() => setMenuData({ ...menuData, meal: m })}
                  className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all ${menuData.meal === m ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md shadow-orange-500/20' : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                    }`}
                >
                  {m === 'lunch' ? 'Öğle' : 'Akşam'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'menu' && (
          <motion.div
            key="menu-mgmt"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Excel Upload Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card border-dashed border-2 border-orange-200 dark:border-orange-500/30 bg-orange-50/20 dark:bg-orange-500/5 p-6 text-center group hover:border-orange-400 dark:hover:border-orange-400/50 transition-all">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 bg-white dark:bg-slate-800 text-orange-600 dark:text-orange-400 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <TrendingUp size={24} />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200">Öğle Menüsü Yükle</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">30 Günlük Öğle Yemeği Listesi (Excel)</p>
                  </div>
                  <label className="btn-primary !bg-gradient-to-r !from-orange-500 !to-amber-600 cursor-pointer flex items-center gap-2 px-6 py-2 text-sm shadow-orange-500/20">
                    <Plus size={16} />
                    Dosya Seç
                    <input
                      type="file"
                      className="hidden"
                      accept=".xlsx, .xls"
                      onChange={(e) => handleExcelUpload(e, 'lunch')}
                    />
                  </label>
                </div>
              </div>

              <div className="card border-dashed border-2 border-indigo-200 dark:border-indigo-500/30 bg-indigo-50/20 dark:bg-indigo-500/5 p-6 text-center group hover:border-indigo-400 dark:hover:border-indigo-400/50 transition-all">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <TrendingUp size={24} />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200">Akşam Menüsü Yükle</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">30 Günlük Akşam Yemeği Listesi (Excel)</p>
                  </div>
                  <label className="btn-primary !bg-gradient-to-r !from-indigo-500 !to-blue-600 cursor-pointer flex items-center gap-2 px-6 py-2 text-sm shadow-indigo-500/20">
                    <Plus size={16} />
                    Dosya Seç
                    <input
                      type="file"
                      className="hidden"
                      accept=".xlsx, .xls"
                      onChange={(e) => handleExcelUpload(e, 'dinner')}
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Manual Form */}
            <form onSubmit={handleSaveMenu} className="card space-y-6 border-orange-100 dark:border-orange-500/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-orange-50 dark:bg-orange-500/5 rounded-full -mr-32 -mt-32 pointer-events-none"></div>
              
              <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-700/50 pb-4 relative z-10">
                <div className="w-12 h-12 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-2xl flex items-center justify-center">
                  <ChefHat size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">Tekil Menü Düzenle</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                {[
                  { id: 'soup', label: 'Çorba', placeholder: 'Örn: Mercimek Çorbası' },
                  { id: 'mainCourse', label: 'Ana Yemek', placeholder: 'Örn: Orman Kebabı' },
                  { id: 'sideDish', label: 'Yan Ürün', placeholder: 'Örn: Pirinç Pilavı' },
                  { id: 'extra', label: 'Tatlı / Meyve / İçecek', placeholder: 'Örn: Mevsim Salata' },
                ].map(field => (
                  <div key={field.id} className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">{field.label}</label>
                    <input
                      type="text"
                      required
                      placeholder={field.placeholder}
                      className="input-field focus:ring-orange-500/20 focus:border-orange-500 dark:focus:border-orange-400"
                      value={menuData[field.id]}
                      onChange={(e) => setMenuData({ ...menuData, [field.id]: e.target.value })}
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-4 relative z-10">
                <button type="submit" className="btn-primary !bg-gradient-to-r !from-orange-500 !to-amber-600 flex items-center gap-2 shadow-orange-500/20">
                  <Save size={20} />
                  Değişiklikleri Kaydet
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {activeTab === 'report' && (
          <motion.div
            key="report-view"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: 'Bildiren Öğrenci', value: liveReport.count, icon: ChefHat, color: 'text-slate-600 dark:text-slate-300', bg: 'bg-slate-100 dark:bg-slate-700' },
                { label: 'Çorba Porsiyon', value: liveReport.soup, icon: TrendingUp, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-500/10' },
                { label: 'Ana Yemek Porsiyon', value: liveReport.main, icon: TrendingUp, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-500/10' },
                { label: 'Yan Ürün Porsiyon', value: liveReport.side, icon: TrendingUp, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-500/10' },
                { label: 'Extra Porsiyon', value: liveReport.extra, icon: TrendingUp, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-500/10' },
              ].map((stat, idx) => (
                <div key={idx} className="card flex flex-col items-center justify-center py-6 px-2 hover:scale-[1.02] transition-transform">
                  <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-4`}>
                    <stat.icon size={24} />
                  </div>
                  <span className="text-3xl font-black text-slate-900 dark:text-white">{stat.value}</span>
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mt-1 tracking-wider text-center">{stat.label}</span>
                </div>
              ))}
            </div>

            <div className="card border-orange-100 dark:border-orange-500/20 bg-orange-50/30 dark:bg-orange-500/5">
              <div className="flex items-center gap-3 text-orange-700 dark:text-orange-400 mb-4">
                <AlertCircle size={20} />
                <h4 className="font-bold text-sm">Porsiyon Hesaplama Notu</h4>
              </div>
              <p className="text-xs text-orange-600 dark:text-orange-300 leading-relaxed font-medium">
                Porsiyonlar öğrencilerin seçimlerine göre hesaplanır:
                <span className="font-bold"> Bol (1.5)</span>,
                <span className="font-bold"> Normal (1.0)</span>,
                <span className="font-bold"> Az (0.5)</span> ve
                <span className="font-bold"> Yemeyeceğim (0)</span>.
                Toplam değerler hazırlamanız gereken porsiyon miktarını gösterir.
              </p>
            </div>

            {/* 30-Day Menu Report Table */}
            <div className="card space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/50 pb-4">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">30 Günlük Yemek Listesi</h3>
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Öğle ve Akşam Menüleri</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-bold">
                    <tr>
                      <th className="px-4 py-3 rounded-tl-xl">Tarih</th>
                      <th className="px-4 py-3">Öğün</th>
                      <th className="px-4 py-3">Çorba</th>
                      <th className="px-4 py-3">Ana Yemek</th>
                      <th className="px-4 py-3">Yan Ürün</th>
                      <th className="px-4 py-3 rounded-tr-xl">Ekstra</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                    {(() => {
                      if (monthlyMenus.length === 0) {
                        return (
                          <tr>
                            <td colSpan="6" className="px-4 py-8 text-center text-slate-400 dark:text-slate-500 italic">
                              Bu ay için henüz menü yüklenmedi.
                            </td>
                          </tr>
                        );
                      }

                      return monthlyMenus.map((m, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                            {new Date(m.date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', weekday: 'short' })}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${m.meal === 'lunch' ? 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400' : 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400'
                              }`}>
                              {m.meal === 'lunch' ? 'Öğle' : 'Akşam'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{m.soup}</td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-300 font-medium">{m.mainCourse}</td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{m.sideDish}</td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{m.extra}</td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'feedback' && (
          <motion.div
            key="feedback-view"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="card space-y-6 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-teal-50 dark:bg-teal-500/5 rounded-full pointer-events-none"></div>

              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/50 pb-4 relative z-10">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">Geri Dönüş ve Karşılaştırma</h3>
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500">Gerçek tüketilen porsiyonları girin</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                {['soup', 'main', 'side'].map(cat => {
                  const predicted = liveReport[cat];
                  const actual = parseFloat(feedbackData[cat]) || 0;
                  const diff = actual - predicted;

                  return (
                    <div key={cat} className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                          {cat === 'soup' ? 'Gerçek Çorba' : cat === 'main' ? 'Gerçek Ana Yemek' : 'Gerçek Yan Ürün'}
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          placeholder="0.0"
                          className="input-field"
                          value={feedbackData[cat]}
                          onChange={(e) => setFeedbackData({ ...feedbackData, [cat]: e.target.value })}
                        />
                      </div>

                      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex items-center justify-between border border-slate-100 dark:border-slate-700/50">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block">Fark</span>
                          <span className={`text-lg font-black ${diff >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                            {diff > 0 ? `+${diff}` : diff}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block">Beklenen</span>
                          <span className="text-lg font-black text-slate-700 dark:text-slate-300">{predicted}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-700/50 relative z-10">
                <button
                  onClick={handleSaveFeedback}
                  className="btn-primary !bg-gradient-to-r !from-orange-500 !to-amber-600 flex items-center gap-2 shadow-orange-500/20"
                >
                  <Save size={20} />
                  Raporu Kaydet
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'messages' && (
          <motion.div
            key="messages-view"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between px-2">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">Mesul Hoca Bildirimleri</h3>
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500">Yurttan gelen son geri bildirimler</span>
            </div>

            {messages.length === 0 ? (
              <div className="card flex flex-col items-center justify-center py-20 text-center text-slate-400 dark:text-slate-500 border-dashed border-2 dark:border-slate-700">
                <Bell size={48} className="mb-4 opacity-20" />
                <p className="font-bold">Henüz bir mesaj gelmedi.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`card relative transition-all duration-300 hover:shadow-lg ${!msg.read ? 'border-l-4 border-l-orange-500 bg-orange-50/10 dark:bg-orange-500/5 dark:border-slate-700 dark:border-l-orange-500' : 'dark:border-slate-700'}`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold">
                          {msg.senderName.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 dark:text-slate-200">{msg.senderName}</h4>
                          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                            {new Date(msg.timestamp).toLocaleString('tr-TR')}
                          </p>
                        </div>
                      </div>
                      {!msg.read && (
                        <button
                          onClick={() => markAsRead(msg.id)}
                          className="text-[10px] font-bold text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 bg-orange-100 dark:bg-orange-500/20 px-3 py-1 rounded-full transition-colors"
                        >
                          Okundu Olarak İşaretle
                        </button>
                      )}
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50">
                      {msg.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChefDashboard;
