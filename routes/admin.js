const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const { buildWorkbook, buildCsv, EXPORT_GROUPS } = require('../utils/dataExporter');
const { logActivity } = require('../utils/activityLogger');

const XLSX_CONTENT_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

function timestamp() {
  return new Date().toISOString().slice(0, 10);
}

// Admin data export: download receptionist / fleet supervisor / complete data.
// GET /admin/export/:scope?format=xlsx|csv
router.get(
  '/export/:scope',
  requireAuth,
  requireRole(['admin']),
  async (req, res) => {
    const { scope } = req.params;
    const format = (req.query.format || 'xlsx').toLowerCase();

    if (!EXPORT_GROUPS[scope]) {
      return res.status(404).render('error', {
        message: `Unknown export type: ${scope}`
      });
    }

    try {
      if (format === 'csv') {
        const { csv, filename } = await buildCsv(scope);
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="${filename}-${timestamp()}.csv"`
        );
        logActivity(req.user, 'export', 'data', null, `Exported ${scope} data (CSV)`);
        return res.send(csv);
      }

      const { workbook, filename } = await buildWorkbook(scope);
      res.setHeader('Content-Type', XLSX_CONTENT_TYPE);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}-${timestamp()}.xlsx"`
      );
      logActivity(req.user, 'export', 'data', null, `Exported ${scope} data (Excel)`);
      await workbook.xlsx.write(res);
      return res.end();
    } catch (error) {
      console.error(`Error exporting ${scope} data:`, error);
      return res.status(500).render('error', {
        message: 'Failed to generate export. Please try again.'
      });
    }
  }
);

module.exports = router;
