import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { formatCurrency } from '../../../utils/numeroLocalizado';
import CustomChartTooltip from './CustomChartTooltip';
import { FiTrendingUp } from 'react-icons/fi';

const RevenueTimelineChart = ({ data = [] }) => {
  const hasData = data && data.length > 0 && data.some(d => d.faturamento_total > 0 || d.pedidos > 0);

  const valueFormatter = (value, name) => {
    if (name === 'Pedidos') return `${value} pedidos`;
    return formatCurrency(value);
  };

  return (
    <div className="glass-card flex flex-col justify-between">
      <div className="mb-4 flex flex-col justify-between gap-1 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <FiTrendingUp size={16} />
            </span>
            <h2 className="mb-0 text-base font-semibold tracking-tight text-text-primary">
              Evolução Temporal: Faturamento e Volume de Pedidos
            </h2>
          </div>
          <p className="mt-1 text-xs text-text-secondary">
            Acompanhe o faturamento recebido, valores a receber e volume de pedidos no período.
          </p>
        </div>
      </div>

      {!hasData ? (
        <div className="flex h-72 flex-col items-center justify-center rounded-xl border border-dashed border-border/80 p-6 text-center">
          <p className="text-sm font-medium text-text-primary">Nenhuma movimentação no período</p>
          <p className="mt-1 text-xs text-text-secondary">
            Não há pedidos confirmados ou faturamento registrado para o período selecionado.
          </p>
        </div>
      ) : (
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                stroke="var(--border)"
                tickLine={false}
              />
              <YAxis
                yAxisId="left"
                tickFormatter={(val) => `R$ ${val}`}
                tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                stroke="var(--border)"
                tickLine={false}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                allowDecimals={false}
                tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                stroke="var(--border)"
                tickLine={false}
              />
              <Tooltip
                content={<CustomChartTooltip valueFormatter={valueFormatter} />}
              />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: '12px', fontSize: '11px' }}
                iconType="circle"
                iconSize={8}
              />
              <Bar
                yAxisId="left"
                dataKey="faturamento_recebido"
                name="Recebido"
                fill="#10b981"
                stackId="faturamento"
                radius={[0, 0, 4, 4]}
              />
              <Bar
                yAxisId="left"
                dataKey="faturamento_pendente"
                name="A Receber"
                fill="#f59e0b"
                stackId="faturamento"
                radius={[4, 4, 0, 0]}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="pedidos"
                name="Pedidos"
                stroke="#3b82f6"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#3b82f6', strokeWidth: 1 }}
                activeDot={{ r: 5 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default RevenueTimelineChart;
