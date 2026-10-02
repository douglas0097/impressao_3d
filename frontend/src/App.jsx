import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import OrcamentosPedidos from './pages/OrcamentosPedidos';
import Filamentos from './pages/Filamentos';
import Clientes from './pages/Clientes';
import Configuracoes from './pages/Configuracoes';

function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try { return localStorage.getItem('3d-manager-sidebar-collapsed') === 'true'; }
    catch { return false; }
  });
  const toggleSidebar = () => {
    const next = !sidebarCollapsed;
    setSidebarCollapsed(next);
    try { localStorage.setItem('3d-manager-sidebar-collapsed', String(next)); }
    catch { /* Keep the current preference in memory. */ }
  };
  return (
    <Router>
      <div className="flex min-h-screen bg-background">
        <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />
        <main className={`min-w-0 flex-1 bg-content-bg p-4 pb-24 transition-[margin] duration-300 ease-out motion-reduce:transition-none md:p-7 ${sidebarCollapsed ? 'md:ml-[76px]' : 'md:ml-[252px]'}`}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/pedidos" element={<OrcamentosPedidos />} />
            <Route path="/filamentos" element={<Filamentos />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
