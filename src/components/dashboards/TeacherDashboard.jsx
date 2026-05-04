import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Calendar, Clock, ChevronRight, CheckCircle2, Users2, ListChecks, Search, Loader2, ChefHat } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { PORTION_LABELS } from '../../utils/storage';
import { supabase } from '../../utils/supabase';

const TeacherDashboard = ({ user }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMeal, setSelectedMeal] = useState('lunch');
  const [students, setStudents] = useState([]);
  const [preferences, setPreferences] = useState([]);
  const [menu, setMenu] = useState(null);
  const [bulkSelection, setBulkSelection] = useState({ soup: 'Normal', main: 'Normal', side: 'Normal', extra: 'Normal' });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchTeacherData = async () => {
      setLoading(true);
      try {
        const { data: allStudents } = await supabase.from('students').select('*').eq('class', user.class).eq('dorm', user.dorm || 'YOK');
        if (allStudents) setStudents(allStudents);
        const menuId = `${selectedDate}_${selectedMeal}_${user.dorm}`;
        const { data: foundMenu } = await supabase.from('menus').select('*').eq('id', menuId).single();
        if (foundMenu) setMenu({ ...foundMenu.items, ...foundMenu }); else setMenu(null);
        const { data: currentPrefs } = await supabase.from('preferences').select('*').eq('menu_id', menuId);
        if (currentPrefs) setPreferences(currentPrefs);
      } catch (err) { console.error("TeacherData hatası:", err); }
      finally { setLoading(false); }
    };
    fetchTeacherData();
  }, [selectedDate, selectedMeal, user]);

  const updatePreference = async (studentId, category, value) => {
    const menuId = `${selectedDate}_${selectedMeal}_${user.dorm}`;
    let studentPref = preferences.find(p => p.user_id === studentId && p.menu_id === menuId);
    let updatedSelections = { soup: 'Normal', main: 'Normal', side: 'Normal', extra: 'Normal' };
    if (studentPref) updatedSelections = { ...JSON.parse(studentPref.portion), [category]: value };
    else updatedSelections[category] = value;
    const newPref = { id: `${studentId}_${menuId}`, menu_id: menuId, user_id: studentId, portion: JSON.stringify(updatedSelections) };
    const { error } = await supabase.from('preferences').upsert(newPref);
    if (error) toast.error('Tercih güncellenirken hata oluştu');
    else { const updatedPrefs = preferences.filter(p => p.id !== newPref.id); updatedPrefs.push(newPref); setPreferences(updatedPrefs); toast.success('Tercih güncellendi'); }
  };

  const applyBulkAction = async () => {
    if (!menu) { toast.error('Önce bu tarih için menü yayınlanmalıdır'); return; }
    const menuId = `${selectedDate}_${selectedMeal}_${user.dorm}`;
    const upsertData = students.map(student => ({ id: `${student.id}_${menuId}`, menu_id: menuId, user_id: student.id, portion: JSON.stringify({ ...bulkSelection }) }));
    const { error } = await supabase.from('preferences').upsert(upsertData);
    if (error) toast.error('Toplu işlem uygulanırken hata oluştu');
    else { const newPrefs = [...preferences.filter(p => !upsertData.some(ud => ud.id === p.id)), ...upsertData]; setPreferences(newPrefs); toast.success('Tüm sınıfa başarıyla uygulandı!'); }
  };

  const getStudentPref = (studentId) => { const pref = preferences.find(p => p.user_id === studentId); return pref ? JSON.parse(pref.portion) : null; };
  const filteredStudents = students.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || (s.studentId && s.studentId.includes(searchTerm)));

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
        <div className="flex flex-wrap gap-4 w-full lg:w-auto">
          <div className="card !p-3 flex items-center gap-3 min-w-[200px]">
            <Calendar size={18} className="text-blue-500 dark:text-blue-400" />
            <input type="date" className="bg-transparent font-bold text-slate-700 dark:text-slate-200 text-sm outline-none w-full" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
          </div>
          <div className="card !p-3 flex items-center gap-2">
            <Clock size={18} className="text-blue-500 dark:text-blue-400" />
            <div className="flex gap-2">
              {['lunch', 'dinner'].map(meal => (
                <button key={meal} onClick={() => setSelectedMeal(meal)}
                  className={`text-xs font-bold px-4 py-1.5 rounded-xl transition-all ${selectedMeal === meal ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25' : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>
                  {meal === 'lunch' ? 'Öğle' : 'Akşam'}
                </button>
              ))}
            </div>
          </div>
          <div className="card !p-3 flex items-center gap-3 flex-1 lg:flex-none lg:min-w-[300px]">
            <Users size={18} className="text-blue-500 dark:text-blue-400" />
            <input type="text" placeholder="Öğrenci Ara..." className="bg-transparent font-bold text-slate-700 dark:text-slate-200 text-sm outline-none w-full placeholder:text-slate-400 dark:placeholder:text-slate-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>
        <div className="flex items-center gap-3 px-6 py-3 bg-blue-50 dark:bg-blue-500/10 rounded-2xl border border-blue-100 dark:border-blue-500/20">
          <Users2 size={20} className="text-blue-600 dark:text-blue-400" />
          <span className="font-bold text-blue-700 dark:text-blue-400">{user.class} Sınıfı</span>
          <span className="bg-blue-200/50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded text-xs font-black">{students.length}</span>
        </div>
      </div>

      {/* Menu Display */}
      {menu ? (
        <div className="card flex flex-col md:flex-row gap-6 items-center justify-between border-blue-100 dark:border-blue-500/20 bg-blue-50/30 dark:bg-blue-500/5">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center shrink-0">
              <ChefHat size={24} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg">Günün Menüsü</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Bu öğün için yayınlanan yemekler</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 flex-1 w-full justify-start md:justify-end">
            {[
              { label: 'Çorba', dish: menu.soup },
              { label: 'Ana Yemek', dish: menu.mainCourse },
              { label: 'Yan Ürün', dish: menu.sideDish },
              { label: 'Ekstra', dish: menu.extra }
            ].map((item, idx) => (
              item.dish ? (
                <div key={idx} className="bg-white dark:bg-slate-800/80 px-4 py-2.5 rounded-xl border border-slate-100 dark:border-slate-700/50 flex-1 min-w-[120px] shadow-sm">
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase block tracking-widest mb-1">{item.label}</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300 text-sm leading-tight">{item.dish}</span>
                </div>
              ) : null
            ))}
          </div>
        </div>
      ) : (
        <div className="card text-center py-6 border-dashed border-2 border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/20">
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Bu tarih ve öğün için henüz menü yayınlanmamış.</p>
        </div>
      )}

      {/* Bulk Action */}
      <div className="card border-blue-100 dark:border-blue-500/20 bg-gradient-to-br from-white to-blue-50/20 dark:from-slate-800/60 dark:to-blue-900/10 overflow-hidden relative group">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-50 dark:bg-blue-500/5 rounded-full opacity-50 group-hover:scale-110 transition-transform duration-700"></div>
        <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-500/25"><ListChecks size={28} /></div>
            <div>
              <h3 className="text-xl font-black text-slate-800 dark:text-white">Toplu İşlemler</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Tüm sınıfın porsiyonlarını tek tıkla güncelleyin.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 items-center">
            {['soup', 'main', 'side', 'extra'].map(cat => (
              <div key={cat} className="flex flex-col gap-1.5">
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase ml-1 tracking-widest">{cat === 'soup' ? 'Çorba' : cat === 'main' ? 'Ana Yemek' : cat === 'side' ? 'Yan Ürün' : 'Ekstra'}</span>
                <select className="bg-white dark:bg-slate-700 border-2 border-slate-100 dark:border-slate-600 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-all cursor-pointer shadow-sm" value={bulkSelection[cat]} onChange={(e) => setBulkSelection({...bulkSelection, [cat]: e.target.value})}>
                  {PORTION_LABELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            ))}
            <button onClick={applyBulkAction} className="md:mt-5 px-8 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-bold text-sm hover:shadow-xl hover:shadow-blue-500/25 transition-all active:scale-95 flex items-center gap-2">
              <CheckCircle2 size={18} />Sınıfa Uygula
            </button>
          </div>
        </div>
      </div>

      {/* Student List */}
      {loading ? (
        <div className="flex justify-center items-center py-20 text-blue-600 dark:text-blue-400"><Loader2 size={40} className="animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredStudents.length === 0 ? (
            <div className="card py-20 text-center flex flex-col items-center justify-center gap-4 border-dashed border-2 dark:border-slate-600">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-700/50 rounded-full flex items-center justify-center text-slate-300 dark:text-slate-600"><Search size={32} /></div>
              <div><h3 className="text-lg font-bold text-slate-600 dark:text-slate-400">Öğrenci Bulunamadı</h3><p className="text-sm text-slate-400 dark:text-slate-500">Arama kriterlerinize uygun öğrenci yok veya liste boş.</p></div>
            </div>
          ) : (
            filteredStudents.map((student) => {
              const pref = getStudentPref(student.id);
              return (
                <motion.div layout key={student.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="card flex flex-col xl:flex-row xl:items-center justify-between gap-6 group hover:border-blue-300 dark:hover:border-blue-500/30 transition-all hover:shadow-xl dark:hover:shadow-blue-500/5">
                  <div className="flex items-center gap-4 min-w-[240px]">
                    <div className="w-14 h-14 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center text-slate-500 dark:text-slate-400 font-black text-xl group-hover:bg-gradient-to-br group-hover:from-blue-500 group-hover:to-indigo-600 group-hover:text-white transition-all duration-300">
                      {student.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h4 className="font-black text-slate-800 dark:text-white text-lg leading-tight">{student.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded uppercase">No: {student.studentId}</span>
                        <span className="text-[10px] font-bold text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-1.5 py-0.5 rounded uppercase">{student.class}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-6 flex-1 justify-center xl:justify-start">
                    {['soup', 'main', 'side', 'extra'].map(cat => (
                      <div key={cat} className="flex flex-col gap-2 min-w-[140px]">
                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase ml-1 tracking-widest">{cat === 'soup' ? 'Çorba' : cat === 'main' ? 'Ana Yemek' : cat === 'side' ? 'Yan Ürün' : 'Ekstra'}</span>
                        <div className="flex gap-1.5 p-1 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-600">
                          {PORTION_LABELS.map(l => (
                            <button key={l} onClick={() => updatePreference(student.id, cat, l)} title={l}
                              className={`flex-1 py-2 rounded-lg text-[10px] font-black transition-all border shadow-sm ${pref?.[cat] === l ? 'bg-gradient-to-r from-blue-500 to-indigo-600 border-blue-500 text-white scale-105 shadow-md' : 'bg-white dark:bg-slate-700 border-transparent text-slate-400 dark:text-slate-500 hover:text-blue-500 dark:hover:text-blue-400'}`}>
                              {l === 'Yemeyeceğim' ? 'X' : l === 'Az' ? 'A' : l === 'Normal' ? 'N' : 'B'}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-end gap-3 min-w-[140px]">
                    {pref ? (
                      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-4 py-2 rounded-2xl text-xs font-black border border-emerald-100 dark:border-emerald-500/20"><CheckCircle2 size={16} />BİLDİRİLDİ</div>
                    ) : (
                      <div className="text-slate-400 dark:text-slate-500 text-xs font-bold bg-slate-50 dark:bg-slate-700/50 px-4 py-2 rounded-2xl border border-slate-100 dark:border-slate-600">BEKLENİYOR</div>
                    )}
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-slate-200 dark:text-slate-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all"><ChevronRight size={24} /></div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
