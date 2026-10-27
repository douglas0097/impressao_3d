import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DetailsPage, DetailsCard, DetailSection, DetailGrid, DetailValue, DetailsFooter, DeleteDetailsDialog } from '../../components/details/Details';
import api from '../../services/api';
import FilamentForm from './FilamentForm';
import { pricePerKg, costPerGram } from './filamentValues';
const money = (value, digits = 2) => value == null ? 'Não informado' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: digits }).format(value);

export default function FilamentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [filament, setFilament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    setFilament(null);
    setEditing(false);
    setDeleting(false);
    api.get('/filamentos').then(({ data }) => {
      if (active) {
        const record = data.find(f => (f._id || f.id) === id);
        setFilament(record || null);
        if (!record) setError('Filamento não encontrado.');
      }
    }).catch(() => { if (active) setError('Não foi possível carregar o filamento.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, reload]);

  async function save(payload) {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const { data } = await api.put(`/filamentos/${id}`, payload);
      if (!data) throw new Error('Filamento não encontrado.');
      setFilament(data);
      setEditing(false);
      setNotice('Bobina atualizada com sucesso.');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Não foi possível salvar a bobina.');
    } finally { setBusy(false); }
  }

  async function remove() {
    setBusy(true);
    setError('');
    try {
      await api.delete(`/filamentos/${id}`);
      navigate('/filamentos', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Não foi possível excluir a bobina.');
    } finally { setBusy(false); }
  }

  const stock = filament?.estoque_gramas ?? filament?.peso_total_g ?? 0;
  const originalWeight = filament?.peso_total_g ?? 0;
  const grams = value => `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(value)} g`;
  return <DetailsPage
    title="Detalhes do filamento"
    subtitle="Informações da bobina, estoque e parâmetros de impressão."
    onBack={() => navigate('/filamentos')}
    busy={busy} loading={loading} loadingMessage="Carregando filamento..."
    error={!deleting ? error : ''} notice={notice}
    onRetry={!loading && !filament ? () => setReload(value => value + 1) : undefined}
  >
    {!loading && filament && <DetailsCard
      title={filament.nome}
      subtitle={`${filament.tipo_polimero}${filament.marca ? ` · ${filament.marca}` : ''}`}
      editing={editing} editLabel="Editar bobina" busy={busy}
      onEdit={() => { setEditing(!editing); setError(''); setNotice(''); }}
      onDelete={() => { setDeleting(true); setError(''); }}
    >
      {editing ? <DetailSection title="Editar informações">
        <div className="w-full"><FilamentForm key={id} initial={filament} onSubmit={save} saving={busy} /></div>
      </DetailSection> : <>
        <DetailSection title="Informações do material">
          <DetailGrid>
            <DetailValue label="Nome" value={filament.nome} />
            <DetailValue label="Material" value={filament.tipo_polimero} />
            <DetailValue label="Marca" value={filament.marca || 'Não informada'} />
            <DetailValue label="Cor / acabamento" value={filament.cor || 'Não informado'} />
          </DetailGrid>
        </DetailSection>
        <DetailSection title="Estoque e custos">
          <DetailGrid>
            <DetailValue label="Peso original" value={grams(originalWeight)} />
            <DetailValue label="Estoque atual" value={grams(stock)} />
            <DetailValue label="Preço por kg" value={money(pricePerKg(filament))} />
            <DetailValue label="Custo por grama" value={money(costPerGram(filament), 5)} />
          </DetailGrid>
        </DetailSection>
        <DetailSection title="Parâmetros de impressão">
          <DetailGrid>
            <DetailValue label="Temperatura do bico" value={filament.temperatura_bico != null ? `${filament.temperatura_bico} °C` : 'Não informada'} />
            <DetailValue label="Temperatura da mesa" value={filament.temperatura_mesa != null ? `${filament.temperatura_mesa} °C` : 'Não informada'} />
          </DetailGrid>
        </DetailSection>
        <DetailsFooter createdAt={filament.createdAt} updatedAt={filament.updatedAt} />
      </>}
    </DetailsCard>}
    <DeleteDetailsDialog isOpen={deleting} title="Excluir bobina" busy={busy} error={error} onCancel={() => setDeleting(false)} onConfirm={remove}>
      Deseja excluir a bobina <strong>“{filament?.nome}”</strong>?
    </DeleteDetailsDialog>
  </DetailsPage>;
}
