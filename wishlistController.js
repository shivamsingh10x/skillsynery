const User = require('../models/User');
const Course = require('../models/Course');

// POST /api/wishlist/:courseId — toggle
exports.toggleWishlist = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const courseId = req.params.courseId;
    const idx = (user.wishlist || []).findIndex(id => id.toString() === courseId);
    if (idx === -1) {
      user.wishlist = [...(user.wishlist || []), courseId];
    } else {
      user.wishlist.splice(idx, 1);
    }
    await user.save();
    res.json({ success: true, wishlisted: idx === -1, wishlist: user.wishlist });
  } catch (err) { next(err); }
};

// GET /api/wishlist
exports.getWishlist = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: 'wishlist',
      populate: { path: 'mentor', select: 'name avatar' },
    });
    res.json({ success: true, wishlist: user.wishlist || [] });
  } catch (err) { next(err); }
};
