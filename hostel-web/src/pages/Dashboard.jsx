import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { 
  QrCode, UserCheck, Utensils, Shield, DollarSign, 
  AlertCircle, ArrowRight, Upload, Phone, CheckCircle2, 
  FileText, LogOut, Settings, Award, Users, Home, ClipboardList, ShieldAlert
} from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [qrBase64, setQrBase64] = useState('');
  const [studentInfo, setStudentInfo] = useState(null);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mealSkipped, setMealSkipped] = useState(false);

  // Onboarding profile setup state
  const [setupDept, setSetupDept] = useState('');
  const [setupYear, setSetupYear] = useState(1);
  const [setupPhone, setSetupPhone] = useState('');
  const [setupEmail, setSetupEmail] = useState('');
  const [setupParentName, setSetupParentName] = useState('');
  const [setupParentPhone, setSetupParentPhone] = useState('');
  const [setupParentEmail, setSetupParentEmail] = useState('');
  const [setupPhoto, setSetupPhoto] = useState('');

  // Student Phone OTP state
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneOtpCode, setPhoneOtpCode] = useState('');
  const [phoneGeneratedOtp, setPhoneGeneratedOtp] = useState('');
  const [phoneOtpVerified, setPhoneOtpVerified] = useState(false);
  const [phoneOtpError, setPhoneOtpError] = useState('');

  // Student Email OTP state
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtpCode, setEmailOtpCode] = useState('');
  const [emailGeneratedOtp, setEmailGeneratedOtp] = useState('');
  const [emailOtpVerified, setEmailOtpVerified] = useState(false);
  const [emailOtpError, setEmailOtpError] = useState('');

  // Parent Phone OTP state
  const [parentPhoneOtpSent, setParentPhoneOtpSent] = useState(false);
  const [parentPhoneOtpCode, setParentPhoneOtpCode] = useState('');
  const [parentPhoneGeneratedOtp, setParentPhoneGeneratedOtp] = useState('');
  const [parentPhoneOtpVerified, setParentPhoneOtpVerified] = useState(false);
  const [parentPhoneOtpError, setParentPhoneOtpError] = useState('');

  // Parent Email OTP state
  const [parentEmailOtpSent, setParentEmailOtpSent] = useState(false);
  const [parentEmailOtpCode, setParentEmailOtpCode] = useState('');
  const [parentEmailGeneratedOtp, setParentEmailGeneratedOtp] = useState('');
  const [parentEmailOtpVerified, setParentEmailOtpVerified] = useState(false);
  const [parentEmailOtpError, setParentEmailOtpError] = useState('');
  const [submittingProfile, setSubmittingProfile] = useState(false);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isStudent = user.role === 'STUDENT';
  const isAdmin = user.role === 'ADMIN' || user.role === 'SUPERADMIN';

  const load = useCallback(() => {
    setError(null);
    setLoading(true);
    (async () => {
      try {
        if (isStudent && user.studentId) {
          const sInfo = await api.students.get(user.studentId);
          setStudentInfo(sInfo);

          if (sInfo.status === 'ACTIVE') {
            const [sStats, qrData, mHistory, noticeList] = await Promise.all([
              api.dashboard.studentStats().catch(() => ({})),
              api.students.getQr(user.studentId).catch(() => ({})),
              api.mealVerification.byStudent(user.studentId, 5).catch(() => []),
              api.notices.list().catch(() => []),
            ]);
            setStats(sStats);
            setQrBase64(qrData?.qrBase64 || '');
            setRecent(mHistory);
            setNotices(noticeList.slice(0, 3));
          } else {
            const noticeList = await api.notices.list().catch(() => []);
            setNotices(noticeList.slice(0, 3));
          }
        } else if (isAdmin) {
          const [aStats, mRecent, noticeList] = await Promise.all([
            api.dashboard.stats().catch(() => ({})),
            api.mealVerification.recent(10).catch(() => []),
            api.notices.list().catch(() => []),
          ]);
          setStats(aStats);
          setRecent(mRecent);
          setNotices(noticeList.slice(0, 3));
        }
      } catch (e) {
        setError(e.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    })();
  }, [isStudent, isAdmin, user.studentId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (studentInfo) {
      setSetupDept(studentInfo.department || '');
      setSetupYear(studentInfo.year || 1);
      setSetupPhone(studentInfo.phone || '');
      setSetupEmail(studentInfo.email || '');
      setSetupParentName(studentInfo.parentName || '');
      setSetupParentPhone(studentInfo.parentPhone || '');
      setSetupParentEmail(studentInfo.parentEmail || '');
      setSetupPhoto(studentInfo.photoBase64 || '');
    }
  }, [studentInfo]);

  const toggleMealSkip = () => {
    setMealSkipped(!mealSkipped);
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSetupPhoto(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Student Phone OTP Handlers
  const sendStudentPhoneOtp = () => {
    if (!setupPhone) {
      setPhoneOtpError('Please fill in your phone number.');
      return;
    }
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setPhoneGeneratedOtp(code);
    setPhoneOtpSent(true);
    setPhoneOtpError('');
    alert(`[HostelSync Dispatcher] Student Phone verification SMS sent to ${setupPhone}.\nEnter OTP Code: ${code}`);
  };
  const verifyStudentPhoneOtp = () => {
    if (phoneOtpCode === phoneGeneratedOtp) {
      setPhoneOtpVerified(true);
      setPhoneOtpError('');
    } else {
      setPhoneOtpError('Invalid code. Please try again.');
    }
  };

  // Student Email OTP Handlers
  const sendStudentEmailOtp = () => {
    if (!setupEmail) {
      setEmailOtpError('Please fill in your email.');
      return;
    }
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setEmailGeneratedOtp(code);
    setEmailOtpSent(true);
    setEmailOtpError('');
    alert(`[HostelSync Dispatcher] Student Email verification link/code sent to ${setupEmail}.\nEnter OTP Code: ${code}`);
  };
  const verifyStudentEmailOtp = () => {
    if (emailOtpCode === emailGeneratedOtp) {
      setEmailOtpVerified(true);
      setEmailOtpError('');
    } else {
      setEmailOtpError('Invalid code. Please try again.');
    }
  };

  // Parent Phone OTP Handlers
  const sendParentPhoneOtp = () => {
    if (!setupParentPhone) {
      setParentPhoneOtpError('Please fill in parent phone number.');
      return;
    }
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setParentPhoneGeneratedOtp(code);
    setParentPhoneOtpSent(true);
    setParentPhoneOtpError('');
    alert(`[HostelSync Dispatcher] Parent Phone verification SMS sent to ${setupParentPhone}.\nEnter OTP Code: ${code}`);
  };
  const verifyParentPhoneOtp = () => {
    if (parentPhoneOtpCode === parentPhoneGeneratedOtp) {
      setParentPhoneOtpVerified(true);
      setParentPhoneOtpError('');
    } else {
      setParentPhoneOtpError('Invalid code. Please try again.');
    }
  };

  // Parent Email OTP Handlers
  const sendParentEmailOtp = () => {
    if (!setupParentEmail) {
      setParentEmailOtpError('Please fill in parent email.');
      return;
    }
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setParentEmailGeneratedOtp(code);
    setParentEmailOtpSent(true);
    setParentEmailOtpError('');
    alert(`[HostelSync Dispatcher] Parent Email verification link/code sent to ${setupParentEmail}.\nEnter OTP Code: ${code}`);
  };
  const verifyParentEmailOtp = () => {
    if (parentEmailOtpCode === parentEmailGeneratedOtp) {
      setParentEmailOtpVerified(true);
      setParentEmailOtpError('');
    } else {
      setParentEmailOtpError('Invalid code. Please try again.');
    }
  };

  const submitSetupProfile = async (e) => {
    e.preventDefault();
    if (!setupDept || !setupPhone || !setupEmail || !setupParentPhone || !setupParentEmail || 
        !phoneOtpVerified || !emailOtpVerified || !parentPhoneOtpVerified || !parentEmailOtpVerified) {
      setError('Please complete all steps and verify all contact fields (Student Phone & Email, Parent Phone & Email).');
      return;
    }
    if (setupPhone.trim() === setupParentPhone.trim()) {
      setError('Student phone number and parent/guardian phone number cannot be the same.');
      return;
    }
    if (setupEmail.trim().toLowerCase() === setupParentEmail.trim().toLowerCase()) {
      setError('Student email and parent/guardian email cannot be the same.');
      return;
    }
    setSubmittingProfile(true);
    setError(null);
    try {
      await api.students.submitProfile(studentInfo.id, {
        department: setupDept,
        year: Number(setupYear),
        phone: setupPhone,
        email: setupEmail,
        parentName: setupParentName,
        parentPhone: setupParentPhone,
        parentEmail: setupParentEmail,
        photoBase64: setupPhoto,
      });
      load();
    } catch (e) {
      setError(e.message || 'Failed to submit profile details');
    } finally {
      setSubmittingProfile(false);
    }
  };

  const renderStepper = (currentStatus) => {
    const steps = [
      { label: 'Applied', key: 'PENDING_ADMIN', desc: 'Admission submitted' },
      { label: 'Superintendent Review', key: 'PENDING_SUPERADMIN', desc: 'Room pre-allocation' },
      { label: 'Super Admin Finalized', key: 'PENDING_PROFILE_SETUP', desc: 'Account activation' },
      { label: 'Profile Complete', key: 'PENDING_PROFILE_VERIFICATION', desc: 'Student data submission' },
      { label: 'Resident Active', key: 'ACTIVE', desc: 'Access & dining active' }
    ];

    const getStepStatus = (index) => {
      if (currentStatus === 'REJECTED') {
        return index <= 1 ? 'completed-err' : 'locked';
      }
      
      let activeIdx = 0;
      if (currentStatus === 'PENDING_ADMIN') activeIdx = 0;
      else if (currentStatus === 'PENDING_SUPERADMIN') activeIdx = 1;
      else if (currentStatus === 'PENDING_PROFILE_SETUP') activeIdx = 2;
      else if (currentStatus === 'PENDING_PROFILE_VERIFICATION') activeIdx = 3;
      else if (currentStatus === 'ACTIVE') activeIdx = 4;

      if (index < activeIdx) return 'completed';
      if (index === activeIdx) return 'current';
      return 'locked';
    };

    return (
      <div style={styles.stepperContainer}>
        {steps.map((step, idx) => {
          const stepStatus = getStepStatus(idx);
          return (
            <div key={idx} style={styles.stepItem}>
              <div style={{
                ...styles.stepIndicator,
                ...(stepStatus === 'completed' ? styles.stepCompleted : {}),
                ...(stepStatus === 'completed-err' ? styles.stepCompletedErr : {}),
                ...(stepStatus === 'current' ? styles.stepCurrent : {}),
                ...(stepStatus === 'locked' ? styles.stepLocked : {}),
              }}>
                {stepStatus === 'completed' && '✓'}
                {stepStatus === 'completed-err' && '✗'}
                {stepStatus === 'current' && '●'}
                {stepStatus === 'locked' && idx + 1}
              </div>
              <div style={styles.stepContent}>
                <div style={{
                  ...styles.stepLabel,
                  ...(stepStatus === 'current' ? { color: 'var(--accent)', fontWeight: 'bold' } : {})
                }}>{step.label}</div>
                <span style={styles.stepDesc}>{step.desc}</span>
              </div>
              {idx < steps.length - 1 && (
                <div style={{
                  ...styles.stepConnector,
                  ...(idx < (currentStatus === 'ACTIVE' ? 4 : currentStatus === 'PENDING_PROFILE_VERIFICATION' ? 3 : currentStatus === 'PENDING_PROFILE_SETUP' ? 2 : currentStatus === 'PENDING_SUPERADMIN' ? 1 : 0) ? styles.stepConnectorActive : {})
                }} />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  if (loading && !studentInfo && !stats && !error) {
    return <div style={styles.centered}>Loading HostelSync Dashboard…</div>;
  }

  // STUDENT PORTAL
  if (isStudent && studentInfo) {
    const status = studentInfo.status;
    const room = stats?.roomDetails || {};
    const hostel = stats?.hostelDetails || {};
    const roommates = stats?.roommates || [];

    // LOCKED APPLICATION STAGE (PENDING_ADMIN, PENDING_SUPERADMIN)
    if (status === 'PENDING_ADMIN' || status === 'PENDING_SUPERADMIN') {
      return (
        <div style={styles.container}>
          <div style={styles.welcomeSection}>
            <h1 style={styles.title}>Welcome to HostelSync, {user.name}!</h1>
            <p style={styles.subtitle}>Track your hostel registration and room allocation status</p>
          </div>

          <div style={styles.stepperCard} className="glass-card">
            <h3 style={styles.cardTitle}>Admission Lifecycle</h3>
            {renderStepper(status)}
          </div>

          <div style={{ ...styles.card, marginTop: '2rem' }} className="glass-card">
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <ShieldAlert size={40} color="var(--warning)" style={{ flexShrink: 0 }} />
              <div>
                <h3 style={{ margin: '0 0 0.5rem 0' }}>Registration Pending Verification</h3>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                  Your application has been received. It is currently being reviewed by the **Superintendent** (pre-allocating a room) and will be approved by the **Super Admin** to finalize billing.
                  <br />
                  Once billing is active, you will be permitted to complete your profile, verify your parent's contact number, and unlock your digital gate pass.
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // REJECTED STAGE
    if (status === 'REJECTED') {
      return (
        <div style={styles.container}>
          <div style={styles.welcomeSection}>
            <h1 style={styles.title}>HostelSync Portal</h1>
            <p style={styles.subtitle}>Smart Dormitory Services</p>
          </div>

          <div style={styles.stepperCard} className="glass-card">
            <h3 style={styles.cardTitle}>Admission Lifecycle</h3>
            {renderStepper(status)}
          </div>

          <div style={{ ...styles.card, marginTop: '2rem', border: '1px solid var(--danger)' }} className="glass-card">
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <AlertCircle size={40} color="var(--danger)" style={{ flexShrink: 0 }} />
              <div>
                <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--danger)' }}>Application Rejected</h3>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                  We regret to inform you that your dormitory room allocation application was rejected by the administration.
                  <br />
                  For inquiries or details, please contact the Superintendent Office.
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // PENDING PROFILE VERIFICATION BY WARDEN
    if (status === 'PENDING_PROFILE_VERIFICATION') {
      return (
        <div style={styles.container}>
          <div style={styles.welcomeSection}>
            <h1 style={styles.title}>Welcome back, {user.name}!</h1>
            <p style={styles.subtitle}>Track your hostel registration and room allocation status</p>
          </div>

          <div style={styles.stepperCard} className="glass-card">
            <h3 style={styles.cardTitle}>Admission Lifecycle</h3>
            {renderStepper(status)}
          </div>

          <div style={{ ...styles.card, marginTop: '2rem' }} className="glass-card">
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <CheckCircle2 size={40} color="var(--accent)" style={{ flexShrink: 0 }} />
              <div>
                <h3 style={{ margin: '0 0 0.5rem 0' }}>Profile details submitted successfully!</h3>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                  Your profile details, uploaded photo, and verified parent contact warning settings are undergoing review by the **Superintendent**.
                  <br />
                  You will receive an automated gate pass token and full dashboard access as soon as the Superintendent verifies your documents.
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // PENDING ONBOARDING PROFILE SETUP BY STUDENT
    if (status === 'PENDING_PROFILE_SETUP') {
      return (
        <div style={styles.container}>
          <div style={styles.welcomeSection}>
            <h1 style={styles.title}>Welcome, {user.name}!</h1>
            <p style={styles.subtitle}>Unlock your portal by completing the onboarding setup</p>
          </div>

          <div style={styles.stepperCard} className="glass-card">
            <h3 style={styles.cardTitle}>Admission Lifecycle</h3>
            {renderStepper(status)}
          </div>

          {error && <div style={styles.errorBanner}>{error}</div>}

          <div style={{ ...styles.card, marginTop: '2rem' }} className="glass-card">
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Award color="var(--accent)" /> Completed Allocation Setup
            </h2>

            <form onSubmit={submitSetupProfile} style={styles.form}>
              <div style={styles.formSection}>
                <h4 style={styles.formSecTitle}>1. Academic Details</h4>
                <div style={styles.formRow}>
                  <div style={styles.formGroup}>
                    <label style={styles.fieldLabel}>Department / Stream *</label>
                    <input 
                      type="text" 
                      value={setupDept} 
                      onChange={(e) => setSetupDept(e.target.value)}
                      placeholder="e.g. Computer Science" 
                      style={styles.input}
                      required 
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.fieldLabel}>Year of Study *</label>
                    <select 
                      value={setupYear} 
                      onChange={(e) => setSetupYear(Number(e.target.value))}
                      style={styles.input}
                    >
                      <option value={1}>1st Year</option>
                      <option value={2}>2nd Year</option>
                      <option value={3}>3rd Year</option>
                      <option value={4}>4th Year</option>
                    </select>
                  </div>
                </div>
                <div style={styles.formRow}>
                  <div style={styles.formGroup}>
                    <label style={styles.fieldLabel}>Your Phone Number *</label>
                    <input 
                      type="tel" 
                      value={setupPhone} 
                      onChange={(e) => setSetupPhone(e.target.value)}
                      placeholder="+1234567890" 
                      style={styles.input}
                      required 
                    />
                  </div>
                </div>
              </div>

              <div style={styles.formSection}>
                <h4 style={styles.formSecTitle}>2. Contact Details & Security Verification</h4>
                
                {/* Row 1: Student Phone & Student Email */}
                <div style={styles.formRow}>
                  {/* Student Phone */}
                  <div style={styles.formGroup}>
                    <label style={styles.fieldLabel}>Student Phone Number *</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input 
                        type="tel" 
                        value={setupPhone} 
                        onChange={(e) => setSetupPhone(e.target.value)}
                        placeholder="+1234567890" 
                        style={styles.input}
                        disabled={phoneOtpVerified}
                        required 
                      />
                      <button 
                        type="button" 
                        onClick={sendStudentPhoneOtp} 
                        style={phoneOtpVerified ? styles.verifiedBtn : styles.otpBtn}
                        disabled={phoneOtpVerified || !setupPhone}
                      >
                        {phoneOtpVerified ? 'Verified ✓' : phoneOtpSent ? 'Resend' : 'Verify'}
                      </button>
                    </div>
                    {phoneOtpSent && !phoneOtpVerified && (
                      <div style={styles.inlineOtpBox}>
                        <input 
                          type="text" 
                          maxLength={4}
                          value={phoneOtpCode}
                          onChange={(e) => setPhoneOtpCode(e.target.value)}
                          placeholder="4-digit OTP" 
                          style={styles.inlineOtpInput} 
                        />
                        <button type="button" onClick={verifyStudentPhoneOtp} style={styles.inlineOtpVerifyBtn}>Confirm</button>
                      </div>
                    )}
                    {phoneOtpError && <span style={styles.inlineOtpError}>{phoneOtpError}</span>}
                  </div>

                  {/* Student Email */}
                  <div style={styles.formGroup}>
                    <label style={styles.fieldLabel}>Student Email Address *</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input 
                        type="email" 
                        value={setupEmail} 
                        onChange={(e) => setSetupEmail(e.target.value)}
                        placeholder="student@example.com" 
                        style={styles.input}
                        disabled={emailOtpVerified}
                        required 
                      />
                      <button 
                        type="button" 
                        onClick={sendStudentEmailOtp} 
                        style={emailOtpVerified ? styles.verifiedBtn : styles.otpBtn}
                        disabled={emailOtpVerified || !setupEmail}
                      >
                        {emailOtpVerified ? 'Verified ✓' : emailOtpSent ? 'Resend' : 'Verify'}
                      </button>
                    </div>
                    {emailOtpSent && !emailOtpVerified && (
                      <div style={styles.inlineOtpBox}>
                        <input 
                          type="text" 
                          maxLength={4}
                          value={emailOtpCode}
                          onChange={(e) => setEmailOtpCode(e.target.value)}
                          placeholder="4-digit OTP" 
                          style={styles.inlineOtpInput} 
                        />
                        <button type="button" onClick={verifyStudentEmailOtp} style={styles.inlineOtpVerifyBtn}>Confirm</button>
                      </div>
                    )}
                    {emailOtpError && <span style={styles.inlineOtpError}>{emailOtpError}</span>}
                  </div>
                </div>

                {/* Row 2: Parent Name, Parent Phone & Parent Email */}
                <div style={styles.formRow}>
                  <div style={styles.formGroup}>
                    <label style={styles.fieldLabel}>Parent Name *</label>
                    <input 
                      type="text" 
                      value={setupParentName} 
                      onChange={(e) => setSetupParentName(e.target.value)}
                      placeholder="Robert Doe" 
                      style={styles.input}
                      required 
                    />
                  </div>
                </div>

                <div style={styles.formRow}>
                  {/* Parent Phone */}
                  <div style={styles.formGroup}>
                    <label style={styles.fieldLabel}>Parent Phone Number *</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input 
                        type="tel" 
                        value={setupParentPhone} 
                        onChange={(e) => setSetupParentPhone(e.target.value)}
                        placeholder="+9876543210" 
                        style={styles.input}
                        disabled={parentPhoneOtpVerified}
                        required 
                      />
                      <button 
                        type="button" 
                        onClick={sendParentPhoneOtp} 
                        style={parentPhoneOtpVerified ? styles.verifiedBtn : styles.otpBtn}
                        disabled={parentPhoneOtpVerified || !setupParentPhone}
                      >
                        {parentPhoneOtpVerified ? 'Verified ✓' : parentPhoneOtpSent ? 'Resend' : 'Verify'}
                      </button>
                    </div>
                    {parentPhoneOtpSent && !parentPhoneOtpVerified && (
                      <div style={styles.inlineOtpBox}>
                        <input 
                          type="text" 
                          maxLength={4}
                          value={parentPhoneOtpCode}
                          onChange={(e) => setParentPhoneOtpCode(e.target.value)}
                          placeholder="4-digit OTP" 
                          style={styles.inlineOtpInput} 
                        />
                        <button type="button" onClick={verifyParentPhoneOtp} style={styles.inlineOtpVerifyBtn}>Confirm</button>
                      </div>
                    )}
                    {parentPhoneOtpError && <span style={styles.inlineOtpError}>{parentPhoneOtpError}</span>}
                  </div>

                  {/* Parent Email */}
                  <div style={styles.formGroup}>
                    <label style={styles.fieldLabel}>Parent Email Address *</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input 
                        type="email" 
                        value={setupParentEmail} 
                        onChange={(e) => setSetupParentEmail(e.target.value)}
                        placeholder="parent@example.com" 
                        style={styles.input}
                        disabled={parentEmailOtpVerified}
                        required 
                      />
                      <button 
                        type="button" 
                        onClick={sendParentEmailOtp} 
                        style={parentEmailOtpVerified ? styles.verifiedBtn : styles.otpBtn}
                        disabled={parentEmailOtpVerified || !setupParentEmail}
                      >
                        {parentEmailOtpVerified ? 'Verified ✓' : parentEmailOtpSent ? 'Resend' : 'Verify'}
                      </button>
                    </div>
                    {parentEmailOtpSent && !parentEmailOtpVerified && (
                      <div style={styles.inlineOtpBox}>
                        <input 
                          type="text" 
                          maxLength={4}
                          value={parentEmailOtpCode}
                          onChange={(e) => setParentEmailOtpCode(e.target.value)}
                          placeholder="4-digit OTP" 
                          style={styles.inlineOtpInput} 
                        />
                        <button type="button" onClick={verifyParentEmailOtp} style={styles.inlineOtpVerifyBtn}>Confirm</button>
                      </div>
                    )}
                    {parentEmailOtpError && <span style={styles.inlineOtpError}>{parentEmailOtpError}</span>}
                  </div>
                </div>
              </div>

              <div style={styles.formSection}>
                <h4 style={styles.formSecTitle}>3. Resident Avatar (Photo Upload)</h4>
                <div style={styles.formRow}>
                  <div style={styles.formGroup}>
                    <label style={styles.fieldLabel}>Select Profile Photo *</label>
                    <div style={styles.uploadBox}>
                      <Upload size={24} color="var(--accent)" />
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handlePhotoChange}
                        style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}
                      />
                    </div>
                  </div>
                  {setupPhoto && (
                    <div style={styles.photoPreviewCard}>
                      <img src={setupPhoto} alt="Preview" style={styles.photoPreview} />
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Avatar Ready</span>
                    </div>
                  )}
                </div>
              </div>

              <button 
                type="submit" 
                style={{ ...styles.submitBtn, opacity: (!setupDept || !setupPhone || !setupEmail || !setupParentPhone || !setupParentEmail || !phoneOtpVerified || !emailOtpVerified || !parentPhoneOtpVerified || !parentEmailOtpVerified) ? 0.6 : 1 }}
                disabled={submittingProfile || !setupDept || !setupPhone || !setupEmail || !setupParentPhone || !setupParentEmail || !phoneOtpVerified || !emailOtpVerified || !parentPhoneOtpVerified || !parentEmailOtpVerified}
              >
                {submittingProfile ? 'Submitting details...' : 'Submit Profile for Verification'}
              </button>
            </form>
          </div>
        </div>
      );
    }

    // ACTIVE RESIDENT STUDENT PORTAL
    return (
      <div style={styles.container}>
        {error && (
          <div style={styles.errorBanner}>
            {error}
            <button type="button" style={styles.retryBtn} onClick={load}>Retry</button>
          </div>
        )}

        <div style={styles.welcomeSection}>
          <h1 style={styles.title}>Welcome back, {user.name}!</h1>
          <p style={styles.subtitle}>Smart Hostel Portal • Room {room.number || 'Pending Assignment'}</p>
        </div>

        {/* Quick Analytics Row */}
        <div style={styles.statsRow}>
          <div style={styles.miniStat} className="glass-card">
            <span style={styles.miniStatNum}>{stats?.personalMealsCount ?? 0}</span>
            <span style={styles.miniStatLabel}>Meals Verifications</span>
          </div>
          <div style={styles.miniStat} className="glass-card">
            <span style={styles.miniStatNum}>{stats?.attendancePercentage ?? 95.0}%</span>
            <span style={styles.miniStatLabel}>Gate Attendance Rate</span>
          </div>
          <div style={styles.miniStat} className="glass-card">
            <span style={styles.miniStatNum}>{stats?.pendingLeavesCount ?? 0}</span>
            <span style={styles.miniStatLabel}>Active Leaves</span>
          </div>
          <div style={styles.miniStat} className="glass-card">
            <span style={styles.miniStatNum}>{stats?.activeComplaintsCount ?? 0}</span>
            <span style={styles.miniStatLabel}>Open Issues</span>
          </div>
        </div>

        <div style={styles.studentGrid}>
          {/* QR Code Widget */}
          <div style={styles.cardHighlight} className="glass-card glow-hover">
            <h3 style={styles.cardTitle}>My Dining Pass QR</h3>
            <p style={styles.cardDesc}>
              Scan at the mess counter or gate for access logs. Generated dynamically for today.
            </p>
            {qrBase64 ? (
              <div style={styles.qrContainer}>
                <img
                  src={`data:image/png;base64,${qrBase64}`}
                  alt="My QR Code"
                  style={styles.qrImage}
                />
                <div style={styles.tokenText}>{studentInfo?.qrToken}</div>
              </div>
            ) : (
              <p style={styles.muted}>Generating QR code...</p>
            )}
          </div>

          {/* Quick Actions & Room Info */}
          <div style={styles.card} className="glass-card">
            <h3 style={styles.cardTitle}>Dormitory & Roommate Directory</h3>
            <div style={styles.detailsBox}>
              <div style={styles.detailsRow}>
                <span style={styles.label}>Building:</span>
                <span style={styles.val}>{hostel.name || 'Newton Hall'} ({hostel.code || 'NWT'})</span>
              </div>
              <div style={styles.detailsRow}>
                <span style={styles.label}>Room & Block:</span>
                <span style={styles.val}>Room {room.number || 'N/A'} (Block {room.block || 'N/A'}, Floor {room.floor || 'N/A'})</span>
              </div>
              <div style={styles.detailsRow}>
                <span style={styles.label}>Fee Account:</span>
                <span style={{
                  ...styles.val,
                  ...(stats?.feeStatus === 'DUE' ? { color: 'var(--warning)', fontWeight: 'bold' } : { color: 'var(--accent)' })
                }}>
                  {stats?.feeStatus === 'DUE' ? `DUE ($${stats.pendingFeesAmount})` : stats?.feeStatus === 'PAID' ? 'SETTLED' : 'NO INVOICES'}
                </span>
              </div>
            </div>

            <h4 style={{ ...styles.cardTitle, marginTop: '1.25rem', fontSize: '0.95rem' }}>Roommates</h4>
            {roommates.length === 0 ? (
              <p style={styles.muted}>No roommates registered in your room.</p>
            ) : (
              <div style={styles.roommateChips}>
                {roommates.map((r) => (
                  <span key={r.id} style={styles.roommateChip}>{r.name}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={styles.studentGrid}>
          {/* Quick Actions */}
          <div style={styles.card} className="glass-card">
            <h3 style={styles.cardTitle}>Daily Gate & Mess Preference</h3>
            
            <div style={styles.prefBox}>
              <div style={styles.prefLabel}>
                <strong>Opt-Out of Next Meal</strong>
                <span style={styles.muted}>Prevent food waste by notifying the mess in advance.</span>
              </div>
              <button
                onClick={toggleMealSkip}
                style={{
                  ...styles.skipBtn,
                  ...(mealSkipped ? styles.skipBtnActive : {}),
                }}
              >
                {mealSkipped ? 'Opted Out ✓' : 'Opt Out'}
              </button>
            </div>
            {mealSkipped && (
              <div style={styles.toastInfo}>
                ✓ Notified mess warden. Thank you for conserving food!
              </div>
            )}

            <div style={styles.menuLinks}>
              <Link to="/leaves" style={styles.actionLink}>
                <span>Request Leave Pass</span>
                <ArrowRight size={16} />
              </Link>
              <Link to="/complaints" style={styles.actionLink}>
                <span>File Maintenance Complaint</span>
                <ArrowRight size={16} />
              </Link>
              <Link to="/fees" style={styles.actionLink}>
                <span>Settle Pending Invoices</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          {/* Announcements board preview */}
          <div style={styles.card} className="glass-card">
            <div style={styles.headerWithLink}>
              <h3 style={styles.cardTitle}>Notice Board Announcements</h3>
              <Link to="/notices" style={{ fontSize: '0.8rem' }}>All Notices</Link>
            </div>
            <div style={styles.noticeList}>
              {notices.length === 0 ? (
                <p style={styles.muted}>No notices posted.</p>
              ) : (
                notices.map((n) => (
                  <div key={n.id} style={styles.noticePreviewItem}>
                    <div style={styles.noticeMetaHeader}>
                      <strong>{n.title}</strong>
                      <span style={styles.muted}>{new Date(n.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div style={styles.noticePreviewBody}>
                      {n.content}
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

  // WARDEN / SUPERADMIN PORTAL
  return (
    <div>
      {error && (
        <div style={styles.errorBanner}>
          {error}
          <button type="button" style={styles.retryBtn} onClick={load}>Retry</button>
        </div>
      )}
      <h1 style={styles.title}>{user.role === 'SUPERADMIN' ? 'Super Admin System Panel' : 'Hostel Control (Superintendent)'}</h1>
      <p style={styles.headerSubtitle}>Monitor daily check-ins, verify dining transactions, track occupancy, and resolve complaints</p>
      
      {user.role === 'SUPERADMIN' && (
        <div style={styles.superBanner} className="glass-card">
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Settings size={20} color="var(--accent)" />
            <span>
              <strong>Super Admin Mode Active:</strong> Add hostels, override room seat capacity limits, configure database settings, and audit room history.
            </span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link to="/admins" style={styles.superBtn}>Manage Admins</Link>
            <Link to="/ai-analytics" style={styles.superBtnAccent} className="glow-hover">AI Engine</Link>
          </div>
        </div>
      )}

      {/* Numerical Stats Dashboard */}
      <div style={styles.cardsGrid}>
        <div style={styles.cardMini} className="glass-card">
          <span style={styles.cardMiniLabel}>Occupancy Rate</span>
          <span style={styles.cardMiniVal}>{stats?.occupancyPercentage ?? 0}%</span>
          <div style={styles.progressBarBg}>
            <div style={{ ...styles.progressBarVal, width: `${stats?.occupancyPercentage ?? 0}%` }}></div>
          </div>
        </div>
        <div style={styles.cardMini} className="glass-card">
          <span style={styles.cardMiniLabel}>Total Revenue</span>
          <span style={styles.cardMiniVal}>${stats?.totalRevenue ? stats.totalRevenue.toLocaleString() : '0.00'}</span>
          <Link to="/fees" style={styles.cardLink}>Invoices ledger</Link>
        </div>
        <div style={styles.cardMini} className="glass-card">
          <span style={styles.cardMiniLabel}>Gate Entries Today</span>
          <span style={styles.cardMiniVal}>{stats?.attendanceToday ?? 0}</span>
          <Link to="/attendance" style={styles.cardLink}>Security logs</Link>
        </div>
        <div style={styles.cardMini} className="glass-card">
          <span style={styles.cardMiniLabel}>Meals Verified Today</span>
          <span style={styles.cardMiniVal}>{stats?.mealsVerifiedToday ?? 0}</span>
          <Link to="/verify-meal" style={styles.cardLink}>Meal Scanner</Link>
        </div>
      </div>

      <div style={styles.cards}>
        <div style={styles.card} className="glass-card glow-hover">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={styles.cardLabel}>Students</span>
            <Users size={18} color="var(--accent)" />
          </div>
          <div style={styles.cardValue}>{stats?.totalStudents ?? 0}</div>
          <Link to="/students" style={styles.cardLink}>Students register →</Link>
        </div>
        <div style={styles.card} className="glass-card glow-hover">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={styles.cardLabel}>Rooms</span>
            <Home size={18} color="var(--accent)" />
          </div>
          <div style={styles.cardValue}>{stats?.totalRooms ?? 0}</div>
          <Link to="/rooms" style={styles.cardLink}>Room allocation →</Link>
        </div>
        {user.role === 'SUPERADMIN' && (
          <div style={styles.card} className="glass-card glow-hover">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={styles.cardLabel}>Hostels</span>
              <Settings size={18} color="var(--accent)" />
            </div>
            <div style={styles.cardValue}>{stats?.totalHostels ?? 0}</div>
            <Link to="/hostels" style={styles.cardLink}>Hostels config →</Link>
          </div>
        )}
        <div style={styles.card} className="glass-card glow-hover">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={styles.cardLabel}>Pending Leaves</span>
            <ClipboardList size={18} color="var(--accent)" />
          </div>
          <div style={styles.cardValue}>{stats?.pendingLeaves ?? 0}</div>
          <Link to="/leaves" style={styles.cardLink}>Approve requests →</Link>
        </div>
        <div style={styles.card} className="glass-card glow-hover">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={styles.cardLabel}>Open Complaints</span>
            <AlertCircle size={18} color="var(--accent)" />
          </div>
          <div style={styles.cardValue}>{stats?.openComplaints ?? 0}</div>
          <Link to="/complaints" style={styles.cardLink}>Resolve tickets →</Link>
        </div>
      </div>

      <div style={styles.studentGrid}>
        {/* Recent meal log updates */}
        <section style={{ ...styles.section, ...styles.card }} className="glass-card">
          <h2 style={styles.sectionTitle}>Dining Scan Log (Today)</h2>
          {recent.length === 0 ? (
            <p style={styles.muted}>No dining scans recorded today.</p>
          ) : (
            <ul style={styles.list}>
              {recent.map((v) => (
                <li key={v.id} style={styles.listItem}>
                  <span style={styles.badge}>{v.mealSlot}</span>
                  <span>Student ID: #{v.studentId}</span>
                  <span style={styles.muted}>{v.verifiedAt ? new Date(v.verifiedAt).toLocaleTimeString() : '—'}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Notices list */}
        <section style={{ ...styles.section, ...styles.card }} className="glass-card">
          <div style={styles.headerWithLink}>
            <h2 style={styles.sectionTitle}>Notice Announcements</h2>
            <Link to="/notices" style={{ fontSize: '0.85rem' }}>Edit Noticeboard</Link>
          </div>
          <div style={styles.noticeList}>
            {notices.length === 0 ? (
              <p style={styles.muted}>No notices posted yet.</p>
            ) : (
              notices.map((n) => (
                <div key={n.id} style={styles.noticePreviewItem}>
                  <div style={styles.noticeMetaHeader}>
                    <strong>{n.title}</strong>
                    <span style={styles.muted}>By {n.postedBy}</span>
                  </div>
                  <div style={styles.noticePreviewBody}>
                    {n.content}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

const styles = {
  container: { paddingBottom: '2rem' },
  welcomeSection: { marginBottom: '2rem' },
  title: { fontSize: '2rem', fontWeight: 700, margin: '0 0 0.25rem 0' },
  subtitle: { color: 'var(--text-muted)', margin: 0, fontSize: '0.95rem' },
  headerSubtitle: { color: 'var(--text-muted)', margin: '0 0 2rem 0', fontSize: '0.95rem' },
  centered: { padding: '5rem 2rem', textAlign: 'center', color: 'var(--text-muted)' },
  
  studentGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '1.5rem',
    marginBottom: '1.5rem',
    alignItems: 'stretch',
  },
  card: { border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.5rem', background: 'var(--surface)' },
  cardHighlight: {
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    background: 'linear-gradient(135deg, var(--surface) 0%, rgba(59, 130, 246, 0.04) 100%)',
  },
  cardTitle: { margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: 600 },
  cardDesc: { margin: '0 0 1.25rem 0', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.5' },
  
  qrContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#fff',
    padding: '1.25rem',
    borderRadius: '8px',
    margin: 'auto',
    width: 'fit-content',
  },
  qrImage: { width: 140, height: 140 },
  tokenText: {
    marginTop: '0.5rem',
    color: '#000',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.8rem',
    fontWeight: 600,
    letterSpacing: '1px',
  },
  
  prefBox: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'var(--bg)',
    padding: '1rem',
    borderRadius: '8px',
    border: '1px solid var(--border)',
    gap: '1rem',
    marginBottom: '1.5rem',
  },
  prefLabel: { display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.85rem' },
  skipBtn: {
    background: 'transparent',
    color: 'var(--text)',
    border: '1px solid var(--border)',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    fontSize: '0.85rem',
    fontWeight: 600,
    whiteSpace: 'nowrap',
    cursor: 'pointer',
  },
  skipBtnActive: {
    background: 'rgba(239, 68, 68, 0.15)',
    color: 'var(--danger)',
    borderColor: 'var(--danger)',
  },
  toastInfo: {
    background: 'rgba(34, 197, 94, 0.12)',
    color: '#a7f3d0',
    padding: '0.65rem',
    borderRadius: '6px',
    fontSize: '0.8rem',
    marginBottom: '1.5rem',
  },
  menuLinks: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  actionLink: {
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    padding: '0.75rem 1rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    color: 'var(--text)',
    fontSize: '0.875rem',
    fontWeight: 600,
    textDecoration: 'none',
    transition: 'all 0.2s',
  },
  
  // Numerical stats row
  statsRow: { display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' },
  miniStat: {
    flex: 1,
    minWidth: '150px',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '1rem 0.5rem',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    background: 'var(--surface)'
  },
  miniStatNum: { fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent)' },
  miniStatLabel: { color: 'var(--text-muted)', fontSize: '0.75rem' },

  detailsBox: { display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'var(--bg)', padding: '1rem', borderRadius: 8, border: '1px solid var(--border)' },
  detailsRow: { display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' },
  label: { color: 'var(--text-muted)' },
  val: { fontWeight: 600 },
  
  roommateChips: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap' },
  roommateChip: { fontSize: '0.75rem', background: 'var(--bg)', border: '1px solid var(--border)', padding: '0.25rem 0.5rem', borderRadius: 6, fontWeight: 600 },

  list: { listStyle: 'none', padding: 0, margin: 0 },
  listItem: { display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.9rem' },
  badge: { background: 'rgba(59, 130, 246, 0.12)', color: 'var(--accent)', padding: '0.25rem 0.5rem', borderRadius: 6, fontSize: '0.7rem', fontFamily: 'var(--font-mono)' },
  muted: { color: 'var(--text-muted)', fontSize: '0.85rem' },
  headerWithLink: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' },
  noticeList: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  noticePreviewItem: {
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    padding: '0.75rem 1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
  },
  noticeMetaHeader: { display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', flexWrap: 'wrap' },
  noticePreviewBody: { fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4' },
  
  // Warden Stats grid
  cardsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' },
  cardMini: { border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', background: 'var(--surface)' },
  cardMiniLabel: { color: 'var(--text-muted)', fontSize: '0.8rem' },
  cardMiniVal: { fontSize: '1.6rem', fontWeight: 700, color: 'var(--accent)' },
  
  progressBarBg: { width: '100%', height: '6px', background: 'var(--bg)', borderRadius: '3px', overflow: 'hidden', marginTop: '0.5rem' },
  progressBarVal: { height: '100%', background: 'var(--accent)' },

  cards: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2.5rem' },
  cardLabel: { color: 'var(--text-muted)', fontSize: '0.85rem' },
  cardValue: { fontSize: '1.6rem', fontWeight: 700, color: 'var(--accent)' },
  cardLink: { display: 'inline-block', marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--accent)', textDecoration: 'underline' },
  section: { flex: 1 },
  sectionTitle: { fontSize: '1.15rem', fontWeight: 600, margin: '0 0 1rem 0' },
  errorBanner: { background: 'rgba(239, 68, 68, 0.12)', color: '#fca5a5', border: '1px solid var(--danger)', padding: '0.75rem 1rem', borderRadius: 'var(--radius)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' },
  retryBtn: { background: 'var(--danger)', color: '#fff', border: 'none', padding: '0.35rem 0.75rem', borderRadius: 6, fontSize: '0.875rem', fontWeight: 500 },
  
  superBanner: {
    borderRadius: 'var(--radius)',
    padding: '1rem 1.5rem',
    marginBottom: '2rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
    fontSize: '0.9rem',
    flexWrap: 'wrap',
  },
  superBtn: {
    background: '#1e293b',
    color: '#e2e8f0',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    fontSize: '0.85rem',
    fontWeight: 600,
    textDecoration: 'none',
    border: '1px solid var(--border)',
  },
  superBtnAccent: {
    background: 'var(--accent)',
    color: '#ffffff',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    fontSize: '0.85rem',
    fontWeight: 600,
    textDecoration: 'none',
  },

  // Timeline & Stepper Styles
  stepperCard: {
    padding: '2rem 1.5rem',
    borderRadius: 'var(--radius)',
    marginTop: '1rem',
  },
  stepperContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
    position: 'relative',
    marginTop: '1.5rem',
    flexWrap: 'wrap',
    gap: '1.5rem',
  },
  stepItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    flex: '1 1 120px',
    position: 'relative',
    zIndex: 1,
  },
  stepIndicator: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '1rem',
    transition: 'all 0.3s ease',
  },
  stepCompleted: {
    background: 'rgba(34, 197, 94, 0.15)',
    color: '#22c55e',
    border: '2px solid #22c55e',
  },
  stepCompletedErr: {
    background: 'rgba(239, 68, 68, 0.15)',
    color: 'var(--danger)',
    border: '2px solid var(--danger)',
  },
  stepCurrent: {
    background: 'rgba(59, 130, 246, 0.2)',
    color: 'var(--accent)',
    border: '2px solid var(--accent)',
    boxShadow: 'var(--neon-shadow)',
  },
  stepLocked: {
    background: 'var(--bg)',
    color: 'var(--text-muted)',
    border: '2px solid var(--border)',
  },
  stepContent: {
    marginTop: '0.75rem',
  },
  stepLabel: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: 'var(--text)',
  },
  stepDesc: {
    fontSize: '0.7rem',
    color: 'var(--text-muted)',
    marginTop: '0.15rem',
    display: 'block',
  },
  stepConnector: {
    position: 'absolute',
    top: '20px',
    left: 'calc(50% + 20px)',
    width: 'calc(100% - 40px)',
    height: '2px',
    background: 'var(--border)',
    zIndex: -1,
  },
  stepConnectorActive: {
    background: 'var(--accent)',
    boxShadow: 'var(--neon-shadow)',
  },

  // Onboarding Form Styles
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.75rem',
  },
  formSection: {
    borderBottom: '1px solid var(--border)',
    paddingBottom: '1.5rem',
  },
  formSecTitle: {
    fontSize: '0.95rem',
    fontWeight: 600,
    color: 'var(--accent)',
    margin: '0 0 1rem 0',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  formRow: {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    flex: '1 1 200px',
  },
  fieldLabel: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    fontWeight: 500,
  },
  input: {
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    color: 'var(--text)',
    padding: '0.75rem',
    fontSize: '0.9rem',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  otpBox: {
    background: 'rgba(255,255,255,0.01)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    padding: '1.25rem',
    marginTop: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  otpBtn: {
    background: 'var(--accent)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '0.75rem 1.25rem',
    fontWeight: 600,
    fontSize: '0.85rem',
    cursor: 'pointer',
  },
  otpInputRow: {
    marginTop: '0.5rem',
    borderTop: '1px dashed var(--border)',
    paddingTop: '0.75rem',
  },
  otpVerifyBtn: {
    background: '#10b981',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '0.75rem 1rem',
    fontWeight: 600,
    fontSize: '0.85rem',
    cursor: 'pointer',
  },
  otpVerifiedBadge: {
    background: 'rgba(16, 185, 129, 0.12)',
    color: '#34d399',
    border: '1px solid #10b981',
    borderRadius: '6px',
    padding: '0.5rem',
    textAlign: 'center',
    fontSize: '0.85rem',
    fontWeight: 600,
  },
  uploadBox: {
    border: '2px dashed var(--border)',
    borderRadius: '8px',
    padding: '1.5rem',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    background: 'rgba(0,0,0,0.2)',
    cursor: 'pointer',
  },
  photoPreviewCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
  },
  photoPreview: {
    width: '90px',
    height: '90px',
    borderRadius: '8px',
    objectFit: 'cover',
    border: '2px solid var(--accent)',
  },
  submitBtn: {
    background: 'var(--accent)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '0.85rem',
    fontWeight: 700,
    fontSize: '1rem',
    cursor: 'pointer',
    boxShadow: 'var(--neon-shadow)',
  },
  verifiedBtn: {
    background: '#10b981',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '0.75rem 1rem',
    fontWeight: 600,
    fontSize: '0.85rem',
    cursor: 'default',
  },
  inlineOtpBox: {
    display: 'flex',
    gap: '0.5rem',
    marginTop: '0.5rem',
    alignItems: 'center',
    background: 'rgba(255,255,255,0.02)',
    border: '1px dashed var(--border)',
    borderRadius: '8px',
    padding: '0.5rem',
  },
  inlineOtpInput: {
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: '6px',
    color: 'var(--text)',
    padding: '0.5rem',
    fontSize: '0.85rem',
    width: '100px',
    textAlign: 'center',
    outline: 'none',
  },
  inlineOtpVerifyBtn: {
    background: 'var(--accent)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    padding: '0.5rem 1rem',
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  inlineOtpError: {
    color: 'var(--danger)',
    fontSize: '0.75rem',
    marginTop: '0.25rem',
    display: 'block',
  },
};

