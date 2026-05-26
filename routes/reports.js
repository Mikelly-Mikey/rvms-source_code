const express = require('express');
const router = express.Router();
const { requireAuth, requirePermission } = require('../middleware/auth');
const { Vehicle, Booking, Payment, Maintenance, Customer } = require('../models');
const { Op, fn, col, literal } = require('sequelize');

router.get('/', requireAuth, requirePermission('view_reports'), async (req, res) => {
  try {
    console.log('Generating reports for user:', req.user.role);
    
    // Fleet utilization by category - database-agnostic approach
    const vehicles = await Vehicle.findAll({
      attributes: ['category', 'status']
    }).catch(err => {
      console.error('Error fetching vehicles:', err);
      return [];
    });

    const fleetUtilMap = {};
    vehicles.forEach(v => {
      if (!fleetUtilMap[v.category]) {
        fleetUtilMap[v.category] = { category: v.category, total: 0, rented: 0 };
      }
      fleetUtilMap[v.category].total++;
      if (v.status === 'on-rent') {
        fleetUtilMap[v.category].rented++;
      }
    });

    const fleetUtilization = Object.values(fleetUtilMap);

    // Daily revenue (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let payments = [];
    try {
      payments = await Payment.findAll({
        where: {
          payment_date: { [Op.gte]: thirtyDaysAgo },
          status: 'completed'
        },
        order: [['payment_date', 'ASC']]
      });
    } catch (err) {
      console.error('Error fetching payments:', err);
      payments = [];
    }

    // Group by day
    const dailyRevenueMap = {};
    payments.forEach(p => {
      const date = new Date(p.payment_date);
      const dateKey = date.toISOString().slice(0, 10);
      if (!dailyRevenueMap[dateKey]) {
        dailyRevenueMap[dateKey] = 0;
      }
      dailyRevenueMap[dateKey] += parseFloat(p.amount);
    });

    const dailyRevenue = Object.keys(dailyRevenueMap).map(date => ({
      date,
      revenue: dailyRevenueMap[date]
    }));

    // Weekly revenue (last 12 weeks)
    const twelveWeeksAgo = new Date();
    twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84);

    let weeklyPayments = [];
    try {
      weeklyPayments = await Payment.findAll({
        where: {
          payment_date: { [Op.gte]: twelveWeeksAgo },
          status: 'completed'
        },
        order: [['payment_date', 'ASC']]
      });
    } catch (err) {
      console.error('Error fetching weekly payments:', err);
      weeklyPayments = [];
    }

    const weeklyRevenueMap = {};
    weeklyPayments.forEach(p => {
      const date = new Date(p.payment_date);
      const weekNumber = getWeekNumber(date);
      const weekKey = `${date.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
      if (!weeklyRevenueMap[weekKey]) {
        weeklyRevenueMap[weekKey] = 0;
      }
      weeklyRevenueMap[weekKey] += parseFloat(p.amount);
    });

    const weeklyRevenue = Object.keys(weeklyRevenueMap).map(week => ({
      week,
      revenue: weeklyRevenueMap[week]
    }));

    // Monthly revenue (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    let monthlyPayments = [];
    try {
      monthlyPayments = await Payment.findAll({
        where: {
          payment_date: { [Op.gte]: sixMonthsAgo },
          status: 'completed'
        },
        order: [['payment_date', 'ASC']]
      });
    } catch (err) {
      console.error('Error fetching monthly payments:', err);
      monthlyPayments = [];
    }

    const monthlyRevenueMap = {};
    monthlyPayments.forEach(p => {
      const date = new Date(p.payment_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyRevenueMap[monthKey]) {
        monthlyRevenueMap[monthKey] = 0;
      }
      monthlyRevenueMap[monthKey] += parseFloat(p.amount);
    });

    const monthlyRevenue = Object.keys(monthlyRevenueMap).map(month => ({
      month,
      revenue: monthlyRevenueMap[month]
    }));

    // Active customers count (customers with bookings in last 30 days)
    let recentBookings = [];
    try {
      recentBookings = await Booking.findAll({
        where: {
          created_at: { [Op.gte]: thirtyDaysAgo }
        },
        attributes: ['customer_id']
      });
    } catch (err) {
      console.error('Error fetching recent bookings:', err);
      recentBookings = [];
    }
    const uniqueCustomerIds = [...new Set(recentBookings.map(b => b.customer_id))];
    const activeCustomersCount = uniqueCustomerIds.length;

    // Total customers
    let totalCustomers = 0;
    try {
      totalCustomers = await Customer.count();
    } catch (err) {
      console.error('Error counting customers:', err);
      totalCustomers = 0;
    }

    // Active vehicles count (vehicles not in maintenance or offline)
    let activeVehicles = 0;
    try {
      activeVehicles = await Vehicle.count({
        where: {
          status: { [Op.in]: ['available', 'reserved', 'on-rent'] }
        }
      });
    } catch (err) {
      console.error('Error counting active vehicles:', err);
      activeVehicles = 0;
    }

    // Total vehicles
    let totalVehicles = 0;
    try {
      totalVehicles = await Vehicle.count();
    } catch (err) {
      console.error('Error counting vehicles:', err);
      totalVehicles = 0;
    }

    // Vehicles on rent
    let vehiclesOnRent = 0;
    try {
      vehiclesOnRent = await Vehicle.count({
        where: { status: 'on-rent' }
      });
    } catch (err) {
      console.error('Error counting vehicles on rent:', err);
      vehiclesOnRent = 0;
    }

    // Top customers by rental count - database-agnostic approach
    let bookings = [];
    try {
      bookings = await Booking.findAll({
        include: [{ model: Customer, as: 'customer', attributes: ['first_name', 'last_name'] }]
      });
    } catch (err) {
      console.error('Error fetching bookings for top customers:', err);
      bookings = [];
    }

    const customerMap = {};
    bookings.forEach(b => {
      if (!customerMap[b.customer_id]) {
        customerMap[b.customer_id] = {
          customer_id: b.customer_id,
          customer: b.customer,
          booking_count: 0,
          total_spent: 0
        };
      }
      customerMap[b.customer_id].booking_count++;
      customerMap[b.customer_id].total_spent += parseFloat(b.total_amount || 0);
    });

    const topCustomers = Object.values(customerMap)
      .sort((a, b) => b.booking_count - a.booking_count)
      .slice(0, 5);

    // Maintenance cost by vehicle - database-agnostic approach
    let maintenanceRecords = [];
    try {
      maintenanceRecords = await Maintenance.findAll({
        include: [{ model: Vehicle, as: 'vehicle', attributes: ['registration', 'make', 'model'] }]
      });
    } catch (err) {
      console.error('Error fetching maintenance records:', err);
      maintenanceRecords = [];
    }

    const maintenanceMap = {};
    maintenanceRecords.forEach(m => {
      if (!maintenanceMap[m.vehicle_id]) {
        maintenanceMap[m.vehicle_id] = {
          vehicle_id: m.vehicle_id,
          vehicle: m.vehicle,
          total_cost: 0
        };
      }
      maintenanceMap[m.vehicle_id].total_cost += parseFloat(m.cost || 0);
    });

    const maintenanceCosts = Object.values(maintenanceMap)
      .sort((a, b) => b.total_cost - a.total_cost)
      .slice(0, 5);

    // Current fleet status counts - database-agnostic approach
    let allVehicles = [];
    try {
      allVehicles = await Vehicle.findAll({ attributes: ['status'] });
    } catch (err) {
      console.error('Error fetching fleet status:', err);
      allVehicles = [];
    }
    const fleetStatusMap = {};
    allVehicles.forEach(v => {
      fleetStatusMap[v.status] = (fleetStatusMap[v.status] || 0) + 1;
    });
    const fleetStatus = Object.keys(fleetStatusMap).map(status => ({
      status,
      count: fleetStatusMap[status]
    }));

    res.render('reports/dashboard', {
      user: req.user,
      fleetUtilization: JSON.stringify(fleetUtilization),
      dailyRevenue: JSON.stringify(dailyRevenue),
      weeklyRevenue: JSON.stringify(weeklyRevenue),
      monthlyRevenue: JSON.stringify(monthlyRevenue),
      activeCustomersCount,
      totalCustomers,
      activeVehiclesCount: activeVehicles,
      totalVehicles,
      vehiclesOnRent,
      topCustomers: topCustomers,
      maintenanceCosts: maintenanceCosts,
      fleetStatus: fleetStatus
    });
  } catch (error) {
    console.error('Reports error:', error);
    res.status(500).render('error', { message: 'Error generating reports' });
  }
});

// Helper function to get week number
function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

module.exports = router;