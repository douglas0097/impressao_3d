import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcularOrcamento } from './calcularOrcamento.js';

const filamento = Object.freeze({ preco_pago: 100, peso_total_g: 1000 });
const parametros = { peso: 100, horas: 2, tarifa: 1, potencia: 200, maquina: 3, maoObra: 5, margem: 30, desconto: 2, manutencao: 10, retrabalho: 5 };

test('compõe custos do lote e aplica lucro antes do desconto', () => {
  const resultado = calcularOrcamento(filamento, parametros);
  assert.ok(Math.abs(resultado.total - 23.86) < 1e-10);
  assert.ok(Math.abs(resultado.final - 29.018) < 1e-10);
  assert.deepEqual(filamento, { preco_pago: 100, peso_total_g: 1000 });
});

test('permite desconsiderar todos os custos opcionais', () => {
  const resultado = calcularOrcamento(filamento, { ...parametros, tarifa: 0, maquina: 0, maoObra: 0, manutencao: 0, retrabalho: 0, margem: 0, desconto: 0 });
  assert.equal(resultado.final, 10);
});

test('rejeita entradas inválidas e desconto acima do preço', () => {
  for (const alteracao of [{ peso: -1 }, { horas: 0 }, { tarifa: NaN }, { maquina: Infinity }, { desconto: 999 }]) {
    assert.throws(() => calcularOrcamento(filamento, { ...parametros, ...alteracao }));
  }
  assert.throws(() => calcularOrcamento({ ...filamento, ativo: false }, parametros));
  assert.throws(() => calcularOrcamento({ ...filamento, status: 'inativo' }, parametros));
  assert.throws(() => calcularOrcamento({ ...filamento, peso_total_g: 0 }, parametros));
});
