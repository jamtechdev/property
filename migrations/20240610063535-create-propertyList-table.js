'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('propertyList', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      propertyName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      propertyTitle: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      propertyDescription: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      images: {
        type: Sequelize.TEXT('long'), // Storing as stringified array
        allowNull: false,
        get() {
          return JSON.parse(this.getDataValue('images'));
        },
        set(value) {
          this.setDataValue('images', JSON.stringify(value));
        },
      },
      postedBy: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      countyId: {
        type: Sequelize.STRING,
        allowNull: true,

      },
      stateId: {
        type: Sequelize.STRING,
        allowNull: true,

      },

      // new line comment   // new line
      countryId: {
        type: Sequelize.STRING,
        defaultValue: 'US',
        allowNull: true,

      },
      latitude: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      longitude: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('Publish', 'Hold', 'Decline', 'Contract', 'Posted', 'Archived', 'Do_not_list', 'Sold'),
        allowNull: false,
        defaultValue: 'Posted',
      },
      doNotListReason: {
        type: Sequelize.TEXT("long"),
        allowNull: true,
      },

      select_Category: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      listed_in: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      property_Status: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      price_in: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },

      yearly_tax_rate: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      after_price_label: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      zip: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      neighbour: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      address: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      city: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      size_in_ft: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      lot_size_in_ft: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      rooms: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      bedrooms: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      bathrooms: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      custom_id: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      Garages: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      Garage_size: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      Year_built: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      Available_from: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      Basement: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      Extra_details: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      Roofing: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      extra_material: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      Structure_type: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      Floors_no: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      Energy_class: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      Energy_index: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      owner_notes: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      hold_duration: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      hold_current_date: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      decline_reason: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      contract_details: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      other_features: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      slug: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      street_type: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      street_name: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      house_number: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      end_contract: {
        type: Sequelize.DATE,
        allowNull: true,
      },

      contract_action: {
        type: Sequelize.ENUM('End_Trash', 'End_publish', 'Extend'),
        allowNull: true,
      },

      contract_cancel_reason: {
        type: Sequelize.TEXT,
        allowNull: true,
      },


      contract_description: {
        type: Sequelize.STRING,
        allowNull: true
      },

      education: {
        type: Sequelize.TEXT('long'),
        allowNull: true
      },

      medical: {
        type: Sequelize.TEXT('long'),
        allowNull: true
      },

      transportation: {
        type: Sequelize.TEXT('long'),
        allowNull: true
      },

      featured_property: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      },
      featuredAt: {
        type: Sequelize.DATE,
        allowNull: true
      },

      posted_on: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },

      property_sold: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },

      is_deleted_property: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      },

      renew_date: {
        type: Sequelize.DATE,
        allowNull: true,

      },
      bid_title: {
        type: Sequelize.TEXT('long'),
        allowNull: true
      },
      bid_description: {
        type: Sequelize.TEXT('long'),
        allowNull: true
      },

      property_bid_start: {
        type: Sequelize.DATETIME,
        allowNull: true,
      },
      property_bid_end: {
        type: Sequelize.DATETIME,
        allowNull: true,
      },
      is_under_biding: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: true,
      },
      min_bid_amount: {
        type: Sequelize.FLOAT,
        allowNull: true,
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

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('propertyList');
  }
};