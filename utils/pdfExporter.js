const PDFDocument = require("pdfkit");
const { Customer, Vehicle, User, Payment } = require("../models");
const { Op } = require("sequelize");
const { getPeriodRange } = require("./adminDashboardData");

async function generateCustomersPdf(res) {
  const doc = new PDFDocument();
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=Customer_Report.pdf",
  );
  doc.pipe(res);

  doc.fontSize(20).text("RVMS Customer Directory", { align: "center" });
  doc.moveDown();

  const customers = await Customer.findAll();
  customers.forEach((c, i) => {
    doc
      .fontSize(12)
      .text(
        `${i + 1}. ${c.first_name} ${c.last_name} - ${c.phone} (${c.email || "No email"})`,
      );
  });

  doc.end();
}

async function generateFleetPdf(res) {
  const doc = new PDFDocument();
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=Fleet_Status_Report.pdf",
  );
  doc.pipe(res);

  doc.fontSize(20).text("Fleet Status Report", { align: "center" });
  doc.moveDown();

  const vehicles = await Vehicle.findAll();
  vehicles.forEach((v) => {
    doc
      .fontSize(12)
      .text(
        `[${v.status.toUpperCase()}] ${v.registration}: ${v.make} ${v.model} (${v.year})`,
      );
  });

  doc.end();
}

async function generateStaffPdf(res) {
  const doc = new PDFDocument();
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "attachment; filename=Staff_List.pdf");
  doc.pipe(res);

  doc.fontSize(20).text("System Staff Directory", { align: "center" });
  doc.moveDown();

  const staff = await User.findAll({ where: { is_staff: true } });
  staff.forEach((s) => {
    doc
      .fontSize(12)
      .text(`${s.first_name} ${s.last_name} - Role: ${s.role} (${s.email})`);
  });

  doc.end();
}

async function generateRevenuePdf(res, period) {
  const { start, end } = getPeriodRange(period);
  const doc = new PDFDocument();
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=Revenue_Report_${period}.pdf`,
  );
  doc.pipe(res);

  doc
    .fontSize(20)
    .text(`Revenue Report (${period.toUpperCase()})`, { align: "center" });
  doc.fontSize(10).text(`${start.toLocaleDateString()} — ${end.toLocaleDateString()}`, { align: "center" });
  doc.moveDown();

  const payments = await Payment.findAll({
    where: { status: "completed", payment_date: { [Op.between]: [start, end] } },
    order: [["payment_date", "ASC"]],
  });
  let total = 0;

  payments.forEach((p) => {
    total += parseFloat(p.amount);
    doc
      .fontSize(10)
      .text(
        `${new Date(p.payment_date).toLocaleDateString()}: KES ${parseFloat(p.amount).toLocaleString()} (${p.method})`,
      );
  });

  doc.moveDown();
  doc
    .fontSize(14)
    .text(`TOTAL REVENUE: KES ${total.toLocaleString()}`, { bold: true });

  doc.end();
}

module.exports = {
  generateCustomersPdf,
  generateFleetPdf,
  generateStaffPdf,
  generateRevenuePdf,
};
