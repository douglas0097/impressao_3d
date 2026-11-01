import test from 'node:test';
import assert from 'node:assert/strict';
import Pedido from '../../backend/models/Pedido.js';
import Filamento from '../../backend/models/Filamento.js';
import Configuracao from '../../backend/models/Configuracao.js';
import { createPedido, updatePedido, deletePedido } from '../../backend/controllers/pedidoController.js';
import { splitTime, referenceId } from '../src/pages/orders/orderValues.js';

const orderId = '6ad9763db5eed7cea6561287';
const materialId = '6ab2141b37b6555122ad647a';
const otherId = '6ab22328f1f2ccad55368bc9';
const customerId = '6ab21a9e47f946184605b6e2';
function fixture(t) {
  let stored = { _id: orderId, cliente_id: customerId, filamento_id: materialId, nome_peca: 'Peça', peso_estimado_g: 20, tempo_estimado_horas: 1.75, preco_final_cobrado: 11.9, status: 'ORCAMENTO' };
  const stocks = { [materialId]: 460, [otherId]: 1000 };
  t.mock.method(Pedido, 'findById', async () => stored ? new Pedido(stored) : null);
  t.mock.method(Pedido, 'findByIdAndUpdate', (id, update) => {
    stored = { ...stored, ...update.$set };
    return { populate() { return this; }, then(resolve) { return Promise.resolve(new Pedido(stored)).then(resolve); } };
  });
  t.mock.method(Pedido, 'findByIdAndDelete', async () => { const old = stored; stored = null; return old; });
  t.mock.method(Pedido.prototype, 'save', async function () { stored = this.toObject(); return this; });
  t.mock.method(Filamento, 'findById', async id => stocks[id] !== undefined ? { _id: id, custo_por_grama: 0.125 } : null);
  t.mock.method(Filamento, 'findOneAndUpdate', async (filter, update, options) => {
    assert.equal(options.updatePipeline, true);
    const id = String(filter._id);
    const grams = filter.$expr.$gte[1];
    assert.equal(update[0].$set.estoque_gramas.$subtract[1], grams);
    if (stocks[id] === undefined || stocks[id] < grams) return null;
    stocks[id] -= grams;
    return { _id: id };
  });
  t.mock.method(Filamento, 'updateOne', async (filter, update, options) => {
    assert.equal(options.updatePipeline, true);
    const id = String(filter._id);
    if (stocks[id] !== undefined) stocks[id] += update[0].$set.estoque_gramas.$add[1];
  });
  t.mock.method(Configuracao, 'findOne', async () => ({ taxa_retrabalho: 1.3, margem_lucro_padrao: 1.4, taxa_manutencao: 2, custo_energia: 1 }));
  async function call(handler, body = {}) {
    const response = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(data) { this.data = data; return this; } };
    await handler({ params: { id: orderId }, body }, response);
    return response;
  }
  return { stocks, call, get stored() { return stored; } };
}

test('concluir e alterar pagamento não descontam estoque novamente', async t => {
  const f = fixture(t);
  const response = await f.call(updatePedido, { status: 'CONCLUIDO', status_pagamento: 'PAGO' });
  assert.equal(response.statusCode, 200);
  assert.equal(f.stocks[materialId], 460);
});
test('edição de peso/tempo recalcula custos, reserva somente diferença e preserva preço final', async t => {
  const f = fixture(t);
  const response = await f.call(updatePedido, { peso_estimado_g: 40, horas: 2, minutos: 30 });
  assert.equal(response.statusCode, 200);
  assert.equal(f.stocks[materialId], 440);
  assert.equal(response.data.tempo_estimado_horas, 2.5);
  assert.equal(response.data.custo_filamento, 6.5);
  assert.equal(response.data.custo_tempo_impressao, 7.5);
  assert.equal(response.data.preco_final_cobrado, 11.9);
});
test('redução de peso devolve somente diferença', async t => {
  const f = fixture(t);
  assert.equal((await f.call(updatePedido, { peso_estimado_g: 10 })).statusCode, 200);
  assert.equal(f.stocks[materialId], 470);
});
test('troca de material devolve reserva anterior e desconta novo material', async t => {
  const f = fixture(t);
  assert.equal((await f.call(updatePedido, { filamento_id: otherId, peso_estimado_g: 30 })).statusCode, 200);
  assert.equal(f.stocks[materialId], 480);
  assert.equal(f.stocks[otherId], 970);
});
test('estoque insuficiente e status inválido não alteram pedido nem saldo', async t => {
  const f = fixture(t);
  assert.equal((await f.call(updatePedido, { peso_estimado_g: 600 })).statusCode, 400);
  assert.equal((await f.call(updatePedido, { status: 'INVALIDO' })).statusCode, 400);
  assert.equal(f.stocks[materialId], 460);
  assert.equal(f.stored.peso_estimado_g, 20);
});
test('exclusão devolve reserva somente uma vez e retorna 404 na repetição', async t => {
  const f = fixture(t);
  assert.equal((await f.call(deletePedido)).statusCode, 200);
  assert.equal(f.stocks[materialId], 480);
  assert.equal((await f.call(deletePedido)).statusCode, 404);
  assert.equal(f.stocks[materialId], 480);
});
test('criação preserva status, pagamento e preço zero e desconta uma vez', async t => {
  const f = fixture(t);
  const response = await f.call(createPedido, { cliente_id: customerId, filamento_id: materialId, nome_peca: 'Novo', quantidade_pecas: 1, peso_estimado_g: 30, horas: 1, minutos: 45, status: 'APROVADO', status_pagamento: 'PAGO', preco_final_cobrado: 0 });
  assert.equal(response.statusCode, 201);
  assert.equal(response.data.status, 'APROVADO');
  assert.equal(response.data.status_pagamento, 'PAGO');
  assert.equal(response.data.preco_final_cobrado, 0);
  assert.equal(f.stocks[materialId], 430);
});
test('falha ao salvar criação desfaz reserva', async t => {
  const f = fixture(t);
  Pedido.prototype.save.mock.mockImplementation(async () => { throw new Error('Falha simulada'); });
  const response = await f.call(createPedido, { cliente_id: customerId, filamento_id: materialId, nome_peca: 'Novo', peso_estimado_g: 30, horas: 1, minutos: 0 });
  assert.equal(response.statusCode, 400);
  assert.equal(f.stocks[materialId], 460);
});
test('tempo decimal e referências nulas do anexo são tratados', () => {
  assert.deepEqual(splitTime(1.75), { horas: 1, minutos: 45 });
  assert.deepEqual(splitTime(1.999999999), { horas: 2, minutos: 0 });
  assert.equal(referenceId(null), '');
  assert.equal(referenceId({ _id: customerId }), customerId);
});

test('criação de pedido com múltiplas peças em diferentes filamentos e produtos extras', async t => {
  const f = fixture(t);
  const response = await f.call(createPedido, {
    cliente_id: customerId,
    status: 'ORCAMENTO',
    status_pagamento: 'PENDENTE',
    valor_sinal: 0,
    pecas: [
      {
        nome_peca: 'Peça 1 (Material 1)',
        filamento_id: materialId,
        quantidade: 2,
        peso_total_g: 40, // 40g total
        horas: 2,
        minutos: 0
      },
      {
        nome_peca: 'Peça 2 (Material 2)',
        filamento_id: otherId,
        quantidade: 1,
        peso_total_g: 50, // 50g total
        horas: 1,
        minutos: 30
      }
    ],
    extras: [
      {
        nome: 'Parafuso M3',
        preco_unitario: 1.5,
        quantidade: 4
      },
      {
        nome: 'LED 5mm',
        preco_unitario: 2.0,
        quantidade: 2
      }
    ]
  });

  assert.equal(response.statusCode, 201);
  assert.equal(response.data.pecas.length, 2);
  assert.equal(response.data.extras.length, 2);

  // Verificacao de estoque: materialId: 460 - 40 = 420; otherId: 1000 - 50 = 950
  assert.equal(f.stocks[materialId], 420);
  assert.equal(f.stocks[otherId], 950);

  // Calculos da Peça 1:
  // custo_filamento = 0.125 * 40 * 1.3 = 6.5
  // custo_tempo_impressao = (2 + 1) * 2 = 6
  // preco_custo = 0.125 * 40 + 1 * 2 = 7
  // custo_total_sem_lucro = 6.5 + 6 = 12.5
  // preco_sugerido = 12.5 * 1.4 = 17.5
  const p1 = response.data.pecas[0];
  assert.equal(p1.custo_filamento, 6.5);
  assert.equal(p1.custo_tempo_impressao, 6);
  assert.equal(p1.custo_total_sem_lucro, 12.5);
  assert.equal(p1.preco_sugerido, 17.5);

  // Extras:
  // Parafuso: 1.5 * 4 = 6
  // LED: 2.0 * 2 = 4
  // Total extras = 10
  assert.equal(response.data.custo_total_extras, 10);

  // Peça 2:
  // custo_filamento = 0.125 * 50 * 1.3 = 8.125 -> 8.13 (ou arredondamento)
  // custo_tempo_impressao = 3 * 1.5 = 4.5
  // custo_total_sem_lucro = 8.125 + 4.5 = 12.625 -> 12.63
  // preco_sugerido = 12.625 * 1.4 = 17.675 -> 17.68
  const p2 = response.data.pecas[1];
  assert.equal(p2.custo_tempo_impressao, 4.5);

  // Preço sugerido final = preco_sugerido_pecas + custo_total_extras
  assert.equal(response.data.preco_sugerido, Number((response.data.preco_sugerido_pecas + response.data.custo_total_extras).toFixed(2)));
  // Preço final cobrado padrão é o preço sugerido final quando não informado
  assert.equal(response.data.preco_final_cobrado, response.data.preco_sugerido);
});

test('falha em um dos filamentos reverte todas as reservas na criação com múltiplas peças', async t => {
  const f = fixture(t);
  const response = await f.call(createPedido, {
    cliente_id: customerId,
    pecas: [
      {
        nome_peca: 'Peça ok',
        filamento_id: materialId,
        quantidade: 1,
        peso_total_g: 50,
        horas: 1,
        minutos: 0
      },
      {
        nome_peca: 'Peça que estoura estoque',
        filamento_id: otherId,
        quantidade: 1,
        peso_total_g: 1500, // otherId só tem 1000
        horas: 1,
        minutos: 0
      }
    ]
  });

  assert.equal(response.statusCode, 400);
  // materialId não pode ter sido descontado (rollback)
  assert.equal(f.stocks[materialId], 460);
  assert.equal(f.stocks[otherId], 1000);
});

test('criação de pedido somente com extras calcula valores e não desconta estoque de filamento', async t => {
  const f = fixture(t);
  const response = await f.call(createPedido, {
    cliente_id: customerId,
    extras: [
      {
        nome: 'Fonte 12V',
        preco_unitario: 35.5,
        quantidade: 2
      }
    ]
  });

  assert.equal(response.statusCode, 201);
  assert.equal(response.data.pecas.length, 0);
  assert.equal(response.data.extras.length, 1);
  assert.equal(response.data.custo_total_extras, 71);
  assert.equal(response.data.preco_sugerido, 71);
  assert.equal(f.stocks[materialId], 460);
  assert.equal(f.stocks[otherId], 1000);
});

test('atualização de pedido com adição de peças e extras recalcula valores e atualiza estoque', async t => {
  const f = fixture(t);
  // stored inicial tem 20g de materialId
  const response = await f.call(updatePedido, {
    pecas: [
      {
        nome_peca: 'Peça Atualizada 1',
        filamento_id: materialId,
        quantidade: 1,
        peso_total_g: 50, // subiu de 20 para 50 (+30g de materialId)
        horas: 2,
        minutos: 0
      },
      {
        nome_peca: 'Peça Atualizada 2',
        filamento_id: otherId,
        quantidade: 1,
        peso_total_g: 30, // novo filamento (+30g de otherId)
        horas: 1,
        minutos: 0
      }
    ],
    extras: [
      {
        nome: 'Rolamento',
        preco_unitario: 10,
        quantidade: 2
      }
    ]
  });

  assert.equal(response.statusCode, 200);
  assert.equal(f.stocks[materialId], 430); // 460 - 30 = 430
  assert.equal(f.stocks[otherId], 970); // 1000 - 30 = 970
  assert.equal(response.data.pecas.length, 2);
  assert.equal(response.data.extras.length, 1);
  assert.equal(response.data.custo_total_extras, 20);
  assert.equal(response.data.preco_sugerido, Number((response.data.preco_sugerido_pecas + 20).toFixed(2)));
});

test('remoção de peças em atualização devolve estoque e recalcula valores', async t => {
  const f = fixture(t);
  // stored inicial tem 20g de materialId. Vamos atualizar deixando apenas extras:
  const response = await f.call(updatePedido, {
    pecas: [],
    extras: [
      {
        nome: 'Fonte',
        preco_unitario: 50,
        quantidade: 1
      }
    ]
  });

  assert.equal(response.statusCode, 200);
  // materialId foi liberado totalmente (460 + 20 = 480)
  assert.equal(f.stocks[materialId], 480);
  assert.equal(response.data.pecas.length, 0);
  assert.equal(response.data.extras.length, 1);
  assert.equal(response.data.preco_sugerido, 50);
});

test('criação registra snapshot das configurações e todas as métricas da peça (preço de custo e custo sem lucro)', async t => {
  const f = fixture(t);
  const response = await f.call(createPedido, {
    cliente_id: customerId,
    pecas: [
      {
        nome_peca: 'Peça com Snapshot',
        filamento_id: materialId,
        quantidade: 1,
        peso_total_g: 20,
        horas: 1,
        minutos: 0
      }
    ]
  });

  assert.equal(response.statusCode, 201);
  // Snapshot das configurações gravado no pedido
  assert.equal(response.data.configuracao_snapshot.custo_energia, 1);
  assert.equal(response.data.configuracao_snapshot.taxa_manutencao, 2);
  assert.equal(response.data.configuracao_snapshot.taxa_retrabalho_pct, 30);
  assert.equal(response.data.configuracao_snapshot.margem_lucro_padrao_pct, 40);

  // Métricas financeiras da peça (preço de custo e custo sem lucro)
  const peca = response.data.pecas[0];
  // custo_filamento = 0.125 * 20 * 1.3 = 3.25
  // custo_tempo_impressao = (2 + 1) * 1 = 3
  // preco_custo = 0.125 * 20 + 1 * 1 = 3.5
  // custo_total_sem_lucro = 3.25 + 3 = 6.25
  // preco_sugerido = 6.25 * 1.4 = 8.75
  assert.equal(peca.custo_filamento, 3.25);
  assert.equal(peca.custo_tempo_impressao, 3);
  assert.equal(peca.preco_custo, 3.5);
  assert.equal(peca.custo_total_sem_lucro, 6.25);
  assert.equal(peca.preco_sugerido, 8.75);
});

test('pedidos legados sem configuracao_snapshot permanecem sem dados históricos', async t => {
  const f = fixture(t);
  // fixture inicial possui stored sem configuracao_snapshot
  assert.ok(!f.stored.configuracao_snapshot);
  const pedidoModel = new Pedido(f.stored);
  assert.ok(!pedidoModel.configuracao_snapshot);
});
