export const STORAGE_KEYS = {
  USERS: 'dozla_users',
  MENUS: 'dozla_menus',
  PREFERENCES: 'dozla_preferences',
  CONSUMPTION: 'dozla_consumption', // For chef feedback reports
  CURRENT_USER: 'dozla_current_user',
  MESSAGES: 'dozla_messages',
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

export const initStorage = () => {
  let users = getFromStorage(STORAGE_KEYS.USERS);
  
  // Ensure default accounts exist
  const defaults = [...INITIAL_TEACHERS, INITIAL_CHEF, ...INITIAL_MANAGERS];
  let changed = false;

  defaults.forEach(def => {
    if (!users.find(u => u.id === def.id || (u.username && u.username === def.username))) {
      users.push(def);
      changed = true;
    }
  });

  if (changed || users.length === 0) {
    saveToStorage(STORAGE_KEYS.USERS, users);
  }

  // Init other keys if empty
  if (!localStorage.getItem(STORAGE_KEYS.MENUS)) saveToStorage(STORAGE_KEYS.MENUS, []);
  if (!localStorage.getItem(STORAGE_KEYS.PREFERENCES)) saveToStorage(STORAGE_KEYS.PREFERENCES, []);
  if (!localStorage.getItem(STORAGE_KEYS.CONSUMPTION)) saveToStorage(STORAGE_KEYS.CONSUMPTION, []);
};

export const PORTION_VALUES = {
  'Yemeyeceğim': 0,
  'Az': 0.5,
  'Normal': 1,
  'Bol': 1.5,
};

export const PORTION_LABELS = ['Yemeyeceğim', 'Az', 'Normal', 'Bol'];
