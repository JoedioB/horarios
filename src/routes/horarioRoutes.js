// src/routes/horarioRoutes.js
const express = require('express');
const router = express.Router();
const horarioController = require('../controllers/horarioController');

router.post('/gerar', horarioController.gerar);
router.get('/turma/:id', horarioController.visualizarPorTurma);

// --- NOVAS ROTAS DE EXPORTAÇÃO ---
router.get('/turma/:id/exportar/excel', horarioController.exportarParaExcel);
router.get('/turma/:id/exportar/pdf', horarioController.exportarParaPDF);

module.exports = router;