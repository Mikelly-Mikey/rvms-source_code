const express = require('express');
const router = express.Router();
const { requireAuth, requirePermission } = require('../middleware/auth');
const { InventoryItem, Category, Supplier } = require('../models');

router.get('/', requireAuth, requirePermission('manage_inventory'), async (req, res) => {
  try {
    const items = await InventoryItem.findAll({
      include: [
        { model: Category, as: 'category' },
        { model: Supplier, as: 'supplier' }
      ],
      order: [['created_at', 'DESC']]
    });
    res.render('inventory/list', { items, user: req.user });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).render('error', { message: 'Error fetching inventory' });
  }
});

module.exports = router;
