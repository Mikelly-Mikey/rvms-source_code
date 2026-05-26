const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Maintenance = sequelize.define('Maintenance', {
  maintenance_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  vehicle_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'vehicles',
      key: 'vehicle_id'
    }
  },
  service_date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  mileage: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  service_type: {
    type: DataTypes.ENUM('oil_change', 'inspection', 'repair', 'tyre', 'brake', 'full_service'),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  cost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  provider: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  provider_contact: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  next_service_mileage: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  next_service_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  is_scheduled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  completed_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'maintenance',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    { fields: ['vehicle_id'] },
    { fields: ['service_date'] },
    { fields: ['service_type'] }
  ]
});

module.exports = Maintenance;
