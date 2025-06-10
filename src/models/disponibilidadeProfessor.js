module.exports = (sequelize, DataTypes) => {
  const DisponibilidadeProfessor = sequelize.define('DisponibilidadeProfessor', {
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
  });
  return DisponibilidadeProfessor;
};