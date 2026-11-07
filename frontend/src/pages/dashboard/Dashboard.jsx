import React, { useState, useEffect } from 'react';
import {
  TbCurrencyReal,
  TbClockDollar,
  TbPrinter,
  TbCircleCheck,
  TbFileInvoice,
  TbAlertCircle
} from 'react-icons/tb';
import MetricCard from '../../components/MetricCard';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import api from '../../services/api';
import PeriodFilter from './components/PeriodFilter';
import RevenueTimelineChart from './components/RevenueTimelineChart';
import OrderStatusDonutChart from './components/OrderStatusDonutChart';
import PaymentStatusChart from './components/PaymentStatusChart';
import TopCustomersChart from './components/TopCustomersChart';
import FilamentConsumptionChart from './components/FilamentConsumptionChart';
import OperationalHighlights from './components/OperationalHighlights';
import { formatCurrency } from '../../utils/numeroLocalizado';

const Dashboard = () => {
  const [periodo, setPeriodo] = useState('6m');
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    let active = true;

    api.get('/dashboard', { params: { periodo } })
      .then((res) => {
        if (active) {
          setDashboardData(res.data);
        }
      })
      .catch((err) => {
        if (active) {
          console.error('Erro ao carregar dados do dashboard:', err);
          setError(err.response?.data?.message || 'Não foi possível carregar as informações do dashboard.');
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [periodo, refreshTrigger]);

  const handlePeriodChange = (newPeriod) => {
    if (newPeriod !== periodo) {
      setLoading(true);
      setPeriodo(newPeriod);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    setRefreshTrigger((prev) => prev + 1);
  };

  const metrics = dashboardData?.metricas || {
    faturamento_recebido: 0,
    faturamento_pendente: 0,
    faturamento_total_confirmado: 0,
    lucro_estimado: 0,
    margem_lucro_pct: 0,
    pedidos_em_andamento: 0,
    pedidos_concluidos: 0,
    pedidos_orcamento: 0,
    valor_potencial_orcamento: 0,
    total_pedidos: 0
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard Gerencial"
        subtitle="Acompanhe o faturamento, contas a receber, fluxo operacional e métricas de produção da oficina."
      />

      <PeriodFilter
        currentPeriod={periodo}
        onPeriodChange={handlePeriodChange}
        onRefresh={handleRefresh}
        loading={loading}
      />

      {error ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center text-red-600 dark:text-red-400">
          <div className="flex flex-col items-center justify-center gap-2">
            <TbAlertCircle size={32} />
            <p className="font-semibold">{error}</p>
            <p className="text-xs text-text-secondary">Verifique sua conexão ou tente recarregar.</p>
            <Button variant="outline" size="sm" onClick={handleRefresh} className="mt-3">
              Tentar novamente
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Grid de 5 Cards Principais */}
          <div className="responsive-grid">
            <MetricCard
              title="Faturamento Recebido"
              value={loading ? '...' : formatCurrency(metrics.faturamento_recebido)}
              tone="emerald"
              icon={<TbCurrencyReal size={24} />}
              subtext="Recebido em caixa (confirmados)"
            />
            <MetricCard
              title="A Receber (Pendente)"
              value={loading ? '...' : formatCurrency(metrics.faturamento_pendente)}
              tone="amber"
              icon={<TbClockDollar size={24} />}
              subtext="Saldo pendente de recebimento"
            />
            <MetricCard
              title="Pedidos em Andamento"
              value={loading ? '...' : metrics.pedidos_em_andamento}
              tone="blue"
              icon={<TbPrinter size={24} />}
              subtext="Fila ativa na oficina"
            />
            <MetricCard
              title="Pedidos Concluídos"
              value={loading ? '...' : metrics.pedidos_concluidos}
              tone="violet"
              icon={<TbCircleCheck size={24} />}
              subtext="Finalizados / Entregues"
            />
            <MetricCard
              title="Orçamentos em Aberto"
              value={loading ? '...' : metrics.pedidos_orcamento}
              tone="cyan"
              icon={<TbFileInvoice size={24} />}
              subtext={loading ? '...' : `Potencial: ${formatCurrency(metrics.valor_potencial_orcamento)}`}
            />
          </div>

          {/* Gráfico 1: Evolução Temporal de Vendas e Volume */}
          <RevenueTimelineChart data={dashboardData?.evolucao_temporal || []} />

          {/* Linha com Gráficos 2 e 3 */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Gráfico 2: Distribuição de Pedidos por Status */}
            <OrderStatusDonutChart data={dashboardData?.distribuicao_status || []} />

            {/* Gráfico 3: Situação Financeira dos Pagamentos */}
            <PaymentStatusChart data={dashboardData?.situacao_pagamentos || []} />
          </div>

          {/* Linha com Gráficos 4 e 5 */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Gráfico 4: Top Clientes */}
            <TopCustomersChart data={dashboardData?.top_clientes || []} />

            {/* Gráfico 5: Consumo e Estoque de Filamentos */}
            <FilamentConsumptionChart data={dashboardData?.consumo_filamentos || []} />
          </div>

          {/* Destaques e Eficiência Operacional */}
          <OperationalHighlights metrics={metrics} />
        </>
      )}
    </div>
  );
};

export default Dashboard;
