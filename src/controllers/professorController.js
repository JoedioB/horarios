const { Professor, Disciplina, DisponibilidadeProfessor } = require('../models');

exports.list = async (req, res) => {
    const professores = await Professor.findAll({
        order: [['nome', 'ASC']]
    });
    res.render('professores', { title: 'Professores', professores });
};

exports.createForm = (req, res) => {
    res.render('professor-form', { title: 'Novo Professor', professor: {} });
};

exports.create = async (req, res) => {
    try {
        await Professor.create(req.body);
        res.redirect('/professores');
    } catch (error) {
        res.status(500).send("Erro ao criar professor: " + error.message);
    }
};

exports.editForm = async (req, res) => {
    const professor = await Professor.findByPk(req.params.id);
    if (professor) {
        res.render('professor-form', { title: 'Editar Professor', professor });
    } else {
        res.status(404).send('Professor não encontrado.');
    }
};

exports.update = async (req, res) => {
    try {
        const professor = await Professor.findByPk(req.params.id);
        if (professor) {
            await professor.update(req.body);
            res.redirect('/professores');
        } else {
            res.status(404).send('Professor não encontrado.');
        }
    } catch (error) {
        res.status(500).send("Erro ao atualizar professor: " + error.message);
    }
};

exports.delete = async (req, res) => {
    try {
        const professor = await Professor.findByPk(req.params.id);
        if (professor) {
            await professor.destroy();
            res.redirect('/professores');
        } else {
            res.status(404).send('Professor não encontrado.');
        }
    } catch (error) {
        res.status(500).send("Erro ao deletar professor. Verifique se ele não está associado a horários existentes.");
    }
};

exports.manageDisciplinasForm = async (req, res) => {
    const professor = await Professor.findByPk(req.params.id, {
        include: [{ model: Disciplina, as: 'disciplinas' }]
    });
    
    const todasDisciplinas = await Disciplina.findAll({
        order: [['nome', 'ASC']]
    });

    if (professor) {
        const idsDisciplinasDoProfessor = professor.disciplinas.map(d => d.id);
        res.render('professor-disciplinas', {
            title: `Gerenciar Disciplinas de ${professor.nome}`,
            professor,
            todasDisciplinas,
            idsDisciplinasDoProfessor
        });
    } else {
        res.status(404).send('Professor não encontrado.');
    }
};

exports.updateDisciplinas = async (req, res) => {
    const professor = await Professor.findByPk(req.params.id);
    await professor.setDisciplinas(req.body.disciplinas || []);
    res.redirect(`/professores/${req.params.id}/disciplinas`);
};

exports.manageDisponibilidadeForm = async (req, res) => {
    const professor = await Professor.findByPk(req.params.id, {
        include: { model: DisponibilidadeProfessor, as: 'disponibilidades' },
        order: [[{ model: DisponibilidadeProfessor, as: 'disponibilidades' }, 'dia_semana', 'ASC']]
    });

    if (professor) {
        const dias = { 1: 'Segunda', 2: 'Terça', 3: 'Quarta', 4: 'Quinta', 5: 'Sexta' };
        res.render('professor-disponibilidade', { title: 'Disponibilidade', professor, dias });
    } else {
        res.status(404).send('Professor não encontrado.');
    }
};

exports.addDisponibilidade = async (req, res) => {
    const { dia_semana, hora_inicio, hora_fim } = req.body;
    await DisponibilidadeProfessor.create({
        professorId: req.params.id,
        dia_semana,
        hora_inicio,
        hora_fim
    });
    res.redirect(`/professores/${req.params.id}/disponibilidade`);
};

exports.deleteDisponibilidade = async (req, res) => {
    const disponibilidade = await DisponibilidadeProfessor.findByPk(req.params.id);
    const professorId = disponibilidade.professorId;
    await disponibilidade.destroy();
    res.redirect(`/professores/${professorId}/disponibilidade`);
};