import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip
} from 'recharts';
import { formatCurrency } from '../../../utils/numeroLocalizado';
import { FiDollarSign } from 'react-icons/fi';

const CustomPaymentTooltip = ({ active, payload, totalFinanceiro }) => {
  if (!active || !payload || !payload.length) return null;
  const item = payload[0].payload;
  const pct = totalFinanceiro > 0 ? ((item.value / totalFinanceiro) * 100).toFixed(1) : 0;

  return (
    <div className="rounded-xl border border-border bg-surface p-3 shadow-xl backdrop-blur-md">
      <div className="flex items-center gap-1.5 mb-1">
        <span className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: item.cor }} />
        <span className="text-xs font-semibold text-text-primary">{item.name}</span>
      </div>
      <p className="text-xs text-text-secondary">
        Valor: <span className="font-semibold text-text-primary tabular-nums">{formatCurrency(item.value)}</span> ({pct}%)
      </p>
    </div>
  );
};

const PaymentStatusChart = ({ data = [] }) => {
  const totalRecebido = data.reduce((acc, curr) => acc + (curr.valor_recebido || 0), 0);
  const totalPendente = data.reduce((acc, curr) => acc + (curr.valor_pendente || 0), 0);
  const totalFinanceiro = totalRecebido + totalPendente;

  const chartData = [
    { name: 'Recebido em Caixa', value: totalRecebido, cor: '#10b981' },
    { name: 'Pendente de Recebimento', value: totalPendente, cor: '#f59e0b' }
  ].filter(d => d.value > 0);

  return (
    <div className="glass-card flex flex-col justify-between">
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <FiDollarSign size={16} />
          </span>
          <h2 className="mb-0 text-base font-semibold tracking-tight text-text-primary">
            Situação Financeira dos Pagamentos
          </h2>
        </div>
        <p className="mt-1 text-xs text-text-secondary">
          Proporção entre valores já recebidos e pendências financeiras de pedidos confirmados.
        </p>
      </div>

      {totalFinanceiro === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border/80 p-6 text-center">
          <p className="text-sm font-medium text-text-primary">Nenhum valor financeiro no período</p>
          <p className="mt-1 text-xs text-text-secondary">Não há valores confirmados a apresentar.</p>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative h-56 w-full sm:w-1/2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  stroke="var(--surface)"
                  strokeWidth={2}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-pay-${index}`} fill={entry.cor} />
                  ))}
                </Pie>
                <Tooltip content={<CustomPaymentTooltip totalFinanceiro={totalFinanceiro} />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center px-4">
              <span className="text-base font-bold tracking-tight text-text-primary tabular-nums">
                {formatCurrency(totalFinanceiro)}
              </span>
              <span className="text-[10px] uppercase font-medium text-text-secondary">
                Total Confirmado
              </span>
            </div>
          </div>

          <div className="w-full sm:w-1/2 space-y-3">
            {data.map((item) => (
              <div key={item.status} className="rounded-lg border border-border/60 bg-surface/60 p-2.5">
                <div className="flex items-center justify-between text-xs font-semibold text-text-primary">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: item.cor }} />
                    <span>{item.label}</span>
                  </div>
                  <span className="text-text-secondary">{item.count} {item.count === 1 ? 'pedido' : 'pedidos'}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px]">
                  <span className="text-emerald-600 dark:text-emerald-400">
                    Pago: {formatCurrency(item.valor_recebido)}
                  </span>
                  {item.valor_pendente > 0 && (
                    <span className="text-amber-600 dark:text-amber-400">
                      Pendente: {formatCurrency(item.valor_pendente)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentStatusChart;
