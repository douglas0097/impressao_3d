import Pedido from '../models/Pedido.js';
import Filamento from '../models/Filamento.js';
import Configuracao from '../models/Configuracao.js';
import { converterTempoParaHoras } from '../utils/tempo.js';

export const getPedidos = async (req, res) => {
  try {
    const pedidos = await Pedido.find().populate('cliente_id').populate('filamento_id').sort('-createdAt');
    res.json(pedidos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// O peso e o tempo recebidos representam os totais do pedido.
const editableFields = ['cliente_id', 'nome_peca', 'link_modelo', 'filamento_id', 'quantidade_pecas', 'peso_estimado_g', 'status', 'status_pagamento', 'valor_sinal', 'preco_final_cobrado'];
const pickFields = body => Object.fromEntries(editableFields.filter(key => body[key] !== undefined).map(key => [key, body[key]]));
const invalid = message => Object.assign(new Error(message), { status: 400 });
const sameId = (left, right) => String(left || '') === String(right || '');
const validateNumbers = data => {
  for (const key of ['quantidade_pecas', 'peso_estimado_g', 'valor_sinal', 'preco_final_cobrado']) {
    if (data[key] === undefined) continue;
    const number = Number(data[key]);
    if (data[key] === null || data[key] === '' || !Number.isFinite(number) || number < 0 || (['quantidade_pecas', 'peso_estimado_g'].includes(key) && number <= 0)) throw invalid(`Valor invalido para ${key}.`);
    if (key === 'quantidade_pecas' && !Number.isInteger(number)) throw invalid('Quantidade deve ser inteira.');
    data[key] = number;
  }
};
const readTime = body => {
  if (body.horas == null || body.minutos == null || !Number.isFinite(Number(body.horas)) || !Number.isFinite(Number(body.minutos))) throw invalid('Informe horas e minutos validos.');
  const time = converterTempoParaHoras(body.horas, body.minutos);
  if (time <= 0) throw invalid('Tempo de impressao deve ser maior que zero.');
  return time;
};

// Reserva atomica: a verificacao de saldo e o desconto acontecem juntos.
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
const releaseStock = async (id, grams) => {
  if (!id || !(grams > 0)) return;
  await Filamento.updateOne({ _id: id }, [{ $set: { estoque_gramas: { $add: [{ $ifNull: ['$estoque_gramas', { $ifNull: ['$peso_total_g', 0] }] }, grams] } } }], { updatePipeline: true });
};

export const createPedido = async (req, res) => {
  let reservation = null;
  try {
    const data = pickFields(req.body);
    validateNumbers(data);
    data.tempo_estimado_horas = readTime(req.body);
    const filamento = await Filamento.findById(data.filamento_id);
    if (!filamento) return res.status(404).json({ message: 'Filamento nao encontrado.' });
    const config = await Configuracao.findOne();
    if (!config) return res.status(404).json({ message: 'Configuracao nao encontrada.' });
    const values = calcularValoresOrcamento({ filamento, peso_estimado_g: data.peso_estimado_g, tempo_estimado_horas: data.tempo_estimado_horas, config });
    const pedido = new Pedido({ ...data, ...values, preco_final_cobrado: data.preco_final_cobrado ?? values.preco_sugerido });
    await pedido.validate();
    await reserveStock(data.filamento_id, data.peso_estimado_g);
    reservation = { id: data.filamento_id, grams: data.peso_estimado_g };
    const saved = await pedido.save();
    reservation = null;
    res.status(201).json(saved);
  } catch (error) {
    if (reservation) await releaseStock(reservation.id, reservation.grams);
    res.status(error.status || 400).json({ message: error.message });
  }
};

export const updatePedido = async (req, res) => {
  let reservation = null;
  try {
    const previous = await Pedido.findById(req.params.id);
    if (!previous) return res.status(404).json({ message: 'Pedido nao encontrado.' });
    const data = pickFields(req.body);
    validateNumbers(data);
    if (req.body.horas !== undefined || req.body.minutos !== undefined) data.tempo_estimado_horas = readTime(req.body);
    const materialId = data.filamento_id ?? previous.filamento_id;
    const weight = data.peso_estimado_g ?? previous.peso_estimado_g;
    const time = data.tempo_estimado_horas ?? previous.tempo_estimado_horas;
    const materialChanged = !sameId(materialId, previous.filamento_id);
    const productionChanged = materialChanged || Number(weight) !== Number(previous.peso_estimado_g) || Math.abs(time - previous.tempo_estimado_horas) > 0.000001;
    if (productionChanged) {
      const filamento = await Filamento.findById(materialId);
      if (!filamento) return res.status(404).json({ message: 'Filamento nao encontrado.' });
      const config = await Configuracao.findOne();
      if (!config) return res.status(404).json({ message: 'Configuracao nao encontrada.' });
      Object.assign(data, calcularValoresOrcamento({ filamento, peso_estimado_g: weight, tempo_estimado_horas: time, config }));
    }
    // Valida antes de alterar estoque; registros antigos com referencias nulas
    // continuam permitindo atualizacoes pontuais de status e pagamento.
    const candidate = new Pedido({ ...previous.toObject(), ...data });
    await candidate.validate(Object.keys(data));
    const reserve = materialChanged ? Number(weight) : Math.max(0, Number(weight) - Number(previous.peso_estimado_g));
    const release = materialChanged ? Number(previous.peso_estimado_g) : Math.max(0, Number(previous.peso_estimado_g) - Number(weight));
    await reserveStock(materialId, reserve);
    reservation = { id: materialId, grams: reserve };
    const pedido = await Pedido.findByIdAndUpdate(req.params.id, { $set: data }, { new: true, runValidators: true }).populate('cliente_id').populate('filamento_id');
    if (!pedido) throw invalid('Pedido nao encontrado.');
    reservation = null;
    await releaseStock(previous.filamento_id, release);
    res.json(pedido);
  } catch (error) {
    if (reservation) await releaseStock(reservation.id, reservation.grams);
    res.status(error.status || 400).json({ message: error.message });
  }
};

export const deletePedido = async (req, res) => {
  try {
    const pedido = await Pedido.findByIdAndDelete(req.params.id);
    if (!pedido) return res.status(404).json({ message: 'Pedido nao encontrado.' });
    await releaseStock(pedido.filamento_id, Number(pedido.peso_estimado_g));
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
      peso_estimado_g,
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

const arredondar = (valor) => Number(valor.toFixed(2));

const calcularValoresOrcamento = ({
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