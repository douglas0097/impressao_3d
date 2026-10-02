import Input from '../../components/Input';
import Select from '../../components/Select';
import Button from '../../components/Button';
import React, { useState, useEffect } from 'react';
import DataTable from '../../components/DataTable';
import { TbCalculator, TbFileInvoice } from 'react-icons/tb';
import api from '../../services/api';
import Modal from '../../components/Modal';
import StatusBadge from '../../components/StatusBadge';
import PageHeader from '../../components/PageHeader';

const Orders = () => {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [clientes, setClientes] = useState([]);
  const [filamentos, setFilamentos] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingCalc, setLoadingCalc] = useState(false);
  const [filtroCampo, setFiltroCampo] = useState('cliente');
  const [filtroValor, setFiltroValor] = useState('');

  const [formData, setFormData] = useState({
    cliente_id: '',
    nome_peca: '',
    link_modelo: '',
    filamento_id: '',
    quantidade_pecas: 1,
    peso_estimado_g: '',
    tempo_estimado_horas: '',
  });

  const [calculoRealTime, setCalculoRealTime] = useState(null);

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

  const handleSimulate = async () => {
    if (!formData.filamento_id || !formData.peso_estimado_g || !formData.tempo_estimado_horas) return;
    setLoadingCalc(true);
    try {
      const res = await api.post('/pedidos/calcular', {
        filamento_id: formData.filamento_id,
        peso_estimado_g: formData.peso_estimado_g,
        tempo_estimado_horas: formData.tempo_estimado_horas
      });
      setCalculoRealTime(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingCalc(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      handleSimulate();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [formData.filamento_id, formData.peso_estimado_g, formData.tempo_estimado_horas]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const filamentoSelecionado = filamentos.find(f => f._id === formData.filamento_id);
    if (filamentoSelecionado) {
      const estoque = filamentoSelecionado.estoque_gramas != null ? filamentoSelecionado.estoque_gramas : filamentoSelecionado.peso_total_g;
      if (Number(formData.peso_estimado_g) > estoque) {
        alert(`Estoque insuficiente! Você só tem ${estoque}g disponíveis deste filamento.`);
        return;
      }
    }

    const payload = {
      ...formData,
      ...calculoRealTime, // Adiciona os custos calculados
      preco_final_cobrado: calculoRealTime?.preco_sugerido
    };
    await api.post('/pedidos', payload);
    setIsModalOpen(false);
    setFormData({ cliente_id: '', nome_peca: '', link_modelo: '', filamento_id: '', quantidade_pecas: 1, peso_estimado_g: '', tempo_estimado_horas: '' });
    setCalculoRealTime(null);
    fetchData();
  };

  const updateStatus = async (id, newStatus) => {
    await api.put(`/pedidos/${id}`, { status: newStatus });
    fetchData();
  };

  const updatePaymentStatus = async (id, newStatus) => {
    await api.put(`/pedidos/${id}`, { status_pagamento: newStatus });
    fetchData();
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

  const statusOptions = [
    { value: 'ORCAMENTO', label: 'Orçamento' },
    { value: 'APROVADO', label: 'Aprovado' },
    { value: 'EM_IMPRESSAO', label: 'Em Impressão' },
    { value: 'CONCLUIDO', label: 'Concluído' },
    { value: 'ENTREGUE', label: 'Entregue' },
    { value: 'CANCELADO', label: 'Cancelado' },
  ];
  const paymentOptions = [
    { value: 'PENDENTE', label: 'Pendente' },
    { value: 'SINAL_50', label: 'Sinal 50%' },
    { value: 'PAGO', label: 'Pago' },
  ];
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
        onButtonClick={() => setIsModalOpen(true)}
      />
      <DataTable
        title="Lista de pedidos"
        description="Acompanhe seus orçamentos, a produção e os pagamentos."
        columns={[
          { key: 'createdAt', label: 'Data', className: 'whitespace-nowrap text-text-secondary', render: p => p.createdAt ? new Date(p.createdAt).toLocaleDateString('pt-BR') : '-' },
          { key: 'nome_peca', label: 'Peça', className: 'font-semibold' },
          { key: 'cliente', label: 'Cliente', render: p => p.cliente_id?.nome || '-' },
          { key: 'filamento', label: 'Filamento', render: p => p.filamento_id?.nome || '-' },
          { key: 'tempo_peso', label: 'Tempo/Peso', className: 'whitespace-nowrap', render: p => `${p.tempo_estimado_horas}h / ${p.peso_estimado_g}g` },
          { key: 'preco', label: 'Preço Venda', className: 'font-semibold text-success whitespace-nowrap', render: p => formatCurrency(p.preco_final_cobrado || p.preco_sugerido) },
          { key: 'status', label: 'Status', render: p => <StatusBadge status={p.status} /> },
          { key: 'pagamento', label: 'Pagamento', render: p => <Select aria-label={`Pagamento de ${p.nome_peca}`} size="sm" className="w-auto max-w-full" value={p.status_pagamento || 'PENDENTE'} onChange={e => updatePaymentStatus(p._id, e.target.value)}>{paymentOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</Select> },
          { key: 'actions', label: 'Ações', render: p => <Select aria-label={`Status de ${p.nome_peca}`} size="sm" className="w-auto max-w-full" value={p.status} onChange={e => updateStatus(p._id, e.target.value)}>{statusOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</Select> },
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Motor de Orçamentos">
        <form onSubmit={handleSubmit}>
          <div className="responsive-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="form-group">
              <label htmlFor="orders-field-1" className="form-label">Cliente *</label>
              <Select id="orders-field-1" required value={formData.cliente_id} onChange={e => setFormData({ ...formData, cliente_id: e.target.value })}>
                <option value="">Selecione um cliente...</option>
                {clientes.map(c => <option key={c._id} value={c._id}>{c.nome}</option>)}
              </Select>
            </div>
            <div className="form-group">
              <label htmlFor="orders-field-2" className="form-label">Filamento *</label>
              <Select id="orders-field-2" required value={formData.filamento_id} onChange={e => setFormData({ ...formData, filamento_id: e.target.value })}>
                <option value="">Selecione um filamento...</option>
                {filamentos.map(f => {
                  const estoque = f.estoque_gramas != null ? f.estoque_gramas : f.peso_total_g;
                  return (
                    <option key={f._id} value={f._id}>
                      {f.nome} - Estoque: {estoque}g (R${f.custo_por_grama?.toFixed(3)}/g)
                    </option>
                  );
                })}
              </Select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="orders-field-3" className="form-label">Nome da Peça *</label>
            <Input id="orders-field-3" required value={formData.nome_peca} onChange={e => setFormData({ ...formData, nome_peca: e.target.value })} placeholder="Ex: TCG GB case 105%" />
          </div>

          <div className="responsive-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="form-group">
              <label htmlFor="orders-field-4" className="form-label">Peso do Fatiador (g) *</label>
              <Input id="orders-field-4" type="number" step="0.1" required value={formData.peso_estimado_g} onChange={e => setFormData({ ...formData, peso_estimado_g: e.target.value })} />
            </div>
            <div className="form-group">
              <label htmlFor="orders-field-5" className="form-label">Tempo do Fatiador (horas) *</label>
              <Input id="orders-field-5" type="number" step="0.1" required value={formData.tempo_estimado_horas} onChange={e => setFormData({ ...formData, tempo_estimado_horas: e.target.value })} />
            </div>
          </div>

          {/* Painel de Cálculo em Tempo Real */}
          <div style={{ background: 'var(--brand-soft)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-focus)', marginBottom: '1.5rem' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--primary)' }}>
              <TbCalculator size={18} /> Simulação Financeira
              {loadingCalc && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}> (Calculando...)</span>}
            </h4>

            {calculoRealTime ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem' }}>
                <div className="flex-between">
                  <span style={{ color: 'var(--text-muted)' }}>Custo Filamento:</span>
                  <span>{formatCurrency(calculoRealTime.custo_filamento)}</span>
                </div>
                <div className="flex-between">
                  <span style={{ color: 'var(--text-muted)' }}>Custo Tempo + Energia:</span>
                  <span>{formatCurrency(calculoRealTime.custo_tempo_energia)}</span>
                </div>
                <div className="flex-between">
                  <span style={{ color: 'var(--text-muted)' }}>Adicionais (Manut/Retrabalho):</span>
                  <span>{formatCurrency(calculoRealTime.custo_manutencao + calculoRealTime.custo_retrabalho)}</span>
                </div>
                <hr style={{ borderColor: 'var(--border-light)', margin: '0.5rem 0' }} />
                <div className="flex-between">
                  <span style={{ fontWeight: '500' }}>Custo Total sem Lucro:</span>
                  <span className="text-warning">{formatCurrency(calculoRealTime.custo_total_sem_lucro)}</span>
                </div>
                <div className="flex-between" style={{ marginTop: '0.5rem', fontSize: '1.1rem' }}>
                  <span style={{ fontWeight: '700', color: 'var(--text-main)' }}>Preço de Venda Sugerido:</span>
                  <span className="text-success" style={{ fontWeight: '700' }}>{formatCurrency(calculoRealTime.preco_sugerido)}</span>
                </div>
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
                Preencha filamento, peso e tempo para visualizar a simulação de custos automaticamente.
              </p>
            )}
          </div>

          <Button type="submit" fullWidth disabled={!calculoRealTime}>
            Salvar como Pedido / Orçamento
          </Button>
        </form>
      </Modal>
    </div>
  );
};

export default Orders;
