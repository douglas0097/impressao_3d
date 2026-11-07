import React from 'react';
import { FiRefreshCw, FiCalendar } from 'react-icons/fi';
import Button from '../../../components/Button';

const periods = [
  { value: '7d', label: '7 dias' },
  { value: '30d', label: '30 dias' },
  { value: '3m', label: '3 meses' },
  { value: '6m', label: '6 meses' },
  { value: '12m', label: '12 meses' },
  { value: 'all', label: 'Todo o período' },
];

const PeriodFilter = ({ currentPeriod, onPeriodChange, onRefresh, loading }) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-1.5 overflow-x-auto rounded-xl border border-border bg-surface p-1 shadow-sm">
        <span className="hidden items-center gap-1.5 px-2.5 text-xs font-medium text-text-secondary sm:inline-flex">
          <FiCalendar className="text-text-disabled" size={14} />
          Período:
        </span>
        {periods.map((p) => {
          const isActive = currentPeriod === p.value;
          return (
            <button
              key={p.value}
              type="button"
              onClick={() => onPeriodChange(p.value)}
              disabled={loading}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                isActive
                  ? 'bg-brand text-white shadow-xs font-semibold'
                  : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={onRefresh}
        disabled={loading}
        title="Atualizar dados do dashboard"
        className="flex items-center gap-1.5 shrink-0"
      >
        <FiRefreshCw size={13} className={loading ? 'animate-spin text-brand' : ''} />
        <span>Atualizar</span>
      </Button>
    </div>
  );
};

export default PeriodFilter;
