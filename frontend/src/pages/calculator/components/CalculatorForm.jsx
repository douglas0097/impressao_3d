import Input from "../../../components/Input";
import Select from "../../../components/Select";
import Button from "../../../components/Button";
import { parseNumeroLocalizado } from "../../../utils/numeroLocalizado";

export default function CalculatorForm({ filamentos, selected, values, fields, onSelectFilament, onChangeValue, onBlurValue, onReset }) {
  return (
    <section
      className="rounded-md border border-border bg-surface p-5"
      aria-labelledby="calculator-data"
    >
      <h2
        id="calculator-data"
        className="mb-2 text-base font-semibold"
      >
        Dados e custos da impressão
      </h2>
      <p className="mb-5 text-xs text-text-secondary">
        Peso, tempo e mão de obra devem representar o lote inteiro.
        Use zero nos custos opcionais que não deseja incluir.
      </p>
      <label htmlFor="calculator-filament" className="form-label">
        Filamento
      </label>
      <Select
        id="calculator-filament"
        value={selected}
        onChange={(event) => onSelectFilament(event.target.value)}
      >
        <option value="">Selecione um filamento</option>
        {filamentos.map((item) => (
          <option key={item._id} value={item._id}>
            {item.nome} — {item.tipo_polimero}
          </option>
        ))}
      </Select>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {fields.map(([key, label]) => (
          <div key={key}>
            <label
              htmlFor={`calculator-${key}`}
              className="form-label"
            >
              {label}
            </label>
            <Input
              id={`calculator-${key}`}
              inputMode="decimal"
              value={values[key]}
              placeholder="0,00"
              onChange={(event) => onChangeValue(key, event.target.value)}
              onBlur={() => onBlurValue(key)}
              aria-invalid={
                values[key] !== "" &&
                !Number.isFinite(parseNumeroLocalizado(values[key]))
              }
              aria-describedby="calculator-format"
            />
          </div>
        ))}
      </div>
      <p
        id="calculator-format"
        className="mt-4 text-xs text-text-secondary"
      >
        Use vírgula para decimais (ex.: 1,50 hora = 1h30). Lucro
        calculado como acréscimo sobre o custo. Manutenção e
        retrabalho incidem sobre filamento, energia e máquina.
      </p>
      <p className="mt-3 text-xs text-text-secondary">
        Os ajustes valem apenas para esta simulação.
      </p>
      <Button
        variant="outline"
        className="mt-4"
        onClick={onReset}
      >
        Limpar simulação
      </Button>
    </section>
  );
}
