import { useState, useEffect, useRef } from 'react';
import { api } from '../api/client';

export default function Profile() {
  const [student, setStudent] = useState(null);
  const [stats, setStats] = useState(null);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState('');
  const [photoBase64, setPhotoBase64] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  const fileInputRef = useRef(null);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const loadProfile = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      if (user.studentId) {
        const [studentData, statsData] = await Promise.all([
          api.students.get(user.studentId),
          api.dashboard.studentStats(),
        ]);
        setStudent(studentData);
        setStats(statsData);
        
        setEmail(studentData.email || '');
        setPhone(studentData.phone || '');
        setDepartment(studentData.department || '');
        setYear(studentData.year || '');
        setPhotoBase64(studentData.photoBase64 || '');
      }
    } catch (err) {
      setErrorMsg('Failed to load profile: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrorMsg('Image size must be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoBase64(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const updated = await api.students.update(user.studentId, {
        email,
        phone,
        department,
        year: year ? parseInt(year) : null,
        photoBase64,
      });
      setStudent(updated);
      setSuccessMsg('Profile updated successfully!');
      
      // Update local storage name if changed
      const localUser = JSON.parse(localStorage.getItem('user') || '{}');
      localUser.email = email;
      localStorage.setItem('user', JSON.stringify(localUser));
      
      // Reload stats to get updated info
      const statsData = await api.dashboard.studentStats();
      setStats(statsData);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={styles.centered}>Loading profile details…</div>;

  const room = stats?.roomDetails || {};
  const hostel = stats?.hostelDetails || {};
  const roommates = stats?.roommates || [];

  return (
    <div style={styles.container}>
      <h1 style={styles.headerTitle}>My Profile</h1>
      <p style={styles.headerSubtitle}>View and manage your personal hostel profile, contact details, and roommate lists</p>

      {successMsg && <div style={styles.success}>{successMsg}</div>}
      {errorMsg && <div style={styles.error}>{errorMsg}</div>}

      <div style={styles.grid}>
        {/* Profile Card & Roommates */}
        <div style={styles.columnLeft}>
          <div style={styles.cardHighlight}>
            <div style={styles.avatarSection}>
              <div style={styles.avatarWrapper}>
                {photoBase64 ? (
                  <img src={photoBase64} alt="Avatar" style={styles.avatarImg} />
                ) : (
                  <div style={styles.avatarPlaceholder}>{student?.name?.charAt(0)}</div>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={styles.avatarBtn}
              >
                Change Photo
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoUpload}
                accept="image/*"
                style={{ display: 'none' }}
              />
            </div>

            <div style={styles.nameHeader}>
              <h2 style={styles.studentName}>{student?.name}</h2>
              <span style={styles.deptBadge}>{student?.department || 'N/A'} (Year {student?.year || 'N/A'})</span>
            </div>

            <hr style={styles.divider} />

            <div style={styles.hostelInfo}>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Hostel Building</span>
                <span style={styles.infoVal}>{hostel.name || 'Not Assigned'} ({hostel.code || 'N/A'})</span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Room Allocation</span>
                <span style={styles.infoVal}>Room {room.number || 'Not Assigned'} (Block {room.block || 'N/A'}, Floor {room.floor || 'N/A'})</span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>QR Token ID</span>
                <span style={styles.infoValCode}>{student?.qrToken}</span>
              </div>
            </div>
          </div>

          <div style={styles.card}>
            <h3 style={styles.cardTitle}>My Roommates</h3>
            {roommates.length === 0 ? (
              <p style={styles.emptyText}>You are currently the only resident in this room.</p>
            ) : (
              <div style={styles.roommateList}>
                {roommates.map((r) => (
                  <div key={r.id} style={styles.roommateItem}>
                    <div style={styles.roommateAvatar}>
                      {r.photoBase64 ? (
                        <img src={r.photoBase64} alt={r.name} style={styles.roommateImg} />
                      ) : (
                        r.name.charAt(0)
                      )}
                    </div>
                    <div style={styles.roommateMeta}>
                      <div style={styles.roommateName}>{r.name}</div>
                      <div style={styles.roommateContact}>{r.email || 'No email'} | {r.phone || 'No phone'}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Edit details form */}
        <div style={styles.columnRight}>
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Update Contact Details</h3>
            <form onSubmit={handleSave} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@college.edu"
                  style={styles.input}
                  disabled={saving}
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +1 555-0199"
                  style={styles.input}
                  disabled={saving}
                  required
                />
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Department</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Computer Science"
                    style={styles.input}
                    disabled={saving}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Study Year</label>
                  <select
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    style={styles.select}
                    disabled={saving}
                  >
                    <option value="">Select Year</option>
                    <option value="1">First Year (Freshman)</option>
                    <option value="2">Second Year (Sophomore)</option>
                    <option value="3">Third Year (Junior)</option>
                    <option value="4">Fourth Year (Senior)</option>
                  </select>
                </div>
              </div>

              <button type="submit" style={styles.submitBtn} disabled={saving}>
                {saving ? 'Saving changes...' : 'Save Profile Changes'}
              </button>
            </form>
          </div>

          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Quick Safety Checklist</h3>
            <div style={styles.checklist}>
              <div style={styles.checkItem}>
                <span style={styles.checkIcon}>✓</span>
                <span>Keep your contact phone updated for parent notifications.</span>
              </div>
              <div style={styles.checkItem}>
                <span style={styles.checkIcon}>✓</span>
                <span>Generate a new gate pass under the <strong>Leaves</strong> tab if exiting campus.</span>
              </div>
              <div style={styles.checkItem}>
                <span style={styles.checkIcon}>✓</span>
                <span>Your meal QR code is sensitive; do not share screenshots of your scanner code.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { paddingBottom: '3rem' },
  headerTitle: { fontSize: '2rem', fontWeight: 700, margin: '0 0 0.25rem 0' },
  headerSubtitle: { color: 'var(--text-muted)', margin: '0 0 2rem 0' },
  centered: { padding: '5rem 2rem', textAlign: 'center', color: 'var(--text-muted)' },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1.25fr',
    gap: '2rem',
    alignItems: 'start',
  },
  columnLeft: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  columnRight: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  card: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '1.5rem',
  },
  cardHighlight: {
    background: 'linear-gradient(135deg, var(--surface) 0%, rgba(34, 197, 94, 0.03) 100%)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '2rem 1.5rem',
  },
  cardTitle: { margin: '0 0 1.25rem 0', fontSize: '1.15rem', fontWeight: 600 },
  avatarSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '1.25rem',
  },
  avatarWrapper: {
    width: 110,
    height: 110,
    borderRadius: '50%',
    overflow: 'hidden',
    border: '2px solid var(--border)',
    background: 'var(--bg)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: { width: '100%', height: '100%', objectFit: 'cover' },
  avatarPlaceholder: { fontSize: '2.5rem', fontWeight: 700, color: 'var(--accent)' },
  avatarBtn: {
    background: 'transparent',
    border: '1px solid var(--border)',
    color: 'var(--text)',
    padding: '0.35rem 0.75rem',
    borderRadius: '6px',
    fontSize: '0.8rem',
    fontWeight: 500,
  },
  nameHeader: { textAlign: 'center', marginBottom: '1.5rem' },
  studentName: { margin: '0 0 0.35rem 0', fontSize: '1.4rem', fontWeight: 700 },
  deptBadge: {
    fontSize: '0.75rem',
    color: 'var(--accent)',
    background: 'rgba(34, 197, 94, 0.1)',
    padding: '0.2rem 0.5rem',
    borderRadius: '4px',
    fontWeight: 600,
  },
  divider: { border: 'none', borderTop: '1px solid var(--border)', margin: '0 0 1.5rem 0' },
  hostelInfo: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  infoRow: { display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' },
  infoLabel: { color: 'var(--text-muted)' },
  infoVal: { fontWeight: 600 },
  infoValCode: { fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--accent)' },
  
  roommateList: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  roommateItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem',
    background: 'var(--bg)',
    borderRadius: '8px',
    border: '1px solid var(--border)',
  },
  roommateAvatar: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.05)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 600,
    fontSize: '0.9rem',
    color: 'var(--accent)',
    overflow: 'hidden',
  },
  roommateImg: { width: '100%', height: '100%', objectFit: 'cover' },
  roommateMeta: { display: 'flex', flexDirection: 'column', gap: '0.15rem' },
  roommateName: { fontWeight: 600, fontSize: '0.9rem' },
  roommateContact: { fontSize: '0.75rem', color: 'var(--text-muted)' },
  emptyText: { color: 'var(--text-muted)', fontSize: '0.85rem' },

  form: { display: 'flex', flexDirection: 'column', gap: '1.25rem' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 },
  formRow: { display: 'flex', gap: '1rem', flexWrap: 'wrap' },
  label: { fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 },
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
  submitBtn: {
    background: 'var(--accent)',
    color: '#000',
    border: 'none',
    borderRadius: '6px',
    padding: '0.75rem',
    fontWeight: 600,
    fontSize: '0.9rem',
    marginTop: '0.5rem',
  },
  success: {
    background: 'rgba(34, 197, 94, 0.12)',
    border: '1px solid var(--accent)',
    color: '#a7f3d0',
    borderRadius: '8px',
    padding: '0.75rem 1rem',
    marginBottom: '1.5rem',
    fontSize: '0.875rem',
  },
  error: {
    background: 'rgba(239, 68, 68, 0.12)',
    border: '1px solid var(--danger)',
    color: '#fca5a5',
    borderRadius: '8px',
    padding: '0.75rem 1rem',
    marginBottom: '1.5rem',
    fontSize: '0.875rem',
  },
  checklist: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  checkItem: { display: 'flex', gap: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)', alignItems: 'flex-start' },
  checkIcon: { color: 'var(--accent)', fontWeight: 'bold' },
};
