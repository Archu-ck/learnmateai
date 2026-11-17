const ChatThread = require('../models/ChatThread');
const ChatMessage = require('../models/ChatMessage');
const StudentSubject = require('../models/StudentSubject');
const TeacherAssignment = require('../models/TeacherAssignment');
const ChatSetting = require('../models/ChatSetting');
const User = require('../models/User');
const { getIO, sanitizeMessage } = require('../services/socketService');

// Helper to check chat hours
async function isChatOpen(schoolId, classId) {
  const setting = await ChatSetting.findOne({ schoolId });
  // If setting does not exist or chatHoursEnabled is explicitly false, chat is open 24/7
  if (!setting || setting.chatHoursEnabled === false) return { open: true };

  if (classId && setting.disabledClassIds?.includes(classId.toString())) {
    return { open: false, reason: 'Chat is currently disabled for this class.' };
  }

  const currentHour = new Date().getHours();
  const start = setting.startHour !== undefined ? setting.startHour : 6;
  const end = setting.endHour !== undefined ? setting.endHour : 23;

  if (currentHour < start || currentHour >= end) {
    return {
      open: false,
      reason: `Chat is closed outside active school hours (${start}:00 to ${end}:00).`,
    };
  }

  return { open: true };
}

// 1. Get or Create 1-on-1 Thread for Subject
async function getSubjectThread(req, res) {
  try {
    const user = req.user;
    const schoolId = user.schoolId;
    const { subjectId, threadId, studentId: queryStudentId } = req.query;

    let thread = null;

    if (threadId) {
      thread = await ChatThread.findOne({ _id: threadId, schoolId })
        .populate('studentId', 'name email rollNumber')
        .populate('teacherId', 'name email')
        .populate('subjectId', 'name code')
        .populate('classId', 'name');
    } else if (user.role === 'student') {
      if (!subjectId) return res.status(400).json({ error: 'subjectId is required' });

      // Verify student is enrolled in subject
      const enrollment = await StudentSubject.findOne({
        studentId: user._id,
        subjectId,
        schoolId,
      });
      if (!enrollment) {
        return res.status(403).json({ error: 'Access denied: You are not enrolled in this subject.' });
      }

      // Find assigned teacher
      const ta = await TeacherAssignment.findOne({
        classId: user.classId,
        section: user.sectionId,
        subjectId,
        schoolId,
      });

      const teacherId = ta ? ta.teacherId : null;

      thread = await ChatThread.findOne({
        studentId: user._id,
        subjectId,
        schoolId,
      });

      if (!thread && teacherId) {
        thread = await ChatThread.create({
          studentId: user._id,
          teacherId,
          subjectId,
          classId: user.classId,
          section: user.sectionId || 'A',
          lastMessageText: '',
          schoolId,
        });
      }
    } else if (user.role === 'teacher') {
      if (!queryStudentId || !subjectId) {
        return res.status(400).json({ error: 'studentId and subjectId are required' });
      }

      thread = await ChatThread.findOne({
        teacherId: user._id,
        studentId: queryStudentId,
        subjectId,
        schoolId,
      })
        .populate('studentId', 'name email rollNumber')
        .populate('subjectId', 'name code')
        .populate('classId', 'name');
    }

    if (!thread) {
      return res.json({ thread: null, messages: [] });
    }

    // Fetch messages
    const messages = await ChatMessage.find({ threadId: thread._id, schoolId })
      .sort({ createdAt: 1 })
      .lean();

    // Mark unread messages as read
    if (user.role === 'teacher' && thread.unreadTeacherCount > 0) {
      await ChatThread.findByIdAndUpdate(thread._id, { unreadTeacherCount: 0 });
      await ChatMessage.updateMany(
        { threadId: thread._id, senderRole: 'student', readAt: null },
        { readAt: new Date() }
      );
    } else if (user.role === 'student' && thread.unreadStudentCount > 0) {
      await ChatThread.findByIdAndUpdate(thread._id, { unreadStudentCount: 0 });
      await ChatMessage.updateMany(
        { threadId: thread._id, senderRole: 'teacher', readAt: null },
        { readAt: new Date() }
      );
    }

    return res.json({ thread, messages });
  } catch (err) {
    console.error('getSubjectThread error:', err);
    return res.status(500).json({ error: 'Failed to retrieve chat thread' });
  }
}

// 2. Get All Threads for User
async function getThreadsList(req, res) {
  try {
    const user = req.user;
    const schoolId = user.schoolId;

    let query = { schoolId };
    if (user.role === 'teacher') {
      query.teacherId = user._id;
    } else if (user.role === 'student') {
      query.studentId = user._id;
    }

    const threads = await ChatThread.find(query)
      .populate('studentId', 'name email rollNumber sectionId')
      .populate('teacherId', 'name email')
      .populate('subjectId', 'name code')
      .populate('classId', 'name')
      .sort({ updatedAt: -1 })
      .lean();

    return res.json({ threads });
  } catch (err) {
    console.error('getThreadsList error:', err);
    return res.status(500).json({ error: 'Failed to retrieve threads' });
  }
}

// 3. Send Message
async function sendMessage(req, res) {
  try {
    const user = req.user;
    const schoolId = user.schoolId;
    const { threadId, subjectId, text, files, isDoubt } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Message text cannot be empty' });
    }

    let thread = null;
    if (threadId) {
      thread = await ChatThread.findById(threadId);
    } else if (subjectId && user.role === 'student') {
      // 1. Check existing thread
      thread = await ChatThread.findOne({ studentId: user._id, subjectId, schoolId });

      // 2. If not found, create new thread
      if (!thread) {
        let classId = user.classId;
        let section = user.sectionId || 'A';

        if (!classId) {
          const en = await StudentSubject.findOne({ studentId: user._id, subjectId, schoolId });
          if (en) classId = en.classId;
        }

        let ta = await TeacherAssignment.findOne({
          classId,
          section,
          subjectId,
          schoolId,
        });

        if (!ta) {
          ta = await TeacherAssignment.findOne({ subjectId, schoolId });
        }

        if (!ta) {
          return res.status(400).json({ error: 'No teacher is assigned to this subject yet.' });
        }

        thread = await ChatThread.create({
          studentId: user._id,
          teacherId: ta.teacherId,
          subjectId,
          classId: classId || ta.classId,
          section,
          schoolId,
        });
      }
    }

    if (!thread) {
      return res.status(404).json({ error: 'Chat thread not found' });
    }

    // Check chat hours
    const chatStatus = await isChatOpen(schoolId, thread.classId);
    if (!chatStatus.open) {
      return res.status(400).json({ error: chatStatus.reason });
    }

    const message = await ChatMessage.create({
      threadId: thread._id,
      senderId: user._id,
      senderRole: user.role,
      text: text.trim(),
      files: files || [],
      isDoubt: user.role === 'student' ? !!isDoubt : false,
      resolved: false,
      schoolId,
    });

    // Update thread meta
    thread.lastMessageText = text.trim();
    if (user.role === 'student') {
      thread.unreadTeacherCount = (thread.unreadTeacherCount || 0) + 1;
      if (isDoubt) thread.hasUnresolvedDoubts = true;
    } else {
      thread.unreadStudentCount = (thread.unreadStudentCount || 0) + 1;
    }
    await thread.save();

    // Broadcast through socket if active
    const io = getIO();
    if (io) {
      io.to(`thread:${thread._id}`).emit('new_message', {
        ...message.toObject(),
        senderName: user.name,
      });
      const recipientId = user.role === 'student' ? thread.teacherId : thread.studentId;
      io.to(`user:${recipientId}`).emit('notification', {
        type: 'chat_message',
        title: `New message from ${user.name}`,
        message: text.slice(0, 80),
        threadId: thread._id,
        createdAt: new Date(),
      });
    }

    return res.status(201).json({ message, thread });
  } catch (err) {
    console.error('sendMessage error:', err);
    return res.status(500).json({ error: 'Failed to send message' });
  }
}

// 4. Resolve Doubt
async function resolveDoubt(req, res) {
  try {
    const { id } = req.params;
    const schoolId = req.user.schoolId;

    const message = await ChatMessage.findOne({ _id: id, schoolId });
    if (!message) return res.status(404).json({ error: 'Message not found' });

    message.resolved = true;
    await message.save();

    // Check if any other unresolved doubts exist in this thread
    const remainingDoubts = await ChatMessage.countDocuments({
      threadId: message.threadId,
      isDoubt: true,
      resolved: false,
      schoolId,
    });

    await ChatThread.findByIdAndUpdate(message.threadId, {
      hasUnresolvedDoubts: remainingDoubts > 0,
    });

    const io = getIO();
    if (io) {
      io.to(`thread:${message.threadId}`).emit('doubt_resolved', {
        messageId: id,
        threadId: message.threadId,
      });
    }

    return res.json({ message: 'Doubt marked as resolved', resolved: true });
  } catch (err) {
    console.error('resolveDoubt error:', err);
    return res.status(500).json({ error: 'Failed to resolve doubt' });
  }
}

// 5. Get Chat Settings
async function getChatSettings(req, res) {
  try {
    const schoolId = req.user.schoolId;
    let setting = await ChatSetting.findOne({ schoolId }).lean();
    if (!setting) {
      setting = { chatHoursEnabled: true, startHour: 7, endHour: 21, disabledClassIds: [] };
    }
    const currentHour = new Date().getHours();
    const isOpen = !setting.chatHoursEnabled || (currentHour >= setting.startHour && currentHour < setting.endHour);

    return res.json({ setting, isOpen });
  } catch (err) {
    console.error('getChatSettings error:', err);
    return res.status(500).json({ error: 'Failed to retrieve chat settings' });
  }
}

module.exports = {
  getSubjectThread,
  getThreadsList,
  sendMessage,
  resolveDoubt,
  getChatSettings,
};
