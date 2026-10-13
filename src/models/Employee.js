const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema(
  {
    first_name: { type: String, required: true, trim: true, maxlength: 50 },
    last_name: { type: String, required: true, trim: true, maxlength: 50 },
    email: { type: String, required: true, lowercase: true, trim: true },
    position: { type: String, required: true, trim: true, maxlength: 100 },
    salary: { type: Number, required: true, min: 0 },
    date_of_joining: { type: Date, required: true },
    department: { type: String, required: true, trim: true, maxlength: 100 },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true }
  },
  { timestamps: true }
);

employeeSchema.index({ user: 1, email: 1 }, { unique: true });

module.exports = mongoose.model('Employee', employeeSchema);