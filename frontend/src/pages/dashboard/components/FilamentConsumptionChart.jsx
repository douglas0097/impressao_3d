import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import CustomChartTooltip from './CustomChartTooltip';
import { GiWireCoil } from 'react-icons/gi';
import { FiAlertTriangle } from 'react-icons/fi';

const FilamentConsumptionChart = ({ data = [] }) => {
  const hasData = data && data.length > 0;

  const valueFormatter = (value) => {
    return `${value} g (${(value / 1000).toFixed(2)} kg)`;
  };

  const chartData = data.slice(0, 5).map(f => ({
    nome: f.nome.length > 15 ? `${f.nome.slice(0, 15)}...` : f.nome,
    nomeCompleto: f.nome,
    tipo: f.tipo_polimero,
    consumo_gramas: f.consumo_gramas || 0,
    estoque_gramas: f.estoque_gramas || 0,
    estoque_baixo: f.estoque_baixo
  }));

  const lowStockFilaments = data.filter(f => f.estoque_baixo || f.estoque_gramas <= 200);

  return (
    <div className="glass-card flex flex-col justify-between">
      <div className="mb-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
              <GiWireCoil size={18} />
            </span>
            <h2 className="mb-0 text-base font-semibold tracking-tight text-text-primary">
              Consumo e Nível de Estoque de Filamentos
            </h2>
          </div>
          {lowStockFilaments.length > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
              <FiAlertTriangle size={12} />
              {lowStockFilaments.length} {lowStockFilaments.length === 1 ? 'bobina baixa' : 'bobinas baixas'}
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-text-secondary">
          Gramas consumidas em pedidos confirmados vs estoque restante disponível nas bobinas.
        </p>
      </div>

      {!hasData ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border/80 p-6 text-center">
          <p className="text-sm font-medium text-text-primary">Nenhum filamento cadastrado</p>
          <p className="mt-1 text-xs text-text-secondary">Cadastre bobinas em Filamentos para acompanhar consumo e estoque.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} vertical={false} />
                <XAxis
                  dataKey="nome"
                  tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                  stroke="var(--border)"
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(val) => `${val}g`}
                  tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                  stroke="var(--border)"
                  tickLine={false}
                />
                <Tooltip
                  content={
                    <CustomChartTooltip
                      isCurrency={false}
                      valueFormatter={valueFormatter}
                    />
                  }
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ paddingBottom: '10px', fontSize: '11px' }}
                  iconType="circle"
                  iconSize={8}
                />
                <Bar
                  dataKey="consumo_gramas"
                  name="Consumo no período"
                  fill="#06b6d4"
                  radius={[4, 4, 0, 0]}
                  barSize={16}
                />
                <Bar
                  dataKey="estoque_gramas"
                  name="Estoque restante"
                  fill="#8b5cf6"
                  radius={[4, 4, 0, 0]}
                  barSize={16}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 border-t border-border/60 pt-3">
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Status das Bobinas Principais
            </h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {data.slice(0, 4).map((f) => {
                const totalCap = 1000;
                const pct = Math.min(100, Math.round(((f.estoque_gramas || 0) / totalCap) * 100));
                const isCritical = f.estoque_gramas <= 200;

                return (
                  <div
                    key={f.id}
                    className={`rounded-lg border p-2 text-xs transition-colors ${
                      isCritical
                        ? 'border-amber-500/40 bg-amber-500/5'
                        : 'border-border/60 bg-surface/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="truncate font-medium text-text-primary">{f.nome}</span>
                        <span className="rounded bg-surface-hover px-1 py-0.2 text-[9px] font-semibold text-text-secondary shrink-0">
                          {f.tipo_polimero}
                        </span>
                      </div>
                      <span className={`font-semibold tabular-nums shrink-0 ${isCritical ? 'text-amber-600 dark:text-amber-400' : 'text-text-primary'}`}>
                        {f.estoque_gramas}g
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-border/60">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isCritical ? 'bg-amber-500' : 'bg-cyan-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilamentConsumptionChart;
