const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MpesaTransaction = sequelize.define('MpesaTransaction', {
  transaction_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  booking_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'bookings',
      key: 'booking_id'
    }
  },
  checkout_request_id: {
    type: DataTypes.STRING(100),
    unique: true,
    allowNull: false
  },
  merchant_request_id: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  phone_number: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  mpesa_receipt: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  result_code: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  result_desc: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed', 'cancelled'),
    defaultValue: 'pending'
  },
  completed_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'mpesa_transactions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    { fields: ['checkout_request_id'] },
    { fields: ['booking_id'] },
    { fields: ['status'] }
  ]
});

module.exports = MpesaTransaction;
