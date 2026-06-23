"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateDisciplinas = exports.manageDisciplinasForm = exports.destroy = exports.update = exports.editForm = exports.create = exports.createForm = exports.list = void 0;
const models_1 = require("../models");
const list = async (req, res) => {
    const turmas = await models_1.Turma.findAll({
        order: [['nome', 'ASC']]
    });
    res.render('turmas', { title: 'Turmas', turmas });
};
exports.list = list;
const createForm = (req, res) => {
    res.render('turma-form', { title: 'Nova Turma', turma: {} });
};
exports.createForm = createForm;
const create = async (req, res) => {
    await models_1.Turma.create(req.body);
    res.redirect('/turmas');
};
exports.create = create;
const editForm = async (req, res) => {
    const turma = await models_1.Turma.findByPk(req.params.id);
    res.render('turma-form', { title: 'Editar Turma', turma });
};
exports.editForm = editForm;
const update = async (req, res) => {
    const turma = await models_1.Turma.findByPk(req.params.id);
    if (turma) {
        await turma.update(req.body);
    }
    res.redirect('/turmas');
};
exports.update = update;
const destroy = async (req, res) => {
    const turma = await models_1.Turma.findByPk(req.params.id);
    if (turma) {
        await turma.destroy();
    }
    res.redirect('/turmas');
};
exports.destroy = destroy;
const manageDisciplinasForm = async (req, res) => {
    const turma = await models_1.Turma.findByPk(req.params.id, { include: [{ model: models_1.Disciplina, as: 'Disciplinas' }] });
    const todasDisciplinas = await models_1.Disciplina.findAll({
        order: [['nome', 'ASC']]
    });
    if (turma) {
        const idsDisciplinasDaTurma = turma.Disciplinas.map((d) => d.id);
        res.render('turma-disciplinas', {
            title: `Gerenciar Disciplinas da Turma ${turma.nome}`,
            turma,
            todasDisciplinas,
            idsDisciplinasDaTurma
        });
    }
    else {
        res.status(404).send('Turma não encontrada.');
    }
};
exports.manageDisciplinasForm = manageDisciplinasForm;
const updateDisciplinas = async (req, res) => {
    const turma = await models_1.Turma.findByPk(req.params.id);
    if (turma) {
        await turma.setDisciplinas(req.body.disciplinas || []);
    }
    res.redirect(`/turmas/${req.params.id}/disciplinas`);
};
exports.updateDisciplinas = updateDisciplinas;
