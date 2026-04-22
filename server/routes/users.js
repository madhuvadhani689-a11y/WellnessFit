const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

router.patch('/update-profile', protect, async (req, res) => {
  try {
    const { emailNotifications } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (emailNotifications !== undefined) {
      user.emailNotifications = emailNotifications;
    }
    
    await user.save();
    res.json({ message: 'Profile updated successfully', user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
