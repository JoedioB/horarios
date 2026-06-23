import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import { Horario as HorarioAttributes } from '../types';

interface HorarioCreationAttributes extends Optional<HorarioAttributes, 'id'> {}

export class Horario extends Model<HorarioAttributes, HorarioCreationAttributes> implements HorarioAttributes {
  public id!: number;
  public dia_semana!: number;
  public hora_inicio!: string;
  public hora_fim!: string;
  public turmaId?: number;
  public disciplinaId?: number;
  public professorId?: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export default (sequelize: Sequelize) => {
  Horario.init({
    dia_semana: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    hora_inicio: {
      type: DataTypes.TIME,
      allowNull: false
    },
    hora_fim: {
      type: DataTypes.TIME,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Horario',
  });
  return Horario;
};
