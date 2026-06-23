"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Disciplina = void 0;
const sequelize_1 = require("sequelize");
class Disciplina extends sequelize_1.Model {
}
exports.Disciplina = Disciplina;
exports.default = (sequelize) => {
    Disciplina.init({
        nome: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false
        },
        carga_horaria_semanal: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            comment: 'Número de aulas de 45 min por semana'
        }
    }, {
        sequelize,
        modelName: 'Disciplina',
    });
    return Disciplina;
};
