const Review = require('../models/Review');
const Course = require('../models/Course');

// POST /api/reviews/:courseId
exports.createReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5)
      return res.status(400).json({ success: false, message: 'Rating must be 1–5' });

    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    const review = await Review.create({ course: req.params.courseId, student: req.user.id, rating, comment });

    // Recalculate course avg rating
    const all = await Review.find({ course: req.params.courseId });
    const avg = all.reduce((s, r) => s + r.rating, 0) / all.length;
    await Course.findByIdAndUpdate(req.params.courseId, { rating: Math.round(avg * 10) / 10, ratingsCount: all.length });

    await review.populate('student', 'name avatar');
    res.status(201).json({ success: true, review });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ success: false, message: 'You already reviewed this course' });
    next(err);
  }
};

// GET /api/reviews/:courseId
exports.getCourseReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ course: req.params.courseId })
      .populate('student', 'name avatar')
      .sort({ createdAt: -1 });
    const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
    res.json({ success: true, reviews, avgRating: Math.round(avg * 10) / 10, total: reviews.length });
  } catch (err) { next(err); }
};

// DELETE /api/reviews/:id
exports.deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    if (review.student.toString() !== req.user.id)
      return res.status(403).json({ success: false, message: 'Not authorized' });
    await review.deleteOne();
    res.json({ success: true, message: 'Review deleted' });
  } catch (err) { next(err); }
};
