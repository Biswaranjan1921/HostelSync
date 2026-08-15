import { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { User, UserPlus, X } from 'lucide-react';

export default function RoomVisualizer({ roomId, onClose, onAssigned }) {
  const [layout, setLayout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // For assignment
  const [assigningBed, setAssigningBed] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  
  useEffect(() => {
    loadLayout();
  }, [roomId]);
  
  const loadLayout = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/rooms/${roomId}/layout`);
      setLayout(res);
      
      // Load available students who need rooms
      const allStudents = await api.students.list();
      setStudents(allStudents.filter(s => s.status === 'PENDING_SUPERADMIN' || s.status === 'PENDING_PROFILE_SETUP' || !s.roomId));
    } catch (err) {
      setError(err.message || 'Failed to load layout');
    } finally {
      setLoading(false);
    }
  };
  
  const handleAssignClick = (bedIndex) => {
    setAssigningBed(bedIndex);
    setSelectedStudent('');
  };
  
  const confirmAssignment = async () => {
    if (!selectedStudent) return;
    try {
      await api.post(`/rooms/${roomId}/assign-bed`, {
        studentId: Number(selectedStudent),
        bedIndex: assigningBed
      });
      setAssigningBed(null);
      loadLayout();
      if (onAssigned) onAssigned();
    } catch (err) {
      alert(err.message || 'Assignment failed');
    }
  };

  if (loading && !layout) {
    return (
      <div style={styles.overlay}>
        <div style={styles.modal}>
          <p>Loading layout...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.overlay}>
        <div style={styles.modal}>
          <h3 style={{ color: 'var(--danger)' }}>Error</h3>
          <p>{error}</p>
          <button onClick={onClose} style={styles.btnSecondary}>Close</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.title}>
            Room {layout.room.block}-{layout.room.number} 
            <span style={styles.capacityLabel}>
              ({layout.beds.filter(b => b.occupied).length}/{layout.room.capacity} beds)
            </span>
          </h2>
          <button onClick={onClose} style={styles.closeBtn}><X size={20} /></button>
        </div>
        
        <div style={styles.bedGrid}>
          {layout.beds.map((bed) => (
            <div 
              key={bed.bedIndex} 
              style={{
                ...styles.bedCard,
                ...(bed.occupied ? styles.bedOccupied : styles.bedVacant)
              }}
            >
              <div style={styles.bedHeader}>
                <span style={styles.bedLabel}>Bed {bed.bedIndex}</span>
                {bed.occupied ? (
                  <span style={styles.statusBadgeOccupied}>Occupied</span>
                ) : (
                  <span style={styles.statusBadgeVacant}>Vacant</span>
                )}
              </div>
              
              <div style={styles.bedContent}>
                {bed.occupied ? (
                  <div style={styles.occupantInfo}>
                    <User size={32} color="#fff" style={{ background: 'rgba(255,255,255,0.2)', padding: '6px', borderRadius: '50%' }} />
                    <div>
                      <div style={styles.occupantName}>{bed.studentName}</div>
                      <div style={styles.occupantId}>ID: {bed.studentId}</div>
                    </div>
                  </div>
                ) : (
                  <button 
                    style={styles.assignBtn}
                    onClick={() => handleAssignClick(bed.bedIndex)}
                  >
                    <UserPlus size={16} /> Assign Student
                  </button>
                )}
              </div>
              
              {/* Assignment Form inline */}
              {assigningBed === bed.bedIndex && !bed.occupied && (
                <div style={styles.assignForm}>
                  <select 
                    style={styles.select}
                    value={selectedStudent}
                    onChange={(e) => setSelectedStudent(e.target.value)}
                  >
                    <option value="">Select a student...</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
                    ))}
                  </select>
                  <div style={styles.formActions}>
                    <button style={styles.btnSecondarySm} onClick={() => setAssigningBed(null)}>Cancel</button>
                    <button style={styles.btnPrimarySm} onClick={confirmAssignment} disabled={!selectedStudent}>Confirm</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(0, 0, 0, 0.75)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000,
    padding: '1rem'
  },
  modal: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    padding: '1.5rem',
    width: '100%',
    maxWidth: '800px',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' },
  title: { margin: 0, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' },
  capacityLabel: { fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 'normal' },
  closeBtn: { background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' },
  
  bedGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' },
  bedCard: {
    border: '1px solid var(--border)',
    borderRadius: '10px',
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    transition: 'all 0.2s',
  },
  bedOccupied: {
    background: 'linear-gradient(145deg, rgba(220, 38, 38, 0.15) 0%, rgba(220, 38, 38, 0.05) 100%)',
    borderColor: 'rgba(220, 38, 38, 0.3)',
  },
  bedVacant: {
    background: 'linear-gradient(145deg, rgba(34, 197, 94, 0.1) 0%, rgba(34, 197, 94, 0.02) 100%)',
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  
  bedHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  bedLabel: { fontWeight: 700, fontSize: '1.1rem' },
  statusBadgeOccupied: { background: '#ef4444', color: '#fff', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' },
  statusBadgeVacant: { background: '#22c55e', color: '#fff', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' },
  
  bedContent: { minHeight: '60px', display: 'flex', alignItems: 'center' },
  occupantInfo: { display: 'flex', alignItems: 'center', gap: '1rem' },
  occupantName: { fontWeight: 600, fontSize: '1.1rem' },
  occupantId: { color: 'var(--text-muted)', fontSize: '0.85rem' },
  
  assignBtn: {
    background: 'var(--accent)', color: '#000',
    border: 'none', padding: '0.5rem 1rem',
    borderRadius: '6px', fontWeight: 600,
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    cursor: 'pointer', width: '100%', justifyContent: 'center'
  },
  
  assignForm: { background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '8px', marginTop: '0.5rem', border: '1px dashed var(--border)' },
  select: { width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', marginBottom: '0.5rem' },
  formActions: { display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' },
  
  btnSecondary: { background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer' },
  btnSecondarySm: { background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', padding: '0.35rem 0.75rem', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer' },
  btnPrimarySm: { background: 'var(--accent)', border: 'none', color: '#000', padding: '0.35rem 0.75rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer' },
};
