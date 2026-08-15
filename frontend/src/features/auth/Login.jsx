import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../../api/client';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldAlert, User, Phone, BookOpen, GraduationCap } from 'lucide-react';

export default function Login({ onLoginSuccess }) {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('hosteller'); // 'hosteller', 'staff', 'superadmin'
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerType, setRegisterType] = useState('student'); // 'student' or 'admin'
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
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

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const errParam = params.get('error');
    if (errParam) {
      setError(errParam);
    }
  }, [location]);

  // Pre-fill demo hints when switching tabs
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setError('');
    setSuccessMsg('');
    if (tab === 'hosteller') {
      setUsername('student1');
      setPassword('student123');
    } else if (tab === 'staff') {
      setUsername('admin');
      setPassword('admin123');
    } else if (tab === 'superadmin') {
      setUsername('superadmin');
      setPassword('9861944502@SA');
    }
  };

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
      setError(err.message || 'Login failed. Please check your credentials.');
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
      if (registerType === 'student') {
        await api.students.create({
          name: regName,
          email: regEmail,
          phone: regPhone,
          department: regDept,
          year: Number(regYear),
          parentName: regParentName,
          parentPhone: regParentPhone,
          parentEmail: regParentEmail,
          status: 'PENDING_SUPERADMIN'
        });
      } else {
        await api.post('/auth/apply-staff', {
          name: regName,
          email: regEmail,
          phone: regPhone
        });
      }
      setSuccessMsg('Your application was submitted successfully! Sent to Super Admin for approval.');
      setIsRegistering(false);
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

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!username) {
      setError('Please enter your registered email/username');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { username });
      setOtpSent(true);
      setSuccessMsg('If an account exists, an OTP has been sent to your email.');
      setError('');
    } catch (err) {
      setError('Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtpSubmit = async (e) => {
    e.preventDefault();
    if (!otp || !newPassword) {
      setError('Please enter OTP and new password');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/verify-otp', { username, otp, newPassword });
      setSuccessMsg('Password reset successfully. You can now log in.');
      setIsForgotPassword(false);
      setOtpSent(false);
      setOtp('');
      setNewPassword('');
      setPassword('');
      setError('');
    } catch (err) {
      setError(err.response?.data || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.outerBg}>
      <div style={styles.mainContainer}>
        {/* LOGO HEADER */}
        <div style={styles.logoHeader}>
          <div style={styles.logoBadge}>
            <img 
              src="/logo.jpg" 
              alt="HostelSync Logo" 
              style={{ 
                width: '80px', 
                height: '80px', 
                borderRadius: '16px', 
                objectFit: 'cover', 
                boxShadow: '0 8px 24px rgba(34, 66, 72, 0.25)',
                border: '2px solid rgba(34, 66, 72, 0.3)' 
              }} 
            />
            <div style={styles.logoTitle}>HOSTEL SYNC</div>
          </div>
          
          <div style={styles.subDivider}>
            <span style={styles.line} />
            <span style={styles.subText}>DIGITAL SANCTUARY</span>
            <span style={styles.line} />
          </div>
        </div>

        {/* ROLE SELECTOR PILL TABS */}
        {!isRegistering && !isForgotPassword && (
          <div style={styles.pillTabsContainer}>
            <button 
              type="button"
              onClick={() => handleTabChange('hosteller')}
              style={{
                ...styles.pillTab,
                ...(activeTab === 'hosteller' ? styles.pillTabActive : {})
              }}
            >
              Hosteller
            </button>
            <button 
              type="button"
              onClick={() => handleTabChange('staff')}
              style={{
                ...styles.pillTab,
                ...(activeTab === 'staff' ? styles.pillTabActive : {})
              }}
            >
              Staff
            </button>
            <button 
              type="button"
              onClick={() => handleTabChange('superadmin')}
              style={{
                ...styles.pillTab,
                ...(activeTab === 'superadmin' ? styles.pillTabActive : {})
              }}
            >
              Superadmin
            </button>
          </div>
        )}

        {/* FLOATING WHITE CARD */}
        <div style={{ ...styles.card, maxWidth: isRegistering ? 560 : 420 }}>
          {isRegistering ? (
            <>
              <h2 style={styles.cardTitle}>Apply for Admission</h2>
              <p style={styles.cardSubtitle}>Fill in your details below to submit your hostel stay application</p>
            </>
          ) : isForgotPassword ? (
            <>
              <h2 style={styles.cardTitle}>Reset Password</h2>
              <p style={styles.cardSubtitle}>Enter your registered email to receive an OTP</p>
            </>
          ) : (
            <>
              <h2 style={styles.cardTitle}>Welcome back!</h2>
              <p style={styles.cardSubtitle}>Sign in to manage your stay.</p>
            </>
          )}

          {error && (
            <div style={styles.errorBanner}>
              <ShieldAlert size={16} color="#ef4444" style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div style={styles.successBanner}>
              <span>{successMsg}</span>
            </div>
          )}

          {/* FORGOT PASSWORD FORM */}
          {isForgotPassword ? (
            <form onSubmit={otpSent ? handleVerifyOtpSubmit : handleForgotPasswordSubmit} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.inputLabel}>Registered Email / Username</label>
                <div style={styles.inputWrapper}>
                  <Mail size={18} style={styles.inputIcon} />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="name@example.com"
                    style={styles.inputField}
                    disabled={loading || otpSent}
                    required
                  />
                </div>
              </div>

              {otpSent && (
                <>
                  <div style={styles.formGroup}>
                    <label style={styles.inputLabel}>Enter OTP Code</label>
                    <div style={styles.inputWrapper}>
                      <Lock size={18} style={styles.inputIcon} />
                      <input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder="123456"
                        style={styles.inputField}
                        disabled={loading}
                        required
                      />
                    </div>
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.inputLabel}>New Password</label>
                    <div style={styles.inputWrapper}>
                      <Lock size={18} style={styles.inputIcon} />
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        style={styles.inputField}
                        disabled={loading}
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              <button type="submit" style={styles.submitBtn} disabled={loading}>
                {loading ? 'Processing...' : (otpSent ? 'Reset Password' : 'Send OTP')}
              </button>

              <div style={styles.centerLink}>
                <button 
                  type="button" 
                  onClick={() => { setIsForgotPassword(false); setOtpSent(false); setError(''); setSuccessMsg(''); }} 
                  style={styles.textLink}
                >
                  Back to Login
                </button>
              </div>
            </form>
          ) : !isRegistering ? (
            /* MAIN SIGN IN FORM */
            <form onSubmit={handleLoginSubmit} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.inputLabel}>Email Address / Username</label>
                <div style={styles.inputWrapper}>
                  <Mail size={18} style={styles.inputIcon} />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="name@example.com"
                    style={styles.inputField}
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <div style={styles.labelRow}>
                  <label style={styles.inputLabel}>Password</label>
                  <button 
                    type="button" 
                    onClick={() => setIsForgotPassword(true)} 
                    style={styles.forgotLink}
                  >
                    Forgot?
                  </button>
                </div>
                <div style={styles.inputWrapper}>
                  <Lock size={18} style={styles.inputIcon} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    style={styles.inputField}
                    disabled={loading}
                    required
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)} 
                    style={styles.eyeBtn}
                  >
                    {showPassword ? <EyeOff size={18} color="#64748b" /> : <Eye size={18} color="#64748b" />}
                  </button>
                </div>
              </div>

              <button type="submit" style={styles.submitBtn} disabled={loading}>
                {loading ? 'Signing In...' : 'Sign In'} <ArrowRight size={16} style={{ marginLeft: '0.35rem' }} />
              </button>

              <div style={styles.orDivider}>
                <span>OR</span>
              </div>

              <a href="http://localhost:8085/oauth2/authorization/google" style={styles.googleBtn}>
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Continue with Google</span>
              </a>
            </form>
          ) : (
            /* ADMISSION REGISTRATION FORM */
            <form onSubmit={handleRegisterSubmit} style={styles.form}>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.inputLabel}>Full Name *</label>
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="John Doe"
                    style={styles.inputFieldPlain}
                    disabled={loading}
                    required
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.inputLabel}>Email Address *</label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="john@example.com"
                    style={styles.inputFieldPlain}
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.inputLabel}>Student Phone *</label>
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="+1234567890"
                    style={styles.inputFieldPlain}
                    disabled={loading}
                    required
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.inputLabel}>Department / Major</label>
                  <input
                    type="text"
                    value={regDept}
                    onChange={(e) => setRegDept(e.target.value)}
                    placeholder="Computer Science"
                    style={styles.inputFieldPlain}
                    disabled={loading}
                  />
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.inputLabel}>Year of Study</label>
                  <select
                    value={regYear}
                    onChange={(e) => setRegYear(Number(e.target.value))}
                    style={styles.inputFieldPlain}
                    disabled={loading}
                  >
                    <option value={1}>1st Year</option>
                    <option value={2}>2nd Year</option>
                    <option value={3}>3rd Year</option>
                    <option value={4}>4th Year</option>
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.inputLabel}>Parent Phone *</label>
                  <input
                    type="tel"
                    value={regParentPhone}
                    onChange={(e) => setRegParentPhone(e.target.value)}
                    placeholder="+9876543210"
                    style={styles.inputFieldPlain}
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button 
                  type="button" 
                  onClick={() => { setIsRegistering(false); setError(''); }} 
                  style={styles.backBtn}
                  disabled={loading}
                >
                  Back to Login
                </button>
                <button type="submit" style={styles.submitBtn} disabled={loading}>
                  {loading ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* BOTTOM FOOTER LINK */}
        {!isRegistering && !isForgotPassword && (
          <div style={styles.footerLinkRow}>
            <span>New here? </span>
            <button 
              type="button" 
              onClick={() => { setIsRegistering(true); setRegisterType('student'); setError(''); setSuccessMsg(''); }}
              style={styles.footerBtnLink}
            >
              Apply for a bed
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  outerBg: {
    minHeight: '100vh',
    background: '#eef3e9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem 1rem',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    position: 'relative',
    overflow: 'hidden',
  },
  mainContainer: {
    width: '100%',
    maxWidth: '520px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    zIndex: 1,
  },
  logoHeader: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '1.5rem',
  },
  logoBadge: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.25rem',
  },
  logoTitle: {
    fontSize: '1.25rem',
    fontWeight: 800,
    color: '#2d3b23',
    letterSpacing: '1px',
    marginTop: '0.25rem',
  },
  subDivider: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginTop: '0.5rem',
  },
  line: {
    width: '30px',
    height: '2px',
    background: '#A4B885',
    borderRadius: '2px',
  },
  subText: {
    fontSize: '0.75rem',
    fontWeight: 700,
    color: '#556846',
    letterSpacing: '1.5px',
  },
  pillTabsContainer: {
    display: 'flex',
    background: '#dce5d5',
    padding: '0.25rem',
    borderRadius: '12px',
    marginBottom: '1.5rem',
    width: '320px',
    justifyContent: 'space-between',
  },
  pillTab: {
    flex: 1,
    padding: '0.5rem 0',
    border: 'none',
    background: 'transparent',
    borderRadius: '9px',
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#526349',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textAlign: 'center',
  },
  pillTabActive: {
    background: '#ffffff',
    color: '#2d3b23',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
  },
  card: {
    background: '#ffffff',
    borderRadius: '20px',
    padding: '2rem 2.25rem',
    width: '100%',
    boxShadow: '0 12px 35px rgba(45, 59, 35, 0.1)',
    boxSizing: 'border-box',
  },
  cardTitle: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#1a2419',
    margin: '0 0 0.25rem 0',
  },
  cardSubtitle: {
    fontSize: '0.875rem',
    color: '#5c6e59',
    margin: '0 0 1.5rem 0',
  },
  errorBanner: {
    background: '#fef2f2',
    border: '1px solid #fca5a5',
    color: '#991b1b',
    borderRadius: '10px',
    padding: '0.75rem 1rem',
    fontSize: '0.85rem',
    marginBottom: '1.25rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  successBanner: {
    background: '#f0fdf4',
    border: '1px solid #86efac',
    color: '#166534',
    borderRadius: '10px',
    padding: '0.75rem 1rem',
    fontSize: '0.85rem',
    marginBottom: '1.25rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.15rem',
  },
  formRow: {
    display: 'flex',
    gap: '1rem',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
    flex: 1,
  },
  labelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: '0.8rem',
    fontWeight: 600,
    color: '#2d3b28',
  },
  forgotLink: {
    background: 'none',
    border: 'none',
    color: '#587038',
    fontSize: '0.75rem',
    fontWeight: 700,
    cursor: 'pointer',
    padding: 0,
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '12px',
    color: '#718567',
    pointerEvents: 'none',
  },
  eyeBtn: {
    position: 'absolute',
    right: '12px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
  },
  inputField: {
    width: '100%',
    padding: '0.75rem 2.5rem',
    background: '#f4f7f2',
    border: '1px solid #d4e0ce',
    borderRadius: '10px',
    fontSize: '0.9rem',
    color: '#1d271c',
    outline: 'none',
    boxSizing: 'border-box',
  },
  inputFieldPlain: {
    width: '100%',
    padding: '0.75rem 1rem',
    background: '#f4f7f2',
    border: '1px solid #d4e0ce',
    borderRadius: '10px',
    fontSize: '0.9rem',
    color: '#1d271c',
    outline: 'none',
    boxSizing: 'border-box',
  },
  submitBtn: {
    width: '100%',
    padding: '0.85rem',
    background: 'linear-gradient(135deg, #708a4d 0%, #526737 100%)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '0.95rem',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: '0.25rem',
    boxShadow: '0 4px 14px rgba(112, 138, 77, 0.35)',
    transition: 'all 0.2s ease',
  },
  backBtn: {
    flex: 1,
    padding: '0.85rem',
    background: '#f4f7f2',
    color: '#475569',
    border: '1px solid #cbd5e1',
    borderRadius: '10px',
    fontSize: '0.9rem',
    fontWeight: 700,
    cursor: 'pointer',
  },
  orDivider: {
    display: 'flex',
    alignItems: 'center',
    textAlign: 'center',
    color: '#8b9e86',
    fontSize: '0.75rem',
    fontWeight: 700,
    margin: '0.25rem 0',
  },
  googleBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.65rem',
    width: '100%',
    padding: '0.75rem',
    background: '#f4f7f2',
    border: '1px solid #d4e0ce',
    borderRadius: '10px',
    color: '#2d3b28',
    fontWeight: 600,
    fontSize: '0.875rem',
    textDecoration: 'none',
    boxSizing: 'border-box',
  },
  footerLinkRow: {
    marginTop: '1.5rem',
    fontSize: '0.85rem',
    color: '#526349',
  },
  footerBtnLink: {
    background: 'none',
    border: 'none',
    color: '#587038',
    fontWeight: 700,
    cursor: 'pointer',
    padding: 0,
    textDecoration: 'none',
  },
  centerLink: {
    textAlign: 'center',
    marginTop: '0.5rem',
  },
  textLink: {
    background: 'none',
    border: 'none',
    color: '#587038',
    fontWeight: 700,
    cursor: 'pointer',
    fontSize: '0.85rem',
  },
};
