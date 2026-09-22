import mongoose from 'mongoose';

const configuracaoSchema = new mongoose.Schema({
  custo_energia_kwh: { type: Number, default: 0.90 },
  potencia_impressora_w: { type: Number, default: 300 },
  custo_hora_impressao_adicional: { type: Number, default: 1.00 },
  taxa_manutencao_pct: { type: Number, default: 5 },
  taxa_retrabalho_pct: { type: Number, default: 10 },
  margem_lucro_padrao_pct: { type: Number, default: 40 }
}, { timestamps: true });

export default mongoose.model('Configuracao', configuracaoSchema);
