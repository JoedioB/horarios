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
        const demandas = this._prepararDemandas(turmas, gruposGeminados);
        const turmasEmGrupos = this._getTurmasEmGrupos(gruposGeminados);

        // --- FASE 1: ALOCAR AULAS GEMINADAS (PRIORIDADE MÁXIMA) ---
        console.log("FASE 1: Alocando Aulas Geminadas...");
        for (const grupo of gruposGeminados) {
            this._alocarDemandaParaGrupo(grupo, demandas, horarioTurmas, horarioProfessores);
        }
        
        // --- FASE 2: PREENCHER COM AULAS NORMAIS (SLOT-FIRST) ---
        console.log("FASE 2: Preenchendo com Aulas Normais...");
        for (const turma of turmas.sort((a,b) => a.nome.localeCompare(b.nome))) {
            for (let dia = 1; dia <= 5; dia++) {
                for (let i = 0; i < SLOTS.length; i++) {
                    const slot1 = SLOTS[i];
                    if (horarioTurmas[`${turma.id}-${dia}-${slot1.inicio}`]) continue;

                    let alocouBlocoDuplo = false;
                    if (i + 1 < SLOTS.length && slot1.fim === SLOTS[i+1].inicio) {
                        alocouBlocoDuplo = this._tentarAlocarAulaNormal(turma, dia, [slot1, SLOTS[i+1]], 2, demandas, horarioTurmas, horarioProfessores, professores, turmasEmGrupos);
                        if (alocouBlocoDuplo) i++;
                    }
                    
                    if (!alocouBlocoDuplo) {
                        this._tentarAlocarAulaNormal(turma, dia, [slot1], 1, demandas, horarioTurmas, horarioProfessores, professores, turmasEmGrupos);
                    }
                }
            }
        }
        
        const aulasNaoAlocadas = this._verificarDemandasNaoAtendidas(demandas, turmas, gruposGeminados);
        if (aulasNaoAlocadas.length > 0) {
            return { success: false, message: "Algumas aulas não puderam ser alocadas:", details: aulasNaoAlocadas };
        }
        return { success: true, message: "Horário gerado com sucesso!" };
    }

    _alocarDemandaParaGrupo(grupo, demandas, horarioTurmas, horarioProfessores) {
        const demandaKey = `grupo-${grupo.id}`;
        if (!demandas[demandaKey]) return;

        // Aloca blocos duplos primeiro
        while (demandas[demandaKey].duplas > 0) {
            if (!this._encontrarEAlocarBlocoParaGrupo(grupo, 2, horarioTurmas, horarioProfessores)) break;
            demandas[demandaKey].duplas--;
        }
        // Depois aloca blocos simples
        while (demandas[demandaKey].simples > 0) {
            if (!this._encontrarEAlocarBlocoParaGrupo(grupo, 1, horarioTurmas, horarioProfessores)) break;
            demandas[demandaKey].simples--;
        }
    }
    
    _encontrarEAlocarBlocoParaGrupo(grupo, tipoBloco, horarioTurmas, horarioProfessores) {
        const slotsParaTentar = (tipoBloco === 2)
            ? SLOTS_PARES.map(par => [par.slot1, par.slot2])
            : SLOTS.map(s => [s]);

        for (let dia = 1; dia <= 5; dia++) {
            for (const slots of slotsParaTentar.sort(() => Math.random() - 0.5)) {
                if (this._verificarDisponibilidadeGrupo(grupo, dia, slots, horarioTurmas, horarioProfessores)) {
                    this._marcarHorarioGrupo(grupo, dia, slots, horarioTurmas, horarioProfessores);
                    return true;
                }
            }
        }
        return false;
    }

    _tentarAlocarAulaNormal(turma, dia, slots, tipoBloco, demandas, horarioTurmas, horarioProfessores, todosProfessores, turmasEmGrupos) {
        if ((dia === 3 || dia === 4) && slots[0].periodo === 'tarde') return false;

        for (const disciplina of turma.Disciplinas.sort(() => Math.random() - 0.5)) {
            // Garante que só está tentando alocar aulas que não são geminadas
            if (turmasEmGrupos.has(`${turma.id}-${disciplina.id}`)) continue;

            const demandaKey = `turma-${turma.id}-disc-${disciplina.id}`;
            if (!demandas[demandaKey]) continue;

            const demandaTipoKey = tipoBloco === 2 ? 'duplas' : 'simples';
            if (demandas[demandaKey][demandaTipoKey] > 0) {
                const profDisponivel = this._encontrarProfessorDisponivel(disciplina, turma, dia, slots, horarioProfessores, todosProfessores);
                if (profDisponivel) {
                    this._marcarHorarioNormal(turma, disciplina, profDisponivel, dia, slots, horarioTurmas, horarioProfessores);
                    demandas[demandaKey][demandaTipoKey]--;
                    return true;
                }
            }
        }
        return false;
    }

    _encontrarProfessorDisponivel(disciplina, turma, dia, slots, horarioProfessores, todosProfessores) {
        const professoresQualificados = todosProfessores.filter(p => p.disciplinas.some(d => d.id === disciplina.id));
        for (const professor of professoresQualificados) {
            let disponivel = true;
            for (const slot of slots) {
                if (!this._isProfessorDisponivel(professor, dia, slot.inicio) || horarioProfessores[`${professor.id}-${dia}-${slot.inicio}`]) {
                    disponivel = false;
                    break;
                }
            }
            if (disponivel) return professor;
        }
        return null;
    }

    _verificarDisponibilidadeGrupo(grupo, dia, slots, horarioTurmas, horarioProfessores) {
        const professor = grupo.Professor;
        
        for (const slot of slots) {
            if (!this._isProfessorDisponivel(professor, dia, slot.inicio) || horarioProfessores[`${professor.id}-${dia}-${slot.inicio}`]) return false;
        }
        for (const turmaDoGrupo of grupo.turmas) {
            for (const slot of slots) {
                if (horarioTurmas[`${turmaDoGrupo.id}-${dia}-${slot.inicio}`]) return false;
            }
        }
        return true;
    }

    async _marcarHorarioGrupo(grupo, dia, slots, horarioTurmas, horarioProfessores) {
        for (const turmaDoGrupo of grupo.turmas) {
            for (const slot of slots) {
                await this._marcarSlot(turmaDoGrupo.id, grupo.Disciplina.id, grupo.Professor.id, dia, slot, horarioTurmas, horarioProfessores);
            }
        }
    }

    async _marcarHorarioNormal(turma, disciplina, professor, dia, slots, horarioTurmas, horarioProfessores) {
        for (const slot of slots) {
            await this._marcarSlot(turma.id, disciplina.id, professor.id, dia, slot, horarioTurmas, horarioProfessores);
        }
    }

    _prepararDemandas(turmas, gruposGeminados) {
        const demandas = {};
        const turmasEmGrupos = this._getTurmasEmGrupos(gruposGeminados);

        gruposGeminados.forEach(grupo => {
            const carga = grupo.Disciplina.carga_horaria_semanal;
            if (carga > 0) {
                 demandas[`grupo-${grupo.id}`] = { duplas: Math.floor(carga / 2), simples: carga % 2 };
            }
        });

        turmas.forEach(turma => {
            turma.Disciplinas.forEach(disciplina => {
                if (!turmasEmGrupos.has(`${turma.id}-${disciplina.id}`)) {
                    const carga = disciplina.carga_horaria_semanal;
                    if (carga > 0) {
                        demandas[`turma-${turma.id}-disc-${disciplina.id}`] = { duplas: Math.floor(carga / 2), simples: carga % 2 };
                    }
                }
            });
        });
        return demandas;
    }

    _getTurmasEmGrupos(gruposGeminados) {
        const turmasEmGrupos = new Set();
        gruposGeminados.forEach(g => g.turmas.forEach(t => turmasEmGrupos.add(`${t.id}-${g.Disciplina.id}`)));
        return turmasEmGrupos;
    }

    _verificarDemandasNaoAtendidas(demandas, turmas, gruposGeminados) {
        const naoAtendidas = [];
        for (const key in demandas) {
            const demanda = demandas[key];
            if (demanda.duplas > 0 || demanda.simples > 0) {
                const faltaram = demanda.duplas * 2 + demanda.simples;
                let nome = key;
                if (key.startsWith('grupo-')) {
                    const grupoId = parseInt(key.replace('grupo-', ''), 10);
                    const grupo = gruposGeminados.find(g => g.id === grupoId);
                    if (grupo) nome = `Grupo: ${grupo.nome}`;
                } else {
                    const parts = key.split('-');
                    const turmaId = parseInt(parts[1], 10);
                    const discId = parseInt(parts[3], 10);
                    const turma = turmas.find(t => t.id === turmaId);
                    if (turma) {
                        const disciplina = turma.Disciplinas.find(d => d.id === discId);
                        if (disciplina) nome = `Turma: ${turma.nome}, Disciplina: ${disciplina.nome}`;
                    }
                }
                naoAtendidas.push(`${nome} (faltaram ${faltaram} aulas)`);
            }
        }
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