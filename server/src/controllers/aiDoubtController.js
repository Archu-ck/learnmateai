const mongoose = require('mongoose');
const AIConversation = require('../models/AIConversation');
const AIMessage = require('../models/AIMessage');
const PersonalNote = require('../models/PersonalNote');
const StudentSubject = require('../models/StudentSubject');
const Subject = require('../models/Subject');
const Topic = require('../models/Topic');
const Lesson = require('../models/Lesson');
const Assignment = require('../models/Assignment');
const MasteryRecord = require('../models/MasteryRecord');
const ChatThread = require('../models/ChatThread');
const ChatMessage = require('../models/ChatMessage');
const TeacherAssignment = require('../models/TeacherAssignment');
const Class = require('../models/Class');
const { executeAI } = require('../services/ai/aiExecutor');

/**
 * Check if the student's query is non-academic or unrelated to curriculum study
 */
function isNonAcademicQuery(text) {
  const q = (text || '').toLowerCase().trim();
  const nonAcademicPatterns = [
    /\b(play a game|play game|video game|minecraft|fortnite|roblox|gta|playstation|xbox|nintendo|pubg|free fire|clash royale)\b/i,
    /\b(favorite movie|favorite actor|favorite actress|favorite singer|celebrity|pop song|kpop|hollywood|bollywood)\b/i,
    /\b(tell me a joke|tell a joke|crack a joke|make me laugh|funny story)\b/i,
    /\b(dating|girlfriend|boyfriend|crush|gossip|are you single|do you love me)\b/i,
    /\b(who won the match|cricket score|football score|ipl score|premier league|fifa)\b/i,
    /\b(politics|politician|election|political party|who should i vote for)\b/i,
  ];
  return nonAcademicPatterns.some((pattern) => pattern.test(q));
}

/**
 * Build dynamic, context-rich system prompt for AI doubt tutor
 */
async function buildDoubtSystemPrompt({ student, subject, topic, classObj }) {
  const studentId = student._id;
  const subjectId = subject._id;

  // 1. Fetch published lesson notes for this topic (if any)
  let lessonNotesText = '';
  if (topic) {
    const lessons = await Lesson.find({
      subjectId,
      topicId: topic._id,
      status: 'published',
    })
      .select('title content')
      .lean();

    if (lessons.length > 0) {
      lessonNotesText = lessons
        .map((l) => `Lesson "${l.title}": ${l.content || ''}`)
        .join('\n')
        .slice(0, 1500); // Truncate safely
    }
  }

  // 2. Fetch student's weak topics in this subject (score < 65%)
  const weakRecords = await MasteryRecord.find({
    studentId,
    subjectId,
    scorePercentage: { $lt: 65 },
  })
    .populate('topicId', 'name')
    .lean();

  const weakTopicsList = weakRecords
    .map((r) => r.topicId?.name)
    .filter(Boolean)
    .join(', ');

  // 3. Fetch current active assignments for this subject to enforce AI-help levels
  const activeAssignments = await Assignment.find({
    subjectId,
    dueDate: { $gte: new Date(Date.now() - 24 * 3600 * 1000) },
  })
    .select('title aiHelpLevel topicId')
    .lean();

  let assignmentRules = '';
  const noHelpAssignments = activeAssignments.filter((a) => a.aiHelpLevel === 'None');
  const hintsOnlyAssignments = activeAssignments.filter((a) => a.aiHelpLevel === 'Hints only');

  if (noHelpAssignments.length > 0) {
    assignmentRules += `\n- The following active assignments have AI-help set to "None": [${noHelpAssignments.map((a) => a.title).join(', ')}]. If the student's question relates to these assignments, politely decline to assist with solving it, explain that the teacher has reserved this assignment for independent work, and encourage them to consult their teacher directly.`;
  }
  if (hintsOnlyAssignments.length > 0) {
    assignmentRules += `\n- The following active assignments have AI-help set to "Hints only": [${hintsOnlyAssignments.map((a) => a.title).join(', ')}]. NEVER provide the direct final answer or complete working solution for these. Only provide progressive hints and general concept reminders.`;
  }

  const className = classObj ? `${classObj.name} (Grade ${classObj.gradeLevel || 8})` : 'Grade 8';
  const topicName = topic ? topic.name : 'General Syllabus';

  return `You are VidyaAI, a dedicated, encouraging, and academically focused curriculum tutor for ${student.name} in ${className}.
Subject: ${subject.name}
Current Topic: ${topicName}
${weakTopicsList ? `Student's Areas Needing Revision: ${weakTopicsList}` : ''}
${lessonNotesText ? `\nTeacher's Published Notes for this Topic:\n"""\n${lessonNotesText}\n"""` : ''}

STRICT ACADEMIC-ONLY CONTENT POLICY (MANDATORY):
You are strictly an educational study assistant. You are ONLY PERMITTED to answer questions directly related to school academics, curriculum concepts, formulas, derivations, problem-solving, textbook readings, and homework for ${subject.name}.
YOU MUST DECLINE and REFUSE:
- Non-study / casual conversational topics, small talk, chit-chat, personal questions, opinions on non-academic subjects
- Entertainment, movies, celebrities, pop culture, music, television
- Video games, gaming tips, anime, cartoons, social media, influencers
- Politics, current affairs, controversial debates, news
- Creative writing/roleplay unrelated to literature curriculum
- Inappropriate, offensive, or off-topic queries

If the student's question is off-topic or not related to studying ${subject.name}, you MUST politely refuse and steer them back with this exact spirit:
"I am your LearnMate Academic Tutor, and I am only able to help with your school studies, syllabus concepts, and homework for ${subject.name}. Let's focus on your learning! What topic or problem from your syllabus would you like help with?"
Do NOT answer the non-academic part under any circumstances.

BEHAVIOR AND PEDAGOGY RULES:
1. Stay strictly on the syllabus for ${className} ${subject.name}.
2. Explain concepts in simple, intuitive language tailored to their grade level. Use clear markdown and write all mathematical equations/formulas cleanly using KaTeX/standard markdown notation.
3. HINT LADDER METHODOLOGY:
   - Step 1: When a student first asks for help with a problem, first ask what they have tried so far, or give a gentle conceptual hint.
   - Step 2: If they are still stuck, provide a worked similar example with DIFFERENT numbers.
   - Step 3: Give the full step-by-step solution ONLY if the student explicitly asks for it after having tried the hints.
${assignmentRules}
4. Always end your response with a short, friendly check question (e.g. "What would the sign become if we subtracted both sides?", "Can you tell me the next step?") to verify their understanding.
5. Keep answers concise, clear, structured, and pedagogical. Do not overwhelm the student with walls of text.`;
}

/**
 * 1. Stream Doubt via Server-Sent Events (SSE)
 */
async function streamDoubt(req, res) {
  try {
    const { subjectId, topicId, conversationId } = req.body;
    const question = req.body.question || req.body.message;

    if (!question || !question.trim()) {
      return res.status(400).json({ error: 'Question is required' });
    }
    if (!subjectId) {
      return res.status(400).json({ error: 'Subject ID is required' });
    }

    const studentId = req.user._id;

    // Verify student is enrolled in this subject (NEVER trust client subject)
    const enrollment = await StudentSubject.findOne({
      studentId,
      subjectId,
    }).populate('classId');

    if (!enrollment && req.user.role === 'student') {
      return res.status(403).json({ error: 'You are not enrolled in this subject.' });
    }

    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({ error: 'Subject not found' });
    }

    let topic = null;
    if (topicId) {
      topic = await Topic.findById(topicId);
    }

    const classObj = enrollment?.classId || (await Class.findOne({ schoolId: req.user.schoolId }));

    // Find or create conversation
    let conversation;
    if (conversationId && mongoose.isValidObjectId(conversationId)) {
      conversation = await AIConversation.findOne({
        _id: conversationId,
        studentId,
      });
    }

    if (!conversation) {
      const title = question.trim().slice(0, 45) + (question.trim().length > 45 ? '...' : '');
      conversation = await AIConversation.create({
        studentId,
        subjectId,
        topicId: topic?._id || null,
        title,
        schoolId: req.user.schoolId,
      });
    }

    // Save student question message
    await AIMessage.create({
      conversationId: conversation._id,
      role: 'user',
      content: question.trim(),
      schoolId: req.user.schoolId,
    });

    // Fetch conversation history (last 10 messages)
    const history = await AIMessage.find({ conversationId: conversation._id })
      .sort({ createdAt: 1 })
      .limit(10)
      .lean();

    const formattedMessages = history.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Build system prompt
    const systemInstruction = await buildDoubtSystemPrompt({
      student: req.user,
      subject,
      topic,
      classObj,
    });

    // Setup SSE response headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    // Check if query violates academic study boundaries
    if (isNonAcademicQuery(question)) {
      const refusalText = `I am your LearnMate Academic Tutor, and I am only able to help with your school studies, syllabus concepts, and homework for ${subject.name}.\n\nLet's focus on your learning! What academic topic or problem from your ${subject.name} syllabus would you like help with?`;

      res.write(`data: ${JSON.stringify({ meta: { conversationId: conversation._id } })}\n\n`);
      const words = refusalText.split(' ');
      for (const w of words) {
        res.write(`data: ${JSON.stringify({ chunk: w + ' ' })}\n\n`);
        await new Promise((r) => setTimeout(r, 20));
      }

      await AIMessage.create({
        conversationId: conversation._id,
        role: 'model',
        content: refusalText,
        schoolId: req.user.schoolId,
      });

      res.write('data: [DONE]\n\n');
      return res.end();
    }

    const abortController = new AbortController();
    req.on('close', () => {
      abortController.abort();
    });

    let accumulatedText = '';

    const aiRes = await executeAI({
      user: req.user,
      feature: 'ask_doubt_stream',
      prompt: question.trim(),
      systemInstruction,
      operationType: 'stream',
      operationArgs: {
        messages: formattedMessages,
        signal: abortController.signal,
        onChunk: (chunk) => {
          accumulatedText += chunk;
          res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
        },
      },
      subjectId: subject._id,
      topicId: topic?._id || null,
    });

    const finalText = accumulatedText || aiRes.text || '';

    // Save model answer to AIMessage
    const modelMsg = await AIMessage.create({
      conversationId: conversation._id,
      role: 'model',
      content: finalText,
      schoolId: req.user.schoolId,
    });

    res.write(
      `data: ${JSON.stringify({
        done: true,
        conversationId: conversation._id,
        messageId: modelMsg._id,
        title: conversation.title,
      })}\n\n`
    );
    return res.end();
  } catch (err) {
    console.error('streamDoubt error:', err);
    if (!res.headersSent) {
      return res.status(err.status || 500).json({ error: err.friendlyMessage || err.message });
    }
    res.write(`data: ${JSON.stringify({ error: err.friendlyMessage || err.message, done: true })}\n\n`);
    return res.end();
  }
}

/**
 * 2. Get Student's Conversations for a Subject
 */
async function getConversations(req, res) {
  try {
    const { subjectId } = req.query;
    if (!subjectId) {
      return res.status(400).json({ error: 'subjectId query parameter is required' });
    }

    const conversations = await AIConversation.find({
      studentId: req.user._id,
      subjectId,
    })
      .sort({ updatedAt: -1 })
      .populate('topicId', 'name')
      .lean();

    return res.json({ conversations });
  } catch (err) {
    console.error('getConversations error:', err);
    return res.status(500).json({ error: 'Failed to load conversations' });
  }
}

/**
 * 3. Get Messages for a specific Conversation
 */
async function getMessages(req, res) {
  try {
    const { id } = req.params;
    const conversation = await AIConversation.findById(id).lean();
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Allow student owner or teacher/admin to view
    if (req.user.role === 'student' && String(conversation.studentId) !== String(req.user._id)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const messages = await AIMessage.find({ conversationId: id }).sort({ createdAt: 1 }).lean();
    return res.json({ conversation, messages });
  } catch (err) {
    console.error('getMessages error:', err);
    return res.status(500).json({ error: 'Failed to load messages' });
  }
}

/**
 * 4. Save Answer to Personal Notes
 */
async function saveNote(req, res) {
  try {
    const { subjectId, topicId, content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Note content is required' });
    }

    const note = await PersonalNote.create({
      studentId: req.user._id,
      subjectId,
      topicId: topicId || null,
      content: content.trim(),
      source: 'ai',
      schoolId: req.user.schoolId,
    });

    return res.json({ success: true, note });
  } catch (err) {
    console.error('saveNote error:', err);
    return res.status(500).json({ error: 'Failed to save personal note' });
  }
}

/**
 * 5. Thumbs Up / Down Feedback
 */
async function toggleFeedback(req, res) {
  try {
    const { messageId, thumbsUp } = req.body;
    const msg = await AIMessage.findById(messageId);
    if (!msg) {
      return res.status(404).json({ error: 'Message not found' });
    }

    msg.thumbsUp = typeof thumbsUp === 'boolean' ? thumbsUp : null;
    await msg.save();

    return res.json({ success: true, thumbsUp: msg.thumbsUp });
  } catch (err) {
    console.error('toggleFeedback error:', err);
    return res.status(500).json({ error: 'Failed to record feedback' });
  }
}

/**
 * 6. Send to Teacher as a Doubt (Human-to-Human Escalation)
 */
async function escalateToTeacher(req, res) {
  try {
    const { subjectId, question, aiAnswer } = req.body;
    if (!question || !subjectId) {
      return res.status(400).json({ error: 'Question and subjectId are required' });
    }

    const studentId = req.user._id;

    // Verify enrollment and find assigned subject teacher
    const enrollment = await StudentSubject.findOne({ studentId, subjectId });
    if (!enrollment) {
      return res.status(403).json({ error: 'You are not enrolled in this subject' });
    }

    // Find teacher assigned to this class and subject
    const teacherAssignment = await TeacherAssignment.findOne({
      classId: enrollment.classId,
      subjectId,
    });

    if (!teacherAssignment) {
      return res.status(404).json({ error: 'No teacher is currently assigned to this subject.' });
    }

    const teacherId = teacherAssignment.teacherId;

    // Find or create ChatThread between student and teacher for this subject
    let thread = await ChatThread.findOne({
      studentId,
      teacherId,
      subjectId,
    });

    if (!thread) {
      thread = await ChatThread.create({
        studentId,
        teacherId,
        subjectId,
        schoolId: req.user.schoolId,
      });
    }

    // Create the message formatted with doubt and AI answer
    const messageText = `**[Student Doubt Escalation]**\n\n**Question:**\n${question}\n\n**AI Tutor's Guidance:**\n${aiAnswer || 'None'}`;

    const chatMsg = await ChatMessage.create({
      threadId: thread._id,
      senderId: studentId,
      senderRole: 'student',
      text: messageText,
      isDoubt: true,
      resolved: false,
      schoolId: req.user.schoolId,
    });

    thread.lastMessage = messageText.slice(0, 100);
    thread.lastMessageAt = new Date();
    await thread.save();

    return res.json({
      success: true,
      threadId: thread._id,
      messageId: chatMsg._id,
    });
  } catch (err) {
    console.error('escalateToTeacher error:', err);
    return res.status(500).json({ error: 'Failed to escalate doubt to teacher' });
  }
}

/**
 * 7. Teacher view: Student AI Doubt Usage Summary
 */
async function getStudentDoubtSummary(req, res) {
  try {
    const { studentId, subjectId } = req.query;
    if (!studentId || !subjectId) {
      return res.status(400).json({ error: 'studentId and subjectId are required' });
    }

    const conversations = await AIConversation.find({ studentId, subjectId })
      .sort({ updatedAt: -1 })
      .populate('topicId', 'name')
      .lean();

    const conversationIds = conversations.map((c) => c._id);
    const messages = await AIMessage.find({ conversationId: { $in: conversationIds } }).lean();

    const studentQuestions = messages.filter((m) => m.role === 'user');
    const hintsCount = messages.filter((m) => m.role === 'model' && m.content.toLowerCase().includes('hint')).length;

    const topicsSet = new Set();
    conversations.forEach((c) => {
      if (c.topicId?.name) topicsSet.add(c.topicId.name);
    });

    return res.json({
      totalQuestions: studentQuestions.length,
      topicsAsked: Array.from(topicsSet),
      hintsUsed: hintsCount,
      conversations,
    });
  } catch (err) {
    console.error('getStudentDoubtSummary error:', err);
    return res.status(500).json({ error: 'Failed to get doubt summary' });
  }
}

module.exports = {
  streamDoubt,
  getConversations,
  getMessages,
  saveNote,
  toggleFeedback,
  escalateToTeacher,
  getStudentDoubtSummary,
};
