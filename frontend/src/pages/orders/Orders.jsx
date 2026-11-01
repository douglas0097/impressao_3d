import { useNavigate } from 'react-router-dom';
import OrderForm from './OrderForm';
import { statusOptions, paymentOptions } from './orderValues';
import Select from '../../components/Select';
import Button from '../../components/Button';
import React, { useState, useEffect } from 'react';
import DataTable from '../../components/DataTable';
import { TbFileInvoice } from 'react-icons/tb';
import { FiEye } from 'react-icons/fi';
import api from '../../services/api';
import Modal from '../../components/Modal';
import StatusBadge from '../../components/StatusBadge';
import PageHeader from '../../components/PageHeader';

const Orders = () => {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [clientes, setClientes] = useState([]);
  const [filamentos, setFilamentos] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filtroCampo, setFiltroCampo] = useState('cliente');
  const [filtroValor, setFiltroValor] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    setError('');
    try {
      const [pedRes, cliRes, filRes] = await Promise.all([
        api.get('/pedidos'), api.get('/clientes'), api.get('/filamentos')
      ]);
      setPedidos(pedRes.data);
      setClientes(cliRes.data);
      setFilamentos(filRes.data);
    } catch {
      setError('Não foi possível carregar os pedidos.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async payload => {
    setSaving(true);
    setSaveError('');
    try {
      await api.post('/pedidos', payload);
      setIsModalOpen(false);
      await fetchData();
    } catch (err) {
      setSaveError(err.response?.data?.message || 'Falha ao salvar o pedido.');
    } finally { setSaving(false); }
  };

  const updateField = async (id, field, value) => {
    setSaving(true);
    setSaveError('');
    try {
      await api.put(`/pedidos/${id}`, { [field]: value });
      await fetchData();
    } catch (err) {
      setSaveError(err.response?.data?.message || 'Falha ao atualizar o pedido.');
    } finally { setSaving(false); }
  };

  const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  const pedidosFiltrados = pedidos.filter(p => {
    if (!filtroValor) return true;

    if (filtroCampo === 'cliente') {
      return p.cliente_id?.nome?.toLowerCase().includes(filtroValor.toLowerCase());
    }
    if (filtroCampo === 'peca') {
      const q = filtroValor.toLowerCase();
      const inLegacy = p.nome_peca?.toLowerCase().includes(q);
      const inPecas = Array.isArray(p.pecas) && p.pecas.some(item => item.nome_peca?.toLowerCase().includes(q));
      const inExtras = Array.isArray(p.extras) && p.extras.some(item => item.nome?.toLowerCase().includes(q));
      return inLegacy || inPecas || inExtras;
    }
    if (filtroCampo === 'data') {
      if (!p.createdAt) return false;
      const dataPedido = new Date(p.createdAt).toISOString().split('T')[0];
      return dataPedido === filtroValor;
    }
    if (filtroCampo === 'status') {
      return p.status === filtroValor;
    }
    if (filtroCampo === 'pagamento') {
      return p.status_pagamento === filtroValor;
    }
    return true;
  });

  const filters = [{ label: 'Campo de pesquisa', value: filtroCampo, onChange: value => { setFiltroCampo(value); setFiltroValor(''); }, options: [
    { value: 'cliente', label: 'Cliente' }, { value: 'peca', label: 'Peça' },
    { value: 'data', label: 'Data do Pedido' }, { value: 'status', label: 'Status' }, { value: 'pagamento', label: 'Pagamento' },
  ] }];
  if (filtroCampo === 'status' || filtroCampo === 'pagamento') {
    filters.push({ label: filtroCampo === 'status' ? 'Filtrar status' : 'Filtrar pagamento', value: filtroValor, onChange: setFiltroValor, options: [
      { value: '', label: filtroCampo === 'status' ? 'Todos os status' : 'Todos os pagamentos' },
      ...(filtroCampo === 'status' ? statusOptions : paymentOptions),
    ] });
  }

  const renderPecaLabel = (p) => {
    if (Array.isArray(p.pecas) && p.pecas.length > 0) {
      const first = p.pecas[0].nome_peca;
      const extraParts = p.pecas.length - 1;
      const extrasCount = Array.isArray(p.extras) ? p.extras.length : 0;
      return (
        <div>
          <span className="font-semibold text-text-primary">{first}</span>
          {extraParts > 0 && (
            <span className="ml-1 text-xs text-text-secondary">
              (+{extraParts} {extraParts === 1 ? 'peça' : 'peças'})
            </span>
          )}
          {extrasCount > 0 && (
            <span className="ml-1.5 inline-block rounded bg-violet-500/10 px-1.5 py-0.2 text-[10px] font-medium text-violet-400">
              +{extrasCount} {extrasCount === 1 ? 'extra' : 'extras'}
            </span>
          )}
        </div>
      );
    }
    if (Array.isArray(p.extras) && p.extras.length > 0) {
      const first = p.extras[0].nome;
      const extraItems = p.extras.length - 1;
      return (
        <div>
          <span className="font-semibold text-text-primary">{first}</span>
          {extraItems > 0 && (
            <span className="ml-1 text-xs text-text-secondary">
              (+{extraItems} extras)
            </span>
          )}
        </div>
      );
    }
    return <span className="font-semibold text-text-primary">{p.nome_peca || '-'}</span>;
  };

  const renderFilamentoLabel = (p) => {
    if (Array.isArray(p.pecas) && p.pecas.length > 0) {
      const names = Array.from(new Set(
        p.pecas.map(item => item.filamento_id?.nome || (typeof item.filamento_id === 'string' ? filamentos.find(f => f._id === item.filamento_id)?.nome : null)).filter(Boolean)
      ));
      if (names.length > 1) {
        return <span className="cursor-help text-xs font-medium text-brand" title={names.join(', ')}>Vários ({names.length})</span>;
      }
      if (names.length === 1) return names[0];
    }
    return p.filamento_id?.nome || '-';
  };

  return (
    <div>
      <PageHeader
        title="Orçamentos e Pedidos"
        subtitle="Crie orçamentos e acompanhe seus pedidos e pagamentos."
        buttonLabel="Novo Orçamento"
        buttonIcon={<TbFileInvoice size={20} />}
        onButtonClick={() => { setSaveError(''); setIsModalOpen(true); }}
      />
      {saveError && !isModalOpen && <p role="alert" className="mb-4 text-danger">{saveError}</p>}
      <DataTable
        title="Lista de pedidos"
        description="Acompanhe seus orçamentos, a produção e os pagamentos."
        columns={[
          { key: 'createdAt', label: 'Data', className: 'whitespace-nowrap text-text-secondary', render: p => p.createdAt ? new Date(p.createdAt).toLocaleDateString('pt-BR') : '-' },
          { key: 'nome_peca', label: 'Peça / Itens', render: renderPecaLabel },
          { key: 'cliente', label: 'Cliente', render: p => p.cliente_id?.nome || '-' },
          { key: 'filamento', label: 'Filamento', render: renderFilamentoLabel },
          { key: 'tempo_peso', label: 'Tempo/Peso', className: 'whitespace-nowrap', render: p => (p.tempo_estimado_horas > 0 || p.peso_estimado_g > 0) ? `${p.tempo_estimado_horas}h / ${p.peso_estimado_g}g` : '-' },
          { key: 'preco', label: 'Preço Venda', className: 'font-semibold text-success whitespace-nowrap', render: p => formatCurrency(p.preco_final_cobrado ?? p.preco_sugerido) },
          { key: 'status', label: 'Status', render: p => <StatusBadge status={p.status} /> },
          { key: 'pagamento', label: 'Pagamento', render: p => <Select disabled={saving} aria-label={`Pagamento de ${p.nome_peca || 'pedido'}`} size="sm" className="w-auto max-w-full" value={p.status_pagamento || 'PENDENTE'} onChange={e => updateField(p._id, 'status_pagamento', e.target.value)}>{paymentOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</Select> },
          { key: 'status_edicao', label: 'Ações', render: p => <Select disabled={saving} aria-label={`Status de ${p.nome_peca || 'pedido'}`} size="sm" className="w-auto max-w-full" value={p.status} onChange={e => updateField(p._id, 'status', e.target.value)}>{statusOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</Select> },
          { key: 'detalhes', label: 'Detalhes', render: p => <Button variant="outline" size="icon-sm" onClick={() => navigate(`/pedidos/${p._id}`)} aria-label={`Detalhes de ${p.nome_peca || 'pedido'}`} title={`Detalhes de ${p.nome_peca || 'pedido'}`}><FiEye size={16} aria-hidden="true" /></Button> },
        ]}
        rows={pedidosFiltrados}
        getRowKey={p => p._id}
        loading={loading}
        loadingMessage="Carregando pedidos..."
        emptyIcon={TbFileInvoice}
        error={error}
        onRetry={fetchData}
        search={['cliente', 'peca', 'data'].includes(filtroCampo) ? {
          value: filtroValor, onChange: setFiltroValor,
          type: filtroCampo === 'data' ? 'date' : 'search',
          label: `Pesquisar pedidos por ${filtroCampo}`,
          placeholder: `Buscar por ${filtroCampo === 'peca' ? 'peça' : filtroCampo}...`,
        } : undefined}
        filters={filters}
        emptyMessage={pedidos.length === 0 ? 'Nenhum pedido cadastrado.' : 'Nenhum pedido encontrado.'}
        emptyDescription={pedidos.length === 0 ? 'Crie seu primeiro pedido no botão Novo Orçamento.' : 'Tente outro termo ou altere o filtro de pesquisa.'}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => { if (!saving) setIsModalOpen(false); }}
        title="Novo Pedido / Orçamento"
        maxWidth="820px"
      >
        {saveError && <p role="alert" className="mb-4 text-danger">{saveError}</p>}
        {isModalOpen && (
          <OrderForm
            clientes={clientes}
            filamentos={filamentos}
            saving={saving}
            onSubmit={handleSubmit}
            onCancel={() => setIsModalOpen(false)}
          />
        )}
      </Modal>
    </div>
  );
};

export default Orders;
