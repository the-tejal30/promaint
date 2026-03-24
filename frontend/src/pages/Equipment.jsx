import React, { useEffect, useState, useCallback, useRef } from 'react';
import client from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';
import Modal from '../components/Modal.jsx';
import Badge, { statusBadge } from '../components/Badge.jsx';
import PlusIcon from '../icons/PlusIcon.jsx';
import EditIcon from '../icons/EditIcon.jsx';
import TrashIcon from '../icons/TrashIcon.jsx';
import SearchIcon from '../icons/SearchIcon.jsx';

const LIMIT = 50;

const emptyForm = {
  id: '', pair: '', level: '', zone: '', area: '',
  assetType: '', assetCode: '', frequency: 'Monthly', status: 'Active'
};

const frequencies = ['Weekly', 'Monthly', 'Bi Monthly', 'Quarterly', 'Half Yearly', 'Annually'];
const statuses = ['Active', 'Under Maintenance', 'Inactive'];

export default function Equipment() {
  const [equipment, setEquipment] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterFreq, setFilterFreq] = useState('');
  const [filterPair, setFilterPair] = useState('');
  const [pairs, setPairs] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [saving, setSaving] = useState(false);
  const { isAdmin } = useAuth();
  const toast = useToast();
  const searchTimer = useRef(null);

  const fetchEquipment = useCallback((pg = 1, q = search, status = filterStatus, freq = filterFreq, pair = filterPair) => {
    setLoading(true);
    const params = { page: pg, limit: LIMIT };
    if (q)      params.search    = q;
    if (status) params.status    = status;
    if (freq)   params.frequency = freq;
    if (pair)   params.pair      = pair;
    client.get('/equipment', { params })
      .then(res => {
        setEquipment(res.data.data);
        setTotal(res.data.total);
        setPage(pg);
      })
      .catch(() => toast('Failed to load equipment', 'error'))
      .finally(() => setLoading(false));
  }, [search, filterStatus, filterFreq, filterPair]);

  // Load distinct pairs once
  useEffect(() => {
    client.get('/equipment', { params: { page: 1, limit: 1000 } }).then(res => {
      const p = [...new Set(res.data.data.map(e => e.pair).filter(Boolean))].sort();
      setPairs(p);
    });
  }, []);

  useEffect(() => { fetchEquipment(1); }, [filterStatus, filterFreq, filterPair]);

  const handleSearchChange = (val) => {
    setSearch(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => fetchEquipment(1, val, filterStatus, filterFreq, filterPair), 400);
  };

  const totalPages = Math.ceil(total / LIMIT);

  const openAdd = () => { setEditItem(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (item) => { setEditItem(item); setForm({ ...item }); setModalOpen(true); };
  const handleFormChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

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
      fetchEquipment(page);
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
      fetchEquipment(page);
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to delete', 'error');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">Equipment Registry</div>
          <div className="page-subtitle">{total} assets tracked</div>
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
            onChange={e => handleSearchChange(e.target.value)}
          />
        </div>
        <select className="filter-select" value={filterPair} onChange={e => { setFilterPair(e.target.value); }}>
          <option value="">All Pairs</option>
          {pairs.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select className="filter-select" value={filterFreq} onChange={e => { setFilterFreq(e.target.value); }}>
          <option value="">All Frequencies</option>
          {frequencies.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
        <select className="filter-select" value={filterStatus} onChange={e => { setFilterStatus(e.target.value); }}>
          <option value="">All Statuses</option>
          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <span className="toolbar-spacer" />
        <span style={{ fontSize: '0.8rem', color: 'var(--text3)' }}>
          {total} results
        </span>
      </div>

      <div className="panel">
        {loading ? (
          <div className="loading-state"><div className="spinner" /><span>Loading...</span></div>
        ) : equipment.length === 0 ? (
          <div className="empty-state">
            <h3>No Equipment Found</h3>
            <p>Try adjusting your filters or add new equipment.</p>
          </div>
        ) : (
          <>
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
                  {equipment.map(eq => (
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

            {totalPages > 1 && (
              <div className="pagination">
                <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => fetchEquipment(page - 1)}>← Prev</button>
                <span className="pagination-info">Page {page} of {totalPages}</span>
                <button className="btn btn-ghost btn-sm" disabled={page >= totalPages} onClick={() => fetchEquipment(page + 1)}>Next →</button>
              </div>
            )}
          </>
        )}
      </div>

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

      <Modal isOpen={!!deleteConfirm} title="Confirm Delete" onClose={() => setDeleteConfirm(null)}>
        <div className="modal-body">
          <p style={{ color: 'var(--text2)' }}>
            Are you sure you want to delete <strong style={{ color: 'var(--text)' }}>{deleteConfirm?.assetType}</strong> ({deleteConfirm?.id})? This action cannot be undone.
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
    case 'Weekly':      return 'critical';
    case 'Monthly':     return 'warning';
    case 'Bi Monthly':  return 'info';
    case 'Quarterly':   return 'info';
    case 'Half Yearly': return 'default';
    default:            return 'default';
  }
}
