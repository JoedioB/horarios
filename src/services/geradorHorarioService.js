// src/services/geradorHorarioService.js

const { Professor, Disciplina, Turma, Horario, DisponibilidadeProfessor, GrupoGeminado } = require('../models');
const moment = require('moment');

const SLOTS = [
    { inicio: '08:00:00', fim: '08:45:00', periodo: 'manha' }, { inicio: '08:45:00', fim: '09:30:00', periodo: 'manha' },
    { inicio: '09:45:00', fim: '10:30:00', periodo: 'manha' }, { inicio: '10:30:00', fim: '11:15:00', periodo: 'manha' },
    { inicio: '11:15:00', fim: '12:00:00', periodo: 'manha' },
    { inicio: '13:00:00', fim: '13:45:00', periodo: 'tarde' }, { inicio: '13:45:00', fim: '14:30:00', periodo: 'tarde' },
    { inicio: '14:30:00', fim: '15:15:00', periodo: 'tarde' },
    { inicio: '15:30:00', fim: '16:15:00', periodo: 'tarde' }, { inicio: '16:15:00', fim: '17:00:00', periodo: 'tarde' },
];

const SLOTS_PARES = [
    { slot1: SLOTS[0], slot2: SLOTS[1] }, { slot1: SLOTS[2], slot2: SLOTS[3] },
    { slot1: SLOTS[5], slot2: SLOTS[6] }, { slot1: SLOTS[8], slot2: SLOTS[9] },
];

class GeradorHorarioService {
    async gerar() {
        await Horario.destroy({ truncate: true, cascade: false });

        const [professores, turmas, gruposGeminados] = await Promise.all([
            Professor.findAll({ include: [{ model: Disciplina, as: 'disciplinas' }, { model: DisponibilidadeProfessor, as: 'disponibilidades' }] }),
            Turma.findAll({ include: [{ model: Disciplina, as: 'Disciplinas' }] }),
            GrupoGeminado.findAll({ include: [{ model: Turma, as: 'turmas' }, Disciplina, { model: Professor, include: [{ model: DisponibilidadeProfessor, as: 'disponibilidades' }] }] })
        ]);
        
        const horarioTurmas = {};
        const horarioProfessores = {};
        
        const tarefas = this._prepararTarefasPriorizadas(turmas, gruposGeminados, professores);
        
        for (const tarefa of tarefas) {
            tarefa.alocada = await this._tentarAlocarTarefa(tarefa, horarioTurmas, horarioProfessores);
        }
        
        const aulasNaoAlocadas = this._verificarDemandasNaoAtendidas(tarefas);
        if (aulasNaoAlocadas.length > 0) {
            return { success: false, message: "Algumas aulas não puderam ser alocadas:", details: aulasNaoAlocadas };
        }
        return { success: true, message: "Horário gerado com sucesso!" };
    }

    _prepararTarefasPriorizadas(turmas, gruposGeminados, todosProfessores) {
        const tarefas = [];
        const turmasEmGrupos = this._getTurmasEmGrupos(gruposGeminados);

        gruposGeminados.forEach(grupo => {
            const carga = grupo.Disciplina.carga_horaria_semanal || 0;
            if (carga === 0) return;
            const duplas = Math.floor(carga / 2);
            const simples = carga % 2;
            for (let i = 0; i < duplas; i++) tarefas.push({ tipo: 'geminada', entidade: grupo, tipoBloco: 2, prioridade: 1, alocada: false });
            for (let i = 0; i < simples; i++) tarefas.push({ tipo: 'geminada', entidade: grupo, tipoBloco: 1, prioridade: 3, alocada: false });
        });

        turmas.forEach(turma => {
            turma.Disciplinas.forEach(disciplina => {
                if (!turmasEmGrupos.has(`${turma.id}-${disciplina.id}`)) {
                    const carga = disciplina.carga_horaria_semanal || 0;
                    if (carga === 0) return;
                    const professoresQualificados = todosProfessores.filter(p => p.disciplinas.some(d => d.id === disciplina.id));
                    const duplas = Math.floor(carga / 2);
                    const simples = carga % 2;
                    for (let i = 0; i < duplas; i++) tarefas.push({ tipo: 'normal', entidade: { turma, disciplina, professoresQualificados }, tipoBloco: 2, prioridade: 2, alocada: false });
                    for (let i = 0; i < simples; i++) tarefas.push({ tipo: 'normal', entidade: { turma, disciplina, professoresQualificados }, tipoBloco: 1, prioridade: 4, alocada: false });
                }
            });
        });

        // Embaralha apenas uma vez, fora do loop de alocação
        return tarefas.sort((a, b) => a.prioridade - b.prioridade || Math.random() - 0.5);
    }

    async _tentarAlocarTarefa(tarefa, horarioTurmas, horarioProfessores) {
        const slotsParaTentar = tarefa.tipoBloco === 2 ? SLOTS_PARES : SLOTS.map(s => ({ slot1: s }));
        // Embaralha os dias e os slots apenas uma vez
        const dias = [1, 2, 3, 4, 5].sort(() => Math.random() - 0.5);
        const slotsEmbaralhados = [...slotsParaTentar].sort(() => Math.random() - 0.5);

        for (const dia of dias) {
            for (const par of slotsEmbaralhados) {
                const slots = tarefa.tipoBloco === 2 ? [par.slot1, par.slot2] : [par.slot1];
                const professorValido = this._getProfessorValidoParaSlot(tarefa, dia, slots, horarioTurmas, horarioProfessores);
                if (professorValido) {
                    await this._marcarHorario(tarefa, professorValido, dia, slots, horarioTurmas, horarioProfessores);
                    return true;
                }
            }
        }
        return false;
    }

    _getProfessorValidoParaSlot(tarefa, dia, slots, horarioTurmas, horarioProfessores) {
        if ((dia === 3 || dia === 4) && slots[0].periodo === 'tarde') return null;

        let professoresParaVerificar = [];
        let turmasParaVerificar = [];

        if (tarefa.tipo === 'geminada') {
            professoresParaVerificar = [tarefa.entidade.Professor];
            turmasParaVerificar = tarefa.entidade.turmas;
        } else {
            professoresParaVerificar = tarefa.entidade.professoresQualificados || [];
            turmasParaVerificar = [tarefa.entidade.turma];
        }

        for (const professor of professoresParaVerificar) {
            let todosSlotsValidos = true;
            for (const slot of slots) {
                if (!this._isProfessorDisponivel(professor, dia, slot.inicio) || horarioProfessores[`${professor.id}-${dia}-${slot.inicio}`]) {
                    todosSlotsValidos = false; break;
                }
                for (const turma of turmasParaVerificar) {
                    if (horarioTurmas[`${turma.id}-${dia}-${slot.inicio}`]) {
                        todosSlotsValidos = false; break;
                    }
                }
                if (!todosSlotsValidos) break;
            }
            if (todosSlotsValidos) return professor;
        }
        return null;
    }

    async _marcarHorario(tarefa, professor, dia, slots, horarioTurmas, horarioProfessores) {
        const marcar = async (turmaId, disciplinaId) => {
            for (const slot of slots) {
                await this._marcarSlot(turmaId, disciplinaId, professor.id, dia, slot, horarioTurmas, horarioProfessores);
            }
        };
        if (tarefa.tipo === 'geminada') {
            const { Disciplina, turmas } = tarefa.entidade;
            for (const turma of turmas) await marcar(turma.id, Disciplina.id);
        } else {
            const { turma, disciplina } = tarefa.entidade;
            await marcar(turma.id, disciplina.id);
        }
    }
    
    _getTurmasEmGrupos(gruposGeminados) {
        const turmasEmGrupos = new Set();
        gruposGeminados.forEach(g => g.turmas.forEach(t => turmasEmGrupos.add(`${t.id}-${g.Disciplina.id}`)));
        return turmasEmGrupos;
    }

    _verificarDemandasNaoAtendidas(tarefas) {
        const naoAtendidas = [];
        tarefas.filter(t => !t.alocada).forEach(tarefa => {
            const tipoBloco = tarefa.tipoBloco === 2 ? 'duplo' : 'simples';
            let nomeEntidade = '';
            if (tarefa.tipo === 'geminada') {
                nomeEntidade = `Grupo: ${tarefa.entidade.nome}`;
            } else {
                nomeEntidade = `Turma: ${tarefa.entidade.turma.nome}, Disciplina: ${tarefa.entidade.disciplina.nome}`;
            }
            naoAtendidas.push(`${nomeEntidade} (bloco ${tipoBloco} não alocado)`);
        });
        return naoAtendidas;
    }

    async _marcarSlot(turmaId, disciplinaId, professorId, dia, slot, horarioTurmas, horarioProfessores) {
        await Horario.create({ turmaId, disciplinaId, professorId, dia_semana: dia, hora_inicio: slot.inicio, hora_fim: slot.fim });
        horarioTurmas[`${turmaId}-${dia}-${slot.inicio}`] = true;
        horarioProfessores[`${professorId}-${dia}-${slot.inicio}`] = true;
    }

    _isProfessorDisponivel(professor, dia, horaInicioSlot) {
        if (!professor || !professor.disponibilidades) return false;
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