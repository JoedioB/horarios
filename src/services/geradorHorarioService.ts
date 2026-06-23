import { sequelize, Professor, Disciplina, Turma, Horario, DisponibilidadeProfessor, GrupoGeminado } from '../models';
import moment from 'moment';
import { SLOTS, SLOTS_PARES, isSlotValidoParaDia } from '../config/constants';
import { Transaction } from 'sequelize';

interface Slot {
    inicio: string;
    fim: string;
    periodo: string;
}

interface SlotPar {
    slot1: Slot;
    slot2: Slot;
}

interface Tarefa {
    tipo: 'geminada' | 'normal';
    entidade: any;
    tipoBloco: 1 | 2;
    prioridade: number;
    alocada: boolean;
}

class GeradorHorarioService {
    async gerar(): Promise<{ success: boolean; message: string; details?: string[] }> {
        const [professores, turmas, gruposGeminados] = await Promise.all([
            Professor.findAll({ include: [{ model: Disciplina, as: 'disciplinas' }, { model: DisponibilidadeProfessor, as: 'disponibilidades' }] }),
            Turma.findAll({ include: [{ model: Disciplina, as: 'Disciplinas' }] }),
            GrupoGeminado.findAll({ include: [{ model: Turma, as: 'turmas' }, Disciplina, { model: Professor, include: [{ model: DisponibilidadeProfessor, as: 'disponibilidades' }] }] })
        ]) as [any[], any[], any[]];
        
        const horarioTurmas: Record<string, boolean> = {};
        const horarioProfessores: Record<string, boolean> = {};
        const novosHorarios: any[] = [];
        
        // 1. ALOCAÇÃO DE REGRAS FIXAS (PRIORIDADE MÁXIMA)
        await this._alocarRegrasFixas(turmas, professores, horarioTurmas, horarioProfessores, novosHorarios);
        
        // 2. PREPARAÇÃO DE TAREFAS NORMAIS
        const tarefas = this._prepararTarefasPriorizadas(turmas, gruposGeminados, professores, novosHorarios);
        
        for (const tarefa of tarefas) {
            tarefa.alocada = await this._tentarAlocarTarefa(tarefa, horarioTurmas, horarioProfessores, novosHorarios);
        }
        
        const aulasNaoAlocadas = this._verificarDemandasNaoAtendidas(tarefas);
        
        const t: Transaction = await sequelize.transaction();
        try {
            await Horario.destroy({ where: {}, truncate: false, cascade: false, transaction: t });
            if (novosHorarios.length > 0) {
                await Horario.bulkCreate(novosHorarios, { transaction: t });
            }
            await t.commit();

            if (aulasNaoAlocadas.length > 0) {
                return { success: false, message: "Algumas aulas não puderam ser alocadas:", details: aulasNaoAlocadas };
            }
            return { success: true, message: "Horário gerado com sucesso!" };
        } catch (error: any) {
            if (t) await t.rollback();
            throw new Error("Falha ao salvar horários gerados: " + error.message);
        }
    }

    /**
     * Implementa restrições fixas como a da Optativa I.
     */
    async _alocarRegrasFixas(turmas: any[], todosProfessores: any[], horarioTurmas: Record<string, boolean>, horarioProfessores: Record<string, boolean>, novosHorarios: any[]): Promise<void> {
        // Regra: Optativa I nas duas primeiras aulas de Terça para 3A, 3B, 3C, 3H
        const nomesTurmas3Ano = ['3A', '3B', '3C', '3H'];
        const diaTerça = 2;
        const slotsIniciais = [SLOTS[0], SLOTS[1]];

        const turmasAlvo = turmas.filter(t => nomesTurmas3Ano.includes(t.nome));
        
        for (const turma of turmasAlvo) {
            const optativa = turma.Disciplinas.find((d: any) => d.nome.includes('Optativa I'));
            if (optativa) {
                // Encontrar o professor da optativa para esta turma
                const professor = todosProfessores.find(p => 
                    p.disciplinas.some((d: any) => d.id === optativa.id)
                );

                if (professor) {
                    for (const slot of slotsIniciais) {
                        this._marcarSlot(turma.id, optativa.id, professor.id, diaTerça, slot, horarioTurmas, horarioProfessores, novosHorarios);
                    }
                }
            }
        }
    }

    _prepararTarefasPriorizadas(turmas: any[], gruposGeminados: any[], todosProfessores: any[], horariosJaAlocados: any[]): Tarefa[] {
        const tarefas: Tarefa[] = [];
        const turmasEmGrupos = this._getTurmasEmGrupos(gruposGeminados);

        // Identifica o que já foi alocado nas regras fixas para abater da carga horária
        const cargaAlocada: Record<string, number> = {}; // "turmaId-disciplinaId" -> count
        horariosJaAlocados.forEach(h => {
            const key = `${h.turmaId}-${h.disciplinaId}`;
            cargaAlocada[key] = (cargaAlocada[key] || 0) + 1;
        });

        gruposGeminados.forEach(grupo => {
            const cargaTotal = grupo.Disciplina.carga_horaria_semanal || 0;
            // Abatendo carga já alocada para turmas do grupo (simplificado: assume que se alocou uma turma, alocou o grupo)
            const jaAlocada = cargaAlocada[`${grupo.turmas[0]?.id}-${grupo.Disciplina.id}`] || 0;
            const cargaRestante = Math.max(0, cargaTotal - jaAlocada);

            const duplas = Math.floor(cargaRestante / 2);
            const simples = cargaRestante % 2;
            for (let i = 0; i < duplas; i++) tarefas.push({ tipo: 'geminada', entidade: grupo, tipoBloco: 2, prioridade: 1, alocada: false });
            for (let i = 0; i < simples; i++) tarefas.push({ tipo: 'geminada', entidade: grupo, tipoBloco: 1, prioridade: 3, alocada: false });
        });

        turmas.forEach(turma => {
            turma.Disciplinas.forEach((disciplina: any) => {
                if (!turmasEmGrupos.has(`${turma.id}-${disciplina.id}`)) {
                    const cargaTotal = disciplina.carga_horaria_semanal || 0;
                    const jaAlocada = cargaAlocada[`${turma.id}-${disciplina.id}`] || 0;
                    const cargaRestante = Math.max(0, cargaTotal - jaAlocada);

                    if (cargaRestante === 0) return;

                    const professoresQualificados = todosProfessores.filter(p => p.disciplinas.some((d: any) => d.id === disciplina.id));
                    const duplas = Math.floor(cargaRestante / 2);
                    const simples = cargaRestante % 2;
                    for (let i = 0; i < duplas; i++) tarefas.push({ tipo: 'normal', entidade: { turma, disciplina, professoresQualificados }, tipoBloco: 2, prioridade: 2, alocada: false });
                    for (let i = 0; i < simples; i++) tarefas.push({ tipo: 'normal', entidade: { turma, disciplina, professoresQualificados }, tipoBloco: 1, prioridade: 4, alocada: false });
                }
            });
        });

        return tarefas.sort((a, b) => a.prioridade - b.prioridade || Math.random() - 0.5);
    }

    async _tentarAlocarTarefa(tarefa: Tarefa, horarioTurmas: Record<string, boolean>, horarioProfessores: Record<string, boolean>, novosHorarios: any[]): Promise<boolean> {
        const slotsParaTentar: { slot1: Slot; slot2?: Slot }[] = tarefa.tipoBloco === 2 ? SLOTS_PARES : SLOTS.map(s => ({ slot1: s }));
        const dias = [1, 2, 3, 4, 5].sort(() => Math.random() - 0.5);
        const slotsEmbaralhados = [...slotsParaTentar].sort(() => Math.random() - 0.5);

        for (const dia of dias) {
            for (const par of slotsEmbaralhados) {
                const slots = tarefa.tipoBloco === 2 ? [par.slot1, par.slot2!] : [par.slot1];

                if (!slots.every(s => isSlotValidoParaDia(dia, s.inicio))) {
                    continue;
                }

                const professorValido = this._getProfessorValidoParaSlot(tarefa, dia, slots, horarioTurmas, horarioProfessores);
                if (professorValido) {
                    this._marcarHorario(tarefa, professorValido, dia, slots, horarioTurmas, horarioProfessores, novosHorarios);
                    return true;
                }
            }
        }
        return false;
    }

    _getProfessorValidoParaSlot(tarefa: Tarefa, dia: number, slots: Slot[], horarioTurmas: Record<string, boolean>, horarioProfessores: Record<string, boolean>): any {
        let professoresParaVerificar: any[] = [];
        let turmasParaVerificar: any[] = [];

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

    _marcarHorario(tarefa: Tarefa, professor: any, dia: number, slots: Slot[], horarioTurmas: Record<string, boolean>, horarioProfessores: Record<string, boolean>, novosHorarios: any[]): void {
        const marcar = (turmaId: number, disciplinaId: number) => {
            for (const slot of slots) {
                this._marcarSlot(turmaId, disciplinaId, professor.id, dia, slot, horarioTurmas, horarioProfessores, novosHorarios);
            }
        };
        if (tarefa.tipo === 'geminada') {
            const { Disciplina, turmas } = tarefa.entidade;
            for (const turma of turmas) marcar(turma.id, Disciplina.id);
        } else {
            const { turma, disciplina } = tarefa.entidade;
            marcar(turma.id, disciplina.id);
        }
    }
    
    _getTurmasEmGrupos(gruposGeminados: any[]): Set<string> {
        const turmasEmGrupos = new Set<string>();
        gruposGeminados.forEach(g => g.turmas.forEach((t: any) => turmasEmGrupos.add(`${t.id}-${g.Disciplina.id}`)));
        return turmasEmGrupos;
    }

    _verificarDemandasNaoAtendidas(tarefas: Tarefa[]): string[] {
        const naoAtendidas: string[] = [];
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

    _marcarSlot(turmaId: number, disciplinaId: number, professorId: number, dia: number, slot: Slot, horarioTurmas: Record<string, boolean>, horarioProfessores: Record<string, boolean>, novosHorarios: any[]): void {
        novosHorarios.push({ turmaId, disciplinaId, professorId, dia_semana: dia, hora_inicio: slot.inicio, hora_fim: slot.fim });
        horarioTurmas[`${turmaId}-${dia}-${slot.inicio}`] = true;
        horarioProfessores[`${professorId}-${dia}-${slot.inicio}`] = true;
    }

    _isProfessorDisponivel(professor: any, dia: number, horaInicioSlot: string): boolean {
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

export default new GeradorHorarioService();
