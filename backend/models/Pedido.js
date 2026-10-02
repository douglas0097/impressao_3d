import mongoose from 'mongoose';

const pedidoSchema = new mongoose.Schema({
  cliente_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Cliente', required: true },
  nome_peca: { type: String, required: true },
  link_modelo: { type: String },
  filamento_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Filamento', required: true },
  quantidade_pecas: { type: Number, default: 1 },
  peso_estimado_g: { type: Number, required: true },
  tempo_estimado_horas: { type: Number, required: true },
  
  // Valores financeiros salvos no momento do pedido (snapshot)
  custo_filamento: { type: Number },
  custo_tempo_impressao: { type: Number },
  custo_total_sem_lucro: { type: Number },
  preco_sugerido: { type: Number },
  preco_custo: { type: Number },
  preco_final_cobrado: { type: Number },

  // Status
  status: { 
    type: String, 
    enum: ['ORCAMENTO', 'APROVADO', 'EM_IMPRESSAO', 'CONCLUIDO', 'ENTREGUE', 'CANCELADO'],
    default: 'ORCAMENTO'
  },
  
  // Pagamento
  status_pagamento: {
    type: String,
    enum: ['PENDENTE', 'SINAL_50', 'PAGO'],
    default: 'PENDENTE'
  },
  valor_sinal: { type: Number, default: 0 }

}, { timestamps: true });

export default mongoose.model('Pedido', pedidoSchema);
