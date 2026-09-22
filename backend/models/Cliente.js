import mongoose from 'mongoose';

const clienteSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  telefone: { type: String }, // usado para gerar link wa.me
  instagram: { type: String },
  observacoes: { type: String }
}, { timestamps: true });

export default mongoose.model('Cliente', clienteSchema);
