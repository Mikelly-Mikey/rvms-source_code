const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MaintenanceSchedule = sequelize.define('MaintenanceSchedule', {
  schedule_id: {
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
  service_type: {
    type: DataTypes.ENUM('oil_change', 'inspection', 'repair', 'tyre', 'brake', 'full_service'),
    allowNull: false
  },
  scheduled_date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  scheduled_mileage: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high'),
    defaultValue: 'medium'
  },
  status: {
    type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'cancelled'),
    defaultValue: 'pending'
  },
  assigned_to: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'maintenance_schedules',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    { fields: ['vehicle_id'] },
    { fields: ['scheduled_date'] },
    { fields: ['status'] },
    { fields: ['priority'] }
  ]
});

module.exports = MaintenanceSchedule;
