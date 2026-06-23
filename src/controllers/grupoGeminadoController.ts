import { Request, Response } from 'express';
import { GrupoGeminado, Disciplina, Professor, Turma } from '../models';

export const list = async (req: Request, res: Response): Promise<void> => {
    const grupos = await GrupoGeminado.findAll({
        include: [
            { model: Disciplina },
            { model: Professor },
            { model: Turma, as: 'turmas' }
        ],
        order: [['nome', 'ASC']]
    });
    res.render('grupos-geminados', { title: 'Aulas Geminadas', grupos });
};

export const createForm = async (req: Request, res: Response): Promise<void> => {
    const disciplinas = await Disciplina.findAll({ order: [['nome', 'ASC']] });
    const professores = await Professor.findAll({ order: [['nome', 'ASC']] });
    const turmas = await Turma.findAll({ order: [['nome', 'ASC']] });
    res.render('grupo-geminado-form', {
        title: 'Novo Grupo de Aulas Geminadas',
        disciplinas,
        professores,
        turmas
    });
};

export const create = async (req: Request, res: Response): Promise<void> => {
    const { nome, disciplinaId, professorId, turmasIds } = req.body;
    try {
        const novoGrupo = await GrupoGeminado.create({ nome, disciplinaId, professorId }) as any;
        if (turmasIds && turmasIds.length > 0) {
            await novoGrupo.setTurmas(turmasIds);
        }
        res.redirect('/grupos-geminados');
    } catch (error: any) {
        res.status(500).send("Erro ao criar grupo: " + error.message);
    }
};

export const destroy = async (req: Request, res: Response): Promise<void> => {
    try {
        const grupo = await GrupoGeminado.findByPk(req.params.id);
        if (grupo) {
            await grupo.destroy();
        }
        res.redirect('/grupos-geminados');
    } catch (error: any) {
        res.status(500).send("Erro ao deletar grupo.");
    }
};
