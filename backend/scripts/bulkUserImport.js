const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const fs = require('fs');
const readline = require('readline');
const importService = require('../src/services/importService');

// Verify connection string
if (!process.env.MONGODB_URI) {
  console.error('Error: MONGODB_URI environment variable is not defined.');
  process.exit(1);
}

const filePath = process.argv[2];
if (!filePath) {
  console.error('Usage: node scripts/bulkUserImport.js <path-to-excel-file>');
  console.error('Template Columns: Name, Year, Room Number, Email');
  process.exit(1);
}

if (!fs.existsSync(filePath)) {
  console.error(`Error: File not found at path: ${filePath}`);
  process.exit(1);
}

async function run() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected.');

  try {
    const buffer = fs.readFileSync(filePath);
    const rows = importService.parseExcel(buffer);

    console.log(`Parsing completed. Found ${rows.length} rows.`);
    console.log('Validating data...');

    const preview = await importService.validateData(rows);

    console.log('\n--- IMPORT PREVIEW ---');
    console.log(`${preview.totalRows} Rows Found`);
    console.log(`${preview.validRowsCount} Valid`);
    console.log(`${preview.invalidRowsCount} Invalid`);
    console.log(`${preview.duplicateCount} Duplicate Users`);
    console.log('----------------------\n');

    if (preview.rowErrors.length > 0) {
      console.log('Errors:');
      preview.rowErrors.forEach((err) => {
        console.log(`Row ${err.rowNumber}`);
        err.errors.forEach((e) => console.log(`  ${e}`));
      });
      console.log('');
    }

    if (preview.validRowsCount === 0) {
      console.log('No valid users found for import. Exiting.');
      mongoose.disconnect();
      process.exit(0);
    }

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(`${preview.validRowsCount} users ready for import. Proceed? (y/N): `, async (answer) => {
      rl.close();
      const confirmed = answer.trim().toLowerCase() === 'y' || answer.trim().toLowerCase() === 'yes';

      if (!confirmed) {
        console.log('Import cancelled.');
        mongoose.disconnect();
        process.exit(0);
      }

      console.log('Importing users...');
      try {
        const result = await importService.importUsers(preview.validRows, null, {
          skippedCount: preview.invalidRowsCount,
        });
        console.log('\n--- IMPORT RESULTS ---');
        console.log(`Total Rows: ${result.totalRows}`);
        console.log(`Imported: ${result.importedCount}`);
        console.log(`Skipped: ${result.skippedCount}`);
        console.log(`Failed: ${result.failedCount}`);
        console.log(`Emails Sent: ${result.emailStats?.sent ?? 0}`);
        console.log(`Emails Failed: ${result.emailStats?.failed ?? 0}`);
        
        if (result.rowResults && result.rowResults.length > 0) {
          console.log('\nRow Details:');
          result.rowResults.forEach((row) => {
            const details = row.status === 'failed'
              ? row.message
              : row.emailStatus === 'failed'
                ? `${row.message} | Email: ${row.emailError}`
                : row.message;
            console.log(`Row ${row.rowNumber} (${row.email}): ${details}`);
          });
        }
        console.log('----------------------\n');
      } catch (err) {
        console.error('Import failed during execution:', err.message);
      } finally {
        mongoose.disconnect();
      }
    });

  } catch (err) {
    console.error('An error occurred:', err.message);
    mongoose.disconnect();
    process.exit(1);
  }
}

run();
