"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GrupoGeminado = void 0;
const sequelize_1 = require("sequelize");
class GrupoGeminado extends sequelize_1.Model {
}
exports.GrupoGeminado = GrupoGeminado;
exports.default = (sequelize) => {
    GrupoGeminado.init({
        nome: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
            comment: 'Optativa 3ºs Anos'
        }
    }, {
        sequelize,
        modelName: 'GrupoGeminado',
    });
    return GrupoGeminado;
};
