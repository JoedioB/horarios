module.exports = (sequelize, DataTypes) => {
  const Turma = sequelize.define('Turma', {
    nome: {
      type: DataTypes.STRING,
      allowNull: false
    },
    ano: {
      type: DataTypes.STRING,
      allowNull: false
    }
  });
  return Turma;
};