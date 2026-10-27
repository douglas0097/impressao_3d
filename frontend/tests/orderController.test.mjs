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
