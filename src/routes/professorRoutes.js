const express = require('express');
const router = express.Router();
const professorController = require('../controllers/professorController');

// CRUD Básico
router.get('/', professorController.list);
router.get('/novo', professorController.createForm);
router.post('/novo', professorController.create);
router.get('/editar/:id', professorController.editForm);
router.post('/editar/:id', professorController.update);
router.post('/deletar/:id', professorController.delete);

// Gerenciamento de Relacionamentos
router.get('/:id/disciplinas', professorController.manageDisciplinasForm);
router.post('/:id/disciplinas', professorController.updateDisciplinas);

router.get('/:id/disponibilidade', professorController.manageDisponibilidadeForm);
router.post('/:id/disponibilidade', professorController.addDisponibilidade);
router.post('/disponibilidade/deletar/:id', professorController.deleteDisponibilidade);

module.exports = router;