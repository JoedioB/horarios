const { Disciplina } = require('../models');

exports.list = async (req, res) => {
    const disciplinas = await Disciplina.findAll({
        order: [['nome', 'ASC']]
    });
    res.render('disciplinas', { title: 'Disciplinas', disciplinas });
};

exports.createForm = (req, res) => {
    res.render('disciplina-form', { title: 'Nova Disciplina', disciplina: {} });
};

exports.create = async (req, res) => {
    await Disciplina.create(req.body);
    res.redirect('/disciplinas');
};

exports.editForm = async (req, res) => {
    const disciplina = await Disciplina.findByPk(req.params.id);
    res.render('disciplina-form', { title: 'Editar Disciplina', disciplina });
};

exports.update = async (req, res) => {
    const disciplina = await Disciplina.findByPk(req.params.id);
    await disciplina.update(req.body);
    res.redirect('/disciplinas');
};

exports.delete = async (req, res) => {
    const disciplina = await Disciplina.findByPk(req.params.id);
    await disciplina.destroy();
    res.redirect('/disciplinas');
};