import Button from './Button';
import { useId, useState } from 'react';
import { FiSearch, FiX, FiUsers } from 'react-icons/fi';
import Pagination from './Pagination';

const PAGE_SIZE = 15;

function DataTable({ title, description, columns, rows, getRowKey, search, filters = [], emptyMessage, emptyDescription, loading = false, loadingMessage = 'Carregando registros...', emptyIcon: EmptyIcon = FiUsers, error, onRetry }) {
  const titleId = useId();
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  if (page !== currentPage) setPage(currentPage);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const visibleRows = rows.slice(startIndex, startIndex + PAGE_SIZE);

  function handleSearch(value) {
    setPage(1);
    search.onChange(value);
  }

  return (
    <section aria-labelledby={titleId} className="modern-table overflow-hidden rounded-md border border-border bg-surface">
      <header className="table-toolbar flex flex-wrap items-center justify-between gap-4 px-5 py-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 id={titleId} className="mb-0 text-base font-semibold">{title}</h2>
          </div>
          {description && <p className="mt-1 text-xs text-text-secondary">{description}</p>}
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto">
          {search && (
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded border border-border bg-surface px-3 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/15 lg:w-64 lg:flex-none">
              <FiSearch size={16} aria-hidden="true" className="shrink-0 text-text-disabled" />
              <input type={search.type || 'search'} aria-label={search.label || 'Pesquisar registros'} placeholder={search.placeholder || 'Pesquisar...'} value={search.value} onChange={event => handleSearch(event.target.value)} className="min-w-0 w-full bg-transparent py-2.5 text-xs text-text-primary outline-none placeholder:text-text-disabled [&::-webkit-search-cancel-button]:appearance-none" />
              {search.value && <Button type="button" aria-label="Limpar pesquisa" onClick={() => handleSearch('')} variant="ghost" size="icon-sm" className="shrink-0"><FiX size={14} /></Button>}
            </div>
          )}
          {filters.map(filter => (
            <select key={filter.label} aria-label={filter.label} value={filter.value} onChange={event => { setPage(1); filter.onChange(event.target.value); }} className="max-w-full cursor-pointer rounded border border-border bg-surface px-3 py-2.5 text-xs text-text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand/15">
              {filter.options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          ))}
        </div>
      </header>
      <div className="table-scroll overflow-x-auto" aria-busy={loading} tabIndex={0} role="region" aria-labelledby={titleId}>
        <table className="w-full border-collapse text-left text-xs" aria-labelledby={titleId}>
          <thead className="border-y border-border bg-background/45">
            <tr>{columns.map(column => <th key={column.key} scope="col" className={`whitespace-nowrap px-5 py-3 text-[10px] font-semibold tracking-wider text-text-secondary uppercase ${column.className || ''}`}>{column.label}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-border/70">
            {!loading && !error && visibleRows.map(row => (
              <tr key={getRowKey(row)} className="transition-colors hover:bg-surface-hover/70">
                {columns.map(column => <td key={column.key} className={`px-5 py-3.5 ${column.className || ''}`}>{column.render ? column.render(row) : row[column.key]}</td>)}
              </tr>
            ))}
            {(loading || error || rows.length === 0) && (
              <tr><td colSpan={columns.length} className="px-5 py-12 text-center">
                <span aria-hidden="true" className="mx-auto mb-3 flex size-11 items-center justify-center rounded-xl bg-surface-hover text-text-disabled"><EmptyIcon size={22} /></span>
                <p role="status" className="font-medium text-text-primary">{loading ? loadingMessage : error || emptyMessage || 'Nenhum registro encontrado.'}</p>
                {!loading && !error && emptyDescription && <p className="mt-1 text-xs text-text-secondary">{emptyDescription}</p>}
                {error && onRetry && <Button type="button" onClick={onRetry} variant="outline" className="mt-4">Tentar novamente</Button>}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
      <footer className="table-footer flex flex-wrap items-center justify-between gap-3 border-t border-border bg-background/20 px-5 py-3 text-[11px] text-text-secondary">
        <span>{loading ? 'Buscando registros...' : error ? 'Não foi possível carregar os registros.' : rows.length > PAGE_SIZE ? `Exibindo ${startIndex + 1}–${startIndex + visibleRows.length} de ${rows.length} registros` : `${rows.length} ${rows.length === 1 ? 'registro exibido' : 'registros exibidos'}`}</span>
        {!loading && !error && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setPage} />}
      </footer>
    </section>
  );
}

export default DataTable;
