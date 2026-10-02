import React, { useState, useEffect } from 'react';
import { FiSearch } from 'react-icons/fi';
import { TbCylinderPlus } from 'react-icons/tb';
import api from '../../services/api';
import Modal from '../../components/Modal';

const Filaments = () => {
  const [filamentos, setFilamentos] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filtroCampo, setFiltroCampo] = useState('nome');
  const [filtroValor, setFiltroValor] = useState('');
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

  const filamentosFiltrados = filamentos.filter(f => {
    if (!filtroValor) return true;

    if (filtroCampo === 'nome') {
      return f.nome?.toLowerCase().includes(filtroValor.toLowerCase());
    }
    if (filtroCampo === 'material') {
      return f.tipo_polimero?.toLowerCase().includes(filtroValor.toLowerCase());
    }
    return true;
  });

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: '2rem', gap: '1rem', flexWrap: 'wrap' }}>
        <h1>Estoque de Filamentos</h1>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'var(--bg-card)', padding: '0.3rem', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
            <FiSearch size={16} style={{ color: 'var(--text-muted)', marginLeft: '0.5rem' }} />
            <select
              className="form-select"
              style={{ border: 'none', background: 'var(--surface-hover)', fontWeight: '500', width: 'auto', paddingLeft: '0.2rem', paddingRight: '1.5rem' }}
              value={filtroCampo}
              onChange={(e) => { setFiltroCampo(e.target.value); setFiltroValor(''); }}
            >
              <option value="nome">Nome do Filamento</option>
              <option value="material">Material</option>
            </select>

            <div style={{ width: '1px', height: '24px', background: 'var(--border-light)' }}></div>

            <input
              type="text"
              className="form-input"
              placeholder={`Buscar por ${filtroCampo === 'nome' ? 'nome' : 'material'}...`}
              style={{ border: 'none', background: 'transparent', boxShadow: 'none', minWidth: '200px' }}
              value={filtroValor}
              onChange={(e) => setFiltroValor(e.target.value)}
            />
          </div>

          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <TbCylinderPlus size={20} /> Adicionar Bobina
          </button>
        </div>
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
            {filamentosFiltrados.map(f => (
              <tr key={f._id}>
                <td style={{ fontWeight: '500' }}>{f.nome}</td>
                <td><span style={{ padding: '0.2rem 0.5rem', background: 'var(--surface-hover)', borderRadius: '4px', fontSize: '0.8rem' }}>{f.tipo_polimero}</span></td>
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
            {filamentosFiltrados.length === 0 && (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                  {filamentos.length === 0 ? 'Nenhum filamento cadastrado.' : 'Nenhum filamento encontrado.'}
                </td>
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
          <div className="responsive-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
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
          <div className="responsive-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="form-group">
              <label className="form-label">Peso Total (g) *</label>
              <input type="number" className="form-input" required value={formData.peso_total_g} onChange={e => setFormData({...formData, peso_total_g: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Preço Pago (R$) *</label>
              <input type="number" step="0.01" className="form-input" required value={formData.preco_pago} onChange={e => setFormData({...formData, preco_pago: e.target.value})} />
            </div>
          </div>
          <div className="responsive-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
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

export default Filaments;
