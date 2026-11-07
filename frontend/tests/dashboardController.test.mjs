import test from 'node:test';
import assert from 'node:assert/strict';
import Pedido from '../../backend/models/Pedido.js';
import Filamento from '../../backend/models/Filamento.js';
import { getDashboardMetrics } from '../../backend/controllers/dashboardController.js';

test('getDashboardMetrics calcula corretamente faturamento recebido, pendente e orçamentos', async (t) => {
  const fakePedidos = [
    {
      _id: 'ped1',
      cliente_id: { _id: 'cli1', nome: 'Cliente A' },
      status: 'CONCLUIDO',
      status_pagamento: 'PAGO',
      preco_final_cobrado: 100,
      custo_total_sem_lucro: 40,
      createdAt: new Date('2026-11-01T10:00:00Z')
    },
    {
      _id: 'ped2',
      cliente_id: { _id: 'cli1', nome: 'Cliente A' },
      status: 'EM_IMPRESSAO',
      status_pagamento: 'SINAL_50',
      preco_final_cobrado: 200,
      valor_sinal: 100,
      custo_total_sem_lucro: 80,
      createdAt: new Date('2026-11-02T10:00:00Z')
    },
    {
      _id: 'ped3',
      cliente_id: { _id: 'cli2', nome: 'Cliente B' },
      status: 'APROVADO',
      status_pagamento: 'PENDENTE',
      preco_final_cobrado: 50,
      valor_sinal: 0,
      custo_total_sem_lucro: 20,
      createdAt: new Date('2026-11-03T10:00:00Z')
    },
    {
      _id: 'ped4',
      cliente_id: { _id: 'cli2', nome: 'Cliente B' },
      status: 'ORCAMENTO',
      status_pagamento: 'PENDENTE',
      preco_sugerido: 150,
      custo_total_sem_lucro: 60,
      createdAt: new Date('2026-11-04T10:00:00Z')
    },
    {
      _id: 'ped5',
      cliente_id: { _id: 'cli1', nome: 'Cliente A' },
      status: 'CANCELADO',
      status_pagamento: 'PENDENTE',
      preco_final_cobrado: 80,
      custo_total_sem_lucro: 30,
      createdAt: new Date('2026-11-05T10:00:00Z')
    }
  ];

  const fakeFilamentos = [
    {
      _id: 'fil1',
      nome: 'PLA Preto',
      tipo_polimero: 'PLA',
      cor: 'Preto',
      estoque_gramas: 800
    }
  ];

  t.mock.method(Pedido, 'find', () => ({
    populate() { return this; },
    lean() { return Promise.resolve(fakePedidos); }
  }));

  t.mock.method(Filamento, 'find', () => ({
    lean() { return Promise.resolve(fakeFilamentos); }
  }));

  let resultData = null;
  const req = { query: { periodo: '6m' } };
  const res = {
    json(data) { resultData = data; return this; },
    status() { return this; }
  };

  await getDashboardMetrics(req, res);

  assert.ok(resultData, 'Deve retornar dados do dashboard');

  // Vendas confirmadas: ped1 (100) + ped2 (200) + ped3 (50) = 350
  // Faturamento recebido:
  // ped1: PAGO -> 100
  // ped2: SINAL_50 -> sinal de 100
  // ped3: PENDENTE -> 0
  // Total recebido = 200
  assert.equal(resultData.metricas.faturamento_recebido, 200);

  // Faturamento pendente:
  // ped1: 0
  // ped2: 200 - 100 = 100
  // ped3: 50
  // Total pendente = 150
  assert.equal(resultData.metricas.faturamento_pendente, 150);
  assert.equal(resultData.metricas.faturamento_total_confirmado, 350);

  // Orçamentos pendentes
  // ped4: status ORCAMENTO -> 1 orçamento no valor de 150
  assert.equal(resultData.metricas.pedidos_orcamento, 1);
  assert.equal(resultData.metricas.valor_potencial_orcamento, 150);

  // Pedidos em andamento: ped2 (EM_IMPRESSAO) + ped3 (APROVADO) = 2
  assert.equal(resultData.metricas.pedidos_em_andamento, 2);

  // Pedidos concluídos: ped1 (CONCLUIDO) = 1
  assert.equal(resultData.metricas.pedidos_concluidos, 1);

  // Cancelados: ped5 = 1
  assert.equal(resultData.metricas.pedidos_cancelados, 1);

  // Lucro estimado (somente confirmados):
  // ped1: 100 - 40 = 60
  // ped2: 200 - 80 = 120
  // ped3: 50 - 20 = 30
  // Total lucro = 210
  assert.equal(resultData.metricas.lucro_estimado, 210);

  // Top clientes: Cliente A (300) > Cliente B (50)
  assert.equal(resultData.top_clientes[0].nome, 'Cliente A');
  assert.equal(resultData.top_clientes[0].total_gasto, 300);
});
