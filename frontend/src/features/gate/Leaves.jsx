import { useState, useEffect } from 'react';
import { api } from '../../api/client';

export default function Leaves() {
  const [leaves, setLeaves] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedGatePass, setSelectedGatePass] = useState(null);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isStudent = user.role === 'STUDENT';

  const fetchLeaves = async () => {
    try {
      const data = await api.leaves.list();
      setLeaves(data);
    } catch (err) {
      setError('Failed to load leaves: ' + err.message);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleApply = async (e) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await api.leaves.create({
        startDate,
        endDate,
        reason,
      });
      setSuccess('Leave request submitted successfully');
      setStartDate('');
      setEndDate('');
      setReason('');
      fetchLeaves();
    } catch (err) {
      setError(err.message || 'Failed to submit leave request');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.leaves.updateStatus(id, status);
      setSuccess(`Leave request status updated to ${status}`);
      fetchLeaves();
    } catch (err) {
      setError(err.message || 'Failed to update leave status');
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.headerTitle}>Leave Applications</h1>
      <p style={styles.headerSubtitle}>
        {isStudent
          ? 'Apply for leave requests and track approval status'
          : 'Review and manage student leave applications'}
      </p>

      {error && <div style={styles.error}>{error}</div>}
      {success && <div style={styles.success}>{success}</div>}

      <div style={styles.grid}>
        {/* Student Leave Request Form */}
        {isStudent && (
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>New Leave Request</h3>
            <form onSubmit={handleApply} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={styles.input}
                  disabled={loading}
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={styles.input}
                  disabled={loading}
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Reason for Leave</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain why you need to leave the hostel..."
                  rows={4}
                  style={{ ...styles.input, resize: 'none' }}
                  disabled={loading}
                  required
                />
              </div>

              <button type="submit" style={styles.button} disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Application'}
              </button>
            </form>
          </div>
        )}

        {/* Leave Requests List */}
        <div style={{ ...styles.card, gridColumn: isStudent ? 'span 1' : 'span 2' }}>
          <h3 style={styles.cardTitle}>
            {isStudent ? 'My Leave Applications' : 'All Leave Applications'}
          </h3>
          <div style={styles.listContainer}>
            {leaves.length === 0 ? (
              <p style={styles.empty}>No leave applications found.</p>
            ) : (
              leaves.map((leave) => (
                <div key={leave.id} style={styles.leaveItem}>
                  <div style={styles.leaveContent}>
                    <div style={styles.leaveHeader}>
                      <span style={styles.leaveDuration}>
                        {leave.startDate} to {leave.endDate}
                      </span>
                      <span
                        style={{
                          ...styles.statusBadge,
                          ...(leave.status === 'APPROVED'
                            ? styles.statusApproved
                            : leave.status === 'REJECTED'
                            ? styles.statusRejected
                            : styles.statusPending),
                        }}
                      >
                        {leave.status}
                      </span>
                    </div>
                    {!isStudent && (
                      <div style={styles.studentMeta}>
                        Student: <strong>{leave.studentName}</strong> (ID: {leave.studentId})
                      </div>
                    )}
                    <div style={styles.leaveReason}>
                      <strong>Reason:</strong> {leave.reason}
                    </div>
                    <div style={styles.leaveTime}>
                      Submitted: {new Date(leave.createdAt).toLocaleString()}
                    </div>
                  </div>

                  {!isStudent && leave.status === 'PENDING' && (
                    <div style={styles.actionButtons}>
                      <button
                        onClick={() => handleUpdateStatus(leave.id, 'APPROVED')}
                        style={styles.approveButton}
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(leave.id, 'REJECTED')}
                        style={styles.rejectButton}
                      >
                        Reject
                      </button>
                    </div>
                  )}

                  {leave.status === 'APPROVED' && (
                    <div style={{ marginTop: '0.75rem' }}>
                      <button
                        onClick={() => setSelectedGatePass(leave)}
                        style={styles.gatePassBtn}
                      >
                        🎟️ View Approved Gate Pass QR
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Gate Pass Modal */}
      {selectedGatePass && (
        <div style={styles.modalOverlay} onClick={() => setSelectedGatePass(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={{ margin: 0, color: 'var(--accent)', fontSize: '1.25rem' }}>🎟️ Official Hostel Gate Pass</h2>
              <button onClick={() => setSelectedGatePass(null)} style={styles.closeBtn}>✕</button>
            </div>
            
            <div style={styles.modalBody}>
              <div style={styles.approvedBadge}>
                ✓ APPROVED BY HOSTEL SUPERINTENDENT
              </div>

              <div style={styles.qrContainer}>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=GATEPASS-${selectedGatePass.id}-${selectedGatePass.studentId}`}
                  alt="Gate Pass QR"
                  style={{ width: '180px', height: '180px', borderRadius: '12px', border: '2px solid var(--accent)' }}
                />
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem', fontFamily: 'monospace' }}>
                  GATEPASS-{selectedGatePass.id}-{selectedGatePass.studentId}
                </div>
              </div>

              <div style={styles.passMeta}>
                <div><strong>Student Name:</strong> {selectedGatePass.studentName || user.name}</div>
                <div><strong>Student ID:</strong> #{selectedGatePass.studentId}</div>
                <div><strong>Leave Duration:</strong> {selectedGatePass.startDate} to {selectedGatePass.endDate}</div>
                <div><strong>Reason:</strong> {selectedGatePass.reason}</div>
                <div><strong>Gate Verification:</strong> Scan at Security Gate</div>
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button onClick={() => window.print()} style={styles.printBtn}>🖨️ Print Pass</button>
              <button onClick={() => setSelectedGatePass(null)} style={styles.modalCloseBtn}>Close</button>
            </div>
          </div>
        </div>
      )}
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
  listContainer: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  leaveItem: {
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
  leaveContent: { flex: 1, display: 'flex', flexDirection: 'column', gap: '0.35rem' },
  leaveHeader: { display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' },
  leaveDuration: { fontWeight: 600, fontSize: '0.95rem' },
  studentMeta: { fontSize: '0.85rem', color: 'var(--text-muted)' },
  leaveReason: { fontSize: '0.9rem', color: 'var(--text)' },
  leaveTime: { fontSize: '0.75rem', color: 'var(--text-muted)' },
  statusBadge: {
    fontSize: '0.7rem',
    fontWeight: 700,
    padding: '0.15rem 0.5rem',
    borderRadius: '4px',
    textTransform: 'uppercase',
  },
  statusApproved: { background: 'rgba(34, 197, 94, 0.15)', color: 'var(--accent)' },
  statusRejected: { background: 'rgba(239, 68, 68, 0.15)', color: 'var(--danger)' },
  statusPending: { background: 'rgba(234, 179, 8, 0.15)', color: 'var(--warning)' },
  actionButtons: { display: 'flex', gap: '0.5rem' },
  approveButton: {
    background: 'var(--accent)',
    color: '#000',
    border: 'none',
    padding: '0.4rem 0.8rem',
    borderRadius: '6px',
    fontSize: '0.8rem',
    fontWeight: 600,
  },
  rejectButton: {
    background: 'rgba(239, 68, 68, 0.15)',
    color: 'var(--danger)',
    border: '1px solid var(--danger)',
    padding: '0.4rem 0.8rem',
    borderRadius: '6px',
    fontSize: '0.8rem',
    fontWeight: 600,
  },
  empty: { color: 'var(--text-muted)', textAlign: 'center', margin: '2rem 0' },
  gatePassBtn: { background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#fff', border: 'none', padding: '0.4rem 0.85rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' },
  modalContent: { background: 'var(--surface)', border: '1px solid var(--glass-border)', borderRadius: '16px', width: '90%', maxWidth: '440px', padding: '1.5rem', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' },
  closeBtn: { background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.25rem', cursor: 'pointer' },
  modalBody: { padding: '1.25rem 0', textAlign: 'center' },
  approvedBadge: { background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', border: '1px solid #22c55e', padding: '0.4rem 0.85rem', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.75rem', display: 'inline-block', marginBottom: '1.25rem' },
  qrContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.25rem' },
  passMeta: { textAlign: 'left', background: 'var(--bg)', padding: '1rem', borderRadius: '10px', fontSize: '0.85rem', lineHeight: '1.6', border: '1px solid var(--border)' },
  modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' },
  printBtn: { background: 'var(--accent)', color: '#000', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' },
  modalCloseBtn: { background: 'var(--surface-hover)', color: 'var(--text)', border: '1px solid var(--border)', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer' },
};
