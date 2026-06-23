"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteDisciplina = exports.update = exports.editForm = exports.create = exports.createForm = exports.list = void 0;
const models_1 = require("../models");
const list = async (req, res) => {
    const disciplinas = await models_1.Disciplina.findAll({
        order: [['nome', 'ASC']]
    });
    res.render('disciplinas', { title: 'Disciplinas', disciplinas });
};
exports.list = list;
const createForm = (req, res) => {
    res.render('disciplina-form', { title: 'Nova Disciplina', disciplina: {} });
};
exports.createForm = createForm;
const create = async (req, res) => {
    await models_1.Disciplina.create(req.body);
    res.redirect('/disciplinas');
};
exports.create = create;
const editForm = async (req, res) => {
    const disciplina = await models_1.Disciplina.findByPk(req.params.id);
    res.render('disciplina-form', { title: 'Editar Disciplina', disciplina });
};
exports.editForm = editForm;
const update = async (req, res) => {
    const disciplina = await models_1.Disciplina.findByPk(req.params.id);
    if (disciplina) {
        await disciplina.update(req.body);
    }
    res.redirect('/disciplinas');
};
exports.update = update;
const deleteDisciplina = async (req, res) => {
    const disciplina = await models_1.Disciplina.findByPk(req.params.id);
    if (disciplina) {
        await disciplina.destroy();
    }
    res.redirect('/disciplinas');
};
exports.deleteDisciplina = deleteDisciplina;
