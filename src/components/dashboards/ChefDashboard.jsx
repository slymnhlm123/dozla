import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChefHat, Plus, History, PieChart, 
  ChevronRight, Save, TrendingUp, AlertCircle,
  MessageSquare, Bell
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { 
  STORAGE_KEYS, getFromStorage, saveToStorage, 
  DORMS, PORTION_VALUES 
} from '../../utils/storage';
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

  useEffect(() => {
    // Calculate live report whenever filters change
    const allPrefs = getFromStorage(STORAGE_KEYS.PREFERENCES);
    const menuId = `${menuData.date}_${menuData.meal}_${selectedDorm}`;
    const relevantPrefs = allPrefs.filter(p => p.menuId === menuId);

    const totals = relevantPrefs.reduce((acc, curr) => {
      const s = PORTION_VALUES[curr.selections?.soup] || 0;
      const m = PORTION_VALUES[curr.selections?.main] || 0;
      const si = PORTION_VALUES[curr.selections?.side] || 0;
      const ex = PORTION_VALUES[curr.selections?.extra] || 0;
      
      acc.soup += s;
      acc.main += m;
      acc.side += si;
      acc.extra += ex;
      acc.count += 1;
      return acc;
    }, { soup: 0, main: 0, side: 0, extra: 0, count: 0 });

    setLiveReport(totals);

    // Load existing menu if available
    const allMenus = getFromStorage(STORAGE_KEYS.MENUS);
    const existingMenu = allMenus.find(m => m.date === menuData.date && m.meal === menuData.meal && m.dorm === selectedDorm);
    if (existingMenu) {
      setMenuData({ ...existingMenu });
    } else {
      setMenuData({ ...menuData, soup: '', mainCourse: '', sideDish: '', extra: '' });
    }

    // Load existing consumption for feedback
    const allConsumption = getFromStorage(STORAGE_KEYS.CONSUMPTION);
    const existingCons = allConsumption.find(c => c.menuId === menuId);
    if (existingCons) {
      setFeedbackData(existingCons.values);
    } else {
      setFeedbackData({ soup: '', main: '', side: '' });
    }

    // Load messages
    const allMessages = getFromStorage(STORAGE_KEYS.MESSAGES);
    const dormMessages = allMessages.filter(m => m.dormId === selectedDorm).reverse();
    setMessages(dormMessages);
    setUnreadCount(dormMessages.filter(m => !m.read).length);
  }, [menuData.date, menuData.meal, selectedDorm, activeTab]);

  const handleSaveMenu = (e) => {
    e.preventDefault();
    const allMenus = getFromStorage(STORAGE_KEYS.MENUS);
    const menuId = `${menuData.date}_${menuData.meal}_${selectedDorm}`;
    
    const updatedMenus = allMenus.filter(m => !(m.date === menuData.date && m.meal === menuData.meal && m.dorm === selectedDorm));
    updatedMenus.push({ ...menuData, dorm: selectedDorm, id: menuId });
    
    saveToStorage(STORAGE_KEYS.MENUS, updatedMenus);
    toast.success('Menü başarıyla yayınlandı!');
  };

  const handleSaveFeedback = () => {
    const allConsumption = getFromStorage(STORAGE_KEYS.CONSUMPTION);
    const menuId = `${menuData.date}_${menuData.meal}_${selectedDorm}`;
    
    const updatedCons = allConsumption.filter(c => c.menuId !== menuId);
    updatedCons.push({
      menuId,
      values: feedbackData,
      timestamp: new Date().toISOString()
    });
    
    saveToStorage(STORAGE_KEYS.CONSUMPTION, updatedCons);
    toast.success('Geri dönüş raporu kaydedildi!');
  };

  const markAsRead = (id) => {
    const allMessages = getFromStorage(STORAGE_KEYS.MESSAGES);
    const updated = allMessages.map(m => m.id === id ? { ...m, read: true } : m);
    saveToStorage(STORAGE_KEYS.MESSAGES, updated);
    
    const dormMessages = updated.filter(m => m.dormId === selectedDorm).reverse();
    setMessages(dormMessages);
    setUnreadCount(dormMessages.filter(m => !m.read).length);
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
    reader.onload = (evt) => {
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
                  date: formattedDate,
                  meal: mealType,
                  soup: items[0] || '',
                  mainCourse: items[1] || '',
                  sideDish: items[2] || '',
                  extra: items[3] || '',
                  dorm: selectedDorm,
                  id: `${formattedDate}_${mealType}_${selectedDorm}`
                });
              }
            }
          }
        }

        if (newMenus.length === 0) {
          toast.error('Excel dosyasında uygun formatta menü bulunamadı.');
          return;
        }

        const allMenus = getFromStorage(STORAGE_KEYS.MENUS);
        const updatedMenus = [...allMenus];
        newMenus.forEach(nm => {
          const idx = updatedMenus.findIndex(m => m.id === nm.id);
          if (idx > -1) updatedMenus[idx] = nm;
          else updatedMenus.push(nm);
        });

        saveToStorage(STORAGE_KEYS.MENUS, updatedMenus);
        toast.success(`${newMenus.length} günlük ${mealType === 'lunch' ? 'Öğle' : 'Akşam'} menüsü başarıyla yüklendi!`);
        
        const current = newMenus.find(m => m.date === menuData.date && m.meal === menuData.meal);
        if (current) setMenuData(current);
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
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 rounded-2xl w-fit">
        {[
          { id: 'menu', label: 'Menü Yönetimi', icon: Plus },
          { id: 'report', label: 'İhtiyaç Raporu', icon: PieChart },
          { id: 'feedback', label: 'Geri Dönüş', icon: History },
          { id: 'messages', label: `Mesajlar ${unreadCount > 0 ? `(${unreadCount})` : ''}`, icon: MessageSquare }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
              activeTab === tab.id 
              ? 'bg-white text-orange-600 shadow-sm' 
              : 'text-slate-500 hover:text-slate-700'
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
          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Yurt Seçimi</label>
          <select 
            className="w-full bg-transparent font-bold text-slate-700 outline-none"
            value={selectedDorm}
            onChange={(e) => setSelectedDorm(e.target.value)}
          >
            {DORMS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <div className="card !p-3">
          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Tarih</label>
          <input 
            type="date" 
            className="w-full bg-transparent font-bold text-slate-700 outline-none"
            value={menuData.date}
            onChange={(e) => setMenuData({...menuData, date: e.target.value})}
          />
        </div>
        <div className="card !p-3 flex items-center gap-4">
          <div className="flex-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Öğün</label>
            <div className="flex gap-2">
              {['lunch', 'dinner'].map(m => (
                <button
                  key={m}
                  onClick={() => setMenuData({...menuData, meal: m})}
                  className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all ${
                    menuData.meal === m ? 'bg-orange-600 text-white' : 'text-slate-400'
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
              <div className="card border-dashed border-2 border-orange-200 bg-orange-50/20 p-6 text-center group hover:border-orange-400 transition-all">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 bg-white text-orange-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <TrendingUp size={24} />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-800">Öğle Menüsü Yükle</h4>
                    <p className="text-xs text-slate-500 mt-1">30 Günlük Öğle Yemeği Listesi (Excel)</p>
                  </div>
                  <label className="btn-primary !bg-orange-600 hover:!bg-orange-700 cursor-pointer flex items-center gap-2 px-6 py-2 text-sm">
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

              <div className="card border-dashed border-2 border-indigo-200 bg-indigo-50/20 p-6 text-center group hover:border-indigo-400 transition-all">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 bg-white text-indigo-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <TrendingUp size={24} />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-800">Akşam Menüsü Yükle</h4>
                    <p className="text-xs text-slate-500 mt-1">30 Günlük Akşam Yemeği Listesi (Excel)</p>
                  </div>
                  <label className="btn-primary !bg-indigo-600 hover:!bg-indigo-700 cursor-pointer flex items-center gap-2 px-6 py-2 text-sm">
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
            <form onSubmit={handleSaveMenu} className="card space-y-6 border-orange-100">
              <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center">
                  <ChefHat size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-800">Tekil Menü Düzenle</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { id: 'soup', label: 'Çorba', placeholder: 'Örn: Mercimek Çorbası' },
                  { id: 'mainCourse', label: 'Ana Yemek', placeholder: 'Örn: Orman Kebabı' },
                  { id: 'sideDish', label: 'Yan Ürün', placeholder: 'Örn: Pirinç Pilavı' },
                  { id: 'extra', label: 'Tatlı / Meyve / İçecek', placeholder: 'Örn: Mevsim Salata' },
                ].map(field => (
                  <div key={field.id} className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700 ml-1">{field.label}</label>
                    <input 
                      type="text" 
                      required
                      placeholder={field.placeholder}
                      className="input-field !bg-white focus:ring-orange-500/20 focus:border-orange-500"
                      value={menuData[field.id]}
                      onChange={(e) => setMenuData({...menuData, [field.id]: e.target.value})}
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-4">
                <button type="submit" className="btn-primary !bg-orange-600 hover:!bg-orange-700 flex items-center gap-2">
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
                { label: 'Bildiren Öğrenci', value: liveReport.count, icon: ChefHat, color: 'text-slate-600', bg: 'bg-slate-100' },
                { label: 'Çorba Porsiyon', value: liveReport.soup, icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-50' },
                { label: 'Ana Yemek Porsiyon', value: liveReport.main, icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-50' },
                { label: 'Yan Ürün Porsiyon', value: liveReport.side, icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-50' },
                { label: 'Extra Porsiyon', value: liveReport.extra, icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-50' },
              ].map((stat, idx) => (
                <div key={idx} className="card flex flex-col items-center justify-center py-6 px-2">
                  <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-4`}>
                    <stat.icon size={24} />
                  </div>
                  <span className="text-3xl font-black text-slate-900">{stat.value}</span>
                  <span className="text-xs font-bold text-slate-400 uppercase mt-1 tracking-wider">{stat.label}</span>
                </div>
              ))}
            </div>

            <div className="card border-orange-100 bg-orange-50/30">
              <div className="flex items-center gap-3 text-orange-700 mb-4">
                <AlertCircle size={20} />
                <h4 className="font-bold text-sm">Porsiyon Hesaplama Notu</h4>
              </div>
              <p className="text-xs text-orange-600 leading-relaxed font-medium">
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
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="text-lg font-bold text-slate-800">30 Günlük Yemek Listesi</h3>
                <span className="text-xs font-bold text-slate-400 uppercase">Öğle ve Akşam Menüleri</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 font-bold">
                    <tr>
                      <th className="px-4 py-3 rounded-tl-xl">Tarih</th>
                      <th className="px-4 py-3">Öğün</th>
                      <th className="px-4 py-3">Çorba</th>
                      <th className="px-4 py-3">Ana Yemek</th>
                      <th className="px-4 py-3">Yan Ürün</th>
                      <th className="px-4 py-3 rounded-tr-xl">Ekstra</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(() => {
                      const menus = getFromStorage(STORAGE_KEYS.MENUS);
                      const currentMonthMenus = menus
                        .filter(m => m.dorm === selectedDorm && m.date.startsWith(menuData.date.substring(0, 7)))
                        .sort((a, b) => a.date.localeCompare(b.date) || a.meal.localeCompare(b.meal));
                      
                      if (currentMonthMenus.length === 0) {
                        return (
                          <tr>
                            <td colSpan="6" className="px-4 py-8 text-center text-slate-400 italic">
                              Bu ay için henüz menü yüklenmedi.
                            </td>
                          </tr>
                        );
                      }

                      return currentMonthMenus.map((m, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3 font-bold text-slate-700 whitespace-nowrap">
                            {new Date(m.date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', weekday: 'short' })}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              m.meal === 'lunch' ? 'bg-orange-100 text-orange-700' : 'bg-indigo-100 text-indigo-700'
                            }`}>
                              {m.meal === 'lunch' ? 'Öğle' : 'Akşam'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-600">{m.soup}</td>
                          <td className="px-4 py-3 text-slate-600 font-medium">{m.mainCourse}</td>
                          <td className="px-4 py-3 text-slate-600">{m.sideDish}</td>
                          <td className="px-4 py-3 text-slate-600">{m.extra}</td>
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
            <div className="card space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="text-xl font-bold text-slate-800">Geri Dönüş ve Karşılaştırma</h3>
                <span className="text-xs font-bold text-slate-400">Gerçek tüketilen porsiyonları girin</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {['soup', 'main', 'side'].map(cat => {
                  const predicted = liveReport[cat];
                  const actual = parseFloat(feedbackData[cat]) || 0;
                  const diff = actual - predicted;
                  
                  return (
                    <div key={cat} className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-sm font-bold text-slate-700">
                          {cat === 'soup' ? 'Gerçek Çorba' : cat === 'main' ? 'Gerçek Ana Yemek' : 'Gerçek Yan Ürün'}
                        </label>
                        <input 
                          type="number" 
                          step="0.5"
                          placeholder="0.0"
                          className="input-field !bg-white"
                          value={feedbackData[cat]}
                          onChange={(e) => setFeedbackData({...feedbackData, [cat]: e.target.value})}
                        />
                      </div>
                      
                      <div className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Fark</span>
                          <span className={`text-lg font-black ${diff >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {diff > 0 ? `+${diff}` : diff}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Beklenen</span>
                          <span className="text-lg font-black text-slate-700">{predicted}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button 
                  onClick={handleSaveFeedback}
                  className="btn-primary !bg-orange-600 hover:!bg-orange-700 flex items-center gap-2"
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
              <h3 className="text-xl font-bold text-slate-800">Mesul Hoca Bildirimleri</h3>
              <span className="text-xs font-bold text-slate-400">Yurttan gelen son geri bildirimler</span>
            </div>

            {messages.length === 0 ? (
              <div className="card flex flex-col items-center justify-center py-20 text-center text-slate-400">
                <Bell size={48} className="mb-4 opacity-20" />
                <p className="font-bold">Henüz bir mesaj gelmedi.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map(msg => (
                  <div 
                    key={msg.id} 
                    className={`card relative transition-all ${!msg.read ? 'border-l-4 border-l-orange-500 bg-orange-50/10' : ''}`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold">
                          {msg.senderName.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800">{msg.senderName}</h4>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">
                            {new Date(msg.timestamp).toLocaleString('tr-TR')}
                          </p>
                        </div>
                      </div>
                      {!msg.read && (
                        <button 
                          onClick={() => markAsRead(msg.id)}
                          className="text-[10px] font-bold text-orange-600 hover:text-orange-700 bg-orange-100 px-3 py-1 rounded-full"
                        >
                          Okundu Olarak İşaretle
                        </button>
                      )}
                    </div>
                    <p className="text-slate-600 text-sm leading-relaxed bg-white/50 p-4 rounded-xl border border-slate-100">
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
