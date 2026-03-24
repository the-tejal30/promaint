import React from 'react';

export default function Badge({ type = 'ghost', children }) {
  return <span className={`badge badge-${type}`}>{children}</span>;
}

export function statusBadge(status) {
  const map = {
    'Active': 'success',
    'Inactive': 'ghost',
    'Under Maintenance': 'warn',
    'Overdue': 'danger',
    'Due Today': 'warn',
    'Scheduled': 'info',
    'Completed': 'success',
    'In Progress': 'info',
    'Open': 'orange',
    'Pending': 'warn'
  };
  return map[status] || 'ghost';
}

export function priorityBadge(priority) {
  const map = {
    Critical: 'danger',
    High: 'orange',
    Medium: 'warn',
    Low: 'info'
  };
  return map[priority] || 'ghost';
}

export function specializationBadge(spec) {
  const map = {
    Mechanical: 'info',
    Electrical: 'warn',
    HVAC: 'purple',
    General: 'ghost'
  };
  return map[spec] || 'ghost';
}
