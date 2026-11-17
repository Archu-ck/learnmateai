const { z } = require('zod');
const { executeJSON } = require('../services/ai/aiExecutor');
const GeneratedTestDraft = require('../models/GeneratedTestDraft');
const Question = require('../models/Question');
const Test = require('../models/Test');
const Subject = require('../models/Subject');
const Topic = require('../models/Topic');
const Lesson = require('../models/Lesson');
const Class = require('../models/Class');
const TeacherAssignment = require('../models/TeacherAssignment');
const StudentSubject = require('../models/StudentSubject');
const MasteryRecord = require('../models/MasteryRecord');

// Zod Schema for MCQ Question
const QuestionZodSchema = z.object({
  text: z.string().min(5),
  options: z.array(z.string()).min(4).max(4),
  correctOption: z.enum(['A', 'B', 'C', 'D']),
  explanation: z.string().min(10),
  topic: z.string().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
});

const TestGenerationZodSchema = z.object({
  questions: z.array(QuestionZodSchema).min(1),
});

// Gemini responseSchema for structured JSON
const GeminiMCQSchema = {
  type: 'object',
  properties: {
    questions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          text: { type: 'string', description: 'The question text' },
          options: {
            type: 'array',
            items: { type: 'string' },
            description: 'Exactly 4 plausible choices without option prefix letters (Option A, B, C, D)',
          },
          correctOption: {
            type: 'string',
            enum: ['A', 'B', 'C', 'D'],
            description: 'The letter of the single correct answer',
          },
          explanation: {
            type: 'string',
            description: '2 to 4 sentences explaining why the correct option is right and common mistakes in distractors',
          },
          topic: { type: 'string', description: 'The syllabus topic name' },
          difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] },
        },
        required: ['text', 'options', 'correctOption', 'explanation', 'difficulty'],
      },
    },
  },
  required: ['questions'],
};

/**
 * 1. Teacher: Generate Test with AI
 */
async function generateTestAI(req, res) {
  try {
    const {
      subjectId,
      classId,
      topicIds = [],
      questionCount = 10,
      difficulty = 'medium',
      marksPerQuestion = 1,
      extraInstructions = '',
      sourceText = '',
    } = req.body;

    if (!subjectId || !classId) {
      return res.status(400).json({ error: 'subjectId and classId are required' });
    }

    // Verify teacher is assigned to this class and subject
    if (req.user.role === 'teacher') {
      const assignment = await TeacherAssignment.findOne({
        teacherId: req.user._id,
        subjectId,
        classId,
      });
      if (!assignment) {
        return res.status(403).json({ error: 'You are not assigned to teach this subject in this class.' });
      }
    }

    const subject = await Subject.findById(subjectId);
    const classObj = await Class.findById(classId);
    if (!subject || !classObj) {
      return res.status(404).json({ error: 'Subject or Class not found' });
    }

    // Fetch topics
    let topics = [];
    if (topicIds.length > 0) {
      topics = await Topic.find({ _id: { $in: topicIds }, subjectId });
    } else {
      topics = await Topic.find({ subjectId }).limit(4);
    }
    const topicNames = topics.map((t) => t.name);

    // Fetch published lesson notes for context
    const lessons = await Lesson.find({
      subjectId,
      topicId: { $in: topics.map((t) => t._id) },
      status: 'published',
    })
      .select('title content')
      .lean();

    const lessonContext = lessons
      .map((l) => `Lesson "${l.title}": ${l.content || ''}`)
      .join('\n')
      .slice(0, 2000);

    const safeCount = Math.min(Math.max(parseInt(questionCount, 10) || 10, 5), 30);
    const safeMarks = Number(marksPerQuestion) || 1;

    // Cache key for identical generation requests (5 min TTL)
    const cacheKey = `test_gen_${subjectId}_${classId}_${topicNames.sort().join('_')}_${safeCount}_${difficulty}_${extraInstructions.slice(0, 30)}`;

    const prompt = `Generate exactly ${safeCount} multiple-choice questions for school students in ${classObj.name} (Grade ${classObj.gradeLevel || 8}) studying ${subject.name}.
Selected Chapters to Cover: ${topicNames.join(', ')}.
Target Difficulty: ${difficulty}.
${extraInstructions ? `Teacher's Specific Instructions: "${extraInstructions}"` : ''}
${sourceText ? `Source Text Material to Base Questions On:\n"""\n${sourceText.slice(0, 3000)}\n"""` : ''}
${lessonContext ? `Teacher's Published Lesson Material:\n"""\n${lessonContext}\n"""` : ''}

CRITICAL CHAPTER COVERAGE & ASSESSMENT STANDARDS:
1. Every question MUST be strictly based on the syllabus, core concepts, and lesson notes for the selected chapters: [${topicNames.join(', ')}].
2. Distribute questions evenly across all selected chapters so that every selected chapter has proportional questions.
3. In the output JSON, set the "topic" field of each question to the exact chapter name it covers from the list above.
4. Generate ONLY multiple choice questions with EXACTLY 4 options (Option A, Option B, Option C, Option D).
5. Exactly ONE option must be clearly and unambiguously correct.
6. The remaining 3 options MUST be plausible common student misconceptions, NOT random or silly guesses.
7. DO NOT use "All of the above", "None of the above", or "Both A and B".
8. Every question must be distinct and non-duplicate.
9. The explanation must be 2 to 4 sentences clearly detailing why the correct option is mathematically/conceptually sound, and why distractors are wrong.
10. Write mathematical equations clearly using standard notation.`;

    const aiRes = await executeJSON({
      user: req.user,
      feature: 'generate_test_ai',
      prompt,
      systemInstruction: `You are an expert exam author creating rigorous, curriculum-aligned multiple choice tests for Indian secondary school curricula (CBSE/State Board). Always output valid JSON strictly matching the schema.`,
      schema: GeminiMCQSchema,
      responseSchema: GeminiMCQSchema,
      zodSchema: TestGenerationZodSchema,
      subjectId,
      cacheKey,
    });

    const questionsWithMarks = (aiRes.data?.questions || []).map((q) => ({
      ...q,
      marks: safeMarks,
    }));

    // Create a GeneratedTestDraft
    const draft = await GeneratedTestDraft.create({
      teacherId: req.user._id,
      subjectId,
      classId,
      params: {
        topicIds: topics.map((t) => t._id),
        topicNames,
        questionCount: safeCount,
        difficulty,
        marksPerQuestion: safeMarks,
        extraInstructions,
        sourceText,
      },
      questions: questionsWithMarks,
      status: 'draft',
      schoolId: req.user.schoolId,
    });

    return res.json({
      success: true,
      draftId: draft._id,
      questions: draft.questions,
      totalQuestions: draft.questions.length,
    });
  } catch (err) {
    console.error('generateTestAI error:', err);
    return res.status(err.status || 500).json({ error: err.friendlyMessage || err.message || 'Failed to generate test questions' });
  }
}

/**
 * 2. Teacher: Regenerate a Single Question
 */
async function regenerateSingleQuestion(req, res) {
  try {
    const { draftId, questionIndex, topic, difficulty = 'medium', extraInstructions = '' } = req.body;
    if (!draftId || questionIndex === undefined) {
      return res.status(400).json({ error: 'draftId and questionIndex are required' });
    }

    const draft = await GeneratedTestDraft.findOne({
      _id: draftId,
      teacherId: req.user._id,
    });
    if (!draft) {
      return res.status(404).json({ error: 'Test draft not found' });
    }

    const prompt = `Generate exactly 1 high-quality multiple choice question on the topic "${topic || draft.params?.topicNames?.[0] || 'General'}".
Target difficulty: ${difficulty}.
${extraInstructions ? `Special instruction: "${extraInstructions}"` : ''}

STRICT STANDARDS:
- Exactly 4 plausible choices.
- One unambiguous correctOption ('A', 'B', 'C', or 'D').
- No 'All of the above' or 'None of the above'.
- 2 to 4 sentence explanation.`;

    const aiRes = await executeJSON({
      user: req.user,
      feature: 'regenerate_single_question',
      prompt,
      systemInstruction: 'Expert curriculum test author. Return valid JSON matching schema.',
      schema: GeminiMCQSchema,
      responseSchema: GeminiMCQSchema,
      zodSchema: TestGenerationZodSchema,
      subjectId: draft.subjectId,
    });

    const newQuestion = aiRes.data?.questions?.[0];
    if (!newQuestion) {
      return res.status(500).json({ error: 'Failed to generate replacement question' });
    }

    newQuestion.marks = draft.params?.marksPerQuestion || 1;

    // Replace in draft
    if (draft.questions[questionIndex]) {
      draft.questions[questionIndex] = newQuestion;
      await draft.save();
    }

    return res.json({
      success: true,
      updatedQuestion: newQuestion,
      questions: draft.questions,
    });
  } catch (err) {
    console.error('regenerateSingleQuestion error:', err);
    return res.status(500).json({ error: err.friendlyMessage || err.message || 'Failed to regenerate question' });
  }
}

/**
 * 3. Teacher: Save Draft Edits (inline editing, reordering, manual additions)
 */
async function saveDraftEdits(req, res) {
  try {
    const { draftId, questions } = req.body;
    if (!draftId || !Array.isArray(questions)) {
      return res.status(400).json({ error: 'draftId and questions array are required' });
    }

    const draft = await GeneratedTestDraft.findOne({
      _id: draftId,
      teacherId: req.user._id,
    });
    if (!draft) {
      return res.status(404).json({ error: 'Draft not found' });
    }

    draft.questions = questions;
    await draft.save();

    return res.json({ success: true, draft });
  } catch (err) {
    console.error('saveDraftEdits error:', err);
    return res.status(500).json({ error: 'Failed to save draft edits' });
  }
}

/**
 * 4. Teacher: Save Questions to Question Bank
 */
async function saveToQuestionBank(req, res) {
  try {
    const { draftId } = req.body;
    const draft = await GeneratedTestDraft.findOne({
      _id: draftId,
      teacherId: req.user._id,
    });
    if (!draft) {
      return res.status(404).json({ error: 'Draft not found' });
    }

    const questionsToInsert = draft.questions.map((q) => {
      // Find matching topicId if possible
      return {
        subjectId: draft.subjectId,
        type: 'mcq',
        text: q.text,
        options: q.options,
        answer: q.correctOption,
        explanation: q.explanation,
        marks: q.marks || 1,
        difficulty: q.difficulty || 'medium',
        tags: [q.topic || 'AI Generated'],
        source: 'ai',
        schoolId: req.user.schoolId,
      };
    });

    const inserted = await Question.insertMany(questionsToInsert);
    draft.status = 'saved_to_bank';
    await draft.save();

    return res.json({
      success: true,
      savedCount: inserted.length,
      message: `Saved ${inserted.length} questions into the subject question bank!`,
    });
  } catch (err) {
    console.error('saveToQuestionBank error:', err);
    return res.status(500).json({ error: 'Failed to save questions to bank' });
  }
}

/**
 * 5. Teacher: Publish Test to Students
 */
async function publishTest(req, res) {
  try {
    const {
      draftId,
      title,
      durationMinutes = 30,
      startWindow,
      endWindow,
      maxAttempts = 1,
      shuffleQuestions = true,
      shuffleOptions = true,
      sections = ['A'],
    } = req.body;

    const draft = await GeneratedTestDraft.findOne({
      _id: draftId,
      teacherId: req.user._id,
    });
    if (!draft) {
      return res.status(404).json({ error: 'Draft not found' });
    }

    // 1. Save all questions into Question model
    const questionDocs = [];
    for (const q of draft.questions) {
      const doc = await Question.create({
        subjectId: draft.subjectId,
        type: 'mcq',
        text: q.text,
        options: q.options,
        answer: q.correctOption,
        explanation: q.explanation,
        marks: q.marks || 1,
        difficulty: q.difficulty || 'medium',
        tags: [q.topic || 'AI Test'],
        source: 'ai',
        schoolId: req.user.schoolId,
      });
      questionDocs.push(doc);
    }

    const totalMarks = questionDocs.reduce((acc, q) => acc + (q.marks || 1), 0);

    // 2. Create formal Test
    const newTest = await Test.create({
      title: title || `${draft.params?.topicNames?.[0] || 'Syllabus'} Assessment`,
      subjectId: draft.subjectId,
      classId: draft.classId,
      section: Array.isArray(sections) && sections.length > 0 ? sections[0] : 'all',
      teacherId: req.user._id,
      durationMinutes: Number(durationMinutes) || 30,
      totalMarks,
      startWindow: startWindow ? new Date(startWindow) : new Date(),
      endWindow: endWindow ? new Date(endWindow) : new Date(Date.now() + 7 * 24 * 3600 * 1000),
      attemptLimit: Number(maxAttempts) || 1,
      shuffleQuestions: Boolean(shuffleQuestions),
      questionIds: questionDocs.map((q) => q._id),
      status: 'published',
      schoolId: req.user.schoolId,
    });

    draft.status = 'published';
    draft.publishedTestId = newTest._id;
    await draft.save();

    return res.json({
      success: true,
      test: newTest,
      message: 'Test published successfully and is now active for students!',
    });
  } catch (err) {
    console.error('publishTest error:', err);
    return res.status(500).json({ error: 'Failed to publish test' });
  }
}

/**
 * 6. Student: Practice Quiz (Private, does not affect formal grades)
 */
async function generateStudentPracticeQuiz(req, res) {
  try {
    const { subjectId, topicId, topicIds = [], count = 5, difficulty = 'medium' } = req.body;
    if (!subjectId) {
      return res.status(400).json({ error: 'subjectId is required' });
    }

    // Verify enrollment
    const enrollment = await StudentSubject.findOne({
      studentId: req.user._id,
      subjectId,
    });
    if (!enrollment) {
      return res.status(403).json({ error: 'You are not enrolled in this subject' });
    }

    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({ error: 'Subject not found' });
    }

    // Determine student grade
    let gradeLabel = 'Secondary School';
    if (req.user.classId) {
      const cls = await Class.findById(req.user.classId);
      if (cls) {
        gradeLabel = `${cls.name} (Grade ${cls.gradeLevel || 10})`;
      }
    }

    // Resolve topics/chapters (support multi-chapter selection)
    let topics = [];
    const requestedTopicIds = Array.isArray(topicIds) && topicIds.length > 0
      ? topicIds
      : (topicId ? [topicId] : []);

    if (requestedTopicIds.length > 0) {
      topics = await Topic.find({ _id: { $in: requestedTopicIds }, subjectId });
    }

    // Fallback: If no topic matched or none provided, get all syllabus topics for subject
    if (topics.length === 0) {
      topics = await Topic.find({ subjectId }).sort({ order: 1 }).limit(5);
    }

    const topicNames = topics.map((t) => t.name);
    const displayTopicName = topicNames.length > 0 ? topicNames.join(', ') : 'General Syllabus';

    // Fetch published lesson notes for context across all selected chapters
    const lessons = await Lesson.find({
      subjectId,
      topicId: { $in: topics.map((t) => t._id) },
      status: 'published',
    })
      .select('title content')
      .lean();

    const lessonContext = lessons
      .map((l) => `Lesson "${l.title}": ${l.content || ''}`)
      .join('\n')
      .slice(0, 2000);

    const safeCount = Math.min(Math.max(parseInt(count, 10) || 5, 3), 15);

    const prompt = `Generate a ${safeCount}-question interactive practice quiz for a student in ${gradeLabel} on the subject "${subject.name}".
Selected Chapters to Cover: ${topicNames.join(', ')}.
Target Difficulty: ${difficulty}.
${lessonContext ? `Chapter Study Materials & Published Notes:\n"""\n${lessonContext}\n"""` : ''}

CRITICAL CHAPTER ALIGNMENT INSTRUCTIONS:
1. Every question MUST be strictly grounded in the syllabus and lesson notes for the selected chapters: [${topicNames.join(', ')}].
2. Distribute questions evenly across the selected chapters so that every chosen chapter is assessed.
3. In the output JSON, set the "topic" field of each question to the exact name of the selected chapter it tests.
4. Provide exactly 4 plausible choices per question, a single correctOption ('A'|'B'|'C'|'D'), and clear pedagogical explanations so the student understands the underlying concept immediately.`;

    const aiRes = await executeJSON({
      user: req.user,
      feature: 'practice_quiz',
      prompt,
      systemInstruction: 'Encouraging curriculum tutor. Generate 4-choice questions in strict JSON format.',
      schema: GeminiMCQSchema,
      responseSchema: GeminiMCQSchema,
      zodSchema: TestGenerationZodSchema,
      subjectId,
    });

    return res.json({
      success: true,
      topicName: displayTopicName,
      topicNames,
      questions: aiRes.data?.questions || [],
    });
  } catch (err) {
    console.error('generateStudentPracticeQuiz error:', err);
    return res.status(500).json({ error: err.friendlyMessage || err.message || 'Failed to generate practice quiz' });
  }
}

/**
 * 7. Student: Submit Practice Quiz to lightly update topic mastery
 */
async function submitPracticeQuiz(req, res) {
  try {
    const { subjectId, topicName, topicNames, totalQuestions, correctCount } = req.body;
    if (!subjectId) {
      return res.status(400).json({ error: 'subjectId is required' });
    }

    const studentId = req.user._id;
    let targetTopicNames = [];
    if (Array.isArray(topicNames) && topicNames.length > 0) {
      targetTopicNames = topicNames;
    } else if (topicName) {
      targetTopicNames = topicName.split(',').map((s) => s.trim()).filter(Boolean);
    }

    let topics = [];
    if (targetTopicNames.length > 0) {
      topics = await Topic.find({ name: { $in: targetTopicNames }, subjectId });
    }
    if (topics.length === 0) {
      topics = await Topic.find({ subjectId }).limit(1);
    }

    const percentage = Math.round(((Number(correctCount) || 0) / (Number(totalQuestions) || 1)) * 100);
    const bonus = percentage >= 80 ? 5 : percentage >= 60 ? 3 : 1;
    let updatedMastery = null;

    for (const topic of topics) {
      let record = await MasteryRecord.findOne({ studentId, topicId: topic._id });
      if (!record) {
        record = new MasteryRecord({
          studentId,
          topicId: topic._id,
          subjectId,
          level: 'not_started',
          scorePercentage: 50,
          schoolId: req.user.schoolId,
        });
      }

      record.scorePercentage = Math.min(100, Math.max(0, record.scorePercentage + bonus));
      if (record.scorePercentage >= 85) record.level = 'mastered';
      else if (record.scorePercentage >= 70) record.level = 'proficient';
      else if (record.scorePercentage >= 50) record.level = 'developing';
      else record.level = 'learning';

      await record.save();
      if (!updatedMastery) {
        updatedMastery = {
          topicName: topic.name,
          scorePercentage: record.scorePercentage,
          level: record.level,
        };
      }
    }

    return res.json({
      success: true,
      message: 'Practice quiz completed! Your topic mastery has been updated.',
      updatedMastery,
    });
  } catch (err) {
    console.error('submitPracticeQuiz error:', err);
    return res.status(500).json({ error: 'Failed to record practice quiz results' });
  }
}

module.exports = {
  generateTestAI,
  regenerateSingleQuestion,
  saveDraftEdits,
  saveToQuestionBank,
  publishTest,
  generateStudentPracticeQuiz,
  submitPracticeQuiz,
};
