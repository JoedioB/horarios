const express = require('express');
const router = express.Router();
const { Turma } = require('../models');

const professorRoutes = require('./professorRoutes');
const disciplinaRoutes = require('./disciplinaRoutes');
const turmaRoutes = require('./turmaRoutes');
const horarioRoutes = require('./horarioRoutes');

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

module.exports = router;