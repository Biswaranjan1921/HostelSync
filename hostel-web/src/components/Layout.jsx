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
  HelpCircle
} from 'lucide-react';

export default function Layout({ children, onLogout }) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const role = user.role || 'STUDENT';

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
        { to: '/ai-analytics', label: 'AI Engine', icon: BarChart3 },
        { to: '/security-backup', label: 'Security', icon: Shield },
      ];
    } else if (role === 'ADMIN') {
      return [
        { to: '/', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/students', label: 'Students', icon: Users },
        { to: '/rooms', label: 'Rooms', icon: DoorOpen },
        { to: '/verify-meal', label: 'Verify Meal', icon: Utensils },
        { to: '/attendance', label: 'Gate Ops', icon: Shield },
        { to: '/fees', label: 'Fees Ledger', icon: CreditCard },
        { to: '/mess', label: 'Mess Menu', icon: Utensils },
        { to: '/notices', label: 'Notices', icon: CalendarDays },
        { to: '/leaves', label: 'Leaves', icon: ClipboardList },
        { to: '/complaints', label: 'Complaints', icon: MessageSquare },
        { to: '/support', label: 'Support Center', icon: HelpCircle },
      ];
    } else if (role === 'CARETAKER') {
      return [
        { to: '/', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/caretaker-scanner', label: 'Gate Scan', icon: Shield },
        { to: '/verify-meal', label: 'Dining Scan', icon: Utensils },
        { to: '/support', label: 'Support Center', icon: HelpCircle },
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
    return 'Resident Student';
  };

  return (
    <div style={styles.wrapper}>
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.logo}>HostelSync</div>
          <span style={styles.roleBadge}>{getRoleLabel(role)}</span>
        </div>
        <div style={styles.headerRight}>
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
};
