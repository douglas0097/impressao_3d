const currency = (value) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const rows = [
  ["material", "Filamento"],
  ["energia", "Energia elétrica"],
  ["maquina", "Máquina"],
  ["maoObra", "Mão de obra"],
  ["manutencao", "Manutenção"],
  ["retrabalho", "Retrabalho"],
  ["total", "Custo total"],
  ["lucro", "Lucro antes do desconto"],
  ["venda", "Preço de venda"],
  ["desconto", "Desconto"],
];

export default function CalculatorResult({ result, validation }) {
  return (
    <section
      className="h-fit rounded-md border border-border bg-surface p-5"
      aria-labelledby="calculator-result"
    >
      <h2
        id="calculator-result"
        className="mb-5 text-base font-semibold"
      >
        Resumo do orçamento
      </h2>
      <div aria-live="polite" aria-atomic="true">
        {validation ? (
          <p role="alert" className="text-danger">
            {validation}
          </p>
        ) : result ? (
          <>
            <dl className="space-y-3">
              {rows.map(([key, label]) => (
                <div
                  key={key}
                  className={`flex justify-between gap-4 ${key === "total" || key === "venda" ? "border-t border-border pt-3 font-semibold" : ""}`}
                >
                  <dt>{label}</dt>
                  <dd>{currency(result[key])}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-5 rounded-md bg-brand-soft p-4">
              <p className="text-sm">Valor final sugerido</p>
              <p className="mt-1 text-3xl font-semibold text-brand">
                {currency(result.final)}
              </p>
            </div>
            {result.final < result.total && (
              <p className="mt-3 text-warning">
                O desconto deixa o valor final abaixo do custo da
                impressão.
              </p>
            )}
            <p className="mt-4 text-xs text-text-secondary">
              Valores exibidos em reais, arredondados para centavos.
              Esta simulação não altera o estoque nem o cadastro do
              filamento.
            </p>
          </>
        ) : (
          <p className="text-text-secondary">
            Selecione um filamento e informe peso e tempo para
            visualizar os valores automaticamente.
          </p>
        )}
      </div>
    </section>
  );
}
