import Input from '../../components/Input';
import Select from '../../components/Select';
import Button from '../../components/Button';
import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import { TbCylinderPlus } from 'react-icons/tb';
import api from '../../services/api';
import Modal from '../../components/Modal';

const Filaments = () => {
  const [filamentos, setFilamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filtroCampo, setFiltroCampo] = useState('nome');
  const [filtroValor, setFiltroValor] = useState('');
  const [formData, setFormData] = useState({ 
    nome: '', marca: '', tipo_polimero: 'PLA', cor: '', peso_total_g: 1000, preco_pago: 100, temperatura_bico: '', temperatura_mesa: ''
  });

  useEffect(() => {
    fetchFilamentos();
  }, []);

  async function fetchFilamentos() {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/filamentos');
      setFilamentos(res.data);
    } catch {
      setError('Não foi possível carregar os filamentos.');
    } finally {
      setLoading(false);
    }
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
      <PageHeader
        title="Estoque de Filamentos"
        subtitle="Controle suas bobinas e os materiais disponíveis para impressão."
        buttonLabel="Adicionar Bobina"
        buttonIcon={<TbCylinderPlus size={20} />}
        onButtonClick={() => setIsModalOpen(true)}
      />
      <DataTable
        title="Lista de filamentos"
        description="Suas bobinas, materiais e estoque em um só lugar."
        columns={[
          { key: 'nome', label: 'Nome da Cor', className: 'font-semibold whitespace-nowrap' },
          { key: 'tipo_polimero', label: 'Material', render: f => <span className="rounded-lg bg-surface-hover px-2.5 py-1 font-medium">{f.tipo_polimero}</span> },
          { key: 'peso_total_g', label: 'Peso Original (g)', render: f => `${f.peso_total_g}g` },
          { key: 'estoque_gramas', label: 'Estoque Atual (g)', render: f => <span className={`font-semibold ${(f.estoque_gramas ?? f.peso_total_g) < 200 ? 'text-danger' : 'text-text-primary'}`}>{f.estoque_gramas ?? f.peso_total_g}g</span> },
          { key: 'temperatura_bico', label: 'Temp. Bico (°C)', render: f => f.temperatura_bico ? `${f.temperatura_bico}°C` : '-' },
          { key: 'temperatura_mesa', label: 'Temp. Mesa (°C)', render: f => f.temperatura_mesa ? `${f.temperatura_mesa}°C` : '-' },
          { key: 'preco_pago', label: 'Preço Pago', className: 'whitespace-nowrap', render: f => formatCurrency(f.preco_pago) },
          { key: 'custo_por_grama', label: 'Custo/g', className: 'font-semibold text-success whitespace-nowrap', render: f => formatCurrency(f.custo_por_grama) },
        ]}
        rows={filamentosFiltrados}
        getRowKey={f => f._id}
        loading={loading}
        loadingMessage="Carregando filamentos..."
        emptyIcon={TbCylinderPlus}
        error={error}
        onRetry={fetchFilamentos}
        search={{ value: filtroValor, onChange: setFiltroValor, label: `Pesquisar filamentos por ${filtroCampo}`, placeholder: `Buscar por ${filtroCampo === 'nome' ? 'nome' : 'material'}...` }}
        filters={[{ label: 'Campo de pesquisa', value: filtroCampo, onChange: value => { setFiltroCampo(value); setFiltroValor(''); }, options: [
          { value: 'nome', label: 'Nome do Filamento' },
          { value: 'material', label: 'Material' },
        ] }]}
        emptyMessage={filamentos.length === 0 ? 'Nenhum filamento cadastrado.' : 'Nenhum filamento encontrado.'}
        emptyDescription={filamentos.length === 0 ? 'Adicione sua primeira bobina no botão Adicionar Bobina.' : 'Tente outro termo ou altere o campo de pesquisa.'}
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nova Bobina">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="filaments-field-1" className="form-label">Nome / Cor *</label>
            <Input id="filaments-field-1" required value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} placeholder="Ex: PLA Branco Pérola Silk" />
          </div>
          <div className="responsive-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="form-group">
              <label htmlFor="filaments-field-2" className="form-label">Material *</label>
              <Select id="filaments-field-2" value={formData.tipo_polimero} onChange={e => setFormData({...formData, tipo_polimero: e.target.value})}>
                <option value="PLA">PLA</option>
                <option value="PETG">PETG</option>
                <option value="ABS">ABS</option>
                <option value="TPU">TPU</option>
              </Select>
            </div>
            <div className="form-group">
              <label htmlFor="filaments-field-3" className="form-label">Marca</label>
              <Input id="filaments-field-3" value={formData.marca} onChange={e => setFormData({...formData, marca: e.target.value})} />
            </div>
          </div>
          <div className="responsive-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="form-group">
              <label htmlFor="filaments-field-4" className="form-label">Peso Total (g) *</label>
              <Input id="filaments-field-4" type="number" required value={formData.peso_total_g} onChange={e => setFormData({...formData, peso_total_g: e.target.value})} />
            </div>
            <div className="form-group">
              <label htmlFor="filaments-field-5" className="form-label">Preço Pago (R$) *</label>
              <Input id="filaments-field-5" type="number" step="0.01" required value={formData.preco_pago} onChange={e => setFormData({...formData, preco_pago: e.target.value})} />
            </div>
          </div>
          <div className="responsive-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="form-group">
              <label htmlFor="filaments-field-6" className="form-label">Temp. Bico (°C)</label>
              <Input id="filaments-field-6" type="number" value={formData.temperatura_bico} onChange={e => setFormData({...formData, temperatura_bico: e.target.value})} placeholder="Ex: 200" />
            </div>
            <div className="form-group">
              <label htmlFor="filaments-field-7" className="form-label">Temp. Mesa (°C)</label>
              <Input id="filaments-field-7" type="number" value={formData.temperatura_mesa} onChange={e => setFormData({...formData, temperatura_mesa: e.target.value})} placeholder="Ex: 60" />
            </div>
          </div>
          <Button type="submit" fullWidth className="mt-4">Salvar Bobina</Button>
        </form>
      </Modal>
    </div>
  );
};

export default Filaments;
