import Input from '../../components/Input';
import Button from '../../components/Button';
import { useState, useEffect } from 'react';
import { FiZap, FiPercent, FiSave, FiSettings } from 'react-icons/fi';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import { formatNumeroLocalizado, parseNumeroLocalizado } from '../../utils/numeroLocalizado';

const sections = [
  {
    id: 'operacao',
    title: 'Custos operacionais por hora',
    description: 'Defina os custos de energia e manutenção cobrados por hora de impressão.',
    icon: FiZap,
    fields: [
      { name: 'custo_energia', label: 'Custo de energia (R$/hora)', hint: 'Custo de energia elétrica consumida por hora de impressão.', step: '0.01' },
      { name: 'taxa_manutencao', label: 'Taxa de manutenção (R$/hora)', hint: 'Custo de manutenção e desgaste da máquina por hora.', step: '0.01' },
    ],
  },
  {
    id: 'taxas',
    title: 'Taxas e margens',
    description: 'Ajuste os percentuais usados na formação dos orçamentos.',
    icon: FiPercent,
    fields: [
      { name: 'taxa_retrabalho_pct', label: 'Taxa de retrabalho (%)', hint: 'Percentual para cobrir perdas, suportes e reimpressões.', step: '0.01' },
      { name: 'margem_lucro_padrao_pct', label: 'Margem de lucro padrão (%)', hint: 'Margem de lucro aplicada sobre o custo total para sugerir o preço de venda.', step: '0.01' },
    ],
  },
];

const initialConfig = Object.fromEntries(sections.flatMap(section => section.fields.map(field => [field.name, ''])));
const settingsFields = sections.flatMap(section => section.fields);
const decimalsFor = field => field.step === '1' ? 0 : 2;

const Settings = () => {
  const [config, setConfig] = useState(initialConfig);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  async function fetchConfig() {
    setLoading(true);
    setLoadError('');
    try {
      const response = await api.get('/configuracoes');
      setConfig({
        ...response.data,
        ...Object.fromEntries(settingsFields.map(field => [field.name, formatNumeroLocalizado(response.data[field.name], decimalsFor(field))])),
      });
    } catch {
      setLoadError('Não foi possível carregar as configurações.');
    } finally {
      setLoading(false);
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    const field = settingsFields.find(field => field.name === name);
    const pattern = decimalsFor(field) === 0 ? /^[\d.]*$/ : /^[\d.]*(,\d{0,2})?$/;
    if (!pattern.test(value)) return;
    setConfig(prev => ({ ...prev, [name]: value }));
    setMessage(null);
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const field = settingsFields.find(field => field.name === name);
    const number = parseNumeroLocalizado(value);
    if (Number.isFinite(number)) {
      setConfig(prev => ({ ...prev, [name]: formatNumeroLocalizado(number, decimalsFor(field)) }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const numericConfig = Object.fromEntries(settingsFields.map(field => [field.name, parseNumeroLocalizado(config[field.name])]));
    if (Object.values(numericConfig).some(value => !Number.isFinite(value) || value < 0)) {
      setMessage({ type: 'error', text: 'Preencha todos os campos com valores válidos e não negativos.' });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      await api.put('/configuracoes', { ...config, ...numericConfig });
      setMessage({ type: 'success', text: 'Configurações atualizadas com sucesso!' });
    } catch {
      setMessage({ type: 'error', text: 'Erro ao atualizar configurações. Tente novamente.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Configurações"
        subtitle="Gerencie os parâmetros globais de custo usados nos seus orçamentos."
      />
      <form onSubmit={handleSubmit} className="overflow-hidden rounded-md border border-border bg-surface" aria-busy={loading}>
        <header className="flex items-center gap-3 border-b border-border px-5 py-5">
          <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand"><FiSettings size={20} /></span>
          <div>
            <h2 className="mb-0 text-base font-semibold">Parâmetros de custo</h2>
            <p className="mt-1 text-xs text-text-secondary">Personalize os valores para a sua operação de impressão 3D.</p>
          </div>
        </header>

        {loading || loadError ? (
          <div className="px-5 py-12 text-center">
            <p role="status" className="font-medium text-text-primary">{loading ? 'Carregando configurações...' : loadError}</p>
            {!loading && <Button onClick={fetchConfig} variant="outline" className="mt-4">Tentar novamente</Button>}
          </div>
        ) : (
          <>
            <fieldset disabled={saving} className="min-w-0 divide-y divide-border">
              {sections.map(({ id, title, description, icon: Icon, fields }) => (
                <section key={id} aria-labelledby={`settings-${id}`} className="px-5 py-6">
                  <div className="mb-5 flex items-start gap-3">
                    <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-hover text-brand"><Icon size={18} /></span>
                    <div>
                      <h3 id={`settings-${id}`} className="text-sm font-semibold">{title}</h3>
                      <p className="mt-1 text-xs text-text-secondary">{description}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                    {fields.map(field => (
                      <div key={field.name} className="min-w-0">
                        <label htmlFor={field.name} className="form-label text-text-primary font-semibold">{field.label}</label>
                        <Input
                          id={field.name}
                          type="text"
                          inputMode={decimalsFor(field) === 0 ? 'numeric' : 'decimal'}
                          pattern={decimalsFor(field) === 0 ? '[0-9]+(\\.[0-9]{3})*' : '[0-9]+(\\.[0-9]{3})*(,[0-9]{1,2})?'}
                          title={decimalsFor(field) === 0 ? 'Informe um número inteiro, como 250 ou 1.000.' : 'Use vírgula para os decimais, como 0,85 ou 1.234,56.'}
                          placeholder={decimalsFor(field) === 0 ? '0' : '0,00'}
                          name={field.name}
                          value={config[field.name] ?? ''}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          aria-describedby={`${field.name}-hint`}
                          required
                        />
                        <p id={`${field.name}-hint`} className="mt-2 text-xs text-text-secondary">{field.hint}</p>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </fieldset>
            <footer className="flex flex-col gap-4 border-t border-border bg-background/20 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-text-secondary" aria-live="polite" aria-atomic="true">
                {message ? <p role={message.type === 'error' ? 'alert' : 'status'} className={message.type === 'success' ? 'text-success' : 'text-danger'}>{message.text}</p> : <p>Salve para aplicar os parâmetros aos próximos orçamentos.</p>}
              </div>
              <Button type="submit" loading={saving} className="w-full sm:w-auto">
                {!saving && <FiSave size={16} aria-hidden="true" />}
                {saving ? 'Salvando...' : 'Salvar configurações'}
              </Button>
            </footer>
          </>
        )}
      </form>
    </div>
  );
};

export default Settings;
