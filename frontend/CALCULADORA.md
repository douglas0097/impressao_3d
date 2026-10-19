# Calculadora parametrizada

Acesse `/calculadora` pelo menu lateral. A simulação consulta apenas `GET /filamentos` e `GET /configuracoes`, sem gravar pedidos, modificar configurações ou movimentar estoque.

Peso, tempo e mão de obra representam o lote inteiro. Energia e máquina são custos separados. Os parâmetros globais preenchem os campos iniciais; alterações permanecem na simulação. Limpar simulação restaura os parâmetros padrão carregados das Configurações e limpa a seleção, peso e tempo. Mão de obra e desconto retornam a zero, pois não possuem padrão cadastrado.

O lucro é um acréscimo sobre o custo (markup), compatível com o cálculo atual do backend. O desconto é em reais e não pode superar o preço de venda. Manutenção e retrabalho incidem sobre filamento + energia + máquina. O preço por grama usa o peso original da bobina, nunca o estoque restante.

Os cálculos preservam precisão intermediária e exibem valores em reais com duas casas decimais. Pequenas diferenças na soma dos itens exibidos podem decorrer do arredondamento.

## Dependências do backend

O modelo atual de filamento não possui campo de ativação. Por compatibilidade, registros sem status são considerados disponíveis; `ativo: false` ou `status: "inativo"` os excluem da calculadora. A gestão efetiva de ativos depende desse campo no backend.

O projeto atual não implementa autenticação/autorização. A calculadora segue as rotas existentes e não oferece controle de acesso até que o backend estabeleça autenticação e permissões. Caso a simulação venha a ser persistida como orçamento, o backend deve validar permissões, parâmetros e recalcular os valores; valores recebidos do navegador não devem ser considerados autoritativos.

## Validação

Execute `node --test src/utils/calcularOrcamento.test.js`, `npm run lint` e `npm run build`.
