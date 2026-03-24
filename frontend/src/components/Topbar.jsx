import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import client from '../api/client.js';
import SearchIcon from '../icons/SearchIcon.jsx';
import MenuIcon from '../icons/MenuIcon.jsx';
import BellIcon from '../icons/BellIcon.jsx';

const routeTitles = {
  '/dashboard': 'Dashboard',
  '/equipment': 'Equipment',
  '/schedule': 'PM Schedule',
  '/workorders': 'Work Orders',
  '/technicians': 'Technicians',
  '/reports': 'Reports'
};

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Cached so we don't refetch on every keystroke
let allData = null;

async function loadAllData() {
  if (allData) return allData;
  const [eq, sc, wo, tech] = await Promise.all([
    client.get('/equipment', { params: { page: 1, limit: 1000 } }).then(r => r.data.data).catch(() => []),
    client.get('/schedule', { params: { page: 1, limit: 1000 } }).then(r => r.data.data).catch(() => []),
    client.get('/workorders').then(r => r.data).catch(() => []),
    client.get('/technicians').then(r => r.data).catch(() => []),
  ]);
  allData = { equipment: eq, schedule: sc, workorders: wo, technicians: tech };
  return allData;
}

function searchAll(data, q) {
  const lq = q.toLowerCase();
  const results = [];

  data.equipment.forEach(e => {
    if ([e.id, e.name, e.category, e.location, e.status].some(v => v?.toLowerCase().includes(lq))) {
      results.push({ type: 'Equipment', label: e.name, sub: `${e.id} · ${e.category} · ${e.location}`, route: '/equipment', badge: e.status });
    }
  });

  data.schedule.forEach(t => {
    if ([t.id, t.description, t.equipmentName, t.priority, t.status].some(v => v?.toLowerCase().includes(lq))) {
      results.push({ type: 'PM Schedule', label: t.description, sub: `${t.id} · ${t.equipmentName} · Due ${formatDate(t.nextDue)}`, route: '/schedule', badge: t.status });
    }
  });

  data.workorders.forEach(w => {
    if ([w.num, w.description, w.equipment, w.type, w.status, w.priority].some(v => v?.toLowerCase().includes(lq))) {
      results.push({ type: 'Work Order', label: w.description, sub: `${w.num} · ${w.equipment} · ${w.type}`, route: '/workorders', badge: w.status });
    }
  });

  data.technicians.forEach(t => {
    if ([t.id, t.name, t.specialization, t.status].some(v => v?.toLowerCase().includes(lq))) {
      results.push({ type: 'Technician', label: t.name, sub: `${t.id} · ${t.specialization}`, route: '/technicians', badge: t.status });
    }
  });

  return results.slice(0, 12);
}

const typeColors = {
  'Equipment': 'var(--blue)',
  'PM Schedule': 'var(--yellow)',
  'Work Order': 'var(--purple)',
  'Technician': 'var(--green)',
};

export default function Topbar({ onMenuToggle }) {
  const location = useLocation();
  const navigate = useNavigate();
  const title = routeTitles[location.pathname] || 'ProMaint';

  const [overdueTasks, setOverdueTasks] = useState([]);
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef(null);

  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const searchRef = useRef(null);

  useEffect(() => {
    client.get('/schedule', { params: { limit: 1000 } }).then(res => {
      setOverdueTasks((res.data.data ?? []).filter(t => t.status === 'Overdue'));
    }).catch(() => {});
  }, [location.pathname]);

  // Close bell on outside click
  useEffect(() => {
    if (!bellOpen) return;
    function handle(e) {
      if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [bellOpen]);

  // Close search on outside click
  useEffect(() => {
    if (!searchOpen) return;
    function handle(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [searchOpen]);

  // Run search
  useEffect(() => {
    const q = search.trim();
    if (!q) { setSearchResults([]); setSearchOpen(false); return; }
    setSearchLoading(true);
    setActiveIdx(-1);
    loadAllData().then(data => {
      setSearchResults(searchAll(data, q));
      setSearchOpen(true);
      setSearchLoading(false);
    });
  }, [search]);

  // Clear search on route change
  useEffect(() => {
    setSearch('');
    setSearchOpen(false);
  }, [location.pathname]);

  const handleResultClick = useCallback((route) => {
    navigate(route);
    setSearch('');
    setSearchOpen(false);
  }, [navigate]);

  const handleKeyDown = (e) => {
    if (!searchOpen || searchResults.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, searchResults.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter' && activeIdx >= 0) { handleResultClick(searchResults[activeIdx].route); }
    else if (e.key === 'Escape') { setSearchOpen(false); setSearch(''); }
  };

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
  });

  return (
    <header className="topbar">
      <button className="btn btn-ghost btn-sm" onClick={onMenuToggle} style={{ display: 'none' }} aria-label="Menu">
        <MenuIcon size={20} />
      </button>
      <div className="topbar-title">{title}</div>

      {/* Search */}
      <div className="topbar-search" ref={searchRef}>
        <span className="topbar-search-icon"><SearchIcon size={16} /></span>
        <input
          type="text"
          placeholder="Search equipment, tasks, work orders..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => search.trim() && searchResults.length > 0 && setSearchOpen(true)}
          autoComplete="off"
        />
        {searchOpen && (
          <div className="search-dropdown">
            {searchLoading ? (
              <div className="search-loading">Searching...</div>
            ) : searchResults.length === 0 ? (
              <div className="search-empty">No results for "{search}"</div>
            ) : (
              searchResults.map((r, i) => (
                <div
                  key={i}
                  className={`search-result-item${i === activeIdx ? ' active' : ''}`}
                  onMouseDown={() => handleResultClick(r.route)}
                  onMouseEnter={() => setActiveIdx(i)}
                >
                  <div className="search-result-top">
                    <span className="search-result-type" style={{ color: typeColors[r.type] || 'var(--text3)' }}>
                      {r.type}
                    </span>
                    <span className="search-result-badge">{r.badge}</span>
                  </div>
                  <div className="search-result-label">{r.label}</div>
                  <div className="search-result-sub">{r.sub}</div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div className="topbar-spacer" />
      <span className="topbar-date">{today}</span>

      {/* Bell */}
      <div ref={bellRef} style={{ position: 'relative' }}>
        <button className="topbar-bell" onClick={() => setBellOpen(v => !v)} title="Overdue alerts">
          <BellIcon size={18} />
          {overdueTasks.length > 0 && (
            <span className="topbar-bell-badge">{overdueTasks.length}</span>
          )}
        </button>

        {bellOpen && (
          <div className="notif-dropdown">
            <div className="notif-header">
              <span className="notif-title">Overdue Tasks</span>
              {overdueTasks.length > 0 && <span className="notif-count">{overdueTasks.length}</span>}
            </div>
            <div className="notif-body">
              {overdueTasks.length === 0 ? (
                <div className="notif-empty">
                  <span style={{ fontSize: '1.5rem' }}>✅</span>
                  <span>No overdue tasks</span>
                </div>
              ) : (
                <>
                  {overdueTasks.slice(0, 10).map(t => (
                    <div className="notif-item" key={t.id}>
                      <div className="notif-item-top">
                        <span className="notif-item-id">{t.id}</span>
                        <span className="notif-item-due">Due: {formatDate(t.nextDue)}</span>
                      </div>
                      <div className="notif-item-desc">{t.description}</div>
                      <div className="notif-item-equip">{t.equipmentName}</div>
                    </div>
                  ))}
                  {overdueTasks.length > 10 && (
                    <div className="notif-more" onClick={() => { navigate('/schedule'); setBellOpen(false); }}>
                      +{overdueTasks.length - 10} more overdue — View all
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
