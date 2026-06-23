"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Horario = void 0;
const sequelize_1 = require("sequelize");
class Horario extends sequelize_1.Model {
}
exports.Horario = Horario;
exports.default = (sequelize) => {
    Horario.init({
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
        modelName: 'Horario',
    });
    return Horario;
};
