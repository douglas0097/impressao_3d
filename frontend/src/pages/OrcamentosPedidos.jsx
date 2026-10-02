import React, { useState, useEffect } from 'react';
import { FiSearch } from 'react-icons/fi';
import { TbCalculator, TbFileInvoice } from 'react-icons/tb';
import api from '../services/api';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';

const OrcamentosPedidos = () => {
  const [pedidos, setPedidos] = useState([]);
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

  const fetchData = async () => {
    const [pedRes, cliRes, filRes] = await Promise.all([
      api.get('/pedidos'),
      api.get('/clientes'),
      api.get('/filamentos')
    ]);
    setPedidos(pedRes.data);
    setClientes(cliRes.data);
    setFilamentos(filRes.data);
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

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: '2rem', gap: '1rem', flexWrap: 'wrap' }}>
        <h1>Orçamentos e Pedidos</h1>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'var(--bg-card)', padding: '0.3rem', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
            <FiSearch size={16} style={{ color: 'var(--text-muted)', marginLeft: '0.5rem' }} />
            <select
              className="form-select"
              style={{ border: 'none', background: 'var(--surface-hover)', fontWeight: '500', width: 'auto', paddingLeft: '0.2rem', paddingRight: '1.5rem' }}
              value={filtroCampo}
              onChange={(e) => { setFiltroCampo(e.target.value); setFiltroValor(''); }}
            >
              <option value="cliente">Cliente</option>
              <option value="peca">Peça</option>
              <option value="data">Data do Pedido</option>
              <option value="status">Status</option>
              <option value="pagamento">Pagamento</option>
            </select>

            <div style={{ width: '1px', height: '24px', background: 'var(--border-light)' }}></div>

            {(filtroCampo === 'cliente' || filtroCampo === 'peca') && (
              <input
                type="text"
                className="form-input"
                placeholder={`Buscar por ${filtroCampo}...`}
                style={{ border: 'none', background: 'transparent', boxShadow: 'none', minWidth: '200px' }}
                value={filtroValor}
                onChange={(e) => setFiltroValor(e.target.value)}
              />
            )}

            {filtroCampo === 'data' && (
              <input
                type="date"
                className="form-input"
                style={{ border: 'none', background: 'transparent', boxShadow: 'none' }}
                value={filtroValor}
                onChange={(e) => setFiltroValor(e.target.value)}
              />
            )}

            {filtroCampo === 'status' && (
              <select
                className="form-select"
                style={{ border: 'none', background: 'var(--surface-hover)', boxShadow: 'none', minWidth: '180px' }}
                value={filtroValor}
                onChange={(e) => setFiltroValor(e.target.value)}
              >
                <option value="">Todos os status</option>
                <option value="ORCAMENTO">Orçamento</option>
                <option value="APROVADO">Aprovado</option>
                <option value="EM_IMPRESSAO">Em Impressão</option>
                <option value="CONCLUIDO">Concluído</option>
                <option value="ENTREGUE">Entregue</option>
                <option value="CANCELADO">Cancelado</option>
              </select>
            )}

            {filtroCampo === 'pagamento' && (
              <select
                className="form-select"
                style={{ border: 'none', background: 'var(--surface-hover)', boxShadow: 'none', minWidth: '180px' }}
                value={filtroValor}
                onChange={(e) => setFiltroValor(e.target.value)}
              >
                <option value="">Todos os pagamentos</option>
                <option value="PENDENTE">Pendente</option>
                <option value="SINAL_50">Sinal 50%</option>
                <option value="PAGO">Pago</option>
              </select>
            )}
          </div>

          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <TbFileInvoice size={20} /> Novo Orçamento
          </button>
        </div>
      </div>

      <div className="glass-card table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Peça</th>
              <th>Cliente</th>
              <th>Filamento</th>
              <th>Tempo/Peso</th>
              <th>Preço Venda</th>
              <th>Status</th>
              <th>Pagamento</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {pedidosFiltrados.map(p => (
              <tr key={p._id}>
                <td style={{ color: 'var(--text-muted)' }}>
                  {p.createdAt ? new Date(p.createdAt).toLocaleDateString('pt-BR') : '-'}
                </td>
                <td style={{ fontWeight: '500' }}>{p.nome_peca}</td>
                <td>{p.cliente_id?.nome}</td>
                <td>{p.filamento_id?.nome}</td>
                <td>{p.tempo_estimado_horas}h / {p.peso_estimado_g}g</td>
                <td className="text-success" style={{ fontWeight: '600' }}>
                  {formatCurrency(p.preco_final_cobrado || p.preco_sugerido)}
                </td>
                <td><StatusBadge status={p.status} /></td>
                <td>
                  <select
                    className="form-select"
                    style={{ padding: '0.3rem 0.5rem', width: 'auto' }}
                    value={p.status_pagamento || 'PENDENTE'}
                    onChange={(e) => updatePaymentStatus(p._id, e.target.value)}
                  >
                    <option value="PENDENTE">Pendente</option>
                    <option value="SINAL_50">Sinal 50%</option>
                    <option value="PAGO">Pago</option>
                  </select>
                </td>
                <td>
                  <select
                    className="form-select"
                    style={{ padding: '0.3rem 0.5rem', width: 'auto' }}
                    value={p.status}
                    onChange={(e) => updateStatus(p._id, e.target.value)}
                  >
                    <option value="ORCAMENTO">Orçamento</option>
                    <option value="APROVADO">Aprovado</option>
                    <option value="EM_IMPRESSAO">Em Impressão</option>
                    <option value="CONCLUIDO">Concluído</option>
                    <option value="ENTREGUE">Entregue</option>
                    <option value="CANCELADO">Cancelado</option>
                  </select>
                </td>
              </tr>
            ))}
            {pedidosFiltrados.length === 0 && (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Nenhum pedido encontrado.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Motor de Orçamentos">
        <form onSubmit={handleSubmit}>
          <div className="responsive-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="form-group">
              <label className="form-label">Cliente *</label>
              <select className="form-select" required value={formData.cliente_id} onChange={e => setFormData({ ...formData, cliente_id: e.target.value })}>
                <option value="">Selecione um cliente...</option>
                {clientes.map(c => <option key={c._id} value={c._id}>{c.nome}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Filamento *</label>
              <select className="form-select" required value={formData.filamento_id} onChange={e => setFormData({ ...formData, filamento_id: e.target.value })}>
                <option value="">Selecione um filamento...</option>
                {filamentos.map(f => {
                  const estoque = f.estoque_gramas != null ? f.estoque_gramas : f.peso_total_g;
                  return (
                    <option key={f._id} value={f._id}>
                      {f.nome} - Estoque: {estoque}g (R${f.custo_por_grama?.toFixed(3)}/g)
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Nome da Peça *</label>
            <input className="form-input" required value={formData.nome_peca} onChange={e => setFormData({ ...formData, nome_peca: e.target.value })} placeholder="Ex: TCG GB case 105%" />
          </div>

          <div className="responsive-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="form-group">
              <label className="form-label">Peso do Fatiador (g) *</label>
              <input type="number" step="0.1" className="form-input" required value={formData.peso_estimado_g} onChange={e => setFormData({ ...formData, peso_estimado_g: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Tempo do Fatiador (horas) *</label>
              <input type="number" step="0.1" className="form-input" required value={formData.tempo_estimado_horas} onChange={e => setFormData({ ...formData, tempo_estimado_horas: e.target.value })} />
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

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={!calculoRealTime}>
            Salvar como Pedido / Orçamento
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default OrcamentosPedidos;
