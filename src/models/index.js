// src/models/index.js

'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/database.js')[env];
const db = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    );
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

// Associações
const { Professor, Disciplina, Turma, DisponibilidadeProfessor, Horario } = db;

// Professor <-> Disciplina (N-M) - CORREÇÃO APLICADA AQUI
Professor.belongsToMany(Disciplina, { through: 'ProfessorDisciplinas', as: 'disciplinas' });
Disciplina.belongsToMany(Professor, { through: 'ProfessorDisciplinas', as: 'professores' });

// Professor <-> Disponibilidade (1-N)
Professor.hasMany(DisponibilidadeProfessor, { as: 'disponibilidades', foreignKey: 'professorId' });
DisponibilidadeProfessor.belongsTo(Professor, { foreignKey: 'professorId' });

// Turma <-> Disciplina (N-M)
Turma.belongsToMany(Disciplina, { through: 'TurmaDisciplinas', as: 'Disciplinas' }); // Note que o controller usa 'Disciplinas' com 'D' maiúsculo
Disciplina.belongsToMany(Turma, { through: 'TurmaDisciplinas', as: 'Turmas' });

// Relações com Horario
Horario.belongsTo(Turma, { foreignKey: 'turmaId' });
Horario.belongsTo(Disciplina, { foreignKey: 'disciplinaId' });
Horario.belongsTo(Professor, { foreignKey: 'professorId' });

Turma.hasMany(Horario, { foreignKey: 'turmaId' });
Professor.hasMany(Horario, { foreignKey: 'professorId' });


module.exports = db;