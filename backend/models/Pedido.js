import mongoose from 'mongoose';

const pecaSchema = new mongoose.Schema({
  nome_peca: { type: String, required: true },
  link_modelo: { type: String, default: '' },
  filamento_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Filamento', required: true },
  quantidade: { type: Number, default: 1, min: 1 },
  peso_total_g: { type: Number, required: true, min: 0.01 },
  tempo_horas: { type: Number, default: 0, min: 0 },
  tempo_minutos: { type: Number, default: 0, min: 0, max: 59 },
  tempo_total_horas: { type: Number, required: true, min: 0 },
  
  // Valores financeiros salvos no momento do pedido (snapshot da peça)
  custo_filamento: { type: Number, default: 0 },
  custo_tempo_impressao: { type: Number, default: 0 },
  preco_custo: { type: Number, default: 0 },
  custo_total_sem_lucro: { type: Number, default: 0 },
  preco_sugerido: { type: Number, default: 0 }
}, { _id: true });

const extraSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  preco_unitario: { type: Number, required: true, min: 0 },
  quantidade: { type: Number, required: true, min: 1 },
  custo_total: { type: Number, required: true, min: 0 }
}, { _id: true });

const configuracaoSnapshotSchema = new mongoose.Schema({
  custo_energia: { type: Number },
  taxa_manutencao: { type: Number },
  taxa_retrabalho_pct: { type: Number },
  margem_lucro_padrao_pct: { type: Number }
}, { _id: false });

const pedidoSchema = new mongoose.Schema({
  cliente_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Cliente', required: true },
  
  // Itens do pedido (peças impressas em 3D e produtos extras)
  pecas: { type: [pecaSchema], default: [] },
  extras: { type: [extraSchema], default: [] },

  // Histórico das configurações padrão utilizadas no momento da criação (snapshot imutável)
  configuracao_snapshot: {
    type: configuracaoSnapshotSchema,
    default: null
  },

  // Consolidação financeira do pedido
  custo_filamento: { type: Number, default: 0 },
  custo_tempo_impressao: { type: Number, default: 0 },
  preco_custo_pecas: { type: Number, default: 0 },
  custo_total_sem_lucro_pecas: { type: Number, default: 0 },
  preco_sugerido_pecas: { type: Number, default: 0 },
  custo_total_extras: { type: Number, default: 0 },
  custo_total_sem_lucro: { type: Number, default: 0 },
  preco_custo: { type: Number, default: 0 },
  preco_sugerido: { type: Number, default: 0 },
  preco_final_cobrado: { type: Number },

  // Campos legados para compatibilidade com registros antigos e filtros
  nome_peca: { type: String },
  link_modelo: { type: String, default: '' },
  filamento_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Filamento' },
  quantidade_pecas: { type: Number, default: 1 },
  peso_estimado_g: { type: Number, default: 0 },
  tempo_estimado_horas: { type: Number, default: 0 },

  // Status operacional
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

}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

pedidoSchema.virtual('configuracoes_utilizadas').get(function() {
  return this.configuracao_snapshot;
});

// Garante que pedidos legados sem o array `pecas` gerem o item automaticamente
pedidoSchema.post('init', function() {
  if ((!this.pecas || this.pecas.length === 0) && this.nome_peca && this.filamento_id) {
    const horas = Math.floor(this.tempo_estimado_horas || 0);
    const minutos = Math.round(((this.tempo_estimado_horas || 0) % 1) * 60);
    this.pecas = [{
      _id: this._id,
      nome_peca: this.nome_peca,
      link_modelo: this.link_modelo || '',
      filamento_id: this.filamento_id,
      quantidade: this.quantidade_pecas || 1,
      peso_total_g: this.peso_estimado_g || 0,
      tempo_horas: horas,
      tempo_minutos: minutos,
      tempo_total_horas: this.tempo_estimado_horas || 0,
      custo_filamento: this.custo_filamento || 0,
      custo_tempo_impressao: this.custo_tempo_impressao || 0,
      preco_custo: this.preco_custo || 0,
      custo_total_sem_lucro: this.custo_total_sem_lucro || 0,
      preco_sugerido: this.preco_sugerido || 0
    }];
  }
});

export default mongoose.model('Pedido', pedidoSchema);
