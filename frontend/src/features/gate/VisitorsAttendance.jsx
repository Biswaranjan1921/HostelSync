import { useState, useEffect, useRef } from 'react';
import { api } from '../../api/client';
import { Html5Qrcode } from 'html5-qrcode';

export default function VisitorsAttendance() {
  const [activeTab, setActiveTab] = useState('SCANNER'); // SCANNER, LOGS, VISITORS
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [visitorLogs, setVisitorLogs] = useState([]);
  
  // Scanner state
  const [qrToken, setQrToken] = useState('');
  const [direction, setDirection] = useState('ENTRY'); // ENTRY, EXIT
  const [scanResult, setScanResult] = useState(null);
  
  // Visitor Form State
  const [visitorName, setVisitorName] = useState('');
  const [relation, setRelation] = useState('PARENT');
  const [studentId, setStudentId] = useState('');
  const [studentName, setStudentName] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState(null);
  const [scannerActive, setScannerActive] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);

  const scannerRef = useRef(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [att, vis] = await Promise.all([
        api.attendance.recent(),
        api.visitors.list()
      ]);
      setAttendanceLogs(att);
      setVisitorLogs(vis);
    } catch (err) {
      setError(err.message || 'Failed to load logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  // Start QR Camera Scanner
  useEffect(() => {
    if (activeTab !== 'SCANNER' || !scannerActive) return;
    
    const startCamera = () => {
      Html5Qrcode.getCameras()
        .then((cameras) => {
          if (cameras.length === 0) {
            setError('No camera found.');
            setScannerActive(false);
            return;
          }
          const id = cameras[0].id;
          const html5Qr = new Html5Qrcode('reader');
          scannerRef.current = html5Qr;
          
          html5Qr.start(id, { fps: 5, qrbox: { width: 250, height: 250 } },
            (decodedText) => {
              html5Qr.stop().then(() => {
                setScannerActive(false);
                setCameraReady(false);
                scannerRef.current = null;
                document.getElementById('reader')?.replaceChildren?.();
                handleQrVerified(decodedText);
              }).catch(() => {});
            }, () => {}
          ).then(() => setCameraReady(true))
           .catch((err) => {
             setError('Camera error: ' + (err.message || 'Unknown'));
             setScannerActive(false);
           });
        })
        .catch(() => {
          setError('Could not access cameras.');
          setScannerActive(false);
        });
    };
    
    startCamera();
    
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      }
      setCameraReady(false);
    };
  }, [activeTab, scannerActive, direction]);

  const handleQrVerified = async (token) => {
    setSuccess('');
    setError(null);
    setScanResult(null);
    try {
      const res = await api.attendance.record({
        qrPayload: token,
        direction: direction
      });
      setScanResult(res);
      setSuccess(`Gate attendance logged!`);
      setQrToken('');
    } catch (err) {
      setError(err.message || 'Gate verification failed');
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!qrToken) return;
    handleQrVerified(qrToken);
  };

  const handleCreateVisitor = async (e) => {
    e.preventDefault();
    if (!visitorName || !studentId || !studentName) {
      alert('Please fill in visitor details');
      return;
    }
    try {
      setError(null);
      setSuccess('');
      await api.visitors.create({
        visitorName,
        relation,
        studentId: parseInt(studentId),
        studentName,
        status: 'APPROVED' // warden creates and approves directly
      });
      setSuccess(`Visitor register logged for ${visitorName}`);
      setVisitorName('');
      setStudentId('');
      setStudentName('');
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to log visitor');
    }
  };

  const handleVisitorCheckout = async (id) => {
    try {
      setError(null);
      setSuccess('');
      await api.visitors.updateStatus(id, 'COMPLETED');
      setSuccess('Visitor exit logged successfully.');
      loadData();
    } catch (err) {
      setError(err.message || 'Visitor check-out failed');
    }
  };

  const handleVisitorApprove = async (id) => {
    try {
      setError(null);
      setSuccess('');
      await api.visitors.updateStatus(id, 'APPROVED');
      setSuccess('Visitor entry request approved.');
      loadData();
    } catch (err) {
      setError(err.message || 'Visitor approval failed');
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.headerTitle}>Gate Operations & Visitors</h1>
      <p style={styles.headerSubtitle}>Record student entries/exits via gate QR codes and verify visitor logs</p>

      {success && <div style={styles.success}>{success}</div>}
      {error && <div style={styles.error}>{error}</div>}

      {/* Tabs */}
      <div style={styles.tabs}>
        <button 
          onClick={() => { setActiveTab('SCANNER'); setScanResult(null); }}
          style={{ ...styles.tabBtn, ...(activeTab === 'SCANNER' ? styles.tabActive : {}) }}
        >
          Gate QR Scanner
        </button>
        <button 
          onClick={() => setActiveTab('LOGS')}
          style={{ ...styles.tabBtn, ...(activeTab === 'LOGS' ? styles.tabActive : {}) }}
        >
          Student Gate Logs
        </button>
        <button 
          onClick={() => setActiveTab('VISITORS')}
          style={{ ...styles.tabBtn, ...(activeTab === 'VISITORS' ? styles.tabActive : {}) }}
        >
          Visitor Registry
        </button>
      </div>

      {/* SCANNER VIEW */}
      {activeTab === 'SCANNER' && (
        <div style={styles.grid}>
          {/* Action column */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Verify Student Gate Pass</h3>
            
            <div style={styles.directionToggle}>
              <button 
                onClick={() => setDirection('ENTRY')}
                style={{ ...styles.dirBtn, ...(direction === 'ENTRY' ? styles.dirBtnEntry : {}) }}
              >
                📥 Student Entry (Check-In)
              </button>
              <button 
                onClick={() => setDirection('EXIT')}
                style={{ ...styles.dirBtn, ...(direction === 'EXIT' ? styles.dirBtnExit : {}) }}
              >
                📤 Student Exit (Check-Out)
              </button>
            </div>

            <form onSubmit={handleManualSubmit} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Manual QR Token ID</label>
                <input 
                  type="text" 
                  value={qrToken}
                  onChange={(e) => setQrToken(e.target.value)}
                  placeholder="e.g. ST-2849F30"
                  style={styles.input}
                />
              </div>
              <div style={styles.formRow}>
                <button type="submit" style={styles.submitBtn}>
                  Verify & Log gate
                </button>
                <button 
                  type="button" 
                  onClick={() => setScannerActive(!scannerActive)}
                  style={styles.btnSecondary}
                >
                  {scannerActive ? 'Stop Camera' : 'Use Camera Scanner'}
                </button>
              </div>
            </form>

            {scannerActive && (
              <div style={styles.scannerWrapper}>
                <div id="reader" style={{ width: '100%' }}></div>
              </div>
            )}
          </div>

          {/* Verification Results Panel */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Last Verification Result</h3>
            {scanResult ? (
              <div style={styles.resultBox}>
                <div style={styles.resultOk}>✓ LOGGED</div>
                <div style={styles.resultDetails}>
                  <div style={styles.resultName}>{scanResult.studentName}</div>
                  <div style={styles.resultTime}>
                    {scanResult.direction === 'ENTRY' ? 'Checked in' : 'Checked out'} at{' '}
                    {new Date(scanResult.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ) : (
              <div style={styles.emptyScanner}>
                <p>Waiting for scan or manual token entry...</p>
                <span style={styles.textMuted}>Set the gate direction (Entry/Exit) before scan.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STUDENT GATE LOGS VIEW */}
      {activeTab === 'LOGS' && (
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Gate Entry / Exit Log</h3>
          {attendanceLogs.length === 0 ? (
            <p style={styles.empty}>No logs recorded today.</p>
          ) : (
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Student ID</th>
                    <th style={styles.th}>Student Name</th>
                    <th style={styles.th}>Action</th>
                    <th style={styles.th}>Timestamp</th>
                    <th style={styles.th}>Verification Method</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceLogs.map((l) => (
                    <tr key={l.id} style={styles.tr}>
                      <td style={styles.td}>#{l.studentId}</td>
                      <td style={styles.td}><strong>{l.studentName}</strong></td>
                      <td style={styles.td}>
                        <span style={l.direction === 'ENTRY' ? styles.badgeEntry : styles.badgeExit}>
                          {l.direction === 'ENTRY' ? '📥 ENTRY' : '📤 EXIT'}
                        </span>
                      </td>
                      <td style={styles.td}>
                        {new Date(l.timestamp).toLocaleDateString()} {new Date(l.timestamp).toLocaleTimeString()}
                      </td>
                      <td style={styles.td}>{l.method}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* VISITORS VIEW */}
      {activeTab === 'VISITORS' && (
        <div style={styles.grid}>
          {/* Visitor List */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Active / Past Guests</h3>
            {visitorLogs.length === 0 ? (
              <p style={styles.empty}>No visitor logs found.</p>
            ) : (
              <div style={styles.visitorList}>
                {visitorLogs.map((v) => (
                  <div key={v.id} style={styles.visitorItem}>
                    <div style={styles.visitorMain}>
                      <div>
                        <strong>{v.visitorName}</strong>
                        <span style={styles.relationTag}>{v.relation}</span>
                      </div>
                      <div style={styles.visitorSub}>
                        Visiting student: <strong>{v.studentName}</strong> (ID: #{v.studentId})
                      </div>
                      <div style={styles.visitorTimes}>
                        <div>Entry: {v.entryTime ? new Date(v.entryTime).toLocaleString() : 'Pending'}</div>
                        {v.exitTime && <div>Exit: {new Date(v.exitTime).toLocaleString()}</div>}
                      </div>
                    </div>
                    <div style={styles.visitorActions}>
                      {v.status === 'PENDING' && (
                        <button style={styles.btnApprove} onClick={() => handleVisitorApprove(v.id)}>
                          Approve
                        </button>
                      )}
                      {v.status === 'APPROVED' && (
                        <button style={styles.btnCheckout} onClick={() => handleVisitorCheckout(v.id)}>
                          Check-Out
                        </button>
                      )}
                      {v.status === 'COMPLETED' && (
                        <span style={styles.badgeCompleted}>Completed</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Create Visitor Form */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Log Visitor Check-In</h3>
            <form onSubmit={handleCreateVisitor} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Visitor Full Name</label>
                <input 
                  type="text" 
                  value={visitorName}
                  onChange={(e) => setVisitorName(e.target.value)}
                  placeholder="e.g. Martha Smith"
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Relationship</label>
                <select 
                  value={relation}
                  onChange={(e) => setRelation(e.target.value)}
                  style={styles.select}
                >
                  <option value="PARENT">Parent</option>
                  <option value="SIBLING">Sibling</option>
                  <option value="FRIEND">Friend</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Student ID</label>
                  <input 
                    type="number" 
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="e.g. 1"
                    style={styles.input}
                    required
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Student Name</label>
                  <input 
                    type="text" 
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="Harry Potter"
                    style={styles.input}
                    required
                  />
                </div>
              </div>

              <button type="submit" style={styles.submitBtn}>
                Log Entry Check-In
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { paddingBottom: '3rem' },
  headerTitle: { fontSize: '2rem', fontWeight: 700, margin: '0 0 0.25rem 0' },
  headerSubtitle: { color: 'var(--text-muted)', margin: '0 0 2rem 0' },
  tabs: { display: 'flex', gap: '0.5rem', marginBottom: '2.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' },
  tabBtn: { background: 'transparent', border: 'none', color: 'var(--text-muted)', padding: '0.5rem 1rem', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' },
  tabActive: { color: 'var(--accent)', borderBottom: '2px solid var(--accent)' },
  
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start' },
  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.5rem' },
  cardTitle: { margin: '0 0 1.25rem 0', fontSize: '1.15rem', fontWeight: 600 },
  
  directionToggle: { display: 'flex', gap: '1rem', marginBottom: '1.5rem' },
  dirBtn: { flex: 1, padding: '0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' },
  dirBtnEntry: { background: 'rgba(34, 197, 94, 0.12)', color: 'var(--accent)', borderColor: 'var(--accent)' },
  dirBtnExit: { background: 'rgba(239, 68, 68, 0.12)', color: 'var(--danger)', borderColor: 'var(--danger)' },

  form: { display: 'flex', flexDirection: 'column', gap: '1.25rem' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 },
  formRow: { display: 'flex', gap: '1rem' },
  label: { fontSize: '0.85rem', color: 'var(--text-muted)' },
  input: { background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', padding: '0.65rem 0.85rem', borderRadius: '6px', fontSize: '0.9rem', outline: 'none' },
  select: { background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', padding: '0.65rem 0.85rem', borderRadius: '6px', fontSize: '0.9rem', outline: 'none' },
  
  submitBtn: { background: 'var(--accent)', color: '#000', border: 'none', borderRadius: '6px', padding: '0.75rem 1.25rem', fontWeight: 600, fontSize: '0.9rem', flex: 1.5 },
  btnSecondary: { background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '6px', padding: '0.75rem 1rem', fontSize: '0.9rem', fontWeight: 500, flex: 1 },
  
  scannerWrapper: { marginTop: '1.5rem', background: '#000', borderRadius: 8, padding: '1rem', border: '1px solid var(--border)' },
  
  resultBox: { background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '1.5rem', textAlign: 'center' },
  resultOk: { color: 'var(--accent)', fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.75rem' },
  resultDetails: { display: 'flex', flexDirection: 'column', gap: '0.25rem' },
  resultName: { fontSize: '1.2rem', fontWeight: 700 },
  resultTime: { color: 'var(--text-muted)', fontSize: '0.9rem' },
  emptyScanner: { padding: '4rem 1rem', textAlign: 'center', color: 'var(--text-muted)' },
  textMuted: { fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.5rem' },
  
  success: { background: 'rgba(34, 197, 94, 0.12)', border: '1px solid var(--accent)', color: '#a7f3d0', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1.5rem', fontSize: '0.875rem' },
  error: { background: 'rgba(239, 68, 68, 0.12)', border: '1px solid var(--danger)', color: '#fca5a5', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1.5rem', fontSize: '0.875rem' },

  // Logs table
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  tr: { borderBottom: '1px solid var(--border)' },
  th: { textAlign: 'left', padding: '0.75rem 1rem', borderBottom: '2px solid var(--border)', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem' },
  td: { padding: '0.85rem 1rem', fontSize: '0.9rem' },
  badgeEntry: { color: 'var(--accent)', background: 'rgba(34, 197, 94, 0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 },
  badgeExit: { color: 'var(--danger)', background: 'rgba(239, 68, 68, 0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 },
  empty: { color: 'var(--text-muted)', textAlign: 'center', margin: '2rem 0' },

  // Visitor List
  visitorList: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  visitorItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)', gap: '1rem' },
  visitorMain: { display: 'flex', flexDirection: 'column', gap: '0.25rem' },
  relationTag: { fontSize: '0.7rem', color: 'var(--accent)', background: 'rgba(34, 197, 94, 0.1)', padding: '0.1rem 0.4rem', borderRadius: '4px', marginLeft: '0.5rem', fontWeight: 600 },
  visitorSub: { fontSize: '0.85rem', color: 'var(--text-muted)' },
  visitorTimes: { fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '1rem', marginTop: '0.25rem' },
  visitorActions: { display: 'flex', gap: '0.5rem' },
  btnApprove: { background: 'var(--accent)', color: '#000', border: 'none', borderRadius: '6px', padding: '0.35rem 0.75rem', fontSize: '0.8rem', fontWeight: 600 },
  btnCheckout: { background: 'var(--danger)', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.35rem 0.75rem', fontSize: '0.8rem', fontWeight: 600 },
  badgeCompleted: { color: 'var(--text-muted)', fontSize: '0.8rem' },
};
