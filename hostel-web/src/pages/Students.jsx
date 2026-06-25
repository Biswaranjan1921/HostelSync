import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { 
  UserCheck, AlertTriangle, Send, Grid, X, Check, Eye, Trash2, Edit3, 
  Smartphone, Mail, ShieldAlert, Award, FileText, UserPlus, Building, Search
} from 'lucide-react';
import StudentQrModal from '../components/StudentQrModal';

export default function Students() {
  const [list, setList] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [parentAlerts, setParentAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Tabs: 'active' | 'pending' | 'verifications' | 'alerts'
  const [activeTab, setActiveTab] = useState('active');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals & Selection Drawer states
  const [showRoomGrid, setShowRoomGrid] = useState(false);
  const [selectingForStudent, setSelectingForStudent] = useState(null);
  const [viewingPhoto, setViewingPhoto] = useState(null);
  const [qrStudent, setQrStudent] = useState(null);

  // Parent alert trigger state
  const [alertStudent, setAlertStudent] = useState(null);
  const [alertCategory, setAlertCategory] = useState('ATTENDANCE_SHORTAGE');
  const [alertMessage, setAlertMessage] = useState('');
  const [dispatchingAlert, setDispatchingAlert] = useState(false);

  // Manual Add/Edit state
  const [showAddEdit, setShowAddEdit] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', department: '', year: 1, roomId: '',
    parentName: '', parentPhone: '', parentEmail: '', status: 'ACTIVE'
  });

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const load = async () => {
    try {
      setError(null);
      setLoading(true);
      const [s, r, alerts] = await Promise.all([
        api.students.list(),
        api.rooms.list(),
        api.parentAlerts.list().catch(() => [])
      ]);
      setList(s);
      setRooms(r);
      setParentAlerts(alerts);
    } catch (e) {
      setError(e.message || 'Failed to load details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Filter students based on tab status & search query
  const getFilteredList = () => {
    return list.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.email && s.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.department && s.department.toLowerCase().includes(searchQuery.toLowerCase()));
      
      if (!matchesSearch) return false;

      if (activeTab === 'active') {
        return s.status === 'ACTIVE';
      }
      if (activeTab === 'pending') {
        return s.status === 'PENDING_ADMIN' || s.status === 'PENDING_SUPERADMIN' || s.status === 'PENDING_PROFILE_SETUP';
      }
      if (activeTab === 'verifications') {
        return s.status === 'PENDING_PROFILE_VERIFICATION';
      }
      return true;
    });
  };

  // Pre-allocation / Pass to Superadmin
  const handlePassToSuper = async (studentId, roomId) => {
    if (!roomId) {
      alert('Please select a room for pre-allocation first.');
      return;
    }
    try {
      await api.students.passToSuper(studentId, { roomId });
      alert('Student room pre-allocated and application passed to Super Admin!');
      load();
    } catch (e) {
      alert(e.message || 'Failed to pass to Super Admin');
    }
  };

  // Verify Profile (Active)
  const handleVerifyProfile = async (studentId) => {
    try {
      await api.students.verifyProfile(studentId);
      alert('Student profile verified successfully! Resident access is now active.');
      load();
    } catch (e) {
      alert(e.message || 'Failed to verify profile');
    }
  };

  // Reject Application
  const handleReject = async (studentId) => {
    if (!confirm('Are you sure you want to reject this admission request?')) return;
    try {
      await api.students.reject(studentId);
      alert('Application rejected.');
      load();
    } catch (e) {
      alert(e.message || 'Failed to reject student');
    }
  };

  // Delete student
  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to permanently delete this student record?')) return;
    try {
      await api.students.delete(id);
      load();
    } catch (e) {
      alert(e.message || 'Delete failed');
    }
  };

  // Open Room Selector Grid
  const openRoomSelector = (student) => {
    setSelectingForStudent(student);
    setShowRoomGrid(true);
  };

  // Confirm room selection
  const selectRoomForStudent = async (roomId) => {
    if (!selectingForStudent) return;
    try {
      // Update student room assignment locally or directly trigger pre-allocation
      await api.students.update(selectingForStudent.id, { roomId });
      setShowRoomGrid(false);
      setSelectingForStudent(null);
      load();
    } catch (e) {
      alert(e.message || 'Failed to allocate room');
    }
  };

  // Send parent alert manual warning
  const handleSendParentAlert = async (e) => {
    e.preventDefault();
    if (!alertStudent || !alertMessage) return;
    setDispatchingAlert(true);
    try {
      await api.parentAlerts.send({
        studentId: alertStudent.id,
        category: alertCategory,
        message: alertMessage
      });
      alert('Mock notification dispatched! Warning recorded in DB audit log.');
      setAlertStudent(null);
      setAlertMessage('');
      load();
    } catch (e) {
      alert(e.message || 'Failed to send alert');
    } finally {
      setDispatchingAlert(false);
    }
  };

  // Edit / Add Student Save
  const handleAddEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = { ...formData };
      if (data.roomId === '') data.roomId = null;
      else data.roomId = Number(data.roomId);
      
      if (editingStudent) {
        await api.students.update(editingStudent.id, data);
      } else {
        await api.students.create(data);
      }
      setShowAddEdit(false);
      setEditingStudent(null);
      load();
    } catch (e) {
      alert(e.message || 'Failed to save student details');
    }
  };

  const startEdit = (student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name || '',
      email: student.email || '',
      phone: student.phone || '',
      department: student.department || '',
      year: student.year || 1,
      roomId: student.roomId || '',
      parentName: student.parentName || '',
      parentPhone: student.parentPhone || '',
      parentEmail: student.parentEmail || '',
      status: student.status || 'ACTIVE'
    });
    setShowAddEdit(true);
  };

  const startAdd = () => {
    setEditingStudent(null);
    setFormData({
      name: '', email: '', phone: '', department: '', year: 1, roomId: '',
      parentName: '', parentPhone: '', parentEmail: '', status: 'ACTIVE'
    });
    setShowAddEdit(true);
  };

  if (loading && list.length === 0) return <div style={styles.centered}>Loading student registry…</div>;

  const filtered = getFilteredList();

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Hostel Residents Registry</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>Manage admissions, document audits, and dispatch parent warning alerts</p>
        </div>
        <button style={styles.btnPrimary} onClick={startAdd} className="btn-neon glow-hover">
          <UserPlus size={16} /> Add Resident
        </button>
      </div>

      {/* Tabs Row */}
      <div style={styles.tabsRow}>
        <button 
          style={{ ...styles.tab, ...(activeTab === 'active' ? styles.tabActive : {}) }}
          onClick={() => setActiveTab('active')}
        >
          Active Directory ({list.filter(s => s.status === 'ACTIVE').length})
        </button>
        <button 
          style={{ ...styles.tab, ...(activeTab === 'pending' ? styles.tabActive : {}) }}
          onClick={() => setActiveTab('pending')}
        >
          Pending Admissions ({list.filter(s => s.status === 'PENDING_ADMIN' || s.status === 'PENDING_SUPERADMIN' || s.status === 'PENDING_PROFILE_SETUP').length})
        </button>
        <button 
          style={{ ...styles.tab, ...(activeTab === 'verifications' ? styles.tabActive : {}) }}
          onClick={() => setActiveTab('verifications')}
        >
          Profile Verifications ({list.filter(s => s.status === 'PENDING_PROFILE_VERIFICATION').length})
        </button>
        <button 
          style={{ ...styles.tab, ...(activeTab === 'alerts' ? styles.tabActive : {}) }}
          onClick={() => setActiveTab('alerts')}
        >
          Parent Alert Audit Logs ({parentAlerts.length})
        </button>
      </div>

      {activeTab !== 'alerts' && (
        <div style={styles.searchRow}>
          <Search size={18} color="var(--text-muted)" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search students by name, email, or stream..."
            style={styles.searchInput}
          />
        </div>
      )}

      {error && <div style={styles.errorBanner}>{error}</div>}

      {/* TABS CONTENT */}
      {activeTab === 'alerts' ? (
        /* ALERTS LOG PANEL */
        <div style={styles.alertsGrid}>
          {/* Dispatch Panel */}
          <div style={styles.card} className="glass-card">
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>Dispatch Parent Alert</h3>
            <form onSubmit={handleSendParentAlert} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Select Student *</label>
                <select 
                  onChange={(e) => setAlertStudent(list.find(s => s.id === Number(e.target.value)))}
                  style={styles.input}
                  required
                >
                  <option value="">-- Choose active student --</option>
                  {list.filter(s => s.status === 'ACTIVE').map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.department} - Room {rooms.find(r => r.id === s.roomId)?.number || 'N/A'})</option>
                  ))}
                </select>
              </div>

              {alertStudent && (
                <div style={styles.infoBox}>
                  <strong>Parent Phone:</strong> {alertStudent.parentPhone || 'Not Configured'} <br />
                  <strong>Parent Email:</strong> {alertStudent.parentEmail || 'Not Configured'}
                </div>
              )}

              <div style={styles.formGroup}>
                <label style={styles.label}>Alert Category *</label>
                <select 
                  value={alertCategory} 
                  onChange={(e) => setAlertCategory(e.target.value)}
                  style={styles.input}
                >
                  <option value="ATTENDANCE_SHORTAGE">Attendance Shortage Alert</option>
                  <option value="DISCIPLINARY">Disciplinary Warning Notification</option>
                  <option value="PAYMENT_DUE">Payment Overdue Invoice Notice</option>
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Formatted Warning Message *</label>
                <textarea
                  rows={4}
                  value={alertMessage}
                  onChange={(e) => setAlertMessage(e.target.value)}
                  placeholder="Explain details of the violation/shortage..."
                  style={styles.textarea}
                  required
                />
              </div>

              <button 
                type="submit" 
                style={styles.btnPrimary} 
                disabled={dispatchingAlert || !alertStudent || !alertMessage}
                className="btn-neon glow-hover"
              >
                <Send size={16} /> {dispatchingAlert ? 'Dispatching SMS/Mail...' : 'Send Outbound Warning'}
              </button>
            </form>
          </div>

          {/* Audit History Table */}
          <div style={styles.card} className="glass-card">
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>Alerts History Ledger</h3>
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Sent Date</th>
                    <th style={styles.th}>Student</th>
                    <th style={styles.th}>Channel</th>
                    <th style={styles.th}>Category</th>
                    <th style={styles.th}>Recipient</th>
                  </tr>
                </thead>
                <tbody>
                  {parentAlerts.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ ...styles.td, textAlign: 'center', color: 'var(--text-muted)' }}>No parent warning logs dispatched.</td>
                    </tr>
                  ) : (
                    parentAlerts.map(log => (
                      <tr key={log.id}>
                        <td style={styles.td}>{new Date(log.sentAt).toLocaleDateString()}</td>
                        <td style={styles.td}>{log.studentName}</td>
                        <td style={styles.td}>
                          <span style={styles.pill}>{log.channel}</span>
                        </td>
                        <td style={styles.td}>{log.category.replace('_', ' ')}</td>
                        <td style={styles.td}>{log.parentContact}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* STUDENTS/ADMISSIONS DIRECTORY TABLE */
        <div style={styles.card} className="glass-card">
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Resident</th>
                  <th style={styles.th}>Academic Stream</th>
                  <th style={styles.th}>Contact details</th>
                  <th style={styles.th}>Assigned Room</th>
                  <th style={styles.th}>Admission Status</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ ...styles.td, textAlign: 'center', color: 'var(--text-muted)' }}>No student records found matching this filter.</td>
                  </tr>
                ) : (
                  filtered.map(s => {
                    const room = rooms.find(r => r.id === s.roomId);
                    return (
                      <tr key={s.id}>
                        <td style={styles.td}>
                          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                            {s.photoBase64 ? (
                              <img 
                                src={s.photoBase64} 
                                alt={s.name} 
                                style={styles.avatar} 
                                onClick={() => setViewingPhoto(s.photoBase64)}
                              />
                            ) : (
                              <div style={styles.avatarPlaceholder}>{s.name.substring(0, 1)}</div>
                            )}
                            <div>
                              <strong style={{ color: 'var(--text)' }}>{s.name}</strong>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID #{s.id}</div>
                            </div>
                          </div>
                        </td>
                        <td style={styles.td}>
                          <div>{s.department || 'Unassigned'}</div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Year {s.year || 1}</span>
                        </td>
                        <td style={styles.td}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem' }}><Mail size={12} /> {s.email || '—'}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}><Smartphone size={12} /> {s.phone || '—'}</div>
                        </td>
                        <td style={styles.td}>
                          {room ? (
                            <span style={styles.roomBadge}>
                              <Building size={12} /> {room.block}-{room.number}
                            </span>
                          ) : (
                            <button 
                              style={styles.allocateBtn} 
                              onClick={() => openRoomSelector(s)}
                            >
                              <Grid size={12} /> Set Room
                            </button>
                          )}
                        </td>
                        <td style={styles.td}>
                          <span style={{
                            ...styles.statusBadge,
                            ...(s.status === 'ACTIVE' ? styles.statusActive : {}),
                            ...(s.status === 'PENDING_ADMIN' ? styles.statusAdmin : {}),
                            ...(s.status === 'PENDING_SUPERADMIN' ? styles.statusSuper : {}),
                            ...(s.status === 'PENDING_PROFILE_SETUP' ? styles.statusSetup : {}),
                            ...(s.status === 'PENDING_PROFILE_VERIFICATION' ? styles.statusVerify : {}),
                            ...(s.status === 'REJECTED' ? styles.statusRejected : {})
                          }}>
                            {s.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <div style={{ display: 'flex', gap: '0.25rem' }}>
                            {s.status === 'ACTIVE' && (
                              <button style={styles.btnAction} onClick={() => setQrStudent(s)} title="Gate QR Code">QR</button>
                            )}
                            
                            {s.status === 'PENDING_ADMIN' && (
                              <>
                                <button 
                                  style={styles.btnApprove} 
                                  onClick={() => handlePassToSuper(s.id, s.roomId)}
                                  title="Pre-allocate & Pass to Super Admin"
                                >
                                  Pre-Allocate
                                </button>
                                <button style={styles.btnDanger} onClick={() => handleReject(s.id)}>Reject</button>
                              </>
                            )}

                            {s.status === 'PENDING_PROFILE_VERIFICATION' && (
                              <>
                                <button 
                                  style={styles.btnApprove} 
                                  onClick={() => handleVerifyProfile(s.id)}
                                  title="Approve Profile Details & Activate Student"
                                >
                                  Approve
                                </button>
                                <button style={styles.btnDanger} onClick={() => handleReject(s.id)}>Reject</button>
                              </>
                            )}

                            <button style={styles.btnIcon} onClick={() => startEdit(s)}><Edit3 size={14} /></button>
                            <button style={styles.btnIconDanger} onClick={() => handleDelete(s.id)}><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MOCK VISUAL ROOM SELECTOR GRID MODAL */}
      {showRoomGrid && (
        <div style={styles.modalBackdrop}>
          <div style={styles.modalContent} className="glass-card">
            <div style={styles.modalHeader}>
              <h3>Visual Room Grid Selector</h3>
              <button style={styles.closeBtn} onClick={() => setShowRoomGrid(false)}><X size={20} /></button>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Assign a room for **{selectingForStudent?.name}**. Double check floor capacity constraints.
            </p>
            
            <div style={styles.roomLegend}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><span style={{ ...styles.legendBox, background: 'rgba(34, 197, 94, 0.15)', borderColor: '#22c55e' }} /> Empty (Available)</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><span style={{ ...styles.legendBox, background: 'rgba(245, 158, 11, 0.15)', borderColor: '#f59e0b' }} /> Occupied (Available)</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><span style={{ ...styles.legendBox, background: 'rgba(239, 68, 68, 0.15)', borderColor: '#ef4444' }} /> Full (Unavailable)</span>
            </div>

            <div style={styles.roomListGrid}>
              {rooms.map(room => {
                const isFull = room.currentOccupancy >= room.capacity;
                const isEmpty = room.currentOccupancy === 0;
                let cardStyle = styles.roomGridCardAvailableEmpty;
                if (isFull) cardStyle = styles.roomGridCardFull;
                else if (!isEmpty) cardStyle = styles.roomGridCardAvailableOccupied;

                return (
                  <button
                    key={room.id}
                    disabled={isFull}
                    onClick={() => selectRoomForStudent(room.id)}
                    style={{ ...styles.roomGridCard, ...cardStyle }}
                  >
                    <strong style={{ fontSize: '0.95rem' }}>{room.block}-{room.number}</strong>
                    <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                      Occupancy: {room.currentOccupancy} / {room.capacity}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW IMAGE AVATAR MODAL */}
      {viewingPhoto && (
        <div style={styles.modalBackdrop} onClick={() => setViewingPhoto(null)}>
          <div style={{ ...styles.modalContent, maxWidth: '400px', textAlign: 'center', padding: '1rem' }} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3>Resident Verification Photo</h3>
              <button style={styles.closeBtn} onClick={() => setViewingPhoto(null)}><X size={20} /></button>
            </div>
            <img src={viewingPhoto} alt="Verification" style={{ width: '100%', maxHeight: '400px', objectFit: 'contain', borderRadius: '8px', marginTop: '1rem' }} />
          </div>
        </div>
      )}

      {/* ADD / EDIT RESIDENT DRAWER */}
      {showAddEdit && (
        <div style={styles.modalBackdrop}>
          <div style={styles.modalContent} className="glass-card">
            <div style={styles.modalHeader}>
              <h3>{editingStudent ? 'Edit Resident Details' : 'Add New Resident Application'}</h3>
              <button style={styles.closeBtn} onClick={() => setShowAddEdit(false)}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleAddEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1rem' }}>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Resident Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={styles.input}
                    required
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Email Address *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    style={styles.input}
                    required
                  />
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Department / Major</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Study Year</label>
                  <select
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                    style={styles.input}
                  >
                    <option value={1}>1st Year</option>
                    <option value={2}>2nd Year</option>
                    <option value={3}>3rd Year</option>
                    <option value={4}>4th Year</option>
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Initial Room Selection</label>
                  <select
                    value={formData.roomId}
                    onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                    style={styles.input}
                  >
                    <option value="">No Allocation (Pending)</option>
                    {rooms.map(r => (
                      <option key={r.id} value={r.id}>{r.block}-{r.number} (Floor {r.floor}, Occ: {r.currentOccupancy}/{r.capacity})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={styles.formDivider}>Parent Warning Contact Info</div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Parent/Guardian Name</label>
                  <input
                    type="text"
                    value={formData.parentName}
                    onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Parent Alert Phone *</label>
                  <input
                    type="tel"
                    value={formData.parentPhone}
                    onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                    style={styles.input}
                    placeholder="Warnings will route via SMS"
                    required
                  />
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Parent Email</label>
                  <input
                    type="email"
                    value={formData.parentEmail}
                    onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })}
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Profile/System Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    style={styles.input}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="PENDING_ADMIN">PENDING WARDEN REVIEW</option>
                    <option value="PENDING_SUPERADMIN">PENDING SUPER ADMIN FINALIZATION</option>
                    <option value="PENDING_PROFILE_SETUP">PENDING STUDENT PROFILE SETUP</option>
                    <option value="PENDING_PROFILE_VERIFICATION">PENDING PROFILE VERIFICATION</option>
                    <option value="REJECTED">REJECTED</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" style={{ ...styles.btnPrimary, background: '#1e293b' }} onClick={() => setShowAddEdit(false)}>Cancel</button>
                <button type="submit" style={styles.btnPrimary} className="btn-neon glow-hover">Save details</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {qrStudent && <StudentQrModal student={qrStudent} onClose={() => setQrStudent(null)} />}
    </div>
  );
}

const styles = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' },
  title: { fontSize: '2rem', fontWeight: 800, margin: 0 },
  btnPrimary: { background: 'var(--accent)', color: '#fff', border: 'none', padding: '0.65rem 1.25rem', borderRadius: 'var(--radius)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' },
  tabsRow: { display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' },
  tab: { background: 'transparent', border: 'none', color: 'var(--text-muted)', padding: '0.5rem 1rem', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' },
  tabActive: { color: 'var(--accent)', borderBottom: '2px solid var(--accent)' },
  
  searchRow: { display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.65rem 1rem', marginBottom: '1.5rem' },
  searchInput: { background: 'transparent', border: 'none', color: 'var(--text)', outline: 'none', width: '100%', fontSize: '0.95rem' },
  
  card: { padding: '1.5rem', borderRadius: 'var(--radius)', background: 'var(--surface)' },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '0.75rem 1rem', borderBottom: '2px solid var(--border)', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem' },
  td: { padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)', verticalAlign: 'middle' },
  
  avatar: { width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent)', cursor: 'pointer' },
  avatarPlaceholder: { width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.15)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContext: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.1rem' },
  
  roomBadge: { display: 'flex', alignItems: 'center', gap: '0.25rem', width: 'fit-content', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border)', padding: '0.25rem 0.5rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600 },
  allocateBtn: { display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'transparent', border: '1px dashed var(--accent)', color: 'var(--accent)', padding: '0.25rem 0.5rem', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 },
  
  statusBadge: { display: 'inline-block', fontSize: '0.75rem', fontWeight: 700, padding: '0.25rem 0.5rem', borderRadius: '6px', textTransform: 'uppercase' },
  statusActive: { background: 'rgba(16, 185, 129, 0.12)', color: '#34d399' },
  statusAdmin: { background: 'rgba(245, 158, 11, 0.12)', color: '#fbbf24' },
  statusSuper: { background: 'rgba(139, 92, 246, 0.12)', color: '#a78bfa' },
  statusSetup: { background: 'rgba(59, 130, 246, 0.12)', color: '#60a5fa' },
  statusVerify: { background: 'rgba(236, 72, 153, 0.12)', color: '#f472b6' },
  statusRejected: { background: 'rgba(239, 68, 68, 0.12)', color: '#f87171' },
  
  btnAction: { background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border)', color: 'var(--text)', padding: '0.35rem 0.65rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', marginRight: '0.25rem' },
  btnApprove: { background: 'var(--accent)', border: 'none', color: '#fff', padding: '0.35rem 0.65rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', marginRight: '0.25rem', boxShadow: 'var(--neon-shadow)' },
  btnDanger: { background: 'rgba(239, 68, 68, 0.15)', border: '1px solid var(--danger)', color: 'var(--danger)', padding: '0.35rem 0.65rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', marginRight: '0.25rem' },
  btnIcon: { background: 'transparent', border: 'none', color: 'var(--text-muted)', padding: '0.35rem', cursor: 'pointer' },
  btnIconDanger: { background: 'transparent', border: 'none', color: 'var(--danger)', padding: '0.35rem', cursor: 'pointer' },
  
  centered: { padding: '5rem 2rem', textAlign: 'center', color: 'var(--text-muted)' },
  errorBanner: { background: 'rgba(239, 68, 68, 0.12)', color: '#fca5a5', border: '1px solid var(--danger)', padding: '0.75rem 1rem', borderRadius: 'var(--radius)', marginBottom: '1.5rem' },

  // Parent Alerts Layout
  alertsGrid: { display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1.5rem', alignItems: 'stretch' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  label: { fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 },
  input: { background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', padding: '0.75rem', fontSize: '0.9rem', outline: 'none' },
  textarea: { background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', padding: '0.75rem', fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit', resize: 'vertical' },
  infoBox: { background: 'rgba(255, 255, 255, 0.02)', border: '1px dashed var(--border)', borderRadius: '6px', padding: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5' },
  pill: { background: 'rgba(59, 130, 246, 0.15)', color: 'var(--accent)', fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.4rem', borderRadius: '4px' },

  // Visual Room Selector Grid
  modalBackdrop: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' },
  modalContent: { background: 'var(--surface)', padding: '2rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', maxWidth: '650px', width: '100%', maxHeight: '90vh', overflowY: 'auto' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' },
  closeBtn: { background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' },
  
  roomLegend: { display: 'flex', gap: '1.25rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.5rem', flexWrap: 'wrap' },
  legendBox: { width: '12px', height: '12px', borderRadius: '2px', border: '1px solid', display: 'inline-block' },
  
  roomListGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.75rem' },
  roomGridCard: { border: '1px solid', borderRadius: '8px', padding: '1rem 0.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', outline: 'none' },
  
  roomGridCardAvailableEmpty: { background: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.3)', color: '#34d399' },
  roomGridCardAvailableOccupied: { background: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.3)', color: '#fbbf24' },
  roomGridCardFull: { background: 'rgba(239, 68, 68, 0.08)', borderColor: 'rgba(239, 68, 68, 0.2)', color: '#f87171', cursor: 'not-allowed' },

  // Manual Form drawer
  formDivider: { borderBottom: '1px solid var(--border)', color: 'var(--accent)', fontWeight: 600, fontSize: '0.9rem', paddingBottom: '0.25rem', marginTop: '1.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' },
  formRow: { display: 'flex', gap: '1rem', flexWrap: 'wrap' },
};
