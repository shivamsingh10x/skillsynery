const mongoose = require('mongoose');
const { v4: uuidv4 } = require('crypto').randomUUID ? { v4: () => require('crypto').randomUUID() } : { v4: () => Math.random().toString(36).slice(2) + Date.now().toString(36) };

const certificateSchema = new mongoose.Schema({
  student:       { type: mongoose.Schema.Types.ObjectId, ref: 'User',   required: true },
  course:        { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  mentor:        { type: mongoose.Schema.Types.ObjectId, ref: 'User',   required: true },
  certificateId: { type: String, unique: true },
  issuedAt:      { type: Date, default: Date.now },
}, { timestamps: true });

certificateSchema.index({ student: 1, course: 1 }, { unique: true });

certificateSchema.pre('save', function (next) {
  if (!this.certificateId) {
    this.certificateId = 'SSP-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
  }
  next();
});

module.exports = mongoose.model('Certificate', certificateSchema);
