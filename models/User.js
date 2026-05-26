const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING(254),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING(128),
    allowNull: false
  },
  first_name: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  last_name: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('admin', 'fleet_supervisor', 'receptionist', 'mechanic', 'customer'),
    allowNull: false,
    defaultValue: 'customer'
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  license_number: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  profile_picture: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  is_staff: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  is_superuser: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  date_joined: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  last_updated: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  last_login: {
    type: DataTypes.DATE,
    allowNull: true
  },
  is_email_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  email_verification_token: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  password_reset_token: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  password_reset_expires: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'date_joined',
  updatedAt: 'last_updated',
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        user.password = await bcrypt.hash(user.password, 10);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 10);
      }
    }
  }
});

// Instance methods
User.prototype.getFullName = function() {
  return `${this.first_name} ${this.last_name}`.trim();
};

User.prototype.hasRole = function(role) {
  return this.role === role;
};

User.prototype.hasPermission = function(permission) {
  const permissions = this.getRolePermissions();
  return permissions.includes(permission);
};

User.prototype.getRolePermissions = function() {
  const rolePermissions = {
    admin: [
      'view_reports', 'manage_users', 'manage_settings'
    ],
    fleet_supervisor: [
      'manage_vehicles', 'manage_maintenance', 'view_reports'
    ],
    receptionist: [
      'manage_bookings', 'manage_customers', 'manage_payments', 'view_reports'
    ],
    mechanic: [
      'manage_maintenance'
    ],
    customer: [
      'view_own_bookings', 'make_payments'
    ]
  };
  return rolePermissions[this.role] || [];
};

User.prototype.validatePassword = async function(password) {
  return bcrypt.compare(password, this.password);
};

module.exports = User;
