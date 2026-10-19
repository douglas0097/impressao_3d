import Button from './Button';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;


  return (
    <nav aria-label="Paginação da tabela" className="flex items-center gap-3">
      <Button type="button" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} variant="outline" size="sm">
        <FiChevronLeft aria-hidden="true" /> Anterior
      </Button>
      <span aria-live="polite" aria-atomic="true">Página {currentPage} de {totalPages}</span>
      <Button type="button" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} variant="outline" size="sm">
        Próxima <FiChevronRight aria-hidden="true" />
      </Button>
    </nav>
  );
}

export default Pagination;
