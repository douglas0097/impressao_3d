const orderColors = {
  ORCAMENTO: 'text-text-secondary bg-text-secondary/10',
  APROVADO: 'text-brand bg-brand-soft',
  EM_IMPRESSAO: 'text-warning bg-warning/10',
  CONCLUIDO: 'text-success bg-success/10',
  ENTREGUE: 'text-success bg-success/10',
  CANCELADO: 'text-danger bg-danger/10',
};
const paymentColors = {
  PENDENTE: 'text-danger bg-danger/10',
  SINAL_50: 'text-warning bg-warning/10',
  PAGO: 'text-success bg-success/10',
};
const StatusBadge = ({ status, type = 'pedido' }) => {
  const colors = (type === 'pagamento' ? paymentColors : orderColors)[status]
    || 'text-text-secondary bg-surface-hover';
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold tracking-wide ${colors}`}>
      {status.replaceAll('_', ' ')}
    </span>
  );
};
export default StatusBadge;
