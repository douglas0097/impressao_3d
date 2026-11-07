import React from 'react';
import { FiClock, FiPercent, FiTrendingUp, FiLayers } from 'react-icons/fi';
import { formatCurrency } from '../../../utils/numeroLocalizado';

const OperationalHighlights = ({ metrics = {} }) => {
  const {
    ticket_medio = 0,
    margem_lucro_pct = 0,
    tempo_total_horas = 0,
    peso_total_impresso_g = 0,
    lucro_estimado = 0
  } = metrics;

  const pesoKg = (peso_total_impresso_g / 1000).toFixed(2);
  const horasFormatadas = tempo_total_horas.toFixed(1);

  return (
    <div className="glass-card">
      <div className="mb-4">
        <h2 className="mb-0 text-base font-semibold tracking-tight text-text-primary">
          Indicadores de Eficiência e Operação
        </h2>
        <p className="mt-1 text-xs text-text-secondary">
          Métricas de produção, produtividade da impressora e margens consolidadas do período.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-surface/60 p-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <FiTrendingUp size={18} />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-text-secondary">Lucro Estimado</p>
            <p className="text-base font-semibold text-text-primary tabular-nums">
              {formatCurrency(lucro_estimado)}
            </p>
            <p className="text-[10px] text-text-disabled">
              Margem de {margem_lucro_pct}%
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-surface/60 p-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <FiPercent size={18} />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-text-secondary">Ticket Médio</p>
            <p className="text-base font-semibold text-text-primary tabular-nums">
              {formatCurrency(ticket_medio)}
            </p>
            <p className="text-[10px] text-text-disabled">
              Por pedido confirmado
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-surface/60 p-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <FiClock size={18} />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-text-secondary">Tempo de Impressão</p>
            <p className="text-base font-semibold text-text-primary tabular-nums">
              {horasFormatadas} h
            </p>
            <p className="text-[10px] text-text-disabled">
              Horas de máquina no período
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-surface/60 p-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
            <FiLayers size={18} />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-text-secondary">Material Impresso</p>
            <p className="text-base font-semibold text-text-primary tabular-nums">
              {pesoKg} kg
            </p>
            <p className="text-[10px] text-text-disabled">
              {peso_total_impresso_g} gramas nas peças
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OperationalHighlights;
