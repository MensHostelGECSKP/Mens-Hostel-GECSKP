const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const attendanceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true },
  meals: {
    morning: { type: Boolean, default: true },
    noon: { type: Boolean, default: true },
    night: { type: Boolean, default: true },
  },
});

const Attendance = mongoose.model('Attendance', attendanceSchema);

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB successfully");

    const countsByDate = await Attendance.aggregate([
      { $group: { _id: "$date", count: { $sum: 1 } } },
      { $sort: { _id: -1 } }
    ]);

    console.log("Distinct dates with attendance records and count of records:");
    console.log(JSON.stringify(countsByDate, null, 2));

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
