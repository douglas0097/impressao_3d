import mongoose from 'mongoose';

const configuracaoSchema = new mongoose.Schema({
  custo_energia: { type: Number, default: 0.90 },
  taxa_manutencao: { type: Number, default: 5 },
  taxa_retrabalho_pct: { type: Number, default: 10 },
  margem_lucro_padrao_pct: { type: Number, default: 40 }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

configuracaoSchema.virtual('taxa_retrabalho').get(function() {
  return (this.taxa_retrabalho_pct / 100) + 1;
});


configuracaoSchema.virtual('margem_lucro_padrao').get(function() {
  return (this.margem_lucro_padrao_pct / 100) + 1;
});

export default mongoose.model('Configuracao', configuracaoSchema);
