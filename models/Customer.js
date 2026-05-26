const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Customer = sequelize.define('Customer', {
  customer_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  first_name: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  last_name: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true
  },
  alt_phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  email: {
    type: DataTypes.STRING(254),
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  id_type: {
    type: DataTypes.ENUM('national_id', 'passport', 'alien_card'),
    allowNull: false
  },
  id_number: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  license_number: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  license_expiry: {
    type: DataTypes.DATE,
    allowNull: false
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  employer: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  next_of_kin_name: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  next_of_kin_phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  registered_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  is_blacklisted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  blacklist_reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'customers',
  timestamps: true,
  createdAt: 'date_registered',
  updatedAt: false,
  indexes: [
    { fields: ['phone'] },
    { fields: ['id_number'] },
    { fields: ['license_number'] }
  ]
});

// Instance method
Customer.prototype.getFullName = function() {
  return `${this.first_name} ${this.last_name}`.trim();
};

module.exports = Customer;
