export function filamentoDisponivel(filamento) {
  return filamento.ativo !== false && filamento.status !== 'inativo';
}

export function calcularOrcamento(filamento, parametros) {
  if (!filamento || !filamentoDisponivel(filamento)) throw new Error('Selecione um filamento ativo.');
  const { peso, horas, tarifa, potencia, maquina, maoObra, margem, desconto, manutencao, retrabalho } = parametros;
  if (Object.values(parametros).some(value => typeof value !== 'number' || !Number.isFinite(value) || value < 0)) {
    throw new Error('Informe valores válidos e não negativos em todos os campos.');
  }
  if (!(peso > 0) || !(horas > 0)) throw new Error('Peso e tempo devem ser maiores que zero.');
  const preco = Number(filamento.preco_pago);
  const pesoBobina = Number(filamento.peso_total_g);
  if (filamento.preco_pago == null || !Number.isFinite(preco) || preco < 0 || !Number.isFinite(pesoBobina) || pesoBobina <= 0) {
    throw new Error('O filamento selecionado precisa de preço e peso original válidos.');
  }
  const material = preco / pesoBobina * peso;
  const energia = potencia / 1000 * horas * tarifa;
  const custoMaquina = maquina * horas;
  const base = material + energia + custoMaquina;
  const custoManutencao = base * manutencao / 100;
  const custoRetrabalho = base * retrabalho / 100;
  const total = base + custoManutencao + custoRetrabalho + maoObra;
  const lucro = total * margem / 100;
  const venda = total + lucro;
  if (![material, energia, custoMaquina, total, lucro, venda].every(Number.isFinite)) throw new Error('Os valores informados excedem o limite de cálculo.');
  if (desconto > venda) throw new Error('O desconto não pode ser maior que o preço de venda.');
  return { material, energia, maquina: custoMaquina, maoObra, manutencao: custoManutencao, retrabalho: custoRetrabalho, total, lucro, venda, desconto, final: venda - desconto };
}
