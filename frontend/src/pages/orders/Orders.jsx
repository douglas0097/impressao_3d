import { useNavigate } from 'react-router-dom';
import OrderForm from './OrderForm';
import { statusOptions, paymentOptions } from './orderValues';
import Select from '../../components/Select';
import Button from '../../components/Button';
import React, { useState, useEffect } from 'react';
import DataTable from '../../components/DataTable';
import { TbFileInvoice } from 'react-icons/tb';
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
      return p.nome_peca?.toLowerCase().includes(filtroValor.toLowerCase());
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
          { key: 'nome_peca', label: 'Peça', className: 'font-semibold' },
          { key: 'cliente', label: 'Cliente', render: p => p.cliente_id?.nome || '-' },
          { key: 'filamento', label: 'Filamento', render: p => p.filamento_id?.nome || '-' },
          { key: 'tempo_peso', label: 'Tempo/Peso', className: 'whitespace-nowrap', render: p => `${p.tempo_estimado_horas}h / ${p.peso_estimado_g}g` },
          { key: 'preco', label: 'Preço Venda', className: 'font-semibold text-success whitespace-nowrap', render: p => formatCurrency(p.preco_final_cobrado ?? p.preco_sugerido) },
          { key: 'status', label: 'Status', render: p => <StatusBadge status={p.status} /> },
          { key: 'pagamento', label: 'Pagamento', render: p => <Select disabled={saving} aria-label={`Pagamento de ${p.nome_peca}`} size="sm" className="w-auto max-w-full" value={p.status_pagamento || 'PENDENTE'} onChange={e => updateField(p._id, 'status_pagamento', e.target.value)}>{paymentOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</Select> },
          { key: 'status_edicao', label: 'Ações', render: p => <Select disabled={saving} aria-label={`Status de ${p.nome_peca}`} size="sm" className="w-auto max-w-full" value={p.status} onChange={e => updateField(p._id, 'status', e.target.value)}>{statusOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</Select> },
          { key: 'detalhes', label: 'Detalhes', render: p => <Button variant="outline" size="sm" onClick={() => navigate(`/pedidos/${p._id}`)} aria-label={`Detalhes de ${p.nome_peca}`}>Detalhes</Button> },
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

      <Modal isOpen={isModalOpen} onClose={() => { if (!saving) setIsModalOpen(false); }} title="Novo orçamento / pedido">
        {saveError && <p role="alert" className="mb-4 text-danger">{saveError}</p>}
        {isModalOpen && <OrderForm clientes={clientes} filamentos={filamentos} saving={saving} onSubmit={handleSubmit} />}
      </Modal>
    </div>
  );
};

export default Orders;
