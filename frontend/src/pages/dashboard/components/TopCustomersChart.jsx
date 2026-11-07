import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { formatCurrency } from '../../../utils/numeroLocalizado';
import CustomChartTooltip from './CustomChartTooltip';
import { FiUsers, FiAward } from 'react-icons/fi';

const TopCustomersChart = ({ data = [] }) => {
  const hasData = data && data.length > 0 && data.some(c => c.total_gasto > 0);

  const valueFormatter = (value, name, entry) => {
    const item = entry.payload;
    return `${formatCurrency(value)} (${item.pedidos_count} pedidos · Ticket médio: ${formatCurrency(item.ticket_medio)})`;
  };

  return (
    <div className="glass-card flex flex-col justify-between">
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <FiUsers size={16} />
          </span>
          <h2 className="mb-0 text-base font-semibold tracking-tight text-text-primary">
            Top Clientes por Faturamento
          </h2>
        </div>
        <p className="mt-1 text-xs text-text-secondary">
          Principais clientes em volume financeiro confirmado e pedidos realizados.
        </p>
      </div>

      {!hasData ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border/80 p-6 text-center">
          <p className="text-sm font-medium text-text-primary">Nenhum cliente com pedidos confirmados</p>
          <p className="mt-1 text-xs text-text-secondary">Os clientes aparecerão aqui conforme as vendas forem confirmadas.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} horizontal={false} />
                <XAxis
                  type="number"
                  tickFormatter={(val) => `R$ ${val}`}
                  tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                  stroke="var(--border)"
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="nome"
                  tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                  stroke="var(--border)"
                  width={110}
                  tickLine={false}
                />
                <Tooltip content={<CustomChartTooltip valueFormatter={valueFormatter} />} />
                <Bar
                  dataKey="total_gasto"
                  name="Faturamento"
                  fill="#3b82f6"
                  radius={[0, 6, 6, 0]}
                  barSize={18}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 border-t border-border/60 pt-3">
            {data.map((c, index) => (
              <div key={c.id} className="flex items-center justify-between text-xs py-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                    index === 0
                      ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                      : 'bg-surface-hover text-text-secondary'
                  }`}>
                    {index === 0 ? <FiAward size={11} /> : index + 1}
                  </span>
                  <span className="truncate font-medium text-text-primary">{c.nome}</span>
                  <span className="text-[11px] text-text-secondary shrink-0">
                    ({c.pedidos_count} {c.pedidos_count === 1 ? 'pedido' : 'pedidos'})
                  </span>
                </div>
                <span className="font-semibold text-text-primary tabular-nums shrink-0">
                  {formatCurrency(c.total_gasto)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TopCustomersChart;
