import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import { GrupoGeminado as GrupoGeminadoAttributes } from '../types';

interface GrupoGeminadoCreationAttributes extends Optional<GrupoGeminadoAttributes, 'id'> {}

export class GrupoGeminado extends Model<GrupoGeminadoAttributes, GrupoGeminadoCreationAttributes> implements GrupoGeminadoAttributes {
  public id!: number;
  public nome!: string;
  public disciplinaId?: number;
  public professorId?: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export default (sequelize: Sequelize) => {
  GrupoGeminado.init({
    nome: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Optativa 3ºs Anos'
    }
  }, {
    sequelize,
    modelName: 'GrupoGeminado',
  });
  return GrupoGeminado;
};
