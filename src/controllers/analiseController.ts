import { Request, Response } from 'express';
import { Professor, Disciplina, Turma, DisponibilidadeProfessor, GrupoGeminado } from '../models';

export const showAnalise = async (req: Request, res: Response) => {
    try {
        const [professores, turmas, gruposGeminados] = await Promise.all([
            Professor.findAll({
                include: [
                    { model: Disciplina, as: 'disciplinas' },
                    { model: DisponibilidadeProfessor, as: 'disponibilidades' }
                ],
                order: [['nome', 'ASC']]
            }) as any as any[],
            Turma.findAll({
                include: [{ model: Disciplina, as: 'Disciplinas' }],
                order: [['nome', 'ASC']]
            }) as any as any[],
            GrupoGeminado.findAll({ include: [Disciplina] })
        ]);

        for (const turma of turmas) {
            for (const disciplina of turma.Disciplinas) {
                (disciplina as any).professoresQualificados = professores.filter(p =>
                    p.disciplinas.some((d: any) => d.id === (disciplina as any).id)
                );
            }
        }

        const analiseProfessores: any[] = [];
        const analiseTurmas: any[] = [];
        const horasDisponiveisNaSemana = 40;

        for (const professor of professores) {
            const horasDisponiveis = (professor.disponibilidades || []).reduce((total: number, disp: any) => {
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
            const cargaTotal = (turma.Disciplinas || []).reduce((total: number, disc: any) => total + disc.carga_horaria_semanal, 0);
            
            const disciplinasComProfessores = (turma.Disciplinas || []).map((d: any) => ({
                nome: d.nome,
                professores: d.professoresQualificados ? d.professoresQualificados.map((p: any) => p.nome) : []
            })).sort((a: any, b: any) => a.nome.localeCompare(b.nome));

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

    } catch (error: any) {
        res.status(500).send("Erro ao gerar análise: " + error.message);
    }
};
