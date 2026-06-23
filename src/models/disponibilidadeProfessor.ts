import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import { DisponibilidadeProfessor as DisponibilidadeAttributes } from '../types';

interface DisponibilidadeCreationAttributes extends Optional<DisponibilidadeAttributes, 'id'> {}

export class DisponibilidadeProfessor extends Model<DisponibilidadeAttributes, DisponibilidadeCreationAttributes> implements DisponibilidadeAttributes {
  public id!: number;
  public dia_semana!: number;
  public hora_inicio!: string;
  public hora_fim!: string;
  public professorId?: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export default (sequelize: Sequelize) => {
  DisponibilidadeProfessor.init({
    dia_semana: { // 1=Seg, 2=Ter, ..., 5=Sex
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
    modelName: 'DisponibilidadeProfessor',
    tableName: 'DisponibilidadeProfessors' // Sequelize might pluralize it weirdly, maintaining consistency
  });
  return DisponibilidadeProfessor;
};
