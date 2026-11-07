import React from 'react';
import { formatCurrency } from '../../../utils/numeroLocalizado';

const CustomChartTooltip = ({ active, payload, label, isCurrency = true, valueFormatter }) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="rounded-xl border border-border bg-surface p-3 shadow-xl backdrop-blur-md transition-all">
      {label && (
        <p className="mb-2 border-b border-border/60 pb-1.5 text-xs font-semibold text-text-primary">
          {label}
        </p>
      )}
      <div className="space-y-1.5">
        {payload.map((entry, index) => {
          const formattedValue = valueFormatter
            ? valueFormatter(entry.value, entry.name, entry)
            : isCurrency
              ? formatCurrency(entry.value)
              : entry.value;

          return (
            <div key={`tooltip-item-${index}`} className="flex items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span
                  className="size-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: entry.color || entry.fill || entry.stroke || 'var(--brand)' }}
                />
                <span className="text-text-secondary">{entry.name}:</span>
              </div>
              <span className="font-semibold text-text-primary tabular-nums">
                {formattedValue}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CustomChartTooltip;
