import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import api from '../services/api';
import Modal from '../components/Modal';

const Filamentos = () => {
  const [filamentos, setFilamentos] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ 
    nome: '', marca: '', tipo_polimero: 'PLA', cor: '', peso_total_g: 1000, preco_pago: 100, temperatura_bico: '', temperatura_mesa: ''
  });

  useEffect(() => {
    fetchFilamentos();
  }, []);

  const fetchFilamentos = async () => {
    const res = await api.get('/filamentos');
    setFilamentos(res.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post('/filamentos', formData);
    setIsModalOpen(false);
    setFormData({ nome: '', marca: '', tipo_polimero: 'PLA', cor: '', peso_total_g: 1000, preco_pago: 100, temperatura_bico: '', temperatura_mesa: '' });
    fetchFilamentos();
  };

  const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: '2rem' }}>
        <h1>Estoque de Filamentos</h1>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={20} /> Adicionar Bobina
        </button>
      </div>

      <div className="glass-card table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nome da Cor</th>
              <th>Material</th>
              <th>Peso Original (g)</th>
              <th>Estoque Atual (g)</th>
              <th>Temp. Bico (°C)</th>
              <th>Temp. Mesa (°C)</th>
              <th>Preço Pago</th>
              <th>Custo/g</th>
            </tr>
          </thead>
          <tbody>
            {filamentos.map(f => (
              <tr key={f._id}>
                <td style={{ fontWeight: '500' }}>{f.nome}</td>
                <td><span style={{ padding: '0.2rem 0.5rem', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', fontSize: '0.8rem' }}>{f.tipo_polimero}</span></td>
                <td>{f.peso_total_g}g</td>
                <td style={{ fontWeight: '600', color: (f.estoque_gramas != null ? f.estoque_gramas : f.peso_total_g) < 200 ? 'var(--danger)' : 'inherit' }}>
                  {f.estoque_gramas != null ? f.estoque_gramas : f.peso_total_g}g
                </td>
                <td>{f.temperatura_bico ? `${f.temperatura_bico}°C` : '-'}</td>
                <td>{f.temperatura_mesa ? `${f.temperatura_mesa}°C` : '-'}</td>
                <td>{formatCurrency(f.preco_pago)}</td>
                <td className="text-success" style={{ fontWeight: '600' }}>{formatCurrency(f.custo_por_grama)}</td>
              </tr>
            ))}
            {filamentos.length === 0 && (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Nenhum filamento cadastrado.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nova Bobina">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nome / Cor *</label>
            <input className="form-input" required value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} placeholder="Ex: PLA Branco Pérola Silk" />
          </div>
          <div className="grid-cols-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="form-group">
              <label className="form-label">Material *</label>
              <select className="form-select" value={formData.tipo_polimero} onChange={e => setFormData({...formData, tipo_polimero: e.target.value})}>
                <option value="PLA">PLA</option>
                <option value="PETG">PETG</option>
                <option value="ABS">ABS</option>
                <option value="TPU">TPU</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Marca</label>
              <input className="form-input" value={formData.marca} onChange={e => setFormData({...formData, marca: e.target.value})} />
            </div>
          </div>
          <div className="grid-cols-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="form-group">
              <label className="form-label">Peso Total (g) *</label>
              <input type="number" className="form-input" required value={formData.peso_total_g} onChange={e => setFormData({...formData, peso_total_g: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Preço Pago (R$) *</label>
              <input type="number" step="0.01" className="form-input" required value={formData.preco_pago} onChange={e => setFormData({...formData, preco_pago: e.target.value})} />
            </div>
          </div>
          <div className="grid-cols-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="form-group">
              <label className="form-label">Temp. Bico (°C)</label>
              <input type="number" className="form-input" value={formData.temperatura_bico} onChange={e => setFormData({...formData, temperatura_bico: e.target.value})} placeholder="Ex: 200" />
            </div>
            <div className="form-group">
              <label className="form-label">Temp. Mesa (°C)</label>
              <input type="number" className="form-input" value={formData.temperatura_mesa} onChange={e => setFormData({...formData, temperatura_mesa: e.target.value})} placeholder="Ex: 60" />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>Salvar Bobina</button>
        </form>
      </Modal>
    </div>
  );
};

export default Filamentos;
