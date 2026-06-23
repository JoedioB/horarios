import { Request, Response } from 'express';
import { Disciplina } from '../models';

export const list = async (req: Request, res: Response): Promise<void> => {
    const disciplinas = await Disciplina.findAll({
        order: [['nome', 'ASC']]
    });
    res.render('disciplinas', { title: 'Disciplinas', disciplinas });
};

export const createForm = (req: Request, res: Response): void => {
    res.render('disciplina-form', { title: 'Nova Disciplina', disciplina: {} });
};

export const create = async (req: Request, res: Response): Promise<void> => {
    await Disciplina.create(req.body);
    res.redirect('/disciplinas');
};

export const editForm = async (req: Request, res: Response): Promise<void> => {
    const disciplina = await Disciplina.findByPk(req.params.id);
    res.render('disciplina-form', { title: 'Editar Disciplina', disciplina });
};

export const update = async (req: Request, res: Response): Promise<void> => {
    const disciplina = await Disciplina.findByPk(req.params.id);
    if (disciplina) {
        await disciplina.update(req.body);
    }
    res.redirect('/disciplinas');
};

export const deleteDisciplina = async (req: Request, res: Response): Promise<void> => {
    const disciplina = await Disciplina.findByPk(req.params.id);
    if (disciplina) {
        await disciplina.destroy();
    }
    res.redirect('/disciplinas');
};
