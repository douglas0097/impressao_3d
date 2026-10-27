export const statusOptions = [
  { value: 'ORCAMENTO', label: 'Orçamento' },
  { value: 'APROVADO', label: 'Aprovado' },
  { value: 'EM_IMPRESSAO', label: 'Em impressão' },
  { value: 'CONCLUIDO', label: 'Concluído' },
  { value: 'ENTREGUE', label: 'Entregue' },
  { value: 'CANCELADO', label: 'Cancelado' },
];
export const paymentOptions = [
  { value: 'PENDENTE', label: 'Pendente' },
  { value: 'SINAL_50', label: 'Sinal 50%' },
  { value: 'PAGO', label: 'Pago' },
];
export const referenceId = value => typeof value === 'object' ? value?._id || '' : value || '';
export const formatMoney = value => value == null ? 'Não informado' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
export function splitTime(value) {
  const minutes = Math.round(Number(value || 0) * 60);
  return { horas: Math.floor(minutes / 60), minutos: minutes % 60 };
}
