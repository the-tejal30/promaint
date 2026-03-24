import React, { useEffect, useState, useCallback } from 'react';
import client from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';
import Modal from '../components/Modal.jsx';
import Badge, { statusBadge } from '../components/Badge.jsx';
import PlusIcon from '../icons/PlusIcon.jsx';
import EditIcon from '../icons/EditIcon.jsx';
import TrashIcon from '../icons/TrashIcon.jsx';
import SearchIcon from '../icons/SearchIcon.jsx';

const emptyForm = {
  id: '', pair: '', level: '', zone: '', area: '',
  assetType: '', assetCode: '', frequency: 'Monthly', status: 'Active'
};

const frequencies = ['Weekly', 'Monthly', 'Bi Monthly', 'Quarterly', 'Half Yearly', 'Annually'];
const statuses = ['Active', 'Under Maintenance', 'Inactive'];

export default function Equipment() {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterFreq, setFilterFreq] = useState('');
  const [filterPair, setFilterPair] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [saving, setSaving] = useState(false);
  const { isAdmin } = useAuth();
  const toast = useToast();

  const fetchEquipment = useCallback(() => {
    setLoading(true);
    client.get('/equipment')
      .then(res => setEquipment(res.data))
      .catch(() => toast('Failed to load equipment', 'error'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchEquipment(); }, [fetchEquipment]);

  const pairs = [...new Set(equipment.map(e => e.pair).filter(Boolean))].sort();

  const filtered = equipment.filter(eq => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      eq.assetCode?.toLowerCase().includes(q) ||
      eq.assetType?.toLowerCase().includes(q) ||
      eq.area?.toLowerCase().includes(q) ||
      eq.zone?.toLowerCase().includes(q) ||
      eq.pair?.toLowerCase().includes(q);
    const matchStatus = !filterStatus || eq.status === filterStatus;
    const matchFreq = !filterFreq || eq.frequency === filterFreq;
    const matchPair = !filterPair || eq.pair === filterPair;
    return matchSearch && matchStatus && matchFreq && matchPair;
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
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editItem) {
        await client.put(`/equipment/${editItem.id}`, form);
        toast('Equipment updated successfully', 'success');
      } else {
        await client.post('/equipment', form);
        toast('Equipment added successfully', 'success');
      }
      setModalOpen(false);
      fetchEquipment();
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to save equipment', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await client.delete(`/equipment/${id}`);
      toast('Equipment deleted', 'success');
      setDeleteConfirm(null);
      fetchEquipment();
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to delete', 'error');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">Equipment Registry</div>
          <div className="page-subtitle">{equipment.length} assets tracked</div>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={openAdd}>
            <PlusIcon size={14} /> Add Equipment
          </button>
        )}
      </div>

      <div className="toolbar">
        <div className="search-wrap">
          <span className="search-icon"><SearchIcon size={15} /></span>
          <input
            className="search-input"
            type="text"
            placeholder="Search by asset code, type, area..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="filter-select" value={filterPair} onChange={e => setFilterPair(e.target.value)}>
          <option value="">All Pairs</option>
          {pairs.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select className="filter-select" value={filterFreq} onChange={e => setFilterFreq(e.target.value)}>
          <option value="">All Frequencies</option>
          {frequencies.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
        <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
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
                <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
              </svg>
            </div>
            <h3>No Equipment Found</h3>
            <p>Try adjusting your filters or add new equipment.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Pair</th>
                  <th>Level</th>
                  <th>Zone</th>
                  <th>Area</th>
                  <th>Assets Type</th>
                  <th>Asset Code</th>
                  <th>Frequency</th>
                  <th>Status</th>
                  {isAdmin && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map(eq => (
                  <tr key={eq.id}>
                    <td>{eq.pair || '—'}</td>
                    <td>{eq.level || '—'}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>{eq.zone || '—'}</td>
                    <td>{eq.area || '—'}</td>
                    <td style={{ fontWeight: 500, color: 'var(--text)' }}>{eq.assetType || '—'}</td>
                    <td className="mono" style={{ fontSize: '0.78rem' }}>{eq.assetCode || eq.id}</td>
                    <td><Badge type={freqBadge(eq.frequency)}>{eq.frequency || '—'}</Badge></td>
                    <td><Badge type={statusBadge(eq.status)}>{eq.status}</Badge></td>
                    {isAdmin && (
                      <td>
                        <div className="table-actions">
                          <button className="btn btn-edit btn-sm" onClick={() => openEdit(eq)}>
                            <EditIcon size={13} /> Edit
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => setDeleteConfirm(eq)}>
                            <TrashIcon size={13} /> Delete
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={modalOpen} title={editItem ? `Edit Equipment — ${editItem.id}` : 'Add New Equipment'} onClose={() => setModalOpen(false)}>
        <form onSubmit={handleSave}>
          <div className="modal-body">
            <div className="form-grid">
              <div className="form-group">
                <label>Asset Code *</label>
                <input name="id" value={form.id} onChange={handleFormChange} placeholder="T1-LB-HB8001-ME-CPF-001" required disabled={!!editItem} />
              </div>
              <div className="form-group">
                <label>Assets Type *</label>
                <input name="assetType" value={form.assetType} onChange={handleFormChange} placeholder="VANE AXIAL FAN" required />
              </div>
              <div className="form-group">
                <label>Pair</label>
                <input name="pair" value={form.pair} onChange={handleFormChange} placeholder="Headhouse" />
              </div>
              <div className="form-group">
                <label>Level</label>
                <input name="level" value={form.level} onChange={handleFormChange} placeholder="LEVEL LB" />
              </div>
              <div className="form-group">
                <label>Zone</label>
                <input name="zone" value={form.zone} onChange={handleFormChange} placeholder="SPF-W-02-1" />
              </div>
              <div className="form-group">
                <label>Area</label>
                <input name="area" value={form.area} onChange={handleFormChange} placeholder="CORRIDOR PRESSURIZATION" />
              </div>
              <div className="form-group">
                <label>Frequency *</label>
                <select name="frequency" value={form.frequency} onChange={handleFormChange}>
                  {frequencies.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Status *</label>
                <select name="status" value={form.status} onChange={handleFormChange}>
                  {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : (editItem ? 'Update Equipment' : 'Add Equipment')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal isOpen={!!deleteConfirm} title="Confirm Delete" onClose={() => setDeleteConfirm(null)}>
        <div className="modal-body">
          <p style={{ color: 'var(--text2)' }}>
            Are you sure you want to delete <strong style={{ color: 'var(--text)' }}>{deleteConfirm?.assetType}</strong> ({deleteConfirm?.id})?
            This action cannot be undone.
          </p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={() => setDeleteConfirm(null)}>Cancel</button>
          <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm.id)}>Delete Equipment</button>
        </div>
      </Modal>
    </div>
  );
}

function freqBadge(freq) {
  switch (freq) {
    case 'Weekly': return 'critical';
    case 'Monthly': return 'warning';
    case 'Bi Monthly': return 'info';
    case 'Quarterly': return 'info';
    case 'Half Yearly': return 'default';
    default: return 'default';
  }
}
