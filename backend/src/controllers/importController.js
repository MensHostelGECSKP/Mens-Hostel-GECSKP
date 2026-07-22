const ExcelJS = require('exceljs');
const importService = require('../services/importService');
const { ERROR_CODES } = require('../constants/errors');

/**
 * Generates and downloads the official Excel import template.
 */
async function downloadTemplate(req, res, next) {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Users Import Template');

    // Define column headers, keys, and width
    worksheet.columns = [
      { header: 'Name', key: 'name', width: 25 },
      { header: 'Year', key: 'year', width: 12 },
      { header: 'Room Number', key: 'roomNumber', width: 15 },
      { header: 'Email', key: 'email', width: 35 },
    ];

    // Style the header row (bold, white text, primary background fill #4441CC)
    const headerRow = worksheet.getRow(1);
    headerRow.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '4441CC' },
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 26;

    // Add sample instruction row
    worksheet.addRow({
      name: 'Sabari S',
      year: '3',
      roomNumber: '313',
      email: 'sabarisanthosh45@example.com',
    });

    // Style borders and alignment for all cells
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'E2E8F0' } },
          left: { style: 'thin', color: { argb: 'E2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'E2E8F0' } },
          right: { style: 'thin', color: { argb: 'E2E8F0' } },
        };
        if (rowNumber > 1) {
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
          cell.font = { name: 'Arial', size: 10 };
        }
      });
    });

    // Set headers and write workbook to response stream
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=MH_App_User_Import_Template.xlsx'
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
}

/**
 * Accepts Excel upload and returns data preview + validation reports.
 */
async function previewImport(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No spreadsheet file uploaded',
        code: 'VALIDATION_ERROR',
      });
    }

    const rows = importService.parseExcel(req.file.buffer);
    const result = await importService.validateData(rows);

    res.json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * Executes import of validated rows.
 */
async function executeImport(req, res, next) {
  try {
    const { users, validationSkippedCount = 0 } = req.body;

    if (!users || !Array.isArray(users)) {
      return res.status(400).json({
        error: 'Missing list of users to import',
        code: 'VALIDATION_ERROR',
      });
    }

    // Execute the import using the reusable service
    const results = await importService.importUsers(users, req, {
      skippedCount: validationSkippedCount,
    });

    res.json(results);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  downloadTemplate,
  previewImport,
  executeImport,
};
