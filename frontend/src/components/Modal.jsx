import Button from './Button';
import React, { useId } from 'react';
import { FiX } from 'react-icons/fi';

const Modal = ({ isOpen, onClose, title, children }) => {
  const titleId = useId();
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" role="dialog" aria-modal="true" aria-labelledby={titleId} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 id={titleId} className="modal-title">{title}</h2>
          <Button variant="ghost" size="icon-sm" className="modal-close" aria-label="Fechar modal"
            onClick={onClose}
          >
            <FiX size={18} aria-hidden="true" />
          </Button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
