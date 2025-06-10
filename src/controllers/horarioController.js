const geradorHorarioService = require('../services/geradorHorarioService');
const { Horario, Turma, Disciplina, Professor } = require('../models');

const SLOTS = [
    { inicio: '08:00:00', fim: '08:45:00' }, { inicio: '08:45:00', fim: '09:30:00' },
    { inicio: '09:45:00', fim: '10:30:00' }, { inicio: '10:30:00', fim: '11:15:00' }, { inicio: '11:15:00', fim: '12:00:00' },
    { inicio: '13:00:00', fim: '13:45:00' }, { inicio: '13:45:00', fim: '14:30:00' }, { inicio: '14:30:00', fim: '15:15:00' },
    { inicio: '15:30:00', fim: '16:15:00' }, { inicio: '16:15:00', fim: '17:00:00' },
];
const DIAS_SEMANA = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];

exports.gerar = async (req, res) => {
    try {
        const resultado = await geradorHorarioService.gerar();
        // Adicionar uma mensagem flash para exibir na próxima página seria ideal
        console.log(resultado);
        res.redirect('/');
    } catch (error) {
        console.error(error);
        res.status(500).send("Erro ao gerar horário: " + error.message);
    }
};

exports.visualizarPorTurma = async (req, res) => {
    try {
        const turmaId = req.params.id;
        const turma = await Turma.findByPk(turmaId);
        if (!turma) return res.status(404).send('Turma não encontrada');

        const horarios = await Horario.findAll({
            where: { turmaId },
            include: [Disciplina, Professor],
            order: [['dia_semana', 'ASC'], ['hora_inicio', 'ASC']]
        });

        const quadroHorario = {};
        horarios.forEach(h => {
            const key = `${h.dia_semana}-${h.hora_inicio}`;
            quadroHorario[key] = {
                disciplina: h.Disciplina.nome,
                professor: h.Professor.nome,
            };
        });

        res.render('horario-turma', {
            title: `Horário da Turma: ${turma.nome}`,
            quadroHorario,
            diasDaSemana: DIAS_SEMANA,
            slots: SLOTS,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Erro ao buscar horário da turma.");
    }
};