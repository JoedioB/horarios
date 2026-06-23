"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Turma = void 0;
const sequelize_1 = require("sequelize");
class Turma extends sequelize_1.Model {
}
exports.Turma = Turma;
exports.default = (sequelize) => {
    Turma.init({
        nome: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false
        },
        ano: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false
        }
    }, {
        sequelize,
        modelName: 'Turma',
    });
    return Turma;
};
