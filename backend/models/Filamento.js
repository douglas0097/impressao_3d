import mongoose from 'mongoose';

const filamentoSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  marca: { type: String },
  tipo_polimero: { type: String, required: true }, // ex: PLA, PETG
  cor: { type: String },
  peso_total_g: { type: Number, min: 0 },
  preco_pago: { type: Number, min: 0 },
  preco_kg: { type: Number, min: 0 },
  temperatura_bico: { type: Number },
  temperatura_mesa: { type: Number },
  estoque_gramas: { type: Number }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual para custo por grama
filamentoSchema.virtual('custo_por_grama').get(function() {
  const preco = this.preco_kg != null ? this.preco_kg : (this.peso_total_g > 0 && this.preco_pago != null ? this.preco_pago * 1000 / this.peso_total_g : 0);
  return preco / 1000;
});


export default mongoose.model('Filamento', filamentoSchema);
