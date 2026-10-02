export function mascaraTelefone(value = '') {
  const digits = String(value ?? '').replace(/\D/g, '').slice(0, 11);

  if (!digits) return '';
  if (digits.length <= 2) return `(${digits}`;

  const ddd = digits.slice(0, 2);
  const number = digits.slice(2);
  const prefixLength = number.length > 8 ? 5 : 4;

  if (number.length <= prefixLength) return `(${ddd}) ${number}`;

  return `(${ddd}) ${number.slice(0, prefixLength)}-${number.slice(prefixLength)}`;
}
