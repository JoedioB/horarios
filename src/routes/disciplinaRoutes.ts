import { Router } from 'express';
import * as disciplinaController from '../controllers/disciplinaController';

const router = Router();

router.get('/', disciplinaController.list);
router.get('/novo', disciplinaController.createForm);
router.post('/novo', disciplinaController.create);
router.get('/editar/:id', disciplinaController.editForm);
router.post('/editar/:id', disciplinaController.update);
router.post('/deletar/:id', disciplinaController.deleteDisciplina);

export default router;
