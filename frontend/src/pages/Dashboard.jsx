import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Package, CheckCircle } from 'lucide-react';
import MetricCard from '../components/MetricCard';
import api from '../services/api';

const Dashboard = () => {
  const [metrics, setMetrics] = useState({
    faturamento_total: 0,
    lucro_estimado: 0,
    pedidos_em_andamento: 0,
    pedidos_concluidos: 0,
    total_pedidos: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const response = await api.get('/dashboard');
      setMetrics(response.data);
    } catch (error) {
      console.error('Erro ao buscar métricas', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  if (loading) return <div style={{ color: 'white' }}>Carregando dashboard...</div>;

  return (
    <div>
      <h1>Dashboard Operacional</h1>
      
      <div className="grid-cols-4">
        <MetricCard 
          title="Faturamento Total" 
          value={formatCurrency(metrics.faturamento_total)} 
          icon={<DollarSign size={24} />} 
          trend={{ isPositive: true, value: 'Mês atual' }}
        />
        <MetricCard 
          title="Lucro Estimado" 
          value={formatCurrency(metrics.lucro_estimado)} 
          icon={<TrendingUp size={24} />} 
          trend={{ isPositive: true, value: 'Margem saudável' }}
        />
        <MetricCard 
          title="Pedidos em Andamento" 
          value={metrics.pedidos_em_andamento} 
          icon={<Package size={24} />} 
        />
        <MetricCard 
          title="Pedidos Concluídos" 
          value={metrics.pedidos_concluidos} 
          icon={<CheckCircle size={24} />} 
        />
      </div>

      <div className="glass-card" style={{ marginTop: '2rem' }}>
        <h2>Ações Rápidas</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <a href="/pedidos" className="btn btn-primary">Novo Orçamento</a>
          <a href="/filamentos" className="btn btn-outline">Cadastrar Filamento</a>
          <a href="/clientes" className="btn btn-outline">Cadastrar Cliente</a>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
