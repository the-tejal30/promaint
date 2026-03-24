import React, { useEffect } from 'react';
import CloseIcon from '../icons/CloseIcon.jsx';

export default function Modal({ isOpen, title, onClose, children, size = '' }) {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={`modal${size ? ' modal-' + size : ''}`}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <CloseIcon size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
