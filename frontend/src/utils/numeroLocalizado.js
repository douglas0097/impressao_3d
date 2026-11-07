export function parseNumeroLocalizado(value) {
  const text = String(value ?? '').trim();
  if (!/^\d+(\.\d{3})*(,\d{1,2})?$/.test(text)) return NaN;
  const number = Number(text.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(number) ? number : NaN;
}

export function formatNumeroLocalizado(value, decimals = 2) {
  if (value === '' || value == null) return '';
  const number = Number(value);
  if (!Number.isFinite(number)) return '';
  return number.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value) || 0);
}
