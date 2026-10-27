import { useState } from 'react';
import Input from '../../components/Input';
import Select from '../../components/Select';
import Button from '../../components/Button';

import { pricePerKg } from './filamentValues';

export default function FilamentForm({ initial = {}, onSubmit, saving = false }) {
  const [form, setForm] = useState(() => ({
    nome: initial.nome ?? '', marca: initial.marca ?? '', cor: initial.cor ?? '',
    tipo_polimero: initial.tipo_polimero ?? 'PLA', peso_total_g: initial.peso_total_g ?? 1000,
    estoque_gramas: initial.estoque_gramas ?? initial.peso_total_g ?? 1000,
    preco_kg: pricePerKg(initial) ?? '', temperatura_bico: initial.temperatura_bico ?? '',
    temperatura_mesa: initial.temperatura_mesa ?? '',
  }));
  const field = (name, label, options = {}) => <div className="form-group" key={name}>
    <label htmlFor={`filament-${name}`} className="form-label">{label}</label>
    <Input id={`filament-${name}`} {...options} value={form[name]} onChange={e => setForm({ ...form, [name]: e.target.value })} />
  </div>;
  function submit(e) {
    e.preventDefault();
    const payload = { ...form, nome: form.nome.trim(), marca: form.marca.trim(), cor: form.cor.trim() };
    if (!payload.nome) return;
    for (const name of ['peso_total_g', 'estoque_gramas', 'preco_kg', 'temperatura_bico', 'temperatura_mesa']) {
      payload[name] = form[name] === '' ? null : Number(form[name]);
    }
    payload.preco_pago = Math.round(payload.preco_kg * payload.peso_total_g / 1000 * 100) / 100;
    onSubmit(payload);
  }
  return <form onSubmit={submit}>
    <fieldset disabled={saving} className="min-w-0 border-0 p-0">
      {field('nome', 'Nome *', { required: true, pattern: '.*\\S.*', maxLength: 150 })}
      <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
        <div className="form-group">
          <label htmlFor="filament-material" className="form-label">Material *</label>
          <Select id="filament-material" value={form.tipo_polimero} onChange={e => setForm({ ...form, tipo_polimero: e.target.value })}>
            {[...new Set(['PLA', 'PETG', 'ABS', 'TPU', form.tipo_polimero])].map(value => <option key={value}>{value}</option>)}
          </Select>
        </div>
        {field('marca', 'Marca')}
        {field('cor', 'Cor')}
        {field('peso_total_g', 'Peso original (g) *', { type: 'number', min: '0.01', step: 'any', required: true })}
        {field('estoque_gramas', 'Estoque atual (g) *', { type: 'number', min: 0, max: form.peso_total_g, step: 'any', required: true })}
        {field('preco_kg', 'Preço por kg (R$) *', { type: 'number', min: 0, step: 'any', required: true })}
        {field('temperatura_bico', 'Temperatura do bico (°C)', { type: 'number', min: 0, step: 'any' })}
        {field('temperatura_mesa', 'Temperatura da mesa (°C)', { type: 'number', min: 0, step: 'any' })}
      </div>
      <Button type="submit" loading={saving} fullWidth className="mt-4">{saving ? 'Salvando...' : 'Salvar bobina'}</Button>
    </fieldset>
  </form>;
}
