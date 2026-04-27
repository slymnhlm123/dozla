import React, { useState, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { initStorage, getFromStorage, STORAGE_KEYS } from './utils/storage';

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
    initStorage();
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
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-teal-500/20 selection:text-teal-900">
      <Toaster position="top-right" />
      
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
          <main className="max-w-7xl mx-auto px-4 py-8">
            {renderDashboard()}
          </main>
        </>
      )}
    </div>
  );
}

export default App;
