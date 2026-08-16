import { useState, useEffect, useRef } from 'react';
import { api } from '../../api/client';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, Keyboard, LogIn, LogOut, RefreshCw, Clock } from 'lucide-react';

export default function CaretakerScanner() {
  const [direction, setDirection] = useState('ENTRY'); // ENTRY or EXIT
  const [manualPayload, setManualPayload] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [recentLogs, setRecentLogs] = useState([]);
  const [scanMode, setScanMode] = useState('manual');
  const scannerRef = useRef(null);
  const [cameraReady, setCameraReady] = useState(false);

  const loadRecentLogs = async () => {
    try {
      const logs = await api.attendance.recent();
      setRecentLogs(logs.slice(0, 15));
    } catch (e) {
      setRecentLogs([]);
    }
  };

  useEffect(() => {
    loadRecentLogs();
  }, []);

  const handleScan = async (qrPayload) => {
    if (!qrPayload || !qrPayload.trim()) {
      setResult({ success: false, message: 'Scan or type student QR pass payload' });
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const cleanPayload = qrPayload.trim();
      if (cleanPayload.startsWith('GATEPASS-')) {
        const passRes = await api.leaves.verifyGatePass({ qrPayload: cleanPayload });
        if (passRes.success) {
          setResult({
            success: true,
            isGatePass: true,
            message: passRes.message,
            studentName: passRes.studentName,
            studentId: passRes.studentId,
            department: passRes.department,
            roomNumber: passRes.roomNumber,
            reason: passRes.reason,
            startDate: passRes.startDate,
            endDate: passRes.endDate,
            photoBase64: passRes.photoBase64,
          });
        } else {
          setResult({
            success: false,
            isFormalDenial: true,
            message: passRes.message
          });
        }
      } else {
        const res = await api.attendance.record({
          qrPayload: cleanPayload,
          direction: direction
        });
        setResult({
          success: true,
          message: `${direction === 'ENTRY' ? 'Check-In' : 'Check-Out'} logged successfully.`,
          studentName: res.studentName
        });
      }
      setManualPayload('');
      loadRecentLogs();
    } catch (err) {
      const errMsg = err.body?.message || err.message || 'Gate log verification failed.';
      setResult({
        success: false,
        isFormalDenial: errMsg.startsWith('FORMAL DENIAL'),
        message: errMsg
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    handleScan(manualPayload);
  };

  useEffect(() => {
    if (scanMode !== 'camera') return;
    const startCamera = async () => {
      try {
        const html5Qr = new Html5Qrcode('gate-qr-reader', {
          verbose: false,
          experimentalFeatures: { useBarCodeDetectorIfSupported: true }
        });
        scannerRef.current = html5Qr;

        const qrConfig = {
          fps: 30,
          qrbox: (w, h) => ({ width: Math.min(w * 0.85, 280), height: Math.min(h * 0.85, 280) }),
          aspectRatio: 1.0
        };

        const onScanSuccess = (decodedText) => {
          html5Qr.stop().then(() => {
            setScanMode('manual');
            setCameraReady(false);
            scannerRef.current = null;
            document.getElementById('gate-qr-reader')?.replaceChildren?.();
            handleScan(decodedText);
          }).catch(() => {});
        };

        try {
          await html5Qr.start({ facingMode: 'environment' }, qrConfig, onScanSuccess, () => {});
          setCameraReady(true);
        } catch (e) {
          const cameras = await Html5Qrcode.getCameras();
          if (cameras && cameras.length > 0) {
            await html5Qr.start(cameras[0].id, qrConfig, onScanSuccess, () => {});
            setCameraReady(true);
          } else {
            setResult({ success: false, message: 'No camera hardware found.' });
          }
        }
      } catch (err) {
        setResult({ success: false, message: 'Camera error: ' + (err.message || 'Unknown') });
      }
    };
    startCamera();
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      }
      setCameraReady(false);
    };
  }, [scanMode, direction]);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>HostelSync Gate Scanner</h1>
          <p style={styles.subtitle}>Log resident check-ins and check-outs at the hostel entrance</p>
        </div>
        <button style={styles.refreshBtn} onClick={loadRecentLogs}><RefreshCw size={14} /> Refresh Logs</button>
      </div>

      <div style={styles.gateControlPanel} className="glass-card">
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>Select Scan Direction</h3>
        <div style={styles.directionToggle}>
          <button
            onClick={() => setDirection('ENTRY')}
            style={{
              ...styles.directionBtn,
              ...(direction === 'ENTRY' ? styles.directionBtnActiveEntry : {})
            }}
          >
            <LogIn size={18} /> Resident Check-In (ENTRY)
          </button>
          <button
            onClick={() => setDirection('EXIT')}
            style={{
              ...styles.directionBtn,
              ...(direction === 'EXIT' ? styles.directionBtnActiveExit : {})
            }}
          >
            <LogOut size={18} /> Resident Check-Out (EXIT)
          </button>
        </div>
      </div>

      <div style={styles.controls}>
        <div style={styles.tabs}>
          <button 
            style={{ ...styles.tab, ...(scanMode === 'manual' ? styles.tabActive : {}) }} 
            onClick={() => setScanMode('manual')}
          >
            <Keyboard size={16} /> Manual Input
          </button>
          <button 
            style={{ ...styles.tab, ...(scanMode === 'camera' ? styles.tabActive : {}) }} 
            onClick={() => setScanMode('camera')}
          >
            <Camera size={16} /> Scanner Camera
          </button>
        </div>
      </div>

      {scanMode === 'manual' && (
        <form onSubmit={handleManualSubmit} style={styles.form} className="glass-card">
          <input 
            type="text" 
            value={manualPayload} 
            onChange={(e) => setManualPayload(e.target.value)} 
            placeholder="Paste student pass daily QR payload (e.g. ST-A1B2C3D4E5F6G7H8-YYYYMMDD)..." 
            style={styles.input} 
            disabled={loading} 
          />
          <button type="submit" style={styles.btnPrimary} disabled={loading} className="btn-neon glow-hover">
            {loading ? 'Logging...' : 'Record Gate Pass'}
          </button>
        </form>
      )}

      {scanMode === 'camera' && (
        <div style={styles.cameraWrap} className="glass-card">
          <div id="gate-qr-reader" style={styles.readerBox} />
          {cameraReady && (
            <p style={styles.muted}>
              Point lens at daily student gate QR code for **{direction}** verification.
            </p>
          )}
        </div>
      )}

      {result && (
        <div style={{ ...styles.result, ...(result.success ? styles.resultSuccess : styles.resultError) }}>
          {result.success ? '✓ ' : '✗ '}{result.message}
          {result.success && result.studentName && <span style={styles.resultName}> — {result.studentName}</span>}
        </div>
      )}

      <section style={styles.card} className="glass-card">
        <h2 style={styles.sectionTitle}>Recent Gate Entrance Activity Logs</h2>
        {recentLogs.length === 0 ? <p style={styles.muted}>No gate checks recorded yet today.</p> : (
          <ul style={styles.list}>
            {recentLogs.map((v) => (
              <li key={v.id} style={styles.listItem}>
                <span style={{
                  ...styles.directionBadge,
                  ...(v.direction === 'ENTRY' ? styles.badgeEntry : styles.badgeExit)
                }}>
                  {v.direction}
                </span>
                <span>Resident: <strong>{v.studentName}</strong> (ID: #{v.studentId})</span>
                <span style={styles.muted}>{v.timestamp ? new Date(v.timestamp).toLocaleString() : '—'}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

const styles = {
  container: { paddingBottom: '3rem' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' },
  title: { fontSize: '2rem', fontWeight: 800, margin: 0 },
  subtitle: { color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' },
  refreshBtn: { background: 'var(--surface-hover)', border: '1px solid var(--border)', color: 'var(--text)', padding: '0.5rem 1rem', borderRadius: 'var(--radius)', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' },
  
  gateControlPanel: { padding: '1.5rem', borderRadius: 'var(--radius)', background: 'var(--surface)', border: '1px solid var(--border)', marginBottom: '1.5rem' },
  directionToggle: { display: 'flex', gap: '1rem', flexWrap: 'wrap' },
  directionBtn: { flex: 1, minWidth: '180px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', padding: '0.85rem 1.25rem', borderRadius: 'var(--radius)', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' },
  directionBtnActiveEntry: { background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', borderColor: '#10b981', boxShadow: '0 0 10px rgba(16, 185, 129, 0.15)' },
  directionBtnActiveExit: { background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', borderColor: 'var(--danger)', boxShadow: '0 0 10px rgba(239, 68, 68, 0.15)' },

  controls: { marginBottom: '1.5rem' },
  tabs: { display: 'flex', gap: '0.5rem' },
  tab: { display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 1rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' },
  tabActive: { background: 'rgba(59, 130, 246, 0.15)', color: 'var(--accent)', borderColor: 'var(--accent)' },
  
  card: { padding: '1.5rem', borderRadius: 'var(--radius)', background: 'var(--surface)', border: '1px solid var(--border)' },
  form: { display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', padding: '1.25rem', borderRadius: 'var(--radius)', background: 'var(--surface)', border: '1px solid var(--border)' },
  input: { flex: '1', minWidth: 280, padding: '0.65rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '0.9rem', outline: 'none' },
  btnPrimary: { background: 'var(--accent)', color: '#fff', border: 'none', padding: '0.65rem 1.25rem', borderRadius: '8px', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' },
  
  cameraWrap: { padding: '1.5rem', borderRadius: 'var(--radius)', background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
  readerBox: { width: '100%', maxWidth: '350px', borderRadius: '8px', overflow: 'hidden' },
  
  result: { padding: '0.75rem 1rem', borderRadius: 'var(--radius)', marginBottom: '1.5rem', fontWeight: 600, fontSize: '0.95rem' },
  resultSuccess: { background: 'rgba(16, 185, 129, 0.12)', color: '#34d399', border: '1px solid #10b981' },
  resultError: { background: 'rgba(239, 68, 68, 0.12)', color: '#f87171', border: '1px solid var(--danger)' },
  resultName: { fontWeight: 600 },
  
  sectionTitle: { fontSize: '1.125rem', marginBottom: '1rem', fontWeight: 600 },
  list: { listStyle: 'none', padding: 0, margin: 0 },
  listItem: { display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.9rem' },
  directionBadge: { fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.4rem', borderRadius: '4px' },
  badgeEntry: { background: 'rgba(16, 185, 129, 0.12)', color: '#34d399' },
  badgeExit: { background: 'rgba(239, 68, 68, 0.12)', color: '#f87171' },
  muted: { color: 'var(--text-muted)', fontSize: '0.85rem' },
};
