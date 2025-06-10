// src/services/geradorHorarioService.js

const { Professor, Disciplina, Turma, Horario, DisponibilidadeProfessor } = require('../models');
const moment = require('moment');

// ... (as constantes SLOTS e SLOTS_PARES permanecem as mesmas)
const SLOTS = [
    { inicio: '08:00:00', fim: '08:45:00' }, { inicio: '08:45:00', fim: '09:30:00' },
    { inicio: '09:45:00', fim: '10:30:00' }, { inicio: '10:30:00', fim: '11:15:00' },
    { inicio: '11:15:00', fim: '12:00:00' },
    { inicio: '13:00:00', fim: '13:45:00' }, { inicio: '13:45:00', fim: '14:30:00' },
    { inicio: '14:30:00', fim: '15:15:00' },
    { inicio: '15:30:00', fim: '16:15:00' }, { inicio: '16:15:00', fim: '17:00:00' },
];

const SLOTS_PARES = [
    { slot1: SLOTS[0], slot2: SLOTS[1] },
    { slot1: SLOTS[2], slot2: SLOTS[3] },
    { slot1: SLOTS[5], slot2: SLOTS[6] },
    { slot1: SLOTS[8], slot2: SLOTS[9] },
];

class GeradorHorarioService {
    // ... (a função gerar() e alocarAula() permanecem as mesmas)
    async gerar() {
        // 1. PREPARAÇÃO
        await Horario.destroy({ truncate: true, cascade: false });
        const turmas = await Turma.findAll({ include: [{ model: Disciplina, as: 'Disciplinas' }] });
        const professores = await Professor.findAll({
            include: [
                { model: Disciplina, as: 'disciplinas' },
                { model: DisponibilidadeProfessor, as: 'disponibilidades' }
            ]
        });
        const horarioTurmas = {}, horarioProfessores = {};
        const demandas = {}, listaDeTarefas = [];

        for (const turma of turmas) {
            for (const disciplina of turma.Disciplinas) {
                const key = `${turma.id}-${disciplina.id}`;
                demandas[key] = disciplina.carga_horaria_semanal;
                if (disciplina.carga_horaria_semanal > 0) {
                    listaDeTarefas.push({ turma, disciplina });
                }
            }
        }
        
        listaDeTarefas.sort(() => Math.random() - 0.5);

        // 2. ALGORITMO DE ALOCAÇÃO
        for (const tarefa of listaDeTarefas) {
            const { turma, disciplina } = tarefa;
            const key = `${turma.id}-${disciplina.id}`;
            const profsQualificados = professores.filter(p => p.disciplinas.some(d => d.id === disciplina.id));

            while (demandas[key] > 0) {
                let alocouNestaPassagemDoWhile = false;
                for (const professor of profsQualificados) {
                    let professorConseguiuAlocar = false;
                    if (demandas[key] >= 2) {
                        if (await this.alocarAula(turma, disciplina, professor, 2, horarioTurmas, horarioProfessores)) {
                            demandas[key] -= 2;
                            professorConseguiuAlocar = true;
                        }
                    }
                    if (!professorConseguiuAlocar && demandas[key] >= 1) {
                         if (await this.alocarAula(turma, disciplina, professor, 1, horarioTurmas, horarioProfessores)) {
                            demandas[key] -= 1;
                            professorConseguiuAlocar = true;
                        }
                    }
                    if (professorConseguiuAlocar) {
                        alocouNestaPassagemDoWhile = true;
                        break;
                    }
                }
                if (!alocouNestaPassagemDoWhile) {
                    break;
                }
            }
        }
        
        // 3. VERIFICAÇÃO FINAL
        const aulasNaoAlocadas = [];
        for (const key in demandas) {
            if (demandas[key] > 0) {
                const [turmaId, disciplinaId] = key.split('-');
                const turma = await Turma.findByPk(turmaId);
                const disciplina = await Disciplina.findByPk(disciplinaId);
                aulasNaoAlocadas.push(`Turma: ${turma.nome}, Disciplina: ${disciplina.nome} (faltaram ${demandas[key]} aulas)`);
            }
        }
        if (aulasNaoAlocadas.length > 0) {
            return { success: false, message: "Algumas aulas não puderam ser alocadas:", details: aulasNaoAlocadas };
        }
        return { success: true, message: "Horário gerado com sucesso, priorizando aulas duplas!" };
    }

    async alocarAula(turma, disciplina, professor, tipoBloco, horarioTurmas, horarioProfessores) {
        const slotsParaTentar = tipoBloco === 2 ? SLOTS_PARES : SLOTS.map(s => ({ slot1: s }));
        slotsParaTentar.sort(() => Math.random() - 0.5); 
        for (const par of slotsParaTentar) {
            const dias = [1, 2, 3, 4, 5].sort(() => Math.random() - 0.5);
            for (let dia of dias) {
                const { slot1, slot2 } = par;
                const disponivel1 = this.isSlotDisponivel(turma, professor, dia, slot1, horarioTurmas, horarioProfessores);
                let disponivel2 = true;
                if (tipoBloco === 2) {
                    disponivel2 = this.isSlotDisponivel(turma, professor, dia, slot2, horarioTurmas, horarioProfessores);
                }
                if (disponivel1 && disponivel2) {
                    await this.marcarHorario(turma, disciplina, professor, dia, slot1, horarioTurmas, horarioProfessores);
                    if (tipoBloco === 2) {
                        await this.marcarHorario(turma, disciplina, professor, dia, slot2, horarioProfessores, horarioProfessores);
                    }
                    console.log(`ALOCADO: ${tipoBloco === 2 ? 'DUPLA' : 'SIMPLES'} - Turma ${turma.nome}, Disc ${disciplina.nome}, Prof ${professor.nome}, Dia ${dia}`);
                    return true;
                }
            }
        }
        return false;
    }
    
    /**
     * Verifica se um slot específico está livre para turma, professor e se o professor tem disponibilidade.
     * Inclui a nova regra de bloqueio.
     */
    isSlotDisponivel(turma, professor, dia, slot, horarioTurmas, horarioProfessores) {
        // ###############################################################
        // ## CORREÇÃO APLICADA AQUI: Adiciona a restrição de bloqueio   ##
        // ###############################################################
        
        const isTarde = slot.inicio >= '13:00:00';
        const isQuartaOuQuinta = (dia === 3 || dia === 4); // 3=Quarta, 4=Quinta

        // Se for quarta ou quinta à tarde, o slot é inválido.
        if (isQuartaOuQuinta && isTarde) {
            return false;
        }

        // Se não for um slot bloqueado, continua com as verificações normais.
        const conflitoTurma = horarioTurmas[`${turma.id}-${dia}-${slot.inicio}`];
        const conflitoProfessor = horarioProfessores[`${professor.id}-${dia}-${slot.inicio}`];
        const professorDisponivel = this.isProfessorDisponivel(professor, dia, slot.inicio);

        return !conflitoTurma && !conflitoProfessor && professorDisponivel;
    }

    async marcarHorario(turma, disciplina, professor, dia, slot, horarioTurmas, horarioProfessores) {
        await Horario.create({
            turmaId: turma.id, disciplinaId: disciplina.id, professorId: professor.id,
            dia_semana: dia, hora_inicio: slot.inicio, hora_fim: slot.fim
        });
        horarioTurmas[`${turma.id}-${dia}-${slot.inicio}`] = true;
        horarioProfessores[`${professor.id}-${dia}-${slot.inicio}`] = true;
    }

    isProfessorDisponivel(professor, dia, horaInicioSlot) {
        if (!professor.disponibilidades || professor.disponibilidades.length === 0) return false;
        const horaSlot = moment(horaInicioSlot, 'HH:mm:ss');
        for (const disp of professor.disponibilidades) {
            if (disp.dia_semana === dia) {
                const inicioDisp = moment(disp.hora_inicio, 'HH:mm:ss');
                const fimDisp = moment(disp.hora_fim, 'HH:mm:ss');
                if (horaSlot.isSameOrAfter(inicioDisp) && horaSlot.isBefore(fimDisp)) return true;
            }
        }
        return false;
    }
}

module.exports = new GeradorHorarioService();