const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const InventoryItem = sequelize.define('InventoryItem', {
  item_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  sku: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  item_type: {
    type: DataTypes.ENUM('part', 'consumable', 'tool', 'equipment', 'accessory', 'fluid', 'tire'),
    allowNull: false
  },
  category_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'categories',
      key: 'category_id'
    }
  },
  universal: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  manufacturer: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  part_number: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  brand: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  model: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  unit: {
    type: DataTypes.ENUM('piece', 'liter', 'gallon', 'kg', 'meter', 'set', 'box'),
    allowNull: false
  },
  current_stock: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  minimum_stock: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  maximum_stock: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  reorder_point: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  unit_cost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  selling_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  location: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'inventory_items',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['sku'] },
    { fields: ['name'] },
    { fields: ['category_id'] },
    { fields: ['item_type'] }
  ]
});

module.exports = InventoryItem;
