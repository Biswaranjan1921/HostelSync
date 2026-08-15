import { useState, useEffect, useRef } from 'react';
import { api } from '../../api/client';
import { Html5Qrcode } from 'html5-qrcode';
import { Utensils, Camera, Keyboard, Clock, RefreshCw } from 'lucide-react';

export default function VerifyMeal() {
  const [manualPayload, setManualPayload] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState([]);
  const [scanMode, setScanMode] = useState('manual');
  const scannerRef = useRef(null);
  const [cameraReady, setCameraReady] = useState(false);

  // Time slot detection state
  const [activeSlot, setActiveSlot] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const loadRecent = () => api.mealVerification.recent(15).then(setRecent).catch(() => setRecent([]));

  useEffect(() => {
    loadRecent();
    
    // Timer to update client clock and detect active slot
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      
      const hours = now.getHours();
      const mins = now.getMinutes();
      const timeVal = hours * 60 + mins;

      // 9:00 AM (540 mins) to 11:00 AM (660 mins)
      if (timeVal >= 540 && timeVal <= 660) {
        setActiveSlot({ name: 'BREAKFAST', range: '9:00 AM - 11:00 AM' });
      }
      // 12:30 PM (750 mins) to 2:30 PM (870 mins)
      else if (timeVal >= 750 && timeVal <= 870) {
        setActiveSlot({ name: 'LUNCH', range: '12:30 PM - 2:30 PM' });
      }
      // 7:30 PM (1170 mins) to 9:30 PM (1290 mins)
      else if (timeVal >= 1170 && timeVal <= 1290) {
        setActiveSlot({ name: 'DINNER', range: '7:30 PM - 9:30 PM' });
      }
      else {
        setActiveSlot(null);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const verify = async (qrPayload) => {
    if (!qrPayload || !qrPayload.trim()) { 
      setResult({ success: false, message: 'Enter or scan a QR payload.' }); 
      return; 
    }
    setLoading(true);
    setResult(null);
    try {
      // The backend computes slot automatically, so slot parameter is omitted/optional
      const res = await api.mealVerification.verify({ qrPayload: qrPayload.trim() });
      setResult(res);
      if (res.success) { 
        setManualPayload(''); 
        loadRecent(); 
      }
    } catch (e) {
      setResult({ success: false, message: e.body?.message || e.message || 'Verification failed.' });
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e) => { 
    e.preventDefault(); 
    verify(manualPayload); 
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setResult(null);

    const tempRegionId = 'qr-verify-temp-region';
    let tempDiv = document.getElementById(tempRegionId);
    if (!tempDiv) {
      tempDiv = document.createElement('div');
      tempDiv.id = tempRegionId;
      tempDiv.style.display = 'none';
      document.body.appendChild(tempDiv);
    }

    try {
      const html5QrCode = new Html5Qrcode(tempRegionId);
      const decodedText = await html5QrCode.scanFile(file, true);
      await verify(decodedText);
    } catch (err) {
      setResult({
        success: false,
        isFormalDenial: true,
        message: 'FORMAL DENIAL NOTICE: The uploaded image does not contain a valid or readable HostelSync QR Pass (NotFoundException: No MultiFormat Readers detected valid code). Access is formally denied.'
      });
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  useEffect(() => {
    if (scanMode !== 'camera') return;
    const startCamera = () => {
      Html5Qrcode.getCameras()
        .then((cameras) => {
          if (cameras.length === 0) { 
            setResult({ success: false, message: 'No camera found.' }); 
            return; 
          }
          const id = cameras[0].id;
          const html5Qr = new Html5Qrcode('qr-reader');
          scannerRef.current = html5Qr;
          html5Qr.start(id, { fps: 5, qrbox: { width: 250, height: 250 } },
            (decodedText) => {
              html5Qr.stop().then(() => {
                setScanMode('manual');
                setCameraReady(false);
                scannerRef.current = null;
                document.getElementById('qr-reader')?.replaceChildren?.();
                verify(decodedText);
              }).catch(() => {});
            }, () => {}
          ).then(() => setCameraReady(true)).catch((err) => setResult({ success: false, message: 'Camera error: ' + (err.message || 'Unknown') }));
        })
        .catch(() => setResult({ success: false, message: 'Could not access cameras.' }));
    };
    startCamera();
    return () => {
      if (scannerRef.current) { 
        scannerRef.current.stop().catch(() => {}); 
        scannerRef.current = null; 
      }
      setCameraReady(false);
    };
  }, [scanMode]);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Dining Hall Verification</h1>
          <p style={styles.subtitle}>Superintendent gate/dining meal scans validator</p>
        </div>
        <button style={styles.refreshBtn} onClick={loadRecent}><RefreshCw size={14} /> Refresh Logs</button>
      </div>

      {/* DYNAMIC TIME-SLOT TEXT BANNER */}
      <div style={{
        ...styles.timeBanner,
        ...(activeSlot ? styles.bannerActive : styles.bannerClosed)
      }} className="glass-card glow-hover">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Clock size={20} color={activeSlot ? 'var(--accent)' : 'var(--danger)'} />
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 700 }}>
              {activeSlot ? `ACTIVE SESSION: ${activeSlot.name}` : 'DINING SCANNING CLOSED'}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {activeSlot 
                ? `Scanning active for ${activeSlot.range}. Meal routing will record automatically.` 
                : `Scanning window is inactive. Active slots: Breakfast (9-11 AM), Lunch (12:30-2:30 PM), Dinner (7:30-9:30 PM).`}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{
            ...styles.dotIndicator,
            ...(activeSlot ? styles.dotGreen : styles.dotRed)
          }} />
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
            {currentTime.toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Scan Mode Toggle Row */}
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
          <label style={{ ...styles.tab, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <RefreshCw size={16} /> Upload QR Image
            <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
          </label>
        </div>
      </div>

      {scanMode === 'manual' && (
        <form onSubmit={handleManualSubmit} style={styles.form} className="glass-card">
          <input 
            type="text" 
            value={manualPayload} 
            onChange={(e) => setManualPayload(e.target.value)} 
            placeholder="Paste student daily QR token (e.g. ST-B65B54C8D80F33A7-20260625)..." 
            style={styles.input} 
            disabled={loading} 
          />
          <button type="submit" style={styles.btnPrimary} disabled={loading} className="btn-neon glow-hover">
            {loading ? 'Validating...' : 'Verify Dining Pass'}
          </button>
        </form>
      )}

      {scanMode === 'camera' && (
        <div style={styles.cameraWrap} className="glass-card">
          <div id="qr-reader" style={styles.readerBox} />
          {cameraReady && <p style={styles.muted}>Hold student's daily QR code in front of the lens.</p>}
        </div>
      )}

      {result && (
        <div style={{ ...styles.result, ...(result.success ? styles.resultSuccess : styles.resultError) }}>
          {result.success ? '✓ ' : '✗ '}{result.message}
          {result.success && result.studentName && <span style={styles.resultName}> — {result.studentName} (ID: #{result.studentId})</span>}
        </div>
      )}

      <section style={styles.card} className="glass-card">
        <h2 style={styles.sectionTitle}>Dining Hall Scan Logs (Today)</h2>
        {recent.length === 0 ? <p style={styles.muted}>No logs saved for today.</p> : (
          <ul style={styles.list}>
            {recent.map((v) => (
              <li key={v.id} style={styles.listItem}>
                <span style={styles.badge}>{v.mealSlot}</span>
                <span>Student reference: <strong>ID #{v.studentId}</strong></span>
                <span style={styles.muted}>{v.verifiedAt ? new Date(v.verifiedAt).toLocaleTimeString() : '—'}</span>
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
  
  timeBanner: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.25rem',
    borderRadius: 'var(--radius)',
    marginBottom: '1.5rem',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  bannerActive: {
    borderLeft: '4px solid var(--accent) !important',
  },
  bannerClosed: {
    borderLeft: '4px solid var(--danger) !important',
  },
  dotIndicator: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    display: 'inline-block',
  },
  dotGreen: {
    background: '#10b981',
    boxShadow: '0 0 8px #10b981',
    animation: 'pulse 1.5s infinite',
  },
  dotRed: {
    background: 'var(--danger)',
  },

  controls: { marginBottom: '1.5rem' },
  label: { display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' },
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
  badge: { background: 'rgba(59, 130, 246, 0.12)', color: 'var(--accent)', padding: '0.2rem 0.5rem', borderRadius: 6, fontSize: '0.75rem', fontFamily: 'var(--font-mono)' },
  muted: { color: 'var(--text-muted)', fontSize: '0.85rem' },
};
