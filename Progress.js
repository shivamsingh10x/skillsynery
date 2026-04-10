const mongoose = require('mongoose');

/**
 * Progress — tracks which lessons a student has completed per course.
 * One document per (student, course) pair.
 */
const progressSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course:  { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  completedLessons: [{ type: mongoose.Schema.Types.ObjectId }], // lesson _id values
  completedAt: { type: Date, default: null }, // set when all lessons done
  lastAccessedAt: { type: Date, default: Date.now },
}, { timestamps: true });

// Unique per student+course
progressSchema.index({ student: 1, course: 1 }, { unique: true });

module.exports = mongoose.model('Progress', progressSchema);
