import { Sequelize } from 'sequelize';
import * as process from 'process';
const env = process.env.NODE_ENV || 'development';
const config = require('../config/database')[env];

import initProfessor from './professor';
import initDisciplina from './disciplina';
import initTurma from './turma';
import initHorario from './horario';
import initDisponibilidadeProfessor from './disponibilidadeProfessor';
import initGrupoGeminado from './grupoGeminado';

const sequelize = config.use_env_variable
  ? new Sequelize(process.env[config.use_env_variable]!, config)
  : new Sequelize(config.database, config.username, config.password, config);

const db: any = {
  Professor: initProfessor(sequelize),
  Disciplina: initDisciplina(sequelize),
  Turma: initTurma(sequelize),
  Horario: initHorario(sequelize),
  DisponibilidadeProfessor: initDisponibilidadeProfessor(sequelize),
  GrupoGeminado: initGrupoGeminado(sequelize),
};

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// Associações
const { Professor, Disciplina, Turma, DisponibilidadeProfessor, Horario, GrupoGeminado } = db;

// Novas Associações para Grupos Geminados
GrupoGeminado.belongsTo(Disciplina, { foreignKey: 'disciplinaId' });
GrupoGeminado.belongsTo(Professor, { foreignKey: 'professorId' });
GrupoGeminado.belongsToMany(Turma, { through: 'GrupoGeminadoTurmas', as: 'turmas' });

Turma.belongsToMany(GrupoGeminado, { through: 'GrupoGeminadoTurmas' });

// Professor <-> Disciplina (N-M)
Professor.belongsToMany(Disciplina, { through: 'ProfessorDisciplinas', as: 'disciplinas' });
Disciplina.belongsToMany(Professor, { through: 'ProfessorDisciplinas', as: 'professores' });

// Professor <-> Disponibilidade (1-N)
Professor.hasMany(DisponibilidadeProfessor, { as: 'disponibilidades', foreignKey: 'professorId' });
DisponibilidadeProfessor.belongsTo(Professor, { foreignKey: 'professorId' });

// Turma <-> Disciplina (N-M)
Turma.belongsToMany(Disciplina, { through: 'TurmaDisciplinas', as: 'Disciplinas' });
Disciplina.belongsToMany(Turma, { through: 'TurmaDisciplinas', as: 'Turmas' });

// Relações com Horario
Horario.belongsTo(Turma, { foreignKey: 'turmaId' });
Horario.belongsTo(Disciplina, { foreignKey: 'disciplinaId' });
Horario.belongsTo(Professor, { foreignKey: 'professorId' });

Turma.hasMany(Horario, { foreignKey: 'turmaId' });
Professor.hasMany(Horario, { foreignKey: 'professorId' });

db.sequelize = sequelize;
db.Sequelize = Sequelize;

export {
  sequelize,
  Sequelize,
  Professor,
  Disciplina,
  Turma,
  DisponibilidadeProfessor,
  Horario,
  GrupoGeminado
};

export default db;
