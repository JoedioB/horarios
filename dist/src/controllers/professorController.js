"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteDisponibilidade = exports.addDisponibilidade = exports.manageDisponibilidadeForm = exports.updateDisciplinas = exports.manageDisciplinasForm = exports.destroy = exports.update = exports.editForm = exports.create = exports.createForm = exports.list = void 0;
const models_1 = require("../models");
const list = async (req, res) => {
    const professores = await models_1.Professor.findAll({
        order: [['nome', 'ASC']]
    });
    res.render('professores', { title: 'Professores', professores });
};
exports.list = list;
const createForm = (req, res) => {
    res.render('professor-form', { title: 'Novo Professor', professor: {} });
};
exports.createForm = createForm;
const create = async (req, res) => {
    try {
        await models_1.Professor.create(req.body);
        res.redirect('/professores');
    }
    catch (error) {
        res.status(500).send("Erro ao criar professor: " + error.message);
    }
};
exports.create = create;
const editForm = async (req, res) => {
    const professor = await models_1.Professor.findByPk(req.params.id);
    if (professor) {
        res.render('professor-form', { title: 'Editar Professor', professor });
    }
    else {
        res.status(404).send('Professor não encontrado.');
    }
};
exports.editForm = editForm;
const update = async (req, res) => {
    try {
        const professor = await models_1.Professor.findByPk(req.params.id);
        if (professor) {
            await professor.update(req.body);
            res.redirect('/professores');
        }
        else {
            res.status(404).send('Professor não encontrado.');
        }
    }
    catch (error) {
        res.status(500).send("Erro ao atualizar professor: " + error.message);
    }
};
exports.update = update;
const destroy = async (req, res) => {
    try {
        const professor = await models_1.Professor.findByPk(req.params.id);
        if (professor) {
            await professor.destroy();
            res.redirect('/professores');
        }
        else {
            res.status(404).send('Professor não encontrado.');
        }
    }
    catch (error) {
        res.status(500).send("Erro ao deletar professor. Verifique se ele não está associado a horários existentes.");
    }
};
exports.destroy = destroy;
const manageDisciplinasForm = async (req, res) => {
    const professor = await models_1.Professor.findByPk(req.params.id, {
        include: [{ model: models_1.Disciplina, as: 'disciplinas' }]
    });
    const todasDisciplinas = await models_1.Disciplina.findAll({
        order: [['nome', 'ASC']]
    });
    if (professor) {
        const idsDisciplinasDoProfessor = professor.disciplinas.map((d) => d.id);
        res.render('professor-disciplinas', {
            title: `Gerenciar Disciplinas de ${professor.nome}`,
            professor,
            todasDisciplinas,
            idsDisciplinasDoProfessor
        });
    }
    else {
        res.status(404).send('Professor não encontrado.');
    }
};
exports.manageDisciplinasForm = manageDisciplinasForm;
const updateDisciplinas = async (req, res) => {
    const professor = await models_1.Professor.findByPk(req.params.id);
    if (professor) {
        await professor.setDisciplinas(req.body.disciplinas || []);
    }
    res.redirect(`/professores/${req.params.id}/disciplinas`);
};
exports.updateDisciplinas = updateDisciplinas;
const manageDisponibilidadeForm = async (req, res) => {
    const professor = await models_1.Professor.findByPk(req.params.id, {
        include: { model: models_1.DisponibilidadeProfessor, as: 'disponibilidades' },
        order: [[{ model: models_1.DisponibilidadeProfessor, as: 'disponibilidades' }, 'dia_semana', 'ASC']]
    });
    if (professor) {
        const dias = { 1: 'Segunda', 2: 'Terça', 3: 'Quarta', 4: 'Quinta', 5: 'Sexta' };
        res.render('professor-disponibilidade', { title: 'Disponibilidade', professor, dias });
    }
    else {
        res.status(404).send('Professor não encontrado.');
    }
};
exports.manageDisponibilidadeForm = manageDisponibilidadeForm;
const addDisponibilidade = async (req, res) => {
    const { dia_semana, hora_inicio, hora_fim } = req.body;
    await models_1.DisponibilidadeProfessor.create({
        professorId: parseInt(req.params.id, 10),
        dia_semana,
        hora_inicio,
        hora_fim
    });
    res.redirect(`/professores/${req.params.id}/disponibilidade`);
};
exports.addDisponibilidade = addDisponibilidade;
const deleteDisponibilidade = async (req, res) => {
    const disponibilidade = await models_1.DisponibilidadeProfessor.findByPk(req.params.id);
    if (disponibilidade) {
        const professorId = disponibilidade.professorId;
        await disponibilidade.destroy();
        res.redirect(`/professores/${professorId}/disponibilidade`);
    }
    else {
        res.status(404).send('Disponibilidade não encontrada.');
    }
};
exports.deleteDisponibilidade = deleteDisponibilidade;
