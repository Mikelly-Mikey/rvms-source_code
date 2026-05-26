const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Vehicle = sequelize.define('Vehicle', {
  vehicle_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  registration: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true
  },
  make: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  model: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  color: {
    type: DataTypes.STRING(30),
    allowNull: false
  },
  fuel_type: {
    type: DataTypes.ENUM('petrol', 'diesel', 'electric', 'hybrid'),
    allowNull: false
  },
  transmission: {
    type: DataTypes.ENUM('manual', 'automatic'),
    allowNull: false
  },
  seating_capacity: {
    type: DataTypes.INTEGER,
    defaultValue: 5
  },
  category: {
    type: DataTypes.ENUM('economy', 'compact', 'suv', 'luxury'),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  features: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  daily_rate: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  weekly_rate: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  monthly_rate: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('available', 'reserved', 'on-rent', 'maintenance', 'offline'),
    defaultValue: 'available'
  },
  current_mileage: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  current_fuel: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  location: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  insurance_expiry: {
    type: DataTypes.DATE,
    allowNull: true
  },
  inspection_expiry: {
    type: DataTypes.DATE,
    allowNull: true
  },
  registration_expiry: {
    type: DataTypes.DATE,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  image_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  }
}, {
  tableName: 'vehicles',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['status'] },
    { fields: ['category'] },
    { fields: ['registration'] }
  ]
});

module.exports = Vehicle;
