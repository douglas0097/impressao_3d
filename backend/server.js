import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';

import configuracaoRoutes from './routes/configuracaoRoutes.js';
import filamentoRoutes from './routes/filamentoRoutes.js';
import clienteRoutes from './routes/clienteRoutes.js';
import pedidoRoutes from './routes/pedidoRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';

// Configurações de Ambiente
dotenv.config();

// Conexão com Banco de Dados
connectDB();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Rotas Básicas (Teste)
app.get('/', (req, res) => {
  res.send('API do Sistema de Impressão 3D está rodando...');
});

// Registrar Rotas da API
app.use('/api/configuracoes', configuracaoRoutes);
app.use('/api/filamentos', filamentoRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/pedidos', pedidoRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Porta
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
