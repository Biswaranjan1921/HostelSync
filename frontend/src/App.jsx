import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './features/auth/Login';
import OAuth2RedirectHandler from './features/auth/OAuth2RedirectHandler';
import Dashboard from './features/dashboard/Dashboard';
import Students from './features/students/Students';
import Rooms from './features/rooms/Rooms';
import VerifyMeal from './features/dining/VerifyMeal';
import SuperAdminUsers from './pages/SuperAdminUsers';
import Notices from './pages/Notices';
import Leaves from './features/gate/Leaves';
import Complaints from './features/support/Complaints';
import Applications from './pages/Applications';

// New Pages
import Profile from './features/dashboard/Profile';
import Fees from './pages/Fees';
import Mess from './features/dining/Mess';
import VisitorsAttendance from './features/gate/VisitorsAttendance';
import Hostels from './features/rooms/Hostels';
import AiAnalytics from './features/dashboard/AiAnalytics';
import SecurityBackup from './features/support/SecurityBackup';
import Support from './features/support/Support';
import CaretakerScanner from './features/gate/CaretakerScanner';
import CanteenDashboard from './pages/CanteenDashboard';
import Reports from './pages/Reports';

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

  const isOAuthRedirect = window.location.pathname.startsWith('/oauth2/redirect');

  if (!token || !user) {
    if (isOAuthRedirect) {
      return (
        <Routes>
          <Route path="/oauth2/redirect" element={<OAuth2RedirectHandler onLoginSuccess={handleLoginSuccess} />} />
        </Routes>
      );
    }
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  const role = user.role || 'STUDENT';

  return (
    <Layout onLogout={handleLogout}>
      <Routes>
        {/* Root route: CANTEEN_STAFF is redirected directly to /canteen-dashboard */}
        <Route path="/" element={role === 'CANTEEN_STAFF' ? <Navigate to="/canteen-dashboard" replace /> : <Dashboard />} />

        {/* Core life modules accessible by all authenticated roles */}
        <Route path="/profile" element={<Profile />} />
        <Route path="/notices" element={<Notices />} />
        <Route path="/leaves" element={<Leaves />} />
        <Route path="/complaints" element={<Complaints />} />
        <Route path="/mess" element={<Mess />} />
        <Route path="/fees" element={<Fees />} />
        <Route path="/support" element={<Support />} />

        {/* Caretaker & SUPERADMIN features */}
        {(role === 'SUPERADMIN' || role === 'CARETAKER') && (
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
            <Route path="/reports" element={<Reports />} />
          </>
        )}

        {/* SUPERADMIN control center modules */}
        {role === 'SUPERADMIN' && (
          <>
            <Route path="/applications" element={<Applications />} />
            <Route path="/admins" element={<SuperAdminUsers />} />
            <Route path="/hostels" element={<Hostels />} />
            <Route path="/ai-analytics" element={<AiAnalytics />} />
            <Route path="/security-backup" element={<SecurityBackup />} />
          </>
        )}

        {/* CANTEEN_STAFF specific route */}
        {role === 'CANTEEN_STAFF' && (
          <Route path="/canteen-dashboard" element={<CanteenDashboard />} />
        )}

        {/* Fallback route - Redirect back to Dashboard for others, or CanteenDashboard for CANTEEN_STAFF */}
        <Route path="*" element={<Navigate to={role === 'CANTEEN_STAFF' ? '/canteen-dashboard' : '/'} replace />} />
      </Routes>
    </Layout>
  );
}
