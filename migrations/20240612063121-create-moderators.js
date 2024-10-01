'use strict';

const { type } = require('os');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('moderators', {
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
      status: {
        type: Sequelize.ENUM('pending', 'approved'),
        allowNull: true,
        defaultValue: 'pending',
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
      is_deleted: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
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
      is_active_status: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
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
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('moderators');
  },
};
