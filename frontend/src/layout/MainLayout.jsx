import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

function MainLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('3d-manager-sidebar-collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleSidebar = () => {
    const next = !sidebarCollapsed;
    setSidebarCollapsed(next);
    try {
      localStorage.setItem('3d-manager-sidebar-collapsed', String(next));
    } catch {
      /* Keep the current preference in memory. */
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />
      <main className={`min-w-0 flex-1 bg-content-bg p-4 pb-24 transition-[margin] duration-300 ease-out motion-reduce:transition-none md:p-7 ${sidebarCollapsed ? 'md:ml-[76px]' : 'md:ml-[252px]'}`}>
        <Outlet />
      </main>
    </div>
  );
}

export default MainLayout;
