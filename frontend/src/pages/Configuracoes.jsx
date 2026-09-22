import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Configuracoes = () => {
  const [config, setConfig] = useState({
    custo_energia_kwh: '',
    potencia_impressora_w: '',
    custo_hora_impressao_adicional: '',
    taxa_manutencao_pct: '',
    taxa_retrabalho_pct: '',
    margem_lucro_padrao_pct: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await api.get('/configuracoes');
      setConfig(response.data);
    } catch (error) {
      console.error('Erro ao buscar configs', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setConfig(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await api.put('/configuracoes', config);
      setMessage('Configurações atualizadas com sucesso!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Erro ao atualizar configurações.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ color: 'white' }}>Carregando...</div>;

  return (
    <div>
      <h1>Parâmetros Globais de Custo</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
        Ajuste as taxas que serão usadas pelo motor de orçamentos.
      </p>

      <div className="glass-card" style={{ maxWidth: '800px' }}>
        <form onSubmit={handleSubmit}>
          
          <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Energia e Máquina</h3>
          <div className="grid-cols-4">
            <div className="form-group">
              <label className="form-label">Custo Energia (R$/kWh)</label>
              <input type="number" step="0.01" name="custo_energia_kwh" value={config.custo_energia_kwh} onChange={handleChange} className="form-input" required />
            </div>
            <div className="form-group">
              <label className="form-label">Potência da Impressora (W)</label>
              <input type="number" name="potencia_impressora_w" value={config.potencia_impressora_w} onChange={handleChange} className="form-input" required />
            </div>
            <div className="form-group">
              <label className="form-label">Custo Fixo Extra (R$/hora)</label>
              <input type="number" step="0.01" name="custo_hora_impressao_adicional" value={config.custo_hora_impressao_adicional} onChange={handleChange} className="form-input" required />
            </div>
          </div>

          <h3 style={{ margin: '1.5rem 0 1rem', color: 'var(--primary)' }}>Taxas e Margens (%)</h3>
          <div className="grid-cols-4">
            <div className="form-group">
              <label className="form-label">Taxa Manutenção (%)</label>
              <input type="number" step="0.01" name="taxa_manutencao_pct" value={config.taxa_manutencao_pct} onChange={handleChange} className="form-input" required />
            </div>
            <div className="form-group">
              <label className="form-label">Taxa Retrabalho (%)</label>
              <input type="number" step="0.01" name="taxa_retrabalho_pct" value={config.taxa_retrabalho_pct} onChange={handleChange} className="form-input" required />
            </div>
            <div className="form-group">
              <label className="form-label">Margem de Lucro Padrão (%)</label>
              <input type="number" step="0.01" name="margem_lucro_padrao_pct" value={config.margem_lucro_padrao_pct} onChange={handleChange} className="form-input" required />
            </div>
          </div>

          <div style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar Configurações'}
            </button>
            {message && <span className="text-success">{message}</span>}
          </div>
        </form>
      </div>
    </div>
  );
};

export default Configuracoes;
