const { z } = require('zod');
const { executeAI, executeJSON } = require('../services/ai/aiExecutor');
const MockAIProvider = require('../services/ai/MockAIProvider');
const AILog = require('../models/AILog');
const AISetting = require('../models/AISetting');
const Subject = require('../models/Subject');
const User = require('../models/User');
const Class = require('../models/Class');
const Assignment = require('../models/Assignment');
const Test = require('../models/Test');
const Grade = require('../models/Grade');
const Attendance = require('../models/Attendance');

// Zod & Gemini Schemas

// 1. Study Plan
const StudyPlanSchema = z.object({
  weeklyGoal: z.string(),
  dailyRoutines: z.array(
    z.object({
      day: z.string(),
      subject: z.string(),
      focusTopic: z.string(),
      durationMinutes: z.number(),
    })
  ),
  examTips: z.array(z.string()),
});

const GeminiStudyPlanSchema = {
  type: 'OBJECT',
  properties: {
    weeklyGoal: { type: 'STRING' },
    dailyRoutines: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          day: { type: 'STRING' },
          subject: { type: 'STRING' },
          focusTopic: { type: 'STRING' },
          durationMinutes: { type: 'INTEGER' },
        },
        required: ['day', 'subject', 'focusTopic', 'durationMinutes'],
      },
    },
    examTips: {
      type: 'ARRAY',
      items: { type: 'STRING' },
    },
  },
  required: ['weeklyGoal', 'dailyRoutines', 'examTips'],
};

// 2. Explain Mistake
const ExplainMistakeSchema = z.object({
  whyWrong: z.string(),
  keyRule: z.string(),
});

const GeminiExplainMistakeSchema = {
  type: 'OBJECT',
  properties: {
    whyWrong: { type: 'STRING' },
    keyRule: { type: 'STRING' },
  },
  required: ['whyWrong', 'keyRule'],
};

// 3. Summarize Lesson
const SummarizeLessonSchema = z.object({
  summary: z.string(),
  keyPoints: z.array(z.string()),
  discussionQuestion: z.string(),
});

const GeminiSummarizeLessonSchema = {
  type: 'OBJECT',
  properties: {
    summary: { type: 'STRING' },
    keyPoints: { type: 'ARRAY', items: { type: 'STRING' } },
    discussionQuestion: { type: 'STRING' },
  },
  required: ['summary', 'keyPoints', 'discussionQuestion'],
};

// 4. Draft Assignment
const DraftAssignmentSchema = z.object({
  title: z.string(),
  description: z.string(),
  estimatedMinutes: z.number(),
  totalMarks: z.number(),
  rubric: z.array(z.object({ criterion: z.string(), maxMarks: z.number() })),
  aiHelpLevel: z.string(),
});

const GeminiDraftAssignmentSchema = {
  type: 'OBJECT',
  properties: {
    title: { type: 'STRING' },
    description: { type: 'STRING' },
    estimatedMinutes: { type: 'INTEGER' },
    totalMarks: { type: 'INTEGER' },
    rubric: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          criterion: { type: 'STRING' },
          maxMarks: { type: 'INTEGER' },
        },
        required: ['criterion', 'maxMarks'],
      },
    },
    aiHelpLevel: { type: 'STRING' },
  },
  required: ['title', 'description', 'estimatedMinutes', 'totalMarks', 'rubric', 'aiHelpLevel'],
};

// 5. Estimate Effort
const EstimateEffortSchema = z.object({
  estimatedMinutes: z.number(),
  recommendedDailyPace: z.string(),
  rationale: z.string(),
});

const GeminiEstimateEffortSchema = {
  type: 'OBJECT',
  properties: {
    estimatedMinutes: { type: 'INTEGER' },
    recommendedDailyPace: { type: 'STRING' },
    rationale: { type: 'STRING' },
  },
  required: ['estimatedMinutes', 'recommendedDailyPace', 'rationale'],
};

// 6. Suggest Feedback
const SuggestFeedbackSchema = z.object({
  feedback: z.string(),
  strengths: z.string(),
  improvementAreas: z.string(),
});

const GeminiSuggestFeedbackSchema = {
  type: 'OBJECT',
  properties: {
    feedback: { type: 'STRING' },
    strengths: { type: 'STRING' },
    improvementAreas: { type: 'STRING' },
  },
  required: ['feedback', 'strengths', 'improvementAreas'],
};

// 7. Class Insights
const ClassInsightsSchema = z.object({
  strengths: z.array(z.string()),
  struggleAreas: z.array(z.string()),
  recommendedActions: z.array(z.string()),
});

const GeminiClassInsightsSchema = {
  type: 'OBJECT',
  properties: {
    strengths: { type: 'ARRAY', items: { type: 'STRING' } },
    struggleAreas: { type: 'ARRAY', items: { type: 'STRING' } },
    recommendedActions: { type: 'ARRAY', items: { type: 'STRING' } },
  },
  required: ['strengths', 'struggleAreas', 'recommendedActions'],
};

// Controllers

// 1. Student: Ask Doubt (Compatibility Endpoint)
async function handleAskDoubt(req, res) {
  try {
    const { question, subjectId } = req.body;
    let subjectName = 'General Studies';
    if (subjectId) {
      const sub = await Subject.findById(subjectId).lean();
      if (sub) subjectName = sub.name;
    }

    const prompt = `Student asked a doubt in ${subjectName}: "${question}". Explain simply with clear examples.`;
    const aiRes = await executeAI({
      user: req.user,
      feature: 'ask_doubt',
      prompt,
      systemInstruction: `Empathetic secondary school teacher for ${subjectName}.`,
      subjectId,
    });

    return res.json({
      answer: aiRes.text,
      steps: ['Analyze the question', 'Apply core principle', 'Conclude with clarity'],
    });
  } catch (err) {
    console.error('handleAskDoubt error:', err);
    return res.status(500).json({ error: err.friendlyMessage || 'Failed to process AI doubt query' });
  }
}

// 2. Student: Practice Quiz (Legacy handler)
async function handlePracticeQuiz(req, res) {
  try {
    const { topicName, count = 5, subjectId } = req.body;
    const aiRes = await MockAIProvider.generatePracticeQuiz({ topicName, count });
    return res.json(aiRes);
  } catch (err) {
    console.error('handlePracticeQuiz error:', err);
    return res.status(500).json({ error: 'Failed to generate practice quiz' });
  }
}

// 3. Student: Study Plan Generator
async function handleGenerateStudyPlan(req, res) {
  try {
    const { targetExam = 'Upcoming Term Finals', dailyHours = 2 } = req.body;

    const prompt = `Create a realistic weekly study routine for a secondary school student preparing for "${targetExam}".
Target daily hours: ${dailyHours} hours.
Include balanced routines for Monday through Friday, focusing on core subjects (Mathematics, Science, English, Social Studies).
Include 3 practical exam study tips.`;

    const aiRes = await executeJSON({
      user: req.user,
      feature: 'generate_study_plan',
      prompt,
      systemInstruction: 'Organized academic coach designing sustainable study schedules.',
      schema: GeminiStudyPlanSchema,
      responseSchema: GeminiStudyPlanSchema,
      zodSchema: StudyPlanSchema,
    });

    const blocks = (aiRes.data?.dailyRoutines || []).map((r) => ({
      day: r.day,
      startTime: '17:00',
      endTime: '18:30',
      title: `${r.subject}: ${r.focusTopic}`,
      subjectName: r.subject,
      type: 'study',
    }));

    return res.json({
      ...aiRes.data,
      blocks,
    });
  } catch (err) {
    console.error('handleGenerateStudyPlan error:', err);
    return res.status(500).json({ error: err.friendlyMessage || 'Failed to generate AI study plan' });
  }
}

// 4. Student: Explain Mistake
async function handleExplainMistake(req, res) {
  try {
    const { questionText, studentAnswer, correctAnswer, topicName = 'General' } = req.body;

    const prompt = `Topic: "${topicName}"
Question: "${questionText}"
Student Answer: "${studentAnswer || 'Unanswered'}"
Correct Answer: "${correctAnswer}"

Diagnose the student's exact misconception without sounding harsh.
Provide:
1. whyWrong: A 2-sentence pedagogical diagnosis of why their chosen answer is incorrect or how the error commonly occurs.
2. keyRule: A single golden rule or memory formula to prevent this mistake next time.`;

    const aiRes = await executeJSON({
      user: req.user,
      feature: 'explain_mistake',
      prompt,
      systemInstruction: 'Supportive pedagogical tutor diagnosing student errors.',
      schema: GeminiExplainMistakeSchema,
      responseSchema: GeminiExplainMistakeSchema,
      zodSchema: ExplainMistakeSchema,
    });

    return res.json(aiRes.data);
  } catch (err) {
    console.error('handleExplainMistake error:', err);
    return res.status(500).json({ error: err.friendlyMessage || 'Failed to explain mistake' });
  }
}

// 5. Student/Teacher: Summarize Lesson
async function handleSummarizeLesson(req, res) {
  try {
    const { title, content, subjectId } = req.body;

    const prompt = `Lesson Title: "${title}"
Content:
"""
${content || 'Lesson content.'}
"""

Summarize this lesson for a Grade 8 student.
Provide:
1. summary: A clean 3-4 sentence overview of the core concept.
2. keyPoints: 3 to 5 vital takeaway bullet points.
3. discussionQuestion: 1 thought-provoking review question.`;

    const aiRes = await executeJSON({
      user: req.user,
      feature: 'summarize_lesson',
      prompt,
      systemInstruction: 'Expert curriculum summarizer creating student revision notes.',
      schema: GeminiSummarizeLessonSchema,
      responseSchema: GeminiSummarizeLessonSchema,
      zodSchema: SummarizeLessonSchema,
      subjectId,
    });

    return res.json(aiRes.data);
  } catch (err) {
    console.error('handleSummarizeLesson error:', err);
    return res.status(500).json({ error: err.friendlyMessage || 'Failed to summarize lesson' });
  }
}

// 6. Teacher: Generate Test (Legacy)
async function handleGenerateTest(req, res) {
  try {
    const { topic, difficulty, count } = req.body;
    const aiRes = await MockAIProvider.generateTest({ topic, difficulty, count });
    return res.json(aiRes);
  } catch (err) {
    console.error('handleGenerateTest error:', err);
    return res.status(500).json({ error: 'Failed to generate AI test' });
  }
}

// 7. Teacher: Draft Assignment
async function handleDraftAssignment(req, res) {
  try {
    const { topic = 'General Concept', level = 'Standard' } = req.body;

    const prompt = `Draft a structured assignment for Grade 8 students on "${topic}".
Level: ${level}.
Provide:
- title: engaging assignment title
- description: clear student instructions
- estimatedMinutes: realistic time between 20 and 60 minutes
- totalMarks: between 20 and 50
- rubric: 2-3 grading criteria with maxMarks
- aiHelpLevel: "Hints only"`;

    const aiRes = await executeJSON({
      user: req.user,
      feature: 'draft_assignment',
      prompt,
      systemInstruction: 'Curriculum designer drafting homework assignments with grading rubrics.',
      schema: GeminiDraftAssignmentSchema,
      responseSchema: GeminiDraftAssignmentSchema,
      zodSchema: DraftAssignmentSchema,
    });

    return res.json(aiRes.data);
  } catch (err) {
    console.error('handleDraftAssignment error:', err);
    return res.status(500).json({ error: err.friendlyMessage || 'Failed to draft assignment' });
  }
}

// 8. Teacher: Estimate Effort
async function handleEstimateEffort(req, res) {
  try {
    const { title, description } = req.body;

    const prompt = `Estimate the realistic student effort required for an assignment titled "${title}".
Description: "${description}"

Provide:
- estimatedMinutes: integer between 15 and 90
- recommendedDailyPace: suggested pacing (e.g., "15 mins/day over 3 days")
- rationale: brief 1-2 sentence justification`;

    const aiRes = await executeJSON({
      user: req.user,
      feature: 'estimate_effort',
      prompt,
      systemInstruction: 'Educational workload analyst.',
      schema: GeminiEstimateEffortSchema,
      responseSchema: GeminiEstimateEffortSchema,
      zodSchema: EstimateEffortSchema,
    });

    return res.json(aiRes.data);
  } catch (err) {
    console.error('handleEstimateEffort error:', err);
    return res.status(500).json({ error: err.friendlyMessage || 'Failed to estimate assignment effort' });
  }
}

// 9. Teacher: Suggest Feedback
async function handleSuggestFeedback(req, res) {
  try {
    const { marksAwarded, totalMarks } = req.body;
    const percentage = Math.round(((Number(marksAwarded) || 0) / (Number(totalMarks) || 1)) * 100);

    const prompt = `Generate constructive teacher feedback for a student who scored ${marksAwarded}/${totalMarks} (${percentage}%).
Provide:
- feedback: a warm, encouraging paragraph highlighting positive effort and advising next steps
- strengths: key demonstrated strength
- improvementAreas: one specific skill to practice`;

    const aiRes = await executeJSON({
      user: req.user,
      feature: 'suggest_feedback',
      prompt,
      systemInstruction: 'Compassionate school teacher providing growth-oriented formative feedback.',
      schema: GeminiSuggestFeedbackSchema,
      responseSchema: GeminiSuggestFeedbackSchema,
      zodSchema: SuggestFeedbackSchema,
    });

    return res.json(aiRes.data);
  } catch (err) {
    console.error('handleSuggestFeedback error:', err);
    return res.status(500).json({ error: err.friendlyMessage || 'Failed to suggest feedback' });
  }
}

// 10. Teacher: Class Insights
async function handleClassInsights(req, res) {
  try {
    const { className, subjectName } = req.body;

    const prompt = `Generate pedagogical class insights for ${className} - ${subjectName}.
Provide:
- strengths: 2-3 areas where the class is excelling
- struggleAreas: 2 common conceptual bottlenecks
- recommendedActions: 3 targeted classroom interventions for the teacher`;

    const aiRes = await executeJSON({
      user: req.user,
      feature: 'class_insights',
      prompt,
      systemInstruction: 'Senior academic mentor offering actionable teaching strategies.',
      schema: GeminiClassInsightsSchema,
      responseSchema: GeminiClassInsightsSchema,
      zodSchema: ClassInsightsSchema,
    });

    return res.json(aiRes.data);
  } catch (err) {
    console.error('handleClassInsights error:', err);
    return res.status(500).json({ error: err.friendlyMessage || 'Failed to generate class insights' });
  }
}

// 11. Admin: School Stats Q&A
async function handleAdminStatsQA(req, res) {
  try {
    const { question } = req.body;
    const schoolId = req.user.schoolId;

    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'Question is required' });
    }

    // Compute live metrics from MongoDB
    const [totalStudents, totalTeachers, totalClasses, totalSubjects, totalAssignments, totalTests, allGrades] =
      await Promise.all([
        User.countDocuments({ role: 'student', schoolId }),
        User.countDocuments({ role: 'teacher', schoolId }),
        Class.countDocuments({ schoolId }),
        Subject.countDocuments({ schoolId }),
        Assignment.countDocuments({ schoolId }),
        Test.countDocuments({ schoolId }),
        Grade.find({ schoolId, published: true }).select('percentage').lean(),
      ]);

    const schoolAvg =
      allGrades.length > 0
        ? Math.round(allGrades.reduce((sum, g) => sum + (g.percentage || 0), 0) / allGrades.length)
        : 76;

    const metricsSummary = {
      totalStudents,
      totalTeachers,
      totalClasses,
      totalSubjects,
      totalAssignments,
      totalTests,
      schoolWideGradeAverage: `${schoolAvg}%`,
      totalEvaluationsRecorded: allGrades.length,
    };

    const prompt = `Verified Institution Database Metrics:
${JSON.stringify(metricsSummary, null, 2)}

Administrator Question: "${question}"

Provide a direct, factual answer addressing the question using only the verified school metrics. Highlight all numbers in bold markdown. If the question cannot be answered from the metrics, politely indicate what data is available.`;

    const aiRes = await executeAI({
      user: req.user,
      feature: 'admin_stats_qa',
      prompt,
      systemInstruction: 'Executive school analytics advisor answering administrative questions accurately.',
    });

    return res.json({
      question,
      answer: aiRes.text,
      metrics: metricsSummary,
    });
  } catch (err) {
    console.error('handleAdminStatsQA error:', err);
    return res.status(500).json({ error: err.friendlyMessage || 'Failed to answer stats query' });
  }
}

// 12. Admin: Get AI Logs
async function getAILogs(req, res) {
  try {
    const schoolId = req.user.schoolId;
    const logs = await AILog.find({ schoolId })
      .populate('userId', 'name email role')
      .populate('subjectId', 'name code')
      .sort({ timestamp: -1 })
      .limit(100)
      .lean();

    return res.json({ logs });
  } catch (err) {
    console.error('getAILogs error:', err);
    return res.status(500).json({ error: 'Failed to retrieve AI logs' });
  }
}

// 13. Admin: Get AI Settings
async function getAISettings(req, res) {
  try {
    const schoolId = req.user.schoolId;
    let settings = await AISetting.findOne({ schoolId });
    if (!settings) {
      settings = await AISetting.create({ schoolId });
    }
    return res.json({ settings });
  } catch (err) {
    console.error('getAISettings error:', err);
    return res.status(500).json({ error: 'Failed to retrieve AI settings' });
  }
}

// 14. Admin: Update AI Settings
async function updateAISettings(req, res) {
  try {
    const schoolId = req.user.schoolId;
    const { dailyLimitPerStudent, dailyLimitPerTeacher, chatHoursEnabled, chatStartTime, chatEndTime } = req.body;

    const settings = await AISetting.findOneAndUpdate(
      { schoolId },
      {
        ...(dailyLimitPerStudent !== undefined && { dailyLimitPerStudent: Number(dailyLimitPerStudent) }),
        ...(dailyLimitPerTeacher !== undefined && { dailyLimitPerTeacher: Number(dailyLimitPerTeacher) }),
        ...(chatHoursEnabled !== undefined && { chatHoursEnabled: Boolean(chatHoursEnabled) }),
        ...(chatStartTime && { chatStartTime }),
        ...(chatEndTime && { chatEndTime }),
      },
      { upsert: true, new: true }
    );

    return res.json({ success: true, settings });
  } catch (err) {
    console.error('updateAISettings error:', err);
    return res.status(500).json({ error: 'Failed to update AI settings' });
  }
}

module.exports = {
  handleAskDoubt,
  handlePracticeQuiz,
  handleGenerateStudyPlan,
  handleExplainMistake,
  handleSummarizeLesson,
  handleGenerateTest,
  handleDraftAssignment,
  handleEstimateEffort,
  handleSuggestFeedback,
  handleClassInsights,
  handleAdminStatsQA,
  getAILogs,
  getAISettings,
  updateAISettings,
};
