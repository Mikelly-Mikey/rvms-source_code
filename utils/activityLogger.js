const { ActivityLog } = require("../models");

/**
 * Logs user activity to the database for auditing purposes.
 *
 * @param {Object} user - The user performing the action (typically req.user)
 * @param {string} action - The action type (e.g., 'login', 'create', 'update', 'delete', 'checkout')
 * @param {string} entityType - The category of data affected (e.g., 'user', 'booking', 'vehicle', 'payment')
 * @param {number|string|null} entityId - The specific ID of the affected record
 * @param {string} description - A detailed summary of what happened
 */
async function logActivity(user, action, entityType, entityId, description) {
  try {
    await ActivityLog.create({
      user_id: user.id,
      username: user.username,
      role: user.role,
      action,
      entity_type: entityType,
      entity_id: entityId,
      description,
      created_at: new Date(),
    });
  } catch (error) {
    // We catch the error so that a failure in logging doesn't break the main user flow
    console.error("Audit Logging Error:", error.message);
  }
}

module.exports = {
  logActivity,
};
