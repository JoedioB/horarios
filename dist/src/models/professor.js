"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Professor = void 0;
const sequelize_1 = require("sequelize");
class Professor extends sequelize_1.Model {
    static associate(models) {
        // Associações são definidas no index.ts por enquanto, mas podemos mover para cá se necessário
    }
}
exports.Professor = Professor;
exports.default = (sequelize) => {
    Professor.init({
        nome: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false
        }
    }, {
        sequelize,
        modelName: 'Professor',
    });
    return Professor;
};
