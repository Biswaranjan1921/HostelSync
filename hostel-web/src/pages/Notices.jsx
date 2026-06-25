import { useState, useEffect } from 'react';
import { api } from '../api/client';

export default function Notices() {
  const [notices, setNotices] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'ADMIN' || user.role === 'SUPERADMIN';

  const fetchNotices = async () => {
    try {
      const data = await api.notices.list();
      setNotices(data);
    } catch (err) {
      setError('Failed to load notices: ' + err.message);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const handlePublish = async (e) => {
    e.preventDefault();
    if (!title || !content) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await api.notices.create({ title, content });
      setSuccess('Notice published successfully');
      setTitle('');
      setContent('');
      fetchNotices();
    } catch (err) {
      setError(err.message || 'Failed to publish notice');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this notice?')) {
      return;
    }

    try {
      await api.notices.delete(id);
      setSuccess('Notice deleted successfully');
      fetchNotices();
    } catch (err) {
      setError(err.message || 'Failed to delete notice');
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.headerTitle}>Hostel Notice Board</h1>
      <p style={styles.headerSubtitle}>Official announcements, updates, and news from hostel management</p>

      {error && <div style={styles.error}>{error}</div>}
      {success && <div style={styles.success}>{success}</div>}

      <div style={styles.grid}>
        {/* Admin Publish Form */}
        {isAdmin && (
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Publish Announcement</h3>
            <form onSubmit={handlePublish} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Title / Heading</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Hostel Maintenance Shutdown"
                  style={styles.input}
                  disabled={loading}
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Announcement Body</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write the complete announcement details here..."
                  rows={6}
                  style={{ ...styles.input, resize: 'none' }}
                  disabled={loading}
                  required
                />
              </div>

              <button type="submit" style={styles.button} disabled={loading}>
                {loading ? 'Publishing...' : 'Publish Announcement'}
              </button>
            </form>
          </div>
        )}

        {/* Notices list */}
        <div style={{ ...styles.card, gridColumn: isAdmin ? 'span 1' : 'span 2' }}>
          <h3 style={styles.cardTitle}>Active Notices</h3>
          <div style={styles.listContainer}>
            {notices.length === 0 ? (
              <p style={styles.empty}>No announcements posted yet.</p>
            ) : (
              notices.map((notice) => (
                <div key={notice.id} style={styles.noticeItem}>
                  <div style={styles.noticeContent}>
                    <div style={styles.noticeMeta}>
                      <span>By: <strong>{notice.postedBy}</strong></span>
                      <span>•</span>
                      <span>{new Date(notice.createdAt).toLocaleString()}</span>
                    </div>
                    <div style={styles.noticeTitle}>{notice.title}</div>
                    <div style={styles.noticeBody}>{notice.content}</div>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(notice.id)}
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
  container: { paddingBottom: '2rem' },
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
  listContainer: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  noticeItem: {
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    padding: '1.25rem',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '1rem',
  },
  noticeContent: { flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  noticeMeta: { fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '0.5rem' },
  noticeTitle: { fontWeight: 700, fontSize: '1.1rem', color: 'var(--accent)' },
  noticeBody: { fontSize: '0.95rem', color: 'var(--text)', whiteSpace: 'pre-wrap', lineHeight: '1.5' },
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
