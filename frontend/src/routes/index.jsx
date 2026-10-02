import { BrowserRouter, Route, Routes } from 'react-router-dom';
import MainLayout from '../layout/MainLayout';
import Dashboard from '../pages/dashboard/Dashboard';
import Orders from '../pages/orders/Orders';
import Filaments from '../pages/filaments/Filaments';
import Customers from '../pages/customers/Customers';
import Settings from '../pages/settings/Settings';

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="pedidos" element={<Orders />} />
          <Route path="filamentos" element={<Filaments />} />
          <Route path="clientes" element={<Customers />} />
          <Route path="configuracoes" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
