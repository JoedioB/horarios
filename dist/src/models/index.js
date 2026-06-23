"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GrupoGeminado = exports.Horario = exports.DisponibilidadeProfessor = exports.Turma = exports.Disciplina = exports.Professor = exports.Sequelize = exports.sequelize = void 0;
const sequelize_1 = require("sequelize");
Object.defineProperty(exports, "Sequelize", { enumerable: true, get: function () { return sequelize_1.Sequelize; } });
const process = __importStar(require("process"));
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/database.js')[env];
const professor_1 = __importDefault(require("./professor"));
const disciplina_1 = __importDefault(require("./disciplina"));
const turma_1 = __importDefault(require("./turma"));
const horario_1 = __importDefault(require("./horario"));
const disponibilidadeProfessor_1 = __importDefault(require("./disponibilidadeProfessor"));
const grupoGeminado_1 = __importDefault(require("./grupoGeminado"));
const sequelize = config.use_env_variable
    ? new sequelize_1.Sequelize(process.env[config.use_env_variable], config)
    : new sequelize_1.Sequelize(config.database, config.username, config.password, config);
exports.sequelize = sequelize;
const db = {
    Professor: (0, professor_1.default)(sequelize),
    Disciplina: (0, disciplina_1.default)(sequelize),
    Turma: (0, turma_1.default)(sequelize),
    Horario: (0, horario_1.default)(sequelize),
    DisponibilidadeProfessor: (0, disponibilidadeProfessor_1.default)(sequelize),
    GrupoGeminado: (0, grupoGeminado_1.default)(sequelize),
};
Object.keys(db).forEach(modelName => {
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
});
// Associações
const { Professor, Disciplina, Turma, DisponibilidadeProfessor, Horario, GrupoGeminado } = db;
exports.Professor = Professor;
exports.Disciplina = Disciplina;
exports.Turma = Turma;
exports.DisponibilidadeProfessor = DisponibilidadeProfessor;
exports.Horario = Horario;
exports.GrupoGeminado = GrupoGeminado;
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
db.Sequelize = sequelize_1.Sequelize;
exports.default = db;
