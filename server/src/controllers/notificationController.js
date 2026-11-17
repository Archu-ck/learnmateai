const Notification = require('../models/Notification');

async function getNotifications(req, res) {
  try {
    const userId = req.user._id;
    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    const unreadCount = await Notification.countDocuments({ userId, read: false });

    return res.json({ notifications, unreadCount });
  } catch (err) {
    console.error('getNotifications error:', err);
    return res.status(500).json({ error: 'Failed to retrieve notifications' });
  }
}

async function markAllRead(req, res) {
  try {
    const userId = req.user._id;
    await Notification.updateMany({ userId, read: false }, { read: true });
    return res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    console.error('markAllRead error:', err);
    return res.status(500).json({ error: 'Failed to mark notifications read' });
  }
}

async function markSingleRead(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    await Notification.findOneAndUpdate({ _id: id, userId }, { read: true });
    return res.json({ success: true });
  } catch (err) {
    console.error('markSingleRead error:', err);
    return res.status(500).json({ error: 'Failed to mark notification read' });
  }
}

module.exports = {
  getNotifications,
  markAllRead,
  markSingleRead,
};
