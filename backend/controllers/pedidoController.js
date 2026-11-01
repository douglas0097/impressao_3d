import Pedido from '../models/Pedido.js';
import Filamento from '../models/Filamento.js';
import Configuracao from '../models/Configuracao.js';
import { converterTempoParaHoras } from '../utils/tempo.js';

export const getPedidos = async (req, res) => {
  try {
    const pedidos = await Pedido.find()
      .populate('cliente_id')
      .populate('filamento_id')
      .populate('pecas.filamento_id')
      .sort('-createdAt');
    res.json(pedidos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPedidoById = async (req, res) => {
  try {
    const query = Pedido.findById(req.params.id);
    const pedido = typeof query?.populate === 'function'
      ? await query.populate('cliente_id').populate('filamento_id').populate('pecas.filamento_id')
      : await query;
    if (!pedido) return res.status(404).json({ message: 'Pedido não encontrado.' });
    res.json(pedido);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const invalid = message => Object.assign(new Error(message), { status: 400 });
const sameId = (left, right) => String(left?._id || left || '') === String(right?._id || right || '');
const arredondar = valor => Number(Number(valor || 0).toFixed(2));

const readTime = body => {
  if (body.horas == null || body.minutos == null || !Number.isFinite(Number(body.horas)) || !Number.isFinite(Number(body.minutos))) {
    throw invalid('Informe horas e minutos validos.');
  }
  const time = converterTempoParaHoras(body.horas, body.minutos);
  if (time <= 0) throw invalid('Tempo de impressao deve ser maior que zero.');
  return time;
};

// Reserva atomica de estoque por filamento
const reserveStock = async (id, grams) => {
  if (!(grams > 0)) return;
  const available = { $ifNull: ['$estoque_gramas', { $ifNull: ['$peso_total_g', 0] }] };
  const material = await Filamento.findOneAndUpdate(
    { _id: id, $expr: { $gte: [available, grams] } },
    [{ $set: { estoque_gramas: { $subtract: [available, grams] } } }],
    { new: true, updatePipeline: true }
  );
  if (!material) throw invalid('Filamento indisponivel ou estoque insuficiente.');
};

// Devolucao atomica de estoque por filamento
const releaseStock = async (id, grams) => {
  if (!id || !(grams > 0)) return;
  await Filamento.updateOne(
    { _id: id },
    [{ $set: { estoque_gramas: { $add: [{ $ifNull: ['$estoque_gramas', { $ifNull: ['$peso_total_g', 0] }] }, grams] } } }],
    { updatePipeline: true }
  );
};

// Mapeia o consumo total de filamento em gramas agrupado por id de filamento
const getFilamentGrams = (pecas = [], fallbackFilamentoId = null, fallbackGrams = 0) => {
  const map = new Map();
  if (Array.isArray(pecas) && pecas.length > 0) {
    for (const peca of pecas) {
      if (!peca.filamento_id) continue;
      const id = String(peca.filamento_id._id || peca.filamento_id);
      const grams = Number(peca.peso_total_g ?? peca.peso_estimado_g ?? 0);
      if (grams > 0) {
        map.set(id, (map.get(id) || 0) + grams);
      }
    }
  } else if (fallbackFilamentoId && Number(fallbackGrams) > 0) {
    const id = String(fallbackFilamentoId._id || fallbackFilamentoId);
    map.set(id, Number(fallbackGrams));
  }
  return map;
};

export const calcularValoresOrcamento = ({
  filamento,
  peso_estimado_g,
  tempo_estimado_horas,
  config
}) => {
  const custo_por_grama = filamento.custo_por_grama != null ? filamento.custo_por_grama : (filamento.custo_por_grama ?? 0);
  const taxaRetrabalho = config.taxa_retrabalho != null ? config.taxa_retrabalho : (1 + (config.taxa_retrabalho_pct || 0) / 100);
  const margemLucro = config.margem_lucro_padrao != null ? config.margem_lucro_padrao : (1 + (config.margem_lucro_padrao_pct || 0) / 100);

  // 1. Custo do filamento
  const custo_filamento =
    custo_por_grama *
    peso_estimado_g *
    taxaRetrabalho;

  // 2. Custo do tempo de impressão
  const custo_tempo_impressao =
    ((config.taxa_manutencao || 0) + (config.custo_energia || 0)) *
    tempo_estimado_horas;

  // 3. Custo total sem lucro
  const custo_total_sem_lucro =
    custo_filamento +
    custo_tempo_impressao;

  // 4. Preço sugerido
  const preco_sugerido =
    custo_total_sem_lucro *
    margemLucro;

  // 5. Preço de custo
  const preco_custo = custo_por_grama * peso_estimado_g + ((config.custo_energia || 0) * tempo_estimado_horas);

  return {
    custo_filamento: arredondar(custo_filamento),
    custo_tempo_impressao: arredondar(custo_tempo_impressao),
    custo_total_sem_lucro: arredondar(custo_total_sem_lucro),
    preco_sugerido: arredondar(preco_sugerido),
    preco_custo: arredondar(preco_custo)
  };
};

const processarPecas = async (pecasInput, config) => {
  const pecas = [];
  for (const p of pecasInput) {
    if (!p.nome_peca || !p.nome_peca.trim()) throw invalid('Nome da peça é obrigatório.');
    if (!p.filamento_id) throw invalid('Filamento é obrigatório para cada peça.');
    const filamento = await Filamento.findById(p.filamento_id);
    if (!filamento) throw invalid('Filamento nao encontrado.');

    const quantidade = p.quantidade != null ? Number(p.quantidade) : 1;
    if (!Number.isInteger(quantidade) || quantidade < 1) throw invalid('Quantidade de peças deve ser inteira e maior que zero.');

    const peso = Number(p.peso_total_g ?? p.peso_estimado_g);
    if (!Number.isFinite(peso) || peso <= 0) throw invalid('Peso da peça deve ser maior que zero.');

    let tempoHoras;
    if (p.horas !== undefined || p.minutos !== undefined) {
      tempoHoras = readTime({ horas: p.horas, minutos: p.minutos });
    } else if (p.tempo_total_horas !== undefined || p.tempo_estimado_horas !== undefined) {
      tempoHoras = Number(p.tempo_total_horas ?? p.tempo_estimado_horas);
      if (!Number.isFinite(tempoHoras) || tempoHoras <= 0) throw invalid('Tempo de impressão deve ser maior que zero.');
    } else {
      throw invalid('Informe horas e minutos validos.');
    }

    const valores = calcularValoresOrcamento({
      filamento,
      peso_estimado_g: peso,
      tempo_estimado_horas: tempoHoras,
      config
    });

    const horas = p.horas != null ? Number(p.horas) : Math.floor(tempoHoras);
    const minutos = p.minutos != null ? Number(p.minutos) : Math.round((tempoHoras % 1) * 60);

    pecas.push({
      _id: p._id,
      nome_peca: p.nome_peca.trim(),
      link_modelo: p.link_modelo ? p.link_modelo.trim() : '',
      filamento_id: filamento._id,
      quantidade,
      peso_total_g: peso,
      tempo_horas: horas,
      tempo_minutos: minutos,
      tempo_total_horas: tempoHoras,
      custo_filamento: valores.custo_filamento,
      custo_tempo_impressao: valores.custo_tempo_impressao,
      preco_custo: valores.preco_custo,
      custo_total_sem_lucro: valores.custo_total_sem_lucro,
      preco_sugerido: valores.preco_sugerido
    });
  }
  return pecas;
};

const processarExtras = (extrasInput = []) => {
  const extras = [];
  for (const e of extrasInput) {
    if (!e.nome || !e.nome.trim()) throw invalid('Nome do produto extra é obrigatório.');
    const precoUnitario = Number(e.preco_unitario);
    if (!Number.isFinite(precoUnitario) || precoUnitario < 0) throw invalid('Preço unitário do extra deve ser maior ou igual a zero.');
    const quantidade = Number(e.quantidade);
    if (!Number.isInteger(quantidade) || quantidade < 1) throw invalid('Quantidade do extra deve ser inteira e maior que zero.');

    extras.push({
      _id: e._id,
      nome: e.nome.trim(),
      preco_unitario: precoUnitario,
      quantidade,
      custo_total: arredondar(precoUnitario * quantidade)
    });
  }
  return extras;
};

const consolidarFinanceiro = (pecas = [], extras = [], precoFinalCobradoInput = undefined) => {
  const custo_filamento = arredondar(pecas.reduce((sum, p) => sum + (p.custo_filamento || 0), 0));
  const custo_tempo_impressao = arredondar(pecas.reduce((sum, p) => sum + (p.custo_tempo_impressao || 0), 0));
  const preco_custo_pecas = arredondar(pecas.reduce((sum, p) => sum + (p.preco_custo || 0), 0));
  const custo_total_sem_lucro_pecas = arredondar(pecas.reduce((sum, p) => sum + (p.custo_total_sem_lucro || 0), 0));
  const preco_sugerido_pecas = arredondar(pecas.reduce((sum, p) => sum + (p.preco_sugerido || 0), 0));

  const custo_total_extras = arredondar(extras.reduce((sum, e) => sum + (e.custo_total || 0), 0));

  const custo_total_sem_lucro = arredondar(custo_total_sem_lucro_pecas + custo_total_extras);
  const preco_custo = arredondar(preco_custo_pecas + custo_total_extras);
  const preco_sugerido = arredondar(preco_sugerido_pecas + custo_total_extras);

  const preco_final_cobrado = precoFinalCobradoInput !== undefined && precoFinalCobradoInput !== null && precoFinalCobradoInput !== ''
    ? Number(precoFinalCobradoInput)
    : preco_sugerido;

  return {
    custo_filamento,
    custo_tempo_impressao,
    preco_custo_pecas,
    custo_total_sem_lucro_pecas,
    preco_sugerido_pecas,
    custo_total_extras,
    custo_total_sem_lucro,
    preco_custo,
    preco_sugerido,
    preco_final_cobrado
  };
};

export const createPedido = async (req, res) => {
  const reservedFilaments = [];
  try {
    if (!req.body.cliente_id) throw invalid('Cliente é obrigatório.');

    const config = await Configuracao.findOne();
    if (!config) return res.status(404).json({ message: 'Configuracao nao encontrada.' });

    // Normalizacao: se nao recebeu pecas[] mas tem campos legados nome_peca e filamento_id, empacota em pecas
    let pecasInput = req.body.pecas;
    if (!Array.isArray(pecasInput) && req.body.nome_peca) {
      pecasInput = [{
        nome_peca: req.body.nome_peca,
        link_modelo: req.body.link_modelo,
        filamento_id: req.body.filamento_id,
        quantidade: req.body.quantidade_pecas ?? 1,
        peso_total_g: req.body.peso_estimado_g,
        horas: req.body.horas,
        minutos: req.body.minutos
      }];
    }

    const extrasInput = req.body.extras || [];

    if ((!pecasInput || pecasInput.length === 0) && (!extrasInput || extrasInput.length === 0)) {
      throw invalid('O pedido deve conter ao menos uma peça ou um produto extra.');
    }

    const pecas = pecasInput ? await processarPecas(pecasInput, config) : [];
    const extras = processarExtras(extrasInput);

    const valor_sinal = req.body.valor_sinal != null ? Number(req.body.valor_sinal) : 0;
    if (!Number.isFinite(valor_sinal) || valor_sinal < 0) throw invalid('Valor invalido para valor_sinal.');

    if (req.body.preco_final_cobrado !== undefined && req.body.preco_final_cobrado !== null && req.body.preco_final_cobrado !== '') {
      const precoNumber = Number(req.body.preco_final_cobrado);
      if (!Number.isFinite(precoNumber) || precoNumber < 0) throw invalid('Valor invalido para preco_final_cobrado.');
    }

    const financeiro = consolidarFinanceiro(pecas, extras, req.body.preco_final_cobrado);

    // Snapshot das configurações padrão utilizadas no momento da criação do pedido
    const configuracao_snapshot = {
      custo_energia: config.custo_energia != null ? config.custo_energia : 0.90,
      taxa_manutencao: config.taxa_manutencao != null ? config.taxa_manutencao : 5,
      taxa_retrabalho_pct: config.taxa_retrabalho_pct != null
        ? config.taxa_retrabalho_pct
        : (config.taxa_retrabalho ? Math.round((config.taxa_retrabalho - 1) * 100) : 10),
      margem_lucro_padrao_pct: config.margem_lucro_padrao_pct != null
        ? config.margem_lucro_padrao_pct
        : (config.margem_lucro_padrao ? Math.round((config.margem_lucro_padrao - 1) * 100) : 40)
    };

    // Reserva de estoque
    const neededStock = getFilamentGrams(pecas);
    for (const [filamentoId, grams] of neededStock.entries()) {
      await reserveStock(filamentoId, grams);
      reservedFilaments.push({ id: filamentoId, grams });
    }

    // Campos de resumo legados para compatibilidade
    const nome_peca = pecas.length > 0
      ? pecas.map(p => p.nome_peca).join(', ')
      : extras.map(e => e.nome).join(', ');
    const link_modelo = pecas.find(p => p.link_modelo)?.link_modelo || '';
    const filamento_id = pecas[0]?.filamento_id || null;
    const quantidade_pecas = pecas.length > 0
      ? pecas.reduce((acc, p) => acc + p.quantidade, 0)
      : extras.reduce((acc, e) => acc + e.quantidade, 0);
    const peso_estimado_g = pecas.reduce((acc, p) => acc + p.peso_total_g, 0);
    const tempo_estimado_horas = pecas.reduce((acc, p) => acc + p.tempo_total_horas, 0);

    const pedido = new Pedido({
      cliente_id: req.body.cliente_id,
      pecas,
      extras,
      ...financeiro,
      configuracao_snapshot,
      nome_peca,
      link_modelo,
      filamento_id,
      quantidade_pecas,
      peso_estimado_g,
      tempo_estimado_horas,
      status: req.body.status || 'ORCAMENTO',
      status_pagamento: req.body.status_pagamento || 'PENDENTE',
      valor_sinal
    });

    await pedido.validate();
    const saved = await pedido.save();
    reservedFilaments.length = 0; // sucesso: nao reverter

    let result = saved;
    try {
      const query = Pedido.findById(saved._id);
      if (query && typeof query.populate === 'function') {
        result = (await query.populate('cliente_id').populate('filamento_id').populate('pecas.filamento_id')) || saved;
      }
    } catch {
      result = saved;
    }

    res.status(201).json(result);
  } catch (error) {
    for (const item of reservedFilaments) {
      await releaseStock(item.id, item.grams);
    }
    res.status(error.status || 400).json({ message: error.message });
  }
};

export const updatePedido = async (req, res) => {
  const newlyReserved = [];
  try {
    const previous = await Pedido.findById(req.params.id);
    if (!previous) return res.status(404).json({ message: 'Pedido nao encontrado.' });

    const prevStock = getFilamentGrams(previous.pecas, previous.filamento_id, previous.peso_estimado_g);

    const isExplicitMultiItemUpdate = Array.isArray(req.body.pecas) || Array.isArray(req.body.extras);
    const isLegacyProductionUpdate = !isExplicitMultiItemUpdate && (
      req.body.peso_estimado_g !== undefined ||
      req.body.horas !== undefined ||
      req.body.minutos !== undefined ||
      (req.body.filamento_id !== undefined && !sameId(req.body.filamento_id, previous.filamento_id))
    );

    const dataToUpdate = {};
    if (req.body.cliente_id !== undefined) dataToUpdate.cliente_id = req.body.cliente_id;
    if (req.body.status !== undefined) dataToUpdate.status = req.body.status;
    if (req.body.status_pagamento !== undefined) dataToUpdate.status_pagamento = req.body.status_pagamento;
    if (req.body.valor_sinal !== undefined) {
      const vs = Number(req.body.valor_sinal);
      if (!Number.isFinite(vs) || vs < 0) throw invalid('Valor invalido para valor_sinal.');
      dataToUpdate.valor_sinal = vs;
    }
    if (req.body.preco_final_cobrado !== undefined) {
      if (req.body.preco_final_cobrado === '' || req.body.preco_final_cobrado === null) {
        dataToUpdate.preco_final_cobrado = undefined;
      } else {
        const pfc = Number(req.body.preco_final_cobrado);
        if (!Number.isFinite(pfc) || pfc < 0) throw invalid('Valor invalido para preco_final_cobrado.');
        dataToUpdate.preco_final_cobrado = pfc;
      }
    }

    // Preserva o snapshot de configurações original do pedido se existir
    if (previous.configuracao_snapshot) {
      dataToUpdate.configuracao_snapshot = previous.configuracao_snapshot;
    }

    let toRelease = [];

    if (isExplicitMultiItemUpdate) {
      const config = await Configuracao.findOne();
      if (!config) return res.status(404).json({ message: 'Configuracao nao encontrada.' });

      const pecasInput = req.body.pecas || previous.pecas || [];
      const extrasInput = req.body.extras || previous.extras || [];

      if (pecasInput.length === 0 && extrasInput.length === 0) {
        throw invalid('O pedido deve conter ao menos uma peça ou um produto extra.');
      }

      const pecas = await processarPecas(pecasInput, config);
      const extras = processarExtras(extrasInput);

      const pfcInput = dataToUpdate.preco_final_cobrado ?? previous.preco_final_cobrado;
      const financeiro = consolidarFinanceiro(pecas, extras, pfcInput);

      const newStock = getFilamentGrams(pecas);
      const allFilamentIds = new Set([...prevStock.keys(), ...newStock.keys()]);

      for (const fId of allFilamentIds) {
        const prevG = prevStock.get(fId) || 0;
        const newG = newStock.get(fId) || 0;
        const diff = newG - prevG;
        if (diff > 0) {
          await reserveStock(fId, diff);
          newlyReserved.push({ id: fId, grams: diff });
        } else if (diff < 0) {
          toRelease.push({ id: fId, grams: Math.abs(diff) });
        }
      }

      dataToUpdate.pecas = pecas;
      dataToUpdate.extras = extras;
      Object.assign(dataToUpdate, financeiro);
      dataToUpdate.nome_peca = pecas.length > 0
        ? pecas.map(p => p.nome_peca).join(', ')
        : extras.map(e => e.nome).join(', ');
      dataToUpdate.link_modelo = pecas.find(p => p.link_modelo)?.link_modelo || '';
      dataToUpdate.filamento_id = pecas[0]?.filamento_id || null;
      dataToUpdate.quantidade_pecas = pecas.length > 0
        ? pecas.reduce((acc, p) => acc + p.quantidade, 0)
        : extras.reduce((acc, e) => acc + e.quantidade, 0);
      dataToUpdate.peso_estimado_g = pecas.reduce((acc, p) => acc + p.peso_total_g, 0);
      dataToUpdate.tempo_estimado_horas = pecas.reduce((acc, p) => acc + p.tempo_total_horas, 0);

    } else if (isLegacyProductionUpdate) {
      const materialId = req.body.filamento_id ?? previous.filamento_id;
      const weight = req.body.peso_estimado_g !== undefined ? Number(req.body.peso_estimado_g) : previous.peso_estimado_g;
      if (!Number.isFinite(weight) || weight <= 0) throw invalid('Valor invalido para peso_estimado_g.');

      let time = previous.tempo_estimado_horas;
      if (req.body.horas !== undefined || req.body.minutos !== undefined) {
        time = readTime(req.body);
      }

      const filamento = await Filamento.findById(materialId);
      if (!filamento) return res.status(404).json({ message: 'Filamento nao encontrado.' });
      const config = await Configuracao.findOne();
      if (!config) return res.status(404).json({ message: 'Configuracao nao encontrada.' });

      const values = calcularValoresOrcamento({
        filamento,
        peso_estimado_g: weight,
        tempo_estimado_horas: time,
        config
      });

      const materialChanged = !sameId(materialId, previous.filamento_id);
      const reserve = materialChanged ? Number(weight) : Math.max(0, Number(weight) - Number(previous.peso_estimado_g));
      const release = materialChanged ? Number(previous.peso_estimado_g) : Math.max(0, Number(previous.peso_estimado_g) - Number(weight));

      if (reserve > 0) {
        await reserveStock(materialId, reserve);
        newlyReserved.push({ id: materialId, grams: reserve });
      }
      if (release > 0) {
        toRelease.push({ id: previous.filamento_id, grams: release });
      }

      const horas = req.body.horas != null ? Number(req.body.horas) : Math.floor(time);
      const minutos = req.body.minutos != null ? Number(req.body.minutos) : Math.round((time % 1) * 60);

      dataToUpdate.filamento_id = materialId;
      dataToUpdate.peso_estimado_g = weight;
      dataToUpdate.tempo_estimado_horas = time;
      Object.assign(dataToUpdate, values);

      dataToUpdate.pecas = [{
        nome_peca: req.body.nome_peca ?? previous.nome_peca ?? 'Peça',
        link_modelo: req.body.link_modelo ?? previous.link_modelo ?? '',
        filamento_id: materialId,
        quantidade: req.body.quantidade_pecas ?? previous.quantidade_pecas ?? 1,
        peso_total_g: weight,
        tempo_horas: horas,
        tempo_minutos: minutos,
        tempo_total_horas: time,
        ...values
      }];
    }

    if (req.body.nome_peca && !dataToUpdate.nome_peca) dataToUpdate.nome_peca = req.body.nome_peca;
    if (req.body.link_modelo !== undefined && !dataToUpdate.link_modelo) dataToUpdate.link_modelo = req.body.link_modelo;
    if (req.body.quantidade_pecas !== undefined && !dataToUpdate.quantidade_pecas) {
      const qp = Number(req.body.quantidade_pecas);
      if (!Number.isInteger(qp) || qp < 1) throw invalid('Quantidade deve ser inteira.');
      dataToUpdate.quantidade_pecas = qp;
    }

    // Valida modificacoes
    const candidate = new Pedido({ ...previous.toObject(), ...dataToUpdate });
    await candidate.validate();

    const pedido = await Pedido.findByIdAndUpdate(
      req.params.id,
      { $set: dataToUpdate },
      { new: true, runValidators: true }
    ).populate('cliente_id').populate('filamento_id').populate('pecas.filamento_id');

    if (!pedido) throw invalid('Pedido nao encontrado.');
    newlyReserved.length = 0; // sucesso: nao reverter

    // Libera estoques que diminuiram
    for (const item of toRelease) {
      await releaseStock(item.id, item.grams);
    }

    res.json(pedido);
  } catch (error) {
    for (const item of newlyReserved) {
      await releaseStock(item.id, item.grams);
    }
    res.status(error.status || 400).json({ message: error.message });
  }
};

export const deletePedido = async (req, res) => {
  try {
    const pedido = await Pedido.findByIdAndDelete(req.params.id);
    if (!pedido) return res.status(404).json({ message: 'Pedido nao encontrado.' });

    const stockMap = getFilamentGrams(pedido.pecas, pedido.filamento_id, pedido.peso_estimado_g);
    for (const [filamentoId, grams] of stockMap.entries()) {
      await releaseStock(filamentoId, grams);
    }

    res.json({ message: 'Pedido removido.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const calcularOrcamento = async (req, res) => {
  try {
    const {
      filamento_id,
      peso_estimado_g,
      horas,
      minutos
    } = req.body;

    if (horas == null || minutos == null) {
      return res.status(400).json({
        message: 'Horas ou Minutos do tempo de impressão não informados'
      });
    }

    const tempo_estimado_horas = converterTempoParaHoras(horas, minutos);

    if (!filamento_id) {
      return res.status(400).json({
        message: 'Filamento não informado'
      });
    }

    if (peso_estimado_g == null) {
      return res.status(400).json({
        message: 'Quantidade de filamento não informada'
      });
    }

    const filamento = await Filamento.findById(filamento_id);
    if (!filamento) {
      return res.status(404).json({
        message: 'Filamento não encontrado'
      });
    }

    const config = await Configuracao.findOne();
    if (!config) {
      return res.status(404).json({
        message: 'Configuração não encontrada'
      });
    }

    const valores = calcularValoresOrcamento({
      filamento,
      peso_estimado_g: Number(peso_estimado_g),
      tempo_estimado_horas,
      config
    });

    res.json(valores);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};
