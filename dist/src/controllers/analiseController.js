"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.showAnalise = void 0;
const models_1 = require("../models");
const showAnalise = async (req, res) => {
    try {
        const [professores, turmas, gruposGeminados] = await Promise.all([
            models_1.Professor.findAll({
                include: [
                    { model: models_1.Disciplina, as: 'disciplinas' },
                    { model: models_1.DisponibilidadeProfessor, as: 'disponibilidades' }
                ],
                order: [['nome', 'ASC']]
            }),
            models_1.Turma.findAll({
                include: [{ model: models_1.Disciplina, as: 'Disciplinas' }],
                order: [['nome', 'ASC']]
            }),
            models_1.GrupoGeminado.findAll({ include: [models_1.Disciplina] })
        ]);
        for (const turma of turmas) {
            for (const disciplina of turma.Disciplinas) {
                disciplina.professoresQualificados = professores.filter(p => p.disciplinas.some((d) => d.id === disciplina.id));
            }
        }
        const analiseProfessores = [];
        const analiseTurmas = [];
        const horasDisponiveisNaSemana = 40;
        for (const professor of professores) {
            const horasDisponiveis = (professor.disponibilidades || []).reduce((total, disp) => {
                const inicio = new Date(`1970-01-01T${disp.hora_inicio}`);
                const fim = new Date(`1970-01-01T${disp.hora_fim}`);
                const diffMinutos = (fim.getTime() - inicio.getTime()) / (1000 * 60);
                return total + (diffMinutos / 45);
            }, 0);
            analiseProfessores.push({
                nome: professor.nome,
                disponibilidade: Math.floor(horasDisponiveis),
            });
        }
        for (const turma of turmas) {
            const cargaTotal = (turma.Disciplinas || []).reduce((total, disc) => total + disc.carga_horaria_semanal, 0);
            const disciplinasComProfessores = (turma.Disciplinas || []).map((d) => ({
                nome: d.nome,
                professores: d.professoresQualificados ? d.professoresQualificados.map((p) => p.nome) : []
            })).sort((a, b) => a.nome.localeCompare(b.nome));
            analiseTurmas.push({
                nome: turma.nome,
                cargaTotal,
                horasDisponiveis: horasDisponiveisNaSemana,
                saturacao: (cargaTotal / horasDisponiveisNaSemana * 100).toFixed(1),
                disciplinas: disciplinasComProfessores
            });
        }
        res.render('analise-carga', {
            title: 'Análise de Carga',
            analiseProfessores,
            analiseTurmas
        });
    }
    catch (error) {
        res.status(500).send("Erro ao gerar análise: " + error.message);
    }
};
exports.showAnalise = showAnalise;
