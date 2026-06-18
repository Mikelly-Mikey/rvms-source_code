const express = require("express");
const router = express.Router();
const { requireAuth, requireRole } = require("../middleware/auth");
const { MpesaTransaction, Booking, Customer } = require("../models");
const {
  buildWorkbook,
  buildCsv,
  EXPORT_GROUPS,
} = require("../utils/dataExporter");
const {
  generateCustomersPdf,
  generateFleetPdf,
  generateStaffPdf,
  generateRevenuePdf,
} = require("../utils/pdfExporter");
const { logActivity } = require("../utils/activityLogger");

const XLSX_CONTENT_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

function timestamp() {
  return new Date().toISOString().slice(0, 10);
}

// GET /admin/mpesa-transactions - List all M-Pesa transaction attempts
router.get(
  "/mpesa-transactions",
  requireAuth,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const transactions = await MpesaTransaction.findAll({
        include: [{ model: Booking, as: "booking", include: ["customer"] }],
        order: [["created_at", "DESC"]],
      });
      res.render("admin/mpesa_transactions", { transactions, user: req.user });
    } catch (error) {
      console.error("Error fetching M-Pesa transactions:", error);
      res
        .status(500)
        .render("error", { message: "Failed to load transaction logs" });
    }
  },
);

// Admin data export: download receptionist / fleet supervisor / complete data.
// GET /admin/export/:scope?format=xlsx|csv
router.get(
  "/export/:scope",
  requireAuth,
  requireRole(["admin"]),
  async (req, res) => {
    const { scope } = req.params;
    const format = (req.query.format || "xlsx").toLowerCase();

    if (!EXPORT_GROUPS[scope]) {
      return res.status(404).render("error", {
        message: `Unknown export type: ${scope}`,
      });
    }

    try {
      if (format === "csv") {
        const { csv, filename } = await buildCsv(scope);
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${filename}-${timestamp()}.csv"`,
        );
        await logActivity(
          req.user,
          "export",
          "data",
          null,
          `Exported ${scope} data (CSV)`,
        );
        return res.send(csv);
      }

      const { workbook, filename } = await buildWorkbook(scope);
      res.setHeader("Content-Type", XLSX_CONTENT_TYPE);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}-${timestamp()}.xlsx"`,
      );
      await logActivity(
        req.user,
        "export",
        "data",
        null,
        `Exported ${scope} data (Excel)`,
      );
      await workbook.xlsx.write(res);
      return res.end();
    } catch (error) {
      console.error(`Error exporting ${scope} data:`, error);
      return res.status(500).render("error", {
        message: "Failed to generate export. Please try again.",
      });
    }
  },
);

// PDF exports for admin dashboard
// GET /admin/pdf/:type?period=daily|weekly|monthly|annual
router.get(
  "/pdf/:type",
  requireAuth,
  requireRole(["admin"]),
  async (req, res) => {
    const { type } = req.params;
    const period = req.query.period || "daily";

    try {
      switch (type) {
        case "customers":
          await logActivity(
            req.user,
            "export",
            "pdf",
            null,
            "Exported customers PDF",
          );
          return await generateCustomersPdf(res);
        case "fleet":
          await logActivity(
            req.user,
            "export",
            "pdf",
            null,
            "Exported fleet PDF",
          );
          return await generateFleetPdf(res);
        case "staff":
          await logActivity(
            req.user,
            "export",
            "pdf",
            null,
            "Exported staff PDF",
          );
          return await generateStaffPdf(res);
        case "revenue":
          await logActivity(
            req.user,
            "export",
            "pdf",
            null,
            `Exported revenue PDF (${period})`,
          );
          return await generateRevenuePdf(res, period);
        default:
          return res
            .status(404)
            .render("error", { message: `Unknown PDF export type: ${type}` });
      }
    } catch (error) {
      console.error(`Error generating ${type} PDF:`, error);
      return res
        .status(500)
        .render("error", {
          message: "Failed to generate PDF. Please try again.",
        });
    }
  },
);

module.exports = router;
