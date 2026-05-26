const sequelize = require('../config/database');
const User = require('./User');
const Vehicle = require('./Vehicle');
const Customer = require('./Customer');
const Booking = require('./Booking');
const Payment = require('./Payment');
const MpesaTransaction = require('./MpesaTransaction');
const Maintenance = require('./Maintenance');
const MaintenanceSchedule = require('./MaintenanceSchedule');
const MaintenanceAlert = require('./MaintenanceAlert');
const Category = require('./Category');
const Supplier = require('./Supplier');
const InventoryItem = require('./InventoryItem');
const ActivityLog = require('./ActivityLog');
const Review = require('./Review');

// Define relationships
User.hasMany(Customer, { foreignKey: 'registered_by', as: 'registered_customers' });
Customer.belongsTo(User, { foreignKey: 'registered_by', as: 'registrar' });

User.hasMany(Booking, { foreignKey: 'created_by', as: 'created_bookings' });
Booking.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

Customer.hasMany(Booking, { foreignKey: 'customer_id', as: 'bookings' });
Booking.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });

Vehicle.hasMany(Booking, { foreignKey: 'vehicle_id', as: 'bookings' });
Booking.belongsTo(Vehicle, { foreignKey: 'vehicle_id', as: 'vehicle' });

Booking.hasMany(Payment, { foreignKey: 'booking_id', as: 'payments' });
Payment.belongsTo(Booking, { foreignKey: 'booking_id', as: 'booking' });

User.hasMany(Payment, { foreignKey: 'recorded_by', as: 'recorded_payments' });
Payment.belongsTo(User, { foreignKey: 'recorded_by', as: 'recorder' });

Booking.hasMany(MpesaTransaction, { foreignKey: 'booking_id', as: 'mpesa_transactions' });
MpesaTransaction.belongsTo(Booking, { foreignKey: 'booking_id', as: 'booking' });

Vehicle.hasMany(Maintenance, { foreignKey: 'vehicle_id', as: 'maintenance_records' });
Maintenance.belongsTo(Vehicle, { foreignKey: 'vehicle_id', as: 'vehicle' });

User.hasMany(Maintenance, { foreignKey: 'completed_by', as: 'completed_maintenance' });
Maintenance.belongsTo(User, { foreignKey: 'completed_by', as: 'completer' });

Vehicle.hasMany(MaintenanceSchedule, { foreignKey: 'vehicle_id', as: 'maintenance_schedules' });
MaintenanceSchedule.belongsTo(Vehicle, { foreignKey: 'vehicle_id', as: 'vehicle' });

User.hasMany(MaintenanceSchedule, { foreignKey: 'assigned_to', as: 'assigned_schedules' });
MaintenanceSchedule.belongsTo(User, { foreignKey: 'assigned_to', as: 'assignee' });

Vehicle.hasMany(MaintenanceAlert, { foreignKey: 'vehicle_id', as: 'maintenance_alerts' });
MaintenanceAlert.belongsTo(Vehicle, { foreignKey: 'vehicle_id', as: 'vehicle' });

Category.hasMany(Category, { foreignKey: 'parent_id', as: 'children' });
Category.belongsTo(Category, { foreignKey: 'parent_id', as: 'parent' });

Category.hasMany(InventoryItem, { foreignKey: 'category_id', as: 'items' });
InventoryItem.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });

Supplier.hasMany(InventoryItem, { foreignKey: 'supplier_id', as: 'supplied_items' });
InventoryItem.belongsTo(Supplier, { foreignKey: 'supplier_id', as: 'supplier' });

Vehicle.belongsToMany(InventoryItem, {
  through: 'VehicleInventoryCompatibility',
  as: 'compatible_parts',
  foreignKey: 'vehicle_id',
  otherKey: 'item_id'
});
InventoryItem.belongsToMany(Vehicle, {
  through: 'VehicleInventoryCompatibility',
  as: 'compatible_vehicles',
  foreignKey: 'item_id',
  otherKey: 'vehicle_id'
});

// Review relationships
Vehicle.hasMany(Review, { foreignKey: 'vehicle_id', as: 'reviews' });
Review.belongsTo(Vehicle, { foreignKey: 'vehicle_id', as: 'vehicle' });

User.hasMany(Review, { foreignKey: 'user_id', as: 'reviews' });
Review.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// ActivityLog relationships
User.hasMany(ActivityLog, { foreignKey: 'user_id', as: 'activities' });
ActivityLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = {
  sequelize,
  User,
  Vehicle,
  Customer,
  Booking,
  Payment,
  MpesaTransaction,
  Maintenance,
  MaintenanceSchedule,
  MaintenanceAlert,
  Category,
  Supplier,
  InventoryItem,
  ActivityLog,
  Review
};
