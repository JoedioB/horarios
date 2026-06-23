import { Request, Response } from 'express';
import { Turma, Disciplina } from '../models';

export const list = async (req: Request, res: Response): Promise<void> => {
    const turmas = await Turma.findAll({
        order: [['nome', 'ASC']]
    });
    res.render('turmas', { title: 'Turmas', turmas });
};

export const createForm = (req: Request, res: Response): void => {
    res.render('turma-form', { title: 'Nova Turma', turma: {} });
};

export const create = async (req: Request, res: Response): Promise<void> => {
    await Turma.create(req.body);
    res.redirect('/turmas');
};

export const editForm = async (req: Request, res: Response): Promise<void> => {
    const turma = await Turma.findByPk(req.params.id);
    res.render('turma-form', { title: 'Editar Turma', turma });
};

export const update = async (req: Request, res: Response): Promise<void> => {
    const turma = await Turma.findByPk(req.params.id);
    if (turma) {
        await turma.update(req.body);
    }
    res.redirect('/turmas');
};

export const destroy = async (req: Request, res: Response): Promise<void> => {
    const turma = await Turma.findByPk(req.params.id);
    if (turma) {
        await turma.destroy();
    }
    res.redirect('/turmas');
};

export const manageDisciplinasForm = async (req: Request, res: Response): Promise<void> => {
    const turma = await Turma.findByPk(req.params.id, { include: [{ model: Disciplina, as: 'Disciplinas' }] }) as any;
    const todasDisciplinas = await Disciplina.findAll({
        order: [['nome', 'ASC']]
    });

    if (turma) {
        const idsDisciplinasDaTurma = turma.Disciplinas.map((d: any) => d.id);
        res.render('turma-disciplinas', {
            title: `Gerenciar Disciplinas da Turma ${turma.nome}`,
            turma,
            todasDisciplinas,
            idsDisciplinasDaTurma
        });
    } else {
        res.status(404).send('Turma não encontrada.');
    }
};

export const updateDisciplinas = async (req: Request, res: Response): Promise<void> => {
    const turma = await Turma.findByPk(req.params.id) as any;
    if (turma) {
        await turma.setDisciplinas(req.body.disciplinas || []);
    }
    res.redirect(`/turmas/${req.params.id}/disciplinas`);
};
