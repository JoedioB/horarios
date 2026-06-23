export interface Professor {
  id?: number;
  nome: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Disciplina {
  id?: number;
  nome: string;
  carga_horaria_semanal: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Turma {
  id?: number;
  nome: string;
  ano: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Horario {
  id?: number;
  dia_semana: number;
  hora_inicio: string;
  hora_fim: string;
  turmaId?: number;
  disciplinaId?: number;
  professorId?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface DisponibilidadeProfessor {
  id?: number;
  dia_semana: number;
  hora_inicio: string;
  hora_fim: string;
  professorId?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface GrupoGeminado {
  id?: number;
  nome: string;
  disciplinaId?: number;
  professorId?: number;
  createdAt?: Date;
  updatedAt?: Date;
}
