"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DisponibilidadeProfessor = void 0;
const sequelize_1 = require("sequelize");
class DisponibilidadeProfessor extends sequelize_1.Model {
}
exports.DisponibilidadeProfessor = DisponibilidadeProfessor;
exports.default = (sequelize) => {
    DisponibilidadeProfessor.init({
        dia_semana: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false
        },
        hora_inicio: {
            type: sequelize_1.DataTypes.TIME,
            allowNull: false
        },
        hora_fim: {
            type: sequelize_1.DataTypes.TIME,
            allowNull: false
        }
    }, {
        sequelize,
        modelName: 'DisponibilidadeProfessor',
        tableName: 'DisponibilidadeProfessors' // Sequelize might pluralize it weirdly, maintaining consistency
    });
    return DisponibilidadeProfessor;
};
