const tones = {
  neutral: 'border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200',
  blue: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-400/30 dark:bg-blue-400/10 dark:text-blue-300',
  amber: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-300',
  green: 'border-green-200 bg-green-50 text-green-800 dark:border-green-400/30 dark:bg-green-400/10 dark:text-green-300',
  teal: 'border-teal-200 bg-teal-50 text-teal-800 dark:border-teal-400/30 dark:bg-teal-400/10 dark:text-teal-300',
  red: 'border-red-200 bg-red-50 text-red-700 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-300',
};

const orderStatuses = {
  ORCAMENTO: { label: 'Orçamento', tone: 'neutral' },
  APROVADO: { label: 'Aprovado', tone: 'blue' },
  EM_IMPRESSAO: { label: 'Em impressão', tone: 'amber' },
  CONCLUIDO: { label: 'Concluído', tone: 'green' },
  ENTREGUE: { label: 'Entregue', tone: 'teal' },
  CANCELADO: { label: 'Cancelado', tone: 'red' },
};

const paymentStatuses = {
  PENDENTE: { label: 'Pendente', tone: 'red' },
  SINAL_50: { label: 'Sinal 50%', tone: 'amber' },
  PAGO: { label: 'Pago', tone: 'green' },
};

const StatusBadge = ({ status, type = 'pedido' }) => {
  const { label, tone } = (type === 'pagamento' ? paymentStatuses : orderStatuses)[status]
    || { label: status ? String(status).replaceAll('_', ' ') : 'Sem status', tone: 'neutral' };

  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold leading-4 ${tones[tone]}`}>
      <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-current" />
      {label}
    </span>
  );
};
export default StatusBadge;
