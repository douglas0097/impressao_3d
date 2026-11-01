import { useEffect, useState } from 'react';
import Modal from '../../components/Modal';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { formatMoney } from './orderValues';

export default function OrderExtraModal({ isOpen, onClose, onConfirm, initial = null }) {
  const isEditing = Boolean(initial);

  const [nome, setNome] = useState(initial?.nome ?? '');
  const [precoUnitario, setPrecoUnitario] = useState(initial?.preco_unitario ?? '');
  const [quantidade, setQuantidade] = useState(initial?.quantidade ?? 1);
  const [validation, setValidation] = useState('');

  useEffect(() => {
    if (isOpen) {
      setNome(initial?.nome ?? '');
      setPrecoUnitario(initial?.preco_unitario ?? '');
      setQuantidade(initial?.quantidade ?? 1);
      setValidation('');
    }
  }, [isOpen, initial]);

  const unitPriceNum = Number(precoUnitario);
  const qtyNum = Number(quantidade);
  const totalCost = (Number.isFinite(unitPriceNum) && unitPriceNum >= 0 && Number.isInteger(qtyNum) && qtyNum >= 1)
    ? Number((unitPriceNum * qtyNum).toFixed(2))
    : 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nome.trim()) {
      return setValidation('Informe o nome ou identificação do produto extra.');
    }
    if (!Number.isFinite(unitPriceNum) || unitPriceNum < 0) {
      return setValidation('Informe um preço unitário válido maior ou igual a zero.');
    }
    if (!Number.isInteger(qtyNum) || qtyNum < 1) {
      return setValidation('A quantidade deve ser um número inteiro maior ou igual a 1.');
    }

    onConfirm({
      _id: initial?._id,
      nome: nome.trim(),
      preco_unitario: unitPriceNum,
      quantidade: qtyNum,
      custo_total: totalCost
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Produto Extra' : 'Adicionar Produto Extra'}
      maxWidth="500px"
      zIndexClass="z-[60]"
    >
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div className="form-group">
            <label htmlFor="extra-nome" className="form-label">Nome do produto extra *</label>
            <Input
              id="extra-nome"
              required
              placeholder="Ex: LED azul 5mm, Parafuso M3x10, Motor de passo"
              value={nome}
              onChange={e => { setNome(e.target.value); setValidation(''); }}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="form-group">
              <label htmlFor="extra-preco" className="form-label">Preço unitário (R$) *</label>
              <Input
                id="extra-preco"
                type="number"
                min="0"
                step="0.01"
                required
                placeholder="0.00"
                value={precoUnitario}
                onChange={e => { setPrecoUnitario(e.target.value); setValidation(''); }}
              />
            </div>

            <div className="form-group">
              <label htmlFor="extra-quantidade" className="form-label">Quantidade *</label>
              <Input
                id="extra-quantidade"
                type="number"
                min={1}
                step={1}
                required
                value={quantidade}
                onChange={e => { setQuantidade(e.target.value); setValidation(''); }}
              />
            </div>
          </div>

          {/* Destaque do cálculo automático do custo total do extra */}
          <div className="rounded-lg border border-border bg-background p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-text-secondary block">Custo total do extra</span>
              <span className="text-xs text-text-muted">Preço unitário × Quantidade</span>
            </div>
            <span className="text-lg font-bold text-brand">
              {formatMoney(totalCost)}
            </span>
          </div>

          <p className="text-xs text-text-muted">
            ℹ️ Produtos extras representam itens adquiridos externamente que complementam o pedido e não passam por impressão 3D.
          </p>
        </div>

        {validation && <p role="alert" className="mt-4 text-xs font-medium text-danger">{validation}</p>}

        <div className="mt-6 flex items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary">
            {isEditing ? 'Salvar Extra' : 'Adicionar ao Pedido'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
