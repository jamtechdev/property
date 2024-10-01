'use strict';

// {
//   "username": "rehabloop",
//   "password": "Bq^i!Wa~U(>8",
//   "database": "rehabloop_db",
//   "host": "34.203.25.237",
//   "dialect": "mysql",
//   "models": "/models"
// }

const { Unique } = require('sequelize-typescript');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Users', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },

      username: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      mobile: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      email: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: true,
      },
      firstname: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      lastname: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      Position: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      Language: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      company_name: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      tax_no: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      address: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      about_me: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      social_media: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      latitude: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      longitude: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      roleId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Roles',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      city: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      state: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      country: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      password: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      image: {
        type: Sequelize.STRING, // Storing as stringified array
        allowNull: true,
      },

      lastLoginTime: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: Sequelize.fn('now'),
      },
      slug: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      is_moderator: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },

      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },

      createdAt: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: Sequelize.fn('now'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: Sequelize.fn('now'),
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Users');
  },
};
