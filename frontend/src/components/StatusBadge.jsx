import React from 'react';

const StatusBadge = ({ status, type = 'pedido' }) => {
  const getStyles = () => {
    if (type === 'pedido') {
      switch(status) {
        case 'ORCAMENTO': return { bg: 'rgba(156, 163, 175, 0.2)', color: '#9ca3af' };
        case 'APROVADO': return { bg: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6' };
        case 'EM_IMPRESSAO': return { bg: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b' };
        case 'CONCLUIDO': return { bg: 'rgba(16, 185, 129, 0.2)', color: '#10b981' };
        case 'ENTREGUE': return { bg: 'rgba(5, 150, 105, 0.2)', color: '#059669' };
        case 'CANCELADO': return { bg: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' };
        default: return { bg: 'rgba(255, 255, 255, 0.1)', color: 'white' };
      }
    } else if (type === 'pagamento') {
      switch(status) {
        case 'PENDENTE': return { bg: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' };
        case 'SINAL_50': return { bg: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b' };
        case 'PAGO': return { bg: 'rgba(16, 185, 129, 0.2)', color: '#10b981' };
        default: return { bg: 'rgba(255, 255, 255, 0.1)', color: 'white' };
      }
    }
  };

  const { bg, color } = getStyles();

  return (
    <span style={{
      backgroundColor: bg,
      color: color,
      padding: '0.25rem 0.75rem',
      borderRadius: '999px',
      fontSize: '0.75rem',
      fontWeight: '600',
      letterSpacing: '0.05em'
    }}>
      {status.replace('_', ' ')}
    </span>
  );
};

export default StatusBadge;
