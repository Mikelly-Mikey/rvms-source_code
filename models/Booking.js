const { DataTypes, Op } = require('sequelize');
const sequelize = require('../config/database');

const Booking = sequelize.define('Booking', {
  booking_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  booking_reference: {
    type: DataTypes.STRING(20),
    unique: true,
    allowNull: true
  },
  customer_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'customers',
      key: 'customer_id'
    }
  },
  vehicle_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'vehicles',
      key: 'vehicle_id'
    }
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  start_date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  end_date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  pickup_time: {
    type: DataTypes.TIME,
    allowNull: false
  },
  return_time: {
    type: DataTypes.TIME,
    allowNull: false
  },
  actual_pickup_time: {
    type: DataTypes.DATE,
    allowNull: true
  },
  actual_return_time: {
    type: DataTypes.DATE,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('confirmed', 'checked-out', 'completed', 'cancelled', 'no-show'),
    defaultValue: 'confirmed'
  },
  total_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  deposit_paid: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  balance_due: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  discount_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  discount_reason: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  late_fee: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  damage_charges: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  fuel_charges: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  check_out_mileage: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  check_in_mileage: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  check_out_fuel: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  check_in_fuel: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  check_out_notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  check_in_notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  cancellation_reason: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'bookings',
  timestamps: true,
  createdAt: 'created_date',
  updatedAt: 'modified_date',
  hooks: {
    beforeCreate: async (booking) => {
      if (!booking.booking_reference) {
        const now = new Date();
        const prefix = `RVMS-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
        const lastBooking = await Booking.findOne({
          where: {
            booking_reference: {
              [Op.like]: `${prefix}%`
            }
          },
          order: [['booking_id', 'DESC']]
        });
        let num = 1;
        if (lastBooking) {
          const lastNum = parseInt(lastBooking.booking_reference.split('-').pop());
          num = lastNum + 1;
        }
        booking.booking_reference = `${prefix}-${String(num).padStart(4, '0')}`;
      }
    }
  },
  indexes: [
    { fields: ['booking_reference'] },
    { fields: ['customer_id'] },
    { fields: ['vehicle_id'] },
    { fields: ['status'] },
    { fields: ['start_date'] }
  ]
});

module.exports = Booking;
