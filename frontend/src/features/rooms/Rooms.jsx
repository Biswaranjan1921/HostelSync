import { useState, useEffect } from 'react';
import { api } from '../../api/client';
import RoomVisualizer from './RoomVisualizer';

export default function Rooms() {
  const [list, setList] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ block: '', number: '', capacity: 2, floor: '' });
  
  const [visualizerRoomId, setVisualizerRoomId] = useState(null);

  const load = async () => {
    try {
      setError(null);
      setLoading(true);
      const [r, s] = await Promise.all([api.rooms.list(), api.students.list()]);
      setList(r);
      setStudents(s);
    } catch (e) {
      setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const occupancy = (roomId) => students.filter((s) => s.roomId === roomId).length;

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editing) await api.rooms.update(editing.id, form);
      else await api.rooms.create(form);
      setShowForm(false);
      setEditing(null);
      setForm({ block: '', number: '', capacity: 2, floor: '' });
      load();
    } catch (err) {
      alert(err.message || 'Save failed');
    }
  };

  const handleDelete = async (id) => {
    const count = occupancy(id);
    if (count > 0) { alert(`Cannot delete: ${count} student(s) assigned to this room.`); return; }
    if (!confirm('Delete this room?')) return;
    try {
      await api.rooms.delete(id);
      load();
    } catch (e) {
      alert(e.message || 'Delete failed');
    }
  };

  const openEdit = (room) => {
    setEditing(room);
    setForm({ block: room.block, number: room.number, capacity: room.capacity, floor: room.floor || '' });
    setShowForm(true);
  };

  if (loading && list.length === 0) return <div style={styles.centered}>Loading…</div>;

  const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
  const modal = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.5rem', width: '100%', maxWidth: 400 };
  const field = { marginBottom: '1rem' };
  const input = { width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '1rem' };
  const actions = { display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' };
  const btnPrimary = { background: 'var(--accent)', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: 8, fontWeight: 600 };
  const btnSecondary = { background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)', padding: '0.5rem 1rem', borderRadius: 8 };

  return (
    <div>
      <div style={styles.header}>
        <h1 style={styles.title}>Rooms</h1>
        <button style={styles.btnPrimary} onClick={() => { setEditing(null); setForm({ block: '', number: '', capacity: 2, floor: '' }); setShowForm(true); }}>Add room</button>
      </div>
      {error && (
        <div style={styles.errorWrap}>
          <span style={styles.error}>{error}</span>
          <button type="button" style={styles.retryBtn} onClick={load}>Retry</button>
        </div>
      )}
      <div style={styles.grid}>
        {list.map((r) => (
          <div key={r.id} style={styles.card}>
            <div style={styles.cardHeader}>
              <span style={styles.roomName}>{r.block}-{r.number}</span>
              <span style={styles.capacity}>{occupancy(r.id)} / {r.capacity}</span>
            </div>
            {r.floor && <div style={styles.muted}>Floor: {r.floor}</div>}
            <div style={styles.actions}>
              <button style={{...styles.btnSm, background: 'var(--accent)', color: '#000', border: 'none'}} onClick={() => setVisualizerRoomId(r.id)}>Visualize</button>
              <button style={styles.btnSm} onClick={() => openEdit(r)}>Edit</button>
              <button style={{ ...styles.btnSm, color: 'var(--danger)' }} onClick={() => handleDelete(r.id)} disabled={occupancy(r.id) > 0}>Delete</button>
            </div>
          </div>
        ))}
      </div>
      {showForm && (
        <div style={overlay} onClick={() => setShowForm(false)}>
          <div style={modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.25rem' }}>{editing ? 'Edit room' : 'Add room'}</h2>
            <form onSubmit={handleSave}>
              <div style={field}><label>Block *</label><input value={form.block} onChange={(e) => setForm((f) => ({ ...f, block: e.target.value }))} required style={input} placeholder="e.g. A" /></div>
              <div style={field}><label>Room number *</label><input value={form.number} onChange={(e) => setForm((f) => ({ ...f, number: e.target.value }))} required style={input} placeholder="e.g. 101" /></div>
              <div style={field}><label>Capacity *</label><input type="number" min={1} value={form.capacity} onChange={(e) => setForm((f) => ({ ...f, capacity: Number(e.target.value) || 1 }))} style={input} /></div>
              <div style={field}><label>Floor</label><input value={form.floor} onChange={(e) => setForm((f) => ({ ...f, floor: e.target.value }))} style={input} placeholder="Optional" /></div>
              <div style={actions}><button type="button" style={btnSecondary} onClick={() => setShowForm(false)}>Cancel</button><button type="submit" style={btnPrimary}>Save</button></div>
            </form>
          </div>
        </div>
      )}
      
      {visualizerRoomId && (
        <RoomVisualizer 
          roomId={visualizerRoomId} 
          onClose={() => setVisualizerRoomId(null)}
          onAssigned={() => load()} 
        />
      )}
    </div>
  );
}

const styles = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' },
  title: { fontSize: '1.75rem', fontWeight: 700, margin: 0 },
  btnPrimary: { background: 'var(--accent)', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: 'var(--radius)', fontWeight: 600 },
  btnSm: { background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', padding: '0.25rem 0.5rem', borderRadius: 6, marginRight: '0.25rem', fontSize: '0.875rem' },
  errorWrap: { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' },
  error: { color: 'var(--danger)' },
  retryBtn: { background: 'var(--surface-hover)', border: '1px solid var(--border)', color: 'var(--text)', padding: '0.25rem 0.5rem', borderRadius: 6, fontSize: '0.875rem' },
  centered: { padding: '2rem', textAlign: 'center' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' },
  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1rem' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' },
  roomName: { fontWeight: 600, fontFamily: 'var(--font-mono)' },
  capacity: { color: 'var(--text-muted)', fontSize: '0.875rem' },
  muted: { color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' },
  actions: { marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' },
};
