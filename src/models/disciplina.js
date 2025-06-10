module.exports = (sequelize, DataTypes) => {
  const Disciplina = sequelize.define('Disciplina', {
    nome: {
      type: DataTypes.STRING,
      allowNull: false
    },
    carga_horaria_semanal: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Número de aulas de 45 min por semana'
    }
  });
  return Disciplina;
};