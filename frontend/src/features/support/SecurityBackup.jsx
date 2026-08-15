import { useState } from 'react';

const INITIAL_AUDIT_LOGS = [
  { id: 1, timestamp: '2026-06-24 11:45:10', user: 'superadmin', event: 'USER_LOGIN', desc: 'Successful login from IP 192.168.1.45', severity: 'INFO' },
  { id: 2, timestamp: '2026-06-24 11:32:04', user: 'admin', event: 'ROOM_ALLOCATION', desc: 'Allocated Room 102 to student ID #3', severity: 'INFO' },
  { id: 3, timestamp: '2026-06-24 11:15:58', user: 'admin', event: 'LEAVE_APPROVE', desc: 'Approved leave request ID #2', severity: 'INFO' },
  { id: 4, timestamp: '2026-06-24 10:54:12', user: 'superadmin', event: 'BACKUP_CREATE', desc: 'Manual system backup trigger successful (backup_v1.0.sql)', severity: 'WARN' },
  { id: 5, timestamp: '2026-06-24 10:20:30', user: 'system', event: 'MEAL_VERIFICATION', desc: 'Mess breakfast verification complete for 45 students', severity: 'INFO' },
  { id: 6, timestamp: '2026-06-24 09:12:00', user: 'superadmin', event: 'CREATE_ADMIN', desc: 'Registered new admin account "warden.jones"', severity: 'WARN' },
];

export default function SecurityBackup() {
  const [logs, setLogs] = useState(INITIAL_AUDIT_LOGS);
  const [backups, setBackups] = useState([
    { name: 'hostel_db_weekly_2026_06_18.sql', size: '2.4 MB', date: '2026-06-18' },
    { name: 'hostel_db_weekly_2026_06_11.sql', size: '2.3 MB', date: '2026-06-11' },
  ]);
  
  const [backingUp, setBackingUp] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [success, setSuccess] = useState('');

  const handleCreateBackup = () => {
    setBackingUp(true);
    setSuccess('');
    
    setTimeout(() => {
      const now = new Date();
      const dateString = now.toISOString().split('T')[0].replace(/-/g, '_');
      const timeString = now.toTimeString().split(' ')[0].replace(/:/g, '_');
      const backupName = `hostel_db_manual_${dateString}_${timeString}.sql`;
      
      const newBackup = {
        name: backupName,
        size: '2.5 MB',
        date: now.toISOString().split('T')[0]
      };
      
      setBackups([newBackup, ...backups]);
      
      // Add audit log
      const newLog = {
        id: Date.now(),
        timestamp: now.toISOString().replace('T', ' ').substring(0, 19),
        user: 'superadmin',
        event: 'BACKUP_CREATE',
        desc: `Manual system backup generated: ${backupName}`,
        severity: 'WARN'
      };
      setLogs([newLog, ...logs]);
      
      setSuccess(`Backup checkpoint "${backupName}" created successfully.`);
      setBackingUp(false);
    }, 1500);
  };

  const handleRestore = (backupName) => {
    if (!confirm(`Are you sure you want to restore the database to the checkpoint "${backupName}"? This will overwrite current changes.`)) {
      return;
    }
    setRestoring(true);
    setSuccess('');
    
    setTimeout(() => {
      const now = new Date();
      const newLog = {
        id: Date.now(),
        timestamp: now.toISOString().replace('T', ' ').substring(0, 19),
        user: 'superadmin',
        event: 'DATABASE_RESTORE',
        desc: `System database restored from checkpoint: ${backupName}`,
        severity: 'DANGER'
      };
      setLogs([newLog, ...logs]);
      setSuccess(`System successfully restored to checkpoint "${backupName}". All services recycled.`);
      setRestoring(false);
    }, 2000);
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.headerTitle}>Security & Database Backups</h1>
      <p style={styles.headerSubtitle}>Trigger checkpoints, restore system registers, and monitor real-time security audit trails</p>

      {success && <div style={styles.success}>{success}</div>}

      <div style={styles.grid}>
        {/* Backup management */}
        <div style={styles.columnLeft}>
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>Database Checkpoints</h3>
              <button 
                style={styles.btnPrimary} 
                onClick={handleCreateBackup}
                disabled={backingUp || restoring}
              >
                {backingUp ? 'Compiling Backup...' : 'Create Backup'}
              </button>
            </div>
            <p style={styles.cardDesc}>Store database images locally. Use checkpoints to revert configuration errors.</p>
            
            <div style={styles.backupList}>
              {backups.map((b) => (
                <div key={b.name} style={styles.backupItem}>
                  <div style={styles.backupMeta}>
                    <strong style={styles.backupName}>{b.name}</strong>
                    <span style={styles.backupSub}>{b.size} | Created on {b.date}</span>
                  </div>
                  <button 
                    style={styles.btnRestore} 
                    onClick={() => handleRestore(b.name)}
                    disabled={backingUp || restoring}
                  >
                    Restore
                  </button>
                </div>
              ))}
            </div>
          </div>
          
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>System Configuration Metrics</h3>
            <div style={styles.configList}>
              <div style={styles.configRow}>
                <span>Spring Boot Environment</span>
                <span style={styles.configVal}>PROD (H2 Hybrid)</span>
              </div>
              <div style={styles.configRow}>
                <span>JWT Token Lifetime</span>
                <span style={styles.configVal}>24 Hours</span>
              </div>
              <div style={styles.configRow}>
                <span>CORS Allowed Origins</span>
                <span style={styles.configValCode}>http://localhost:5173</span>
              </div>
              <div style={styles.configRow}>
                <span>Database Path</span>
                <span style={styles.configValCode}>./data/smarthostel</span>
              </div>
            </div>
          </div>
        </div>

        {/* Audit Logs Terminal */}
        <div style={styles.columnRight}>
          <div style={styles.cardTerminal}>
            <div style={styles.terminalHeader}>
              <div style={styles.terminalDots}>
                <span style={styles.dotRed}></span>
                <span style={styles.dotYellow}></span>
                <span style={styles.dotGreen}></span>
              </div>
              <span style={styles.terminalTitle}>system_security_audit.log</span>
            </div>
            
            <div style={styles.terminalBody}>
              {restoring && (
                <div style={styles.terminalRestoring}>
                  Restoring database files, closing active pools...
                </div>
              )}
              {logs.map((l) => (
                <div key={l.id} style={styles.logRow}>
                  <span style={styles.logTime}>[{l.timestamp}]</span>
                  <span style={{
                    ...styles.logSeverity,
                    ...(l.severity === 'WARN' ? styles.sevWarn : l.severity === 'DANGER' ? styles.sevDanger : styles.sevInfo)
                  }}>
                    [{l.severity}]
                  </span>
                  <span style={styles.logUser}>[{l.user}]</span>
                  <span style={styles.logEvent}>({l.event})</span>
                  <span style={styles.logDesc}>{l.desc}</span>
                </div>
              ))}
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
  
  grid: { display: 'grid', gridTemplateColumns: '1.1fr 1.5fr', gap: '2rem', alignItems: 'start' },
  columnLeft: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  columnRight: { display: 'flex', flexDirection: 'column' },
  
  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.5rem' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' },
  cardTitle: { margin: 0, fontSize: '1.15rem', fontWeight: 600 },
  cardDesc: { margin: '0 0 1.5rem 0', fontSize: '0.85rem', color: 'var(--text-muted)' },
  
  btnPrimary: { background: 'var(--accent)', color: '#000', border: 'none', padding: '0.5rem 1rem', borderRadius: 'var(--radius)', fontWeight: 600, fontSize: '0.875rem' },
  success: { background: 'rgba(34, 197, 94, 0.12)', border: '1px solid var(--accent)', color: '#a7f3d0', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1.5rem', fontSize: '0.875rem' },
  
  backupList: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  backupItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.75rem 1rem' },
  backupMeta: { display: 'flex', flexDirection: 'column', gap: '0.15rem' },
  backupName: { fontSize: '0.85rem', fontWeight: 600, fontFamily: 'var(--font-mono)' },
  backupSub: { fontSize: '0.75rem', color: 'var(--text-muted)' },
  btnRestore: { background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', padding: '0.3rem 0.6rem', borderRadius: 6, fontSize: '0.8rem', fontWeight: 600 },

  configList: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  configRow: { display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' },
  configVal: { fontWeight: 600 },
  configValCode: { fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--accent)' },

  // Terminal styling
  cardTerminal: { background: '#0b0b0d', border: '1px solid #1a1a22', borderRadius: 'var(--radius)', overflow: 'hidden', minHeight: '450px', display: 'flex', flexDirection: 'column' },
  terminalHeader: { background: '#131318', borderBottom: '1px solid #1a1a22', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  terminalDots: { display: 'flex', gap: '0.35rem', position: 'absolute', left: '1rem' },
  dotRed: { width: '8px', height: '8px', borderRadius: '50%', background: 'var(--danger)' },
  dotYellow: { width: '8px', height: '8px', borderRadius: '50%', background: 'var(--warning)' },
  dotGreen: { width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)' },
  terminalTitle: { fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' },
  
  terminalBody: { padding: '1rem', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#c5c5d2', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 },
  terminalRestoring: { color: 'var(--warning)', animation: 'pulse 1.5s infinite', borderBottom: '1px dashed var(--warning)', paddingBottom: '0.5rem', marginBottom: '0.5rem' },
  logRow: { lineHeight: '1.4', display: 'flex', flexWrap: 'wrap', gap: '0.35rem' },
  logTime: { color: '#68687a' },
  logSeverity: { fontWeight: 'bold' },
  sevInfo: { color: 'var(--accent)' },
  sevWarn: { color: 'var(--warning)' },
  sevDanger: { color: 'var(--danger)' },
  logUser: { color: '#818cf8' },
  logEvent: { color: '#c084fc' },
  logDesc: { color: '#e2e8f0', flex: '1 1 100%' },
};
