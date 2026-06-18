const { Customer } = require("../models");

/**
 * Resolves the Customer record associated with a given User.
 * Matches by email which is unique across both tables.
 */
async function resolveCustomerForUser(user) {
  if (!user) return null;
  try {
    return await Customer.findOne({ where: { email: user.email } });
  } catch (error) {
    console.error("Error resolving customer for user:", error.message);
    return null;
  }
}

module.exports = { resolveCustomerForUser };
