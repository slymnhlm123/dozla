import React, { useState, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { getFromStorage, STORAGE_KEYS } from './utils/storage';
import { ThemeProvider } from './contexts/ThemeContext';

// Component Imports
import RoleSelector from './components/RoleSelector';
import Navbar from './components/Navbar';
import AuthScreen from './components/AuthScreen';
import StudentDashboard from './components/dashboards/StudentDashboard';
import TeacherDashboard from './components/dashboards/TeacherDashboard';
import ChefDashboard from './components/dashboards/ChefDashboard';
import ManagerDashboard from './components/dashboards/ManagerDashboard';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentRole, setCurrentRole] = useState(null); // 'student', 'teacher', 'chef', 'manager'
  const [isAuthMode, setIsAuthMode] = useState(false);

  useEffect(() => {
    // initStorage() kaldırıldı, Supabase kullanılıyor.
    const savedUser = getFromStorage(STORAGE_KEYS.CURRENT_USER, null);
    if (savedUser) {
      setCurrentUser(savedUser);
      setCurrentRole(savedUser.role);
    }
  }, []);

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentRole(null);
    setIsAuthMode(false);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    toast.success('Başarıyla çıkış yapıldı');
  };

  const handleLogin = (user) => {
    setCurrentUser(user);
    setCurrentRole(user.role);
    setIsAuthMode(false);
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  };

  const renderDashboard = () => {
    switch (currentRole) {
      case 'student': return <StudentDashboard user={currentUser} />;
      case 'teacher': return <TeacherDashboard user={currentUser} />;
      case 'chef': return <ChefDashboard user={currentUser} />;
      case 'manager': return <ManagerDashboard user={currentUser} />;
      default: return null;
    }
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors duration-500 font-sans">
        <Toaster 
          position="top-right" 
          toastOptions={{
            className: 'dark:bg-slate-800 dark:text-slate-200',
            style: {
              borderRadius: '16px',
              padding: '12px 16px',
              fontSize: '14px',
              fontWeight: '500',
            },
          }}
        />
        
        {!currentUser ? (
          !isAuthMode ? (
            <RoleSelector onSelect={(role) => {
              setCurrentRole(role);
              setIsAuthMode(true);
            }} />
          ) : (
            <AuthScreen 
              role={currentRole} 
              onBack={() => setIsAuthMode(false)} 
              onLogin={handleLogin}
            />
          )
        ) : (
          <>
            <Navbar user={currentUser} onLogout={handleLogout} />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {renderDashboard()}
            </main>
          </>
        )}
      </div>
    </ThemeProvider>
  );
}

export default App;
