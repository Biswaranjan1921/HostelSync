import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Rooms from './pages/Rooms';
import VerifyMeal from './pages/VerifyMeal';
import SuperAdminUsers from './pages/SuperAdminUsers';
import Notices from './pages/Notices';
import Leaves from './pages/Leaves';
import Complaints from './pages/Complaints';

// New Pages
import Profile from './pages/Profile';
import Fees from './pages/Fees';
import Mess from './pages/Mess';
import VisitorsAttendance from './pages/VisitorsAttendance';
import Hostels from './pages/Hostels';
import AiAnalytics from './pages/AiAnalytics';
import SecurityBackup from './pages/SecurityBackup';
import Support from './pages/Support';
import CaretakerScanner from './pages/CaretakerScanner';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'));

  useEffect(() => {
    const handleAuthExpired = () => {
      setToken(null);
      setUser(null);
    };

    window.addEventListener('auth-expired', handleAuthExpired);
    return () => {
      window.removeEventListener('auth-expired', handleAuthExpired);
    };
  }, []);

  const handleLoginSuccess = (loginData) => {
    setToken(loginData.token);
    setUser(loginData);
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
  };

  if (!token || !user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  const role = user.role || 'STUDENT';

  return (
    <Layout onLogout={handleLogout}>
      <Routes>
        {/* All roles have access to Dashboard */}
        <Route path="/" element={<Dashboard />} />

        {/* Core life modules accessible by all authenticated roles */}
        <Route path="/profile" element={<Profile />} />
        <Route path="/notices" element={<Notices />} />
        <Route path="/leaves" element={<Leaves />} />
        <Route path="/complaints" element={<Complaints />} />
        <Route path="/mess" element={<Mess />} />
        <Route path="/fees" element={<Fees />} />
        <Route path="/support" element={<Support />} />

        {/* Caretaker, Warden (ADMIN) & SUPERADMIN features */}
        {(role === 'ADMIN' || role === 'SUPERADMIN' || role === 'CARETAKER') && (
          <>
            <Route path="/verify-meal" element={<VerifyMeal />} />
            <Route path="/caretaker-scanner" element={<CaretakerScanner />} />
          </>
        )}

        {/* Warden (ADMIN) & SUPERADMIN features */}
        {(role === 'ADMIN' || role === 'SUPERADMIN') && (
          <>
            <Route path="/students" element={<Students />} />
            <Route path="/rooms" element={<Rooms />} />
            <Route path="/attendance" element={<VisitorsAttendance />} />
          </>
        )}

        {/* SUPERADMIN control center modules */}
        {role === 'SUPERADMIN' && (
          <>
            <Route path="/admins" element={<SuperAdminUsers />} />
            <Route path="/hostels" element={<Hostels />} />
            <Route path="/ai-analytics" element={<AiAnalytics />} />
            <Route path="/security-backup" element={<SecurityBackup />} />
          </>
        )}

        {/* Fallback route - Redirect back to Dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
