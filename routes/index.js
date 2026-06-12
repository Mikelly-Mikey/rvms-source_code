const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const {
  Vehicle,
  Booking,
  Customer,
  Payment,
  MaintenanceAlert,
  Maintenance,
  ActivityLog,
  User,
} = require("../models");
const { Op } = require("sequelize");
const { resolveCustomerForUser } = require("../utils/customerResolver");
const { getAdminDashboardData } = require("../utils/adminDashboardData");
const { getDashboardNotifications } = require("../utils/notificationService");

// Helper function to get week number
function getWeekNumber(date) {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

router.get("/", requireAuth, async (req, res) => {
  // If admin, show comprehensive admin overview dashboard
  if (req.user.role === "admin") {
    try {
      const period = ["daily", "weekly", "monthly", "annual"].includes(req.query.period)
        ? req.query.period
        : "daily";
      const dashboardData = await getAdminDashboardData(period);
      const notifications = await getDashboardNotifications(req.user);
      return res.render("admin-dashboard", {
        user: req.user,
        ...dashboardData,
        notifications,
      });
    } catch (error) {
      console.error("Error loading admin dashboard:", error);
      return res.render("admin-dashboard", {
        user: req.user,
        selected_period: "daily",
        period_label: "Showing: Today's Data",
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
        fleet_supervisor_name: "Not Assigned",
        receptionist_count: 0,
        mechanic_count: 0,
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
        mechanic_completed_today: 0,
      });
    }
  }
  try {
    if (req.user.role === "customer") {
      return res.redirect("/customer-dashboard");
    }

    const totalVehicles = await Vehicle.count();
    const available = await Vehicle.count({ where: { status: "available" } });
    const reserved = await Vehicle.count({ where: { status: "reserved" } });
    const onRent = await Vehicle.count({ where: { status: "on-rent" } });
    const inMaintenance = await Vehicle.count({
      where: { status: "maintenance" },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayBookings = await Booking.count({
      where: { created_date: { [Op.gte]: today } },
    });

    const activeBookings = await Booking.count({
      where: { status: ["confirmed", "checked-out"] },
    });

    const utilization =
      totalVehicles > 0
        ? Math.round(((totalVehicles - available) / totalVehicles) * 100)
        : 0;

    const todayPayments = await Payment.findAll({
      where: {
        payment_date: { [Op.gte]: today },
        status: "completed",
      },
    });
    const todayRevenue = todayPayments.reduce(
      (sum, p) => sum + parseFloat(p.amount),
      0,
    );

    const recentBookings = await Booking.findAll({
      include: ["customer", "vehicle"],
      where: { status: "checked-out" },
      order: [["actual_pickup_time", "DESC"]],
      limit: 5,
    });

    const maintenanceAlerts = await MaintenanceAlert.findAll({
      include: ["vehicle"],
      where: { is_read: false },
      order: [["due_date", "ASC"]],
      limit: 5,
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
    if (req.user.role === "fleet_supervisor" || req.user.role === "admin") {
      // Get vehicle usage stats (count of bookings per vehicle)
      const { sequelize } = require("../models");
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
              WHEN b.status = 'checked-out' THEN 1 
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
        labels: detailedUsageResults.map(
          (v) => `${v.vehicle_name} (${v.registration})`,
        ),
        data: detailedUsageResults.map((v) => parseInt(v.booking_count)),
        completed: detailedUsageResults.map((v) =>
          parseInt(v.completed_bookings),
        ),
        active: detailedUsageResults.map((v) => parseInt(v.active_bookings)),
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
        include: ["vehicle"],
        order: [["service_date", "DESC"]],
        limit: 10,
      });
    }

    // Fetch recent activities for admin
    if (req.user.role === "admin") {
      recentActivities = await ActivityLog.findAll({
        order: [["created_at", "DESC"]],
        limit: 20,
      });
    }

    // Receptionist reports - revenue and customer data
    if (req.user.role === "receptionist" || req.user.role === "admin") {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Daily revenue (last 30 days)
      let payments = [];
      try {
        payments = await Payment.findAll({
          where: {
            payment_date: { [Op.gte]: thirtyDaysAgo },
            status: "completed",
          },
          order: [["payment_date", "ASC"]],
        });
      } catch (err) {
        console.error("Error fetching payments:", err);
        payments = [];
      }

      const dailyRevenueMap = {};
      payments.forEach((p) => {
        const date = new Date(p.payment_date);
        const dateKey = date.toISOString().slice(0, 10);
        if (!dailyRevenueMap[dateKey]) {
          dailyRevenueMap[dateKey] = 0;
        }
        dailyRevenueMap[dateKey] += parseFloat(p.amount);
      });

      dailyRevenue = Object.keys(dailyRevenueMap).map((date) => ({
        date,
        revenue: dailyRevenueMap[date],
      }));

      // Weekly revenue (last 12 weeks)
      const twelveWeeksAgo = new Date();
      twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84);

      let weeklyPayments = [];
      try {
        weeklyPayments = await Payment.findAll({
          where: {
            payment_date: { [Op.gte]: twelveWeeksAgo },
            status: "completed",
          },
          order: [["payment_date", "ASC"]],
        });
      } catch (err) {
        console.error("Error fetching weekly payments:", err);
        weeklyPayments = [];
      }

      const weeklyRevenueMap = {};
      weeklyPayments.forEach((p) => {
        const date = new Date(p.payment_date);
        const weekNumber = getWeekNumber(date);
        const weekKey = `${date.getFullYear()}-W${String(weekNumber).padStart(2, "0")}`;
        if (!weeklyRevenueMap[weekKey]) {
          weeklyRevenueMap[weekKey] = 0;
        }
        weeklyRevenueMap[weekKey] += parseFloat(p.amount);
      });

      weeklyRevenue = Object.keys(weeklyRevenueMap).map((week) => ({
        week,
        revenue: weeklyRevenueMap[week],
      }));

      // Active customers count
      let recentBookings = [];
      try {
        recentBookings = await Booking.findAll({
          where: {
            created_date: { [Op.gte]: thirtyDaysAgo },
          },
          attributes: ["customer_id"],
        });
      } catch (err) {
        console.error("Error fetching recent bookings:", err);
        recentBookings = [];
      }
      const uniqueCustomerIds = [
        ...new Set(recentBookings.map((b) => b.customer_id)),
      ];
      activeCustomers = uniqueCustomerIds.length;

      // Total customers
      try {
        totalCustomers = await Customer.count();
      } catch (err) {
        console.error("Error counting customers:", err);
        totalCustomers = 0;
      }
    }

    const notifications = await getDashboardNotifications(req.user);
    res.render("dashboard", {
      user: req.user,
      notifications,
      total_vehicles: totalVehicles,
      available,
      reserved,
      on_rent: onRent,
      in_maintenance: inMaintenance,
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
      total_customers: totalCustomers,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).render("error", { message: "Error loading dashboard" });
  }
});

router.get("/customer-dashboard", requireAuth, async (req, res) => {
  try {
    if (req.user.role !== "customer") {
      return res.redirect("/");
    }

    const customer = await resolveCustomerForUser(req.user);
    if (!customer) {
      return res.render("customer-dashboard", {
        user: req.user,
        available_vehicles: await Vehicle.findAll({
          where: { status: "available" },
          order: [["registration", "ASC"]],
        }),
        user_bookings: [],
        completed_bookings: [],
        payments: [],
        total_spent: 0,
        profile_message:
          "Your account is not linked to a customer profile yet. Please contact reception or ensure your email/phone matches your rental records.",
      });
    }

    const availableVehicles = await Vehicle.findAll({
      where: { status: "available" },
      order: [["registration", "ASC"]],
    });

    const userBookings = await Booking.findAll({
      where: { customer_id: customer.customer_id },
      include: ["customer", "vehicle"],
      order: [["created_date", "DESC"]],
      limit: 10,
    });

    const completedBookings = await Booking.findAll({
      where: {
        customer_id: customer.customer_id,
        status: ["completed", "checked-out"],
      },
      include: ["customer", "vehicle"],
      order: [["created_date", "DESC"]],
    });

    const bookingIds = userBookings.map((b) => b.booking_id);
    const payments = bookingIds.length
      ? await Payment.findAll({
          where: { booking_id: bookingIds },
          include: [{ model: Booking, as: "booking", include: ["vehicle"] }],
          order: [["payment_date", "DESC"]],
        })
      : [];

    const totalSpent = payments.reduce(
      (sum, p) => sum + parseFloat(p.amount || 0),
      0,
    );

    res.render("customer-dashboard", {
      user: req.user,
      available_vehicles: availableVehicles,
      user_bookings: userBookings,
      completed_bookings: completedBookings,
      payments: payments,
      total_spent: totalSpent,
      profile_message: null,
    });
  } catch (error) {
    console.error("Customer dashboard error:", error);
    res
      .status(500)
      .render("error", {
        message: "Error loading customer dashboard",
        user: req.user,
      });
  }
});

module.exports = router;
