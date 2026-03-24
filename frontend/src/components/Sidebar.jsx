import React, { useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import DashboardIcon from '../icons/DashboardIcon.jsx';
import EquipmentIcon from '../icons/EquipmentIcon.jsx';
import ScheduleIcon from '../icons/ScheduleIcon.jsx';
import WorkOrderIcon from '../icons/WorkOrderIcon.jsx';
import TechnicianIcon from '../icons/TechnicianIcon.jsx';
import ReportsIcon from '../icons/ReportsIcon.jsx';
import GearIcon from '../icons/GearIcon.jsx';
import LockIcon from '../icons/LockIcon.jsx';
import LogoutIcon from '../icons/LogoutIcon.jsx';
import UserIcon from '../icons/UserIcon.jsx';

const navItems = [
  { to: '/dashboard', icon: DashboardIcon, label: 'Dashboard' },
  { to: '/equipment', icon: EquipmentIcon, label: 'Equipment' },
  { to: '/schedule', icon: ScheduleIcon, label: 'PM Schedule' },
  { to: '/workorders', icon: WorkOrderIcon, label: 'Work Orders' },
  { to: '/technicians', icon: TechnicianIcon, label: 'Technicians' },
  { to: '/reports', icon: ReportsIcon, label: 'Reports' },
];

export default function Sidebar({ isOpen }) {
  const { user, isAdmin, login, logout } = useAuth();
  const [showPopover, setShowPopover] = useState(false);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [logging, setLogging] = useState(false);
  const popoverRef = useRef(null);

  useEffect(() => {
    if (!showPopover) return;
    function handleClick(e) {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setShowPopover(false);
        setLoginError('');
        setLoginUsername('');
        setLoginPassword('');
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showPopover]);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLogging(true);
    setLoginError('');
    try {
      await login(loginUsername, loginPassword);
      setShowPopover(false);
      setLoginUsername('');
      setLoginPassword('');
    } catch (err) {
      const status = err.response?.status;
      setLoginError(status === 401 ? 'Wrong username or password' : 'Login failed, please try again');
    } finally {
      setLogging(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <aside className={`sidebar${isOpen ? ' open' : ''}`}>
      <div className="sidebar-logo">
        <img src="/logo.svg" alt="ProMaint" className="sidebar-logo-img" />
        <span className="sidebar-logo-text">Pro<span>Maint</span></span>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Navigation</div>
        {navItems.map(item => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <span className="nav-item-icon"><Icon size={18} /></span>
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer" style={{ position: 'relative' }}>
        {isAdmin ? (
          <>
            <div className="sidebar-user">
              <div className="sidebar-user-avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UserIcon size={16} />
              </div>
              <div>
                <div className="sidebar-user-name">{user?.name || 'Admin User'}</div>
                <div className="sidebar-user-role">System Manager</div>
              </div>
            </div>
            <button className="sidebar-logout" onClick={handleLogout}>
              <LogoutIcon size={16} />
              Logout
            </button>
          </>
        ) : (
          <div ref={popoverRef} style={{ width: '100%' }}>
            {showPopover && (
              <div style={{
                position: 'absolute',
                bottom: '100%',
                left: 0,
                right: 0,
                marginBottom: 8,
                background: 'var(--bg2)',
                border: '1px solid var(--border2)',
                borderRadius: 'var(--radius)',
                padding: '16px',
                boxShadow: '0 -4px 24px rgba(0,0,0,0.4)',
                zIndex: 100,
              }}>
                <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: '0.85rem', marginBottom: 12 }}>Admin Login</div>
                <form onSubmit={handleAdminLogin}>
                  <div style={{ marginBottom: 8 }}>
                    <input
                      type="text"
                      placeholder="Username"
                      value={loginUsername}
                      onChange={e => setLoginUsername(e.target.value)}
                      autoFocus
                      style={{
                        width: '100%',
                        padding: '7px 10px',
                        background: 'var(--bg3)',
                        border: '1px solid var(--border)',
                        borderRadius: 6,
                        color: 'var(--text)',
                        fontSize: '0.82rem',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    <input
                      type="password"
                      placeholder="Password"
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '7px 10px',
                        background: 'var(--bg3)',
                        border: '1px solid var(--border)',
                        borderRadius: 6,
                        color: 'var(--text)',
                        fontSize: '0.82rem',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  {loginError && (
                    <div style={{ color: 'var(--red)', fontSize: '0.75rem', marginBottom: 8 }}>{loginError}</div>
                  )}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      style={{ flex: 1, justifyContent: 'center' }}
                      onClick={() => { setShowPopover(false); setLoginError(''); }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary btn-sm"
                      style={{ flex: 1, justifyContent: 'center' }}
                      disabled={logging}
                    >
                      {logging ? '...' : 'Login'}
                    </button>
                  </div>
                </form>
              </div>
            )}
            <button
              className="sidebar-logout"
              onClick={() => { setShowPopover(v => !v); setLoginError(''); }}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <LockIcon size={16} />
              Admin Login
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
