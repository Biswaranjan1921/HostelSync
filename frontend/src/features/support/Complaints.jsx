import { useState, useEffect } from 'react';
import { api } from '../../api/client';

const CATEGORIES = [
  { value: 'PLUMBING', label: 'Plumbing & Water' },
  { value: 'ELECTRICAL', label: 'Electrical & Lighting' },
  { value: 'WIFI', label: 'WiFi & Internet' },
  { value: 'CLEANING', label: 'Cleaning & Housekeeping' },
  { value: 'OTHER', label: 'Other Issues' },
];

export default function Complaints() {
  const [complaints, setComplaints] = useState([]);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('PLUMBING');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isStudent = user.role === 'STUDENT';

  const fetchComplaints = async () => {
    try {
      const data = await api.complaints.list();
      setComplaints(data);
    } catch (err) {
      setError('Failed to load complaints: ' + err.message);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title || !category || !description) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await api.complaints.create({
        title,
        category,
        description,
      });
      setSuccess('Complaint filed successfully. The staff will review it shortly.');
      setTitle('');
      setCategory('PLUMBING');
      setDescription('');
      fetchComplaints();
    } catch (err) {
      setError(err.message || 'Failed to file complaint');
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (id) => {
    try {
      await api.complaints.updateStatus(id, 'RESOLVED');
      setSuccess('Complaint marked as resolved');
      fetchComplaints();
    } catch (err) {
      setError(err.message || 'Failed to update complaint status');
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.headerTitle}>Hostel Complaints & Feedback</h1>
      <p style={styles.headerSubtitle}>
        {isStudent
          ? 'Submit maintenance requests or hostel issues and monitor progress'
          : 'Monitor and resolve student-reported maintenance issues'}
      </p>

      {error && <div style={styles.error}>{error}</div>}
      {success && <div style={styles.success}>{success}</div>}

      <div style={styles.grid}>
        {/* Student Complaint Form */}
        {isStudent && (
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>File a Complaint</h3>
            <form onSubmit={handleCreate} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={styles.select}
                  disabled={loading}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Title / Subject</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Water leak in Block A washroom"
                  style={styles.input}
                  disabled={loading}
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide detailed description of the problem..."
                  rows={4}
                  style={{ ...styles.input, resize: 'none' }}
                  disabled={loading}
                  required
                />
              </div>

              <button type="submit" style={styles.button} disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Complaint'}
              </button>
            </form>
          </div>
        )}

        {/* Complaints List */}
        <div style={{ ...styles.card, gridColumn: isStudent ? 'span 1' : 'span 2' }}>
          <h3 style={styles.cardTitle}>
            {isStudent ? 'My Reported Issues' : 'All Reported Issues'}
          </h3>
          <div style={styles.listContainer}>
            {complaints.length === 0 ? (
              <p style={styles.empty}>No reported complaints.</p>
            ) : (
              complaints.map((comp) => (
                <div key={comp.id} style={styles.complaintItem}>
                  <div style={styles.complaintContent}>
                    <div style={styles.complaintHeader}>
                      <span style={styles.categoryLabel}>
                        {CATEGORIES.find((c) => c.value === comp.category)?.label || comp.category}
                      </span>
                      <span
                        style={{
                          ...styles.statusBadge,
                          ...(comp.status === 'RESOLVED'
                            ? styles.statusResolved
                            : styles.statusOpen),
                        }}
                      >
                        {comp.status}
                      </span>
                    </div>
                    <div style={styles.complaintTitle}>{comp.title}</div>
                    {!isStudent && (
                      <div style={styles.studentMeta}>
                        Student: <strong>{comp.studentName}</strong> (ID: {comp.studentId})
                      </div>
                    )}
                    <div style={styles.complaintDesc}>{comp.description}</div>
                    <div style={styles.complaintTime}>
                      Reported: {new Date(comp.createdAt).toLocaleString()}
                    </div>
                  </div>

                  {!isStudent && comp.status === 'OPEN' && (
                    <button
                      onClick={() => handleResolve(comp.id)}
                      style={styles.resolveButton}
                    >
                      Mark Resolved
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
  select: {
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
  listContainer: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  complaintItem: {
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    padding: '1rem',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  complaintContent: { flex: 1, display: 'flex', flexDirection: 'column', gap: '0.35rem' },
  complaintHeader: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  categoryLabel: {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'var(--accent)',
    background: 'rgba(34, 197, 94, 0.08)',
    padding: '0.15rem 0.4rem',
    borderRadius: '4px',
  },
  complaintTitle: { fontWeight: 600, fontSize: '0.95rem', marginTop: '0.25rem' },
  studentMeta: { fontSize: '0.85rem', color: 'var(--text-muted)' },
  complaintDesc: { fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.4' },
  complaintTime: { fontSize: '0.75rem', color: 'var(--text-muted)' },
  statusBadge: {
    fontSize: '0.7rem',
    fontWeight: 700,
    padding: '0.15rem 0.5rem',
    borderRadius: '4px',
    textTransform: 'uppercase',
  },
  statusResolved: { background: 'rgba(34, 197, 94, 0.15)', color: 'var(--accent)' },
  statusOpen: { background: 'rgba(239, 68, 68, 0.15)', color: 'var(--danger)' },
  resolveButton: {
    background: 'var(--accent)',
    color: '#000',
    border: 'none',
    padding: '0.4rem 0.8rem',
    borderRadius: '6px',
    fontSize: '0.8rem',
    fontWeight: 600,
  },
  empty: { color: 'var(--text-muted)', textAlign: 'center', margin: '2rem 0' },
};
