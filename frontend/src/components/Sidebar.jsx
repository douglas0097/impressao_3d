import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, Users, Calculator, Settings } from 'lucide-react';

const Sidebar = () => {
  const navItems = [
    { to: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { to: '/pedidos', icon: <Calculator size={20} />, label: 'Orçamentos' },
    { to: '/filamentos', icon: <Package size={20} />, label: 'Filamentos' },
    { to: '/clientes', icon: <Users size={20} />, label: 'Clientes' },
    { to: '/configuracoes', icon: <Settings size={20} />, label: 'Configurações' },
  ];

  return (
    <div style={{
      width: '260px',
      background: 'var(--bg-surface)',
      borderRight: '1px solid var(--border-light)',
      height: '100vh',
      position: 'fixed',
      top: 0,
      left: 0,
      padding: '2rem 1rem'
    }}>
      <div style={{ marginBottom: '3rem', padding: '0 1rem' }}>
        <h2 style={{ color: 'var(--primary)', margin: 0, fontSize: '1.4rem' }}>3D Manager</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.2rem' }}>Studio & Pricing</p>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {navItems.map(item => (
          <NavLink 
            key={item.to} 
            to={item.to}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              color: isActive ? 'white' : 'var(--text-muted)',
              background: isActive ? 'var(--primary)' : 'transparent',
              textDecoration: 'none',
              fontWeight: isActive ? '600' : '500',
              transition: 'all 0.2s'
            })}
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
