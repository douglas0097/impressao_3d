import { FiArrowDownRight, FiArrowUpRight } from 'react-icons/fi';

const tones = {
  blue: 'bg-blue-50 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400',
  emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400',
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400',
  violet: 'bg-violet-50 text-violet-600 dark:bg-violet-400/10 dark:text-violet-400',
};

const MetricCard = ({ title, value, icon, trend, tone = 'blue' }) => {
  const TrendIcon = trend?.isPositive ? FiArrowUpRight : FiArrowDownRight;

  return (
    <div className="metric-card min-w-0" data-tone={Object.hasOwn(tones, tone) ? tone : 'blue'}>
      <div className="flex items-center justify-between gap-3">
        <p className="min-w-0 text-[11px] leading-4 font-medium text-text-secondary">
          {title}
        </p>
        <span aria-hidden="true" className={`metric-card-icon flex size-8 shrink-0 items-center justify-center rounded-lg [&>svg]:size-[18px] ${tones[tone] || tones.blue}`}>
          {icon}
        </span>
      </div>
      <p className="relative mt-2 break-words text-[24px] leading-7 font-semibold tracking-tight text-text-primary tabular-nums">
        {value}
      </p>
      <div className="relative mt-2 flex min-h-6 items-center border-t border-border/70 pt-2">
        {trend && (
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] leading-4 font-medium ${trend.isPositive ? 'bg-success/8 text-success dark:text-emerald-400' : 'bg-danger/8 text-danger dark:text-red-400'}`}>
            <TrendIcon size={12} aria-hidden="true" />
            {trend.value}
          </span>
        )}
        {!trend && <span className="inline-flex items-center gap-2 text-[10px] leading-4 text-text-secondary"><span aria-hidden="true" className="metric-card-dot size-1.5 rounded-full" />{title}</span>}
      </div>
    </div>
  );
};

export default MetricCard;
