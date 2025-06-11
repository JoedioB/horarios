const express = require('express');
const router = express.Router();
const { Turma } = require('../models');

const professorRoutes = require('./professorRoutes');
const disciplinaRoutes = require('./disciplinaRoutes');
const turmaRoutes = require('./turmaRoutes');
const horarioRoutes = require('./horarioRoutes');
const grupoGeminadoRoutes = require('./grupoGeminadoRoutes'); // Importar
const analiseController = require('../controllers/analiseController'); // Importar


router.get('/analise', analiseController.showAnalise); // Adicionar a rota

// Página Inicial
router.get('/', async (req, res) => {
    const turmas = await Turma.findAll();
    res.render('index', { title: 'Página Inicial', turmas });
});

// Agrupando as rotas
router.use('/professores', professorRoutes);
router.use('/disciplinas', disciplinaRoutes);
router.use('/turmas', turmaRoutes);
router.use('/horarios', horarioRoutes);
router.use('/grupos-geminados', grupoGeminadoRoutes); // Registrar

module.exports = router;