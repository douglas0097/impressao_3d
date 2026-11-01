import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DetailsPage, DetailsCard, DetailSection, DetailGrid, DetailValue, DetailsFooter, DeleteDetailsDialog } from '../../components/details/Details';
import StatusBadge from '../../components/StatusBadge';
import api from '../../services/api';
import OrderForm from './OrderForm';
import { formatMoney, splitTime } from './orderValues';

export default function OrderDetails() {
  const { id } = useParams();
  return <OrderDetailsContent key={id} id={id} />;
}

function OrderDetailsContent({ id }) {
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [clientes, setClientes] = useState([]);
  const [filamentos, setFilamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const { data } = await api.get('/pedidos', { signal: controller.signal });
        if (controller.signal.aborted) return;
        const record = data.find(item => item._id === id);
        setOrder(record || null);
        if (!record) setError('Orçamento ou pedido não encontrado.');
      } catch {
        if (!controller.signal.aborted) setError('Não foi possível carregar o pedido.');
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }
    load();
    return () => controller.abort();
  }, [id, attempt]);

  async function edit() {
    setBusy(true);
    setFormError('');
    setNotice('');
    try {
      const [customers, materials] = await Promise.all([api.get('/clientes'), api.get('/filamentos')]);
      setClientes(customers.data);
      setFilamentos(materials.data);
      setEditing(true);
    } catch { setFormError('Não foi possível carregar clientes e filamentos. Tente editar novamente.'); }
    finally { setBusy(false); }
  }
  async function save(payload) {
    setBusy(true);
    setFormError('');
    try {
      const { data } = await api.put(`/pedidos/${id}`, payload);
      if (!data) throw new Error('Pedido não encontrado.');
      setOrder(data);
      setEditing(false);
      setNotice('Alterações salvas com sucesso.');
    } catch (err) { setFormError(err.response?.data?.message || 'Não foi possível salvar o pedido.'); }
    finally { setBusy(false); }
  }
  async function remove() {
    setBusy(true);
    setFormError('');
    try {
      await api.delete(`/pedidos/${id}`);
      navigate('/pedidos', { replace: true });
    } catch (err) { setFormError(err.response?.data?.message || 'Não foi possível excluir o pedido.'); }
    finally { setBusy(false); }
  }
  const time = splitTime(order?.tempo_estimado_horas);
  const safeLink = /^https?:\/\//i.test(order?.link_modelo || '') ? order.link_modelo : null;
  return <DetailsPage
    title={order?.status === 'ORCAMENTO' ? 'Detalhes do orçamento' : 'Detalhes do pedido'}
    subtitle="Informações da peça, produção, custos e pagamento."
    onBack={() => navigate('/pedidos')}
    busy={busy} loading={loading} loadingMessage="Carregando pedido..."
    error={error || (!deleting ? formError : '')} notice={notice}
    onRetry={!loading && !order ? () => { setLoading(true); setError(''); setAttempt(value => value + 1); } : undefined}
  >
    {!loading && order && <DetailsCard
      title={order.nome_peca}
      subtitle={`${order.cliente_id?.nome || 'Cliente indisponível'} · ${order.filamento_id?.nome || 'Filamento indisponível'}`}
      editing={editing} busy={busy}
      editLabel={order.status === 'ORCAMENTO' ? 'Editar orçamento' : 'Editar pedido'}
      onEdit={editing ? () => { setEditing(false); setFormError(''); } : edit}
      onDelete={() => { setFormError(''); setDeleting(true); }}
    >
      {editing ? <DetailSection title="Editar informações">
        <div className="w-full">
          <OrderForm
            initial={order}
            clientes={clientes}
            filamentos={filamentos}
            saving={busy}
            onSubmit={save}
            onCancel={() => setEditing(false)}
          />
        </div>
      </DetailSection> : <>
        <DetailSection title="Informações gerais e do cliente">
          <DetailGrid>
            <DetailValue label="Cliente" value={order.cliente_id?.nome || 'Cliente indisponível'} />
            <DetailValue label="Telefone" value={order.cliente_id?.telefone || 'Não informado'} />
            <DetailValue label="Status do pedido" value={<StatusBadge status={order.status} />} />
            <DetailValue label="Status do pagamento" value={<StatusBadge type="pagamento" status={order.status_pagamento} />} />
            <DetailValue label="Valor do sinal" value={formatMoney(order.valor_sinal)} />
          </DetailGrid>
        </DetailSection>

        {/* Seção de Peças 3D */}
        {Array.isArray(order.pecas) && order.pecas.length > 0 ? (
          <DetailSection title={`Peças do pedido (${order.pecas.length})`}>
            <div className="space-y-3">
              {order.pecas.map((peca, idx) => {
                const pTime = splitTime(peca.tempo_total_horas ?? peca.tempo_estimado_horas);
                const pLink = /^https?:\/\//i.test(peca.link_modelo || '') ? peca.link_modelo : null;
                return (
                  <div key={peca._id || idx} className="rounded-lg border border-border bg-background/50 p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                      <div>
                        <span className="font-semibold text-text-primary text-base">{peca.nome_peca}</span>
                        <span className="ml-2 rounded bg-surface px-2 py-0.5 text-xs text-text-secondary">
                          {peca.quantidade} {peca.quantidade === 1 ? 'unidade' : 'unidades'}
                        </span>
                      </div>
                      <div className="text-sm font-semibold text-emerald-400">
                        Sugerido: {formatMoney(peca.preco_sugerido)}
                      </div>
                    </div>
                    <DetailGrid>
                      <DetailValue label="Filamento" value={peca.filamento_id?.nome || 'Filamento não informado'} />
                      <DetailValue label="Peso total" value={`${peca.peso_total_g ?? peca.peso_estimado_g} g`} />
                      <DetailValue label="Tempo de impressão" value={`${pTime.horas}h ${pTime.minutos}min`} />
                      <DetailValue label="Custo filamento" value={formatMoney(peca.custo_filamento)} />
                      <DetailValue label="Custo impressão" value={formatMoney(peca.custo_tempo_impressao)} />
                      <DetailValue label="Preço de custo" value={formatMoney(peca.preco_custo)} />
                      <DetailValue label="Custo sem lucro" value={formatMoney(peca.custo_total_sem_lucro)} />
                      <DetailValue label="Preço sugerido" value={formatMoney(peca.preco_sugerido)} />
                      <DetailValue label="Modelo 3D" value={pLink ? <a className="text-primary underline" href={pLink} target="_blank" rel="noopener noreferrer">Abrir modelo</a> : (peca.link_modelo || 'Não informado')} />
                    </DetailGrid>
                  </div>
                );
              })}
            </div>
          </DetailSection>
        ) : (
          /* Fallback para pedidos legados */
          <DetailSection title="Produção (Peça única legada)">
            <DetailGrid>
              <DetailValue label="Peça" value={order.nome_peca} />
              <DetailValue label="Filamento" value={order.filamento_id?.nome || 'Filamento indisponível'} />
              <DetailValue label="Quantidade" value={order.quantidade_pecas ?? 1} />
              <DetailValue label="Peso total" value={`${order.peso_estimado_g} g`} />
              <DetailValue label="Tempo de impressão" value={`${time.horas} h ${time.minutos} min`} />
              <DetailValue label="Custo filamento" value={formatMoney(order.custo_filamento)} />
              <DetailValue label="Custo impressão" value={formatMoney(order.custo_tempo_impressao ?? order.custo_tempo_energia)} />
              <DetailValue label="Preço de custo" value={formatMoney(order.preco_custo)} />
              <DetailValue label="Custo sem lucro" value={formatMoney(order.custo_total_sem_lucro)} />
              <DetailValue label="Preço sugerido" value={formatMoney(order.preco_sugerido)} />
              <DetailValue label="Modelo 3D" value={safeLink ? <a className="text-primary underline" href={safeLink} target="_blank" rel="noopener noreferrer">Abrir modelo</a> : (order.link_modelo || 'Não informado')} />
            </DetailGrid>
          </DetailSection>
        )}

        {/* Seção de Extras (se houver) */}
        {Array.isArray(order.extras) && order.extras.length > 0 && (
          <DetailSection title={`Produtos extras (${order.extras.length})`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {order.extras.map((extra, idx) => (
                <div key={extra._id || idx} className="rounded-lg border border-border bg-background/50 p-3.5 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-text-primary text-sm block">{extra.nome}</span>
                    <span className="text-xs text-text-secondary">
                      {extra.quantidade}x a {formatMoney(extra.preco_unitario)} cada
                    </span>
                  </div>
                  <span className="font-bold text-sm text-text-primary">
                    {formatMoney(extra.custo_total)}
                  </span>
                </div>
              ))}
            </div>
          </DetailSection>
        )}

        {/* Seção de Consolidação Financeira */}
        <DetailSection title="Custos e valores consolidados">
          <DetailGrid>
            <DetailValue label="Custo total de filamento" value={formatMoney(order.custo_filamento)} />
            <DetailValue label="Custo total de impressão" value={formatMoney(order.custo_tempo_impressao ?? order.custo_tempo_energia)} />
            <DetailValue label="Preço de custo das peças" value={formatMoney(order.preco_custo_pecas ?? order.preco_custo)} />
            <DetailValue label="Custo sem lucro das peças" value={formatMoney(order.custo_total_sem_lucro_pecas ?? order.custo_total_sem_lucro)} />
            <DetailValue label="Preço sugerido das peças" value={formatMoney(order.preco_sugerido_pecas ?? order.preco_sugerido)} />
            {Number(order.custo_total_extras || 0) > 0 && (
              <DetailValue label="Custo total dos extras" value={formatMoney(order.custo_total_extras)} />
            )}
            <DetailValue
              label="Preço sugerido final"
              value={<span className="font-bold text-emerald-400">{formatMoney(order.preco_sugerido)}</span>}
            />
            <DetailValue
              label="Preço final cobrado"
              value={<span className="font-bold text-success">{formatMoney(order.preco_final_cobrado ?? order.preco_sugerido)}</span>}
            />
          </DetailGrid>
        </DetailSection>

        {/* Seção de Configurações Históricas */}
        <DetailSection title="Configurações utilizadas neste pedido">
          {order.configuracao_snapshot && (order.configuracao_snapshot.custo_energia != null || order.configuracao_snapshot.taxa_manutencao != null) ? (
            <DetailGrid>
              <DetailValue
                label="Custo de energia elétrica"
                value={`${formatMoney(order.configuracao_snapshot.custo_energia)} / hora`}
              />
              <DetailValue
                label="Custo de manutenção"
                value={`${formatMoney(order.configuracao_snapshot.taxa_manutencao)} / hora`}
              />
              <DetailValue
                label="Percentual de retrabalho"
                value={`${order.configuracao_snapshot.taxa_retrabalho_pct}%`}
              />
              <DetailValue
                label="Margem de lucro"
                value={`${order.configuracao_snapshot.margem_lucro_padrao_pct}%`}
              />
            </DetailGrid>
          ) : (
            <p className="text-xs text-text-secondary italic">
              Histórico de configurações não disponível para este pedido.
            </p>
          )}
        </DetailSection>
        <DetailsFooter createdAt={order.createdAt} updatedAt={order.updatedAt} />
      </>}
    </DetailsCard>}
    <DeleteDetailsDialog isOpen={deleting} title="Excluir orçamento / pedido" busy={busy} error={formError} onCancel={() => setDeleting(false)} onConfirm={remove}>
      Deseja excluir <strong>“{order?.nome_peca}”</strong>?
    </DeleteDetailsDialog>
  </DetailsPage>;
}
