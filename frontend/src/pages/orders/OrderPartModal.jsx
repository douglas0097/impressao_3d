import { useEffect, useState } from 'react';
import Modal from '../../components/Modal';
import Input from '../../components/Input';
import Select from '../../components/Select';
import Button from '../../components/Button';
import api from '../../services/api';
import { formatMoney, referenceId } from './orderValues';

export default function OrderPartModal({ isOpen, onClose, onConfirm, initial = null, filamentos = [] }) {
  const isEditing = Boolean(initial);

  const [form, setForm] = useState(() => ({
    nome_peca: initial?.nome_peca ?? '',
    link_modelo: initial?.link_modelo ?? '',
    filamento_id: referenceId(initial?.filamento_id),
    quantidade: initial?.quantidade ?? 1,
    peso_total_g: initial?.peso_total_g ?? initial?.peso_estimado_g ?? '',
    horas: initial?.horas ?? (initial?.tempo_total_horas != null ? Math.floor(initial.tempo_total_horas) : 0),
    minutos: initial?.minutos ?? (initial?.tempo_total_horas != null ? Math.round((initial.tempo_total_horas % 1) * 60) : 0),
  }));

  const [simulation, setSimulation] = useState(initial ? {
    custo_filamento: initial.custo_filamento,
    custo_tempo_impressao: initial.custo_tempo_impressao,
    preco_custo: initial.preco_custo,
    custo_total_sem_lucro: initial.custo_total_sem_lucro,
    preco_sugerido: initial.preco_sugerido
  } : null);

  const [calcLoading, setCalcLoading] = useState(false);
  const [calcError, setCalcError] = useState('');
  const [validation, setValidation] = useState('');

  // Reseta estado quando o modal abre ou initial muda
  useEffect(() => {
    if (isOpen) {
      setForm({
        nome_peca: initial?.nome_peca ?? '',
        link_modelo: initial?.link_modelo ?? '',
        filamento_id: referenceId(initial?.filamento_id),
        quantidade: initial?.quantidade ?? 1,
        peso_total_g: initial?.peso_total_g ?? initial?.peso_estimado_g ?? '',
        horas: initial?.horas ?? (initial?.tempo_total_horas != null ? Math.floor(initial.tempo_total_horas) : 0),
        minutos: initial?.minutos ?? (initial?.tempo_total_horas != null ? Math.round((initial.tempo_total_horas % 1) * 60) : 0),
      });
      if (initial && initial.custo_filamento != null) {
        setSimulation({
          custo_filamento: initial.custo_filamento,
          custo_tempo_impressao: initial.custo_tempo_impressao,
          preco_custo: initial.preco_custo,
          custo_total_sem_lucro: initial.custo_total_sem_lucro,
          preco_sugerido: initial.preco_sugerido
        });
      } else {
        setSimulation(null);
      }
      setValidation('');
      setCalcError('');
    }
  }, [isOpen, initial]);

  const calculationKey = JSON.stringify([form.filamento_id, Number(form.peso_total_g), Number(form.horas), Number(form.minutos)]);

  useEffect(() => {
    if (!isOpen) return;
    const [filamento_id, peso_total_g, horas, minutos] = JSON.parse(calculationKey);
    if (!filamento_id || !(peso_total_g > 0) || horas < 0 || minutos < 0 || minutos > 59 || (horas + minutos / 60) <= 0) {
      return;
    }

    setCalcLoading(true);
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const { data } = await api.post(
          '/pedidos/calcular',
          { filamento_id, peso_estimado_g: peso_total_g, horas, minutos },
          { signal: controller.signal }
        );
        if (!controller.signal.aborted) {
          setSimulation(data);
          setCalcError('');
          setCalcLoading(false);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setSimulation(null);
          setCalcError(err.response?.data?.message || 'Não foi possível calcular o orçamento da peça.');
          setCalcLoading(false);
        }
      }
    }, 350);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [calculationKey, isOpen]);

  const change = (name, value) => {
    setForm(prev => ({ ...prev, [name]: value }));
    setValidation('');
    setCalcError('');
  };

  const handleConfirm = (e) => {
    e.preventDefault();
    if (!form.nome_peca.trim()) {
      return setValidation('Informe o nome da peça.');
    }
    if (!form.filamento_id) {
      return setValidation('Selecione o tipo de filamento.');
    }
    const qty = Number(form.quantidade);
    if (!Number.isInteger(qty) || qty < 1) {
      return setValidation('A quantidade deve ser um número inteiro de no mínimo 1.');
    }
    const peso = Number(form.peso_total_g);
    if (!Number.isFinite(peso) || peso <= 0) {
      return setValidation('Informe um peso total válido maior que zero.');
    }
    const horas = Number(form.horas || 0);
    const minutos = Number(form.minutos || 0);
    if (horas < 0 || minutos < 0 || minutos > 59 || (horas + minutos / 60) <= 0) {
      return setValidation('Informe um tempo de impressão válido maior que zero.');
    }

    if (!simulation) {
      return setValidation('Aguarde o cálculo da simulação financeira ou verifique os campos.');
    }

    onConfirm({
      _id: initial?._id,
      nome_peca: form.nome_peca.trim(),
      link_modelo: form.link_modelo.trim(),
      filamento_id: form.filamento_id,
      quantidade: qty,
      peso_total_g: peso,
      horas,
      minutos,
      tempo_total_horas: horas + (minutos / 60),
      custo_filamento: simulation.custo_filamento,
      custo_tempo_impressao: simulation.custo_tempo_impressao,
      preco_custo: simulation.preco_custo,
      custo_total_sem_lucro: simulation.custo_total_sem_lucro,
      preco_sugerido: simulation.preco_sugerido
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Peça 3D' : 'Adicionar Peça 3D'}
      maxWidth="620px"
      zIndexClass="z-[60]"
    >
      <form onSubmit={handleConfirm}>
        <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
          <div className="form-group sm:col-span-2">
            <label htmlFor="part-filamento" className="form-label">Tipo de filamento *</label>
            <Select
              id="part-filamento"
              required
              value={form.filamento_id}
              onChange={e => change('filamento_id', e.target.value)}
            >
              <option value="">Selecione um filamento...</option>
              {filamentos.map(item => (
                <option key={item._id} value={item._id}>
                  {item.nome} ({item.tipo_polimero || 'Filamento'}) — {item.estoque_gramas ?? item.peso_total_g ?? 0}g disponíveis
                </option>
              ))}
            </Select>
          </div>

          <div className="form-group sm:col-span-2">
            <label htmlFor="part-nome" className="form-label">Nome da peça *</label>
            <Input
              id="part-nome"
              required
              placeholder="Ex: Suporte de parede, Action figure, Engrenagem"
              value={form.nome_peca}
              onChange={e => change('nome_peca', e.target.value)}
            />
          </div>

          <div className="form-group sm:col-span-2">
            <label htmlFor="part-link" className="form-label">Link do modelo (opcional)</label>
            <Input
              id="part-link"
              type="url"
              placeholder="https://makerworld.com/..., https://thingiverse.com/..."
              value={form.link_modelo}
              onChange={e => change('link_modelo', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="part-quantidade" className="form-label">Quantidade de unidades *</label>
            <Input
              id="part-quantidade"
              type="number"
              min={1}
              step={1}
              required
              value={form.quantidade}
              onChange={e => change('quantidade', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="part-peso" className="form-label">Peso total da peça (g) *</label>
            <Input
              id="part-peso"
              type="number"
              min="0.01"
              step="any"
              required
              placeholder="Ex: 120"
              value={form.peso_total_g}
              onChange={e => change('peso_total_g', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="part-horas" className="form-label">Tempo total — Horas *</label>
            <Input
              id="part-horas"
              type="number"
              min={0}
              step={1}
              required
              value={form.horas}
              onChange={e => change('horas', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="part-minutos" className="form-label">Tempo total — Minutos *</label>
            <Input
              id="part-minutos"
              type="number"
              min={0}
              max={59}
              step={1}
              required
              value={form.minutos}
              onChange={e => change('minutos', e.target.value)}
            />
          </div>
        </div>

        <div className="mb-4 rounded-lg border border-border bg-background/50 p-3 text-xs text-text-secondary">
          💡 <strong>Importante:</strong> O peso e o tempo total informados devem corresponder ao <strong>conjunto das unidades</strong> dessa peça (não serão multiplicados novamente pela quantidade).
        </div>

        {/* Simulação financeira individual */}
        <div className="mb-5 rounded-lg border border-border bg-background p-4" aria-live="polite">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-text-primary">Simulação Financeira da Peça</h3>
            {calcLoading && <span className="text-xs text-brand animate-pulse">Calculando...</span>}
          </div>

          {simulation ? (
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div>
                <dt className="text-xs text-text-secondary">Custo filamento</dt>
                <dd className="font-semibold text-sm">{formatMoney(simulation.custo_filamento)}</dd>
              </div>
              <div>
                <dt className="text-xs text-text-secondary">Tempo de impressão</dt>
                <dd className="font-semibold text-sm">{formatMoney(simulation.custo_tempo_impressao)}</dd>
              </div>
              <div>
                <dt className="text-xs text-text-secondary">Preço de custo</dt>
                <dd className="font-semibold text-sm">{formatMoney(simulation.preco_custo)}</dd>
              </div>
              <div>
                <dt className="text-xs text-text-secondary">Custo sem lucro</dt>
                <dd className="font-semibold text-sm">{formatMoney(simulation.custo_total_sem_lucro)}</dd>
              </div>
              <div className="col-span-2 sm:col-span-2">
                <dt className="text-xs font-medium text-emerald-400">Preço sugerido individual</dt>
                <dd className="text-base font-bold text-emerald-400">{formatMoney(simulation.preco_sugerido)}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-xs text-text-muted">
              {calcError || 'Selecione o filamento e informe peso e tempo para simular os custos.'}
            </p>
          )}
        </div>

        {validation && <p role="alert" className="mb-4 text-xs font-medium text-danger">{validation}</p>}

        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={!simulation || calcLoading}>
            {isEditing ? 'Salvar Peça' : 'Adicionar ao Pedido'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
