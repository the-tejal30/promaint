import React, { useEffect, useState, useCallback } from 'react';
import client from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';
import Modal from '../components/Modal.jsx';
import Badge, { statusBadge, priorityBadge } from '../components/Badge.jsx';
import PlusIcon from '../icons/PlusIcon.jsx';
import CheckIcon from '../icons/CheckIcon.jsx';
import TrashIcon from '../icons/TrashIcon.jsx';
import SearchIcon from '../icons/SearchIcon.jsx';

const emptyForm = {
  equipmentId: '', equipment: '', description: '', type: 'Corrective',
  assignedTo: '', dueDate: '', priority: 'Medium'
};

const types = ['Corrective', 'Preventive', 'Modification', 'Emergency', 'Inspection'];
const priorities = ['Critical', 'High', 'Medium', 'Low'];

function formatDate(d) {
  if (!d) return '—';
  const date = new Date(d);
  if (isNaN(date)) return d;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function WorkOrders() {
  const [workOrders, setWorkOrders] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [saving, setSaving] = useState(false);
  const { isAdmin } = useAuth();
  const toast = useToast();

  const fetchAll = useCallback(() => {
    setLoading(true);
    Promise.all([
      client.get('/workorders'),
      client.get('/equipment'),
      client.get('/technicians')
    ]).then(([wo, eq, t]) => {
      setWorkOrders(wo.data);
      setEquipment(eq.data);
      setTechnicians(t.data);
    }).catch(() => toast('Failed to load work orders', 'error'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filtered = workOrders.filter(wo => {
    const q = search.toLowerCase();
    const matchSearch = !q || wo.num?.toLowerCase().includes(q) || wo.equipment?.toLowerCase().includes(q) || wo.description?.toLowerCase().includes(q);
    const matchStatus = !filterStatus || wo.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    if (name === 'equipmentId') {
      const eq = equipment.find(e => e.id === value);
      setForm(f => ({ ...f, equipmentId: value, equipment: eq?.name || value }));
    } else {
      setForm(f => ({ ...f, [name]: value }));
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await client.post('/workorders', form);
      toast('Work order created successfully', 'success');
      setModalOpen(false);
      setForm(emptyForm);
      fetchAll();
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to create work order', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async (wo) => {
    try {
      await client.patch(`/workorders/${wo.num}/complete`);
      toast(`${wo.num} marked as completed`, 'success');
      fetchAll();
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to update', 'error');
    }
  };

  const handleDelete = async (num) => {
    try {
      await client.delete(`/workorders/${num}`);
      toast('Work order deleted', 'success');
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
          <div className="page-title">Work Orders</div>
          <div className="page-subtitle">{workOrders.filter(w => w.status !== 'Completed').length} open orders</div>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => { setForm(emptyForm); setModalOpen(true); }}>
            <PlusIcon size={14} /> Create Work Order
          </button>
        )}
      </div>

      <div className="toolbar">
        <div className="search-wrap">
          <span className="search-icon"><SearchIcon size={15} /></span>
          <input
            className="search-input"
            type="text"
            placeholder="Search work orders..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="Open">Open</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
          <option value="Pending">Pending</option>
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
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
            </div>
            <h3>No Work Orders Found</h3>
            <p>Create a new work order to get started.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>WO #</th>
                  <th>Equipment</th>
                  <th>Description</th>
                  <th>Type</th>
                  <th>Assigned To</th>
                  <th>Created</th>
                  <th>Due Date</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(wo => (
                  <tr key={wo.num}>
                    <td className="mono">{wo.num}</td>
                    <td style={{ color: 'var(--text)', fontWeight: 500 }}>{wo.equipment}</td>
                    <td style={{ color: 'var(--text2)', maxWidth: 180 }}>{wo.description}</td>
                    <td>{wo.type}</td>
                    <td>{wo.assignedTo || '—'}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{formatDate(wo.createdDate)}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{formatDate(wo.dueDate)}</td>
                    <td><Badge type={priorityBadge(wo.priority)}>{wo.priority}</Badge></td>
                    <td><Badge type={statusBadge(wo.status)}>{wo.status}</Badge></td>
                    <td>
                      <div className="table-actions">
                        {isAdmin && wo.status !== 'Completed' && (
                          <button className="btn btn-complete btn-sm" onClick={() => handleComplete(wo)} title="Mark complete">
                            <CheckIcon size={13} /> Complete
                          </button>
                        )}
                        {isAdmin && (
                          <button className="btn btn-danger btn-sm" onClick={() => setDeleteConfirm(wo)} title="Delete">
                            <TrashIcon size={13} />
                          </button>
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

      {/* Create Modal */}
      <Modal isOpen={modalOpen} title="Create Work Order" onClose={() => setModalOpen(false)}>
        <form onSubmit={handleCreate}>
          <div className="modal-body">
            <div
              style={{
                background: 'var(--bg2)',
                border: '1px solid var(--border2)',
                borderRadius: 'var(--radius)',
                padding: '10px 14px',
                marginBottom: 16,
                fontFamily: 'var(--font-mono)',
                fontSize: '0.85rem',
                color: 'var(--accent)'
              }}
            >
              WO Number will be auto-assigned on creation
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label>Equipment *</label>
                <select name="equipmentId" value={form.equipmentId} onChange={handleFormChange} required>
                  <option value="">Select Equipment</option>
                  {equipment.map(e => <option key={e.id} value={e.id}>{e.id} — {e.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Type *</label>
                <select name="type" value={form.type} onChange={handleFormChange}>
                  {types.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group full-width">
                <label>Description *</label>
                <textarea name="description" value={form.description} onChange={handleFormChange} placeholder="Describe the work required..." rows={3} required />
              </div>
              <div className="form-group">
                <label>Assign To</label>
                <select name="assignedTo" value={form.assignedTo} onChange={handleFormChange}>
                  <option value="">Select Technician</option>
                  {technicians.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Priority</label>
                <select name="priority" value={form.priority} onChange={handleFormChange}>
                  {priorities.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Due Date</label>
                <input type="date" name="dueDate" value={form.dueDate} onChange={handleFormChange} />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Creating...' : 'Create Work Order'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <Modal isOpen={!!deleteConfirm} title="Confirm Delete" onClose={() => setDeleteConfirm(null)}>
        <div className="modal-body">
          <p style={{ color: 'var(--text2)' }}>
            Delete work order <strong style={{ color: 'var(--text)' }}>{deleteConfirm?.num}</strong>?
            This cannot be undone.
          </p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={() => setDeleteConfirm(null)}>Cancel</button>
          <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm.num)}>Delete</button>
        </div>
      </Modal>
    </div>
  );
}
