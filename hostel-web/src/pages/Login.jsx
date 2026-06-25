import { useState } from 'react';
import { api } from '../api/client';
import { User, Lock, Mail, Phone, BookOpen, GraduationCap, ArrowRight, ShieldAlert } from 'lucide-react';

export default function Login({ onLoginSuccess }) {
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Login fields
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // Registration fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regDept, setRegDept] = useState('');
  const [regYear, setRegYear] = useState(1);
  const [regParentName, setRegParentName] = useState('');
  const [regParentPhone, setRegParentPhone] = useState('');
  const [regParentEmail, setRegParentEmail] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await api.auth.login({ username, password });
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res));
      onLoginSuccess(res);
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPhone || !regParentPhone) {
      setError('Please fill in all required fields');
      return;
    }

    if (regEmail.trim().toLowerCase() === regParentEmail.trim().toLowerCase()) {
      setError('Student email and parent/guardian email cannot be the same.');
      return;
    }

    if (regPhone.trim() === regParentPhone.trim()) {
      setError('Student phone number and parent/guardian phone number cannot be the same.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      await api.students.create({
        name: regName,
        email: regEmail,
        phone: regPhone,
        department: regDept,
        year: Number(regYear),
        parentName: regParentName,
        parentPhone: regParentPhone,
        parentEmail: regParentEmail,
        status: 'PENDING_ADMIN'
      });
      setSuccessMsg('Your application was submitted successfully! It has been sent to the Superintendent for review.');
      setIsRegistering(false);
      // Reset form
      setRegName('');
      setRegEmail('');
      setRegPhone('');
      setRegDept('');
      setRegYear(1);
      setRegParentName('');
      setRegParentPhone('');
      setRegParentEmail('');
    } catch (err) {
      setError(err.message || 'Application submission failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={{ ...styles.card, maxWidth: isRegistering ? 680 : 450 }} className="glass-card">
        <div style={styles.logoContainer}>
          <div style={styles.logo}>HostelSync</div>
          <span style={styles.tagline}>Dormitory Management Portal</span>
        </div>
        
        {isRegistering ? (
          <>
            <h2 style={styles.title}>Apply for Admission</h2>
            <p style={styles.subtitle}>Fill in your details below to submit your hostel admission application</p>
          </>
        ) : (
          <>
            <h2 style={styles.title}>Welcome Back</h2>
            <p style={styles.subtitle}>Sign in to access your digital pass, dining info, and tickets</p>
          </>
        )}

        {error && <div style={styles.error}><ShieldAlert size={16} />{error}</div>}
        {successMsg && <div style={styles.success}>{successMsg}</div>}

        {!isRegistering ? (
          <form onSubmit={handleLoginSubmit} style={styles.form}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Username or Email</label>
              <div style={styles.inputWrapper}>
                <User size={18} style={styles.inputIcon} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. superadmin or student@example.com"
                  style={styles.input}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Password</label>
              <div style={styles.inputWrapper}>
                <Lock size={18} style={styles.inputIcon} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={styles.input}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <button type="submit" style={styles.button} disabled={loading} className="glow-hover">
              {loading ? 'Signing in...' : 'Sign In'}
              <ArrowRight size={16} style={{ marginLeft: '0.5rem' }} />
            </button>
            
            <div style={styles.toggleText}>
              New Resident?{' '}
              <button 
                type="button" 
                onClick={() => { setIsRegistering(true); setError(''); setSuccessMsg(''); }} 
                style={styles.linkButton}
              >
                Apply for Admission
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} style={styles.form}>
            <div style={styles.sectionHeader}>1. Personal & Academic Details</div>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Full Name *</label>
                <div style={styles.inputWrapper}>
                  <User size={16} style={styles.inputIcon} />
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="John Doe"
                    style={styles.input}
                    disabled={loading}
                    required
                  />
                </div>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Email Address *</label>
                <div style={styles.inputWrapper}>
                  <Mail size={16} style={styles.inputIcon} />
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="john@example.com"
                    style={styles.input}
                    disabled={loading}
                    required
                  />
                </div>
              </div>
            </div>

            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Student Phone *</label>
                <div style={styles.inputWrapper}>
                  <Phone size={16} style={styles.inputIcon} />
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="+1234567890"
                    style={styles.input}
                    disabled={loading}
                    required
                  />
                </div>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Department / Major</label>
                <div style={styles.inputWrapper}>
                  <BookOpen size={16} style={styles.inputIcon} />
                  <input
                    type="text"
                    value={regDept}
                    onChange={(e) => setRegDept(e.target.value)}
                    placeholder="Computer Science"
                    style={styles.input}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Year of Study</label>
                <div style={styles.inputWrapper}>
                  <GraduationCap size={16} style={styles.inputIcon} />
                  <select
                    value={regYear}
                    onChange={(e) => setRegYear(Number(e.target.value))}
                    style={styles.selectInput}
                    disabled={loading}
                  >
                    <option value={1}>1st Year</option>
                    <option value={2}>2nd Year</option>
                    <option value={3}>3rd Year</option>
                    <option value={4}>4th Year</option>
                  </select>
                </div>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Parent/Guardian Name</label>
                <div style={styles.inputWrapper}>
                  <User size={16} style={styles.inputIcon} />
                  <input
                    type="text"
                    value={regParentName}
                    onChange={(e) => setRegParentName(e.target.value)}
                    placeholder="Robert Doe"
                    style={styles.input}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            <div style={styles.sectionHeader}>2. Emergency Contact & Verification Warning</div>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Parent Phone *</label>
                <div style={styles.inputWrapper}>
                  <Phone size={16} style={styles.inputIcon} />
                  <input
                    type="tel"
                    value={regParentPhone}
                    onChange={(e) => setRegParentPhone(e.target.value)}
                    placeholder="Verification target"
                    style={styles.input}
                    disabled={loading}
                    required
                  />
                </div>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Parent Email</label>
                <div style={styles.inputWrapper}>
                  <Mail size={16} style={styles.inputIcon} />
                  <input
                    type="email"
                    value={regParentEmail}
                    onChange={(e) => setRegParentEmail(e.target.value)}
                    placeholder="parent@example.com"
                    style={styles.input}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button 
                type="button" 
                onClick={() => { setIsRegistering(false); setError(''); }} 
                style={{ ...styles.button, background: 'rgba(255,255,255,0.05)', color: '#e2e8f0', border: '1px solid var(--border)' }}
                disabled={loading}
              >
                Back to Login
              </button>
              <button type="submit" style={styles.button} disabled={loading} className="glow-hover">
                {loading ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </form>
        )}

        <div style={styles.divider} />

        <div style={styles.guide}>
          <div style={styles.guideTitle}>Quick System Credentials</div>
          <div style={styles.guideGrid}>
            <div style={styles.guideCol}>
              <strong>Super Admin Portal</strong>
              <span>User: <code>superadmin</code> / Pass: <code>superadmin</code></span>
            </div>
            <div style={styles.guideCol}>
              <strong>Superintendent</strong>
              <span>User: <code>admin</code> / Pass: <code>admin</code></span>
            </div>
          </div>
          <div style={{ marginTop: '0.5rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            * Resident student accounts are active after Superintendent review.
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'radial-gradient(circle at 10% 10%, #030611 0%, #080c1e 50%, #010206 100%)',
    padding: '2rem',
    fontFamily: 'var(--font-sans)',
  },
  card: {
    padding: '3rem 2.5rem',
    width: '100%',
    transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
    background: 'rgba(10, 15, 38, 0.7)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(59, 130, 246, 0.1)',
    borderRadius: '16px',
    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
  },
  logoContainer: {
    textAlign: 'center',
    marginBottom: '2rem',
  },
  logo: {
    fontSize: '2.25rem',
    fontWeight: 900,
    color: '#ffffff',
    letterSpacing: '-1px',
    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    textShadow: '0 0 30px rgba(59, 130, 246, 0.3)',
    display: 'inline-block',
  },
  tagline: {
    display: 'block',
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    marginTop: '0.25rem',
    textTransform: 'uppercase',
    letterSpacing: '2px',
    fontWeight: 600,
  },
  title: {
    fontSize: '1.35rem',
    fontWeight: 700,
    textAlign: 'center',
    color: '#ffffff',
    margin: '0 0 0.5rem 0',
  },
  subtitle: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    textAlign: 'center',
    margin: '0 0 2rem 0',
    lineHeight: '1.5',
  },
  error: {
    background: 'rgba(239, 68, 68, 0.12)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#fca5a5',
    borderRadius: '8px',
    padding: '0.75rem 1rem',
    fontSize: '0.85rem',
    marginBottom: '1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  success: {
    background: 'rgba(16, 185, 129, 0.12)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    color: '#a7f3d0',
    borderRadius: '8px',
    padding: '0.75rem 1rem',
    fontSize: '0.85rem',
    marginBottom: '1.5rem',
  },
  sectionHeader: {
    fontSize: '0.8rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    color: 'var(--accent)',
    letterSpacing: '1px',
    borderBottom: '1px dashed var(--border)',
    paddingBottom: '0.5rem',
    marginTop: '0.5rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  formRow: {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.45rem',
    flex: '1 1 200px',
  },
  label: {
    fontSize: '0.8rem',
    fontWeight: 600,
    color: '#94a3b8',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    width: '100%',
  },
  inputIcon: {
    position: 'absolute',
    left: '12px',
    color: '#64748b',
    pointerEvents: 'none',
  },
  input: {
    background: 'rgba(3, 6, 17, 0.5)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    color: '#ffffff',
    padding: '0.75rem 1rem 0.75rem 2.5rem',
    fontSize: '0.9rem',
    outline: 'none',
    width: '100%',
    transition: 'all 0.2s ease',
  },
  selectInput: {
    background: 'rgba(3, 6, 17, 0.5)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    color: '#ffffff',
    padding: '0.75rem 1rem 0.75rem 2.5rem',
    fontSize: '0.9rem',
    outline: 'none',
    width: '100%',
    appearance: 'none',
    WebkitAppearance: 'none',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
  },
  button: {
    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '0.8rem',
    fontSize: '0.95rem',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(59, 130, 246, 0.3)',
  },
  toggleText: {
    textAlign: 'center',
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    marginTop: '0.5rem',
  },
  linkButton: {
    background: 'none',
    border: 'none',
    color: 'var(--accent)',
    fontWeight: 700,
    cursor: 'pointer',
    padding: 0,
    marginLeft: '0.25rem',
    textDecoration: 'none',
    transition: 'color 0.2s',
  },
  divider: {
    height: '1px',
    background: 'linear-gradient(90deg, transparent, var(--border), transparent)',
    margin: '2rem 0 1.5rem 0',
  },
  guide: {
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '8px',
    padding: '1.25rem',
    fontSize: '0.75rem',
    lineHeight: '1.6',
  },
  guideTitle: {
    color: '#ffffff',
    fontWeight: 700,
    fontSize: '0.8rem',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '0.75rem',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    paddingBottom: '0.25rem',
  },
  guideGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '0.75rem',
  },
  guideCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.15rem',
    color: 'var(--text-muted)',
  },
};
