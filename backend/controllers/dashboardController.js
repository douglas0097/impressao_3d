import Pedido from '../models/Pedido.js';
import Filamento from '../models/Filamento.js';

export const getDashboardMetrics = async (req, res) => {
  try {
    const pedidos = await Pedido.find();
    
    const faturamento_total = pedidos
      .filter(p => p.status !== 'CANCELADO')
      .reduce((acc, curr) => acc + (curr.preco_final_cobrado || curr.preco_sugerido || 0), 0);

    const lucro_estimado = pedidos
      .filter(p => p.status !== 'CANCELADO')
      .reduce((acc, curr) => {
        const preco = curr.preco_final_cobrado || curr.preco_sugerido || 0;
        const custo = curr.custo_total_sem_lucro || 0;
        return acc + (preco - custo);
      }, 0);

    const pedidos_em_andamento = pedidos.filter(p => p.status === 'EM_IMPRESSAO' || p.status === 'APROVADO').length;
    const pedidos_concluidos = pedidos.filter(p => p.status === 'CONCLUIDO' || p.status === 'ENTREGUE').length;

    res.json({
      faturamento_total,
      lucro_estimado,
      pedidos_em_andamento,
      pedidos_concluidos,
      total_pedidos: pedidos.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
