import React from 'react';

const MetricCard = ({ title, value, icon, trend }) => {
  return (
    <div className="glass-card flex-between" style={{ padding: '1.5rem' }}>
      <div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
          {title}
        </p>
        <h3 style={{ fontSize: '1.8rem', fontWeight: '700', margin: 0 }}>
          {value}
        </h3>
        {trend && (
          <p style={{ 
            fontSize: '0.75rem', 
            marginTop: '0.5rem', 
            color: trend.isPositive ? 'var(--success)' : 'var(--danger)',
            display: 'flex', alignItems: 'center', gap: '0.25rem'
          }}>
            {trend.isPositive ? '↑' : '↓'} {trend.value}
          </p>
        )}
      </div>
      <div style={{
        background: 'rgba(59, 130, 246, 0.1)',
        color: 'var(--primary)',
        padding: '1rem',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {icon}
      </div>
    </div>
  );
};

export default MetricCard;
