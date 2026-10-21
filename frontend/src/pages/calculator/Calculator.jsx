import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../../components/PageHeader";
import Button from "../../components/Button";
import api from "../../services/api";
import CalculatorForm from "./components/CalculatorForm";
import CalculatorResult from "./components/CalculatorResult";
import {
  calcularOrcamento,
  filamentoDisponivel,
} from "../../utils/calcularOrcamento";
import {
  formatNumeroLocalizado,
  parseNumeroLocalizado,
} from "../../utils/numeroLocalizado";

const fields = [
  ["peso", "Peso do filamento (g)", null],
  ["horas", "Tempo - Horas", null],
  ["minutos", "Tempo - Minutos", null],
  ["custo_energia", "Custo de energia (R$/hora)", "custo_energia"],
  ["taxa_manutencao", "Taxa de manutenção (R$/hora)", "taxa_manutencao"],
  ["taxa_retrabalho_pct", "Taxa de retrabalho (%)", "taxa_retrabalho_pct"],
  ["margem_lucro_padrao_pct", "Margem de lucro (%)", "margem_lucro_padrao_pct"],
  ["desconto", "Desconto (R$)", null],
];
const initial = Object.fromEntries(
  fields.map(([key]) => [key, ["peso", "horas", "minutos"].includes(key) ? "" : "0,00"]),
);
export default function Calculator() {
  const [filamentos, setFilamentos] = useState([]);
  const [selected, setSelected] = useState("");
  const [values, setValues] = useState(initial);
  const [defaultValues, setDefaultValues] = useState(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError("");
      setWarning("");
      const [materials, settings] = await Promise.allSettled([
        api.get("/filamentos", { signal: controller.signal }),
        api.get("/configuracoes", { signal: controller.signal }),
      ]);
      if (controller.signal.aborted) return;
      if (
        materials.status === "fulfilled" &&
        Array.isArray(materials.value.data)
      ) {
        setFilamentos(materials.value.data.filter(filamentoDisponivel));
      } else setError("Não foi possível carregar os filamentos.");
      if (settings.status === "fulfilled") {
        const config = settings.value.data ?? {};
        const defaults = {
          ...initial,
          ...Object.fromEntries(
            fields
              .filter(([, , source]) => source)
              .map(([key, , source]) => [
                key,
                formatNumeroLocalizado(config[source] ?? 0),
              ]),
          ),
        };
        setDefaultValues(defaults);
        setValues(defaults);
      } else
        setWarning(
          "Não foi possível carregar os parâmetros padrão. Informe os custos manualmente.",
        );
      setLoading(false);
    }
    load();
    return () => controller.abort();
  }, [attempt]);

  let result = null;
  let validation = "";
  if (selected && values.peso !== "" && (values.horas !== "" || values.minutos !== "")) {
    try {
      result = calcularOrcamento(
        filamentos.find((item) => item._id === selected),
        Object.fromEntries(
          fields.map(([key]) => [key, parseNumeroLocalizado(values[key]) || 0]),
        ),
      );
    } catch (failure) {
      validation = failure.message;
    }
  }

  return (
    <div>
      <PageHeader
        title="Calculadora de orçamento"
        subtitle="Informe os dados da impressão e acompanhe a composição do preço."
      />
      {loading ? (
        <p role="status">Carregando filamentos e parâmetros...</p>
      ) : error ? (
        <div role="alert">
          <p>{error}</p>
          <Button onClick={() => setAttempt((value) => value + 1)}>
            Tentar novamente
          </Button>
        </div>
      ) : (
        <>
          {warning && (
            <p role="status" className="mb-4 text-warning">
              {warning}
            </p>
          )}
          {!filamentos.length ? (
            <p role="status">
              Nenhum filamento disponível.{" "}
              <Link to="/filamentos">Cadastre um filamento</Link> para calcular.
            </p>
          ) : (
            <div className="grid gap-5 lg:grid-cols-2">
              <CalculatorForm
                filamentos={filamentos}
                selected={selected}
                values={values}
                fields={fields}
                onSelectFilament={setSelected}
                onChangeValue={(key, value) => setValues(previous => ({ ...previous, [key]: value }))}
                onBlurValue={(key) => {
                  const number = parseNumeroLocalizado(values[key]);
                  if (Number.isFinite(number)) setValues(previous => ({ ...previous, [key]: formatNumeroLocalizado(number) }));
                }}
                onReset={() => {
                  setSelected("");
                  setValues({ ...defaultValues });
                }}
              />
              <CalculatorResult result={result} validation={validation} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
