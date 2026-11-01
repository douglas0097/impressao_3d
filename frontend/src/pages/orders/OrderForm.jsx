import { useMemo, useState } from 'react';
import Input from '../../components/Input';
import Select from '../../components/Select';
import Button from '../../components/Button';
import { FiPlus, FiEdit2, FiTrash2, FiExternalLink, FiLayers, FiPackage } from 'react-icons/fi';
import OrderPartModal from './OrderPartModal';
import OrderExtraModal from './OrderExtraModal';
import { statusOptions, paymentOptions, referenceId, formatMoney } from './orderValues';

export default function OrderForm({ initial = {}, clientes = [], filamentos = [], saving = false, onSubmit, onCancel }) {
  const isEdit = Boolean(initial._id);

  // Informações gerais do pedido
  const [general, setGeneral] = useState(() => ({
    cliente_id: referenceId(initial.cliente_id),
    status: initial.status ?? 'ORCAMENTO',
    status_pagamento: initial.status_pagamento ?? 'PENDENTE',
    valor_sinal: initial.valor_sinal ?? 0,
    preco_final_cobrado: initial.preco_final_cobrado ?? '',
  }));

  // Lista de peças (3D)
  const [pecas, setPecas] = useState(() => {
    if (Array.isArray(initial.pecas) && initial.pecas.length > 0) {
      return initial.pecas.map(p => ({
        ...p,
        filamento_id: referenceId(p.filamento_id),
        horas: p.tempo_horas ?? (p.tempo_total_horas != null ? Math.floor(p.tempo_total_horas) : 0),
        minutos: p.minutos ?? (p.tempo_total_horas != null ? Math.round((p.tempo_total_horas % 1) * 60) : 0),
        peso_total_g: p.peso_total_g ?? p.peso_estimado_g ?? 0,
        tempo_total_horas: p.tempo_total_horas ?? p.tempo_estimado_horas ?? 0,
      }));
    }
    // Suporte a pedidos legados de peça única
    if (initial.nome_peca && initial.filamento_id) {
      const time = Number(initial.tempo_estimado_horas || 0);
      return [{
        _id: 'legacy-1',
        nome_peca: initial.nome_peca,
        link_modelo: initial.link_modelo || '',
        filamento_id: referenceId(initial.filamento_id),
        quantidade: initial.quantidade_pecas || 1,
        peso_total_g: Number(initial.peso_estimado_g || 0),
        horas: Math.floor(time),
        minutos: Math.round((time % 1) * 60),
        tempo_total_horas: time,
        custo_filamento: initial.custo_filamento || 0,
        custo_tempo_impressao: initial.custo_tempo_impressao || 0,
        preco_custo: initial.preco_custo || 0,
        custo_total_sem_lucro: initial.custo_total_sem_lucro || 0,
        preco_sugerido: initial.preco_sugerido || 0,
      }];
    }
    return [];
  });

  // Lista de produtos extras
  const [extras, setExtras] = useState(() => {
    return Array.isArray(initial.extras) ? initial.extras : [];
  });

  // Controle dos modais de Peça e Extra
  const [partModalOpen, setPartModalOpen] = useState(false);
  const [editingPartIndex, setEditingPartIndex] = useState(null);

  const [extraModalOpen, setExtraModalOpen] = useState(false);
  const [editingExtraIndex, setEditingExtraIndex] = useState(null);

  const [validation, setValidation] = useState('');

  // Consolidação financeira do pedido em tempo real
  const financial = useMemo(() => {
    const custo_filamento = pecas.reduce((acc, p) => acc + (Number(p.custo_filamento) || 0), 0);
    const custo_tempo_impressao = pecas.reduce((acc, p) => acc + (Number(p.custo_tempo_impressao) || 0), 0);
    const preco_custo_pecas = pecas.reduce((acc, p) => acc + (Number(p.preco_custo) || 0), 0);
    const custo_total_sem_lucro_pecas = pecas.reduce((acc, p) => acc + (Number(p.custo_total_sem_lucro) || 0), 0);
    const preco_sugerido_pecas = pecas.reduce((acc, p) => acc + (Number(p.preco_sugerido) || 0), 0);

    const custo_total_extras = extras.reduce((acc, e) => acc + (Number(e.custo_total) || 0), 0);

    // Preço sugerido final = Peças + Extras
    const preco_sugerido_final = preco_sugerido_pecas + custo_total_extras;

    return {
      custo_filamento: Number(custo_filamento.toFixed(2)),
      custo_tempo_impressao: Number(custo_tempo_impressao.toFixed(2)),
      preco_custo_pecas: Number(preco_custo_pecas.toFixed(2)),
      custo_total_sem_lucro_pecas: Number(custo_total_sem_lucro_pecas.toFixed(2)),
      preco_sugerido_pecas: Number(preco_sugerido_pecas.toFixed(2)),
      custo_total_extras: Number(custo_total_extras.toFixed(2)),
      preco_sugerido_final: Number(preco_sugerido_final.toFixed(2)),
    };
  }, [pecas, extras]);

  const changeGeneral = (field, value) => {
    setGeneral(prev => ({ ...prev, [field]: value }));
    setValidation('');
  };

  // Handlers para Peças
  const handleOpenAddPart = () => {
    setEditingPartIndex(null);
    setPartModalOpen(true);
  };

  const handleOpenEditPart = (index) => {
    setEditingPartIndex(index);
    setPartModalOpen(true);
  };

  const handleSavePart = (partData) => {
    if (editingPartIndex !== null) {
      setPecas(prev => {
        const next = [...prev];
        next[editingPartIndex] = partData;
        return next;
      });
    } else {
      setPecas(prev => [...prev, partData]);
    }
    setPartModalOpen(false);
    setEditingPartIndex(null);
    setValidation('');
  };

  const handleRemovePart = (index) => {
    setPecas(prev => prev.filter((_, i) => i !== index));
  };

  // Handlers para Extras
  const handleOpenAddExtra = () => {
    setEditingExtraIndex(null);
    setExtraModalOpen(true);
  };

  const handleOpenEditExtra = (index) => {
    setEditingExtraIndex(index);
    setExtraModalOpen(true);
  };

  const handleSaveExtra = (extraData) => {
    if (editingExtraIndex !== null) {
      setExtras(prev => {
        const next = [...prev];
        next[editingExtraIndex] = extraData;
        return next;
      });
    } else {
      setExtras(prev => [...prev, extraData]);
    }
    setExtraModalOpen(false);
    setEditingExtraIndex(null);
    setValidation('');
  };

  const handleRemoveExtra = (index) => {
    setExtras(prev => prev.filter((_, i) => i !== index));
  };

  // Mapeamento de nome de filamento
  const getFilamentName = (id) => {
    const f = filamentos.find(item => item._id === id);
    return f ? `${f.nome} (${f.tipo_polimero || 'Filamento'})` : 'Filamento não informado';
  };

  // Submissão do formulário
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!general.cliente_id) {
      return setValidation('Selecione um cliente para o pedido.');
    }

    if (pecas.length === 0 && extras.length === 0) {
      return setValidation('Adicione pelo menos uma peça de impressão 3D ou um produto extra.');
    }

    const valorSinal = Number(general.valor_sinal || 0);
    if (!Number.isFinite(valorSinal) || valorSinal < 0) {
      return setValidation('O valor do sinal deve ser maior ou igual a zero.');
    }

    // Validação de estoque para filamentos
    const stockMap = new Map();
    for (const p of pecas) {
      const fId = p.filamento_id;
      stockMap.set(fId, (stockMap.get(fId) || 0) + Number(p.peso_total_g));
    }

    for (const [fId, neededGrams] of stockMap.entries()) {
      const material = filamentos.find(item => item._id === fId);
      const stock = material?.estoque_gramas ?? material?.peso_total_g ?? 0;
      
      // Se estiver editando, considera o estoque já reservado pelo pedido antigo para esse filamento
      let previouslyReserved = 0;
      if (isEdit) {
        if (Array.isArray(initial.pecas) && initial.pecas.length > 0) {
          previouslyReserved = initial.pecas
            .filter(ip => referenceId(ip.filamento_id) === fId)
            .reduce((sum, ip) => sum + Number(ip.peso_total_g ?? ip.peso_estimado_g ?? 0), 0);
        } else if (referenceId(initial.filamento_id) === fId) {
          previouslyReserved = Number(initial.peso_estimado_g || 0);
        }
      }

      if (neededGrams > (stock + previouslyReserved)) {
        return setValidation(
          `Estoque insuficiente para o filamento "${material?.nome || 'Selecionado'}". Necessário: ${neededGrams}g, Disponível para este pedido: ${stock + previouslyReserved}g.`
        );
      }
    }

    const payload = {
      cliente_id: general.cliente_id,
      status: general.status,
      status_pagamento: general.status_pagamento,
      valor_sinal: valorSinal,
      pecas: pecas.map(p => ({
        _id: p._id?.startsWith('legacy-') ? undefined : p._id,
        nome_peca: p.nome_peca,
        link_modelo: p.link_modelo || '',
        filamento_id: p.filamento_id,
        quantidade: p.quantidade,
        peso_total_g: p.peso_total_g,
        horas: p.horas,
        minutos: p.minutos,
        tempo_total_horas: p.tempo_total_horas
      })),
      extras: extras.map(e => ({
        _id: e._id,
        nome: e.nome,
        preco_unitario: e.preco_unitario,
        quantidade: e.quantidade,
        custo_total: e.custo_total
      }))
    };

    // Apenas envia preco_final_cobrado se for edição e preenchido
    if (isEdit && general.preco_final_cobrado !== '') {
      payload.preco_final_cobrado = Number(general.preco_final_cobrado);
    }

    onSubmit(payload);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        <fieldset disabled={saving} className="min-w-0 border-0 p-0 space-y-6">

          {/* 1. Informações gerais */}
          <div className="rounded-xl border border-border bg-surface p-4 sm:p-5">
            <h3 className="mb-4 text-sm font-semibold tracking-wide text-text-secondary uppercase">
              1. Dados Gerais do Pedido
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="form-group sm:col-span-2">
                <label htmlFor="order-cliente" className="form-label">Cliente *</label>
                <Select
                  id="order-cliente"
                  required
                  value={general.cliente_id}
                  onChange={e => changeGeneral('cliente_id', e.target.value)}
                >
                  <option value="">Selecione um cliente...</option>
                  {clientes.map(item => (
                    <option key={item._id} value={item._id}>{item.nome}</option>
                  ))}
                </Select>
              </div>

              <div className="form-group">
                <label htmlFor="order-status" className="form-label">Status do pedido</label>
                <Select
                  id="order-status"
                  value={general.status}
                  onChange={e => changeGeneral('status', e.target.value)}
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </Select>
              </div>

              <div className="form-group">
                <label htmlFor="order-pagamento" className="form-label">Status do pagamento</label>
                <Select
                  id="order-pagamento"
                  value={general.status_pagamento}
                  onChange={e => changeGeneral('status_pagamento', e.target.value)}
                >
                  {paymentOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </Select>
              </div>

              <div className="form-group">
                <label htmlFor="order-sinal" className="form-label">Valor do sinal (R$)</label>
                <Input
                  id="order-sinal"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={general.valor_sinal}
                  onChange={e => changeGeneral('valor_sinal', e.target.value)}
                />
              </div>

              {/* Campo preco_final_cobrado apenas exibido em modo de edição de pedido existente */}
              {isEdit && (
                <div className="form-group">
                  <label htmlFor="order-preco-cobrado" className="form-label">Preço final cobrado (R$)</label>
                  <Input
                    id="order-preco-cobrado"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Usar preço sugerido"
                    value={general.preco_final_cobrado}
                    onChange={e => changeGeneral('preco_final_cobrado', e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>

          {/* 2. Peças do pedido */}
          <div className="rounded-xl border border-border bg-surface p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FiLayers className="text-brand" size={18} />
                <h3 className="text-sm font-semibold tracking-wide text-text-secondary uppercase">
                  2. Peças do Pedido (Impressão 3D)
                </h3>
                <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-semibold text-brand">
                  {pecas.length}
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleOpenAddPart}
                className="gap-1.5"
              >
                <FiPlus size={14} />
                Adicionar Peça
              </Button>
            </div>

            {pecas.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-6 text-center">
                <p className="text-xs text-text-secondary">
                  Nenhuma peça de impressão 3D adicionada ainda.
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleOpenAddPart}
                  className="mt-2 text-brand"
                >
                  + Clique aqui para adicionar uma peça
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {pecas.map((peca, index) => (
                  <div
                    key={peca._id || index}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-border bg-background/60 p-3 text-sm transition hover:border-brand/40"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-text-primary truncate">
                          {peca.nome_peca}
                        </span>
                        <span className="rounded bg-surface-hover px-1.5 py-0.5 text-[11px] font-medium text-text-secondary">
                          {peca.quantidade} {peca.quantidade === 1 ? 'unidade' : 'unidades'}
                        </span>
                        {peca.link_modelo && (
                          <a
                            href={peca.link_modelo}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-text-muted hover:text-brand"
                            title="Abrir modelo 3D"
                          >
                            <FiExternalLink size={13} />
                          </a>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-secondary">
                        <span>🧵 {getFilamentName(peca.filamento_id)}</span>
                        <span>⚖️ {peca.peso_total_g}g</span>
                        <span>⏱️ {peca.horas}h {peca.minutos}min</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                      <div className="text-right">
                        <span className="text-[11px] text-text-muted block">Preço sugerido</span>
                        <span className="font-bold text-emerald-400">
                          {formatMoney(peca.preco_sugerido)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleOpenEditPart(index)}
                          title="Editar peça"
                          aria-label={`Editar ${peca.nome_peca}`}
                        >
                          <FiEdit2 size={14} />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleRemovePart(index)}
                          className="text-danger hover:text-danger"
                          title="Remover peça"
                          aria-label={`Remover ${peca.nome_peca}`}
                        >
                          <FiTrash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. Produtos extras */}
          <div className="rounded-xl border border-border bg-surface p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FiPackage className="text-violet-400" size={18} />
                <h3 className="text-sm font-semibold tracking-wide text-text-secondary uppercase">
                  3. Produtos Extras (Não Impressos)
                </h3>
                <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-xs font-semibold text-violet-400">
                  {extras.length}
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleOpenAddExtra}
                className="gap-1.5"
              >
                <FiPlus size={14} />
                Adicionar Extra
              </Button>
            </div>

            {extras.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-5 text-center">
                <p className="text-xs text-text-secondary">
                  Nenhum produto extra adicionado (opcional — parafusos, LEDs, eletrônicos, etc.).
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleOpenAddExtra}
                  className="mt-1 text-violet-400 text-xs"
                >
                  + Adicionar produto extra
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {extras.map((extra, index) => (
                  <div
                    key={extra._id || index}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-border bg-background/60 p-3 text-sm transition hover:border-violet-500/40"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-text-primary truncate">
                          {extra.nome}
                        </span>
                        <span className="rounded bg-surface-hover px-1.5 py-0.5 text-[11px] font-medium text-text-secondary">
                          {extra.quantidade} {extra.quantidade === 1 ? 'item' : 'itens'}
                        </span>
                      </div>
                      <span className="text-xs text-text-secondary mt-0.5 block">
                        Preço unitário: {formatMoney(extra.preco_unitario)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                      <div className="text-right">
                        <span className="text-[11px] text-text-muted block">Custo total extra</span>
                        <span className="font-bold text-text-primary">
                          {formatMoney(extra.custo_total)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleOpenEditExtra(index)}
                          title="Editar extra"
                          aria-label={`Editar ${extra.nome}`}
                        >
                          <FiEdit2 size={14} />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleRemoveExtra(index)}
                          className="text-danger hover:text-danger"
                          title="Remover extra"
                          aria-label={`Remover ${extra.nome}`}
                        >
                          <FiTrash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 4. Simulação Financeira do Pedido (Consolidação) */}
          <div className="rounded-xl border-2 border-brand/40 bg-surface p-5 shadow-lg shadow-brand/5">
            <h3 className="mb-4 text-sm font-semibold tracking-wide text-brand uppercase flex items-center justify-between">
              <span>Simulação Financeira do Pedido</span>
              <span className="text-xs font-normal text-text-secondary lowercase">
                consolidado em tempo real
              </span>
            </h3>

            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3 text-sm">
              <div className="rounded-lg bg-background/50 p-2.5">
                <dt className="text-xs text-text-secondary">Custo total filamento</dt>
                <dd className="font-semibold text-text-primary">{formatMoney(financial.custo_filamento)}</dd>
              </div>

              <div className="rounded-lg bg-background/50 p-2.5">
                <dt className="text-xs text-text-secondary">Custo total impressão</dt>
                <dd className="font-semibold text-text-primary">{formatMoney(financial.custo_tempo_impressao)}</dd>
              </div>

              <div className="rounded-lg bg-background/50 p-2.5">
                <dt className="text-xs text-text-secondary">Preço custo peças</dt>
                <dd className="font-semibold text-text-primary">{formatMoney(financial.preco_custo_pecas)}</dd>
              </div>

              <div className="rounded-lg bg-background/50 p-2.5">
                <dt className="text-xs text-text-secondary">Custo sem lucro peças</dt>
                <dd className="font-semibold text-text-primary">{formatMoney(financial.custo_total_sem_lucro_pecas)}</dd>
              </div>

              <div className="rounded-lg bg-background/50 p-2.5">
                <dt className="text-xs text-text-secondary">Preço sugerido peças</dt>
                <dd className="font-semibold text-text-primary">{formatMoney(financial.preco_sugerido_pecas)}</dd>
              </div>

              <div className="rounded-lg bg-background/50 p-2.5">
                <dt className="text-xs text-text-secondary">Custo total extras</dt>
                <dd className="font-semibold text-violet-400">{formatMoney(financial.custo_total_extras)}</dd>
              </div>
            </dl>

            {/* DESTAQUE VISUAL: Preço Sugerido Final */}
            <div className="mt-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-semibold text-emerald-400 tracking-wider uppercase block">
                  Preço Sugerido Final do Pedido
                </span>
                <span className="text-xs text-text-secondary">
                  Soma dos preços sugeridos das peças + Custo total dos extras
                </span>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-2xl font-black text-emerald-400 tracking-tight">
                  {formatMoney(financial.preco_sugerido_final)}
                </span>
              </div>
            </div>
          </div>

          {validation && (
            <p role="alert" className="text-sm font-medium text-danger">
              ⚠️ {validation}
            </p>
          )}

          {/* Ações */}
          <div className="flex items-center justify-end gap-3 pt-2">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
                Cancelar
              </Button>
            )}
            <Button
              type="submit"
              variant="primary"
              loading={saving}
              disabled={pecas.length === 0 && extras.length === 0}
            >
              {isEdit ? 'Salvar Alterações' : 'Criar Pedido'}
            </Button>
          </div>
        </fieldset>
      </form>

      {/* Submodal de Peça */}
      <OrderPartModal
        isOpen={partModalOpen}
        onClose={() => { setPartModalOpen(false); setEditingPartIndex(null); }}
        onConfirm={handleSavePart}
        initial={editingPartIndex !== null ? pecas[editingPartIndex] : null}
        filamentos={filamentos}
      />

      {/* Submodal de Extra */}
      <OrderExtraModal
        isOpen={extraModalOpen}
        onClose={() => { setExtraModalOpen(false); setEditingExtraIndex(null); }}
        onConfirm={handleSaveExtra}
        initial={editingExtraIndex !== null ? extras[editingExtraIndex] : null}
      />
    </>
  );
}
