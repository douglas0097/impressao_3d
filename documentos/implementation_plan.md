# Sistema de Gerenciamento e Orçamentos para Impressão 3D

Desenvolvimento de um sistema completo de gestão para impressão 3D (MERN Stack: Node.js, Express, React com Vite e MongoDB Atlas). O sistema soluciona a dificuldade de precificação e controle de pedidos, filamentos e clientes, automatizando os cálculos de custos com base na planilha do usuário e no Product Backlog.

## Decisões Confirmadas com o Usuário

- **Banco de Dados**: MongoDB Atlas configurado com a string de conexão fornecida.
- **Tela de Parâmetros Globais de Custo**: Será criada uma página dedicada (`/configuracoes`) para ajuste dinâmico de Custo de Energia (kWh / hora), Taxa de Manutenção, Retrabalho e Margem de Lucro Padrão.
- **Autenticação**: Não será necessária autenticação nesta fase; o sistema será de acesso direto para operador único.
- **Design & UI**: CSS Vanilla com visual moderno e premium (Dark Mode elegante, glassmorphism, tipografia moderna e micro-animações).

---

## User Review Required

> [!IMPORTANT]
> A string de conexão do MongoDB Atlas foi fornecida e será armazenada com segurança no arquivo `.env` do backend (`mongodb+srv://Douglas0097:****@cluster0.5hgwb.mongodb.net/impressao3d`). O banco de dados utilizado será `impressao3d`.
> Certifique-se de que o IP da sua máquina local esteja liberado na lista de acesso do MongoDB Atlas (**Network Access > Add Current IP Address** ou `0.0.0.0/0` para desenvolvimento).

---

## Proposed Changes

O projeto será organizado na raiz do diretório `c:\Users\Douglas\Documents\impressao_3d`:
- `backend/`: API RESTful em Node.js com Express e Mongoose.
- `frontend/`: Aplicação Single Page em React (Vite) estilizada com CSS Vanilla puro.

---

### Backend (Node.js + Express + MongoDB Atlas)

#### [NEW] `backend/package.json`
Dependências: `express`, `mongoose`, `dotenv`, `cors`. Scripts de inicialização (`npm run dev` com node --watch).

#### [NEW] `backend/.env`
Configuração da porta (`PORT=5000`) e string de conexão do MongoDB Atlas (`MONGODB_URI`).

#### [NEW] `backend/config/db.js`
Módulo de conexão com o MongoDB Atlas via Mongoose com tratamento de erros e reconexão.

#### [NEW] `backend/models/Configuracao.js`
Armazenamento das taxas globais de custo:
- `custo_energia_kwh`: Valor do kWh (R$).
- `potencia_impressora_w`: Potência média da impressora (Watts) para cálculo automático de R$/hora de energia.
- `custo_hora_impressao_adicional`: Custos operacionais fixos por hora (R$).
- `taxa_manutencao_pct`: Percentual sobre a máquina/peça.
- `taxa_retrabalho_pct`: Margem de segurança para falhas de impressão (ex: 5% a 10%).
- `margem_lucro_padrao_pct`: Margem sugerida padrão (ex: 40%).

#### [NEW] `backend/models/Filamento.js`
Armazenamento do estoque de bobinas:
- `nome`, `marca`, `tipo_polimero` (PLA, PETG, ABS, TPU, etc.), `cor`, `peso_total_g` (ex: 1000g), `preco_pago` (R$), `temperatura_bico`, `temperatura_mesa`, `estoque_gramas`, `custo_por_grama` (campo virtual/calculado).

#### [NEW] `backend/models/Cliente.js`
CRM simplificado:
- `nome`, `telefone` (com formatação e link WhatsApp), `instagram`, `observacoes`.

#### [NEW] `backend/models/Pedido.js`
Registro completo de pedidos e orçamentos:
- `cliente_id` (referência), `nome_peca`, `link_modelo`, `filamento_id` (referência), `quantidade_pecas`, `peso_estimado_g`, `tempo_estimado_horas`.
- **Valores Financeiros Calculados**: `custo_filamento`, `custo_tempo_energia`, `custo_total_sem_lucro`, `preco_sugerido`, `preco_final_cobrado`.
- **Fluxo Operacional**: `status` (`ORCAMENTO`, `APROVADO`, `EM_IMPRESSAO`, `CONCLUIDO`, `ENTREGUE`, `CANCELADO`).
- **Financeiro do Pedido**: `status_pagamento` (`PENDENTE`, `SINAL_50`, `PAGO`), `valor_sinal`, `valor_restante`.

#### [NEW] `backend/controllers/` & `backend/routes/`
- `configuracaoController.js` & `configuracaoRoutes.js`: Obter e atualizar parâmetros globais de custo.
- `filamentoController.js` & `filamentoRoutes.js`: CRUD completo de bobinas e atualização de estoque.
- `clienteController.js` & `clienteRoutes.js`: CRUD de clientes.
- `pedidoController.js` & `pedidoRoutes.js`: CRUD de pedidos + **endpoint de simulação/cálculo de orçamento em tempo real** (`POST /api/pedidos/calcular`).
- `dashboardController.js` & `dashboardRoutes.js`: Resumo analítico de faturamento mensal, lucro líquido, pedidos por status e filamento mais usado.

#### [NEW] `backend/server.js`
Ponto de entrada do servidor, registro de middlewares (cors, json), rotas e conexão inicial com seed de configurações padrão.

---

### Frontend (React + Vite + CSS Vanilla)

#### [NEW] `frontend/` (Inicialização com Vite)
Estrutura React rápida com Vite.

#### [NEW] `frontend/src/index.css`
Design System com visual Dark "Cyber/Studio":
- Paleta: Fundo escuro profundo (`#0b0f19`, `#111827`, `#1f2937`), destaques em azul royal elétrico (`#3b82f6`), ciano neon (`#06b6d4`), verde esmeralda para lucro (`#10b981`) e toques âmbar para alertas.
- Efeitos: Glassmorphism suave com blur, sombras luminosas sutis, bordas refinadas.
- Micro-animações em transições de páginas, botões, modais e cards interativos.
- Totalmente responsivo para computador e smartphone.

#### [NEW] `frontend/src/components/`
- `Sidebar.jsx` / `Navbar.jsx`: Navegação fluida entre Dashboard, Orçamentos, Filamentos, Clientes e Configurações.
- `MetricCard.jsx`: Cards com ícones e indicadores de tendência (Faturamento, Custos, Lucro).
- `Modal.jsx`: Modal animado para cadastros e edições.
- `StatusBadge.jsx`: Pílulas coloridas para status de impressão e pagamento.

#### [NEW] `frontend/src/pages/Dashboard.jsx`
Painel gerencial com resumo financeiro (Lucro do mês, Pedidos ativos, Horas de máquina rodadas, Alerta de filamentos com estoque baixo).

#### [NEW] `frontend/src/pages/OrcamentosPedidos.jsx`
- **Calculadora de Orçamentos Dinâmica**: O operador seleciona o cliente (ou digita um novo), o filamento e insere peso (g) e tempo (h). O sistema calcula instantaneamente:
  - Custo de filamento
  - Custo de energia e hora-máquina
  - Adicional de retrabalho
  - Sugestão de venda com margem configurada
  - Campo para ajustar o preço final
  - Botão "Gerar Pedido" ou "Copiar Proposta Comercial para WhatsApp".
- **Lista de Pedidos**: Filtros por status, alteração rápida de etapa (ex: de Orçado para Aguardando Sinal, Em Impressão, Concluído).

#### [NEW] `frontend/src/pages/Filamentos.jsx`
Inventário de bobinas com amostra visual de cor, gramas restantes e cálculo automático de R$/grama.

#### [NEW] `frontend/src/pages/Clientes.jsx`
Lista e cadastro de clientes com botão direto de clique para abrir conversa no WhatsApp (`wa.me`).

#### [NEW] `frontend/src/pages/Configuracoes.jsx` (Tela solicitada)
Página para ajustar em tempo real:
- Tarifa de energia (R$/kWh) e potência da máquina
- Custo hora de máquina
- Taxa de manutenção e retrabalho (%)
- Margem de lucro padrão (%)

---

## Verification Plan

### Testes Automatizados
- Teste de conexão do Mongoose com o cluster MongoDB Atlas com credenciais fornecidas.
- Validação matemática do endpoint `/api/pedidos/calcular` comparando com os valores exatos da planilha `Custo de impressão.xlsx`:
  - Exemplo: Peça de 69g em PETG (R$ 127.47/kg) por 4 horas deve reproduzir com exatidão os custos e o preço de venda sugerido.

### Verificação Manual
1. Iniciar o servidor backend na porta 5000 e frontend na 5173.
2. Acessar a tela de **Configurações** e validar a alteração da tarifa de energia e margem.
3. Cadastrar uma bobina em **Filamentos** e verificar o cálculo de custo por grama.
4. Cadastrar um cliente em **Clientes** e testar o link de WhatsApp.
5. Criar um orçamento em **Pedidos**: testar a calculadora em tempo real, salvar como pedido e transitar os status até concluído e pago.
6. Acompanhar o reflexo no **Dashboard**.
