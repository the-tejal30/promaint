import React, { useEffect, useState, useCallback } from 'react';
import client from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';
import Modal from '../components/Modal.jsx';
import Badge, { statusBadge, priorityBadge } from '../components/Badge.jsx';
import PlusIcon from '../icons/PlusIcon.jsx';
import EditIcon from '../icons/EditIcon.jsx';
import TrashIcon from '../icons/TrashIcon.jsx';
import CheckIcon from '../icons/CheckIcon.jsx';
import SearchIcon from '../icons/SearchIcon.jsx';

const emptyForm = {
  equipmentId: '', equipmentName: '', description: '', frequency: 'Monthly',
  lastDone: '', nextDue: '', assignedTo: '', assignedName: '', priority: 'Medium', estimatedHours: 1
};

const frequencies = ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Annually'];
const priorities = ['Critical', 'High', 'Medium', 'Low'];

function formatDate(d) {
  if (!d) return '—';
  const date = new Date(d);
  if (isNaN(date)) return d;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function Schedule() {
  const [tasks, setTasks] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterFreq, setFilterFreq] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [saving, setSaving] = useState(false);
  const { isAdmin } = useAuth();
  const toast = useToast();

  const fetchAll = useCallback(() => {
    setLoading(true);
    Promise.all([
      client.get('/schedule'),
      client.get('/equipment'),
      client.get('/technicians')
    ]).then(([s, e, t]) => {
      setTasks(s.data);
      setEquipment(e.data);
      setTechnicians(t.data);
    }).catch(() => toast('Failed to load schedule', 'error'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filtered = tasks.filter(t => {
    const q = search.toLowerCase();
    const matchSearch = !q || t.description?.toLowerCase().includes(q) || t.equipmentName?.toLowerCase().includes(q) || t.id?.toLowerCase().includes(q);
    const matchFreq = !filterFreq || t.frequency === filterFreq;
    return matchSearch && matchFreq;
  });

  const openAdd = () => {
    setEditItem(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({ ...item });
    setModalOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    if (name === 'equipmentId') {
      const eq = equipment.find(e => e.id === value);
      setForm(f => ({ ...f, equipmentId: value, equipmentName: eq?.name || value }));
    } else if (name === 'assignedTo') {
      const tech = technicians.find(t => t.id === value);
      setForm(f => ({ ...f, assignedTo: value, assignedName: tech?.name || value }));
    } else {
      setForm(f => ({ ...f, [name]: value }));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editItem) {
        await client.put(`/schedule/${editItem.id}`, form);
        toast('PM task updated', 'success');
      } else {
        await client.post('/schedule', form);
        toast('PM task added', 'success');
      }
      setModalOpen(false);
      fetchAll();
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to save task', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleMarkDone = async (task) => {
    try {
      await client.patch(`/schedule/${task.id}/done`);
      toast(`${task.id} marked as complete`, 'success');
      fetchAll();
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to update task', 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      await client.delete(`/schedule/${id}`);
      toast('Task deleted', 'success');
      setDeleteConfirm(null);
      fetchAll();
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to delete', 'error');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">PM Schedule</div>
          <div className="page-subtitle">{tasks.filter(t => t.status === 'Overdue').length} overdue tasks</div>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={openAdd}>
            <PlusIcon size={14} /> Add PM Task
          </button>
        )}
      </div>

      <div className="toolbar">
        <div className="search-wrap">
          <span className="search-icon"><SearchIcon size={15} /></span>
          <input
            className="search-input"
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="filter-select" value={filterFreq} onChange={e => setFilterFreq(e.target.value)}>
          <option value="">All Frequencies</option>
          {frequencies.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
        <span className="toolbar-spacer" />
        <span style={{ fontSize: '0.8rem', color: 'var(--text3)' }}>{filtered.length} results</span>
      </div>

      <div className="panel">
        {loading ? (
          <div className="loading-state"><div className="spinner" /><span>Loading...</span></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon" style={{ display: 'flex', justifyContent: 'center' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <h3>No PM Tasks Found</h3>
            <p>No tasks match your current filters.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Task ID</th>
                  <th>Equipment</th>
                  <th>Description</th>
                  <th>Frequency</th>
                  <th>Last Done</th>
                  <th>Next Due</th>
                  <th>Assigned To</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(task => (
                  <tr key={task.id} className={task.status === 'Overdue' ? 'row-overdue' : ''}>
                    <td className="mono">{task.id}</td>
                    <td style={{ color: 'var(--text)', fontWeight: 500 }}>{task.equipmentName}</td>
                    <td style={{ color: 'var(--text2)', maxWidth: 200 }}>{task.description}</td>
                    <td>{task.frequency}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{formatDate(task.lastDone)}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: task.status === 'Overdue' ? 'var(--red)' : 'inherit', fontWeight: task.status === 'Overdue' ? 600 : 400 }}>
                      {formatDate(task.nextDue)}
                    </td>
                    <td>{task.assignedName || task.assignedTo || '—'}</td>
                    <td>{task.priority ? <Badge type={priorityBadge(task.priority)}>{task.priority}</Badge> : '—'}</td>
                    <td><Badge type={statusBadge(task.status)}>{task.status}</Badge></td>
                    <td>
                      <div className="table-actions">
                        {isAdmin && task.status !== 'Completed' && (
                          <button className="btn btn-complete btn-sm" onClick={() => handleMarkDone(task)} title="Mark as done">
                            <CheckIcon size={13} /> Done
                          </button>
                        )}
                        {isAdmin && (
                          <>
                            <button className="btn btn-edit btn-sm" onClick={() => openEdit(task)}>
                              <EditIcon size={13} />
                            </button>
                            <button className="btn btn-danger btn-sm" onClick={() => setDeleteConfirm(task)}>
                              <TrashIcon size={13} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={modalOpen} title={editItem ? `Edit PM Task — ${editItem.id}` : 'Add PM Task'} onClose={() => setModalOpen(false)}>
        <form onSubmit={handleSave}>
          <div className="modal-body">
            <div className="form-grid">
              <div className="form-group">
                <label>Equipment *</label>
                <select name="equipmentId" value={form.equipmentId} onChange={handleFormChange} required>
                  <option value="">Select Equipment</option>
                  {equipment.map(e => <option key={e.id} value={e.id}>{e.id} — {e.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Frequency *</label>
                <select name="frequency" value={form.frequency} onChange={handleFormChange}>
                  {frequencies.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div className="form-group full-width">
                <label>Description *</label>
                <input name="description" value={form.description} onChange={handleFormChange} placeholder="Task description" required />
              </div>
              <div className="form-group">
                <label>Last Done</label>
                <input type="date" name="lastDone" value={form.lastDone} onChange={handleFormChange} />
              </div>
              <div className="form-group">
                <label>Next Due *</label>
                <input type="date" name="nextDue" value={form.nextDue} onChange={handleFormChange} required />
              </div>
              <div className="form-group">
                <label>Assigned To</label>
                <select name="assignedTo" value={form.assignedTo} onChange={handleFormChange}>
                  <option value="">Select Technician</option>
                  {technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Priority</label>
                <select name="priority" value={form.priority} onChange={handleFormChange}>
                  {priorities.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Estimated Hours</label>
                <input type="number" name="estimatedHours" value={form.estimatedHours} onChange={handleFormChange} min={0.5} step={0.5} />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : (editItem ? 'Update Task' : 'Add Task')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <Modal isOpen={!!deleteConfirm} title="Confirm Delete" onClose={() => setDeleteConfirm(null)}>
        <div className="modal-body">
          <p style={{ color: 'var(--text2)' }}>
            Delete PM task <strong style={{ color: 'var(--text)' }}>{deleteConfirm?.id}</strong>: "{deleteConfirm?.description}"?
            This cannot be undone.
          </p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={() => setDeleteConfirm(null)}>Cancel</button>
          <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm.id)}>Delete Task</button>
        </div>
      </Modal>
    </div>
  );
}
