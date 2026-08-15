import { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { 
  Building, Settings, UserCheck, ShieldAlert, Edit, Trash, Grid, History, 
  ChevronRight, Save, X, PlusCircle, CheckCircle, ListFilter, ClipboardList
} from 'lucide-react';

export default function Hostels() {
  const [list, setList] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [pendingStudents, setPendingStudents] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  
  // Tabs: 'buildings' | 'finalizer' | 'rooms'
  const [activeTab, setActiveTab] = useState('buildings');

  // Hostel Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [address, setAddress] = useState('');
  const [type, setType] = useState('COED');
  const [totalFloors, setTotalFloors] = useState(3);
  const [roomsPerFloor, setRoomsPerFloor] = useState(10);
  const [defaultCapacity, setDefaultCapacity] = useState(2);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // Room Override Drawer State
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [newCapacity, setNewCapacity] = useState(2);
  const [updatingRoom, setUpdatingRoom] = useState(false);
  const [roomFilter, setRoomFilter] = useState('');

  const fetchAll = async () => {
    try {
      setLoading(true);
      setError(null);
      const [hList, rList, sList, logs] = await Promise.all([
        api.hostels.list(),
        api.rooms.list(),
        api.students.list(),
        api.rooms.auditLogs().catch(() => [])
      ]);
      setList(hList);
      setRooms(rList);
      setPendingStudents(sList.filter(s => s.status === 'PENDING_SUPERADMIN'));
      setAuditLogs(logs);
    } catch (err) {
      setError(err.message || 'Failed to fetch hostel details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name || !code || !type) {
      alert('Please fill in required fields');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess('');

    try {
      if (editing) {
        await api.hostels.update(editing.id, { name, code, address, type });
        setSuccess('Hostel updated successfully');
      } else {
        await api.hostels.create({ 
          name, 
          code, 
          address, 
          type,
          totalFloors: Number(totalFloors),
          roomsPerFloor: Number(roomsPerFloor),
          defaultCapacity: Number(defaultCapacity)
        });
        setSuccess(`Hostel "${name}" registered successfully. ${Number(totalFloors) * Number(roomsPerFloor)} rooms automatically generated!`);
      }
      setName('');
      setCode('');
      setAddress('');
      setType('COED');
      setTotalFloors(3);
      setRoomsPerFloor(10);
      setDefaultCapacity(2);
      setEditing(null);
      setShowForm(false);
      fetchAll();
    } catch (err) {
      setError(err.message || 'Failed to save hostel');
      setLoading(false);
    }
  };

  const handleDelete = async (id, hostelName) => {
    if (!confirm(`Are you sure you want to delete hostel "${hostelName}"? This will delete all rooms associated with it.`)) {
      return;
    }
    try {
      setError(null);
      setSuccess('');
      await api.hostels.delete(id);
      setSuccess('Hostel deleted successfully');
      fetchAll();
    } catch (err) {
      setError(err.message || 'Failed to delete hostel');
    }
  };

  const handleEditClick = (hostel) => {
    setEditing(hostel);
    setName(hostel.name);
    setCode(hostel.code);
    setAddress(hostel.address || '');
    setType(hostel.type);
    setShowForm(true);
  };

  // Finalize Room Allocation for Pending Student
  const handleFinalizeAllocation = async (studentId, roomId) => {
    if (!roomId) {
      alert('Cannot finalize: Room assignment is empty.');
      return;
    }
    try {
      await api.students.finalizeAllocation(studentId, { roomId });
      setSuccess('Student room allocation finalized. Invoice generated and credentials dispatched.');
      fetchAll();
    } catch (err) {
      alert(err.message || 'Failed to finalize allocation');
    }
  };

  // Override Room Capacity
  const handleOverrideCapacitySubmit = async (e) => {
    e.preventDefault();
    if (!selectedRoom) return;
    setUpdatingRoom(true);
    try {
      await api.rooms.overrideCapacity(selectedRoom.id, Number(newCapacity));
      setSuccess(`Capacity for Room ${selectedRoom.block}-${selectedRoom.number} overridden to ${newCapacity}.`);
      setSelectedRoom(null);
      fetchAll();
    } catch (err) {
      alert(err.message || 'Failed to override capacity');
    } finally {
      setUpdatingRoom(false);
    }
  };

  const selectRoomForOverride = (room) => {
    setSelectedRoom(room);
    setNewCapacity(room.capacity);
  };

  const filteredRooms = rooms.filter(r => 
    r.number.toLowerCase().includes(roomFilter.toLowerCase()) || 
    r.block.toLowerCase().includes(roomFilter.toLowerCase())
  );

  if (loading && list.length === 0) return <div style={styles.centered}>Loading hostels directory…</div>;

  return (
    <div style={styles.container}>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.headerTitle}>Hostel Sync Operations</h1>
          <p style={styles.headerSubtitle}>Manage university residential halls, override seat capacities, and finalize student admissions</p>
        </div>
      </div>

      {/* Tabs Row */}
      <div style={styles.tabsRow}>
        <button 
          style={{ ...styles.tab, ...(activeTab === 'buildings' ? styles.tabActive : {}) }}
          onClick={() => setActiveTab('buildings')}
        >
          <Building size={16} /> Residential Halls ({list.length})
        </button>
        <button 
          style={{ ...styles.tab, ...(activeTab === 'finalizer' ? styles.tabActive : {}) }}
          onClick={() => setActiveTab('finalizer')}
        >
          <UserCheck size={16} /> Admissions Finalization ({pendingStudents.length})
        </button>
        <button 
          style={{ ...styles.tab, ...(activeTab === 'rooms' ? styles.tabActive : {}) }}
          onClick={() => setActiveTab('rooms')}
        >
          <Grid size={16} /> Room Override Console ({rooms.length})
        </button>
      </div>

      {success && <div style={styles.success}>{success}</div>}
      {error && <div style={styles.error}>{error}</div>}

      {/* TAB 1: BUILDINGS BUILDER */}
      {activeTab === 'buildings' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>Active Dormitories</h3>
            <button 
              style={styles.btnPrimary} 
              onClick={() => {
                if (showForm) setEditing(null);
                setShowForm(!showForm);
              }}
              className="btn-neon glow-hover"
            >
              {showForm ? 'Cancel' : 'Register New Hostel'}
            </button>
          </div>

          {showForm && (
            <div style={styles.cardForm} className="glass-card">
              <h3 style={styles.cardTitle}>{editing ? 'Update Hostel Building' : 'Construct New Hostel Building'}</h3>
              <form onSubmit={handleSave} style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Building Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Edison Hall"
                    style={styles.input}
                    required
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Unique Code Prefix *</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. EDN"
                    style={styles.input}
                    required
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Type (Gender) *</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    style={styles.select}
                    required
                  >
                    <option value="COED">Co-Ed</option>
                    <option value="BOYS">Boys Only</option>
                    <option value="GIRLS">Girls Only</option>
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Physical Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. Campus Area North"
                    style={styles.input}
                  />
                </div>

                {!editing && (
                  <>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Total Floors *</label>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={totalFloors}
                        onChange={(e) => setTotalFloors(Number(e.target.value))}
                        style={styles.input}
                        required
                      />
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Rooms per Floor *</label>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={roomsPerFloor}
                        onChange={(e) => setRoomsPerFloor(Number(e.target.value))}
                        style={styles.input}
                        required
                      />
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Default Room Capacity *</label>
                      <input
                        type="number"
                        min={1}
                        max={8}
                        value={defaultCapacity}
                        onChange={(e) => setDefaultCapacity(Number(e.target.value))}
                        style={styles.input}
                        required
                      />
                    </div>
                  </>
                )}

                <div style={{ gridColumn: 'span 2', display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button type="submit" style={styles.btnPrimary} className="btn-neon glow-hover">
                    {editing ? 'Update' : 'Register & Autogenerate Rooms'}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div style={styles.grid}>
            {list.length === 0 ? (
              <p style={styles.empty}>No hostels registered in the database.</p>
            ) : (
              list.map((h) => (
                <div key={h.id} style={styles.card} className="glass-card glow-hover">
                  <div style={styles.cardHeader}>
                    <div style={styles.codeBadge}>{h.code}</div>
                    <span style={{
                      ...styles.typeBadge,
                      ...(h.type === 'BOYS' ? styles.typeBoys : h.type === 'GIRLS' ? styles.typeGirls : styles.typeCoed)
                    }}>
                      {h.type}
                    </span>
                  </div>

                  <h3 style={styles.buildingName}>{h.name}</h3>
                  <p style={styles.address}>{h.address || 'No physical address logged'}</p>
                  
                  <div style={styles.hostelDimensions}>
                    <span>Floors: <strong>{h.totalFloors || 'N/A'}</strong></span>
                    <span>Rooms/Floor: <strong>{h.roomsPerFloor || 'N/A'}</strong></span>
                    <span>Total Capacity: <strong>{h.defaultCapacity || 2} seats/room</strong></span>
                  </div>

                  <div style={styles.actions}>
                    <button style={styles.btnEdit} onClick={() => handleEditClick(h)}>Edit Details</button>
                    <button style={styles.btnDelete} onClick={() => handleDelete(h.id, h.name)}>Delete</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* TAB 2: ALLOCATIONS FINALIZER */}
      {activeTab === 'finalizer' && (
        <div style={styles.card} className="glass-card">
          <h3 style={{ margin: '0 0 1rem 0' }}>Allocations Pending Finalization</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            Below are student requests pre-allocated by the Superintendent. Click **Finalize Allocation** to create the database billing invoices and student user account.
          </p>

          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Student</th>
                  <th style={styles.th}>Email Address</th>
                  <th style={styles.th}>Pre-Allocated Room</th>
                  <th style={styles.th}>Superintendent Assignee</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingStudents.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ ...styles.td, textAlign: 'center', color: 'var(--text-muted)' }}>No pre-allocated registrations pending finalization.</td>
                  </tr>
                ) : (
                  pendingStudents.map(student => {
                    const room = rooms.find(r => r.id === student.roomId);
                    return (
                      <tr key={student.id}>
                        <td style={styles.td}>
                          <strong>{student.name}</strong>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Dept: {student.department}</div>
                        </td>
                        <td style={styles.td}>{student.email}</td>
                        <td style={styles.td}>
                          <select 
                            value={student.roomId || ''} 
                            onChange={async (e) => {
                              const newRoomId = e.target.value ? Number(e.target.value) : null;
                              await api.students.update(student.id, { roomId: newRoomId });
                              fetchAll();
                            }}
                            style={styles.selectSm}
                          >
                            <option value="">-- No Room pre-allocated --</option>
                            {rooms.filter(r => r.currentOccupancy < r.capacity || r.id === student.roomId).map(r => (
                              <option key={r.id} value={r.id}>{r.block}-{r.number} (Occ: {r.currentOccupancy}/{r.capacity})</option>
                            ))}
                          </select>
                        </td>
                        <td style={styles.td}>Warden/Superintendent</td>
                        <td style={styles.td}>
                          <button 
                            style={styles.btnApprove} 
                            onClick={() => handleFinalizeAllocation(student.id, student.roomId)}
                            className="btn-neon glow-hover"
                          >
                            Finalize Allocation
                          </button>
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

      {/* TAB 3: ROOM CAPACITY MANAGER & AUDITS */}
      {activeTab === 'rooms' && (
        <div style={styles.roomsTabGrid}>
          {/* Rooms List */}
          <div style={styles.card} className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h3 style={{ margin: 0 }}>University Rooms</h3>
              <input 
                type="text" 
                value={roomFilter} 
                onChange={(e) => setRoomFilter(e.target.value)} 
                placeholder="Filter by building or room number..." 
                style={{ ...styles.input, maxWidth: '250px' }}
              />
            </div>

            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Room</th>
                    <th style={styles.th}>Floor</th>
                    <th style={styles.th}>Occupancy</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRooms.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ ...styles.td, textAlign: 'center', color: 'var(--text-muted)' }}>No rooms matched filter.</td>
                    </tr>
                  ) : (
                    filteredRooms.map(room => (
                      <tr key={room.id}>
                        <td style={styles.td}>
                          <strong>{room.block}-{room.number}</strong>
                        </td>
                        <td style={styles.td}>Floor {room.floor}</td>
                        <td style={styles.td}>{room.currentOccupancy} / {room.capacity}</td>
                        <td style={styles.td}>
                          <span style={{
                            ...styles.statusBadge,
                            ...(room.currentOccupancy >= room.capacity ? styles.statusFull : styles.statusAvail)
                          }}>
                            {room.currentOccupancy >= room.capacity ? 'FULL' : 'AVAILABLE'}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <button 
                            style={styles.btnAction} 
                            onClick={() => selectRoomForOverride(room)}
                          >
                            <Settings size={14} /> Override Capacity
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Override & Audit Logs Right Drawer */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {selectedRoom ? (
              <div style={styles.card} className="glass-card glow-hover">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0 }}>Capacity Override</h3>
                  <button style={styles.closeBtn} onClick={() => setSelectedRoom(null)}><X size={18} /></button>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Manually adjust the total occupancy slots of Room **{selectedRoom.block}-{selectedRoom.number}**.
                </p>

                <form onSubmit={handleOverrideCapacitySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>New Capacity (Seats) *</label>
                    <input 
                      type="number" 
                      min={1} 
                      max={12} 
                      value={newCapacity} 
                      onChange={(e) => setNewCapacity(e.target.value)} 
                      style={styles.input}
                      required 
                    />
                  </div>
                  <button 
                    type="submit" 
                    style={styles.btnPrimary} 
                    disabled={updatingRoom}
                    className="btn-neon glow-hover"
                  >
                    {updatingRoom ? 'Saving...' : 'Commit Seat Change'}
                  </button>
                </form>
              </div>
            ) : (
              <div style={{ ...styles.card, background: 'rgba(255,255,255,0.01)' }} className="glass-card">
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', margin: '2rem 0' }}>
                  Click "Override Capacity" next to any room to manually configure its capacity and audit history.
                </p>
              </div>
            )}

            {/* Audit Logs Trail */}
            <div style={styles.card} className="glass-card">
              <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <History size={18} color="var(--accent)" /> Room Audit Trail
              </h3>
              
              <div style={styles.auditLogList}>
                {auditLogs.length === 0 ? (
                  <p style={{ ...styles.empty, padding: '1rem' }}>No room capacity logs recorded.</p>
                ) : (
                  auditLogs.map(log => (
                    <div key={log.id} style={styles.auditLogItem}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                        <strong>Room {log.roomNumber}</strong>
                        <span style={{ color: 'var(--text-muted)' }}>{new Date(log.changedAt).toLocaleDateString()}</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', marginTop: '0.25rem', color: 'var(--text-muted)' }}>
                        Capacity modified: {log.oldCapacity} → {log.newCapacity} seats
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--accent)', marginTop: '0.15rem' }}>
                        By: {log.changedBy}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { paddingBottom: '3rem' },
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' },
  headerTitle: { fontSize: '2rem', fontWeight: 800, margin: '0 0 0.25rem 0' },
  headerSubtitle: { color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' },
  centered: { padding: '5rem 2rem', textAlign: 'center', color: 'var(--text-muted)' },
  
  tabsRow: { display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' },
  tab: { background: 'transparent', border: 'none', color: 'var(--text-muted)', padding: '0.5rem 1rem', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.5rem' },
  tabActive: { color: 'var(--accent)', borderBottom: '2px solid var(--accent)' },
  
  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  cardForm: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.5rem', marginBottom: '1.5rem' },
  cardTitle: { margin: '0 0 1.25rem 0', fontSize: '1.15rem', fontWeight: 600 },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' },
  
  codeBadge: { fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--accent)', background: 'rgba(59, 130, 246, 0.12)', padding: '0.2rem 0.5rem', borderRadius: 4, fontWeight: 600 },
  typeBadge: { fontSize: '0.65rem', fontWeight: 700, padding: '0.15rem 0.4rem', borderRadius: 4 },
  typeBoys: { background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' },
  typeGirls: { background: 'rgba(236, 72, 153, 0.15)', color: '#f472b6' },
  typeCoed: { background: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa' },
  
  buildingName: { fontSize: '1.25rem', fontWeight: 700, margin: 0 },
  address: { color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0 0 1rem 0', flex: 1 },
  hostelDimensions: { display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', padding: '0.5rem 0.75rem', borderRadius: '6px', marginBottom: '0.5rem' },
  
  actions: { display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem', marginTop: '0.5rem' },
  btnEdit: { flex: 1, background: 'var(--surface-hover)', border: '1px solid var(--border)', color: 'var(--text)', padding: '0.4rem', borderRadius: 6, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' },
  btnDelete: { background: 'transparent', border: '1px solid var(--danger)', color: 'var(--danger)', padding: '0.4rem 0.75rem', borderRadius: 6, fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer' },
  
  btnPrimary: { background: 'var(--accent)', color: '#fff', border: 'none', padding: '0.65rem 1.25rem', borderRadius: 'var(--radius)', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' },
  btnApprove: { background: 'var(--accent)', border: 'none', color: '#fff', padding: '0.45rem 0.85rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', boxShadow: 'var(--neon-shadow)' },
  btnAction: { background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', padding: '0.35rem 0.5rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' },
  closeBtn: { background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' },

  success: { background: 'rgba(34, 197, 94, 0.12)', border: '1px solid #22c55e', color: '#86efac', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1.5rem', fontSize: '0.875rem' },
  error: { background: 'rgba(239, 68, 68, 0.12)', border: '1px solid var(--danger)', color: '#fca5a5', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1.5rem', fontSize: '0.875rem' },
  empty: { color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0', width: '100%' },

  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' },
  
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  label: { fontSize: '0.8rem', color: 'var(--text-muted)' },
  input: { background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', padding: '0.65rem 0.75rem', borderRadius: '8px', fontSize: '0.9rem', outline: 'none', width: '100%' },
  select: { background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', padding: '0.65rem 0.75rem', borderRadius: '8px', fontSize: '0.9rem', outline: 'none', width: '100%' },
  selectSm: { background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', padding: '0.35rem', borderRadius: '6px', fontSize: '0.85rem', outline: 'none' },

  // Table styling
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '0.75rem 1rem', borderBottom: '2px solid var(--border)', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem' },
  td: { padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)', fontSize: '0.9rem' },
  statusBadge: { display: 'inline-block', fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.4rem', borderRadius: '4px' },
  statusFull: { background: 'rgba(239, 68, 68, 0.12)', color: '#fca5a5' },
  statusAvail: { background: 'rgba(34, 197, 94, 0.12)', color: '#86efac' },

  // Rooms Management grid
  roomsTabGrid: { display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '1.5rem', alignItems: 'stretch' },
  auditLogList: { display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '350px', overflowY: 'auto' },
  auditLogItem: { background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border)', padding: '0.75rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.15rem' },
};
