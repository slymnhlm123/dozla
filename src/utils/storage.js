import { supabase } from './supabase';

export const STORAGE_KEYS = {
  CURRENT_USER: 'dozla_current_user',
};

// Her rol için ayrı Supabase tablo adı
export const ROLE_TABLE = {
  student: 'students',
  teacher: 'teachers',
  chef: 'chefs',
  manager: 'managers',
};

export const DORMS = [
  { id: 'yamanevler', name: 'Yamanevler Enderun Bilişim' },
  { id: 'ferhatlar', name: 'Ferhatlar Enderun' },
  { id: 'elvankaracan', name: 'Elvan Karacan Enderun' },
  { id: 'kartalkulliye', name: 'Kartal Külliye Enderun Bilişim' },
  { id: 'osmangazi', name: 'Osmangazi Enderun' },
];

export const CLASSES = ['9En-1', '10En-1', '11En-1', '11En-2'];

export const INITIAL_TEACHERS = [
  { id: 't1', name: 'Emre Karabalak', role: 'teacher', class: '11En-1', dorm: 'yamanevler', password: '123' },
  { id: 't2', name: 'Metin Durmuş', role: 'teacher', class: '11En-2', dorm: 'yamanevler', password: '123' },
  { id: 't3', name: 'Mehmet Ali Zabun', role: 'teacher', class: '10En-1', dorm: 'yamanevler', password: '123' },
  { id: 't4', name: 'Burakhan Karaoğlan', role: 'teacher', class: '9En-1', dorm: 'yamanevler', password: '123' },
];

export const INITIAL_CHEF = {
  id: 'chef1',
  name: 'Mutfak Şefi',
  username: 'asci',
  role: 'chef',
  password: '123456',
};

export const INITIAL_MANAGERS = [
  { id: 'm1', name: 'Yamanevler Mesul', username: 'mesulyamanevler', role: 'manager', dorm: 'yamanevler', password: '123' },
  { id: 'm2', name: 'Ferhatlar Mesul', username: 'mesulferhatlar', role: 'manager', dorm: 'ferhatlar', password: '123' },
  { id: 'm3', name: 'Elvan Karacan Mesul', username: 'mesulelvankaracan', role: 'manager', dorm: 'elvankaracan', password: '123' },
  { id: 'm4', name: 'Kartal Külliye Mesul', username: 'mesulkartalkulliye', role: 'manager', dorm: 'kartalkulliye', password: '123' },
  { id: 'm5', name: 'Osmangazi Mesul', username: 'mesulosmangazi', role: 'manager', dorm: 'osmangazi', password: '123' },
];

export const getFromStorage = (key, defaultValue = []) => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : defaultValue;
};

export const saveToStorage = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const initStorage = async () => {
  try {
    const { data: users, error } = await supabase.from('users').select('id').limit(1);
    
    if (error) {
      console.error('Supabase bağlantı hatası:', error);
      return;
    }

    // Eğer users tablosu boşsa varsayılanları ekle
    if (!users || users.length === 0) {
      console.log("Veritabanı boş, varsayılan kullanıcılar oluşturuluyor...");
      const defaults = [...INITIAL_TEACHERS, INITIAL_CHEF, ...INITIAL_MANAGERS];
      
      const insertData = defaults.map(def => ({
        id: def.id,
        role: def.role,
        name: def.name,
        username: def.username || null,
        studentId: null,
        dorm: def.dorm || null,
        class: def.class || null,
        password: def.password
      }));

      const { error: insertError } = await supabase.from('users').insert(insertData);
      if (insertError) {
        console.error('Varsayılan kullanıcılar eklenemedi:', insertError);
      } else {
        console.log("Varsayılan kullanıcılar başarıyla eklendi.");
      }
    }
  } catch (err) {
    console.error('initStorage hatası:', err);
  }
};

export const PORTION_VALUES = {
  'Yemeyeceğim': 0,
  'Az': 0.5,
  'Normal': 1,
  'Bol': 1.5,
};

export const PORTION_LABELS = ['Yemeyeceğim', 'Az', 'Normal', 'Bol'];
