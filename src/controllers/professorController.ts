import { Request, Response } from 'express';
import { Professor, Disciplina, DisponibilidadeProfessor } from '../models';

export const list = async (req: Request, res: Response): Promise<void> => {
    const professores = await Professor.findAll({
        order: [['nome', 'ASC']]
    });
    res.render('professores', { title: 'Professores', professores });
};

export const createForm = (req: Request, res: Response): void => {
    res.render('professor-form', { title: 'Novo Professor', professor: {} });
};

export const create = async (req: Request, res: Response): Promise<void> => {
    try {
        await Professor.create(req.body);
        res.redirect('/professores');
    } catch (error: any) {
        res.status(500).send("Erro ao criar professor: " + error.message);
    }
};

export const editForm = async (req: Request, res: Response): Promise<void> => {
    const professor = await Professor.findByPk(req.params.id);
    if (professor) {
        res.render('professor-form', { title: 'Editar Professor', professor });
    } else {
        res.status(404).send('Professor não encontrado.');
    }
};

export const update = async (req: Request, res: Response): Promise<void> => {
    try {
        const professor = await Professor.findByPk(req.params.id);
        if (professor) {
            await professor.update(req.body);
            res.redirect('/professores');
        } else {
            res.status(404).send('Professor não encontrado.');
        }
    } catch (error: any) {
        res.status(500).send("Erro ao atualizar professor: " + error.message);
    }
};

export const destroy = async (req: Request, res: Response): Promise<void> => {
    try {
        const professor = await Professor.findByPk(req.params.id);
        if (professor) {
            await professor.destroy();
            res.redirect('/professores');
        } else {
            res.status(404).send('Professor não encontrado.');
        }
    } catch (error: any) {
        res.status(500).send("Erro ao deletar professor. Verifique se ele não está associado a horários existentes.");
    }
};

export const manageDisciplinasForm = async (req: Request, res: Response): Promise<void> => {
    const professor = await Professor.findByPk(req.params.id, {
        include: [{ model: Disciplina, as: 'disciplinas' }]
    }) as any;
    
    const todasDisciplinas = await Disciplina.findAll({
        order: [['nome', 'ASC']]
    });

    if (professor) {
        const idsDisciplinasDoProfessor = professor.disciplinas.map((d: any) => d.id);
        res.render('professor-disciplinas', {
            title: `Gerenciar Disciplinas de ${professor.nome}`,
            professor,
            todasDisciplinas,
            idsDisciplinasDoProfessor
        });
    } else {
        res.status(404).send('Professor não encontrado.');
    }
};

export const updateDisciplinas = async (req: Request, res: Response): Promise<void> => {
    const professor = await Professor.findByPk(req.params.id) as any;
    if (professor) {
        await professor.setDisciplinas(req.body.disciplinas || []);
    }
    res.redirect(`/professores/${req.params.id}/disciplinas`);
};

export const manageDisponibilidadeForm = async (req: Request, res: Response): Promise<void> => {
    const professor = await Professor.findByPk(req.params.id, {
        include: { model: DisponibilidadeProfessor, as: 'disponibilidades' },
        order: [[{ model: DisponibilidadeProfessor, as: 'disponibilidades' }, 'dia_semana', 'ASC']]
    });

    if (professor) {
        const dias = { 1: 'Segunda', 2: 'Terça', 3: 'Quarta', 4: 'Quinta', 5: 'Sexta' };
        res.render('professor-disponibilidade', { title: 'Disponibilidade', professor, dias });
    } else {
        res.status(404).send('Professor não encontrado.');
    }
};

export const addDisponibilidade = async (req: Request, res: Response): Promise<void> => {
    const { dia_semana, hora_inicio, hora_fim } = req.body;
    await DisponibilidadeProfessor.create({
        professorId: parseInt(req.params.id as string, 10),
        dia_semana,
        hora_inicio,
        hora_fim
    });
    res.redirect(`/professores/${req.params.id}/disponibilidade`);
};

export const deleteDisponibilidade = async (req: Request, res: Response): Promise<void> => {
    const disponibilidade = await DisponibilidadeProfessor.findByPk(req.params.id);
    if (disponibilidade) {
        const professorId = disponibilidade.professorId;
        await disponibilidade.destroy();
        res.redirect(`/professores/${professorId}/disponibilidade`);
    } else {
        res.status(404).send('Disponibilidade não encontrada.');
    }
};
