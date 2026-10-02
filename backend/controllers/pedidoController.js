import Pedido from '../models/Pedido.js';
import Filamento from '../models/Filamento.js';
import Configuracao from '../models/Configuracao.js';

export const getPedidos = async (req, res) => {
  try {
    const pedidos = await Pedido.find().populate('cliente_id').populate('filamento_id').sort('-createdAt');
    res.json(pedidos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createPedido = async (req, res) => {
  try {
    const {
      cliente_id,
      nome_peca,
      link_modelo,
      filamento_id,
      quantidade_pecas,
      peso_estimado_g,
      tempo_estimado_horas
    } = req.body;

    // Buscar o filamento
    const filamento = await Filamento.findById(filamento_id);

    if (!filamento) {
      return res.status(404).json({
        message: 'Filamento não encontrado'
      });
    }

    // Buscar configurações globais
    const config = await Configuracao.findOne();

    if (!config) {
      return res.status(404).json({
        message: 'Configuração não encontrada'
      });
    }

    // Recalcular os valores no backend
    const valores = calcularValoresOrcamento({
      filamento,
      peso_estimado_g,
      tempo_estimado_horas,
      config
    });

    // Criar o pedido com os valores calculados pelo backend
    const pedido = new Pedido({
      cliente_id,
      nome_peca,
      link_modelo,
      filamento_id,
      quantidade_pecas,
      peso_estimado_g,
      tempo_estimado_horas,

      // Snapshot financeiro
      custo_filamento: valores.custo_filamento,
      custo_tempo_impressao: valores.custo_tempo_impressao,
      custo_total_sem_lucro: valores.custo_total_sem_lucro,
      preco_sugerido: valores.preco_sugerido,
      preco_custo: valores.preco_custo
    });

    const saved = await pedido.save();

    res.status(201).json(saved);

  } catch (error) {
    res.status(400).json({
      message: error.message
    });
  }
};

export const updatePedido = async (req, res) => {
  try {
    const pedidoAntigo = await Pedido.findById(req.params.id);
    if (!pedidoAntigo) return res.status(404).json({ message: 'Pedido não encontrado' });

    const pedido = await Pedido.findByIdAndUpdate(req.params.id, req.body, { new: true });

    const isNovoStatusFechado = req.body.status === 'CONCLUIDO' || req.body.status === 'ENTREGUE';
    const isAntigoStatusFechado = pedidoAntigo.status === 'CONCLUIDO' || pedidoAntigo.status === 'ENTREGUE';

    // Descontar do estoque quando o pedido for concluído/entregue e antes não era
    if (isNovoStatusFechado && !isAntigoStatusFechado) {
      const filamento = await Filamento.findById(pedido.filamento_id);
      if (filamento) {
        let estoqueAtual = filamento.estoque_gramas != null ? filamento.estoque_gramas : filamento.peso_total_g;
        filamento.estoque_gramas = estoqueAtual - pedido.peso_estimado_g;
        await filamento.save();
      }
    }

    // Retornar ao estoque se o pedido deixou de ser concluído/entregue
    if (isAntigoStatusFechado && req.body.status && !isNovoStatusFechado) {
      const filamento = await Filamento.findById(pedido.filamento_id);
      if (filamento) {
        let estoqueAtual = filamento.estoque_gramas != null ? filamento.estoque_gramas : filamento.peso_total_g;
        filamento.estoque_gramas = estoqueAtual + pedido.peso_estimado_g;
        await filamento.save();
      }
    }

    res.json(pedido);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deletePedido = async (req, res) => {
  try {
    await Pedido.findByIdAndDelete(req.params.id);
    res.json({ message: 'Pedido removido' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const calcularOrcamento = async (req, res) => {
  try {
    const {
      filamento_id,
      peso_estimado_g,
      tempo_estimado_horas
    } = req.body;

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

    if (tempo_estimado_horas == null) {
      return res.status(400).json({
        message: 'Tempo de impressão não informado'
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


const calcularValoresOrcamento = ({
  filamento,
  peso_estimado_g,
  tempo_estimado_horas,
  config
}) => {
  // 1. Custo do filamento
  const custo_filamento =
    (filamento.preco_kg / 1000) *
    peso_estimado_g *
    config.taxa_retrabalho;

  // 2. Custo do tempo de impressão (2.10 + 0.75) * 1.9
  const custo_tempo_impressao =
    (config.taxa_manutencao + config.custo_energia) *
    tempo_estimado_horas;

  // 3. Custo total sem lucro
  const custo_total_sem_lucro =
    custo_filamento +
    custo_tempo_impressao;

  // 4. Preço sugerido
  const preco_sugerido =
    custo_total_sem_lucro *
    config.margem_lucro_padrao;

  // 5. Preço de custo
  const preco_custo =
    custo_filamento +
    (config.custo_energia * tempo_estimado_horas);

  return {
    custo_filamento,
    custo_tempo_impressao,
    custo_total_sem_lucro,
    preco_sugerido,
    preco_custo
  };
};