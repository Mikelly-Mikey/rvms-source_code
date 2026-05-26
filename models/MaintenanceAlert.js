const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MaintenanceAlert = sequelize.define('MaintenanceAlert', {
  alert_id: {
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
  alert_type: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  due_date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  is_read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'maintenance_alerts',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    { fields: ['vehicle_id'] },
    { fields: ['due_date'] },
    { fields: ['is_read'] }
  ]
});

module.exports = MaintenanceAlert;
