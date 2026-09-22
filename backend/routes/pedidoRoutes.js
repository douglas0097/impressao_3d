import express from 'express';
import { getPedidos, createPedido, updatePedido, deletePedido, calcularOrcamento } from '../controllers/pedidoController.js';

const router = express.Router();

router.get('/', getPedidos);
router.post('/', createPedido);
router.post('/calcular', calcularOrcamento);
router.put('/:id', updatePedido);
router.delete('/:id', deletePedido);

export default router;
