import { Router } from 'express';
import * as grupoGeminadoController from '../controllers/grupoGeminadoController';

const router = Router();

router.get('/', grupoGeminadoController.list);
router.get('/novo', grupoGeminadoController.createForm);
router.post('/novo', grupoGeminadoController.create);
router.post('/deletar/:id', grupoGeminadoController.destroy);

export default router;
