"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.destroy = exports.create = exports.createForm = exports.list = void 0;
const models_1 = require("../models");
const list = async (req, res) => {
    const grupos = await models_1.GrupoGeminado.findAll({
        include: [
            { model: models_1.Disciplina },
            { model: models_1.Professor },
            { model: models_1.Turma, as: 'turmas' }
        ],
        order: [['nome', 'ASC']]
    });
    res.render('grupos-geminados', { title: 'Aulas Geminadas', grupos });
};
exports.list = list;
const createForm = async (req, res) => {
    const disciplinas = await models_1.Disciplina.findAll({ order: [['nome', 'ASC']] });
    const professores = await models_1.Professor.findAll({ order: [['nome', 'ASC']] });
    const turmas = await models_1.Turma.findAll({ order: [['nome', 'ASC']] });
    res.render('grupo-geminado-form', {
        title: 'Novo Grupo de Aulas Geminadas',
        disciplinas,
        professores,
        turmas
    });
};
exports.createForm = createForm;
const create = async (req, res) => {
    const { nome, disciplinaId, professorId, turmasIds } = req.body;
    try {
        const novoGrupo = await models_1.GrupoGeminado.create({ nome, disciplinaId, professorId });
        if (turmasIds && turmasIds.length > 0) {
            await novoGrupo.setTurmas(turmasIds);
        }
        res.redirect('/grupos-geminados');
    }
    catch (error) {
        res.status(500).send("Erro ao criar grupo: " + error.message);
    }
};
exports.create = create;
const destroy = async (req, res) => {
    try {
        const grupo = await models_1.GrupoGeminado.findByPk(req.params.id);
        if (grupo) {
            await grupo.destroy();
        }
        res.redirect('/grupos-geminados');
    }
    catch (error) {
        res.status(500).send("Erro ao deletar grupo.");
    }
};
exports.destroy = destroy;
