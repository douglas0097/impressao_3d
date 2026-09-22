import mongoose from 'mongoose';

const filamentoSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  marca: { type: String },
  tipo_polimero: { type: String, required: true }, // ex: PLA, PETG
  cor: { type: String },
  peso_total_g: { type: Number, required: true },
  preco_pago: { type: Number, required: true },
  temperatura_bico: { type: Number },
  temperatura_mesa: { type: Number },
  estoque_gramas: { type: Number }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Calcula custo por grama (Virtual)
filamentoSchema.virtual('custo_por_grama').get(function() {
  if (!this.peso_total_g) return 0;
  return this.preco_pago / this.peso_total_g;
});

export default mongoose.model('Filamento', filamentoSchema);
