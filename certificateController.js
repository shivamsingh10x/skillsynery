const Certificate = require('../models/Certificate');
const Progress = require('../models/Progress');
const Course = require('../models/Course');
const Notification = require('../models/Notification');

// POST /api/certificates/claim/:courseId — student claims certificate after completing course
exports.claimCertificate = async (req, res, next) => {
  try {
    const progress = await Progress.findOne({ student: req.user.id, course: req.params.courseId });
    if (!progress?.completedAt)
      return res.status(400).json({ success: false, message: 'Complete all lessons first' });

    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    // Upsert — idempotent
    let cert = await Certificate.findOne({ student: req.user.id, course: req.params.courseId });
    if (!cert) {
      cert = await Certificate.create({ student: req.user.id, course: req.params.courseId, mentor: course.mentor });
      // Notify student
      const io = req.app.get('io');
      if (io) {
        io.emit(`notify_${req.user.id}`, {
          type: 'certificate',
          title: '🏆 Certificate Earned!',
          message: `You earned a certificate for "${course.title}"`,
          link: `/certificates/${cert.certificateId}`,
        });
      }
      await Notification.create({
        user: req.user.id,
        type: 'certificate',
        title: '🏆 Certificate Earned!',
        message: `You earned a certificate for "${course.title}"`,
        link: `/certificates/${cert.certificateId}`,
      });
    }

    await cert.populate('student', 'name email');
    await cert.populate('course', 'title category');
    await cert.populate('mentor', 'name');
    res.json({ success: true, certificate: cert });
  } catch (err) { next(err); }
};

// GET /api/certificates/my — student's certificates
exports.myCertificates = async (req, res, next) => {
  try {
    const certs = await Certificate.find({ student: req.user.id })
      .populate('course', 'title category thumbnail')
      .populate('mentor', 'name')
      .sort({ issuedAt: -1 });
    res.json({ success: true, certificates: certs });
  } catch (err) { next(err); }
};

// GET /api/certificates/verify/:certId — public verification
exports.verifyCertificate = async (req, res, next) => {
  try {
    const cert = await Certificate.findOne({ certificateId: req.params.certId })
      .populate('student', 'name')
      .populate('course', 'title category')
      .populate('mentor', 'name');
    if (!cert) return res.status(404).json({ success: false, message: 'Certificate not found or invalid' });
    res.json({ success: true, certificate: cert, valid: true });
  } catch (err) { next(err); }
};
