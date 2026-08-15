import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { ShieldCheck, UserPlus, CheckCircle, XCircle } from 'lucide-react';

export default function Applications() {
  const [studentApps, setStudentApps] = useState([]);
  const [staffApps, setStaffApps] = useState([]);
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedHostelId, setSelectedHostelId] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [students, staff, hostelsList] = await Promise.all([
        api.get('/superadmin/applications/students'),
        api.get('/superadmin/applications/staff'),
        api.hostels.list()
      ]);
      setStudentApps(students);
      setStaffApps(staff);
      setHostels(hostelsList);
      if (hostelsList.length > 0) {
        setSelectedHostelId(hostelsList[0].id);
      }
    } catch (err) {
      setError('Failed to load applications: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApproveStudent = async (id) => {
    if (!selectedHostelId) return;
    try {
      await api.post(`/superadmin/applications/students/${id}/approve`, { hostelId: selectedHostelId });
      setSuccess('Student approved and credentials emailed');
      fetchData();
    } catch (err) {
      setError('Failed to approve student');
    }
  };

  const handleApproveStaff = async (id) => {
    if (!selectedHostelId) return;
    try {
      await api.post(`/superadmin/applications/staff/${id}/approve`, { hostelId: selectedHostelId });
      setSuccess('Staff approved and credentials emailed');
      fetchData();
    } catch (err) {
      setError('Failed to approve staff');
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.headerTitle}>Pending Applications</h1>
      <p style={styles.headerSubtitle}>Review and approve student and superintendent applications</p>

      {error && <div style={styles.error}>{error}</div>}
      {success && <div style={styles.success}>{success}</div>}

      <div style={styles.controls}>
        <label style={styles.label}>Assign to Hostel:</label>
        <select 
          value={selectedHostelId} 
          onChange={(e) => setSelectedHostelId(e.target.value)}
          style={styles.select}
        >
          {hostels.map(h => (
            <option key={h.id} value={h.id}>{h.name}</option>
          ))}
        </select>
      </div>

      <div style={styles.grid}>
        {/* Student Applications */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>Student Admissions</h3>
            <span style={styles.badge}>{studentApps.length}</span>
          </div>
          <div style={styles.listContainer}>
            {studentApps.length === 0 ? (
              <p style={styles.empty}>No pending student applications.</p>
            ) : (
              studentApps.map((app) => (
                <div key={app.id} style={styles.appItem}>
                  <div>
                    <div style={styles.appName}>{app.name}</div>
                    <div style={styles.appMeta}>Email: {app.email}</div>
                    <div style={styles.appMeta}>Phone: {app.phone}</div>
                  </div>
                  <button onClick={() => handleApproveStudent(app.id)} style={styles.approveButton}>
                    Approve
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Staff Applications */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>Staff Applications</h3>
            <span style={styles.badge}>{staffApps.length}</span>
          </div>
          <div style={styles.listContainer}>
            {staffApps.length === 0 ? (
              <p style={styles.empty}>No pending staff applications.</p>
            ) : (
              staffApps.map((app) => (
                <div key={app.id} style={styles.appItem}>
                  <div>
                    <div style={styles.appName}>{app.name}</div>
                    <div style={styles.appMeta}>Email: {app.email}</div>
                    <div style={styles.appMeta}>Phone: {app.phone}</div>
                    <div style={styles.appMeta}>Role: {app.role}</div>
                  </div>
                  <button onClick={() => handleApproveStaff(app.id)} style={styles.approveButton}>
                    Approve
                  </button>
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
  controls: { display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', padding: '1rem', background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' },
  label: { fontWeight: 600, fontSize: '0.9rem' },
  select: { padding: '0.5rem', background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '6px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', alignItems: 'start' },
  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.5rem' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
  cardTitle: { margin: 0, fontSize: '1.15rem', fontWeight: 600 },
  badge: { background: 'rgba(34, 197, 94, 0.15)', color: 'var(--accent)', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 700 },
  listContainer: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  appItem: { background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' },
  appName: { fontWeight: 600, fontSize: '1rem', marginBottom: '0.25rem' },
  appMeta: { fontSize: '0.8rem', color: 'var(--text-muted)' },
  approveButton: { background: 'var(--accent)', color: '#000', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' },
  error: { background: 'rgba(239, 68, 68, 0.12)', border: '1px solid var(--danger)', color: '#fca5a5', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.875rem' },
  success: { background: 'rgba(34, 197, 94, 0.12)', border: '1px solid var(--accent)', color: '#a7f3d0', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.875rem' },
  empty: { color: 'var(--text-muted)', textAlign: 'center', margin: '2rem 0' },
};
