const { User, Customer } = require("../models");
const { body, validationResult } = require("express-validator");
const { logActivity } = require("../utils/activityLogger");
const { sendVerificationEmail } = require("../utils/emailService");

const loginView = (req, res) => {
  res.render("auth/login", {
    error: req.query.error,
    message: req.query.message,
  });
};

const adminLoginView = (req, res) => {
  res.render("auth/admin_login", {
    error: req.query.error,
    message: req.query.message,
  });
};

const registerView = (req, res) => {
  res.render("auth/register", {
    error: req.query.error,
  });
};

const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.redirect(
      "/login?error=" + encodeURIComponent(errors.array()[0].msg),
    );
  }

  try {
    const { username, password } = req.body;

    const user = await User.findOne({ where: { username } });

    if (!user) {
      return res.redirect("/login?error=Invalid username or password");
    }

    const isValidPassword = await user.validatePassword(password);

    if (!isValidPassword) {
      return res.redirect("/login?error=Invalid username or password");
    }

    if (!user.is_active) {
      return res.redirect(
        "/login?error=Your account is inactive. Please contact administrator.",
      );
    }

    // Update last login timestamp
    await user.update({ last_login: new Date() });

    req.session.userId = user.id;
    req.session.userRole = user.role;

    // Redirect based on user role
    if (user.role === "customer") {
      return res.redirect("/");
    } else if (user.role === "admin") {
      return res.redirect("/"); // Will route to admin-dashboard
    } else {
      return res.redirect("/"); // Fleet supervisor, receptionist, mechanic -> dashboard
    }
  } catch (error) {
    console.error("Login error:", error);
    return res.redirect("/login?error=An error occurred during login");
  }
};

const adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ where: { username } });

    if (!user) {
      return res.redirect("/admin/login?error=Invalid username or password");
    }

    const isValidPassword = await user.validatePassword(password);

    if (!isValidPassword) {
      return res.redirect("/admin/login?error=Invalid username or password");
    }

    if (!user.is_active) {
      return res.redirect(
        "/admin/login?error=Your account is inactive. Please contact administrator.",
      );
    }

    // Check if user is staff
    const staffRoles = [
      "admin",
      "fleet_supervisor",
      "receptionist",
      "mechanic",
    ];
    if (!staffRoles.includes(user.role)) {
      return res.redirect(
        "/admin/login?error=Access denied. This login is for staff only.",
      );
    }

    req.session.userId = user.id;
    req.session.userRole = user.role;

    return res.redirect("/");
  } catch (error) {
    console.error("Admin login error:", error);
    return res.redirect("/admin/login?error=An error occurred during login");
  }
};

const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.redirect(
      "/register?error=" + encodeURIComponent(errors.array()[0].msg),
    );
  }

  try {
    const {
      username,
      email,
      password,
      first_name,
      last_name,
      phone,
      license_number,
      license_expiry,
      id_type,
      id_number,
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        [require("sequelize").Op.or]: [{ username }, { email }],
      },
    });

    if (existingUser) {
      return res.redirect("/register?error=Username or email already exists");
    }

    // Check if customer with same phone/email exists
    const existingCustomer = await Customer.findOne({
      where: {
        [require("sequelize").Op.or]: [{ phone }, { email }],
      },
    });

    if (existingCustomer) {
      return res.redirect(
        "/register?error=A customer with this phone or email already exists",
      );
    }

    // Create User account
    const user = await User.create({
      username,
      email,
      password,
      first_name,
      last_name,
      phone,
      license_number,
      role: "customer",
      is_email_verified: false,
    });

    // Create corresponding Customer record
    const customer = await Customer.create({
      first_name,
      last_name,
      phone,
      email,
      id_type: id_type || "national_id",
      id_number: id_number || "PENDING",
      license_number: license_number || "PENDING",
      license_expiry:
        license_expiry || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now if not provided
      registered_by: null, // Self-registration
      notes: "Self-registered customer account",
    });

    // Log the registration activity (system activity)
    await logActivity(
      user,
      "register",
      "customer",
      customer.customer_id,
      `New customer registered: ${user.getFullName()} (${email})`,
    );

    // Send verification email
    try {
      const verificationToken = await user.generateEmailVerificationToken();
      await sendVerificationEmail(user, verificationToken);
    } catch (emailError) {
      console.error("Error sending verification email:", emailError);
      // Don't fail registration if email fails
    }

    return res.redirect(
      "/login?message=" +
        encodeURIComponent(
          "Account created successfully! Please check your email to verify your account.",
        ),
    );
  } catch (error) {
    console.error("Registration error:", error);
    return res.redirect(
      "/register?error=An error occurred during registration",
    );
  }
};

const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
    }
    res.redirect("/login");
  });
};

module.exports = {
  loginView,
  adminLoginView,
  registerView,
  login,
  adminLogin,
  register,
  logout,
};
