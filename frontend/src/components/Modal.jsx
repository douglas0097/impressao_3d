import Button from './Button';
import React from 'react';
import { FiX } from 'react-icons/fi';

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0 }}>{title}</h2>
          <Button variant="ghost" size="icon" aria-label="Fechar modal"
            onClick={onClose}
          >
            <FiX size={24} />
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
};

export default Modal;
