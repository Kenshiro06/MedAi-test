import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import HowItWorks from './components/HowItWorks';
import AIModelShowcase from './components/AIModelShowcase';
import LiveDemo from './components/LiveDemo';
import UseCases from './components/UseCases';
import Testimonials from './components/Testimonials';
import Contact from './components/Contact';
import Footer from './components/Footer';
import LoginModal from './components/LoginModal';
import DashboardLayout from './components/dashboard/DashboardLayout';
import Overview from './components/dashboard/views/Overview';
import Detector from './components/dashboard/views/Detector';
import Analyze from './components/dashboard/views/Analyze';
import SubmitReport from './components/dashboard/views/SubmitReport';
import Reports from './components/dashboard/views/Reports';
import UserManagement from './components/dashboard/views/UserManagement';
import ActivityLogs from './components/dashboard/views/ActivityLogs';
import Profile from './components/dashboard/views/Profile';
import Settings from './components/dashboard/views/Settings';
import Surveillance from './components/dashboard/views/Surveillance';
import ManageLabTechnician from './components/dashboard/views/ManageLabTechnician';
import { authService } from './services/authService';

function App() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('overview');

  // Check if user is already logged in on mount
  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = (role, userData) => {
    setUser(userData);
    setIsLoggedIn(true);
    setIsLoginOpen(false);
    setCurrentView('overview');
  };

  const handleLogout = () => {
    authService.logout();
    setIsLoggedIn(false);
    setUser(null);
  };

  const renderDashboardView = () => {
    if (!user) return null;

    switch (currentView) {
      case 'overview':
        return <Overview role={user.role} user={user} />;
      case 'detector':
        return <Detector role={user.role} user={user} onNavigate={setCurrentView} />;
      case 'analyze':
        return <Analyze role={user.role} user={user} />;
      case 'submit':
        return <SubmitReport role={user.role} user={user} />;
      case 'reports':
        return <Reports role={user.role} user={user} />;
      case 'verify':
        return <Reports role={user.role} user={user} isPathologist={true} />;
      case 'manage_lab_tech':
        return <ManageLabTechnician user={user} />;
      case 'surveillance':
        return <Surveillance user={user} />;
      case 'users':
        return <UserManagement user={user} />;
      case 'logs':
        return <ActivityLogs />;
      case 'profile':
        return <Profile user={user} />;
      case 'settings':
        return <Settings user={user} />;
      default:
        return <Overview role={user.role} user={user} />;
    }
  };

  return (
    <div className="app-container">
      {isLoggedIn && user ? (
        <DashboardLayout
          role={user.role}
          user={user}
          currentView={currentView}
          setView={setCurrentView}
          onLogout={handleLogout}
        >
          {renderDashboardView()}
        </DashboardLayout>
      ) : (
        <>
          <Navbar onLoginClick={() => setIsLoginOpen(true)} isLoggedIn={isLoggedIn} />

          <LoginModal
            isOpen={isLoginOpen}
            onClose={() => setIsLoginOpen(false)}
            onLogin={handleLogin}
          />

          <main style={{ paddingTop: '100px' }}>
            <Hero onLoginClick={() => setIsLoginOpen(true)} />
            <HowItWorks />
            <AIModelShowcase />
            <LiveDemo />
            <UseCases />
            <Testimonials />
            <Contact />
          </main>

          <Footer />
        </>
      )}
    </div>
  );
}

export default App;
