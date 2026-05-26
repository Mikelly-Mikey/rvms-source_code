const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { Vehicle, Booking, Customer, Payment, MaintenanceAlert, Maintenance, ActivityLog, User } = require('../models');
const { Op } = require('sequelize');

// Helper function to get week number
function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

router.get('/', requireAuth, async (req, res) => {
  // If admin, show comprehensive admin overview dashboard
  if (req.user.role === 'admin') {
    try {
      // Get comprehensive metrics for admin
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Revenue metrics
      const totalRevenueResult = await Payment.sum('amount');
      const todayRevenueResult = await Payment.sum('amount', {
        where: {
          payment_date: {
            [Op.gte]: todayStr
          }
        }
      });

      // Booking metrics
      const totalBookings = await Booking.count();
      const activeRentals = await Booking.count({
        where: {
          status: 'checked-out'
        }
      });
      const completedRentals = await Booking.count({
        where: {
          status: 'completed',
          actual_return_time: {
            [Op.gte]: todayStr
          }
        }
      });

      // Fleet metrics
      const totalVehicles = await Vehicle.count();
      const availableVehicles = await Vehicle.count({ where: { status: 'available' } });
      const onRentVehicles = await Vehicle.count({ where: { status: 'on-rent' } });
      const utilization = totalVehicles > 0 ? Math.round(((totalVehicles - availableVehicles) / totalVehicles) * 100) : 0;

      // Customer metrics
      const newCustomers = await Customer.count({
        where: {
          date_registered: {
            [Op.gte]: todayStr
          }
        }
      });

      // Maintenance costs
      const maintenanceCosts = await Maintenance.sum('cost', {
        where: {
          service_date: {
            [Op.gte]: todayStr
          }
        }
      });

      // Calculate average rental duration and revenue per booking
      const completedBookings = await Booking.findAll({
        where: { status: 'completed' },
        attributes: ['total_amount', 'start_date', 'end_date']
      });

      let avgDuration = 0;
      let avgRevenuePerBooking = 0;

      if (completedBookings.length > 0) {
        const totalDuration = completedBookings.reduce((sum, b) => {
          if (b.start_date && b.end_date) {
            const start = new Date(b.start_date);
            const end = new Date(b.end_date);
            const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
            return sum + days;
          }
          return sum;
        }, 0);
        avgDuration = Math.round(totalDuration / completedBookings.length);

        const totalRevenue = completedBookings.reduce((sum, b) => sum + parseFloat(b.total_amount || 0), 0);
        avgRevenuePerBooking = Math.round(totalRevenue / completedBookings.length);
      }

      // Recent activities
      const recentActivities = await ActivityLog.findAll({
        limit: 20,
        order: [['created_at', 'DESC']],
        include: [{
          model: User,
          as: 'user',
          attributes: ['username', 'role']
        }]
      });

      // Department performance data
      const fleetSupervisor = await User.findOne({ where: { role: 'fleet_supervisor' } });
      const receptionistCount = await User.count({ where: { role: 'receptionist' } });

      return res.render('admin-dashboard', {
        user: req.user,
        total_revenue: totalRevenueResult || 0,
        revenue_today: todayRevenueResult || 0,
        total_bookings: totalBookings,
        active_rentals: activeRentals,
        completed_rentals: completedRentals,
        utilization: utilization,
        new_customers: newCustomers,
        maintenance_costs: maintenanceCosts || 0,
        net_profit: (totalRevenueResult || 0) - (maintenanceCosts || 0),
        avg_duration: avgDuration,
        avg_revenue_per_booking: avgRevenuePerBooking,
        recent_activities: recentActivities,
        fleet_supervisor_name: fleetSupervisor ? fleetSupervisor.getFullName() : 'Not Assigned',
        receptionist_count: receptionistCount,
        // Revenue trend data (simplified for demo)
        revenue_trend_labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        revenue_trend_data: [150000, 180000, 220000, 190000, 250000, 280000, 200000],
        booking_type_data: [40, 35, 25],
        fleet_status_data: [availableVehicles, onRentVehicles, totalVehicles - availableVehicles - onRentVehicles, 5],
        top_vehicle_labels: ['Toyota Corolla', 'Honda CR-V', 'Nissan X-Trail'],
        top_vehicle_data: [450000, 380000, 320000],
        // Alerts (sample data)
        alerts: [
          { type: 'warning', title: 'Maintenance Due', message: '3 vehicles require maintenance this week', created_at: new Date() },
          { type: 'info', title: 'New Reviews', message: '5 reviews pending approval', created_at: new Date() }
        ],
        // Department metrics
        fleet_active_vehicles: totalVehicles,
        fleet_maintenance_pending: 3,
        fleet_efficiency: utilization,
        reception_bookings_today: 5,
        reception_checkins: 3,
        reception_checkouts: 2,
        new_reviews: 5,
        pending_reviews: 5,
        avg_rating: 4.5,
        response_time: 15,
        payments_today: 8,
        pending_invoices: 2,
        collection_rate: 95,
        // Quick view metrics
        fleet_pending_tasks: 2,
        fleet_maintenance_due: 3,
        fleet_inspections_pending: 1,
        reception_pending_bookings: 2,
        reception_pending_returns: 1,
        reception_customer_inquiries: 4,
        mechanic_assigned_tasks: 5,
        mechanic_in_progress: 2,
        mechanic_completed_today: 1
      });
    } catch (error) {
      console.error('Error loading admin dashboard:', error);
      return res.render('admin-dashboard', {
        user: req.user,
        total_revenue: 0,
        revenue_today: 0,
        total_bookings: 0,
        active_rentals: 0,
        completed_rentals: 0,
        utilization: 0,
        new_customers: 0,
        maintenance_costs: 0,
        net_profit: 0,
        avg_duration: 0,
        avg_revenue_per_booking: 0,
        recent_activities: [],
        alerts: [],
        fleet_supervisor_name: 'Not Assigned',
        receptionist_count: 0,
        revenue_trend_labels: [],
        revenue_trend_data: [],
        booking_type_data: [],
        fleet_status_data: [],
        top_vehicle_labels: [],
        top_vehicle_data: [],
        fleet_active_vehicles: 0,
        fleet_maintenance_pending: 0,
        fleet_efficiency: 0,
        reception_bookings_today: 0,
        reception_checkins: 0,
        reception_checkouts: 0,
        new_reviews: 0,
        pending_reviews: 0,
        avg_rating: 0,
        response_time: 0,
        payments_today: 0,
        pending_invoices: 0,
        collection_rate: 0,
        fleet_pending_tasks: 0,
        fleet_maintenance_due: 0,
        fleet_inspections_pending: 0,
        reception_pending_bookings: 0,
        reception_pending_returns: 0,
        reception_customer_inquiries: 0,
        mechanic_assigned_tasks: 0,
        mechanic_in_progress: 0,
        mechanic_completed_today: 0
      });
    }
  }
  try {
    if (req.user.role === 'customer') {
      return res.redirect('/customer-dashboard');
    }
    
    const totalVehicles = await Vehicle.count();
    const available = await Vehicle.count({ where: { status: 'available' } });
    const reserved = await Vehicle.count({ where: { status: 'reserved' } });
    const onRent = await Vehicle.count({ where: { status: 'on-rent' } });
    const inMaintenance = await Vehicle.count({ where: { status: 'maintenance' } });
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayBookings = await Booking.count({
      where: { created_date: { [Op.gte]: today } }
    });
    
    const activeBookings = await Booking.count({
      where: { status: ['confirmed', 'checked-out'] }
    });
    
    const utilization = totalVehicles > 0 ? Math.round(((totalVehicles - available) / totalVehicles) * 100) : 0;
    
    const todayPayments = await Payment.findAll({
      where: {
        payment_date: { [Op.gte]: today },
        status: 'completed'
      }
    });
    const todayRevenue = todayPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
    
    const recentBookings = await Booking.findAll({
      include: ['customer', 'vehicle'],
      where: { status: 'checked-out' },
      order: [['actual_pickup_time', 'DESC']],
      limit: 5
    });
    
    const maintenanceAlerts = await MaintenanceAlert.findAll({
      include: ['vehicle'],
      where: { is_read: false },
      order: [['due_date', 'ASC']],
      limit: 5
    });

    // Fleet supervisor specific data
    let vehicleUsageStats = [];
    let maintenanceCosts = [];
    let recentMaintenance = [];

    // Receptionist specific data - revenue and booking reports
    let dailyRevenue = [];
    let weeklyRevenue = [];
    let activeCustomers = 0;
    let totalCustomers = 0;

    // Admin specific data - recent activities and full overview
    let recentActivities = [];

    // Fleet supervisor reports
    if (req.user.role === 'fleet_supervisor' || req.user.role === 'admin') {
      // Get vehicle usage stats (count of bookings per vehicle)
      const { sequelize } = require('../models');
      const [usageResults] = await sequelize.query(`
        SELECT v.vehicle_id, v.registration, v.make, v.model, v.current_mileage,
               COUNT(b.booking_id) as booking_count,
               COALESCE(SUM(b.total_amount), 0) as total_revenue
        FROM vehicles v
        LEFT JOIN bookings b ON v.vehicle_id = b.vehicle_id
        GROUP BY v.vehicle_id, v.registration, v.make, v.model, v.current_mileage
        ORDER BY booking_count DESC
      `);
      vehicleUsageStats = usageResults;
      
      // Get detailed usage statistics for bar chart
      const [detailedUsageResults] = await sequelize.query(`
        SELECT 
          CONCAT(v.make, ' ', v.model) as vehicle_name,
          v.registration,
          COUNT(b.booking_id) as booking_count,
          COALESCE(SUM(
            CASE 
              WHEN b.status = 'completed' THEN 1 
              ELSE 0 
            END
          ), 0) as completed_bookings,
          COALESCE(SUM(
            CASE 
              WHEN b.status = 'on-rent' THEN 1 
              ELSE 0 
            END
          ), 0) as active_bookings
        FROM vehicles v
        LEFT JOIN bookings b ON v.vehicle_id = b.vehicle_id
        GROUP BY v.vehicle_id, v.make, v.model, v.registration
        ORDER BY booking_count DESC
        LIMIT 10
      `);
      
      // Format data for chart
      vehicleUsageStats = {
        labels: detailedUsageResults.map(v => `${v.vehicle_name} (${v.registration})`),
        data: detailedUsageResults.map(v => parseInt(v.booking_count)),
        completed: detailedUsageResults.map(v => parseInt(v.completed_bookings)),
        active: detailedUsageResults.map(v => parseInt(v.active_bookings))
      };

      // Get maintenance costs per vehicle
      const [maintenanceResults] = await sequelize.query(`
        SELECT v.vehicle_id, v.registration, v.make, v.model,
               COUNT(m.maintenance_id) as maintenance_count,
               COALESCE(SUM(m.cost), 0) as total_maintenance_cost
        FROM vehicles v
        LEFT JOIN maintenance m ON v.vehicle_id = m.vehicle_id
        GROUP BY v.vehicle_id, v.registration, v.make, v.model
        ORDER BY total_maintenance_cost DESC
      `);
      maintenanceCosts = maintenanceResults;

      // Get recent maintenance records with service provider info
      recentMaintenance = await Maintenance.findAll({
        include: ['vehicle'],
        order: [['service_date', 'DESC']],
        limit: 10
      });
    }

    // Fetch recent activities for admin
    if (req.user.role === 'admin') {
      recentActivities = await ActivityLog.findAll({
        order: [['created_at', 'DESC']],
        limit: 20
      });
    }

    // Receptionist reports - revenue and customer data
    if (req.user.role === 'receptionist' || req.user.role === 'admin') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Daily revenue (last 30 days)
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

      const dailyRevenueMap = {};
      payments.forEach(p => {
        const date = new Date(p.payment_date);
        const dateKey = date.toISOString().slice(0, 10);
        if (!dailyRevenueMap[dateKey]) {
          dailyRevenueMap[dateKey] = 0;
        }
        dailyRevenueMap[dateKey] += parseFloat(p.amount);
      });

      dailyRevenue = Object.keys(dailyRevenueMap).map(date => ({
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

      weeklyRevenue = Object.keys(weeklyRevenueMap).map(week => ({
        week,
        revenue: weeklyRevenueMap[week]
      }));

      // Active customers count
      let recentBookings = [];
      try {
        recentBookings = await Booking.findAll({
          where: {
            created_date: { [Op.gte]: thirtyDaysAgo }
          },
          attributes: ['customer_id']
        });
      } catch (err) {
        console.error('Error fetching recent bookings:', err);
        recentBookings = [];
      }
      const uniqueCustomerIds = [...new Set(recentBookings.map(b => b.customer_id))];
      activeCustomers = uniqueCustomerIds.length;

      // Total customers
      try {
        totalCustomers = await Customer.count();
      } catch (err) {
        console.error('Error counting customers:', err);
        totalCustomers = 0;
      }
    }
    
    res.render('dashboard', {
      user: req.user,
      total_vehicles: totalVehicles,
      available, reserved, on_rent: onRent, in_maintenance: inMaintenance,
      offline: totalVehicles - available - reserved - onRent - inMaintenance,
      today_bookings: todayBookings,
      active_bookings: activeBookings,
      utilization,
      today_revenue: todayRevenue,
      recent_bookings: recentBookings,
      maintenance_alerts: maintenanceAlerts,
      vehicle_usage_stats: vehicleUsageStats,
      maintenance_costs: maintenanceCosts,
      recent_maintenance: recentMaintenance,
      recent_activities: recentActivities,
      daily_revenue: dailyRevenue,
      weekly_revenue: weeklyRevenue,
      active_customers: activeCustomers,
      total_customers: totalCustomers
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).render('error', { message: 'Error loading dashboard' });
  }
});

router.get('/customer-dashboard', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.redirect('/');
    }

    const availableVehicles = await Vehicle.findAll({
      where: { status: 'available' },
      order: [['registration', 'ASC']]
    });

    const userBookings = await Booking.findAll({
      where: { customer_id: req.user.id },
      include: ['customer', 'vehicle'],
      order: [['created_date', 'DESC']],
      limit: 10
    });

    // Get completed bookings only
    const completedBookings = await Booking.findAll({
      where: {
        customer_id: req.user.id,
        status: ['completed', 'checked-out']
      },
      include: ['customer', 'vehicle'],
      order: [['created_date', 'DESC']]
    });

    // Get payment history for this customer
    const bookingIds = userBookings.map(b => b.booking_id);
    const payments = await Payment.findAll({
      where: { booking_id: bookingIds },
      include: [{ model: Booking, as: 'booking', include: ['vehicle'] }],
      order: [['payment_date', 'DESC']]
    });

    // Calculate total spent
    const totalSpent = payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

    res.render('customer-dashboard', {
      user: req.user,
      available_vehicles: availableVehicles,
      user_bookings: userBookings,
      completed_bookings: completedBookings,
      payments: payments,
      total_spent: totalSpent
    });
  } catch (error) {
    console.error('Customer dashboard error:', error);
    res.status(500).render('error', { message: 'Error loading customer dashboard', user: req.user });
  }
});

module.exports = router;