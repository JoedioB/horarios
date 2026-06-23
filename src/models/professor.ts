import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import { Professor as ProfessorAttributes } from '../types';

interface ProfessorCreationAttributes extends Optional<ProfessorAttributes, 'id'> {}

export class Professor extends Model<ProfessorAttributes, ProfessorCreationAttributes> implements ProfessorAttributes {
  public id!: number;
  public nome!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  static associate(models: any) {
    // Associações são definidas no index.ts por enquanto, mas podemos mover para cá se necessário
  }
}

export default (sequelize: Sequelize) => {
  Professor.init({
    nome: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Professor',
  });
  return Professor;
};
