const Progress = require('../models/Progress');
const Course = require('../models/Course');
const User = require('../models/User');
const Certificate = require('../models/Certificate');

// ── Helpers ───────────────────────────────────────────────────────────────────
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); d.setHours(0,0,0,0); return d; };

const getLast7Days = () => Array.from({ length: 7 }, (_, i) => {
  const d = new Date(); d.setDate(d.getDate() - (6 - i)); d.setHours(0,0,0,0);
  return { date: d, label: d.toLocaleDateString('en', { weekday: 'short' }) };
});

const getLast30Days = () => Array.from({ length: 30 }, (_, i) => {
  const d = new Date(); d.setDate(d.getDate() - (29 - i)); d.setHours(0,0,0,0);
  return { date: d, label: `${d.getMonth()+1}/${d.getDate()}` };
});

// ── GET /api/analytics/student ────────────────────────────────────────────────
exports.studentAnalytics = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const range = req.query.range || '7d';
    const days = range === '30d' ? 30 : range === '90d' ? 90 : range === '1y' ? 365 : 7;
    const since = daysAgo(days);

    // All progress records for this student
    const progressList = await Progress.find({ student: studentId })
      .populate('course', 'title category duration lessons studentsCount rating thumbnail mentor');

    const enrolledCourses = progressList.map(p => {
      const total = p.course?.lessons?.length || 0;
      const done = p.completedLessons?.length || 0;
      const pct = total ? Math.round((done / total) * 100) : 0;
      return {
        id: p.course?._id,
        title: p.course?.title,
        category: p.course?.category,
        mentor: p.course?.mentor,
        thumbnail: p.course?.thumbnail,
        totalLessons: total,
        completedLessons: done,
        progressPct: pct,
        completedAt: p.completedAt,
        lastAccessedAt: p.lastAccessedAt,
        status: p.completedAt ? 'Completed' : done > 0 ? 'In Progress' : 'Not Started',
      };
    });

    // Completion over time (lessons completed per day)
    const completionByDay = range === '7d' ? getLast7Days() : getLast30Days();
    const activityData = completionByDay.map(day => {
      const nextDay = new Date(day.date); nextDay.setDate(nextDay.getDate() + 1);
      const lessonsOnDay = progressList.reduce((sum, p) => {
        // We don't store per-lesson timestamps, so use lastAccessedAt as proxy
        const accessed = p.lastAccessedAt && p.lastAccessedAt >= day.date && p.lastAccessedAt < nextDay;
        return sum + (accessed ? p.completedLessons.length : 0);
      }, 0);
      return { label: day.label, value: lessonsOnDay };
    });

    // Certs
    const certs = await Certificate.find({ student: studentId });

    // Stats
    const completed = enrolledCourses.filter(c => c.completedAt).length;
    const inProgress = enrolledCourses.filter(c => !c.completedAt && c.completedLessons > 0).length;
    const totalLessons = enrolledCourses.reduce((s, c) => s + c.completedLessons, 0);

    res.json({
      success: true,
      stats: {
        enrolled: enrolledCourses.length,
        completed,
        inProgress,
        certificates: certs.length,
        totalLessonsCompleted: totalLessons,
      },
      enrolledCourses,
      activityData,
      completionData: [
        { label: 'Completed', value: completed, color: '#10b981' },
        { label: 'In Progress', value: inProgress, color: '#6366f1' },
        { label: 'Not Started', value: enrolledCourses.length - completed - inProgress, color: '#e5e7eb' },
      ],
    });
  } catch (err) { next(err); }
};

// ── GET /api/analytics/mentor ─────────────────────────────────────────────────
exports.mentorAnalytics = async (req, res, next) => {
  try {
    const mentorId = req.user.id;
    const range = req.query.range || '30d';
    const days = range === '7d' ? 7 : range === '90d' ? 90 : range === '1y' ? 365 : 30;
    const since = daysAgo(days);

    const courses = await Course.find({ mentor: mentorId })
      .populate('mentor', 'name avatar');

    const courseIds = courses.map(c => c._id);

    // Progress records for all students in mentor's courses
    const allProgress = await Progress.find({ course: { $in: courseIds } })
      .populate('student', 'name email createdAt')
      .populate('course', 'title category');

    // Per-course stats
    const courseStats = courses.map(c => {
      const progs = allProgress.filter(p => p.course?._id?.toString() === c._id.toString());
      const totalStudents = progs.length;
      const completed = progs.filter(p => p.completedAt).length;
      const completionRate = totalStudents ? Math.round((completed / totalStudents) * 100) : 0;
      const avgProgress = totalStudents
        ? Math.round(progs.reduce((s, p) => {
            const total = c.lessons?.length || 1;
            return s + (p.completedLessons.length / total) * 100;
          }, 0) / totalStudents)
        : 0;
      return {
        id: c._id,
        title: c.title,
        category: c.category,
        thumbnail: c.thumbnail,
        totalStudents,
        completionRate,
        avgProgress,
        rating: c.rating || 0,
        ratingsCount: c.ratingsCount || 0,
        lessons: c.lessons?.length || 0,
        upcomingClass: c.upcomingClass,
      };
    });

    // Student growth over time (enrollments per day)
    const timeline = range === '7d' ? getLast7Days() : getLast30Days();
    const growthData = timeline.map(day => {
      const nextDay = new Date(day.date); nextDay.setDate(nextDay.getDate() + 1);
      const count = allProgress.filter(p => {
        const d = new Date(p.createdAt);
        return d >= day.date && d < nextDay;
      }).length;
      return { label: day.label, value: count };
    });

    // Student list
    const studentMap = new Map();
    allProgress.forEach(p => {
      const sid = p.student?._id?.toString();
      if (!sid) return;
      if (!studentMap.has(sid)) {
        studentMap.set(sid, {
          id: sid,
          name: p.student?.name,
          email: p.student?.email,
          enrolledCourses: [],
          lastActive: p.lastAccessedAt,
        });
      }
      const s = studentMap.get(sid);
      const total = p.course ? (courses.find(c => c._id.toString() === p.course._id?.toString())?.lessons?.length || 1) : 1;
      const pct = Math.round((p.completedLessons.length / total) * 100);
      s.enrolledCourses.push({ title: p.course?.title, progress: pct, completedAt: p.completedAt });
      if (!s.lastActive || p.lastAccessedAt > s.lastActive) s.lastActive = p.lastAccessedAt;
    });

    const totalStudents = studentMap.size;
    const totalEnrollments = allProgress.length;
    const avgRating = courses.length
      ? (courses.reduce((s, c) => s + (c.rating || 0), 0) / courses.length).toFixed(1)
      : 0;

    res.json({
      success: true,
      stats: {
        totalCourses: courses.length,
        totalStudents,
        totalEnrollments,
        avgRating,
      },
      courseStats,
      growthData,
      students: [...studentMap.values()].slice(0, 50),
      enrollmentByCategory: Object.entries(
        courses.reduce((acc, c) => {
          acc[c.category] = (acc[c.category] || 0) + (c.studentsCount || 0);
          return acc;
        }, {})
      ).map(([label, value]) => ({ label, value })),
    });
  } catch (err) { next(err); }
};
