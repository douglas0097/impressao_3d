import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import { formatCurrency } from '../../../utils/numeroLocalizado';
import { FiPieChart } from 'react-icons/fi';

const CustomPieTooltip = ({ active, payload, totalOrders }) => {
  if (!active || !payload || !payload.length) return null;
  const item = payload[0].payload;
  const pct = totalOrders > 0 ? ((item.count / totalOrders) * 100).toFixed(1) : 0;

  return (
    <div className="rounded-xl border border-border bg-surface p-3 shadow-xl backdrop-blur-md">
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: item.cor }} />
        <span className="text-xs font-semibold text-text-primary">{item.label}</span>
      </div>
      <div className="space-y-1 text-xs">
        <div className="flex items-center justify-between gap-4 text-text-secondary">
          <span>Quantidade:</span>
          <span className="font-semibold text-text-primary tabular-nums">{item.count} ({pct}%)</span>
        </div>
        <div className="flex items-center justify-between gap-4 text-text-secondary">
          <span>Valor Total:</span>
          <span className="font-semibold text-text-primary tabular-nums">{formatCurrency(item.valor)}</span>
        </div>
      </div>
    </div>
  );
};

const OrderStatusDonutChart = ({ data = [] }) => {
  const activeItems = data.filter(item => item.count > 0);
  const totalOrders = activeItems.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <div className="glass-card flex flex-col justify-between">
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <FiPieChart size={16} />
          </span>
          <h2 className="mb-0 text-base font-semibold tracking-tight text-text-primary">
            Distribuição de Pedidos por Status
          </h2>
        </div>
        <p className="mt-1 text-xs text-text-secondary">
          Visão do funil operacional: orçamentos, produção, entregas e cancelamentos.
        </p>
      </div>

      {totalOrders === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border/80 p-6 text-center">
          <p className="text-sm font-medium text-text-primary">Nenhum pedido no período</p>
          <p className="mt-1 text-xs text-text-secondary">Não há registros para compor o gráfico de status.</p>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative h-56 w-full sm:w-1/2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={activeItems}
                  dataKey="count"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  stroke="var(--surface)"
                  strokeWidth={2}
                >
                  {activeItems.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.cor} />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip totalOrders={totalOrders} />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-bold tracking-tight text-text-primary tabular-nums">
                {totalOrders}
              </span>
              <span className="text-[10px] uppercase font-medium text-text-secondary">
                {totalOrders === 1 ? 'Pedido' : 'Pedidos'}
              </span>
            </div>
          </div>

          <div className="w-full sm:w-1/2 space-y-2">
            {data.map((item) => {
              const pct = totalOrders > 0 ? ((item.count / totalOrders) * 100).toFixed(0) : 0;
              return (
                <div key={item.status} className="flex items-center justify-between text-xs py-1 border-b border-border/40 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: item.cor }} />
                    <span className="text-text-secondary">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-text-primary tabular-nums">{item.count}</span>
                    <span className="text-[10px] text-text-disabled w-8 text-right tabular-nums">({pct}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderStatusDonutChart;
