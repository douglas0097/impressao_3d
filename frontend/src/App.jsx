import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import OrcamentosPedidos from './pages/OrcamentosPedidos';
import Filamentos from './pages/Filamentos';
import Clientes from './pages/Clientes';
import Configuracoes from './pages/Configuracoes';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Sidebar />
        <main className="main-content">
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
