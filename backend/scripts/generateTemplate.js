const ExcelJS = require('exceljs');
const path = require('path');

async function main() {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Users Import Template');

  worksheet.columns = [
    { header: 'Name', key: 'name', width: 25 },
    { header: 'Year', key: 'year', width: 12 },
    { header: 'Room Number', key: 'roomNumber', width: 15 },
    { header: 'Email', key: 'email', width: 35 },
  ];

  // Header styling: bold, white text, primary background fill (#4441CC)
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

  // Borders and cell styling
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

  const outputPath = path.join(__dirname, '../../frontend/public/MH_App_User_Import_Template.xlsx');
  await workbook.xlsx.writeFile(outputPath);
  console.log(`Generated template file at: ${outputPath}`);
}

main().catch(console.error);
