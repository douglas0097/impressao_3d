import { FiArrowLeft, FiEdit2, FiTrash2, FiCheckCircle, FiAlertCircle, FiX } from 'react-icons/fi';
import PageHeader from '../PageHeader';
import Button from '../Button';
import Modal from '../Modal';

export function DetailsPage({ title, subtitle, onBack, busy, loading, loadingMessage, error, notice, onRetry, children }) {
  return <div className="space-y-6">
    <PageHeader title={title} subtitle={subtitle} buttonLabel="Voltar à tabela" buttonIcon={<FiArrowLeft size={17} />} onButtonClick={onBack} buttonDisabled={busy} />
    {loading && <div role="status" className="flex items-center gap-3 rounded-xl border border-border bg-surface p-8 text-text-secondary">{loadingMessage}</div>}
    {error && <div role="alert" className="flex items-center gap-2 rounded-xl border border-danger/25 bg-danger/5 p-4 text-sm text-danger"><FiAlertCircle aria-hidden="true" />{error}</div>}
    {notice && <div role="status" className="flex items-center gap-2 rounded-xl border border-success/25 bg-success/5 p-4 text-sm text-success"><FiCheckCircle aria-hidden="true" />{notice}</div>}
    {!loading && onRetry && <Button onClick={onRetry}>Tentar novamente</Button>}
    {children}
  </div>;
}

export function DetailsCard({ title, subtitle, editing, editLabel = 'Editar', busy, onEdit, onDelete, children }) {
  return <article className="overflow-hidden rounded-xl border border-border bg-surface">
    <header className="flex flex-col justify-between gap-4 px-5 py-5 sm:flex-row sm:items-center sm:px-6">
      <div className="min-w-0">
        <h2 className="mb-0 break-words text-lg font-semibold">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-text-secondary">{subtitle}</p>}
      </div>
      {(onEdit || onDelete) && <div className="flex shrink-0 flex-wrap gap-2">
        {onEdit && <Button variant="outline" disabled={busy} onClick={onEdit}>{editing ? <FiX size={16} /> : <FiEdit2 size={16} />}{editing ? 'Cancelar edição' : editLabel}</Button>}
        {onDelete && <Button variant="danger-ghost" disabled={busy} onClick={onDelete}><FiTrash2 size={16} />Excluir</Button>}
      </div>}
    </header>
    {children}
  </article>;
}

export function DetailSection({ title, children }) {
  return <section className="border-t border-border/70 px-5 py-5 sm:px-6">
    <h3 className="mb-4 text-sm font-semibold">{title}</h3>
    {children}
  </section>;
}

export function DetailGrid({ children }) {
  return <dl className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">{children}</dl>;
}

export function DetailValue({ label, value }) {
  return <div className="min-w-0"><dt className="text-xs text-text-secondary">{label}</dt><dd className="mt-1.5 break-words text-sm font-semibold text-text-primary">{value ?? 'Não informado'}</dd></div>;
}

export function DetailsFooter({ createdAt, updatedAt }) {
  const date = value => value && !Number.isNaN(Date.parse(value)) ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(new Date(value)) : 'Não informado';
  return <footer className="flex flex-wrap gap-x-6 gap-y-2 border-t border-border/70 bg-background/20 px-5 py-4 text-xs text-text-secondary sm:px-6">
    <span>Cadastrado em {date(createdAt)}</span>
    <span>Atualizado em {date(updatedAt)}</span>
  </footer>;
}

export function DeleteDetailsDialog({ isOpen, title, children, busy, error, onCancel, onConfirm }) {
  return <Modal isOpen={isOpen} onClose={() => { if (!busy) onCancel(); }} title={title}>
    <p>{children}</p><p className="mt-2 text-sm text-text-secondary">Esta ação não pode ser desfeita.</p>
    {error && <p role="alert" className="mt-4 text-danger">{error}</p>}
    <div className="mt-6 flex flex-wrap justify-end gap-3">
      <Button variant="outline" disabled={busy} onClick={onCancel}>Cancelar</Button>
      <Button variant="danger" loading={busy} onClick={onConfirm}><FiTrash2 size={16} />Confirmar exclusão</Button>
    </div>
  </Modal>;
}
