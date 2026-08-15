import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { api } from '../api/client';
import { QrCode, CheckCircle2, XCircle, Utensils, Clock, User, Upload, Camera, CameraOff } from 'lucide-react';

export default function CanteenDashboard() {
  const [scanResult, setScanResult] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [recentScans, setRecentScans] = useState([]);
  const [manualToken, setManualToken] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  
  const fileInputRef = useRef(null);
  const qrInstanceRef = useRef(null);

  useEffect(() => {
    loadRecentScans();

    return () => {
      if (qrInstanceRef.current) {
        qrInstanceRef.current.stop().catch(() => {});
        qrInstanceRef.current = null;
      }
    };
  }, []);

  const loadRecentScans = async () => {
    try {
      const data = await api.mealVerification.recent(50);
      setRecentScans(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleScan = async (decodedText) => {
    if (!decodedText || !decodedText.trim()) return;
    try {
      setScanning(true);
      const res = await api.mealVerification.verify({ qrPayload: decodedText.trim() });
      setScanResult({
        success: true,
        data: res
      });
      loadRecentScans();
    } catch (err) {
      const errMsg = err.message || 'Verification rejected by server.';
      const formalMsg = errMsg.startsWith('FORMAL REJECTION') || errMsg.startsWith('FORMAL DENIAL')
        ? errMsg
        : `FORMAL DENIAL NOTICE: ${errMsg}`;
      setScanResult({
        success: false,
        isFormalDenial: true,
        message: formalMsg
      });
    } finally {
      setScanning(false);
      setTimeout(() => {
        setScanResult(null);
      }, 6000);
    }
  };

  const startCamera = async () => {
    try {
      setScanResult(null);
      // Ask user for explicit camera permission
      await navigator.mediaDevices.getUserMedia({ video: true });

      const cameras = await Html5Qrcode.getCameras();
      if (!cameras || cameras.length === 0) {
        setScanResult({
          success: false,
          isFormalDenial: true,
          message: 'FORMAL DENIAL NOTICE: No camera hardware detected on this device. Please upload a QR image or use manual input.'
        });
        return;
      }

      if (qrInstanceRef.current) {
        await qrInstanceRef.current.stop().catch(() => {});
        qrInstanceRef.current = null;
      }

      const html5Qr = new Html5Qrcode('qr-reader');
      qrInstanceRef.current = html5Qr;

      const cameraId = cameras[0].id;
      await html5Qr.start(
        cameraId,
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decodedText) => {
          handleScan(decodedText);
        },
        () => {}
      );
      setCameraActive(true);
    } catch (err) {
      setScanResult({
        success: false,
        isFormalDenial: true,
        message: 'FORMAL DENIAL NOTICE: Camera access permission denied by user or device settings.'
      });
      setCameraActive(false);
    }
  };

  const stopCamera = async () => {
    if (qrInstanceRef.current) {
      try {
        await qrInstanceRef.current.stop();
      } catch (err) {
        console.error(err);
      }
      qrInstanceRef.current = null;
    }
    setCameraActive(false);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualToken) {
      handleScan(manualToken);
      setManualToken('');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanning(true);
    setScanResult(null);

    const tempRegionId = 'qr-file-temp-region';
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
      await handleScan(decodedText);
    } catch (err) {
      setScanResult({
        success: false,
        isFormalDenial: true,
        message: 'FORMAL DENIAL NOTICE: The uploaded image does not contain a valid or readable HostelSync QR Pass (NotFoundException: No MultiFormat Readers detected valid code). Access is formally denied.'
      });
    } finally {
      setScanning(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setTimeout(() => {
        setScanResult(null);
      }, 8000);
    }
  };

  return (
    <div style={styles.container}>
      {/* Header & Scan Counter */}
      <div style={styles.headerRow}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <img src="/logo.jpg" alt="HostelSync Logo" style={{ width: '48px', height: '48px', borderRadius: '12px', objectFit: 'cover', border: '1px solid var(--glass-border)' }} />
          <div>
            <h1 style={styles.title}>Canteen Dining Verification</h1>
            <p style={styles.subtitle}>Scan student QR pass or upload QR image to log meal access</p>
          </div>
        </div>
        <div style={styles.counterCard} className="glass-card">
          <Utensils size={28} color="var(--accent)" />
          <div>
            <div style={styles.counterNum}>{recentScans.length}</div>
            <div style={styles.counterLabel}>Total Scans Today</div>
          </div>
        </div>
      </div>

      <div style={styles.grid}>
        {/* Left Column: QR Scanner & Controls */}
        <div style={styles.scannerCard} className="glass-card">
          <h3 style={styles.cardHeader}><QrCode size={20} color="var(--accent)" /> Scanner Terminal</h3>
          
          {/* Camera Permission Button */}
          <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
            {!cameraActive ? (
              <button onClick={startCamera} style={styles.cameraToggleBtn}>
                <Camera size={18} /> Request Permission & Open Camera
              </button>
            ) : (
              <button onClick={stopCamera} style={styles.cameraStopBtn}>
                <CameraOff size={18} /> Turn Off Camera Scanner
              </button>
            )}
          </div>

          <div id="qr-reader" style={styles.reader}></div>

          {/* Upload QR Image Button */}
          <div style={{ marginTop: '1.25rem' }}>
            <label style={styles.uploadLabel}>
              <Upload size={16} color="var(--accent)" /> Upload QR Image File
              <input 
                type="file" 
                ref={fileInputRef}
                accept="image/*" 
                onChange={handleFileUpload} 
                style={{ display: 'none' }} 
              />
            </label>
          </div>

          <form onSubmit={handleManualSubmit} style={styles.manualForm}>
            <input 
              type="text" 
              value={manualToken} 
              onChange={(e) => setManualToken(e.target.value)} 
              placeholder="Or enter student QR Token / ID..." 
              style={styles.manualInput} 
            />
            <button type="submit" style={styles.verifyBtn}>
              Verify
            </button>
          </form>

          {scanning && <div style={styles.scanningAlert}>Processing scan / analyzing image...</div>}

          {/* Access Granted Box */}
          {scanResult && scanResult.success && (
            <div style={styles.successBox}>
              <CheckCircle2 size={36} color="#22c55e" />
              <div>
                <h3 style={{ margin: '0 0 0.25rem 0', color: '#22c55e' }}>Access Granted</h3>
                <p style={{ margin: 0, fontSize: '0.95rem' }}>
                  <strong>{scanResult.data.studentName}</strong> (ID: {scanResult.data.studentId})<br/>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    Meal Slot: {scanResult.data.mealSlot} • {new Date(scanResult.data.verifiedAt).toLocaleTimeString()}
                  </span>
                </p>
              </div>
            </div>
          )}

          {/* Formal Denial Box for Errors / Non-QR Images */}
          {scanResult && !scanResult.success && (
            <div style={scanResult.isFormalDenial ? styles.formalDenialBox : styles.errorBox}>
              <XCircle size={36} color="#ef4444" style={{ flexShrink: 0 }} />
              <div>
                <h3 style={{ margin: '0 0 0.25rem 0', color: '#ef4444', fontSize: '1rem', fontWeight: 800 }}>
                  {scanResult.isFormalDenial ? 'FORMAL REJECTION & DENIAL NOTICE' : 'Access Denied'}
                </h3>
                <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: '1.5', color: 'var(--text)' }}>
                  {scanResult.message}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Scan History Table */}
        <div style={styles.historyCard} className="glass-card">
          <h3 style={styles.cardHeader}><Clock size={20} color="var(--accent)" /> Today's Verified Scans</h3>
          
          {recentScans.length === 0 ? (
            <div style={styles.emptyState}>No scans recorded today.</div>
          ) : (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Student Name</th>
                    <th style={styles.th}>Meal Slot</th>
                    <th style={styles.th}>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {recentScans.map((scan, i) => (
                    <tr key={scan.id || i} style={styles.tr}>
                      <td style={styles.td}>
                        <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <User size={14} color="var(--accent)" />
                          {scan.studentName || `Student #${scan.studentId}`}
                        </div>
                        <span style={styles.subText}>ID: {scan.studentId}</span>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.slotBadge}>{scan.mealSlot}</span>
                      </td>
                      <td style={styles.td}>
                        {new Date(scan.verifiedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { padding: '2rem', maxWidth: '1300px', margin: '0 auto' },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' },
  title: { margin: 0, fontSize: '2rem', fontWeight: 800 },
  subtitle: { color: 'var(--text-muted)', margin: '0.25rem 0 0 0' },
  counterCard: { display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.5rem', borderRadius: '12px', background: 'var(--surface)', border: '1px solid var(--border)' },
  counterNum: { fontSize: '1.75rem', fontWeight: 900, color: 'var(--accent)', lineHeight: 1 },
  counterLabel: { fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' },
  grid: { display: 'grid', gridTemplateColumns: '480px 1fr', gap: '2rem', alignItems: 'start' },
  scannerCard: { background: 'var(--surface)', padding: '1.5rem', borderRadius: '14px', border: '1px solid var(--border)' },
  historyCard: { background: 'var(--surface)', padding: '1.5rem', borderRadius: '14px', border: '1px solid var(--border)' },
  cardHeader: { margin: '0 0 1.25rem 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px dashed var(--border)', paddingBottom: '0.75rem' },
  reader: { width: '100%', overflow: 'hidden', borderRadius: '10px', minHeight: '10px' },
  cameraToggleBtn: { display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem', borderRadius: '8px', background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', color: '#fff', border: 'none', fontWeight: 'bold', fontSize: '0.9rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' },
  cameraStopBtn: { display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid #ef4444', fontWeight: 'bold', fontSize: '0.9rem', cursor: 'pointer' },
  uploadLabel: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.65rem 1rem', borderRadius: '8px', border: '1px dashed var(--accent)', background: 'rgba(59, 130, 246, 0.08)', color: 'var(--accent)', fontWeight: 'bold', fontSize: '0.875rem', cursor: 'pointer', textAlign: 'center' },
  manualForm: { marginTop: '1rem', display: 'flex', gap: '0.5rem' },
  manualInput: { flex: 1, padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', outline: 'none', fontSize: '0.9rem' },
  verifyBtn: { padding: '0.75rem 1.25rem', background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' },
  scanningAlert: { marginTop: '1rem', padding: '0.75rem', background: 'var(--surface-hover)', borderRadius: '8px', textAlign: 'center', fontSize: '0.9rem' },
  successBox: { marginTop: '1.25rem', padding: '1rem', background: 'rgba(34, 197, 94, 0.12)', border: '1px solid #22c55e', borderRadius: '10px', display: 'flex', gap: '1rem', alignItems: 'center' },
  errorBox: { marginTop: '1.25rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid #ef4444', borderRadius: '10px', display: 'flex', gap: '1rem', alignItems: 'center' },
  formalDenialBox: { marginTop: '1.25rem', padding: '1.25rem', background: 'rgba(239, 68, 68, 0.15)', border: '2px solid #ef4444', borderRadius: '12px', display: 'flex', gap: '1rem', alignItems: 'flex-start', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)' },
  emptyState: { padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-muted)' },
  tableWrapper: { maxHeight: '520px', overflowY: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' },
  th: { padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' },
  tr: { borderBottom: '1px solid var(--border)' },
  td: { padding: '0.85rem 1rem' },
  subText: { fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' },
  slotBadge: { background: 'rgba(59, 130, 246, 0.15)', color: 'var(--accent)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' },
};
