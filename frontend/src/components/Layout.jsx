import { NavLink } from 'react-router-dom';
import { api } from '../api/client';
import { 
  LayoutDashboard, 
  Building, 
  Users, 
  DoorOpen, 
  Utensils, 
  CreditCard, 
  Shield, 
  CalendarDays, 
  ClipboardList, 
  MessageSquare, 
  UserSquare2, 
  BarChart3,
  LogOut,
  HelpCircle,
  Bell,
  Moon,
  Sun
} from 'lucide-react';
import { useState, useEffect } from 'react';
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';
import { useTheme } from '../context/ThemeContext';

export default function Layout({ children, onLogout }) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const role = user.role || 'STUDENT';
  const { isDark, toggleTheme } = useTheme();
  const [notifications, setNotifications] = useState([]);
  const [showNotif, setShowNotif] = useState(false);

  useEffect(() => {
    if (!user.id) return;
    
    const socket = new SockJS('http://localhost:8080/ws-notifications');
    const stompClient = Stomp.over(socket);
    stompClient.debug = () => {}; // disable debug logging
    
    stompClient.connect({}, () => {
      stompClient.subscribe(`/topic/user/${user.id}`, (msg) => {
        const payload = JSON.parse(msg.body);
        setNotifications(prev => [payload.content, ...prev]);
        setShowNotif(true);
      });
      stompClient.subscribe(`/topic/broadcast`, (msg) => {
        const payload = JSON.parse(msg.body);
        setNotifications(prev => [payload.content, ...prev]);
        setShowNotif(true);
      });
    });

    return () => {
      if (stompClient) stompClient.disconnect();
    };
  }, [user.id]);

  const getNavItems = () => {
    if (role === 'SUPERADMIN') {
      return [
        { to: '/', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/hostels', label: 'Hostels', icon: Building },
        { to: '/students', label: 'Students', icon: Users },
        { to: '/rooms', label: 'Rooms', icon: DoorOpen },
        { to: '/verify-meal', label: 'Verify Meal', icon: Utensils },
        { to: '/attendance', label: 'Gate Ops', icon: Shield },
        { to: '/fees', label: 'Fees Ledger', icon: CreditCard },
        { to: '/mess', label: 'Mess', icon: Utensils },
        { to: '/notices', label: 'Notices', icon: CalendarDays },
        { to: '/leaves', label: 'Leaves', icon: ClipboardList },
        { to: '/complaints', label: 'Complaints', icon: MessageSquare },
        { to: '/support', label: 'Support Center', icon: HelpCircle },
        { to: '/admins', label: 'Admins', icon: Users },
        { to: '/reports', label: 'Reports', icon: BarChart3 },
        { to: '/ai-analytics', label: 'AI Engine', icon: BarChart3 },
        { to: '/security-backup', label: 'Security', icon: Shield },
      ];
    } else if (role === 'ADMIN') {
      return [
        { to: '/', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/students', label: 'Students', icon: Users },
        { to: '/rooms', label: 'Rooms', icon: DoorOpen },
        { to: '/attendance', label: 'Gate Ops', icon: Shield },
        { to: '/mess', label: 'Mess Menu', icon: Utensils },
        { to: '/notices', label: 'Notices', icon: CalendarDays },
        { to: '/leaves', label: 'Leaves', icon: ClipboardList },
        { to: '/complaints', label: 'Complaints', icon: MessageSquare },
        { to: '/support', label: 'Support Center', icon: HelpCircle },
        { to: '/reports', label: 'Reports', icon: BarChart3 },
      ];
    } else if (role === 'CARETAKER') {
      return [
        { to: '/', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/caretaker-scanner', label: 'Gate Scan', icon: Shield },
        { to: '/verify-meal', label: 'Dining Scan', icon: Utensils },
        { to: '/support', label: 'Support Center', icon: HelpCircle },
      ];
    } else if (role === 'CANTEEN_STAFF') {
      return [
        { to: '/canteen-dashboard', label: 'Canteen Scanner', icon: Utensils },
      ];
    } else {
      // Student view
      return [
        { to: '/', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/profile', label: 'My Profile', icon: UserSquare2 },
        { to: '/fees', label: 'My Fees', icon: CreditCard },
        { to: '/mess', label: 'Mess Schedule', icon: Utensils },
        { to: '/notices', label: 'Announcements', icon: CalendarDays },
        { to: '/leaves', label: 'Leaves', icon: ClipboardList },
        { to: '/complaints', label: 'Complaints', icon: MessageSquare },
        { to: '/support', label: 'Support Center', icon: HelpCircle },
      ];
    }
  };

  const handleLogout = async () => {
    try {
      await api.auth.logout();
    } catch {
      // Ignore auth logout errors since token might be invalid
    }
    onLogout();
  };

  const getRoleLabel = (r) => {
    if (r === 'ADMIN') return 'Superintendent';
    if (r === 'SUPERADMIN') return 'Super Admin';
    if (r === 'CARETAKER') return 'Caretaker';
    if (r === 'CANTEEN_STAFF') return 'Canteen Staff';
    return 'Resident Student';
  };

  return (
    <div style={styles.wrapper}>
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <img src="/logo.jpg" alt="HostelSync Logo" style={{ width: '38px', height: '38px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--glass-border)', boxShadow: '0 0 10px rgba(0, 188, 255, 0.3)' }} />
          <div style={styles.logo}>HOSTEL SYNC</div>
          <span style={styles.roleBadge}>{getRoleLabel(role)}</span>
        </div>
        <div style={styles.headerRight}>
          <button onClick={toggleTheme} style={styles.iconBtn}>
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowNotif(!showNotif)} style={styles.iconBtn}>
              <Bell size={18} />
              {notifications.length > 0 && <span style={styles.notifBadge}>{notifications.length}</span>}
            </button>
            
            {showNotif && notifications.length > 0 && (
              <div style={styles.notifDropdown} className="glass-card">
                <div style={styles.notifHeader}>
                  <h4 style={{margin: 0}}>Notifications</h4>
                  <button onClick={() => setNotifications([])} style={styles.clearBtn}>Clear</button>
                </div>
                <div style={styles.notifList}>
                  {notifications.map((n, i) => (
                    <div key={i} style={styles.notifItem}>
                      <div style={styles.notifDot}></div>
                      <span style={styles.notifText}>{n}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={styles.userProfile}>
            <span style={styles.userName}>{user.name}</span>
          </div>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            <LogOut size={14} style={{ marginRight: '0.35rem' }} />
            Log Out
          </button>
        </div>
      </header>

      <div style={styles.bodyLayout}>
        <aside style={styles.sidebar}>
          <nav style={styles.nav}>
            {getNavItems().map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                style={({ isActive }) => ({
                  ...styles.navLink,
                  ...(isActive ? styles.navLinkActive : {}),
                })}
              >
                {Icon && <Icon size={16} />}
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
        </aside>

        <main style={styles.main}>
          {children}
        </main>
      </div>
    </div>
  );
}

const styles = {
  wrapper: { minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' },
  header: {
    background: 'var(--surface)',
    borderBottom: '1px solid var(--border)',
    padding: '0.75rem 1.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 100,
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  logo: { fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent)', fontFamily: 'var(--font-sans)', letterSpacing: '0.5px' },
  roleBadge: {
    fontSize: '0.65rem',
    fontWeight: 700,
    background: 'rgba(59, 130, 246, 0.12)',
    border: '1px solid rgba(59, 130, 246, 0.25)',
    padding: '0.15rem 0.45rem',
    borderRadius: '4px',
    color: 'var(--accent)',
    textTransform: 'uppercase',
  },
  bodyLayout: { display: 'flex', flex: 1, minHeight: 'calc(100vh - 53px)' },
  sidebar: {
    width: '240px',
    background: 'var(--surface)',
    borderRight: '1px solid var(--border)',
    padding: '1.5rem 0.75rem',
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
  },
  nav: { display: 'flex', flexDirection: 'column', gap: '0.25rem' },
  navLink: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '0.75rem', 
    padding: '0.65rem 1rem', 
    borderRadius: '8px', 
    color: 'var(--text-muted)', 
    textDecoration: 'none', 
    fontWeight: 600, 
    fontSize: '0.875rem',
    transition: 'all 0.2s',
  },
  navLinkActive: { 
    color: '#ffffff', 
    background: 'var(--accent)',
    boxShadow: 'var(--neon-shadow)'
  },
  headerRight: { display: 'flex', alignItems: 'center', gap: '1.25rem' },
  userProfile: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end' },
  userName: { fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)' },
  logoutBtn: {
    background: 'transparent',
    color: 'var(--text-muted)',
    border: '1px solid var(--border)',
    padding: '0.4rem 0.8rem',
    borderRadius: '6px',
    fontSize: '0.8rem',
    fontWeight: 500,
    display: 'inline-flex',
    alignItems: 'center',
    transition: 'all 0.2s',
    cursor: 'pointer',
  },
  main: { flex: 1, padding: '2rem 3rem', maxWidth: '1400px', width: '100%', boxSizing: 'border-box' },
  
  iconBtn: { background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', position: 'relative', padding: '0.5rem' },
  notifBadge: { position: 'absolute', top: 2, right: 2, background: 'var(--danger)', color: '#fff', fontSize: '0.6rem', fontWeight: 700, padding: '0.1rem 0.3rem', borderRadius: '10px' },
  
  notifDropdown: { position: 'absolute', top: '100%', right: 0, width: '320px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem', zIndex: 1000, boxShadow: '0 10px 25px rgba(0,0,0,0.2)' },
  notifHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '0.5rem' },
  clearBtn: { background: 'transparent', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 },
  notifList: { display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto' },
  notifItem: { display: 'flex', gap: '0.5rem', alignItems: 'flex-start', padding: '0.5rem', background: 'var(--bg)', borderRadius: '6px' },
  notifDot: { width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)', marginTop: '0.25rem' },
  notifText: { fontSize: '0.85rem', color: 'var(--text)', lineHeight: '1.4' },
};
