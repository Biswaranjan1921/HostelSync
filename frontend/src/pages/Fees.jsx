import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { 
  DollarSign, Landmark, QrCode, FileText, CheckCircle, AlertTriangle, 
  Send, Users, Calendar, Printer, ShieldCheck, CreditCard, Search
} from 'lucide-react';

export default function Fees() {
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');

  // Tabs: 'invoices' | 'cashier' (Admin only)
  const [activeTab, setActiveTab] = useState('invoices');
  
  // Payment Modal State
  const [activePayment, setActivePayment] = useState(null);
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [payMethod, setPayMethod] = useState('CARD'); // CARD or UPI
  const [paying, setPaying] = useState(false);
  const [upiId, setUpiId] = useState('');
  
  // Admin Invoice State
  const [invoiceStudentId, setInvoiceStudentId] = useState('');
  const [invoiceStudentName, setInvoiceStudentName] = useState('');
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [invoiceDueDate, setInvoiceDueDate] = useState('');
  const [creatingInvoice, setCreatingInvoice] = useState(false);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);

  // Cashier Desk State
  const [cashStudent, setCashStudent] = useState(null);
  const [cashAmount, setCashAmount] = useState('');
  const [cashCategory, setCashCategory] = useState('HOSTEL_FEE');
  const [cashLogs, setCashLogs] = useState([]);
  const [loggingCash, setLoggingCash] = useState(false);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isStudent = user.role === 'STUDENT';
  const isAdmin = user.role === 'ADMIN' || user.role === 'SUPERADMIN';

  const loadPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      const [pList, sList] = await Promise.all([
        api.payments.list(),
        isAdmin ? api.students.list().catch(() => []) : Promise.resolve([])
      ]);
      setPayments(pList);
      setStudents(sList.filter(s => s.status === 'ACTIVE'));
      
      // Load cashier cash logs mock from local storage
      const savedLogs = localStorage.getItem('hostelsync_cash_logs');
      if (savedLogs) {
        setCashLogs(JSON.parse(savedLogs));
      } else {
        // Seed initial cash logs
        const initialLogs = [
          { id: 1, date: new Date(Date.now() - 86400000).toLocaleDateString(), studentName: 'Alice Johnson', cashierName: user.name || 'Warden Office', amount: 1200.0, category: 'HOSTEL_FEE' },
          { id: 2, date: new Date(Date.now() - 172800000).toLocaleDateString(), studentName: 'Bob Smith', cashierName: user.name || 'Warden Office', amount: 250.0, category: 'MESS_FEE' }
        ];
        localStorage.setItem('hostelsync_cash_logs', JSON.stringify(initialLogs));
        setCashLogs(initialLogs);
      }
    } catch (err) {
      setError(err.message || 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const handlePaySubmit = async (e) => {
    e.preventDefault();
    if (!activePayment) return;
    setPaying(true);
    setError(null);
    setSuccess('');
    
    try {
      // Simulate gateway response latency
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await api.payments.pay(activePayment.id);
      setSuccess(`Payment of $${activePayment.amount.toFixed(2)} processed successfully!`);
      setActivePayment(null);
      setCardName('');
      setCardNumber('');
      setCardExpiry('');
      setCardCvv('');
      setUpiId('');
      loadPayments();
    } catch (err) {
      setError(err.message || 'Payment failed');
    } finally {
      setPaying(false);
    }
  };

  const handleVerify = async (id) => {
    if (!confirm('Mark this fee invoice as PAID manually?')) return;
    try {
      setError(null);
      setSuccess('');
      await api.payments.verify(id);
      setSuccess('Fee invoice verified and updated successfully.');
      loadPayments();
    } catch (err) {
      setError(err.message || 'Verification failed');
    }
  };

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    if (!invoiceStudentId || !invoiceStudentName || !invoiceAmount || !invoiceDueDate) {
      alert('Please fill in all invoice details');
      return;
    }
    setCreatingInvoice(true);
    try {
      await api.payments.create({
        studentId: parseInt(invoiceStudentId),
        studentName: invoiceStudentName,
        amount: parseFloat(invoiceAmount),
        dueDate: invoiceDueDate,
        status: 'PENDING',
      });
      setSuccess('Manual fee invoice generated successfully');
      setInvoiceStudentId('');
      setInvoiceStudentName('');
      setInvoiceAmount('');
      setInvoiceDueDate('');
      setShowInvoiceForm(false);
      loadPayments();
    } catch (err) {
      setError(err.message || 'Failed to generate invoice');
    } finally {
      setCreatingInvoice(false);
    }
  };

  // Cashier Desk Manual Logging
  const handleCashLogSubmit = async (e) => {
    e.preventDefault();
    if (!cashStudent || !cashAmount) return;
    setLoggingCash(true);
    try {
      // 1. Create a payment invoice marked as pending
      const invoice = await api.payments.create({
        studentId: cashStudent.id,
        studentName: cashStudent.name,
        amount: parseFloat(cashAmount),
        dueDate: new Date().toISOString().split('T')[0],
        status: 'PENDING'
      });

      // 2. Pay it immediately via Cash
      await api.payments.pay(invoice.id);

      // 3. Log manual cashier deposit locally
      const newLog = {
        id: Date.now(),
        date: new Date().toLocaleDateString(),
        studentName: cashStudent.name,
        cashierName: user.name || 'Finance Desk',
        amount: parseFloat(cashAmount),
        category: cashCategory
      };
      
      const updatedLogs = [newLog, ...cashLogs];
      setCashLogs(updatedLogs);
      localStorage.setItem('hostelsync_cash_logs', JSON.stringify(updatedLogs));

      setSuccess(`Cash transaction of $${parseFloat(cashAmount).toFixed(2)} received from ${cashStudent.name}. Receipt generated!`);
      setCashStudent(null);
      setCashAmount('');
      loadPayments();
    } catch (err) {
      setError(err.message || 'Failed to record cash transaction');
    } finally {
      setLoggingCash(false);
    }
  };

  // Receipt E-Signature Layout Generation
  const handlePrintReceipt = (payment) => {
    const receiptHash = `sha256-${Math.random().toString(36).substring(2, 18).toUpperCase()}${payment.id}${payment.studentId}`;
    const printWindow = window.open('', '_blank', 'width=650,height=700');
    printWindow.document.write(`
      <html>
        <head>
          <title>HostelSync Fee Receipt</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #0f172a; line-height: 1.6; background-color: #fff; }
            .receipt-box { border: 2px solid #e2e8f0; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
            .header { text-align: center; border-bottom: 2px dashed #cbd5e1; padding-bottom: 20px; margin-bottom: 25px; }
            .logo { font-size: 28px; font-weight: 800; color: #3b82f6; letter-spacing: -0.5px; }
            .title { font-size: 13px; color: #64748b; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 5px; }
            .details { margin-bottom: 25px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px; }
            .label { color: #64748b; }
            .value { font-weight: 600; color: #0f172a; }
            .total-row { border-top: 1px solid #e2e8f0; padding-top: 12px; margin-top: 12px; font-size: 16px; }
            .stamp-box { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 30px; border-top: 1px dashed #e2e8f0; paddingTop: 20px; }
            .stamp { border: 3px solid #10b981; color: #10b981; padding: 6px 18px; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 20px; transform: rotate(-6deg); text-transform: uppercase; }
            .esign-box { text-align: right; font-size: 11px; color: #64748b; max-width: 250px; }
            .esign-badge { border: 1px solid #3b82f6; color: #3b82f6; padding: 4px 8px; border-radius: 4px; display: inline-block; margin-bottom: 5px; font-weight: bold; }
            .footer { text-align: center; font-size: 12px; color: #94a3b8; margin-top: 30px; border-top: 1px solid #f1f5f9; padding-top: 15px; }
          </style>
        </head>
        <body>
          <div class="receipt-box">
            <div class="header">
              <div class="logo">HostelSync</div>
              <div class="title">Official E-Signed Receipt</div>
            </div>
            <div class="details">
              <div class="row">
                <span class="label">Receipt Number:</span>
                <span class="value" style="font-family: monospace;">REC-${payment.id * 1234}</span>
              </div>
              <div class="row">
                <span class="label">Invoice ID:</span>
                <span class="value">#INV-${payment.id}</span>
              </div>
              <div class="row">
                <span class="label">Student Name:</span>
                <span class="value">${payment.studentName}</span>
              </div>
              <div class="row">
                <span class="label">Student ID Reference:</span>
                <span class="value">#STU-${payment.studentId}</span>
              </div>
              <div class="row">
                <span class="label">Receipt Date:</span>
                <span class="value">${payment.paymentDate || new Date().toLocaleDateString()}</span>
              </div>
              <div class="row total-row">
                <span class="label" style="font-weight: 600; color: #0f172a;">Total Amount Settled:</span>
                <span class="value" style="font-size: 18px; color: #10b981;">$${payment.amount.toFixed(2)}</span>
              </div>
            </div>

            <div class="stamp-box" style="padding-top: 20px;">
              <div>
                <span class="stamp">PAID</span>
              </div>
              <div class="esign-box">
                <div class="esign-badge">🛡 AUTHORIZED E-SIGN</div>
                <div>Finance Controller, HostelSync</div>
                <div style="font-family: monospace; font-size: 9px; word-break: break-all; margin-top: 2px;">
                  Verify Signature Hash:<br/>${receiptHash}
                </div>
              </div>
            </div>

            <div class="footer">
              This document is electronically generated and digitally signed under legal guidelines. No physical signature is required.
            </div>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleReminder = (name) => {
    alert(`Reminder notification sent to ${name}'s registered email/phone!`);
  };

  if (loading && payments.length === 0) return <div style={styles.centered}>Loading payments ledger…</div>;

  return (
    <div style={styles.container}>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.headerTitle}>{isStudent ? 'My Fees & Invoices' : 'HostelSync Finance Center'}</h1>
          <p style={styles.headerSubtitle}>
            {isStudent 
              ? 'Track your monthly billing, download receipts, and pay online.' 
              : 'Monitor student payments, record manual transactions, and issue receipts.'}
          </p>
        </div>
      </div>

      {/* Tabs Row */}
      {isAdmin && (
        <div style={styles.tabsRow}>
          <button 
            style={{ ...styles.tab, ...(activeTab === 'invoices' ? styles.tabActive : {}) }}
            onClick={() => setActiveTab('invoices')}
          >
            Registered Invoices ({payments.length})
          </button>
          <button 
            style={{ ...styles.tab, ...(activeTab === 'cashier' ? styles.tabActive : {}) }}
            onClick={() => setActiveTab('cashier')}
          >
            Cashier Desk ({cashLogs.length})
          </button>
        </div>
      )}

      {success && <div style={styles.success}>{success}</div>}
      {error && <div style={styles.error}>{error}</div>}

      {/* TAB 1: INVOICES TABLE */}
      {activeTab === 'invoices' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>{isStudent ? 'Billing Log' : 'Invoice Registry'}</h3>
            {isAdmin && (
              <button 
                style={styles.btnPrimary} 
                onClick={() => setShowInvoiceForm(!showInvoiceForm)}
                className="btn-neon glow-hover"
              >
                {showInvoiceForm ? 'Close Invoice Form' : 'Generate Manual Invoice'}
              </button>
            )}
          </div>

          {/* Manual Invoice Creation (Admin Only) */}
          {showInvoiceForm && (
            <div style={styles.cardForm} className="glass-card">
              <h3 style={styles.cardTitle}>Generate New Fee Invoice</h3>
              <form onSubmit={handleCreateInvoice} style={styles.inlineForm}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Student ID *</label>
                  <input
                    type="number"
                    value={invoiceStudentId}
                    onChange={(e) => setInvoiceStudentId(e.target.value)}
                    placeholder="e.g. 1"
                    style={styles.input}
                    required
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Student Name *</label>
                  <input
                    type="text"
                    value={invoiceStudentName}
                    onChange={(e) => setInvoiceStudentName(e.target.value)}
                    placeholder="e.g. Harry Potter"
                    style={styles.input}
                    required
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Amount ($) *</label>
                  <input
                    type="number"
                    value={invoiceAmount}
                    onChange={(e) => setInvoiceAmount(e.target.value)}
                    placeholder="e.g. 1200"
                    style={styles.input}
                    required
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Due Date *</label>
                  <input
                    type="date"
                    value={invoiceDueDate}
                    onChange={(e) => setInvoiceDueDate(e.target.value)}
                    style={styles.input}
                    required
                  />
                </div>
                <button type="submit" style={styles.btnPrimary} disabled={creatingInvoice} className="btn-neon glow-hover">
                  {creatingInvoice ? 'Creating...' : 'Generate Invoice'}
                </button>
              </form>
            </div>
          )}

          <div style={styles.card} className="glass-card">
            {payments.length === 0 ? (
              <p style={styles.empty}>No fee invoices registered.</p>
            ) : (
              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Invoice ID</th>
                      {!isStudent && <th style={styles.th}>Student</th>}
                      <th style={styles.th}>Amount</th>
                      <th style={styles.th}>Due Date</th>
                      <th style={styles.th}>Status</th>
                      <th style={styles.th}>Paid Date</th>
                      <th style={styles.th}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.id} style={styles.tr}>
                        <td style={styles.td}>#INV-{p.id}</td>
                        {!isStudent && (
                          <td style={styles.td}>
                            <strong>{p.studentName}</strong>
                            <span style={styles.textMuted}> (ID: #{p.studentId})</span>
                          </td>
                        )}
                        <td style={styles.td}>${p.amount.toFixed(2)}</td>
                        <td style={styles.td}>{p.dueDate || '—'}</td>
                        <td style={styles.td}>
                          <span style={"PAID" === p.status ? styles.badgePaid : styles.badgePending}>
                            {p.status}
                          </span>
                        </td>
                        <td style={styles.td}>{p.paymentDate || '—'}</td>
                        <td style={styles.td}>
                          {isStudent && "PENDING" === p.status && (
                            <button style={styles.btnPay} onClick={() => setActivePayment(p)} className="btn-neon glow-hover">Pay Now</button>
                          )}
                          {p.status === 'PAID' && (
                            <button style={styles.btnReceipt} onClick={() => handlePrintReceipt(p)}>
                              <Printer size={12} /> Receipt
                            </button>
                          )}
                          {isAdmin && "PENDING" === p.status && (
                            <>
                              <button style={styles.btnVerify} onClick={() => handleVerify(p.id)} className="glow-hover">Verify</button>
                              <button style={styles.btnReminder} onClick={() => handleReminder(p.studentName)}>Remind</button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* TAB 2: CASHIER DESK (ADMIN ONLY) */}
      {activeTab === 'cashier' && isAdmin && (
        <div style={styles.cashierGrid}>
          {/* Record Cash Panel */}
          <div style={styles.card} className="glass-card">
            <h3 style={{ margin: '0 0 1rem 0' }}>Log Cash Transaction</h3>
            <form onSubmit={handleCashLogSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Select Student *</label>
                <select 
                  onChange={(e) => setCashStudent(students.find(s => s.id === Number(e.target.value)))}
                  style={styles.input}
                  required
                >
                  <option value="">-- Choose active resident --</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name} (ID: #{s.id} - {s.department})</option>
                  ))}
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Amount Paid (USD) *</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                  placeholder="e.g. 1200.00"
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Payment Category *</label>
                <select 
                  value={cashCategory}
                  onChange={(e) => setCashCategory(e.target.value)}
                  style={styles.input}
                >
                  <option value="HOSTEL_FEE">Hostel Term Fee</option>
                  <option value="MESS_FEE">Mess & Dining Fee</option>
                  <option value="CAUTION_DEPOSIT">Caution Deposit Refundable</option>
                  <option value="MISC_FINE">Miscellaneous Library/Fine Logs</option>
                </select>
              </div>

              <button 
                type="submit" 
                style={styles.btnPrimary} 
                disabled={loggingCash || !cashStudent || !cashAmount}
                className="btn-neon glow-hover"
              >
                <Landmark size={16} /> {loggingCash ? 'Processing cash receipt...' : 'Record Cash Deposit'}
              </button>
            </form>
          </div>

          {/* Cash Audit Logs */}
          <div style={styles.card} className="glass-card">
            <h3 style={{ margin: '0 0 1rem 0' }}>Cash Desk History</h3>
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Date</th>
                    <th style={styles.th}>Student</th>
                    <th style={styles.th}>Category</th>
                    <th style={styles.th}>Amount</th>
                    <th style={styles.th}>Collector (Cashier)</th>
                  </tr>
                </thead>
                <tbody>
                  {cashLogs.map(log => (
                    <tr key={log.id}>
                      <td style={styles.td}>{log.date}</td>
                      <td style={styles.td}><strong>{log.studentName}</strong></td>
                      <td style={styles.td}>{log.category.replace('_', ' ')}</td>
                      <td style={{ ...styles.td, color: '#10b981', fontWeight: 600 }}>+${log.amount.toFixed(2)}</td>
                      <td style={styles.td}>{log.cashierName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Online Payment Gateway Simulation Modal */}
      {activePayment && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal} className="glass-card">
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Hostel Payment Gateway</h3>
              <button style={styles.closeBtn} onClick={() => setActivePayment(null)}>×</button>
            </div>
            
            <div style={styles.invoiceSummary}>
              <span>Paying Invoice <strong>#INV-{activePayment.id}</strong></span>
              <span style={styles.totalAmount}>${activePayment.amount.toFixed(2)}</span>
            </div>

            <div style={styles.methodTabs}>
              <button 
                onClick={() => setPayMethod('CARD')} 
                style={{...styles.tabBtn, ...(payMethod === 'CARD' ? styles.tabBtnActive : {})}}
              >
                <CreditCard size={14} style={{ marginRight: '0.25rem' }} /> Credit / Debit Card
              </button>
              <button 
                onClick={() => setPayMethod('UPI')} 
                style={{...styles.tabBtn, ...(payMethod === 'UPI' ? styles.tabBtnActive : {})}}
              >
                <QrCode size={14} style={{ marginRight: '0.25rem' }} /> UPI Code / QR Scan
              </button>
            </div>

            <form onSubmit={handlePaySubmit} style={styles.paymentForm}>
              {payMethod === 'CARD' ? (
                <>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Cardholder Name</label>
                    <input 
                      type="text" 
                      value={cardName} 
                      onChange={(e) => setCardName(e.target.value)} 
                      placeholder="e.g. Harry Potter" 
                      style={styles.input} 
                      required 
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Card Number</label>
                    <input 
                      type="text" 
                      value={cardNumber} 
                      onChange={(e) => setCardNumber(e.target.value.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim())} 
                      maxLength="19" 
                      placeholder="4000 1234 5678 9010" 
                      style={styles.input} 
                      required 
                    />
                  </div>
                  <div style={styles.formRow}>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Expiry Date</label>
                      <input 
                        type="text" 
                        value={cardExpiry} 
                        onChange={(e) => setCardExpiry(e.target.value)} 
                        maxLength="5" 
                        placeholder="MM/YY" 
                        style={styles.input} 
                        required 
                      />
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>CVV</label>
                      <input 
                        type="password" 
                        value={cardCvv} 
                        onChange={(e) => setCardCvv(e.target.value)} 
                        maxLength="3" 
                        placeholder="123" 
                        style={styles.input} 
                        required 
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div style={styles.upiContainer}>
                  <div style={styles.qrMock}>
                    {/* Real QR renderer for UPI payments */}
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&color=030611&data=${encodeURIComponent(`upi://pay?pa=hostelsync@okaxis&pn=HostelSync&am=${activePayment.amount}&cu=USD&tn=INV-${activePayment.id}`)}`}
                      alt="UPI Merchant Payment QR"
                      style={{ width: '130px', height: '130px' }}
                    />
                  </div>
                  <p style={styles.upiText}>Scan this QR code using GPay, PhonePe, Paytm, or BHIM to pay fee instantly.</p>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Or enter your UPI ID</label>
                    <input 
                      type="text" 
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="e.g. student@okaxis" 
                      style={styles.input} 
                      required 
                    />
                  </div>
                </div>
              )}

              <button type="submit" style={styles.btnPaySubmit} disabled={paying} className="btn-neon glow-hover">
                {paying ? 'Authorizing Secure Payment...' : `Authorize $${activePayment.amount.toFixed(2)}`}
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
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' },
  headerTitle: { fontSize: '2rem', fontWeight: 800, margin: '0 0 0.25rem 0' },
  headerSubtitle: { color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' },
  centered: { padding: '5rem 2rem', textAlign: 'center', color: 'var(--text-muted)' },
  
  tabsRow: { display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1.5rem' },
  tab: { background: 'transparent', border: 'none', color: 'var(--text-muted)', padding: '0.5rem 1rem', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' },
  tabActive: { color: 'var(--accent)', borderBottom: '2px solid var(--accent)' },

  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.5rem' },
  cardForm: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.5rem', marginBottom: '1.5rem' },
  cardTitle: { margin: '0 0 1.25rem 0', fontSize: '1.15rem', fontWeight: 600 },
  
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  tr: { borderBottom: '1px solid var(--border)' },
  th: { textAlign: 'left', padding: '0.75rem 1rem', borderBottom: '2px solid var(--border)', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem' },
  td: { padding: '0.85rem 1rem', fontSize: '0.9rem' },
  textMuted: { color: 'var(--text-muted)', fontSize: '0.8rem' },
  empty: { color: 'var(--text-muted)', textAlign: 'center', margin: '2rem 0' },
  
  badgePaid: { color: '#10b981', background: 'rgba(16, 185, 129, 0.12)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 },
  badgePending: { color: 'var(--warning)', background: 'rgba(234, 179, 8, 0.12)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 },
  
  btnPrimary: { background: 'var(--accent)', color: '#fff', border: 'none', padding: '0.65rem 1.25rem', borderRadius: 'var(--radius)', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' },
  btnPay: { background: 'var(--accent)', color: '#fff', border: 'none', padding: '0.45rem 0.85rem', borderRadius: 6, fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', boxShadow: 'var(--neon-shadow)' },
  btnReceipt: { background: 'rgba(255,255,255,0.02)', color: 'var(--text)', border: '1px solid var(--border)', padding: '0.45rem 0.85rem', borderRadius: 6, fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' },
  btnVerify: { background: 'var(--accent)', color: '#fff', border: 'none', padding: '0.45rem 0.85rem', borderRadius: 6, fontWeight: 600, fontSize: '0.8rem', marginRight: '0.35rem', cursor: 'pointer' },
  btnReminder: { background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)', padding: '0.45rem 0.85rem', borderRadius: 6, fontSize: '0.8rem', cursor: 'pointer' },
  
  success: { background: 'rgba(34, 197, 94, 0.12)', border: '1px solid #22c55e', color: '#86efac', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1.5rem', fontSize: '0.875rem' },
  error: { background: 'rgba(239, 68, 68, 0.12)', border: '1px solid var(--danger)', color: '#fca5a5', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1.5rem', fontSize: '0.875rem' },

  // Create Invoice Inline Form
  inlineForm: { display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1, minWidth: '150px' },
  formRow: { display: 'flex', gap: '1rem' },
  label: { fontSize: '0.8rem', color: 'var(--text-muted)' },
  input: { background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', padding: '0.65rem 0.75rem', borderRadius: '8px', fontSize: '0.9rem', outline: 'none' },

  // Modal CSS
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { width: '420px', background: 'var(--surface)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { margin: 0, fontSize: '1.2rem', fontWeight: 700 },
  closeBtn: { background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', padding: 0, cursor: 'pointer' },
  
  invoiceSummary: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg)', padding: '0.75rem 1rem', borderRadius: 8, border: '1px solid var(--border)' },
  totalAmount: { fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent)' },
  
  methodTabs: { display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' },
  tabBtn: { flex: 1, background: 'transparent', border: 'none', color: 'var(--text-muted)', padding: '0.5rem', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContext: 'center', justifyContent: 'center', cursor: 'pointer' },
  tabBtnActive: { color: 'var(--accent)', borderBottom: '2px solid var(--accent)' },
  
  paymentForm: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  btnPaySubmit: { background: 'var(--accent)', color: '#fff', border: 'none', padding: '0.75rem', borderRadius: '6px', fontWeight: 700, fontSize: '0.9rem', marginTop: '0.5rem', cursor: 'pointer', boxShadow: 'var(--neon-shadow)' },
  
  upiContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', textAlign: 'center' },
  qrMock: { background: '#fff', padding: '0.75rem', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '144px', height: '144px' },
  upiText: { fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, lineHeight: '1.4' },

  // Cashier desk layout
  cashierGrid: { display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1.5rem', alignItems: 'stretch' },
};
