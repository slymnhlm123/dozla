import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, Calendar, Clock, ChevronRight, 
  CheckCircle2, Users2, LayoutGrid, ListChecks, Search 
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { 
  STORAGE_KEYS, getFromStorage, saveToStorage, 
  PORTION_LABELS, PORTION_VALUES 
} from '../../utils/storage';

const TeacherDashboard = ({ user }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMeal, setSelectedMeal] = useState('lunch');
  const [students, setStudents] = useState([]);
  const [preferences, setPreferences] = useState([]);
  const [menu, setMenu] = useState(null);
  const [bulkSelection, setBulkSelection] = useState({ soup: 'Normal', main: 'Normal', side: 'Normal' });

  useEffect(() => {
    // Get students of this teacher's class and dorm
    const allUsers = getFromStorage(STORAGE_KEYS.USERS);
    const classStudents = allUsers.filter(u => u.role === 'student' && u.class === user.class && u.dorm === user.dorm);
    setStudents(classStudents);

    // Get current menu
    const menus = getFromStorage(STORAGE_KEYS.MENUS);
    const foundMenu = menus.find(m => m.date === selectedDate && m.meal === selectedMeal && m.dorm === user.dorm);
    setMenu(foundMenu);

    // Get existing preferences
    const allPrefs = getFromStorage(STORAGE_KEYS.PREFERENCES);
    const menuId = `${selectedDate}_${selectedMeal}_${user.dorm}`;
    const currentPrefs = allPrefs.filter(p => p.menuId === menuId);
    setPreferences(currentPrefs);
  }, [selectedDate, selectedMeal, user]);

  const updatePreference = (studentId, category, value) => {
    const menuId = `${selectedDate}_${selectedMeal}_${user.dorm}`;
    const allPrefs = getFromStorage(STORAGE_KEYS.PREFERENCES);
    
    let studentPref = allPrefs.find(p => p.userId === studentId && p.menuId === menuId);
    
    if (studentPref) {
      studentPref.selections = { ...studentPref.selections, [category]: value };
    } else {
      studentPref = {
        userId: studentId,
        menuId,
        selections: { soup: 'Normal', main: 'Normal', side: 'Normal', [category]: value },
        timestamp: new Date().toISOString()
      };
      allPrefs.push(studentPref);
    }

    saveToStorage(STORAGE_KEYS.PREFERENCES, allPrefs);
    setPreferences([...allPrefs.filter(p => p.menuId === menuId)]);
    toast.success('Tercih güncellendi');
  };

  const applyBulkAction = () => {
    if (!menu) {
      toast.error('Önce bu tarih için menü yayınlanmalıdır');
      return;
    }

    const menuId = `${selectedDate}_${selectedMeal}_${user.dorm}`;
    let allPrefs = getFromStorage(STORAGE_KEYS.PREFERENCES);
    
    students.forEach(student => {
      allPrefs = allPrefs.filter(p => !(p.userId === student.id && p.menuId === menuId));
      allPrefs.push({
        userId: student.id,
        menuId,
        selections: { ...bulkSelection },
        timestamp: new Date().toISOString()
      });
    });

    saveToStorage(STORAGE_KEYS.PREFERENCES, allPrefs);
    setPreferences([...allPrefs.filter(p => p.menuId === menuId)]);
    toast.success('Tüm sınıfa başarıyla uygulandı!');
  };

  const getStudentPref = (studentId) => {
    return preferences.find(p => p.userId === studentId)?.selections || null;
  };

  const [searchTerm, setSearchTerm] = useState('');

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.studentId.includes(searchTerm)
  );

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Filters & Header */}
      <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
        <div className="flex flex-wrap gap-4 w-full lg:w-auto">
          <div className="card !p-3 flex items-center gap-3 min-w-[200px]">
            <Calendar size={18} className="text-blue-500" />
            <input 
              type="date" 
              className="bg-transparent font-bold text-slate-700 text-sm outline-none w-full"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
          <div className="card !p-3 flex items-center gap-2">
            <Clock size={18} className="text-blue-500" />
            <div className="flex gap-2">
              {['lunch', 'dinner'].map(meal => (
                <button
                  key={meal}
                  onClick={() => setSelectedMeal(meal)}
                  className={`text-xs font-bold px-4 py-1.5 rounded-xl transition-all ${
                    selectedMeal === meal 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                    : 'text-slate-400 hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  {meal === 'lunch' ? 'Öğle' : 'Akşam'}
                </button>
              ))}
            </div>
          </div>
          <div className="card !p-3 flex items-center gap-3 flex-1 lg:flex-none lg:min-w-[300px]">
            <Users size={18} className="text-blue-500" />
            <input 
              type="text" 
              placeholder="Öğrenci Ara..."
              className="bg-transparent font-bold text-slate-700 text-sm outline-none w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 px-6 py-3 bg-blue-50 rounded-2xl border border-blue-100 shadow-sm">
          <Users2 size={20} className="text-blue-600" />
          <span className="font-bold text-blue-700">{user.class} Sınıfı</span>
          <span className="bg-blue-200/50 text-blue-700 px-2 py-0.5 rounded text-xs font-black">{students.length}</span>
        </div>
      </div>

      {/* Bulk Action Area */}
      <div className="card border-blue-100 bg-gradient-to-br from-white to-blue-50/20 overflow-hidden relative group">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-50 rounded-full opacity-50 group-hover:scale-110 transition-transform duration-700"></div>
        <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-600 rounded-[1.25rem] flex items-center justify-center text-white shadow-xl shadow-blue-600/20">
              <ListChecks size={28} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800">Toplu İşlemler</h3>
              <p className="text-sm text-slate-500 font-medium">Tüm sınıfın porsiyonlarını tek tıkla güncelleyin.</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 items-center">
            {['soup', 'main', 'side'].map(cat => (
              <div key={cat} className="flex flex-col gap-1.5">
                <span className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">
                  {cat === 'soup' ? 'Çorba' : cat === 'main' ? 'Ana Yemek' : 'Yan Ürün'}
                </span>
                <select 
                  className="bg-white border-2 border-slate-100 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 transition-all cursor-pointer shadow-sm"
                  value={bulkSelection[cat]}
                  onChange={(e) => setBulkSelection({...bulkSelection, [cat]: e.target.value})}
                >
                  {PORTION_LABELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            ))}
            <button 
              onClick={applyBulkAction}
              className="md:mt-5 px-8 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/30 active:scale-95 flex items-center gap-2"
            >
              <CheckCircle2 size={18} />
              Sınıfa Uygula
            </button>
          </div>
        </div>
      </div>

      {/* Student List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredStudents.length === 0 ? (
          <div className="card py-20 text-center flex flex-col items-center justify-center gap-4 border-dashed border-2">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
              <Search size={32} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-600">Öğrenci Bulunamadı</h3>
              <p className="text-sm text-slate-400">Arama kriterlerinize uygun öğrenci yok veya liste boş.</p>
            </div>
          </div>
        ) : (
          filteredStudents.map((student) => {
            const pref = getStudentPref(student.id);
            return (
              <motion.div 
                layout
                key={student.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="card flex flex-col xl:flex-row xl:items-center justify-between gap-6 group hover:border-blue-300 transition-all hover:shadow-2xl hover:shadow-blue-500/5"
              >
                <div className="flex items-center gap-4 min-w-[240px]">
                  <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-500 font-black text-xl group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-inner">
                    {student.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800 text-lg leading-tight">{student.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-tighter">No: {student.studentId}</span>
                      <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded uppercase tracking-tighter">{student.class}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-6 flex-1 justify-center xl:justify-start">
                  {['soup', 'main', 'side'].map(cat => (
                    <div key={cat} className="flex flex-col gap-2 min-w-[140px]">
                      <span className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">
                        {cat === 'soup' ? 'Çorba' : cat === 'main' ? 'Ana Yemek' : 'Yan Ürün'}
                      </span>
                      <div className="flex gap-1.5 p-1 bg-slate-50 rounded-xl border border-slate-100 shadow-inner">
                        {PORTION_LABELS.map(l => (
                          <button
                            key={l}
                            onClick={() => updatePreference(student.id, cat, l)}
                            title={l}
                            className={`flex-1 py-2 rounded-lg text-[10px] font-black transition-all border shadow-sm ${
                              pref?.[cat] === l
                              ? 'bg-blue-600 border-blue-600 text-white scale-105 shadow-md'
                              : 'bg-white border-transparent text-slate-400 hover:text-blue-500 hover:border-blue-100'
                            }`}
                          >
                            {l === 'Yemeyeceğim' ? 'X' : l === 'Az' ? 'A' : l === 'Normal' ? 'N' : 'B'}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-end gap-3 min-w-[140px]">
                  {pref ? (
                    <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-2xl text-xs font-black border border-emerald-100 shadow-sm">
                      <CheckCircle2 size={16} />
                      BİLDİRİLDİ
                    </div>
                  ) : (
                    <div className="text-slate-400 text-xs font-bold bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
                      BEKLENİYOR
                    </div>
                  )}
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-slate-200 group-hover:text-blue-400 group-hover:translate-x-1 transition-all">
                    <ChevronRight size={24} />
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;
