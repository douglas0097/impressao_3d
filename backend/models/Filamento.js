import mongoose from 'mongoose';

const filamentoSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  marca: { type: String },
  tipo_polimero: { type: String, required: true }, // ex: PLA, PETG
  cor: { type: String },
  peso_total_g: { type: Number, required: true },
  preco_kg: { type: Number },
  preco_pago: { type: Number },
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
  const preco = this.preco_kg != null ? this.preco_kg : (this.preco_pago ?? 0);
  return preco / 1000;
});

filamentoSchema.pre('save', function() {
  if (this.preco_kg == null && this.preco_pago != null) {
    this.preco_kg = this.preco_pago;
  }
  if (this.preco_pago == null && this.preco_kg != null) {
    this.preco_pago = this.preco_kg;
  }
});

export default mongoose.model('Filamento', filamentoSchema);
