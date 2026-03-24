import React, { useEffect, useState, useCallback } from 'react';
import client from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';
import Modal from '../components/Modal.jsx';
import Badge, { specializationBadge } from '../components/Badge.jsx';
import PlusIcon from '../icons/PlusIcon.jsx';
import TrashIcon from '../icons/TrashIcon.jsx';
import PhoneIcon from '../icons/PhoneIcon.jsx';
import MailIcon from '../icons/MailIcon.jsx';
import WorkOrderIcon from '../icons/WorkOrderIcon.jsx';

const emptyForm = {
  id: '', name: '', specialization: 'Mechanical', phone: '', email: ''
};

const specializations = ['Mechanical', 'Electrical', 'HVAC', 'General', 'Civil', 'Instrumentation'];

const avatarColors = [
  { bg: 'rgba(59,130,246,0.15)', border: '#3b82f6', text: '#3b82f6' },
  { bg: 'rgba(249,115,22,0.15)', border: '#f97316', text: '#f97316' },
  { bg: 'rgba(168,85,247,0.15)', border: '#a855f7', text: '#a855f7' },
  { bg: 'rgba(34,197,94,0.15)', border: '#22c55e', text: '#22c55e' },
  { bg: 'rgba(234,179,8,0.15)', border: '#eab308', text: '#eab308' },
  { bg: 'rgba(239,68,68,0.15)', border: '#ef4444', text: '#ef4444' },
];

function getInitials(name) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

function getAvatarColor(id) {
  const idx = id?.charCodeAt(id.length - 1) % avatarColors.length || 0;
  return avatarColors[idx];
}

export default function Technicians() {
  const [technicians, setTechnicians] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [saving, setSaving] = useState(false);
  const { isAdmin } = useAuth();
  const toast = useToast();

  const fetchAll = useCallback(() => {
    setLoading(true);
    Promise.all([
      client.get('/technicians'),
      client.get('/workorders')
    ]).then(([t, wo]) => {
      setTechnicians(t.data);
      setWorkOrders(wo.data);
    }).catch(() => toast('Failed to load technicians', 'error'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const getOpenWorkOrders = (techName) => {
    return workOrders.filter(wo => wo.assignedTo === techName && wo.status !== 'Completed').length;
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await client.post('/technicians', form);
      toast('Technician added successfully', 'success');
      setModalOpen(false);
      setForm(emptyForm);
      fetchAll();
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to add technician', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await client.delete(`/technicians/${id}`);
      toast('Technician removed', 'success');
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
          <div className="page-title">Technicians</div>
          <div className="page-subtitle">{technicians.length} maintenance personnel</div>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => { setForm(emptyForm); setModalOpen(true); }}>
            <PlusIcon size={14} /> Add Technician
          </button>
        )}
      </div>

      <div className="panel" style={{ overflow: 'visible' }}>
        {loading ? (
          <div className="loading-state"><div className="spinner" /><span>Loading...</span></div>
        ) : technicians.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon" style={{ display: 'flex', justifyContent: 'center' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <h3>No Technicians Found</h3>
            <p>Add your first technician to get started.</p>
          </div>
        ) : (
          <div className="tech-grid">
            {technicians.map(tech => {
              const colors = getAvatarColor(tech.id);
              const openWOs = getOpenWorkOrders(tech.name);
              return (
                <div className="tech-card" key={tech.id}>
                  <div
                    className="tech-avatar"
                    style={{ background: colors.bg, borderColor: colors.border, color: colors.text }}
                  >
                    {getInitials(tech.name)}
                  </div>
                  <div className="tech-name">{tech.name}</div>
                  <div className="tech-id">{tech.id}</div>
                  <Badge type={specializationBadge(tech.specialization)}>{tech.specialization}</Badge>

                  <div className="tech-info">
                    <div className="tech-info-row">
                      <span className="tech-info-icon"><PhoneIcon size={13} /></span>
                      <span>{tech.phone || '—'}</span>
                    </div>
                    <div className="tech-info-row">
                      <span className="tech-info-icon"><MailIcon size={13} /></span>
                      <span>{tech.email || '—'}</span>
                    </div>
                    <div className="tech-info-row">
                      <span className="tech-info-icon"><WorkOrderIcon size={13} /></span>
                      <span>{openWOs} active work orders</span>
                    </div>
                    <div className="tech-info-row">
                      <span className="tech-info-icon" style={{ color: 'var(--green)' }}>●</span>
                      <span style={{ color: 'var(--green)' }}>{tech.status || 'Active'}</span>
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="tech-actions">
                      <button className="btn btn-danger btn-sm" onClick={() => setDeleteConfirm(tech)}>
                        <TrashIcon size={13} /> Remove
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Modal */}
      <Modal isOpen={modalOpen} title="Add Technician" onClose={() => setModalOpen(false)}>
        <form onSubmit={handleSave}>
          <div className="modal-body">
            <div className="form-grid">
              <div className="form-group">
                <label>Employee ID *</label>
                <input name="id" value={form.id} onChange={handleFormChange} placeholder="EMP-005" required />
              </div>
              <div className="form-group">
                <label>Full Name *</label>
                <input name="name" value={form.name} onChange={handleFormChange} placeholder="John Doe" required />
              </div>
              <div className="form-group">
                <label>Specialization *</label>
                <select name="specialization" value={form.specialization} onChange={handleFormChange}>
                  {specializations.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input name="phone" value={form.phone} onChange={handleFormChange} placeholder="+91 98765 43210" />
              </div>
              <div className="form-group full-width">
                <label>Email</label>
                <input type="email" name="email" value={form.email} onChange={handleFormChange} placeholder="john@company.com" />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Adding...' : 'Add Technician'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <Modal isOpen={!!deleteConfirm} title="Confirm Remove" onClose={() => setDeleteConfirm(null)}>
        <div className="modal-body">
          <p style={{ color: 'var(--text2)' }}>
            Remove technician <strong style={{ color: 'var(--text)' }}>{deleteConfirm?.name}</strong> ({deleteConfirm?.id})?
            This cannot be undone.
          </p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={() => setDeleteConfirm(null)}>Cancel</button>
          <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm.id)}>Remove</button>
        </div>
      </Modal>
    </div>
  );
}
