'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('TicketSystems', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      description: {
        type: Sequelize.TEXT('long'),
        allowNull: false,
      },
      images: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      moderatorId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      is_paid: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'cancel'),
        allowNull: true,
        defaultValue: 'pending',
      },
      admin_feedback: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      property_url: {
        type: Sequelize.TEXT("long"),
        allowNull: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('TicketSystems');
  },
};
