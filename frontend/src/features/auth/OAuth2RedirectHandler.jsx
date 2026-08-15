import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../../api/client';
import { ShieldAlert, Loader2 } from 'lucide-react';

export default function OAuth2RedirectHandler({ onLoginSuccess }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    
    if (token) {
      // Temporarily set token so api.auth.me can use it
      localStorage.setItem('token', token);
      
      api.auth.me()
        .then(user => {
            const loginData = {
                token: token,
                username: user.username,
                role: user.role,
                name: user.name,
                studentId: user.studentId
            };
            localStorage.setItem('user', JSON.stringify(loginData));
            if (onLoginSuccess) {
                onLoginSuccess(loginData);
            }
            navigate('/');
        })
        .catch(err => {
            console.error('Failed to fetch user profile', err);
            localStorage.removeItem('token');
            setError('Failed to fetch your profile information. Please try again.');
        });
    } else {
      const errorParam = params.get('error');
      if (errorParam) {
          setError(errorParam);
      } else {
          setError('Authentication token missing.');
      }
    }
  }, [location, navigate, onLoginSuccess]);

  return (
    <div style={styles.container}>
      <div style={styles.card} className="glass-card">
        {error ? (
            <div style={styles.errorContainer}>
                <ShieldAlert size={32} style={{ color: '#ef4444', marginBottom: '1rem' }} />
                <h2 style={{ color: 'white', marginBottom: '1rem' }}>Authentication Failed</h2>
                <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>{error}</p>
                <button 
                    onClick={() => navigate('/login')} 
                    style={styles.button}
                >
                    Back to Login
                </button>
            </div>
        ) : (
            <div style={{ textAlign: 'center' }}>
                <Loader2 size={48} style={styles.spinner} className="animate-spin" />
                <h2 style={{ color: 'white', marginTop: '1.5rem' }}>Verifying Authentication...</h2>
                <p style={{ color: '#94a3b8', marginTop: '0.5rem' }}>Please wait while we log you in safely.</p>
            </div>
        )}
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
        padding: '3rem',
        maxWidth: 400,
        width: '100%',
        textAlign: 'center',
        background: 'rgba(10, 15, 38, 0.7)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(59, 130, 246, 0.1)',
        borderRadius: '16px',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
    },
    errorContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    },
    spinner: {
        color: '#3b82f6',
        animation: 'spin 1s linear infinite',
    },
    button: {
        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
        color: '#ffffff',
        border: 'none',
        borderRadius: '8px',
        padding: '0.8rem 1.5rem',
        fontSize: '0.95rem',
        fontWeight: 700,
        cursor: 'pointer',
        boxShadow: '0 4px 14px rgba(59, 130, 246, 0.3)',
    }
};
