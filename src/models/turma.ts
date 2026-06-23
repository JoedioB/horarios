import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import { Turma as TurmaAttributes } from '../types';

interface TurmaCreationAttributes extends Optional<TurmaAttributes, 'id'> {}

export class Turma extends Model<TurmaAttributes, TurmaCreationAttributes> implements TurmaAttributes {
  public id!: number;
  public nome!: string;
  public ano!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export default (sequelize: Sequelize) => {
  Turma.init({
    nome: {
      type: DataTypes.STRING,
      allowNull: false
    },
    ano: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Turma',
  });
  return Turma;
};
