export function filamentoDisponivel(filamento) {
  return filamento.ativo !== false && filamento.status !== 'inativo';
}

export function calcularOrcamento(filamento, parametros) {
  if (!filamento || !filamentoDisponivel(filamento)) throw new Error('Selecione um filamento ativo.');
  const {
    peso,
    horas = 0,
    minutos = 0,
    custo_energia = 0,
    taxa_manutencao = 0,
    taxa_retrabalho_pct = 0,
    margem_lucro_padrao_pct = 0,
    desconto = 0
  } = parametros;

  if (Object.values(parametros).some(value => typeof value !== 'number' || !Number.isFinite(value) || value < 0)) {
    throw new Error('Informe valores válidos e não negativos em todos os campos.');
  }

  const tempoHoras = Number(horas) + (Number(minutos) / 60);

  if (!(peso > 0) || !(tempoHoras > 0)) {
    throw new Error('Peso e tempo de impressão devem ser maiores que zero.');
  }

  const precoKg = Number(filamento.preco_kg != null ? filamento.preco_kg : filamento.preco_pago);
  if (!Number.isFinite(precoKg) || precoKg <= 0) {
    throw new Error('O filamento selecionado precisa de um preço por kg válido.');
  }

  // 1. Custo do filamento (com taxa de retrabalho)
  const taxaRetrabalho = (taxa_retrabalho_pct / 100) + 1;
  const material = (precoKg / 1000) * peso * taxaRetrabalho;

  // 2. Custo do tempo de impressão (energia + taxa de manutenção)
  const custoTempo = (taxa_manutencao + custo_energia) * tempoHoras;

  // 3. Custo total sem lucro
  const total = material + custoTempo;

  // 4. Preço de custo real (material puro + energia)
  const precoCusto = (precoKg / 1000) * peso + (custo_energia * tempoHoras);

  // 5. Preço de venda sugerido com margem de lucro
  const margemLucro = (margem_lucro_padrao_pct / 100) + 1;
  const venda = total * margemLucro;
  const lucro = venda - total;

  if (![material, custoTempo, total, precoCusto, venda].every(Number.isFinite)) {
    throw new Error('Os valores informados excedem o limite de cálculo.');
  }

  if (desconto > venda) {
    throw new Error('O desconto não pode ser maior que o preço de venda.');
  }

  return {
    material: Number(material.toFixed(2)),
    custoTempo: Number(custoTempo.toFixed(2)),
    precoCusto: Number(precoCusto.toFixed(2)),
    total: Number(total.toFixed(2)),
    lucro: Number(lucro.toFixed(2)),
    venda: Number(venda.toFixed(2)),
    desconto: Number(desconto.toFixed(2)),
    final: Number((venda - desconto).toFixed(2))
  };
}
