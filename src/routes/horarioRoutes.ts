import { Router } from 'express';
import * as horarioController from '../controllers/horarioController';

const router = Router();

router.post('/gerar', horarioController.gerar);
router.get('/turma/:id', horarioController.visualizarPorTurma);

// --- NOVAS ROTAS DE EXPORTAÇÃO ---
router.get('/turma/:id/exportar/excel', horarioController.exportarParaExcel);
router.get('/turma/:id/exportar/pdf', horarioController.exportarParaPDF);

export default router;
