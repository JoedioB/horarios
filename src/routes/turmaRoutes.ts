import { Router } from 'express';
import * as turmaController from '../controllers/turmaController';

const router = Router();

// CRUD Básico
router.get('/', turmaController.list);
router.get('/novo', turmaController.createForm);
router.post('/novo', turmaController.create);
router.get('/editar/:id', turmaController.editForm);
router.post('/editar/:id', turmaController.update);
router.post('/deletar/:id', turmaController.destroy);

// Gerenciamento de Relacionamentos
router.get('/:id/disciplinas', turmaController.manageDisciplinasForm);
router.post('/:id/disciplinas', turmaController.updateDisciplinas);

export default router;
