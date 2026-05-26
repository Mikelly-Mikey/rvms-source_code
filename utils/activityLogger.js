const { ActivityLog } = require('../models');

const logActivity = async (user, action, entityType, entityId, description) => {
  try {
    await ActivityLog.create({
      user_id: user.id,
      username: user.username,
      role: user.role,
      action,
      entity_type: entityType,
      entity_id: entityId,
      description
    });
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};

module.exports = { logActivity };
