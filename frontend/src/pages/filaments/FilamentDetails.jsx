import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import api from '../../services/api';
import FilamentForm from './FilamentForm';
import { pricePerKg, costPerGram } from './filamentValues';
import { FiArrowLeft, FiEdit2, FiTrash2, FiCheckCircle, FiAlertCircle, FiX } from 'react-icons/fi';

function DetailSection({ title, children }) {
  return <section className="border-t border-border/70 px-5 py-5 sm:px-6">
    <h3 className="mb-4 text-sm font-semibold">{title}</h3>
    {children}
  </section>;
}
function DetailValue({ label, value }) {
  return <div className="min-w-0"><dt className="text-xs text-text-secondary">{label}</dt><dd className="mt-1.5 break-words text-sm font-semibold text-text-primary">{value ?? 'Não informado'}</dd></div>;
}

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
  const date = value => value && !Number.isNaN(Date.parse(value)) ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(new Date(value)) : 'Não informado';

  return <div className="space-y-6">
    <PageHeader title="Detalhes do filamento" subtitle="Informações da bobina, estoque e parâmetros de impressão." buttonLabel="Voltar à tabela" buttonIcon={<FiArrowLeft size={17} />} onButtonClick={() => navigate('/filamentos')} buttonDisabled={busy} />
    {loading && <div role="status" className="flex items-center gap-3 rounded-xl border border-border bg-surface p-8 text-text-secondary">Carregando filamento...</div>}
    {error && !deleting && <div role="alert" className="flex items-center gap-2 rounded-xl border border-danger/25 bg-danger/5 p-4 text-sm text-danger"><FiAlertCircle aria-hidden="true" />{error}</div>}
    {notice && <div role="status" className="flex items-center gap-2 rounded-xl border border-success/25 bg-success/5 p-4 text-sm text-success"><FiCheckCircle aria-hidden="true" />{notice}</div>}
    {!loading && !filament && <Button onClick={() => setReload(value => value + 1)}>Tentar novamente</Button>}
    {!loading && filament && <article className="overflow-hidden rounded-xl border border-border bg-surface">
      <header className="flex flex-col justify-between gap-4 px-5 py-5 sm:flex-row sm:items-center sm:px-6">
        <div className="min-w-0">
          <h2 className="mb-0 break-words text-lg font-semibold">{filament.nome}</h2>
          <p className="mt-1 text-sm text-text-secondary">{filament.tipo_polimero}{filament.marca ? ` · ${filament.marca}` : ''}</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button variant="outline" disabled={busy} onClick={() => { setEditing(!editing); setError(''); setNotice(''); }}>{editing ? <FiX size={16} /> : <FiEdit2 size={16} />}{editing ? 'Cancelar edição' : 'Editar bobina'}</Button>
          <Button variant="danger-ghost" disabled={busy} onClick={() => { setDeleting(true); setError(''); }}><FiTrash2 size={16} />Excluir</Button>
        </div>
      </header>
      {editing ? <DetailSection title="Editar informações">
        <div className="w-full"><FilamentForm key={id} initial={filament} onSubmit={save} saving={busy} /></div>
      </DetailSection> : <>
        <DetailSection title="Informações do material">
          <dl className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
            <DetailValue label="Nome" value={filament.nome} />
            <DetailValue label="Material" value={filament.tipo_polimero} />
            <DetailValue label="Marca" value={filament.marca || 'Não informada'} />
            <DetailValue label="Cor / acabamento" value={filament.cor || 'Não informado'} />
          </dl>
        </DetailSection>
        <DetailSection title="Estoque e custos">
          <dl className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
            <DetailValue label="Peso original" value={grams(originalWeight)} />
            <DetailValue label="Estoque atual" value={grams(stock)} />
            <DetailValue label="Preço por kg" value={money(pricePerKg(filament))} />
            <DetailValue label="Custo por grama" value={money(costPerGram(filament), 5)} />
          </dl>
        </DetailSection>
        <DetailSection title="Parâmetros de impressão">
          <dl className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
            <DetailValue label="Temperatura do bico" value={filament.temperatura_bico != null ? `${filament.temperatura_bico} °C` : 'Não informada'} />
            <DetailValue label="Temperatura da mesa" value={filament.temperatura_mesa != null ? `${filament.temperatura_mesa} °C` : 'Não informada'} />
          </dl>
        </DetailSection>
        <footer className="flex flex-wrap gap-x-6 gap-y-2 border-t border-border/70 bg-background/20 px-5 py-4 text-xs text-text-secondary sm:px-6">
          <span>Cadastrado em {date(filament.createdAt)}</span>
          <span>Atualizado em {date(filament.updatedAt)}</span>
        </footer>
      </>}
    </article>}
    <Modal isOpen={deleting} onClose={() => { if (!busy) setDeleting(false); }} title="Excluir bobina">
      <p>Deseja excluir a bobina <strong>“{filament?.nome}”</strong>?</p><p className="mt-2 text-sm text-text-secondary">Esta ação não pode ser desfeita.</p>
      {error && <p role="alert" className="mt-4 text-danger">{error}</p>}
      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <Button variant="outline" disabled={busy} onClick={() => setDeleting(false)}>Cancelar</Button>
        <Button variant="danger" loading={busy} onClick={remove}><FiTrash2 size={16} />Confirmar exclusão</Button>
      </div>
    </Modal>
  </div>;
}
