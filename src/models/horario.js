module.exports = (sequelize, DataTypes) => {
  const Horario = sequelize.define('Horario', {
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
  });
  return Horario;
};