import React, { useState, useEffect } from 'react';
import { Plus, MessageCircle, Edit, Trash2 } from 'lucide-react';
import api from '../services/api';
import Modal from '../components/Modal';

const Clientes = () => {
  const [clientes, setClientes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ nome: '', telefone: '', instagram: '', observacoes: '' });

  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    const res = await api.get('/clientes');
    setClientes(res.data);
  };

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

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: '2rem' }}>
        <h1>Clientes</h1>
        <button className="btn btn-primary" onClick={() => { setEditingId(null); setFormData({ nome: '', telefone: '', instagram: '', observacoes: '' }); setIsModalOpen(true); }}>
          <Plus size={20} /> Novo Cliente
        </button>
      </div>

      <div className="glass-card table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Telefone</th>
              <th>Instagram</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {clientes.map(c => (
              <tr key={c._id}>
                <td style={{ fontWeight: '500' }}>{c.nome}</td>
                <td>{c.telefone}</td>
                <td>{c.instagram}</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-success" onClick={() => openWhatsApp(c.telefone)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} title="WhatsApp">
                      <MessageCircle size={16} /> WhatsApp
                    </button>
                    <button className="btn btn-outline" onClick={() => handleEdit(c)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} title="Editar">
                      <Edit size={16} />
                    </button>
                    <button className="btn" onClick={() => handleDelete(c._id)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', backgroundColor: 'var(--danger)', color: 'white' }} title="Excluir">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {clientes.length === 0 && (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Nenhum cliente cadastrado.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>Salvar Cliente</button>
        </form>
      </Modal>
    </div>
  );
};

export default Clientes;
