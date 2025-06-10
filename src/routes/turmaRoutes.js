const express = require('express');
const router = express.Router();
const turmaController = require('../controllers/turmaController');

// CRUD Básico
router.get('/', turmaController.list);
router.get('/novo', turmaController.createForm);
router.post('/novo', turmaController.create);
router.get('/editar/:id', turmaController.editForm);
router.post('/editar/:id', turmaController.update);
router.post('/deletar/:id', turmaController.delete);

// Gerenciamento de Relacionamentos
router.get('/:id/disciplinas', turmaController.manageDisciplinasForm);
router.post('/:id/disciplinas', turmaController.updateDisciplinas);

module.exports = router;