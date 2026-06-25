import { useState, useEffect } from 'react';
import { api } from '../api/client';

export default function SuperAdminUsers() {
  const [users, setUsers] = useState([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchUsers = async () => {
    try {
      const data = await api.auth.listUsers();
      setUsers(data);
    } catch (err) {
      setError('Failed to load users: ' + err.message);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    if (!username || !password || !name) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await api.auth.createUser({
        username,
        password,
        name,
        role: 'ADMIN',
      });
      setSuccess('Admin account created successfully');
      setUsername('');
      setPassword('');
      setName('');
      fetchUsers();
    } catch (err) {
      setError(err.message || 'Failed to create admin');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAdmin = async (id, userName) => {
    if (!confirm(`Are you sure you want to delete admin account "${userName}"?`)) {
      return;
    }
    try {
      await api.auth.deleteUser(id);
      setSuccess('User deleted successfully');
      fetchUsers();
    } catch (err) {
      setError(err.message || 'Failed to delete user');
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.headerTitle}>System Administrators</h1>
      <p style={styles.headerSubtitle}>Create and manage administrator accounts for hostel operations</p>

      {error && <div style={styles.error}>{error}</div>}
      {success && <div style={styles.success}>{success}</div>}

      <div style={styles.grid}>
        {/* Create Form */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Create Admin Account</h3>
          <form onSubmit={handleAddAdmin} style={styles.form}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex Smith"
                style={styles.input}
                disabled={loading}
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Username / Email</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. alex.smith"
                style={styles.input}
                disabled={loading}
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={styles.input}
                disabled={loading}
                required
              />
            </div>

            <button type="submit" style={styles.button} disabled={loading}>
              {loading ? 'Creating...' : 'Create Admin'}
            </button>
          </form>
        </div>

        {/* Admin List */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Active User Accounts</h3>
          <div style={styles.listContainer}>
            {users.length === 0 ? (
              <p style={styles.empty}>No accounts found.</p>
            ) : (
              users.map((user) => (
                <div key={user.id} style={styles.userItem}>
                  <div>
                    <div style={styles.userName}>
                      {user.name}{' '}
                      <span
                        style={{
                          ...styles.badge,
                          ...(user.role === 'SUPERADMIN'
                            ? styles.badgeSuper
                            : user.role === 'ADMIN'
                            ? styles.badgeAdmin
                            : styles.badgeStudent),
                        }}
                      >
                        {user.role}
                      </span>
                    </div>
                    <div style={styles.userUsername}>Username: {user.username}</div>
                  </div>
                  {user.role !== 'SUPERADMIN' && (
                    <button
                      onClick={() => handleDeleteAdmin(user.id, user.username)}
                      style={styles.deleteButton}
                    >
                      Delete
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    paddingBottom: '2rem',
  },
  headerTitle: { fontSize: '2rem', fontWeight: 700, margin: '0 0 0.25rem 0' },
  headerSubtitle: { color: 'var(--text-muted)', margin: '0 0 2rem 0' },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '1.5rem',
    alignItems: 'start',
  },
  card: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '1.5rem',
  },
  cardTitle: { margin: '0 0 1.5rem 0', fontSize: '1.15rem', fontWeight: 600 },
  form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  label: { fontSize: '0.85rem', color: 'var(--text-muted)' },
  input: {
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    color: 'var(--text)',
    padding: '0.65rem 0.85rem',
    borderRadius: '6px',
    fontSize: '0.9rem',
    outline: 'none',
  },
  button: {
    background: 'var(--accent)',
    color: '#000',
    border: 'none',
    borderRadius: '6px',
    padding: '0.65rem',
    fontWeight: 600,
    fontSize: '0.9rem',
    marginTop: '0.5rem',
  },
  error: {
    background: 'rgba(239, 68, 68, 0.12)',
    border: '1px solid var(--danger)',
    color: '#fca5a5',
    borderRadius: '8px',
    padding: '0.75rem 1rem',
    marginBottom: '1rem',
    fontSize: '0.875rem',
  },
  success: {
    background: 'rgba(34, 197, 94, 0.12)',
    border: '1px solid var(--accent)',
    color: '#a7f3d0',
    borderRadius: '8px',
    padding: '0.75rem 1rem',
    marginBottom: '1rem',
    fontSize: '0.875rem',
  },
  listContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  userItem: {
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    padding: '1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
  },
  userName: { fontWeight: 600, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' },
  userUsername: { fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' },
  badge: {
    fontSize: '0.65rem',
    fontWeight: 700,
    padding: '0.15rem 0.4rem',
    borderRadius: '4px',
  },
  badgeSuper: { background: 'rgba(234, 179, 8, 0.15)', color: 'var(--warning)' },
  badgeAdmin: { background: 'rgba(34, 197, 94, 0.15)', color: 'var(--accent)' },
  badgeStudent: { background: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa' },
  deleteButton: {
    background: 'transparent',
    color: 'var(--danger)',
    border: '1px solid var(--danger)',
    padding: '0.35rem 0.65rem',
    borderRadius: '6px',
    fontSize: '0.8rem',
    fontWeight: 500,
  },
  empty: { color: 'var(--text-muted)', textAlign: 'center', margin: '2rem 0' },
};
