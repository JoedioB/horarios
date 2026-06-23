import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import { Disciplina as DisciplinaAttributes } from '../types';

interface DisciplinaCreationAttributes extends Optional<DisciplinaAttributes, 'id'> {}

export class Disciplina extends Model<DisciplinaAttributes, DisciplinaCreationAttributes> implements DisciplinaAttributes {
  public id!: number;
  public nome!: string;
  public carga_horaria_semanal!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export default (sequelize: Sequelize) => {
  Disciplina.init({
    nome: {
      type: DataTypes.STRING,
      allowNull: false
    },
    carga_horaria_semanal: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Número de aulas de 45 min por semana'
    }
  }, {
    sequelize,
    modelName: 'Disciplina',
  });
  return Disciplina;
};
