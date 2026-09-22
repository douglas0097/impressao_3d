import express from 'express';
import { getFilamentos, createFilamento, updateFilamento, deleteFilamento } from '../controllers/filamentoController.js';

const router = express.Router();

router.get('/', getFilamentos);
router.post('/', createFilamento);
router.put('/:id', updateFilamento);
router.delete('/:id', deleteFilamento);

export default router;
