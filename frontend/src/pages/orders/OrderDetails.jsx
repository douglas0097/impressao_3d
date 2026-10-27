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
        <div className="w-full"><OrderForm initial={order} clientes={clientes} filamentos={filamentos} saving={busy} onSubmit={save} /></div>
      </DetailSection> : <>
        <DetailSection title="Informações da peça e do cliente">
          <DetailGrid>
            <DetailValue label="Peça" value={order.nome_peca} />
            <DetailValue label="Cliente" value={order.cliente_id?.nome || 'Cliente indisponível'} />
            <DetailValue label="Telefone" value={order.cliente_id?.telefone || 'Não informado'} />
            <DetailValue label="Filamento" value={order.filamento_id?.nome || 'Filamento indisponível'} />
            <DetailValue label="Modelo" value={safeLink ? <a className="text-primary underline" href={safeLink} target="_blank" rel="noopener noreferrer">Abrir modelo</a> : order.link_modelo || 'Não informado'} />
          </DetailGrid>
        </DetailSection>
        <DetailSection title="Produção">
          <DetailGrid>
            <DetailValue label="Quantidade" value={order.quantidade_pecas ?? 1} />
            <DetailValue label="Peso total" value={`${order.peso_estimado_g} g`} />
            <DetailValue label="Tempo total de impressão" value={`${time.horas} h ${time.minutos} min`} />
            <DetailValue label="Status" value={<StatusBadge status={order.status} />} />
          </DetailGrid>
        </DetailSection>
        <DetailSection title="Custos e valores">
          <DetailGrid>
            <DetailValue label="Custo de filamento" value={formatMoney(order.custo_filamento)} />
            <DetailValue label="Custo de impressão" value={formatMoney(order.custo_tempo_impressao ?? order.custo_tempo_energia)} />
            <DetailValue label="Preço de custo" value={formatMoney(order.preco_custo)} />
            <DetailValue label="Custo total sem lucro" value={formatMoney(order.custo_total_sem_lucro)} />
            <DetailValue label="Preço sugerido" value={formatMoney(order.preco_sugerido)} />
            <DetailValue label="Preço final cobrado" value={formatMoney(order.preco_final_cobrado ?? order.preco_sugerido)} />
          </DetailGrid>
        </DetailSection>
        <DetailSection title="Pagamento">
          <DetailGrid>
            <DetailValue label="Pagamento" value={<StatusBadge type="pagamento" status={order.status_pagamento} />} />
            <DetailValue label="Valor do sinal" value={formatMoney(order.valor_sinal)} />
          </DetailGrid>
        </DetailSection>
        <DetailsFooter createdAt={order.createdAt} updatedAt={order.updatedAt} />
      </>}
    </DetailsCard>}
    <DeleteDetailsDialog isOpen={deleting} title="Excluir orçamento / pedido" busy={busy} error={formError} onCancel={() => setDeleting(false)} onConfirm={remove}>
      Deseja excluir <strong>“{order?.nome_peca}”</strong>?
    </DeleteDetailsDialog>
  </DetailsPage>;
}
