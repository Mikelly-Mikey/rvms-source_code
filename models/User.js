const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    username: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING(254),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING(128),
      allowNull: false,
    },
    first_name: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    last_name: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM(
        "admin",
        "fleet_supervisor",
        "receptionist",
        "mechanic",
        "customer",
      ),
      allowNull: false,
      defaultValue: "customer",
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    license_number: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    profile_picture: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    is_staff: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    is_superuser: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    date_joined: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    last_updated: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    last_login: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    is_email_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    email_verification_token: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    email_verification_expires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    email_verification_attempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    password_reset_token: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    password_reset_expires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "users",
    timestamps: true,
    createdAt: "date_joined",
    updatedAt: "last_updated",
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          user.password = await bcrypt.hash(user.password, 10);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed("password")) {
          user.password = await bcrypt.hash(user.password, 10);
        }
      },
    },
  },
);

// Instance methods
User.prototype.getFullName = function () {
  return `${this.first_name} ${this.last_name}`.trim();
};

User.prototype.hasRole = function (role) {
  return this.role === role;
};

User.prototype.hasPermission = function (permission) {
  if (this.role === "admin") return true;
  const permissions = this.getRolePermissions();
  return permissions.includes(permission);
};

User.prototype.getRolePermissions = function () {
  const rolePermissions = {
    admin: [
      "view_reports",
      "manage_users",
      "manage_settings",
      "manage_vehicles",
      "manage_maintenance",
      "manage_bookings",
      "manage_customers",
      "manage_payments",
      "manage_inventory",
    ],
    fleet_supervisor: [
      "manage_vehicles",
      "manage_maintenance",
      "manage_inventory",
      "view_reports",
    ],
    receptionist: [
      "manage_bookings",
      "manage_customers",
      "manage_payments",
      "view_reports",
    ],
    mechanic: ["manage_maintenance"],
    customer: ["view_own_bookings", "make_payments"],
  };
  return rolePermissions[this.role] || [];
};

User.prototype.validatePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

// SECURE: Generate and store a hashed email verification token with expiry
// Returns the plain token (caller should send it to the user via email/SMS)
User.prototype.generateEmailVerificationToken = async function () {
  // Generate a secure 32-byte token (64 hex chars)
  const plainToken = crypto.randomBytes(32).toString("hex");
  
  // Hash the token before storing
  const hashedToken = crypto
    .createHash("sha256")
    .update(plainToken)
    .digest("hex");
  
  // Set expiry to 24 hours from now
  const expiryDate = new Date();
  expiryDate.setHours(expiryDate.getHours() + 24);
  
  this.email_verification_token = hashedToken;
  this.email_verification_expires = expiryDate;
  this.email_verification_attempts = 0; // Reset attempts on new token
  await this.save();
  
  // Return the plain token to send to user
  return plainToken;
};

// SECURE: Verify a supplied token with expiry and attempt limits
User.prototype.verifyEmailToken = async function (token) {
  if (!token || !this.email_verification_token) return false;
  
  // Check if token has expired
  if (this.email_verification_expires && new Date() > this.email_verification_expires) {
    return false;
  }
  
  // Check attempt limit (max 5 attempts)
  if (this.email_verification_attempts >= 5) {
    return false;
  }
  
  // Hash the provided token
  const hashedToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
  
  // Compare hashed tokens using timing-safe comparison
  if (!this.email_verification_token || typeof this.email_verification_token !== "string") return false;
  if (this.email_verification_token.length !== hashedToken.length) {
    this.email_verification_attempts += 1;
    await this.save();
    return false;
  }

  const isValid = crypto.timingSafeEqual(
    Buffer.from(hashedToken),
    Buffer.from(this.email_verification_token)
  );
  
  if (isValid) {
    // Token is valid - mark as verified and clear token
    this.is_email_verified = true;
    this.email_verification_token = null;
    this.email_verification_expires = null;
    this.email_verification_attempts = 0;
    await this.save();
    return true;
  } else {
    // Increment failed attempts
    this.email_verification_attempts += 1;
    await this.save();
    return false;
  }
};

module.exports = User;
