import { BrowserRouter, Route, Routes } from 'react-router-dom';
import MainLayout from '../layout/MainLayout';
import Dashboard from '../pages/dashboard/Dashboard';
import Orders from '../pages/orders/Orders';
import Filaments from '../pages/filaments/Filaments';
import Customers from '../pages/customers/Customers';
import Settings from '../pages/settings/Settings';
import Calculator from '../pages/calculator/Calculator';
import AuthLogin from '../pages/authLogin/AuthLogin';

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<AuthLogin />} />
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="pedidos" element={<Orders />} />
          <Route path="calculadora" element={<Calculator />} />
          <Route path="filamentos" element={<Filaments />} />
          <Route path="clientes" element={<Customers />} />
          <Route path="configuracoes" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
