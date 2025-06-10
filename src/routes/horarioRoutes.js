const express = require('express');
const router = express.Router();
const horarioController = require('../controllers/horarioController');

router.post('/gerar', horarioController.gerar);
router.get('/turma/:id', horarioController.visualizarPorTurma);

module.exports = router;