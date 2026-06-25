import { useState, useEffect } from 'react';

export default function StudentForm({ student, rooms, onSave, onCancel }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [roomId, setRoomId] = useState('');
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (student) {
      setName(student.name);
      setEmail(student.email || '');
      setPhone(student.phone || '');
      setRoomId(student.roomId != null ? String(student.roomId) : '');
      setActive(student.active !== false);
    } else {
      setName('');
      setEmail('');
      setPhone('');
      setRoomId('');
      setActive(true);
    }
  }, [student]);

  const submit = (e) => {
    e.preventDefault();
    onSave({
      name: name.trim(),
      email: email.trim() || null,
      phone: phone.trim() || null,
      roomId: roomId ? Number(roomId) : null,
      active,
    });
  };

  const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
  const modal = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.5rem', width: '100%', maxWidth: 400 };
  const title = { marginTop: 0, marginBottom: '1rem', fontSize: '1.25rem' };
  const field = { marginBottom: '1rem' };
  const input = { width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '1rem' };
  const checkboxLabel = { display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' };
  const actions = { display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' };
  const btnPrimary = { background: 'var(--accent)', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: 8, fontWeight: 600 };
  const btnSecondary = { background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)', padding: '0.5rem 1rem', borderRadius: 8 };

  return (
    <div style={overlay}>
      <div style={modal}>
        <h2 style={title}>{student ? 'Edit student' : 'Add student'}</h2>
        <form onSubmit={submit}>
          <div style={field}>
            <label>Name *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required style={input} placeholder="Full name" />
          </div>
          <div style={field}>
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={input} placeholder="email@example.com" />
          </div>
          <div style={field}>
            <label>Phone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} style={input} placeholder="Phone number" />
          </div>
          <div style={field}>
            <label>Room</label>
            <select value={roomId} onChange={(e) => setRoomId(e.target.value)} style={input}>
              <option value="">— Select room —</option>
              {(rooms || []).map((r) => (
                <option key={r.id} value={r.id}>{r.block}-{r.number} (capacity {r.capacity})</option>
              ))}
            </select>
          </div>
          {student && (
            <div style={field}>
              <label style={checkboxLabel}>
                <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
                Active
              </label>
            </div>
          )}
          <div style={actions}>
            <button type="button" style={btnSecondary} onClick={onCancel}>Cancel</button>
            <button type="submit" style={btnPrimary}>{student ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
