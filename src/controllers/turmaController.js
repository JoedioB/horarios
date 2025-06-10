const { Turma, Disciplina } = require('../models');

exports.list = async (req, res) => {
    const turmas = await Turma.findAll({
        order: [['nome', 'ASC']]
    });
    res.render('turmas', { title: 'Turmas', turmas });
};

exports.createForm = (req, res) => {
    res.render('turma-form', { title: 'Nova Turma', turma: {} });
};

exports.create = async (req, res) => {
    await Turma.create(req.body);
    res.redirect('/turmas');
};

exports.editForm = async (req, res) => {
    const turma = await Turma.findByPk(req.params.id);
    res.render('turma-form', { title: 'Editar Turma', turma });
};

exports.update = async (req, res) => {
    const turma = await Turma.findByPk(req.params.id);
    await turma.update(req.body);
    res.redirect('/turmas');
};

exports.delete = async (req, res) => {
    const turma = await Turma.findByPk(req.params.id);
    await turma.destroy();
    res.redirect('/turmas');
};

exports.manageDisciplinasForm = async (req, res) => {
    const turma = await Turma.findByPk(req.params.id, { include: { model: Disciplina, as: 'Disciplinas' } });
    const todasDisciplinas = await Disciplina.findAll({
        order: [['nome', 'ASC']]
    });

    if (turma) {
        const idsDisciplinasDaTurma = turma.Disciplinas.map(d => d.id);
        res.render('turma-disciplinas', {
            title: `Gerenciar Disciplinas da Turma ${turma.nome}`,
            turma,
            todasDisciplinas,
            idsDisciplinasDaTurma
        });
    } else {
        res.status(404).send('Turma não encontrada.');
    }
};

exports.updateDisciplinas = async (req, res) => {
    const turma = await Turma.findByPk(req.params.id);
    await turma.setDisciplinas(req.body.disciplinas || []);
    res.redirect(`/turmas/${req.params.id}/disciplinas`);
};