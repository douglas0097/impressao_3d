import { BrowserRouter, Route, Routes } from 'react-router-dom';
import MainLayout from '../layout/MainLayout';
import Dashboard from '../pages/dashboard/Dashboard';
import Orders from '../pages/orders/Orders';
import OrderDetails from '../pages/orders/OrderDetails';
import Filaments from '../pages/filaments/Filaments';
import FilamentDetails from '../pages/filaments/FilamentDetails';
import Customers from '../pages/customers/Customers';
import CustomerDetails from '../pages/customers/CustomerDetails';
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
          <Route path="pedidos/:id" element={<OrderDetails />} />
          <Route path="calculadora" element={<Calculator />} />
          <Route path="filamentos" element={<Filaments />} />
          <Route path="filamentos/:id" element={<FilamentDetails />} />
          <Route path="clientes" element={<Customers />} />
          <Route path="clientes/:id" element={<CustomerDetails />} />
          <Route path="configuracoes" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
