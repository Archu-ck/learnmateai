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

  // Explicit exceptions: Class 10 academic / social science / history / civics / general educational terms
  // Academic questions about democracy, politics in curriculum, nationalism, etc. must NEVER be blocked!
  const academicTerms = [
    /\b(democracy|democratic|federalism|constitution|parliament|government|election commission|political parties|nationalism|satyagraha|congress session|revolution|civics|panchayat|judiciary|secularism)\b/i,
    /\b(math|algebra|geometry|trigonometry|physics|chemistry|biology|science|history|geography|economics|english|grammar|literature|poem|prose|author|chapter|formula|theorem|equation|solve|calculate|derive|ncert)\b/i,
  ];
  if (academicTerms.some((pattern) => pattern.test(q))) {
    return false;
  }

  const nonAcademicPatterns = [
    /\b(play a game|play game|video game|minecraft|fortnite|roblox|gta|playstation|xbox|nintendo|pubg|free fire|clash royale|valorant|bgmi|call of duty|apex legends)\b/i,
    /\b(favorite movie|favorite actor|favorite actress|favorite singer|celebrity|pop song|kpop|bts|hollywood|bollywood|netflix series|watch movies)\b/i,
    /\b(tell me a joke|tell a joke|crack a joke|make me laugh|funny meme|funny story)\b/i,
    /\b(dating|girlfriend|boyfriend|crush|gossip|are you single|do you love me|marry me|romantic)\b/i,
    /\b(who won the match|cricket score|football score|ipl score|premier league|fifa world cup|virat kohli score|rohit sharma score)\b/i,
    /\b(who should i vote for|which party should i vote for|who is better modi or rahul)\b/i,
  ];
  return nonAcademicPatterns.some((pattern) => pattern.test(q));
}

/**
 * Build dynamic, context-rich system prompt for AI doubt tutor
 */
async function buildDoubtSystemPrompt({ student, subject, topic, classObj }) {
  const studentId = student._id;
  const subjectId = subject?._id;

  // 1. Fetch published lesson notes for this topic (if any)
  let lessonNotesText = '';
  if (topic && subjectId) {
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
        .join('\n\n')
        .slice(0, 1500);
    }
  }

  // 2. Fetch student's weak topics in this subject (score < 65%)
  let weakTopicsList = '';
  if (subjectId) {
    const weakRecords = await MasteryRecord.find({
      studentId,
      subjectId,
      scorePercentage: { $lt: 65 },
    })
      .populate('topicId', 'name')
      .lean();

    weakTopicsList = weakRecords
      .map((r) => r.topicId?.name)
      .filter(Boolean)
      .join(', ');
  }

  // 3. Fetch current active assignments for this subject to enforce AI-help levels
  let assignmentRules = '';
  if (subjectId) {
    const activeAssignments = await Assignment.find({
      subjectId,
      dueDate: { $gte: new Date(Date.now() - 24 * 3600 * 1000) },
    })
      .select('title aiHelpLevel topicId')
      .lean();

    const noHelpAssignments = activeAssignments.filter((a) => a.aiHelpLevel === 'None');
    const hintsOnlyAssignments = activeAssignments.filter((a) => a.aiHelpLevel === 'Hints only');

    if (noHelpAssignments.length > 0) {
      assignmentRules += `\n- The following active assignments have AI-help set to "None": [${noHelpAssignments.map((a) => a.title).join(', ')}]. If the student's question directly asks to solve these exact homework assignments, politely decline solving them outright, remind them that their teacher assigned this for independent practice, and guide them with general conceptual principles instead.`;
    }
    if (hintsOnlyAssignments.length > 0) {
      assignmentRules += `\n- The following active assignments have AI-help set to "Hints only": [${hintsOnlyAssignments.map((a) => a.title).join(', ')}]. Never provide the direct final answer for these; provide conceptual guidance and a similar example with different numbers.`;
    }
  }

  const className = classObj ? `${classObj.name} (Grade ${classObj.gradeLevel || 10})` : 'Grade 10';
  const currentSubjectName = subject?.name || 'Class 10 Studies';

  return `You are VidyaAI, an expert, patient, and highly encouraging Academic Tutor for ${student.name} in ${className}.
Current Academic Workspace: ${currentSubjectName}${topic ? ` (Reference Chapter: ${topic.name})` : ''}
${lessonNotesText ? `Classroom Lesson Reference:\n"""\n${lessonNotesText}\n"""\n` : ''}
${weakTopicsList ? `Student's Revision Focus Areas: ${weakTopicsList}\n` : ''}

CORE PEDAGOGICAL DIRECTIVE (CLASS 10 EXPLANATORY TUTORING):
1. NEVER GIVE RAW / STRAIGHT-UP ANSWERS DIRECTLY:
   - Do NOT just spit out a final number, a one-word answer, or an unexplained equation.
   - You are a caring, highly effective school tutor. Your primary goal is to help the student LEARN and UNDERSTAND how to arrive at the solution.
   - Explain in a step-by-step, pedagogical way calibrated precisely for a Class 10 student (age 14–16, CBSE/board syllabus level).

2. STEP-BY-STEP EXPLANATION BLUEPRINT:
   Whenever a student asks any academic question, doubt, or numerical problem, structure your response as follows:
   - Step 1: Conceptual Foundation: Clearly identify and name the concept, theorem, or rule being used in simple, intuitive terms. (e.g., "In this question, we apply the Quadratic Formula..." or "This question relates to Ohm's Law in Electricity...").
   - Step 2: Formula / Law / Key Rule: State the relevant formula or definition clearly, explaining what each symbol represents.
   - Step 3: Step-by-Step Breakdown: Walk through the solution with clear numbered steps. For each step, explain the reasoning ("Why are we doing this step?").
   - Step 4: Pro-Tip / Common Pitfall: Point out a common mistake students make in Class 10 exams (e.g., sign errors, unit conversion, or confusing similar terms).
   - Step 5: Check for Understanding: Conclude with a warm, encouraging question or small follow-up step to verify if the student grasped it.

3. ANSWER ANY STUDY-RELATED TOPIC OR SUBJECT:
   - You are NOT restricted to a single topic or chapter. You should enthusiastically and comprehensively answer ANY academic or educational question the student asks—across Mathematics, Science (Physics, Chemistry, Biology), English Language & Literature (Prose, Poetry, Supplementary Reader, Grammar, Writing Skills), Social Science (History, Geography, Political Science/Civics, Economics), Hindi, Computer Science, general educational doubts, study techniques, revision plans, and board exam preparation.
   - If the student is in one subject tab (e.g. Mathematics) and asks a question about another academic subject (e.g. Science or History), DO NOT refuse it! Answer it with full educational care and step-by-step Class 10 explanation.

4. STRICT REFUSAL FOR NON-ACADEMIC / NON-STUDY QUESTIONS:
   - You are strictly an academic and educational tutor.
   - YOU MUST REFUSE questions completely unrelated to studies and learning:
     * Video games, gaming tips (Minecraft, Roblox, GTA, PUBG, Fortnite, etc.)
     * Entertainment, movies, pop celebrities, Bollywood/Hollywood gossip, songs, television
     * Dating, personal romance, small talk, chit-chat ("are you single", "tell me a joke")
     * Live sports scores, match updates, betting, fantasy leagues
     * Partisan political campaigning ("who should I vote for", "who is the best politician")
   - For any non-academic query, refuse warmly, firmly, and politely:
     "I am your LearnMate Academic Tutor, and I am here specifically to help you with your school studies, syllabus concepts, and homework. I cannot help with entertainment, gaming, or non-academic topics.

Let's focus on your learning! What academic subject, chapter, or problem would you like to explore together?"
   - Do NOT answer the non-academic query under any circumstances.
${assignmentRules}

5. FORMATTING & NOTATION:
   - Use clean, structured Markdown with bold key terms and bullet points.
   - Format all mathematical equations using standard notation or KaTeX (e.g., \\(ax^2 + bx + c = 0\\), \\(D = b^2 - 4ac\\)).
   - Keep tone warm, patient, encouraging, and pedagogically sound.`;
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
    const studentId = req.user._id;

    let subject = null;
    if (subjectId && mongoose.isValidObjectId(subjectId)) {
      subject = await Subject.findById(subjectId);
    }
    if (!subject) {
      // Fallback to student's first enrolled subject or first subject
      const firstEnrollment = await StudentSubject.findOne({ studentId }).populate('subjectId');
      if (firstEnrollment?.subjectId) {
        subject = firstEnrollment.subjectId;
      } else {
        subject = await Subject.findOne();
      }
    }

    const enrollment = subject
      ? await StudentSubject.findOne({ studentId, subjectId: subject._id }).populate('classId')
      : null;

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

    // If topic wasn't explicitly passed but exists on conversation, inherit it
    if (!topic && conversation?.topicId) {
      topic = await Topic.findById(conversation.topicId);
    }

    if (!conversation) {
      const title = question.trim().slice(0, 45) + (question.trim().length > 45 ? '...' : '');
      conversation = await AIConversation.create({
        studentId,
        subjectId: subject?._id || subjectId,
        topicId: topic?._id || null,
        title,
        schoolId: req.user.schoolId,
      });
    } else if (topic && (!conversation.topicId || conversation.topicId.toString() !== topic._id.toString())) {
      conversation.topicId = topic._id;
      await conversation.save();
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
      const refusalText = `I am your LearnMate Academic Tutor, and I am here specifically to help you with your school studies, syllabus concepts, and homework. I cannot help with entertainment, gaming, or non-academic topics.\n\nLet's focus on your learning! What academic subject, chapter, or problem would you like to explore together?`;

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
