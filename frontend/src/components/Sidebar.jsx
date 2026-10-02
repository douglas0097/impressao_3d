import Button from './Button';
import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { FiMoon, FiSun, FiChevronsLeft, FiChevronsRight, FiLogOut } from 'react-icons/fi';
import { TbLayoutDashboard, TbUsers, TbFileInvoice, TbSettings } from 'react-icons/tb';
import { GiWireCoil } from 'react-icons/gi';
import BrandIsotype from './BrandIsotype';

const groups = [
  { label: 'Principal', items: [
    { to: '/', icon: TbLayoutDashboard, label: 'Dashboard' },
    { to: '/clientes', icon: TbUsers, label: 'Clientes' },
    { to: '/pedidos', icon: TbFileInvoice, label: 'Or\u00e7amentos e pedidos' },
    { to: '/filamentos', icon: GiWireCoil, label: 'Filamentos' },
  ] },
  { label: 'Prefer\u00eancias', items: [
    { to: '/configuracoes', icon: TbSettings, label: 'Configura\u00e7\u00f5es' },
  ] },
];

const Sidebar = ({ collapsed = false, onToggle }) => {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || 'light');
  const [currentUser] = useState(() => {
    try {
      const storedUser = JSON.parse(localStorage.getItem('user'));
      return {
        name: storedUser?.name || storedUser?.nome || 'Administrador',
        detail: storedUser?.email || storedUser?.role || storedUser?.perfil || 'Conta ativa',
      };
    } catch {
      return { name: 'Administrador', detail: 'Conta ativa' };
    }
  });
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('3d-manager-theme', theme); } catch { /* Storage may be unavailable. */ }
  }, [theme]);
  const themeLabel = theme === 'dark' ? 'Tema claro' : 'Tema escuro';
  const userInitials = currentUser.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase();
  const handleLogout = () => {
    try {
      ['token', 'authToken', 'access_token', 'refresh_token', 'user'].forEach(key => localStorage.removeItem(key));
      sessionStorage.clear();
    } finally {
      window.location.assign('/');
    }
  };

  return (
    <aside aria-label="Menu lateral" className={`sidebar-shell fixed inset-x-0 bottom-0 z-[100] border-t md:inset-x-auto md:inset-y-0 md:left-0 md:flex md:flex-col md:border-t-0 md:border-r ${collapsed ? 'md:w-[76px]' : 'md:w-[252px]'}`}>
      <header className={`relative z-20 hidden h-16 shrink-0 items-center border-b border-inherit md:flex ${collapsed ? 'justify-center px-3' : 'gap-2 px-4'}`}>
        <NavLink to="/" aria-label="3D Manager - Dashboard" className="flex items-center gap-2 text-inherit hover:text-inherit">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-brand-soft text-brand"><BrandIsotype size={19} /></span>
          <div aria-hidden={collapsed} className={`sidebar-copy ${collapsed ? 'sidebar-copy-collapsed' : ''}`}>
            <span className="block text-sm font-semibold tracking-tight">3D Manager</span>
            <span className="sidebar-muted block text-[8px] tracking-wide">STUDIO & PRICING</span>
          </div>
        </NavLink>
        <Button variant="ghost" size="icon-sm" type="button" onClick={onToggle} aria-expanded={!collapsed} aria-controls="sidebar-navigation"
          aria-label={collapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'} title={collapsed ? 'Expandir menu' : 'Recolher menu'}
          className="sidebar-collapse absolute -right-3.5 -bottom-3.75 z-100 border border-inherit shadow-sm">
          {collapsed ? <FiChevronsRight size={15} className="text-blue-600 dark:text-blue-400" /> : <FiChevronsLeft size={15} className="text-blue-600 dark:text-blue-400" />}
        </Button>
      </header>

      <nav id="sidebar-navigation" aria-label={"Navega\u00e7\u00e3o principal"} className={`flex items-center gap-1 p-2 md:block md:min-h-0 md:flex-1 md:overflow-x-hidden md:overflow-y-auto md:py-6 ${collapsed ? 'md:px-3' : 'md:px-4'}`}>
        {groups.map(group => (
          <section key={group.label} aria-label={group.label} className="contents md:mb-6 md:block">
            <h2 aria-hidden={collapsed} className={`sidebar-copy sidebar-muted mb-2.5 hidden truncate px-2.5 text-[9px] font-semibold tracking-[0.12em] uppercase md:block ${collapsed ? 'sidebar-copy-collapsed' : ''}`}>{group.label}</h2>
            <div className="contents md:flex md:flex-col md:gap-1">
              {group.items.map(({ to, icon: Icon, label }) => (
                <NavLink key={to} to={to} end={to === '/'} aria-label={label} title={collapsed ? label : undefined}
                  className={({ isActive }) => `sidebar-item group relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-md px-1 py-2 text-[9px] transition-colors md:min-h-10 md:flex-none md:py-2 md:text-xs ${collapsed ? 'md:justify-center md:px-0' : 'md:flex-row md:justify-start md:gap-3 md:px-2.5'} ${isActive ? 'sidebar-item-active font-semibold' : 'font-medium'}`}>
                  <span className="sidebar-item-icon flex size-7 shrink-0 items-center justify-center rounded-md">
                    <Icon size={18} strokeWidth={1.6} />
                  </span>
                  <span aria-hidden={collapsed} className={`sidebar-copy max-w-full truncate ${collapsed ? 'sidebar-copy-collapsed' : ''}`}>{label}</span>
                </NavLink>
              ))}
            </div>
          </section>
        ))}
        <div className="flex shrink-0 items-center gap-1 md:hidden">
          <Button variant="ghost" size="icon-sm" type="button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label={`Ativar ${themeLabel.toLowerCase()}`} title={themeLabel}
            className="sidebar-item">
            {theme === 'dark' ? <FiSun size={20} /> : <FiMoon size={20} />}
          </Button>
          <Button variant="ghost" size="icon-sm" type="button" onClick={handleLogout} aria-label="Sair" title="Sair"
            className="sidebar-logout">
            <FiLogOut size={20} />
          </Button>
        </div>
      </nav>

      <footer className={`hidden shrink-0 items-center border-t border-inherit py-3 md:flex ${collapsed ? 'flex-col gap-2 px-3' : 'gap-2 px-4'}`}>
        <div className={`flex min-w-0 items-center ${collapsed ? 'justify-center' : 'mr-auto gap-2.5'}`} title={collapsed ? `${currentUser.name} — ${currentUser.detail}` : undefined}>
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[10px] font-semibold text-brand">{userInitials || 'AD'}</span>
          <div aria-hidden={collapsed} className={`sidebar-copy min-w-0 ${collapsed ? 'sidebar-copy-collapsed' : ''}`}>
            <p className="truncate text-[11px] font-semibold">{currentUser.name}</p>
            <p className="sidebar-muted mt-0.5 max-w-24 truncate text-[9px]">{currentUser.detail}</p>
          </div>
        </div>
        <div className={`flex items-center gap-1 ${collapsed ? 'flex-col' : ''}`}>
          <Button variant="ghost" size="icon-sm" type="button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label={`Ativar ${themeLabel.toLowerCase()}`} title={themeLabel}
            className="sidebar-item shrink-0">
            {theme === 'dark' ? <FiSun size={16} strokeWidth={1.6} /> : <FiMoon size={16} strokeWidth={1.6} />}
          </Button>
          <Button variant="ghost" size="icon-sm" type="button" onClick={handleLogout} aria-label="Sair" title="Sair"
            className="sidebar-logout shrink-0">
            <FiLogOut size={16} strokeWidth={1.6} />
          </Button>
        </div>
      </footer>
    </aside>
  );
};
export default Sidebar;
