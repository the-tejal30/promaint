import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const credentials = [
  { username: 'admin', password: 'admin123', role: 'admin', label: 'Administrator' },
  { username: 'rajesh', password: 'emp123', role: 'employee', label: 'Employee' },
  { username: 'priya', password: 'emp123', role: 'employee', label: 'Employee' },
];

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [detectedRole, setDetectedRole] = useState(null);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    const found = credentials.find(c => c.username === username);
    setDetectedRole(found ? found : null);
  }, [username]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="login-brand">
          <span className="login-gear">⚙</span>
          <div className="login-brand-name">Pro<span>Maint</span></div>
          <div className="login-tagline">Industrial Maintenance Management System</div>
          <div className="login-features">
            <div className="login-feature">
              <span className="login-feature-icon">🔧</span>
              <div>
                <div className="login-feature-title">Equipment Tracking</div>
                <div className="login-feature-text">Monitor all industrial assets in real-time</div>
              </div>
            </div>
            <div className="login-feature">
              <span className="login-feature-icon">📅</span>
              <div>
                <div className="login-feature-title">PM Scheduling</div>
                <div className="login-feature-text">Automated preventive maintenance planning</div>
              </div>
            </div>
            <div className="login-feature">
              <span className="login-feature-icon">📋</span>
              <div>
                <div className="login-feature-title">Work Orders</div>
                <div className="login-feature-text">Streamlined work order management</div>
              </div>
            </div>
            <div className="login-feature">
              <span className="login-feature-icon">📊</span>
              <div>
                <div className="login-feature-title">Analytics</div>
                <div className="login-feature-text">Comprehensive maintenance reporting</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="login-right">
        <div className="login-form-box">
          <div className="login-form-title">Welcome Back</div>
          <div className="login-form-subtitle">Sign in to your ProMaint account</div>

          {error && <div className="login-error">⚠ {error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="login-form-group">
              <label>Username</label>
              <input
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                autoFocus
                autoComplete="username"
              />
            </div>

            <div className="login-form-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <div className="login-form-group">
              <label>Role Detection</label>
              <div className="login-role-display">
                {detectedRole ? (
                  <>
                    <span>{detectedRole.role === 'admin' ? '👑' : '👤'}</span>
                    <span style={{ color: detectedRole.role === 'admin' ? 'var(--accent)' : 'var(--blue)' }}>
                      {detectedRole.label}
                    </span>
                  </>
                ) : (
                  <span>Enter username to detect role...</span>
                )}
              </div>
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Signing In...' : 'Sign In →'}
            </button>
          </form>

          <div className="login-hints">
            <div className="login-hints-title">Demo Credentials</div>
            <div className="login-hint-row">
              <span>👑 Admin</span>
              <span>
                <span className="mono">admin</span> / <span className="mono">admin123</span>
              </span>
            </div>
            <div className="login-hint-row">
              <span>👤 Employee</span>
              <span>
                <span className="mono">rajesh</span> / <span className="mono">emp123</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
