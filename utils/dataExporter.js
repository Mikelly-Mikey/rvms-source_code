const ExcelJS = require('exceljs');
const {
  User,
  Vehicle,
  Customer,
  Booking,
  Payment,
  MpesaTransaction,
  Maintenance,
  MaintenanceSchedule,
  MaintenanceAlert,
  InventoryItem,
  Category,
  Supplier,
  Review,
  ActivityLog
} = require('../models');

// Fields that must never leave the server (credentials, tokens, etc.)
const SENSITIVE_FIELDS = [
  'password',
  'email_verification_token',
  'password_reset_token',
  'password_reset_expires'
];

// A dataset describes one table that can be exported into a sheet / CSV section.
const DATASETS = {
  users: { model: User, label: 'Users' },
  vehicles: { model: Vehicle, label: 'Vehicles' },
  customers: { model: Customer, label: 'Customers' },
  bookings: { model: Booking, label: 'Bookings' },
  payments: { model: Payment, label: 'Payments' },
  mpesa: { model: MpesaTransaction, label: 'M-Pesa Transactions' },
  maintenance: { model: Maintenance, label: 'Maintenance' },
  maintenance_schedules: { model: MaintenanceSchedule, label: 'Maintenance Schedules' },
  maintenance_alerts: { model: MaintenanceAlert, label: 'Maintenance Alerts' },
  inventory: { model: InventoryItem, label: 'Inventory Items' },
  categories: { model: Category, label: 'Categories' },
  suppliers: { model: Supplier, label: 'Suppliers' },
  reviews: { model: Review, label: 'Reviews' },
  activity: { model: ActivityLog, label: 'Activity Log' }
};

// Each export scope groups the datasets relevant to a department / view.
const EXPORT_GROUPS = {
  reception: {
    title: 'Receptionist Data',
    filename: 'rvms-receptionist-data',
    datasets: ['customers', 'bookings', 'payments', 'mpesa']
  },
  fleet: {
    title: 'Fleet Supervisor Data',
    filename: 'rvms-fleet-supervisor-data',
    datasets: [
      'vehicles',
      'maintenance',
      'maintenance_schedules',
      'maintenance_alerts',
      'inventory',
      'categories',
      'suppliers'
    ]
  },
  all: {
    title: 'Complete Dashboard Data',
    filename: 'rvms-complete-data',
    datasets: [
      'users',
      'vehicles',
      'customers',
      'bookings',
      'payments',
      'mpesa',
      'maintenance',
      'maintenance_schedules',
      'maintenance_alerts',
      'inventory',
      'categories',
      'suppliers',
      'reviews',
      'activity'
    ]
  }
};

function getColumns(model) {
  return Object.keys(model.rawAttributes).filter(
    (field) => !SENSITIVE_FIELDS.includes(field)
  );
}

function formatValue(value) {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object') return JSON.stringify(value);
  return value;
}

async function fetchDataset(key) {
  const dataset = DATASETS[key];
  const columns = getColumns(dataset.model);
  const rows = await dataset.model.findAll({
    attributes: columns,
    order: [[columns[0], 'ASC']],
    raw: true
  });
  return { label: dataset.label, columns, rows };
}

function escapeCsv(value) {
  const str = String(formatValue(value));
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// Build a multi-sheet Excel workbook for the given scope.
async function buildWorkbook(scope) {
  const group = EXPORT_GROUPS[scope];
  if (!group) throw new Error(`Unknown export scope: ${scope}`);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'RVMS Admin Dashboard';
  workbook.created = new Date();

  for (const key of group.datasets) {
    const { label, columns, rows } = await fetchDataset(key);
    const sheet = workbook.addWorksheet(label.slice(0, 31));
    sheet.columns = columns.map((col) => ({
      header: col,
      key: col,
      width: Math.min(Math.max(col.length + 2, 12), 40)
    }));
    sheet.getRow(1).font = { bold: true };
    rows.forEach((row) => {
      const formatted = {};
      columns.forEach((col) => {
        formatted[col] = formatValue(row[col]);
      });
      sheet.addRow(formatted);
    });
  }

  // Always provide at least one sheet so the file is valid.
  if (workbook.worksheets.length === 0) {
    workbook.addWorksheet('No Data');
  }

  return { workbook, filename: group.filename };
}

// Build a single CSV string for the given scope. Multiple tables are separated
// by a labelled header line and a blank line.
async function buildCsv(scope) {
  const group = EXPORT_GROUPS[scope];
  if (!group) throw new Error(`Unknown export scope: ${scope}`);

  const sections = [];
  for (const key of group.datasets) {
    const { label, columns, rows } = await fetchDataset(key);
    const lines = [];
    lines.push(`# ${label}`);
    lines.push(columns.join(','));
    rows.forEach((row) => {
      lines.push(columns.map((col) => escapeCsv(row[col])).join(','));
    });
    sections.push(lines.join('\n'));
  }

  return { csv: sections.join('\n\n'), filename: group.filename };
}

module.exports = {
  EXPORT_GROUPS,
  buildWorkbook,
  buildCsv
};
