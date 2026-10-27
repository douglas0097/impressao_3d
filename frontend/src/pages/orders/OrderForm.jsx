import { useEffect, useState } from 'react';
import Input from '../../components/Input';
import Select from '../../components/Select';
import Button from '../../components/Button';
import api from '../../services/api';
import { statusOptions, paymentOptions, referenceId, splitTime, formatMoney } from './orderValues';

export default function OrderForm({ initial = {}, clientes, filamentos, saving, onSubmit }) {
  const isEdit = Boolean(initial._id);
  const [form, setForm] = useState(() => ({
    cliente_id: referenceId(initial.cliente_id), filamento_id: referenceId(initial.filamento_id),
    nome_peca: initial.nome_peca ?? '', link_modelo: initial.link_modelo ?? '',
    quantidade_pecas: initial.quantidade_pecas ?? 1, peso_estimado_g: initial.peso_estimado_g ?? '',
    ...splitTime(initial.tempo_estimado_horas), preco_final_cobrado: initial.preco_final_cobrado ?? '',
    status: initial.status ?? 'ORCAMENTO', status_pagamento: initial.status_pagamento ?? 'PENDENTE', valor_sinal: initial.valor_sinal ?? 0,
  }));
  const [simulation, setSimulation] = useState(null);
  const [calcError, setCalcError] = useState('');
  const [validation, setValidation] = useState('');
  const calculationKey = JSON.stringify([form.filamento_id, Number(form.peso_estimado_g), Number(form.horas), Number(form.minutos)]);
  useEffect(() => {
    const [filamento_id, peso_estimado_g, horas, minutos] = JSON.parse(calculationKey);
    if (!filamento_id || !(peso_estimado_g > 0) || horas < 0 || minutos < 0 || minutos > 59 || horas + minutos / 60 <= 0) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const { data } = await api.post('/pedidos/calcular', { filamento_id, peso_estimado_g, horas, minutos }, { signal: controller.signal });
        if (!controller.signal.aborted) { setSimulation({ key: calculationKey, data }); setCalcError(''); }
      } catch (err) {
        if (!controller.signal.aborted) { setSimulation(null); setCalcError(err.response?.data?.message || 'Não foi possível calcular o orçamento.'); }
      }
    }, 400);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [calculationKey]);
  const result = simulation?.key === calculationKey ? simulation.data : null;
  const productionChanged = !isEdit || referenceId(initial.filamento_id) !== form.filamento_id || Number(initial.peso_estimado_g) !== Number(form.peso_estimado_g) || Math.abs(Number(initial.tempo_estimado_horas) - (Number(form.horas) + Number(form.minutos) / 60)) > 0.000001;
  const change = (name, value) => { setForm(previous => ({ ...previous, [name]: value })); setValidation(''); setCalcError(''); };
  const field = (name, label, props = {}) => <div className="form-group" key={name}>
    <label htmlFor={`order-${name}`} className="form-label">{label}</label>
    <Input id={`order-${name}`} {...props} value={form[name]} onChange={e => change(name, e.target.value)} />
  </div>;
  const select = (name, label, options, required = false) => <div className="form-group">
    <label htmlFor={`order-${name}`} className="form-label">{label}</label>
    <Select id={`order-${name}`} required={required} value={form[name]} onChange={e => change(name, e.target.value)}>{options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</Select>
  </div>;
  function submit(event) {
    event.preventDefault();
    if (!form.nome_peca.trim()) return setValidation('Informe o nome da peça.');
    if (Number(form.horas) + Number(form.minutos) / 60 <= 0) return setValidation('Informe um tempo de impressão maior que zero.');
    const material = filamentos.find(item => item._id === form.filamento_id);
    const stock = material?.estoque_gramas ?? material?.peso_total_g ?? 0;
    const reserved = isEdit && referenceId(initial.filamento_id) === form.filamento_id ? Number(initial.peso_estimado_g) : 0;
    if (productionChanged && Number(form.peso_estimado_g) > stock + reserved) return setValidation(`Estoque insuficiente. Disponível para este pedido: ${stock + reserved} g.`);
    const payload = { ...form, nome_peca: form.nome_peca.trim(), link_modelo: form.link_modelo.trim() };
    for (const key of ['quantidade_pecas', 'peso_estimado_g', 'horas', 'minutos', 'valor_sinal']) payload[key] = Number(form[key]);
    if (form.preco_final_cobrado === '') delete payload.preco_final_cobrado;
    else payload.preco_final_cobrado = Number(form.preco_final_cobrado);
    onSubmit(payload);
  }
  return <form onSubmit={submit}>
    <fieldset disabled={saving} className="min-w-0 border-0 p-0">
      <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
        {select('cliente_id', 'Cliente *', [{ value: '', label: 'Selecione um cliente...' }, ...clientes.map(item => ({ value: item._id, label: item.nome }))], true)}
        {select('filamento_id', 'Filamento *', [{ value: '', label: 'Selecione um filamento...' }, ...filamentos.map(item => ({ value: item._id, label: `${item.nome} (${item.estoque_gramas ?? item.peso_total_g ?? 0} g em estoque)` }))], true)}
        {field('nome_peca', 'Nome da peça *', { required: true })}
        {field('link_modelo', 'Link do modelo', { type: 'url', placeholder: 'https://...' })}
        {field('quantidade_pecas', 'Quantidade de peças *', { type: 'number', min: 1, step: 1, required: true })}
        {field('peso_estimado_g', 'Peso total do pedido (g) *', { type: 'number', min: '0.01', step: 'any', required: true })}
        {field('horas', 'Tempo total — horas *', { type: 'number', min: 0, step: 1, required: true })}
        {field('minutos', 'Tempo total — minutos *', { type: 'number', min: 0, max: 59, step: 1, required: true })}
        {select('status', 'Status', statusOptions)}
        {select('status_pagamento', 'Pagamento', paymentOptions)}
        {field('preco_final_cobrado', 'Preço final cobrado (R$)', { type: 'number', min: 0, step: 'any', placeholder: 'Usar preço sugerido' })}
        {field('valor_sinal', 'Valor do sinal (R$)', { type: 'number', min: 0, step: 'any', required: true })}
      </div>
      <div className="mb-4 rounded-md border border-border bg-background p-4" aria-live="polite">
        <h3 className="mb-2 font-semibold">Simulação financeira</h3>
        {result ? <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          { [['Filamento', result.custo_filamento], ['Tempo de impressão', result.custo_tempo_impressao], ['Preço de custo', result.preco_custo], ['Custo sem lucro', result.custo_total_sem_lucro], ['Preço sugerido', result.preco_sugerido]].map(([label, value]) => <div key={label}><dt className="text-sm text-text-secondary">{label}</dt><dd className="font-semibold">{formatMoney(value)}</dd></div>) }
        </dl> : <p>{calcError || 'Preencha filamento, peso e tempo para calcular.'}</p>}
        {isEdit && <p className="mt-3 text-sm text-text-secondary">Alterar filamento, peso ou tempo recalcula os custos. O preço final informado é preservado.</p>}
      </div>
      {validation && <p role="alert" className="mb-4 text-danger">{validation}</p>}
      <Button type="submit" fullWidth loading={saving} disabled={productionChanged && !result}>{isEdit ? 'Salvar alterações' : 'Salvar orçamento / pedido'}</Button>
    </fieldset>
  </form>;
}
