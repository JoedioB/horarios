import { Router, Request, Response } from 'express';
import { Turma } from '../models';

import professorRoutes from './professorRoutes';
import disciplinaRoutes from './disciplinaRoutes';
import turmaRoutes from './turmaRoutes';
import horarioRoutes from './horarioRoutes';
import grupoGeminadoRoutes from './grupoGeminadoRoutes';
import * as analiseController from '../controllers/analiseController';

const router = Router();

router.get('/analise', analiseController.showAnalise);

// Página Inicial
router.get('/', async (req: Request, res: Response) => {
    const turmas = await Turma.findAll();
    res.render('index', { title: 'Página Inicial', turmas });
});

// Agrupando as rotas
router.use('/professores', professorRoutes);
router.use('/disciplinas', disciplinaRoutes);
router.use('/turmas', turmaRoutes);
router.use('/horarios', horarioRoutes);
router.use('/grupos-geminados', grupoGeminadoRoutes);

export default router;
