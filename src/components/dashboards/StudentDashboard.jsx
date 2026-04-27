import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Send, CheckCircle2, UtensilsCrossed } from 'lucide-react';
import confetti from 'canvas-confetti';
import { toast } from 'react-hot-toast';
import { 
  STORAGE_KEYS, getFromStorage, saveToStorage, 
  PORTION_LABELS, PORTION_VALUES 
} from '../../utils/storage';

const StudentDashboard = ({ user }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMeal, setSelectedMeal] = useState('lunch');
  const [menu, setMenu] = useState(null);
  const [selections, setSelections] = useState({ soup: 'Normal', main: 'Normal', side: 'Normal', extra: 'Normal' });
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    const menus = getFromStorage(STORAGE_KEYS.MENUS);
    const foundMenu = menus.find(m => m.date === selectedDate && m.meal === selectedMeal && m.dorm === user.dorm);
    setMenu(foundMenu);

    const preferences = getFromStorage(STORAGE_KEYS.PREFERENCES);
    const foundPref = preferences.find(p => 
      p.userId === user.id && p.menuId === `${selectedDate}_${selectedMeal}_${user.dorm}`
    );

    if (foundPref) {
      setSelections(foundPref.selections);
      setIsSubmitted(true);
    } else {
      setSelections({ soup: 'Normal', main: 'Normal', side: 'Normal', extra: 'Normal' });
      setIsSubmitted(false);
    }
  }, [selectedDate, selectedMeal, user.id, user.dorm]);

  const handleSubmit = () => {
    const menuId = `${selectedDate}_${selectedMeal}_${user.dorm}`;
    const preferences = getFromStorage(STORAGE_KEYS.PREFERENCES);
    const updatedPrefs = preferences.filter(p => !(p.userId === user.id && p.menuId === menuId));
    
    updatedPrefs.push({
      userId: user.id,
      menuId,
      selections,
      timestamp: new Date().toISOString()
    });

    saveToStorage(STORAGE_KEYS.PREFERENCES, updatedPrefs);
    setIsSubmitted(true);
    
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#0d9488', '#2dd4bf', '#14b8a6']
    });
    
    toast.success('Tercihleriniz mutfakla başarıyla paylaşıldı!');
  };

  const categories = [
    { id: 'soup', label: 'Çorba', dish: menu?.soup },
    { id: 'main', label: 'Ana Yemek', dish: menu?.mainCourse },
    { id: 'side', label: 'Yan Ürün', dish: menu?.sideDish },
    { id: 'extra', label: 'Tatlı / Meyve / İçecek', dish: menu?.extra },
  ];

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Selection Header */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card !p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center">
            <Calendar size={24} />
          </div>
          <div className="flex-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tarih</label>
            <input 
              type="date" 
              className="w-full bg-transparent font-bold text-slate-700 outline-none"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
        </div>

        <div className="card !p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center">
            <Clock size={24} />
          </div>
          <div className="flex-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Öğün</label>
            <div className="flex gap-4 mt-1">
              {['lunch', 'dinner'].map(meal => (
                <button
                  key={meal}
                  onClick={() => setSelectedMeal(meal)}
                  className={`text-sm font-bold px-3 py-1 rounded-lg transition-all ${
                    selectedMeal === meal 
                    ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/20' 
                    : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {meal === 'lunch' ? 'Öğle' : 'Akşam'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {!menu ? (
        <div className="card flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-[2rem] flex items-center justify-center mb-6">
            <UtensilsCrossed size={40} />
          </div>
          <h3 className="text-xl font-bold text-slate-700 mb-2">Henüz Menü Yayınlanmadı</h3>
          <p className="text-slate-400">Mutfak şefi bu tarih ve öğün için henüz menü oluşturmadı.</p>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {categories.map((cat) => (
            <div key={cat.id} className="card relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
              
              <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <span className="inline-block px-3 py-1 bg-teal-100 text-teal-700 text-[10px] font-bold uppercase tracking-widest rounded-full mb-3">
                    {cat.label}
                  </span>
                  <h3 className="text-2xl font-extrabold text-slate-800">{cat.dish}</h3>
                </div>

                <div className="flex flex-wrap gap-2">
                  {PORTION_LABELS.map(label => (
                    <button
                      key={label}
                      disabled={isSubmitted}
                      onClick={() => setSelections({...selections, [cat.id]: label})}
                      className={`px-5 py-3 rounded-2xl text-sm font-bold transition-all duration-300 border-2 ${
                        selections[cat.id] === label
                        ? 'bg-teal-600 border-teal-600 text-white shadow-lg shadow-teal-600/20'
                        : 'bg-white border-slate-100 text-slate-400 hover:border-teal-200 hover:text-teal-600'
                      } ${isSubmitted ? 'cursor-default' : 'active:scale-95'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}

          <div className="flex justify-center pt-4">
            {isSubmitted ? (
              <div className="flex items-center gap-3 bg-emerald-50 text-emerald-700 px-8 py-4 rounded-[2rem] border border-emerald-100 font-bold shadow-xl shadow-emerald-500/10">
                <CheckCircle2 size={24} />
                Tercihleriniz Kaydedildi
              </div>
            ) : (
              <button 
                onClick={handleSubmit}
                className="btn-primary flex items-center gap-3 px-12 py-5 text-lg rounded-[2rem] group"
              >
                Bildirimi Mutfakla Paylaş
                <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </button>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default StudentDashboard;
