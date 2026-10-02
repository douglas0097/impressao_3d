import { BrowserRouter, Route, Routes } from 'react-router-dom';
import MainLayout from '../layout/MainLayout';
import Dashboard from '../pages/Dashboard';
import OrcamentosPedidos from '../pages/OrcamentosPedidos';
import Filamentos from '../pages/Filamentos';
import Clientes from '../pages/Clientes';
import Configuracoes from '../pages/Configuracoes';

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="pedidos" element={<OrcamentosPedidos />} />
          <Route path="filamentos" element={<Filamentos />} />
          <Route path="clientes" element={<Clientes />} />
          <Route path="configuracoes" element={<Configuracoes />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
