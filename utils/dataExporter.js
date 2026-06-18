const ExcelJS = require("exceljs");
const models = require("../models");

const EXPORT_GROUPS = {
  reception: ["Customer", "Booking", "Payment"],
  fleet: ["Vehicle", "Maintenance"],
  all: ["User", "Vehicle", "Customer", "Booking", "Payment", "Maintenance"],
};

/**
 * Builds an Excel workbook for the given scope.
 */
async function buildWorkbook(scope) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "RVMS";
  workbook.lastModifiedBy = "RVMS";
  workbook.created = new Date();

  const groupModels = EXPORT_GROUPS[scope];

  for (const modelName of groupModels) {
    const model = models[modelName];
    const instances = await model.findAll({ raw: true });

    const sheet = workbook.addWorksheet(modelName + "s");

    if (instances.length > 0) {
      // Set columns based on the first record keys
      const columns = Object.keys(instances[0]).map((key) => ({
        header: key.replace(/_/g, " ").toUpperCase(),
        key: key,
        width: 20,
      }));
      sheet.columns = columns;
      sheet.addRows(instances);

      // Basic formatting for header
      sheet.getRow(1).font = { bold: true };
    } else {
      sheet.addRow(["No data available"]);
    }
  }

  return { workbook, filename: `RVMS-${scope}-data` };
}

/**
 * Builds a CSV string for the given scope (combines requested models).
 */
async function buildCsv(scope) {
  const groupModels = EXPORT_GROUPS[scope];
  let csvContent = "";

  for (const modelName of groupModels) {
    const model = models[modelName];
    const instances = await model.findAll({ raw: true });

    csvContent += `--- ${modelName.toUpperCase()}S ---\n`;

    if (instances.length > 0) {
      const headers = Object.keys(instances[0]);
      csvContent += headers.join(",") + "\n";

      instances.forEach((row) => {
        const values = headers.map((header) => {
          const val = row[header];
          return typeof val === "string" ? `"${val.replace(/"/g, '""')}"` : val;
        });
        csvContent += values.join(",") + "\n";
      });
    } else {
      csvContent += "No records found\n";
    }
    csvContent += "\n";
  }

  return { csv: csvContent, filename: `RVMS-${scope}-data` };
}

module.exports = { buildWorkbook, buildCsv, EXPORT_GROUPS };
