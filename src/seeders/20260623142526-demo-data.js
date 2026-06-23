'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.bulkInsert('Professors', [
        { nome: 'Prof. João', createdAt: new Date(), updatedAt: new Date() },
        { nome: 'Prof. Maria', createdAt: new Date(), updatedAt: new Date() }
      ], { transaction });

      await queryInterface.bulkInsert('Disciplinas', [
        { nome: 'Matemática', carga_horaria_semanal: 4, createdAt: new Date(), updatedAt: new Date() },
        { nome: 'História', carga_horaria_semanal: 2, createdAt: new Date(), updatedAt: new Date() }
      ], { transaction });

      await queryInterface.bulkInsert('Turmas', [
        { nome: '1A', ano: '1º Ano', createdAt: new Date(), updatedAt: new Date() },
        { nome: '2B', ano: '2º Ano', createdAt: new Date(), updatedAt: new Date() }
      ], { transaction });


      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Classes', null, {});
    await queryInterface.bulkDelete('Disciplines', null, {});
    await queryInterface.bulkDelete('Professors', null, {});
  }
};
