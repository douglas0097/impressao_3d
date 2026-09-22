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
    const pedido = new Pedido(req.body);
    const saved = await pedido.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ message: error.message });
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
    const { filamento_id, peso_estimado_g, tempo_estimado_horas } = req.body;
    
    const filamento = await Filamento.findById(filamento_id);
    let config = await Configuracao.findOne();
    
    if (!config) config = await Configuracao.create({});
    if (!filamento) return res.status(404).json({ message: 'Filamento não encontrado' });

    // 1. Custo do Filamento
    const custo_filamento = peso_estimado_g * filamento.custo_por_grama;

    // 2. Custo de Energia e Máquina
    // kWh = (Potencia / 1000) * Horas
    const energia_kwh = (config.potencia_impressora_w / 1000) * tempo_estimado_horas;
    const custo_energia = energia_kwh * config.custo_energia_kwh;
    
    // 3. Custos Operacionais Adicionais por hora
    const custo_hora_adicional = tempo_estimado_horas * config.custo_hora_impressao_adicional;

    // 4. Manutenção e Retrabalho
    // Aplicados sobre os custos básicos
    const custo_base = custo_filamento + custo_energia + custo_hora_adicional;
    const custo_manutencao = custo_base * (config.taxa_manutencao_pct / 100);
    const custo_retrabalho = custo_base * (config.taxa_retrabalho_pct / 100);

    const custo_total_sem_lucro = custo_base + custo_manutencao + custo_retrabalho;

    // 5. Preço Sugerido (com Margem de Lucro Padrão)
    // Preço de venda = Custo Total / (1 - (Margem / 100))
    // Opcional: ou Custo Total * (1 + (Margem / 100)) dependendo de como preferem (Markup vs Margem)
    // Vamos usar Markup simples que é mais comum
    const preco_sugerido = custo_total_sem_lucro * (1 + (config.margem_lucro_padrao_pct / 100));

    res.json({
      custo_filamento,
      custo_tempo_energia: custo_energia + custo_hora_adicional,
      custo_manutencao,
      custo_retrabalho,
      custo_total_sem_lucro,
      preco_sugerido
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
