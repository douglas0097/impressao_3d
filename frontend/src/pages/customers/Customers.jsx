import Button from '../../components/Button';
import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/PageHeader';
import { FiPlus, FiMessageCircle, FiEdit2, FiTrash2, FiPhone, FiInstagram } from 'react-icons/fi';
import DataTable from '../../components/DataTable';
import api from '../../services/api';
import Modal from '../../components/Modal';

const Customers = () => {
  const [clientes, setClientes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filtroCampo, setFiltroCampo] = useState('nome');
  const [filtroValor, setFiltroValor] = useState('');
  const [ordenacao, setOrdenacao] = useState('az');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ nome: '', telefone: '', instagram: '', observacoes: '' });

  useEffect(() => {
    fetchClientes();
  }, []);

  async function fetchClientes() {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/clientes');
      setClientes(res.data);
    } catch {
      setError('Não foi possível carregar os clientes.');
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId) {
      await api.put(`/clientes/${editingId}`, formData);
    } else {
      await api.post('/clientes', formData);
    }
    closeModal();
    fetchClientes();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ nome: '', telefone: '', instagram: '', observacoes: '' });
  };

  const handleEdit = (cliente) => {
    setFormData({
      nome: cliente.nome || '',
      telefone: cliente.telefone || '',
      instagram: cliente.instagram || '',
      observacoes: cliente.observacoes || ''
    });
    setEditingId(cliente._id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este cliente?')) {
      await api.delete(`/clientes/${id}`);
      fetchClientes();
    }
  };

  const openWhatsApp = (phone) => {
    if (!phone) return;
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/55${cleanPhone}`, '_blank');
  };

  const clientesFiltrados = clientes.filter(c => {
    if (!filtroValor) return true;

    if (filtroCampo === 'nome') {
      return c.nome?.toLowerCase().includes(filtroValor.toLowerCase());
    }
    if (filtroCampo === 'telefone') {
      const telefoneLimpo = c.telefone?.replace(/\D/g, '') || '';
      const buscaLimpa = filtroValor.replace(/\D/g, '');
      return (
        c.telefone?.toLowerCase().includes(filtroValor.toLowerCase()) ||
        (buscaLimpa && telefoneLimpo.includes(buscaLimpa))
      );
    }
    if (filtroCampo === 'instagram') {
      return c.instagram?.toLowerCase().includes(filtroValor.toLowerCase());
    }
    return true;
  }).sort((a, b) => ordenacao === 'az'
    ? (a.nome || '').localeCompare(b.nome || '', 'pt-BR')
    : (b.nome || '').localeCompare(a.nome || '', 'pt-BR'));

  const columns = [
    { key: 'nome', label: 'Cliente', render: cliente => (
      <div className="flex min-w-40 items-center gap-3">
        <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-[11px] font-semibold text-brand">
          {(cliente.nome || '').split(' ').filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase() || 'CL'}
        </span>
        <span className="font-semibold text-text-primary">{cliente.nome || 'Sem nome'}</span>
      </div>
    ) },
    { key: 'telefone', label: 'Telefone', render: cliente => (
      <span className="flex items-center gap-2 whitespace-nowrap text-text-secondary"><FiPhone size={14} aria-hidden="true" className="text-text-disabled" />{cliente.telefone || 'Não informado'}</span>
    ) },
    { key: 'instagram', label: 'Instagram', render: cliente => (
      <span className="flex items-center gap-2 text-text-secondary"><FiInstagram size={14} aria-hidden="true" className="shrink-0 text-text-disabled" />{cliente.instagram || 'Não informado'}</span>
    ) },
    { key: 'actions', label: 'Ações', className: 'w-1 whitespace-nowrap', render: cliente => (
      <div className="flex items-center gap-1.5">
        <Button type="button" disabled={!cliente.telefone} onClick={() => openWhatsApp(cliente.telefone)} variant="success-soft" size="sm" aria-label={`Abrir WhatsApp de ${cliente.nome}`} title="WhatsApp"><FiMessageCircle size={15} />WhatsApp</Button>
        <Button type="button" onClick={() => handleEdit(cliente)} variant="outline" size="icon-sm" aria-label={`Editar ${cliente.nome}`} title="Editar cliente"><FiEdit2 size={15} /></Button>
        <Button type="button" onClick={() => handleDelete(cliente._id)} variant="danger-ghost" size="icon-sm" aria-label={`Excluir ${cliente.nome}`} title="Excluir cliente"><FiTrash2 size={15} /></Button>
      </div>
    ) },
  ];

  return (
    <div>
      <PageHeader
        title="Clientes"
        subtitle="Gerencie os contatos e as informações dos seus clientes."
        buttonLabel="Novo Cliente"
        buttonIcon={<FiPlus size={20} />}
        onButtonClick={() => { setEditingId(null); setFormData({ nome: '', telefone: '', instagram: '', observacoes: '' }); setIsModalOpen(true); }}
      />
      <DataTable
        title="Lista de clientes"
        description="Seus contatos organizados em um só lugar."
        columns={columns}
        rows={clientesFiltrados}
        getRowKey={cliente => cliente._id}
        loading={loading}
        error={error}
        onRetry={fetchClientes}
        search={{
          value: filtroValor,
          onChange: setFiltroValor,
          label: `Pesquisar clientes por ${filtroCampo}`,
          placeholder: `Buscar por ${filtroCampo}...`,
        }}
        filters={[
          { label: 'Campo de pesquisa', value: filtroCampo, onChange: value => { setFiltroCampo(value); setFiltroValor(''); }, options: [
            { value: 'nome', label: 'Nome' },
            { value: 'telefone', label: 'Telefone' },
            { value: 'instagram', label: 'Instagram' },
          ] },
          { label: 'Ordenar clientes', value: ordenacao, onChange: setOrdenacao, options: [
            { value: 'az', label: 'Nome: A–Z' },
            { value: 'za', label: 'Nome: Z–A' },
          ] },
        ]}
        emptyMessage={clientes.length === 0 ? 'Nenhum cliente cadastrado.' : 'Nenhum cliente encontrado.'}
        emptyDescription={clientes.length === 0 ? 'Adicione seu primeiro cliente no botão Novo Cliente.' : 'Tente outro termo ou altere o campo de pesquisa.'}
      />

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingId ? "Editar Cliente" : "Novo Cliente"}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nome *</label>
            <input className="form-input" required value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">Telefone (WhatsApp)</label>
            <input className="form-input" value={formData.telefone} onChange={e => setFormData({...formData, telefone: e.target.value})} placeholder="Ex: 11999999999" />
          </div>
          <div className="form-group">
            <label className="form-label">Instagram</label>
            <input className="form-input" value={formData.instagram} onChange={e => setFormData({...formData, instagram: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">Observações</label>
            <textarea className="form-input" value={formData.observacoes} onChange={e => setFormData({...formData, observacoes: e.target.value})} rows="3"></textarea>
          </div>
          <Button type="submit" fullWidth className="mt-4">Salvar Cliente</Button>
        </form>
      </Modal>
    </div>
  );
};

export default Customers;
