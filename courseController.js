const Course = require('../models/Course');
const User = require('../models/User');
const Progress = require('../models/Progress');

// ─── GET /api/courses — public, search + filter ──────────────────────────────
exports.getCourses = async (req, res, next) => {
  try {
    const { search, category, level, page = 1, limit = 20 } = req.query;
    const query = { isPublished: true };
    if (search) query.$text = { $search: search };
    if (category && category !== 'All') query.category = category;
    if (level) query.level = level;

    const skip = (Number(page) - 1) * Number(limit);
    const [courses, total] = await Promise.all([
      Course.find(query)
        .populate('mentor', 'name avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Course.countDocuments(query),
    ]);
    res.json({ success: true, total, page: Number(page), courses });
  } catch (err) { next(err); }
};

// ─── GET /api/courses/:id — public ───────────────────────────────────────────
exports.getCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('mentor', 'name avatar bio');
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    res.json({ success: true, course });
  } catch (err) { next(err); }
};

// ─── POST /api/courses — mentor only ─────────────────────────────────────────
exports.createCourse = async (req, res, next) => {
  try {
    const course = await Course.create({ ...req.body, mentor: req.user.id, price: 0, isFree: true });
    await course.populate('mentor', 'name avatar');
    res.status(201).json({ success: true, course });
  } catch (err) { next(err); }
};

// ─── PUT /api/courses/:id — mentor only (own course) ─────────────────────────
exports.updateCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    if (course.mentor.toString() !== req.user.id)
      return res.status(403).json({ success: false, message: 'Not authorized to edit this course' });

    // Prevent overriding mentor field
    delete req.body.mentor;
    const updated = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('mentor', 'name avatar');
    res.json({ success: true, course: updated });
  } catch (err) { next(err); }
};

// ─── DELETE /api/courses/:id — mentor only ───────────────────────────────────
exports.deleteCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    if (course.mentor.toString() !== req.user.id)
      return res.status(403).json({ success: false, message: 'Not authorized' });
    await course.deleteOne();
    // Clean up progress records for this course
    await Progress.deleteMany({ course: req.params.id });
    res.json({ success: true, message: 'Course deleted' });
  } catch (err) { next(err); }
};

// ─── POST /api/courses/:id/enroll — student only ─────────────────────────────
exports.enrollCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    const user = await User.findById(req.user.id);
    const alreadyEnrolled = user.enrolledCourses.some(id => id.toString() === course._id.toString());
    if (alreadyEnrolled)
      return res.status(400).json({ success: false, message: 'Already enrolled' });

    // Save enrollment on user
    user.enrolledCourses.push(course._id);
    await user.save();

    // Increment student count on course
    await Course.findByIdAndUpdate(req.params.id, { $inc: { studentsCount: 1 } });

    // Create a progress record for this student+course
    await Progress.create({ student: req.user.id, course: course._id });

    res.json({ success: true, message: 'Enrolled successfully' });
  } catch (err) { next(err); }
};

// ─── GET /api/courses/student/enrolled — student's enrolled courses ───────────
exports.getEnrolledCourses = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: 'enrolledCourses',
      populate: { path: 'mentor', select: 'name avatar' },
    });
    // Attach progress to each course
    const progressList = await Progress.find({ student: req.user.id });
    const courses = user.enrolledCourses.map(c => {
      const prog = progressList.find(p => p.course.toString() === c._id.toString());
      return {
        ...c.toObject(),
        progress: prog ? {
          completedLessons: prog.completedLessons,
          completedAt: prog.completedAt,
          lastAccessedAt: prog.lastAccessedAt,
        } : { completedLessons: [], completedAt: null },
      };
    });
    res.json({ success: true, courses });
  } catch (err) { next(err); }
};

// ─── GET /api/courses/mentor/my-courses — mentor's own courses ───────────────
exports.getMentorCourses = async (req, res, next) => {
  try {
    const courses = await Course.find({ mentor: req.user.id })
      .populate('mentor', 'name avatar')
      .sort({ createdAt: -1 });
    res.json({ success: true, courses });
  } catch (err) { next(err); }
};

// ─── POST /api/courses/:id/progress — mark lesson complete ───────────────────
exports.markLessonComplete = async (req, res, next) => {
  try {
    const { lessonId } = req.body;
    if (!lessonId) return res.status(400).json({ success: false, message: 'lessonId required' });

    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    // Verify student is enrolled
    const user = await User.findById(req.user.id);
    const enrolled = user.enrolledCourses.some(id => id.toString() === course._id.toString());
    if (!enrolled) return res.status(403).json({ success: false, message: 'Not enrolled in this course' });

    const progress = await Progress.findOneAndUpdate(
      { student: req.user.id, course: req.params.id },
      {
        $addToSet: { completedLessons: lessonId },
        lastAccessedAt: new Date(),
      },
      { new: true, upsert: true }
    );

    // Mark course complete if all lessons done
    const allDone = course.lessons.every(l => progress.completedLessons.map(String).includes(l._id.toString()));
    if (allDone && !progress.completedAt) {
      progress.completedAt = new Date();
      await progress.save();
    }

    res.json({ success: true, progress });
  } catch (err) { next(err); }
};

// ─── GET /api/courses/:id/progress — get student's progress ──────────────────
exports.getProgress = async (req, res, next) => {
  try {
    const progress = await Progress.findOne({ student: req.user.id, course: req.params.id });
    res.json({ success: true, progress: progress || { completedLessons: [], completedAt: null } });
  } catch (err) { next(err); }
};
