import { FiEye, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import FilamentForm from './FilamentForm';
import { pricePerKg, costPerGram } from './filamentValues';
import Button from '../../components/Button';
import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import { TbCylinderPlus } from 'react-icons/tb';
import api from '../../services/api';
import Modal from '../../components/Modal';
import { DeleteDetailsDialog } from '../../components/details/Details';

const Filaments = () => {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [filamentos, setFilamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFilament, setEditingFilament] = useState(null);
  const [deletingFilament, setDeletingFilament] = useState(null);
  const [filtroCampo, setFiltroCampo] = useState('nome');
  const [filtroValor, setFiltroValor] = useState('');
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

  const handleSubmit = async (payload) => {
    setSaving(true);
    setSaveError('');
    try {
      if (editingFilament) {
        await api.put(`/filamentos/${editingFilament._id || editingFilament.id}`, payload);
      } else {
        await api.post('/filamentos', payload);
      }
      setIsModalOpen(false);
      setEditingFilament(null);
      await fetchFilamentos();
    } catch (err) {
      setSaveError(err.response?.data?.message || 'Não foi possível salvar a bobina.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    setSaveError('');
    try {
      await api.delete(`/filamentos/${deletingFilament._id || deletingFilament.id}`);
      setDeletingFilament(null);
      await fetchFilamentos();
    } catch (err) {
      setSaveError(err.response?.data?.message || 'Falha ao excluir a bobina.');
    } finally { setSaving(false); }
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
        onButtonClick={() => { setSaveError(''); setEditingFilament(null); setIsModalOpen(true); }}
      />
      <DataTable
        title="Lista de filamentos"
        description="Suas bobinas, materiais e estoque em um só lugar."
        columns={[
          { key: 'nome', label: 'Nome da Cor', className: 'font-semibold whitespace-nowrap' },
          { key: 'peso_total_g', label: 'Peso Original (g)', render: f => `${f.peso_total_g}g` },
          { key: 'estoque_gramas', label: 'Estoque Atual (g)', render: f => <span className={`font-semibold ${(f.estoque_gramas ?? f.peso_total_g) < 200 ? 'text-danger' : 'text-text-primary'}`}>{f.estoque_gramas ?? f.peso_total_g}g</span> },
          { key: 'temperatura_bico', label: 'Temp. Bico (°C)', render: f => f.temperatura_bico ? `${f.temperatura_bico}°C` : '-' },
          { key: 'temperatura_mesa', label: 'Temp. Mesa (°C)', render: f => f.temperatura_mesa ? `${f.temperatura_mesa}°C` : '-' },
          { key: 'preco_kg', label: 'Preço/kg', className: 'whitespace-nowrap', render: f => pricePerKg(f) == null ? 'Não informado' : formatCurrency(pricePerKg(f)) },
          { key: 'custo_por_grama', label: 'Custo/g', className: 'font-semibold text-success whitespace-nowrap', render: f => costPerGram(f) == null ? 'Não informado' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 4 }).format(costPerGram(f)) },
          { key: 'acoes', label: 'Ações', className: 'w-1 whitespace-nowrap', render: f => (
            <div className="flex items-center gap-1.5">
              <Button type="button" variant="outline" size="icon-sm" disabled={saving} title="Ver detalhes" onClick={() => navigate(`/filamentos/${f._id || f.id}`)} aria-label={`Detalhes de ${f.nome}`}><FiEye size={17} aria-hidden="true" /></Button>
              <Button type="button" variant="outline" size="icon-sm" disabled={saving} title="Editar bobina" onClick={() => { setSaveError(''); setEditingFilament(f); setIsModalOpen(true); }} aria-label={`Editar ${f.nome}`}><FiEdit2 size={16} aria-hidden="true" /></Button>
              <Button type="button" variant="danger-ghost" size="icon-sm" disabled={saving} title="Excluir bobina" onClick={() => { setSaveError(''); setDeletingFilament(f); }} aria-label={`Excluir ${f.nome}`}><FiTrash2 size={16} aria-hidden="true" /></Button>
            </div>
          ) },
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

      <Modal isOpen={isModalOpen} onClose={() => { if (!saving) setIsModalOpen(false); }} title={editingFilament ? "Editar Bobina" : "Nova Bobina"}>
        {saveError && <p role="alert" className="mb-4 text-danger">{saveError}</p>}
        {isModalOpen && <FilamentForm initial={editingFilament || {}} onSubmit={handleSubmit} saving={saving} />}
      </Modal>
      <DeleteDetailsDialog
        isOpen={Boolean(deletingFilament)}
        title="Excluir bobina"
        busy={saving}
        error={saveError}
        onCancel={() => { setDeletingFilament(null); setSaveError(''); }}
        onConfirm={handleDelete}
      >
        Deseja excluir a bobina <strong>{deletingFilament?.nome}</strong>?
      </DeleteDetailsDialog>
    </div>
  );
};

export default Filaments;
