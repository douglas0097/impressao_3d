export const converterTempoParaHoras = (horas, minutos) => {
  if (horas == null || minutos == null) {
    throw new Error('Horas e minutos do tempo de impressão são obrigatórios');
  }

  if (horas < 0) {
    throw new Error('As horas não podem ser negativas');
  }

  if (minutos < 0 || minutos > 59) {
    throw new Error('Os minutos devem estar entre 0 e 59');
  }

  return Number(horas) + (Number(minutos) / 60);
};