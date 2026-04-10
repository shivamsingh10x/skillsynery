const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  duration: { type: String, default: '0 min' },
  videoUrl: { type: String, default: '' },
  order: { type: Number, default: 0 },
});

const upcomingClassSchema = new mongoose.Schema({
  date: { type: String, default: '' },
  time: { type: String, default: '' },
  platform: { type: String, enum: ['Zoom', 'Google Meet', 'Microsoft Teams'], default: 'Zoom' },
  link: { type: String, default: '' },
}, { _id: false });

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Course title is required'],
    trim: true,
    maxlength: [120, 'Title cannot exceed 120 characters'],
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters'],
  },
  category: {
    type: String,
    required: true,
    enum: ['Coding','Music','Guitar','Dance','Design','Academic','Photography','Business','Language','Fitness','Cooking'],
  },
  level: {
    type: String,
    required: true,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner',
  },
  price: { type: Number, default: 0, min: 0 },
  isFree: { type: Boolean, default: true },
  thumbnail: { type: String, default: '' },
  mentor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  lessons: [lessonSchema],
  studentsCount: { type: Number, default: 0 },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  ratingsCount: { type: Number, default: 0 },
  duration: { type: String, default: '0 hours' },
  tags: [String],
  isPublished: { type: Boolean, default: true },
  upcomingClass: { type: upcomingClassSchema, default: null },
}, { timestamps: true });

// Text index for search
courseSchema.index({ title: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Course', courseSchema);
