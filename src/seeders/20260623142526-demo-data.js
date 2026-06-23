'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.bulkInsert('Professores', [
        { nome: 'Prof. João', createdAt: new Date(), updatedAt: new Date() },
        { nome: 'Prof. Maria', createdAt: new Date(), updatedAt: new Date() }
      ], { transaction });

      await queryInterface.bulkInsert('Disciplinas', [
        { nome: 'Matemática', carga_horaria_semanal: 4, createdAt: new Date(), updatedAt: new Date() },
        { nome: 'História', carga_horaria_semanal: 2, createdAt: new Date(), updatedAt: new Date() }
      ], { transaction });

      await queryInterface.bulkInsert('Turmas', [
        { nome: '1A', createdAt: new Date(), updatedAt: new Date() },
        { nome: '2B', createdAt: new Date(), updatedAt: new Date() }
      ], { transaction });

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Turmas', null, {});
    await queryInterface.bulkDelete('Disciplinas', null, {});
    await queryInterface.bulkDelete('Professores', null, {});
  }
};
