// src/controllers/analiseController.js

const { Professor, Disciplina, Turma, DisponibilidadeProfessor, GrupoGeminado } = require('../models');

exports.showAnalise = async (req, res) => {
    try {
        const [professores, turmas, gruposGeminados] = await Promise.all([
            Professor.findAll({
                include: [
                    { model: Disciplina, as: 'disciplinas' },
                    { model: DisponibilidadeProfessor, as: 'disponibilidades' }
                ],
                order: [['nome', 'ASC']]
            }),
            Turma.findAll({
                include: [{ model: Disciplina, as: 'Disciplinas' }],
                order: [['nome', 'ASC']]
            }),
            GrupoGeminado.findAll({ include: [Disciplina] })
        ]);

        // ####################################################################
        // ## CORREÇÃO CRÍTICA APLICADA AQUI                                 ##
        // ## Este bloco adiciona a propriedade 'professoresQualificados'    ##
        // ## a cada disciplina, que estava faltando neste controller.        ##
        // ####################################################################
        for (const turma of turmas) {
            for (const disciplina of turma.Disciplinas) {
                disciplina.professoresQualificados = professores.filter(p =>
                    p.disciplinas.some(d => d.id === disciplina.id)
                );
            }
        }

        const analiseProfessores = [];
        const analiseTurmas = [];
        const horasDisponiveisNaSemana = 40;

        // 1. Análise de Carga dos Professores
        for (const professor of professores) {
            const horasDisponiveis = professor.disponibilidades.reduce((total, disp) => {
                const inicio = new Date(`1970-01-01T${disp.hora_inicio}`);
                const fim = new Date(`1970-01-01T${disp.hora_fim}`);
                const diffMinutos = (fim - inicio) / (1000 * 60);
                return total + (diffMinutos / 45);
            }, 0);
            analiseProfessores.push({
                nome: professor.nome,
                disponibilidade: Math.floor(horasDisponiveis),
            });
        }
        
        // 2. Análise de Carga das Turmas (agora com os dados corretos)
        for (const turma of turmas) {
            const cargaTotal = turma.Disciplinas.reduce((total, disc) => total + disc.carga_horaria_semanal, 0);
            
            const disciplinasComProfessores = turma.Disciplinas.map(d => ({
                nome: d.nome,
                // Agora 'professoresQualificados' existe e não estará mais vazio
                professores: d.professoresQualificados ? d.professoresQualificados.map(p => p.nome) : []
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

    } catch (error) {
        res.status(500).send("Erro ao gerar análise: " + error.message);
    }
};