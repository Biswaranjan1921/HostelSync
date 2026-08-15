import { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { 
  MessageSquare, HelpCircle, FileText, Send, CheckCircle2, 
  AlertCircle, ShieldCheck, CornerDownRight, Filter
} from 'lucide-react';

export default function Support() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');

  // Ticket creation form state
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Resolution form state (Super Admin / Warden only)
  const [activeTicket, setActiveTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [resolving, setResolving] = useState(false);
  
  // Filter state for Super Admin
  const [statusFilter, setStatusFilter] = useState('ALL');

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'SUPERADMIN' || user.role === 'ADMIN';

  const loadTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.support.list();
      setTickets(data);
    } catch (err) {
      setError(err.message || 'Failed to load support tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!subject || !message) return;
    setSubmitting(true);
    setError(null);
    setSuccess('');
    try {
      await api.support.create({ subject, message });
      setSuccess('Your support request has been registered. Support staff will review it shortly.');
      setSubject('');
      setMessage('');
      loadTickets();
    } catch (err) {
      setError(err.message || 'Failed to file support ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!activeTicket || !replyText) return;
    setResolving(true);
    try {
      await api.support.reply(activeTicket.id, replyText);
      setSuccess(`Ticket #${activeTicket.id} resolved successfully!`);
      setActiveTicket(null);
      setReplyText('');
      loadTickets();
    } catch (err) {
      alert(err.message || 'Failed to submit resolution');
    } finally {
      setResolving(false);
    }
  };

  const getFilteredTickets = () => {
    if (!isAdmin || statusFilter === 'ALL') return tickets;
    return tickets.filter(t => t.status === statusFilter);
  };

  if (loading && tickets.length === 0) return <div style={styles.centered}>Loading helpdesk tickets…</div>;

  const filtered = getFilteredTickets();

  return (
    <div style={styles.container}>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.headerTitle}>HostelSync Helpdesk</h1>
          <p style={styles.headerSubtitle}>
            {isAdmin 
              ? 'Resolve resident issues and reply to help desk inquiries.' 
              : 'Submit questions, report dormitory utility breakdowns, or request support.'}
          </p>
        </div>
      </div>

      {success && <div style={styles.success}>{success}</div>}
      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.layout}>
        {/* LEFT COLUMN: FILING FORM OR RESOLUTION PANEL */}
        {!isAdmin ? (
          /* Student Ticket Creation Form */
          <div style={styles.card} className="glass-card">
            <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <HelpCircle color="var(--accent)" /> Raise Support Ticket
            </h3>
            <form onSubmit={handleCreateTicket} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Subject / Inquiry Title *</label>
                <input 
                  type="text" 
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. WiFi not connecting on Floor 2"
                  style={styles.input}
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Detailed Description *</label>
                <textarea
                  rows={6}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your issue in details so our administration can help..."
                  style={styles.textarea}
                  required
                />
              </div>
              <button 
                type="submit" 
                style={styles.btnPrimary} 
                disabled={submitting || !subject || !message}
                className="btn-neon glow-hover"
              >
                <Send size={16} /> {submitting ? 'Filing Ticket...' : 'File Support Ticket'}
              </button>
            </form>
          </div>
        ) : (
          /* Admin Ticket Resolution Panel */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {activeTicket ? (
              <div style={styles.card} className="glass-card glow-hover">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0 }}>Resolve Ticket #{activeTicket.id}</h3>
                  <button style={styles.closeBtn} onClick={() => { setActiveTicket(null); setReplyText(''); }}>×</button>
                </div>

                <div style={styles.ticketDetailView}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Filed by <strong>{activeTicket.username}</strong> ({activeTicket.userRole})
                  </div>
                  <h4 style={{ margin: '0.5rem 0', color: 'var(--text)' }}>{activeTicket.subject}</h4>
                  <div style={styles.messageBubble}>
                    {activeTicket.message}
                  </div>
                </div>

                <form onSubmit={handleResolveSubmit} style={styles.form}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Official Resolution Reply *</label>
                    <textarea
                      rows={5}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type the resolution or reply here..."
                      style={styles.textarea}
                      required
                    />
                  </div>
                  <button 
                    type="submit" 
                    style={styles.btnPrimary} 
                    disabled={resolving || !replyText}
                    className="btn-neon glow-hover"
                  >
                    <ShieldCheck size={16} /> {resolving ? 'Submitting...' : 'Submit Resolution'}
                  </button>
                </form>
              </div>
            ) : (
              <div style={{ ...styles.card, background: 'rgba(255,255,255,0.01)', textAlign: 'center', padding: '3rem 1.5rem' }} className="glass-card">
                <MessageSquare size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem auto' }} />
                <h3>No Ticket Selected</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Select an open support ticket from the list to view its details and write a resolution response.
                </p>
              </div>
            )}
          </div>
        )}

        {/* RIGHT COLUMN: TICKETS INBOX LIST */}
        <div style={styles.card} className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 style={{ margin: 0 }}>Tickets Inbox</h3>
            {isAdmin && (
              <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                <Filter size={14} color="var(--text-muted)" />
                <select 
                  value={statusFilter} 
                  onChange={(e) => setStatusFilter(e.target.value)} 
                  style={styles.filterSelect}
                >
                  <option value="ALL">All Tickets</option>
                  <option value="OPEN">Open Only</option>
                  <option value="RESOLVED">Resolved Only</option>
                </select>
              </div>
            )}
          </div>

          <div style={styles.ticketList}>
            {filtered.length === 0 ? (
              <p style={styles.empty}>No helpdesk tickets found.</p>
            ) : (
              filtered.map(ticket => (
                <div key={ticket.id} style={styles.ticketItem}>
                  <div style={styles.ticketHeader}>
                    <span style={styles.ticketId}>#TKT-{ticket.id}</span>
                    <span style={{
                      ...styles.statusBadge,
                      ...(ticket.status === 'RESOLVED' ? styles.statusResolved : styles.statusOpen)
                    }}>
                      {ticket.status}
                    </span>
                  </div>

                  <h4 style={styles.ticketSubject}>{ticket.subject}</h4>
                  <p style={styles.ticketText}>{ticket.message}</p>
                  
                  {ticket.reply && (
                    <div style={styles.replyBox}>
                      <CornerDownRight size={14} color="var(--accent)" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <strong>Admin Reply:</strong> {ticket.reply}
                      </div>
                    </div>
                  )}

                  <div style={styles.ticketFooter}>
                    <span>{new Date(ticket.createdAt).toLocaleString()}</span>
                    {isAdmin && ticket.status === 'OPEN' && (
                      <button 
                        style={styles.replyBtn} 
                        onClick={() => setActiveTicket(ticket)}
                      >
                        Reply / Resolve
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { paddingBottom: '3rem' },
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' },
  headerTitle: { fontSize: '2rem', fontWeight: 800, margin: '0 0 0.25rem 0' },
  headerSubtitle: { color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' },
  centered: { padding: '5rem 2rem', textAlign: 'center', color: 'var(--text-muted)' },
  
  layout: { display: 'grid', gridTemplateColumns: '1fr 1.25fr', gap: '1.5rem', alignItems: 'stretch' },
  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.5rem' },
  closeBtn: { background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' },
  
  form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  label: { fontSize: '0.85rem', color: 'var(--text-muted)' },
  input: { background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', padding: '0.65rem 0.75rem', borderRadius: '8px', fontSize: '0.9rem', outline: 'none' },
  textarea: { background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', padding: '0.65rem 0.75rem', borderRadius: '8px', fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit', resize: 'vertical' },
  filterSelect: { background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', padding: '0.35rem 0.5rem', borderRadius: '6px', fontSize: '0.85rem', outline: 'none' },
  
  btnPrimary: { background: 'var(--accent)', color: '#fff', border: 'none', padding: '0.65rem 1.25rem', borderRadius: '8px', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' },
  replyBtn: { background: 'var(--accent)', color: '#fff', border: 'none', padding: '0.35rem 0.65rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', boxShadow: 'var(--neon-shadow)' },

  success: { background: 'rgba(34, 197, 94, 0.12)', border: '1px solid #22c55e', color: '#86efac', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1.5rem', fontSize: '0.875rem' },
  error: { background: 'rgba(239, 68, 68, 0.12)', border: '1px solid var(--danger)', color: '#fca5a5', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1.5rem', fontSize: '0.875rem' },
  empty: { color: 'var(--text-muted)', textAlign: 'center', padding: '3rem 0' },

  ticketList: { display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '600px', overflowY: 'auto' },
  ticketItem: { background: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem' },
  ticketHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' },
  ticketId: { fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' },
  statusBadge: { fontSize: '0.65rem', fontWeight: 700, padding: '0.2rem 0.4rem', borderRadius: '4px' },
  statusOpen: { background: 'rgba(245, 158, 11, 0.12)', color: '#fbbf24' },
  statusResolved: { background: 'rgba(16, 185, 129, 0.12)', color: '#34d399' },
  ticketSubject: { margin: '0 0 0.35rem 0', fontSize: '1rem', fontWeight: 600, color: 'var(--text)' },
  ticketText: { margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5', wordBreak: 'break-word' },
  
  replyBox: { display: 'flex', gap: '0.5rem', background: 'rgba(59, 130, 246, 0.05)', border: '1px dashed var(--border)', borderRadius: '6px', padding: '0.75rem', fontSize: '0.85rem', marginTop: '0.75rem', color: 'var(--text)' },
  ticketFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '0.5rem' },

  ticketDetailView: { background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem', marginBottom: '1rem' },
  messageBubble: { background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '6px', fontSize: '0.85rem', color: 'var(--text-muted)', borderLeft: '3px solid var(--accent)', margin: '0.5rem 0 0 0' },
};
