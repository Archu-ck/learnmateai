const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ChatThread = require('../models/ChatThread');
const ChatMessage = require('../models/ChatMessage');
const ChatSetting = require('../models/ChatSetting');
const Notification = require('../models/Notification');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey_learnmate_2026';

let io = null;

// Parse cookie string into key-value map
function parseCookies(cookieHeader) {
  const list = {};
  if (!cookieHeader) return list;
  cookieHeader.split(';').forEach((cookie) => {
    let [name, ...rest] = cookie.split('=');
    name = name?.trim();
    if (!name) return;
    const value = rest.join('=').trim();
    list[name] = decodeURIComponent(value);
  });
  return list;
}

// Basic Profanity Filter
const BLOCKED_WORDS = ['badword1', 'abuse', 'profanity', 'stupid', 'idiot'];
function sanitizeMessage(text) {
  let cleaned = text;
  BLOCKED_WORDS.forEach((word) => {
    const reg = new RegExp(`\\b${word}\\b`, 'gi');
    cleaned = cleaned.replace(reg, '***');
  });
  return cleaned;
}

// Check chat hours
async function isChatOpen(schoolId) {
  const setting = await ChatSetting.findOne({ schoolId });
  if (!setting || setting.chatHoursEnabled === false) return { open: true };

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

function initSocket(httpServer) {
  const clientOrigin = process.env.CLIENT_ORIGIN;
  const origins = clientOrigin
    ? clientOrigin.split(',').map((o) => o.trim())
    : ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5000'];

  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (
          origins.includes(origin) ||
          origin.endsWith('.vercel.app') ||
          origin.includes('localhost')
        ) {
          return callback(null, true);
        }
        return callback(null, true);
      },
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Socket Authentication Middleware
  io.use(async (socket, next) => {
    try {
      const cookies = parseCookies(socket.handshake.headers?.cookie);
      let token = cookies.token || socket.handshake.auth?.token;

      if (!token && socket.handshake.headers?.authorization) {
        const parts = socket.handshake.headers.authorization.split(' ');
        if (parts.length === 2 && parts[0] === 'Bearer') {
          token = parts[1];
        }
      }

      if (!token) {
        return next(new Error('Authentication required for real-time chat'));
      }

      let decoded;
      try {
        decoded = jwt.verify(token, JWT_SECRET);
      } catch (err) {
        return next(new Error('Invalid session token'));
      }

      const user = await User.findById(decoded.userId).lean();
      if (!user || user.status === 'disabled') {
        return next(new Error('User not found or disabled'));
      }

      socket.user = user;
      next();
    } catch (err) {
      console.error('Socket auth error:', err);
      next(new Error('Authentication failed'));
    }
  });

  // Event handlers
  io.on('connection', (socket) => {
    const user = socket.user;
    const userRoom = `user:${user._id.toString()}`;
    socket.join(userRoom);

    // Join Thread Room
    socket.on('join_thread', async ({ threadId }) => {
      try {
        if (!threadId) return;
        const thread = await ChatThread.findById(threadId).lean();
        if (!thread) return;

        // Verify authorization
        const isParticipant =
          thread.studentId.toString() === user._id.toString() ||
          thread.teacherId.toString() === user._id.toString() ||
          user.role === 'admin';

        if (isParticipant) {
          const room = `thread:${threadId}`;
          socket.join(room);
        }
      } catch (err) {
        console.error('join_thread error:', err);
      }
    });

    // Leave Thread Room
    socket.on('leave_thread', ({ threadId }) => {
      if (threadId) {
        socket.leave(`thread:${threadId}`);
      }
    });

    // Typing Indicators
    socket.on('typing_start', ({ threadId }) => {
      if (!threadId) return;
      socket.to(`thread:${threadId}`).emit('user_typing', {
        threadId,
        userId: user._id,
        userName: user.name,
        role: user.role,
      });
    });

    socket.on('typing_stop', ({ threadId }) => {
      if (!threadId) return;
      socket.to(`thread:${threadId}`).emit('user_stop_typing', {
        threadId,
        userId: user._id,
      });
    });

    // Send Real-Time Message
    socket.on('send_message', async ({ threadId, text, files, isDoubt }, callback) => {
      try {
        if (!threadId || !text || !text.trim()) {
          if (callback) callback({ error: 'Thread ID and message text are required' });
          return;
        }

        const thread = await ChatThread.findById(threadId);
        if (!thread) {
          if (callback) callback({ error: 'Thread not found' });
          return;
        }

        // Check chat hours
        const chatStatus = await isChatOpen(thread.schoolId);
        if (!chatStatus.open) {
          if (callback) callback({ error: chatStatus.reason, outOfHours: true });
          return;
        }

        const cleanedText = sanitizeMessage(text.trim());

        const newMsg = await ChatMessage.create({
          threadId: thread._id,
          senderId: user._id,
          senderRole: user.role,
          text: cleanedText,
          files: files || [],
          isDoubt: user.role === 'student' ? Boolean(isDoubt) : false,
          resolved: false,
          schoolId: thread.schoolId,
        });

        // Update thread
        thread.lastMessageText = cleanedText;
        thread.lastMessageAt = new Date();
        const isStudent = user.role === 'student';
        if (isStudent) {
          thread.unreadTeacherCount = (thread.unreadTeacherCount || 0) + 1;
          if (isDoubt) thread.hasUnresolvedDoubts = true;
        } else {
          thread.unreadStudentCount = (thread.unreadStudentCount || 0) + 1;
        }
        await thread.save();

        const messagePayload = {
          ...newMsg.toObject(),
          senderName: user.name,
        };

        // Broadcast to Thread Room
        io.to(`thread:${threadId}`).emit('new_message', messagePayload);

        // Notify recipient if not active in room
        const recipientId = isStudent ? thread.teacherId : thread.studentId;
        const recipientRoom = `user:${recipientId.toString()}`;

        io.to(recipientRoom).emit('notification', {
          type: 'chat_message',
          title: `New message from ${user.name}`,
          message: cleanedText.slice(0, 80),
          threadId: thread._id,
          createdAt: new Date(),
        });

        // Persist Notification in DB
        await Notification.create({
          userId: recipientId,
          type: 'chat_message',
          title: `New message from ${user.name}`,
          message: cleanedText.slice(0, 100),
          link: isStudent ? `/teacher/chat` : `/student/subjects/${thread.subjectId}?tab=chat`,
          read: false,
          schoolId: thread.schoolId,
        });

        if (callback) callback({ success: true, message: messagePayload });
      } catch (err) {
        console.error('Socket send_message error:', err);
        if (callback) callback({ error: 'Failed to send real-time message' });
      }
    });

    // Mark Messages as Read
    socket.on('mark_read', async ({ threadId }) => {
      try {
        if (!threadId) return;
        const thread = await ChatThread.findById(threadId);
        if (!thread) return;

        if (user.role === 'teacher') {
          thread.unreadTeacherCount = 0;
          await ChatMessage.updateMany(
            { threadId, senderRole: 'student', readAt: null },
            { readAt: new Date() }
          );
        } else {
          thread.unreadStudentCount = 0;
          await ChatMessage.updateMany(
            { threadId, senderRole: 'teacher', readAt: null },
            { readAt: new Date() }
          );
        }
        await thread.save();

        io.to(`thread:${threadId}`).emit('messages_read', {
          threadId,
          readBy: user.role,
          readAt: new Date(),
        });
      } catch (err) {
        console.error('Socket mark_read error:', err);
      }
    });

    // Resolve Doubt
    socket.on('resolve_doubt', async ({ messageId, threadId }) => {
      try {
        if (!messageId) return;
        const msg = await ChatMessage.findByIdAndUpdate(
          messageId,
          { resolved: true },
          { new: true }
        );
        if (msg) {
          // Check if thread still has unresolved doubts
          const remainingDoubts = await ChatMessage.countDocuments({
            threadId: msg.threadId,
            isDoubt: true,
            resolved: false,
          });
          if (remainingDoubts === 0) {
            await ChatThread.findByIdAndUpdate(msg.threadId, { hasUnresolvedDoubts: false });
          }

          io.to(`thread:${msg.threadId}`).emit('doubt_resolved', {
            messageId,
            threadId: msg.threadId,
          });
        }
      } catch (err) {
        console.error('Socket resolve_doubt error:', err);
      }
    });

    socket.on('disconnect', () => {
      // Clean up
    });
  });

  return io;
}

function getIO() {
  return io;
}

module.exports = {
  initSocket,
  getIO,
  sanitizeMessage,
  isChatOpen,
};
