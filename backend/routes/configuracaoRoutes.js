import express from 'express';
import { getConfiguracao, updateConfiguracao } from '../controllers/configuracaoController.js';

const router = express.Router();

router.get('/', getConfiguracao);
router.put('/', updateConfiguracao);

export default router;
