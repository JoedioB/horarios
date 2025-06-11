const { GrupoGeminado, Disciplina, Professor, Turma } = require('../models');

exports.list = async (req, res) => {
    const grupos = await GrupoGeminado.findAll({
        include: [
            { model: Disciplina },
            { model: Professor },
            { model: Turma, as: 'turmas', order: [['nome', 'ASC']] }
        ],
        order: [['nome', 'ASC']]
    });
    res.render('grupos-geminados', { title: 'Aulas Geminadas', grupos });
};

exports.createForm = async (req, res) => {
    const disciplinas = await Disciplina.findAll({ order: [['nome', 'ASC']] });
    const professores = await Professor.findAll({ order: [['nome', 'ASC']] });
    const turmas = await Turma.findAll({ order: [['nome', 'ASC']] });
    res.render('grupo-geminado-form', {
        title: 'Novo Grupo de Aulas Geminadas',
        disciplinas,
        professores,
        turmas
    });
};

exports.create = async (req, res) => {
    const { nome, disciplinaId, professorId, turmasIds } = req.body;
    try {
        const novoGrupo = await GrupoGeminado.create({ nome, disciplinaId, professorId });
        if (turmasIds && turmasIds.length > 0) {
            await novoGrupo.setTurmas(turmasIds);
        }
        res.redirect('/grupos-geminados');
    } catch (error) {
        res.status(500).send("Erro ao criar grupo: " + error.message);
    }
};

exports.delete = async (req, res) => {
    try {
        const grupo = await GrupoGeminado.findByPk(req.params.id);
        if (grupo) {
            await grupo.destroy();
        }
        res.redirect('/grupos-geminados');
    } catch (error) {
        res.status(500).send("Erro ao deletar grupo.");
    }
};