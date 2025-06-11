module.exports = (sequelize, DataTypes) => {
  const GrupoGeminado = sequelize.define('GrupoGeminado', {
    nome: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Optativa 3ºs Anos'
    }
  });
  return GrupoGeminado;
};