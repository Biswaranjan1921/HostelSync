import { useState, useEffect } from 'react';
import { api } from '../../api/client';

export default function StudentQrModal({ student, onClose }) {
  const [qrBase64, setQrBase64] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api.students.getQr(student.id)
      .then((data) => { if (!cancelled) setQrBase64(data.qrBase64); })
      .catch(() => { if (!cancelled) setQrBase64(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [student.id]);

  const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
  const modal = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.5rem', textAlign: 'center', maxWidth: 320 };
  const title = { marginTop: 0, marginBottom: '0.25rem' };
  const muted = { color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem' };
  const qrWrap = { padding: '1rem', background: '#fff', borderRadius: 8, display: 'inline-block' };
  const qrImg = { display: 'block', width: 200, height: 200 };
  const token = { fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1rem', wordBreak: 'break-all' };
  const code = { fontFamily: 'var(--font-mono)', fontSize: '0.7rem' };
  const error = { color: 'var(--danger)' };
  const btn = { marginTop: '1rem', background: 'var(--surface-hover)', border: '1px solid var(--border)', color: 'var(--text)', padding: '0.5rem 1rem', borderRadius: 8 };

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={(e) => e.stopPropagation()}>
        <h2 style={title}>{student.name} – Meal QR</h2>
        <p style={muted}>Scan this QR at the mess to verify meal.</p>
        {loading ? <p>Loading QR…</p> : qrBase64 ? (
          <div style={qrWrap}>
            <img src={`data:image/png;base64,${qrBase64}`} alt="Student meal QR" style={qrImg} />
          </div>
        ) : <p style={error}>Failed to load QR.</p>}
        <p style={token}>Token: <code style={code}>{student?.qrToken ?? '—'}</code></p>
        <button style={btn} onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
