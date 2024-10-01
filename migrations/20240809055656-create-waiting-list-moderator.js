'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('WaitingListModerators', {
      id: {
        allowNull: true,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      state: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      county: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      fee_to_pay: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      noOfSoldProp: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      noOfHoldProp: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      noOfDeclinedProp: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },

      email: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: 0,
      },

      userId: {
        // New column
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Users', // Name of the referenced table
          key: 'id', // Name of the referenced column in the users table
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },

      createdAt: {
        allowNull: true,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        allowNull: true,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('WaitingListModerators');
  },
};
