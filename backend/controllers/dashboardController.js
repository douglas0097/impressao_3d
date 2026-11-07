import Pedido from '../models/Pedido.js';
import Filamento from '../models/Filamento.js';
import Cliente from '../models/Cliente.js';

const round = (val) => Math.round((Number(val) || 0) * 100) / 100;
const pad = (n) => String(n).padStart(2, '0');
const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export const getDashboardMetrics = async (req, res) => {
  try {
    const periodo = req.query.periodo || '6m';
    const now = new Date();

    let startDate = null;
    let buckets = [];
    let isDaily = false;

    if (periodo === '7d' || periodo === '30d') {
      const days = periodo === '7d' ? 7 : 30;
      isDaily = true;
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - (days - 1));
      startDate.setHours(0, 0, 0, 0);

      for (let i = 0; i < days; i++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
        const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
        const label = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
        buckets.push({
          key,
          label,
          faturamento_recebido: 0,
          faturamento_pendente: 0,
          faturamento_total: 0,
          pedidos: 0,
          pedidos_concluidos: 0
        });
      }
    } else {
      let numMonths = 6;
      if (periodo === '3m') numMonths = 3;
      else if (periodo === '12m') numMonths = 12;
      else if (periodo === 'all') numMonths = null;

      if (numMonths !== null) {
        startDate = new Date(now.getFullYear(), now.getMonth() - (numMonths - 1), 1, 0, 0, 0, 0);
        for (let i = 0; i < numMonths; i++) {
          const d = new Date(now.getFullYear(), now.getMonth() - (numMonths - 1) + i, 1);
          const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
          const label = `${monthNames[d.getMonth()]}/${String(d.getFullYear()).slice(-2)}`;
          buckets.push({
            key,
            label,
            faturamento_recebido: 0,
            faturamento_pendente: 0,
            faturamento_total: 0,
            pedidos: 0,
            pedidos_concluidos: 0
          });
        }
      } else {
        // all: busca data do pedido mais antigo para gerar os baldes desde então
        const oldest = await Pedido.findOne().sort({ createdAt: 1 }).select('createdAt');
        const oldestDate = oldest?.createdAt ? new Date(oldest.createdAt) : new Date(now.getFullYear(), now.getMonth() - 5, 1);
        const start = new Date(oldestDate.getFullYear(), oldestDate.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth(), 1);
        const cur = new Date(start);
        while (cur <= end) {
          const key = `${cur.getFullYear()}-${pad(cur.getMonth() + 1)}`;
          const label = `${monthNames[cur.getMonth()]}/${String(cur.getFullYear()).slice(-2)}`;
          buckets.push({
            key,
            label,
            faturamento_recebido: 0,
            faturamento_pendente: 0,
            faturamento_total: 0,
            pedidos: 0,
            pedidos_concluidos: 0
          });
          cur.setMonth(cur.getMonth() + 1);
        }
      }
    }

    const query = startDate ? { createdAt: { $gte: startDate } } : {};
    const pedidos = await Pedido.find(query)
      .populate('cliente_id', 'nome telefone')
      .populate('pecas.filamento_id', 'nome tipo_polimero cor')
      .populate('filamento_id', 'nome tipo_polimero cor')
      .lean();

    const bucketMap = new Map(buckets.map(b => [b.key, b]));

    let faturamento_recebido = 0;
    let faturamento_pendente = 0;
    let lucro_estimado = 0;
    let pedidos_em_andamento = 0;
    let pedidos_concluidos = 0;
    let pedidos_orcamento = 0;
    let valor_potencial_orcamento = 0;
    let pedidos_cancelados = 0;
    let peso_total_impresso_g = 0;
    let tempo_total_horas = 0;

    const statusCounts = {
      ORCAMENTO: { status: 'ORCAMENTO', label: 'Orçamento', count: 0, valor: 0, cor: '#64748b' },
      APROVADO: { status: 'APROVADO', label: 'Aprovado', count: 0, valor: 0, cor: '#3b82f6' },
      EM_IMPRESSAO: { status: 'EM_IMPRESSAO', label: 'Em impressão', count: 0, valor: 0, cor: '#f59e0b' },
      CONCLUIDO: { status: 'CONCLUIDO', label: 'Concluído', count: 0, valor: 0, cor: '#10b981' },
      ENTREGUE: { status: 'ENTREGUE', label: 'Entregue', count: 0, valor: 0, cor: '#06b6d4' },
      CANCELADO: { status: 'CANCELADO', label: 'Cancelado', count: 0, valor: 0, cor: '#ef4444' }
    };

    const pagamentosCounts = {
      PAGO: { status: 'PAGO', label: 'Totalmente Pago', count: 0, valor_recebido: 0, valor_pendente: 0, cor: '#10b981' },
      SINAL_50: { status: 'SINAL_50', label: 'Sinal 50% Pago', count: 0, valor_recebido: 0, valor_pendente: 0, cor: '#f59e0b' },
      PENDENTE: { status: 'PENDENTE', label: 'Totalmente Pendente', count: 0, valor_recebido: 0, valor_pendente: 0, cor: '#ef4444' }
    };

    const clientMap = new Map();
    const filamentConsumption = new Map();

    for (const p of pedidos) {
      const precoCobrado = Number(p.preco_final_cobrado ?? p.preco_sugerido ?? 0);
      const custo = Number(p.custo_total_sem_lucro ?? p.preco_custo ?? 0);
      const sinal = Number(p.valor_sinal || 0);
      const st = p.status || 'ORCAMENTO';
      const stPag = p.status_pagamento || 'PENDENTE';

      if (statusCounts[st]) {
        statusCounts[st].count += 1;
        statusCounts[st].valor = round(statusCounts[st].valor + precoCobrado);
      }

      if (st === 'CANCELADO') {
        pedidos_cancelados += 1;
        continue;
      }

      if (st === 'ORCAMENTO') {
        pedidos_orcamento += 1;
        valor_potencial_orcamento = round(valor_potencial_orcamento + precoCobrado);
        continue;
      }

      // Pedidos Confirmados (Vendas Efetivadas: APROVADO, EM_IMPRESSAO, CONCLUIDO, ENTREGUE)
      if (st === 'APROVADO' || st === 'EM_IMPRESSAO') {
        pedidos_em_andamento += 1;
      }
      if (st === 'CONCLUIDO' || st === 'ENTREGUE') {
        pedidos_concluidos += 1;
      }

      let recebido = 0;
      let pendente = 0;

      if (stPag === 'PAGO') {
        recebido = precoCobrado;
        pendente = 0;
      } else if (stPag === 'SINAL_50') {
        recebido = sinal > 0 ? sinal : precoCobrado * 0.5;
        pendente = Math.max(0, precoCobrado - recebido);
      } else {
        recebido = sinal > 0 ? sinal : 0;
        pendente = Math.max(0, precoCobrado - recebido);
      }

      faturamento_recebido = round(faturamento_recebido + recebido);
      faturamento_pendente = round(faturamento_pendente + pendente);
      lucro_estimado = round(lucro_estimado + (precoCobrado - custo));

      if (pagamentosCounts[stPag]) {
        pagamentosCounts[stPag].count += 1;
        pagamentosCounts[stPag].valor_recebido = round(pagamentosCounts[stPag].valor_recebido + recebido);
        pagamentosCounts[stPag].valor_pendente = round(pagamentosCounts[stPag].valor_pendente + pendente);
      }

      // Preenchimento de bucket cronológico
      if (p.createdAt) {
        const pDate = new Date(p.createdAt);
        const bKey = isDaily
          ? `${pDate.getFullYear()}-${pad(pDate.getMonth() + 1)}-${pad(pDate.getDate())}`
          : `${pDate.getFullYear()}-${pad(pDate.getMonth() + 1)}`;
        const bucket = bucketMap.get(bKey);
        if (bucket) {
          bucket.pedidos += 1;
          bucket.faturamento_recebido = round(bucket.faturamento_recebido + recebido);
          bucket.faturamento_pendente = round(bucket.faturamento_pendente + pendente);
          bucket.faturamento_total = round(bucket.faturamento_total + precoCobrado);
          if (st === 'CONCLUIDO' || st === 'ENTREGUE') {
            bucket.pedidos_concluidos += 1;
          }
        }
      }

      // Ranking de clientes
      const clientId = p.cliente_id?._id ? String(p.cliente_id._id) : (p.cliente_id ? String(p.cliente_id) : 'sem_cliente');
      const clientName = p.cliente_id?.nome || 'Cliente não identificado';
      const cData = clientMap.get(clientId) || { id: clientId, nome: clientName, total_gasto: 0, pedidos_count: 0 };
      cData.total_gasto = round(cData.total_gasto + precoCobrado);
      cData.pedidos_count += 1;
      clientMap.set(clientId, cData);

      // Consumo de filamentos nas peças produzidas
      if (Array.isArray(p.pecas) && p.pecas.length > 0) {
        for (const peca of p.pecas) {
          const peso = Number(peca.peso_total_g || 0);
          const tempo = Number(peca.tempo_total_horas || 0);
          peso_total_impresso_g = round(peso_total_impresso_g + peso);
          tempo_total_horas = round(tempo_total_horas + tempo);

          if (peca.filamento_id) {
            const fid = String(peca.filamento_id._id || peca.filamento_id);
            const fname = peca.filamento_id?.nome || 'Filamento';
            const ftipo = peca.filamento_id?.tipo_polimero || 'PLA';
            const fcor = peca.filamento_id?.cor || '';
            const fData = filamentConsumption.get(fid) || { id: fid, nome: fname, tipo_polimero: ftipo, cor: fcor, consumo_gramas: 0 };
            fData.consumo_gramas = round(fData.consumo_gramas + peso);
            filamentConsumption.set(fid, fData);
          }
        }
      } else {
        const peso = Number(p.peso_estimado_g || 0);
        const tempo = Number(p.tempo_estimado_horas || 0);
        peso_total_impresso_g = round(peso_total_impresso_g + peso);
        tempo_total_horas = round(tempo_total_horas + tempo);

        if (p.filamento_id) {
          const fid = String(p.filamento_id._id || p.filamento_id);
          const fname = p.filamento_id?.nome || 'Filamento';
          const ftipo = p.filamento_id?.tipo_polimero || 'PLA';
          const fcor = p.filamento_id?.cor || '';
          const fData = filamentConsumption.get(fid) || { id: fid, nome: fname, tipo_polimero: ftipo, cor: fcor, consumo_gramas: 0 };
          fData.consumo_gramas = round(fData.consumo_gramas + peso);
          filamentConsumption.set(fid, fData);
        }
      }
    }

    // Busca inventário de bobinas
    const allFilaments = await Filamento.find().lean();
    const filamentosEstoque = allFilaments.map(f => {
      const fid = String(f._id);
      const consumed = filamentConsumption.get(fid)?.consumo_gramas || 0;
      const estoque = Number(f.estoque_gramas ?? f.peso_total_g ?? 0);
      return {
        id: fid,
        nome: f.nome,
        tipo_polimero: f.tipo_polimero,
        cor: f.cor,
        estoque_gramas: estoque,
        consumo_gramas: consumed,
        estoque_baixo: estoque <= 200
      };
    }).sort((a, b) => b.consumo_gramas - a.consumo_gramas);

    // Top 5 clientes
    const top_clientes = Array.from(clientMap.values())
      .map(c => ({
        ...c,
        ticket_medio: c.pedidos_count > 0 ? round(c.total_gasto / c.pedidos_count) : 0
      }))
      .sort((a, b) => b.total_gasto - a.total_gasto)
      .slice(0, 5);

    const faturamento_total_confirmado = round(faturamento_recebido + faturamento_pendente);
    const margem_lucro_pct = faturamento_total_confirmado > 0 ? round((lucro_estimado / faturamento_total_confirmado) * 100) : 0;
    const ticket_medio = (pedidos_concluidos + pedidos_em_andamento) > 0
      ? round(faturamento_total_confirmado / (pedidos_concluidos + pedidos_em_andamento))
      : 0;

    res.json({
      // Compatibilidade legada
      faturamento_total: faturamento_total_confirmado,
      lucro_estimado,
      pedidos_em_andamento,
      pedidos_concluidos,
      total_pedidos: pedidos.length,

      // Estrutura completa de gestão
      periodo,
      metricas: {
        faturamento_recebido,
        faturamento_pendente,
        faturamento_total_confirmado,
        lucro_estimado,
        margem_lucro_pct,
        pedidos_em_andamento,
        pedidos_concluidos,
        pedidos_orcamento,
        valor_potencial_orcamento,
        pedidos_cancelados,
        total_pedidos: pedidos.length,
        ticket_medio,
        peso_total_impresso_g,
        tempo_total_horas
      },
      evolucao_temporal: buckets,
      distribuicao_status: Object.values(statusCounts),
      situacao_pagamentos: Object.values(pagamentosCounts),
      top_clientes,
      consumo_filamentos: filamentosEstoque
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
