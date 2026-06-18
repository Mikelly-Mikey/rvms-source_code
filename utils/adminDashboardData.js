const { Op } = require('sequelize');
const {
  Vehicle,
  Booking,
  Customer,
  Payment,
  Maintenance,
  MaintenanceAlert,
  MaintenanceSchedule,
  ActivityLog,
  User,
  Review,
  sequelize,
} = require('../models');

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function getPeriodRange(period) {
  const now = new Date();
  const end = endOfDay(now);
  let start;

  switch (period) {
    case 'weekly': {
      start = startOfDay(now);
      start.setDate(start.getDate() - start.getDay() + (start.getDay() === 0 ? -6 : 1));
      break;
    }
    case 'monthly':
      start = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
      break;
    case 'annual':
      start = startOfDay(new Date(now.getFullYear(), 0, 1));
      break;
    default:
      start = startOfDay(now);
      break;
  }

  const labels = {
    daily: "Showing: Today's Data",
    weekly: "Showing: This Week's Data",
    monthly: "Showing: This Month's Data",
    annual: "Showing: This Year's Data",
  };

  return { start, end, period: period || 'daily', label: labels[period] || labels.daily };
}

function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

async function getRevenueTrend(period) {
  const now = new Date();
  const payments = await Payment.findAll({
    where: { status: 'completed' },
    order: [['payment_date', 'ASC']],
  });

  if (period === 'daily') {
    const labels = [];
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(now);
      day.setDate(day.getDate() - i);
      const key = day.toISOString().slice(0, 10);
      labels.push(day.toLocaleDateString('en-US', { weekday: 'short' }));
      data.push(
        payments
          .filter((p) => new Date(p.payment_date).toISOString().slice(0, 10) === key)
          .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)
      );
    }
    return { labels, data };
  }

  if (period === 'weekly') {
    const labels = [];
    const data = [];
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - i * 7);
      const weekNum = getWeekNumber(weekStart);
      const weekKey = `${weekStart.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
      labels.push(`W${weekNum}`);
      data.push(
        payments
          .filter((p) => {
            const d = new Date(p.payment_date);
            return `${d.getFullYear()}-W${String(getWeekNumber(d)).padStart(2, '0')}` === weekKey;
          })
          .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)
      );
    }
    return { labels, data };
  }

  const labels = [];
  const data = [];
  for (let i = 11; i >= 0; i--) {
    const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;
    labels.push(month.toLocaleDateString('en-US', { month: 'short', year: period === 'annual' ? '2-digit' : undefined }));
    data.push(
      payments
        .filter((p) => {
          const d = new Date(p.payment_date);
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === key;
        })
        .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)
    );
  }
  return { labels, data };
}

async function getTopVehicles(start, end) {
  const [results] = await sequelize.query(`
    SELECT CONCAT(v.make, ' ', v.model) as vehicle_name,
           COALESCE(SUM(p.amount), 0) as total_revenue
    FROM vehicles v
    LEFT JOIN bookings b ON v.vehicle_id = b.vehicle_id
    LEFT JOIN payments p ON b.booking_id = p.booking_id
      AND p.status = 'completed'
      AND p.payment_date >= :start AND p.payment_date <= :end
    GROUP BY v.vehicle_id, v.make, v.model
    ORDER BY total_revenue DESC
    LIMIT 5
  `, { replacements: { start: start.toISOString(), end: end.toISOString() } });

  return {
    labels: results.map((r) => r.vehicle_name),
    data: results.map((r) => parseFloat(r.total_revenue || 0)),
  };
}

async function getAdminDashboardData(period = 'daily') {
  const { start, end, label } = getPeriodRange(period);
  const dateFilter = { [Op.between]: [start, end] };

  const [
    periodRevenue,
    totalBookings,
    activeRentals,
    completedRentals,
    totalVehicles,
    availableVehicles,
    onRentVehicles,
    reservedVehicles,
    inMaintenanceVehicles,
    newCustomers,
    maintenanceCosts,
    recentActivities,
    fleetSupervisor,
    receptionistCount,
    mechanicCount,
    fleetMaintenancePending,
    receptionBookingsPeriod,
    receptionCheckins,
    receptionCheckouts,
    pendingReviews,
    newReviews,
    avgRatingResult,
    paymentsPeriod,
    pendingInvoices,
    fleetPendingTasks,
    fleetMaintenanceDue,
    fleetInspectionsPending,
    receptionPendingBookings,
    receptionPendingReturns,
    receptionCustomerInquiries,
    mechanicAssignedTasks,
    mechanicInProgress,
    mechanicCompletedToday,
    completedBookingsInPeriod,
  ] = await Promise.all([
    Payment.sum('amount', { where: { payment_date: dateFilter, status: 'completed' } }),
    Booking.count({ where: { created_date: dateFilter } }),
    Booking.count({ where: { status: 'checked-out' } }),
    Booking.count({ where: { status: 'completed', actual_return_time: dateFilter } }),
    Vehicle.count(),
    Vehicle.count({ where: { status: 'available' } }),
    Vehicle.count({ where: { status: 'on-rent' } }),
    Vehicle.count({ where: { status: 'reserved' } }),
    Vehicle.count({ where: { status: 'maintenance' } }),
    Customer.count({ where: { date_registered: dateFilter } }),
    Maintenance.sum('cost', { where: { service_date: dateFilter } }),
    ActivityLog.findAll({ limit: 20, order: [['created_at', 'DESC']] }),
    User.findOne({ where: { role: 'fleet_supervisor' } }),
    User.count({ where: { role: 'receptionist', is_active: true } }),
    User.count({ where: { role: 'mechanic', is_active: true } }),
    MaintenanceAlert.count({ where: { is_read: false } }),
    Booking.count({ where: { created_date: dateFilter } }),
    Booking.count({ where: { actual_pickup_time: dateFilter } }),
    Booking.count({ where: { actual_return_time: dateFilter } }),
    Review.count({ where: { is_approved: false } }),
    Review.count({ where: { created_at: dateFilter } }),
    Review.findAll({ where: { is_approved: true }, attributes: ['rating'] }),
    Payment.count({ where: { payment_date: dateFilter, status: 'completed' } }),
    Booking.count({ where: { status: 'completed', balance_due: { [Op.gt]: 0 } } }),
    Vehicle.count({ where: { status: 'maintenance' } }),
    MaintenanceSchedule.count({ where: { status: 'pending', scheduled_date: { [Op.lte]: end } } }),
    MaintenanceSchedule.count({ where: { status: 'pending', service_type: 'inspection' } }),
    Booking.count({ where: { status: 'confirmed' } }),
    Booking.count({ where: { status: 'checked-out' } }),
    Review.count({ where: { is_approved: false } }),
    MaintenanceSchedule.count({ where: { status: { [Op.in]: ['pending', 'in_progress'] } } }),
    MaintenanceSchedule.count({ where: { status: 'in_progress' } }),
    MaintenanceSchedule.count({
      where: {
        status: 'completed',
        scheduled_date: { [Op.between]: [startOfDay(new Date()), endOfDay(new Date())] },
      },
    }),
    Booking.findAll({
      where: { status: 'completed', actual_return_time: dateFilter },
      attributes: ['total_amount', 'start_date', 'end_date'],
    }),
  ]);

  const utilization = totalVehicles > 0
    ? Math.round(((totalVehicles - availableVehicles) / totalVehicles) * 100)
    : 0;

  let avgDuration = 0;
  let avgRevenuePerBooking = 0;
  if (completedBookingsInPeriod.length > 0) {
    const totalDuration = completedBookingsInPeriod.reduce((sum, b) => {
      if (b.start_date && b.end_date) {
        return sum + Math.ceil((new Date(b.end_date) - new Date(b.start_date)) / (1000 * 60 * 60 * 24));
      }
      return sum;
    }, 0);
    avgDuration = Math.round(totalDuration / completedBookingsInPeriod.length);
    const totalRev = completedBookingsInPeriod.reduce((sum, b) => sum + parseFloat(b.total_amount || 0), 0);
    avgRevenuePerBooking = Math.round(totalRev / completedBookingsInPeriod.length);
  }

  const avgRating = avgRatingResult.length > 0
    ? (avgRatingResult.reduce((sum, r) => sum + r.rating, 0) / avgRatingResult.length).toFixed(1)
    : 0;

  const periodBookingTypes = await Booking.findAll({
    where: { created_date: dateFilter },
    attributes: ['start_date', 'end_date'],
  });
  let dailyCount = 0;
  let weeklyCount = 0;
  let monthlyCount = 0;
  periodBookingTypes.forEach((b) => {
    if (!b.start_date || !b.end_date) return;
    const days = Math.ceil((new Date(b.end_date) - new Date(b.start_date)) / (1000 * 60 * 60 * 24)) + 1;
    if (days <= 3) dailyCount++;
    else if (days <= 14) weeklyCount++;
    else monthlyCount++;
  });

  const revenueTrend = await getRevenueTrend(period);
  const topVehicles = await getTopVehicles(start, end);
  const collectionRate = pendingInvoices + paymentsPeriod > 0
    ? Math.round((paymentsPeriod / (paymentsPeriod + pendingInvoices)) * 100)
    : 100;

  const alerts = [];
  if (fleetMaintenancePending > 0) {
    alerts.push({ type: 'warning', title: 'Maintenance Due', message: `${fleetMaintenancePending} alert(s) require attention`, created_at: new Date() });
  }
  if (pendingReviews > 0) {
    alerts.push({ type: 'info', title: 'Pending Reviews', message: `${pendingReviews} review(s) awaiting approval`, created_at: new Date() });
  }
  if (receptionPendingReturns > 0) {
    alerts.push({ type: 'warning', title: 'Pending Returns', message: `${receptionPendingReturns} vehicle(s) awaiting return`, created_at: new Date() });
  }

  return {
    selected_period: period,
    period_label: label,
    total_revenue: periodRevenue || 0,
    revenue_today: periodRevenue || 0,
    total_bookings: totalBookings,
    active_rentals: activeRentals,
    completed_rentals: completedRentals,
    utilization,
    new_customers: newCustomers,
    maintenance_costs: maintenanceCosts || 0,
    net_profit: (periodRevenue || 0) - (maintenanceCosts || 0),
    avg_duration: avgDuration,
    avg_revenue_per_booking: avgRevenuePerBooking,
    recent_activities: recentActivities,
    fleet_supervisor_name: fleetSupervisor ? fleetSupervisor.getFullName() : 'Not Assigned',
    receptionist_count: receptionistCount,
    mechanic_count: mechanicCount,
    revenue_trend_labels: revenueTrend.labels,
    revenue_trend_data: revenueTrend.data,
    booking_type_data: [dailyCount, weeklyCount, monthlyCount],
    fleet_status_data: [availableVehicles, onRentVehicles, reservedVehicles, inMaintenanceVehicles],
    top_vehicle_labels: topVehicles.labels,
    top_vehicle_data: topVehicles.data,
    alerts,
    fleet_active_vehicles: totalVehicles,
    fleet_maintenance_pending: fleetMaintenancePending,
    fleet_efficiency: utilization,
    reception_bookings_today: receptionBookingsPeriod,
    reception_checkins: receptionCheckins,
    reception_checkouts: receptionCheckouts,
    new_reviews: newReviews,
    pending_reviews: pendingReviews,
    avg_rating: avgRating,
    response_time: 15,
    payments_today: paymentsPeriod,
    pending_invoices: pendingInvoices,
    collection_rate: collectionRate,
    fleet_pending_tasks: fleetPendingTasks,
    fleet_maintenance_due: fleetMaintenanceDue,
    fleet_inspections_pending: fleetInspectionsPending,
    reception_pending_bookings: receptionPendingBookings,
    reception_pending_returns: receptionPendingReturns,
    reception_customer_inquiries: receptionCustomerInquiries,
    mechanic_assigned_tasks: mechanicAssignedTasks,
    mechanic_in_progress: mechanicInProgress,
    mechanic_completed_today: mechanicCompletedToday,
  };
}

module.exports = { getPeriodRange, getAdminDashboardData };
