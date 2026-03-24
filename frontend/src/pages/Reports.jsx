import React, { useState, useCallback } from 'react';
import client from '../api/client.js';
import { useToast } from '../components/Toast.jsx';
import Badge, { statusBadge, priorityBadge } from '../components/Badge.jsx';
import ReportsIcon from '../icons/ReportsIcon.jsx';
import ScheduleIcon from '../icons/ScheduleIcon.jsx';
import EquipmentIcon from '../icons/EquipmentIcon.jsx';
import TechnicianIcon from '../icons/TechnicianIcon.jsx';

function formatDate(d) {
  if (!d) return '—';
  const date = new Date(d);
  if (isNaN(date)) return d;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

const reportCards = [
  {
    id: 'completion',
    Icon: ReportsIcon,
    title: 'Completion Rate Report',
    desc: 'PM task completion rates and trends by equipment and technician'
  },
  {
    id: 'overdue',
    Icon: ScheduleIcon,
    title: 'Overdue Tasks Report',
    desc: 'All overdue maintenance tasks with equipment details and assigned technicians'
  },
  {
    id: 'equipment',
    Icon: EquipmentIcon,
    title: 'Equipment History',
    desc: 'Complete maintenance history and status report for all equipment'
  },
  {
    id: 'workload',
    Icon: TechnicianIcon,
    title: 'Technician Workload',
    desc: 'Work distribution, open orders, and performance metrics per technician'
  }
];

export default function Reports() {
  const [activeReport, setActiveReport] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const generateReport = useCallback(async (reportId) => {
    setLoading(true);
    setActiveReport(reportId);
    setReportData(null);
    try {
      const [schedule, equipment, workOrders, technicians] = await Promise.all([
        client.get('/schedule', { params: { limit: 10000 } }),
        client.get('/equipment', { params: { limit: 10000 } }),
        client.get('/workorders'),
        client.get('/technicians'),
      ]);

      const s = schedule.data.data ?? [];
      const e = equipment.data.data ?? [];
      const w = workOrders.data;
      const t = technicians.data;

      if (reportId === 'completion') {
        const total = s.length;
        const done = s.filter(t => t.lastDone).length;
        const overdue = s.filter(t => t.status === 'Overdue').length;
        const scheduled = s.filter(t => t.status === 'Scheduled').length;
        const dueToday = s.filter(t => t.status === 'Due Today').length;

        const woTotal = w.length;
        const woCompleted = w.filter(wo => wo.status === 'Completed').length;
        const woPct = woTotal > 0 ? Math.round((woCompleted / woTotal) * 100) : 0;

        const byFreq = {};
        s.forEach(task => {
          if (!byFreq[task.frequency]) byFreq[task.frequency] = { total: 0, done: 0 };
          byFreq[task.frequency].total++;
          if (task.lastDone) byFreq[task.frequency].done++;
        });

        setReportData({
          type: 'completion',
          title: 'PM Completion Rate Report',
          stats: [
            { label: 'Total PM Tasks', value: total },
            { label: 'Tasks with Last Done Date', value: done },
            { label: 'Overdue Tasks', value: overdue, color: 'var(--red)' },
            { label: 'Scheduled Tasks', value: scheduled, color: 'var(--blue)' },
            { label: 'Due Today', value: dueToday, color: 'var(--yellow)' },
            { label: 'Work Order Completion Rate', value: `${woPct}%`, color: 'var(--green)' },
            { label: 'Work Orders Completed', value: `${woCompleted} / ${woTotal}` },
          ],
          breakdown: { label: 'By Frequency', data: byFreq }
        });

      } else if (reportId === 'overdue') {
        const overdueTasks = s.filter(t => t.status === 'Overdue');
        const overdueByPriority = { Critical: 0, High: 0, Medium: 0, Low: 0 };
        overdueTasks.forEach(t => { if (overdueByPriority[t.priority] !== undefined) overdueByPriority[t.priority]++; });

        setReportData({
          type: 'overdue',
          title: 'Overdue Tasks Report',
          tasks: overdueTasks,
          stats: [
            { label: 'Total Overdue Tasks', value: overdueTasks.length, color: 'var(--red)' },
            { label: 'Critical Priority', value: overdueByPriority.Critical, color: 'var(--red)' },
            { label: 'High Priority', value: overdueByPriority.High, color: 'var(--accent)' },
            { label: 'Medium Priority', value: overdueByPriority.Medium, color: 'var(--yellow)' },
            { label: 'Low Priority', value: overdueByPriority.Low, color: 'var(--blue)' },
          ]
        });

      } else if (reportId === 'equipment') {
        const woByEquip = {};
        w.forEach(wo => {
          if (!woByEquip[wo.equipment]) woByEquip[wo.equipment] = { total: 0, open: 0, completed: 0 };
          woByEquip[wo.equipment].total++;
          if (wo.status === 'Completed') woByEquip[wo.equipment].completed++;
          else woByEquip[wo.equipment].open++;
        });

        const pmByEquip = {};
        s.forEach(task => {
          if (!pmByEquip[task.equipmentName]) pmByEquip[task.equipmentName] = { total: 0, overdue: 0 };
          pmByEquip[task.equipmentName].total++;
          if (task.status === 'Overdue') pmByEquip[task.equipmentName].overdue++;
        });

        setReportData({
          type: 'equipment',
          title: 'Equipment History Report',
          equipment: e,
          woByEquip,
          pmByEquip,
          stats: [
            { label: 'Total Equipment', value: e.length },
            { label: 'Active', value: e.filter(eq => eq.status === 'Active').length, color: 'var(--green)' },
            { label: 'Under Maintenance', value: e.filter(eq => eq.status === 'Under Maintenance').length, color: 'var(--yellow)' },
            { label: 'Inactive', value: e.filter(eq => eq.status === 'Inactive').length, color: 'var(--text3)' },
          ]
        });

      } else if (reportId === 'workload') {
        const techWorkload = t.map(tech => {
          const openWOs = w.filter(wo => wo.assignedTo === tech.name && wo.status !== 'Completed').length;
          const completedWOs = w.filter(wo => wo.assignedTo === tech.name && wo.status === 'Completed').length;
          const pmTasks = s.filter(task => task.assignedName === tech.name).length;
          const overduePM = s.filter(task => task.assignedName === tech.name && task.status === 'Overdue').length;
          return { ...tech, openWOs, completedWOs, pmTasks, overduePM, total: openWOs + completedWOs };
        });

        setReportData({
          type: 'workload',
          title: 'Technician Workload Report',
          technicians: techWorkload,
          stats: [
            { label: 'Total Technicians', value: t.length },
            { label: 'Total Open Work Orders', value: w.filter(wo => wo.status !== 'Completed').length },
            { label: 'Total PM Tasks Assigned', value: s.length },
          ]
        });
      }
    } catch (err) {
      toast('Failed to generate report', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">Reports & Analytics</div>
          <div className="page-subtitle">Generate maintenance reports</div>
        </div>
      </div>

      <div className="report-grid">
        {reportCards.map(card => {
          const Icon = card.Icon;
          return (
            <div
              key={card.id}
              className="report-card"
              onClick={() => generateReport(card.id)}
              style={{ borderColor: activeReport === card.id ? 'var(--accent)' : undefined }}
            >
              <div className="report-card-icon">
                <Icon size={28} color="var(--accent)" />
              </div>
              <div className="report-card-title">{card.title}</div>
              <div className="report-card-desc">{card.desc}</div>
              <div style={{ marginTop: 16 }}>
                <span className="btn btn-ghost btn-sm">Generate Report →</span>
              </div>
            </div>
          );
        })}
      </div>

      {loading && (
        <div className="loading-state"><div className="spinner" /><span>Generating report...</span></div>
      )}

      {reportData && !loading && (
        <div className="report-output">
          <div className="report-title">{reportData.title}</div>
          <div className="report-meta">Generated on {new Date().toLocaleString('en-IN')}</div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 24 }}>
            {(reportData.stats || []).map((stat, i) => (
              <div key={i} style={{ background: 'var(--bg2)', borderRadius: 'var(--radius)', padding: '14px 16px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: stat.color || 'var(--text)', fontFamily: 'var(--font-head)' }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text3)', marginTop: 4 }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Completion Breakdown */}
          {reportData.type === 'completion' && reportData.breakdown && (
            <div>
              <div style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>{reportData.breakdown.label}</div>
              {Object.entries(reportData.breakdown.data).map(([freq, data]) => (
                <div className="report-stat-row" key={freq}>
                  <span className="report-stat-label">{freq}</span>
                  <span className="report-stat-value">{data.done} / {data.total} tasks have been completed</span>
                </div>
              ))}
            </div>
          )}

          {/* Overdue Table */}
          {reportData.type === 'overdue' && (
            <div style={{ overflowX: 'auto' }}>
              {reportData.tasks.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon" style={{ display: 'flex', justifyContent: 'center' }}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4, color: 'var(--green)' }}>
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                  <h3>No Overdue Tasks</h3>
                  <p>All tasks are on schedule!</p>
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Task ID</th>
                      <th>Equipment</th>
                      <th>Description</th>
                      <th>Next Due</th>
                      <th>Assigned To</th>
                      <th>Priority</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.tasks.map(task => (
                      <tr key={task.id} className="row-overdue">
                        <td className="mono">{task.id}</td>
                        <td style={{ color: 'var(--text)', fontWeight: 500 }}>{task.equipmentName}</td>
                        <td>{task.description}</td>
                        <td style={{ color: 'var(--red)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{formatDate(task.nextDue)}</td>
                        <td>{task.assignedName || '—'}</td>
                        <td><Badge type={priorityBadge(task.priority)}>{task.priority}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Equipment Table */}
          {reportData.type === 'equipment' && (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Install Date</th>
                    <th>Last Maintenance</th>
                    <th>Open WOs</th>
                    <th>PM Tasks</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.equipment.map(eq => (
                    <tr key={eq.id}>
                      <td className="mono">{eq.id}</td>
                      <td style={{ color: 'var(--text)', fontWeight: 500 }}>{eq.name}</td>
                      <td>{eq.category}</td>
                      <td><Badge type={statusBadge(eq.status)}>{eq.status}</Badge></td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{formatDate(eq.installDate)}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{formatDate(eq.lastMaintenance)}</td>
                      <td style={{ color: reportData.woByEquip[eq.name]?.open > 0 ? 'var(--accent)' : 'var(--text3)' }}>
                        {reportData.woByEquip[eq.name]?.open || 0}
                      </td>
                      <td>
                        {reportData.pmByEquip[eq.name]?.total || 0}
                        {reportData.pmByEquip[eq.name]?.overdue > 0 && (
                          <span style={{ color: 'var(--red)', marginLeft: 6, fontSize: '0.75rem' }}>
                            ({reportData.pmByEquip[eq.name].overdue} overdue)
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Workload Table */}
          {reportData.type === 'workload' && (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Technician</th>
                    <th>ID</th>
                    <th>Specialization</th>
                    <th>Open WOs</th>
                    <th>Completed WOs</th>
                    <th>PM Tasks Assigned</th>
                    <th>Overdue PM</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.technicians.map(tech => (
                    <tr key={tech.id}>
                      <td style={{ color: 'var(--text)', fontWeight: 500 }}>{tech.name}</td>
                      <td className="mono">{tech.id}</td>
                      <td><Badge type="info">{tech.specialization}</Badge></td>
                      <td style={{ color: tech.openWOs > 0 ? 'var(--accent)' : 'var(--text3)' }}>{tech.openWOs}</td>
                      <td style={{ color: 'var(--green)' }}>{tech.completedWOs}</td>
                      <td>{tech.pmTasks}</td>
                      <td style={{ color: tech.overduePM > 0 ? 'var(--red)' : 'var(--green)' }}>
                        {tech.overduePM > 0 ? tech.overduePM : '0'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
