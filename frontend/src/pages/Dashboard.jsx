import { useEffect, useRef, useState, memo } from 'react';
import client from '../api/client.js';
import Badge, { statusBadge, priorityBadge } from '../components/Badge.jsx';
import EquipmentIcon from '../icons/EquipmentIcon.jsx';
import ScheduleIcon from '../icons/ScheduleIcon.jsx';
import CheckIcon from '../icons/CheckIcon.jsx';
import WorkOrderIcon from '../icons/WorkOrderIcon.jsx';

function useCountUp(target, duration = 1000) {
  const [value, setValue] = useState(0);
  const prevTarget = useRef(null);
  useEffect(() => {
    // Skip if target hasn't changed (prevents re-animation on re-renders)
    if (prevTarget.current === target) return;
    prevTarget.current = target;
    if (target === 0) { setValue(0); return; }
    let start = null;
    let raf;
    const step = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      setValue(Math.floor(progress * target));
      if (progress < 1) raf = requestAnimationFrame(step);
      else setValue(target);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

function DonutChart({ data }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;
    const radius = Math.min(W, H) / 2 - 8;
    const innerRadius = radius * 0.62;

    ctx.clearRect(0, 0, W, H);

    const colors = ['#22c55e', '#eab308', '#64748b'];
    const values = [data.Active || 0, data['Under Maintenance'] || 0, data.Inactive || 0];
    const total = values.reduce((a, b) => a + b, 0);

    if (total === 0) {
      ctx.fillStyle = '#1e2230';
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    let startAngle = -Math.PI / 2;

    values.forEach((val, i) => {
      if (val === 0) return;
      const sliceAngle = (val / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, startAngle, startAngle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = colors[i];
      ctx.fill();
      startAngle += sliceAngle;
    });

    // Inner circle (donut hole)
    ctx.beginPath();
    ctx.arc(cx, cy, innerRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#1a1d27';
    ctx.fill();

    // Center text
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 18px Poppins, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(total, cx, cy - 8);
    ctx.fillStyle = '#64748b';
    ctx.font = '10px Poppins, sans-serif';
    ctx.fillText('Total', cx, cy + 10);
  }, [data]);

  return <canvas ref={canvasRef} width={140} height={140} />;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  const now = new Date();
  const diff = Math.floor((now - d) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 0) return `In ${Math.abs(diff)} days`;
  return `${diff} days ago`;
}

// Module-level cache — survives route changes, avoids reload flicker
let cachedDashboard = null;

function Dashboard() {
  const [data, setData] = useState(cachedDashboard);
  const [loading, setLoading] = useState(cachedDashboard === null);

  const totalEquipment = useCountUp(data?.totalEquipment || 0);
  const overdueTasks = useCountUp(data?.overdueTasks || 0);
  const completedThisMonth = useCountUp(data?.completedThisMonth || 0);
  const openWorkOrders = useCountUp(data?.openWorkOrders || 0);

  useEffect(() => {
    if (cachedDashboard) return;
    client.get('/dashboard')
      .then(res => {
        cachedDashboard = res.data;
        setData(res.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="page">
        <div className="loading-state">
          <div className="spinner" />
          <span>Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">Operations Dashboard</div>
          <div className="page-subtitle">Real-time maintenance overview</div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card blue">
          <div className="kpi-icon blue"><EquipmentIcon size={22} /></div>
          <div className="kpi-info">
            <div className="kpi-value blue">{totalEquipment}</div>
            <div className="kpi-label">Total Equipment</div>
          </div>
        </div>
        <div className="kpi-card orange">
          <div className="kpi-icon orange"><ScheduleIcon size={22} /></div>
          <div className="kpi-info">
            <div className="kpi-value orange">{overdueTasks}</div>
            <div className="kpi-label">Overdue Tasks</div>
          </div>
        </div>
        <div className="kpi-card green">
          <div className="kpi-icon green"><CheckIcon size={22} /></div>
          <div className="kpi-info">
            <div className="kpi-value green">{completedThisMonth}</div>
            <div className="kpi-label">Completed This Month</div>
          </div>
        </div>
        <div className="kpi-card purple">
          <div className="kpi-icon purple"><WorkOrderIcon size={22} /></div>
          <div className="kpi-info">
            <div className="kpi-value purple">{openWorkOrders}</div>
            <div className="kpi-label">Open Work Orders</div>
          </div>
        </div>
      </div>

      {/* Row 1: Upcoming PM Tasks — full width */}
      <div className="panel" style={{ marginBottom: 16 }}>
        <div className="panel-header">
          <h2>Upcoming PM Tasks</h2>
          <span className="count-badge">{data?.upcomingTasks?.length || 0}</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Equipment</th>
                <th>Task</th>
                <th>Due Date</th>
                <th>Priority</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(data?.upcomingTasks || []).length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text3)', padding: 30 }}>No upcoming tasks</td></tr>
              ) : (
                (data?.upcomingTasks || []).map(task => (
                  <tr key={task.id} className={task.status === 'Overdue' ? 'row-overdue' : ''}>
                    <td style={{ color: 'var(--text)', fontWeight: 500 }}>{task.equipmentName}</td>
                    <td style={{ color: 'var(--text2)' }}>{task.description}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: task.status === 'Overdue' ? 'var(--red)' : 'var(--text2)' }}>
                      {formatDate(task.nextDue)}
                    </td>
                    <td>{task.priority ? <Badge type={priorityBadge(task.priority)}>{task.priority}</Badge> : '—'}</td>
                    <td><Badge type={statusBadge(task.status)}>{task.status}</Badge></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Row 2: Equipment Status + Recent Activity */}
      <div className="dashboard-row">
        {/* Equipment Status Donut */}
        <div className="panel">
          <div className="panel-header">
            <h2>Equipment Status</h2>
          </div>
          <div className="chart-wrap" style={{ flexDirection: 'column', gap: 20, padding: 30 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
              <DonutChart data={data?.equipmentStatusCounts || {}} />
              <div className="donut-legend">
                {[
                  { label: 'Active', color: '#22c55e', key: 'Active' },
                  { label: 'Under Maintenance', color: '#eab308', key: 'Under Maintenance' },
                  { label: 'Inactive', color: '#64748b', key: 'Inactive' },
                ].map(item => (
                  <div className="legend-item" key={item.key}>
                    <div className="legend-dot" style={{ background: item.color }} />
                    <span className="legend-label">{item.label}</span>
                    <span className="legend-value" style={{ marginLeft: 12 }}>
                      {data?.equipmentStatusCounts?.[item.key] || 0}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="panel">
          <div className="panel-header">
            <h2>Recent Activity</h2>
          </div>
          <div style={{ padding: '12px 0' }}>
            {(data?.activity || []).length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <ScheduleIcon size={32} />
                </div>
                <p>No recent activity</p>
              </div>
            ) : (
              (data?.activity || []).map(item => (
                <div className="activity-item" key={item.id}>
                  <span className="activity-icon">{item.icon}</span>
                  <span className="activity-msg">{item.message}</span>
                  <span className="activity-time">{timeAgo(item.time)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(Dashboard);
