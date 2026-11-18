const mongoose = require('mongoose');
const TeacherAssignment = require('../models/TeacherAssignment');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const User = require('../models/User');
const StudentSubject = require('../models/StudentSubject');
const Topic = require('../models/Topic');
const Lesson = require('../models/Lesson');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Test = require('../models/Test');
const Question = require('../models/Question');
const TestAttempt = require('../models/TestAttempt');
const Grade = require('../models/Grade');
const Attendance = require('../models/Attendance');
const TimetableEntry = require('../models/TimetableEntry');
const ChatThread = require('../models/ChatThread');
const ChatMessage = require('../models/ChatMessage');
const Announcement = require('../models/Announcement');
const { z } = require('zod');
const { executeJSON } = require('../services/ai/aiExecutor');

const SmartAssignmentEstimateSchema = z.object({
  estimatedMinutes: z.number(),
  difficultyLevel: z.string(),
  readingMinutes: z.number(),
  solvingMinutes: z.number(),
  reviewMinutes: z.number(),
  rationale: z.string(),
  pacingAdvice: z.string(),
  isTooLarge: z.boolean(),
  largeWarning: z.string().optional(),
  splitSuggestion: z.string().optional(),
  recommendedParts: z
    .array(
      z.object({
        partNumber: z.number(),
        title: z.string(),
        scope: z.string(),
        estimatedMinutes: z.number(),
      })
    )
    .optional(),
});

const GeminiSmartAssignmentEstimateSchema = {
  type: 'OBJECT',
  properties: {
    estimatedMinutes: { type: 'INTEGER' },
    difficultyLevel: { type: 'STRING' },
    readingMinutes: { type: 'INTEGER' },
    solvingMinutes: { type: 'INTEGER' },
    reviewMinutes: { type: 'INTEGER' },
    rationale: { type: 'STRING' },
    pacingAdvice: { type: 'STRING' },
    isTooLarge: { type: 'BOOLEAN' },
    largeWarning: { type: 'STRING' },
    splitSuggestion: { type: 'STRING' },
    recommendedParts: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          partNumber: { type: 'INTEGER' },
          title: { type: 'STRING' },
          scope: { type: 'STRING' },
          estimatedMinutes: { type: 'INTEGER' },
        },
        required: ['partNumber', 'title', 'scope', 'estimatedMinutes'],
      },
    },
  },
  required: [
    'estimatedMinutes',
    'difficultyLevel',
    'readingMinutes',
    'solvingMinutes',
    'reviewMinutes',
    'rationale',
    'pacingAdvice',
    'isTooLarge',
  ],
};

// 1. My Classes
async function getMyClasses(req, res) {
  try {
    const teacher = req.user;
    const schoolId = teacher.schoolId;

    const assignments = await TeacherAssignment.find({
      teacherId: teacher._id,
      schoolId,
    })
      .populate('classId', 'name sections')
      .populate('subjectId', 'name code isElective')
      .lean();

    const classesList = [];

    for (const a of assignments) {
      if (!a.classId || !a.subjectId) continue;

      // Find enrolled students for this class, section, subject
      const studentSubjects = await StudentSubject.find({
        classId: a.classId._id,
        subjectId: a.subjectId._id,
        schoolId,
      }).lean();

      const enrolledStudentIds = studentSubjects.map((s) => s.studentId);
      const studentCount = await User.countDocuments({
        _id: { $in: enrolledStudentIds },
        sectionId: a.section,
        schoolId,
      });

      // Average grade
      const grades = await Grade.find({
        classId: a.classId._id,
        subjectId: a.subjectId._id,
        published: true,
        schoolId,
      }).lean();

      let averageGrade = 78;
      if (grades.length > 0) {
        averageGrade = Math.round(grades.reduce((sum, g) => sum + g.percentage, 0) / grades.length);
      }

      // Completion rate
      const allClassAssignments = await Assignment.find({
        classId: a.classId._id,
        section: a.section,
        subjectId: a.subjectId._id,
        status: 'published',
        schoolId,
      }).select('_id');

      const expectedSubmissions = allClassAssignments.length * (studentCount || 1);
      const actualSubmissions = await Submission.countDocuments({
        assignmentId: { $in: allClassAssignments.map((ca) => ca._id) },
        status: { $in: ['submitted', 'graded'] },
        schoolId,
      });

      const completionRate = expectedSubmissions > 0
        ? Math.min(100, Math.round((actualSubmissions / expectedSubmissions) * 100))
        : 85;

      classesList.push({
        id: a._id,
        classId: a.classId._id,
        className: a.classId.name,
        section: a.section,
        subjectId: a.subjectId._id,
        subjectName: a.subjectId.name,
        subjectCode: a.subjectId.code,
        isClassTeacher: a.isClassTeacher,
        studentCount,
        averageGrade,
        completionRate,
      });
    }

    return res.json({ classes: classesList });
  } catch (err) {
    console.error('getMyClasses error:', err);
    return res.status(500).json({ error: 'Failed to retrieve teacher classes' });
  }
}

// 2. Class Workspace (8 Tabs)
async function getClassWorkspace(req, res) {
  try {
    const teacher = req.user;
    const { id } = req.params;
    const schoolId = teacher.schoolId;

    const assignment = await TeacherAssignment.findOne({
      _id: id,
      teacherId: teacher._id,
      schoolId,
    })
      .populate('classId')
      .populate('subjectId')
      .lean();

    if (!assignment) {
      return res.status(403).json({ error: 'Access denied: You are not assigned to this class-section-subject.' });
    }

    const { classId, section, subjectId } = assignment;

    // 1. Enrolled Students
    const studentSubjects = await StudentSubject.find({
      classId: classId._id,
      subjectId: subjectId._id,
      schoolId,
    }).lean();

    const enrolledStudentIds = studentSubjects.map((s) => s.studentId);
    const students = await User.find({
      _id: { $in: enrolledStudentIds },
      sectionId: section,
      schoolId,
    })
      .select('name email rollNumber admissionNumber')
      .sort({ rollNumber: 1, name: 1 })
      .lean();

    // Calculate student statuses (On Track, Needs Attention, At Risk)
    const studentListWithStatus = [];
    for (const st of students) {
      const studentGrades = await Grade.find({
        studentId: st._id,
        subjectId: subjectId._id,
        published: true,
        schoolId,
      }).lean();

      const avg = studentGrades.length > 0
        ? Math.round(studentGrades.reduce((a, b) => a + b.percentage, 0) / studentGrades.length)
        : 75;

      let status = 'On Track';
      if (avg < 55) status = 'At Risk';
      else if (avg < 72) status = 'Needs Attention';

      studentListWithStatus.push({
        id: st._id,
        name: st.name,
        email: st.email,
        rollNumber: st.rollNumber || '-',
        averageGrade: avg,
        status,
        submissionCount: studentGrades.length,
      });
    }

    // 2. Assignments for this class
    const assignments = await Assignment.find({
      classId: classId._id,
      section,
      subjectId: subjectId._id,
      schoolId,
    })
      .sort({ createdAt: -1 })
      .lean();

    const assignmentsWithStats = [];
    for (const a of assignments) {
      const submissions = await Submission.find({ assignmentId: a._id, schoolId }).lean();
      const submitted = submissions.filter((s) => s.status === 'submitted').length;
      const graded = submissions.filter((s) => s.status === 'graded').length;
      const pending = Math.max(0, students.length - (submitted + graded));

      assignmentsWithStats.push({
        ...a,
        id: a._id,
        stats: { submitted, graded, pending, totalStudents: students.length },
      });
    }

    // 3. Tests
    const tests = await Test.find({
      classId: classId._id,
      section,
      subjectId: subjectId._id,
      schoolId,
    })
      .sort({ createdAt: -1 })
      .lean();

    // 4. Lessons
    const lessons = await Lesson.find({
      subjectId: subjectId._id,
      schoolId,
    })
      .populate('topicId', 'name')
      .sort({ order: 1 })
      .lean();

    // 5. Gradebook Data (students x assessments matrix)
    const gradeRecords = await Grade.find({
      classId: classId._id,
      subjectId: subjectId._id,
      schoolId,
    }).lean();

    // 6. Topics for dropdowns
    const topics = await Topic.find({
      subjectId: subjectId._id,
      classId: classId._id,
      schoolId,
    })
      .sort({ order: 1 })
      .lean();

    return res.json({
      workspace: {
        id: assignment._id,
        className: classId.name,
        section,
        classId: classId._id,
        subjectId: subjectId._id,
        subjectName: subjectId.name,
        subjectCode: subjectId.code,
        isElective: !!subjectId.isElective,
      },
      students: studentListWithStatus,
      assignments: assignmentsWithStats,
      tests: tests.map((t) => ({ ...t, id: t._id })),
      lessons: lessons.map((l) => ({ ...l, id: l._id })),
      topics: topics.map((tp) => ({ id: tp._id, name: tp.name })),
      gradeRecords,
    });
  } catch (err) {
    console.error('getClassWorkspace error:', err);
    return res.status(500).json({ error: 'Failed to retrieve class workspace' });
  }
}

// 3. Create Assignment with Class Workload Check
async function createTeacherAssignment(req, res) {
  try {
    const teacher = req.user;
    const schoolId = teacher.schoolId;
    const {
      title,
      classId,
      section,
      subjectId,
      topicId,
      description,
      attachments,
      dueDate,
      totalMarks,
      estimatedMinutes,
      estimatedEffortReasoning,
      aiHelpLevel,
      latePolicy,
      resubmissionAllowed,
      rubric,
      status,
    } = req.body;

    if (!title || !classId || !section || !subjectId || !dueDate) {
      return res.status(400).json({
        error: 'Missing required assignment fields (title, class, section, subject, or due date)',
      });
    }

    const isValidTopic = topicId && mongoose.Types.ObjectId.isValid(topicId);

    const newAssignment = await Assignment.create({
      title: title.trim(),
      classId,
      section: section.trim().toUpperCase(),
      subjectId,
      topicId: isValidTopic ? topicId : null,
      teacherId: teacher._id,
      description: description || '',
      attachments: attachments || [],
      dueDate: new Date(dueDate),
      totalMarks: Number(totalMarks) || 20,
      estimatedMinutes: Number(estimatedMinutes) || 45,
      estimatedEffortReasoning: estimatedEffortReasoning || '',
      aiHelpLevel: aiHelpLevel || 'Hints only',
      latePolicy: latePolicy || 'allowed',
      resubmissionAllowed: resubmissionAllowed !== false,
      rubric: rubric || [],
      status: status || 'published',
      schoolId,
    });

    return res.status(201).json({
      message: 'Assignment created successfully',
      assignment: newAssignment,
    });
  } catch (err) {
    console.error('createTeacherAssignment error:', err);
    return res.status(500).json({ error: err.message || 'Failed to create assignment' });
  }
}

// 4. Workload Check Endpoint for Selected Date
async function getWorkloadCheck(req, res) {
  try {
    const { classId, section, date } = req.query;
    const schoolId = req.user.schoolId;

    if (!classId || !date) {
      return res.status(400).json({ error: 'classId and date are required' });
    }

    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    const assignmentsOnDate = await Assignment.find({
      classId,
      dueDate: { $gte: startOfDay, $lte: endOfDay },
      schoolId,
    })
      .populate('subjectId', 'name')
      .lean();

    const totalMinutes = assignmentsOnDate.reduce((sum, a) => sum + (a.estimatedMinutes || 45), 0);
    const totalHours = Number((totalMinutes / 60).toFixed(1));
    const isOverloaded = totalHours > 2.5;

    return res.json({
      date,
      totalHours,
      assignmentsCount: assignmentsOnDate.length,
      isOverloaded,
      assignments: assignmentsOnDate.map((a) => ({
        id: a._id,
        title: a.title,
        subjectName: a.subjectId?.name || 'Subject',
        estimatedMinutes: a.estimatedMinutes,
      })),
    });
  } catch (err) {
    console.error('getWorkloadCheck error:', err);
    return res.status(500).json({ error: 'Failed to check workload' });
  }
}

// 5. Get Submissions for Assignment
async function getAssignmentSubmissions(req, res) {
  try {
    const teacher = req.user;
    const { id } = req.params;
    const schoolId = teacher.schoolId;

    const assignment = await Assignment.findOne({ _id: id, schoolId }).lean();
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

    // Enrolled students
    const studentSubjects = await StudentSubject.find({
      classId: assignment.classId,
      subjectId: assignment.subjectId,
      schoolId,
    }).lean();

    const studentIds = studentSubjects.map((s) => s.studentId);
    const students = await User.find({
      _id: { $in: studentIds },
      sectionId: assignment.section,
      schoolId,
    })
      .select('name email rollNumber')
      .sort({ rollNumber: 1, name: 1 })
      .lean();

    const submissions = await Submission.find({ assignmentId: id, schoolId }).lean();
    const subMap = new Map(submissions.map((s) => [s.studentId.toString(), s]));

    const submissionsTable = students.map((st) => {
      const sub = subMap.get(st._id.toString());
      return {
        studentId: st._id,
        studentName: st.name,
        rollNumber: st.rollNumber || '-',
        submissionId: sub ? sub._id : null,
        status: sub ? sub.status : 'pending',
        submittedAt: sub ? sub.submittedAt : null,
        marksAwarded: sub ? sub.marksAwarded : null,
        feedback: sub ? sub.feedback : '',
        textContent: sub ? sub.textContent : '',
        files: sub ? sub.files : [],
        rubricScores: sub ? sub.rubricScores : [],
      };
    });

    return res.json({
      assignment: {
        id: assignment._id,
        title: assignment.title,
        totalMarks: assignment.totalMarks,
        dueDate: assignment.dueDate,
        rubric: assignment.rubric || [],
      },
      submissions: submissionsTable,
    });
  } catch (err) {
    console.error('getAssignmentSubmissions error:', err);
    return res.status(500).json({ error: 'Failed to retrieve submissions' });
  }
}

// 6. Grade Submission
async function gradeStudentSubmission(req, res) {
  try {
    const teacher = req.user;
    const { id } = req.params; // submissionId or assignmentId + studentId
    const { marksAwarded, feedback, rubricScores, returnForRevision } = req.body;
    const schoolId = teacher.schoolId;

    let submission = await Submission.findOne({ _id: id, schoolId });
    if (!submission) {
      // Check if ID is an assignment ID with studentId passed in body
      if (req.body.studentId) {
        submission = await Submission.findOneAndUpdate(
          { assignmentId: id, studentId: req.body.studentId, schoolId },
          {
            assignmentId: id,
            studentId: req.body.studentId,
            marksAwarded,
            feedback,
            rubricScores: rubricScores || [],
            status: returnForRevision ? 'revision_requested' : 'graded',
            gradedAt: new Date(),
            gradedBy: teacher._id,
            schoolId,
          },
          { upsert: true, new: true }
        );
      } else {
        return res.status(404).json({ error: 'Submission not found' });
      }
    } else {
      submission.marksAwarded = marksAwarded;
      submission.feedback = feedback || '';
      submission.rubricScores = rubricScores || [];
      submission.status = returnForRevision ? 'revision_requested' : 'graded';
      submission.gradedAt = new Date();
      submission.gradedBy = teacher._id;
      await submission.save();
    }

    // Save/update in Grade collection
    const assignment = await Assignment.findById(submission.assignmentId);
    if (assignment && !returnForRevision) {
      await Grade.findOneAndUpdate(
        { studentId: submission.studentId, assessmentId: assignment._id, schoolId },
        {
          studentId: submission.studentId,
          assessmentType: 'assignment',
          assessmentId: assignment._id,
          assessmentTitle: assignment.title,
          subjectId: assignment.subjectId,
          classId: assignment.classId,
          marksObtained: marksAwarded,
          totalMarks: assignment.totalMarks,
          percentage: Math.round(((marksAwarded || 0) / (assignment.totalMarks || 1)) * 100),
          published: true,
          schoolId,
        },
        { upsert: true, new: true }
      );
    }

    return res.json({ message: 'Submission graded successfully', submission });
  } catch (err) {
    console.error('gradeStudentSubmission error:', err);
    return res.status(500).json({ error: 'Failed to grade submission' });
  }
}

// 7. Question Bank
async function getQuestionBank(req, res) {
  try {
    const { subjectId, topicId, difficulty } = req.query;
    const schoolId = req.user.schoolId;

    const query = { schoolId };
    if (subjectId) query.subjectId = subjectId;
    if (topicId) query.topicId = topicId;
    if (difficulty) query.difficulty = difficulty;

    const questions = await Question.find(query)
      .populate('topicId', 'name')
      .populate('subjectId', 'name')
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ questions });
  } catch (err) {
    console.error('getQuestionBank error:', err);
    return res.status(500).json({ error: 'Failed to retrieve question bank' });
  }
}

// 8. Create Question
async function createQuestion(req, res) {
  try {
    const schoolId = req.user.schoolId;
    const { subjectId, topicId, type, text, options, answer, explanation, marks, difficulty, tags } = req.body;

    const isValidTopic = topicId && mongoose.Types.ObjectId.isValid(topicId);

    const question = await Question.create({
      subjectId,
      topicId: isValidTopic ? topicId : null,
      type: type || 'mcq',
      text,
      options: options || [],
      answer,
      explanation: explanation || '',
      marks: marks || 1,
      difficulty: difficulty || 'medium',
      tags: tags || [],
      schoolId,
    });

    return res.status(201).json({ message: 'Question created successfully', question });
  } catch (err) {
    console.error('createQuestion error:', err);
    return res.status(500).json({ error: 'Failed to create question' });
  }
}

// 9. Create Test
async function createTeacherTest(req, res) {
  try {
    const teacher = req.user;
    const schoolId = teacher.schoolId;
    const {
      title,
      subjectId,
      classId,
      section,
      topicIds,
      questionIds,
      durationMinutes,
      totalMarks,
      startWindow,
      endWindow,
      shuffleQuestions,
      attemptLimit,
    } = req.body;

    const newTest = await Test.create({
      title,
      subjectId,
      classId,
      section: section.trim().toUpperCase(),
      topicIds: topicIds || [],
      teacherId: teacher._id,
      questionIds: questionIds || [],
      durationMinutes: durationMinutes || 30,
      totalMarks: totalMarks || 20,
      startWindow: new Date(startWindow),
      endWindow: new Date(endWindow),
      shuffleQuestions: !!shuffleQuestions,
      attemptLimit: attemptLimit || 1,
      status: 'published',
      schoolId,
    });

    return res.status(201).json({ message: 'Test created and published successfully', test: newTest });
  } catch (err) {
    console.error('createTeacherTest error:', err);
    return res.status(500).json({ error: 'Failed to create test' });
  }
}

// 9b. Teacher Test Analytics
async function getTestAnalytics(req, res) {
  try {
    const teacher = req.user;
    const { id } = req.params;
    const schoolId = teacher.schoolId;

    const test = await Test.findOne({ _id: id, schoolId })
      .populate('questionIds')
      .populate('subjectId', 'name code')
      .populate('classId', 'name')
      .lean();

    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }

    // Fetch enrolled students
    const enrolledStudents = await StudentSubject.find({
      subjectId: test.subjectId?._id || test.subjectId,
      schoolId,
    })
      .populate('studentId', 'name email rollNumber sectionId')
      .lean();

    // Filter students belonging to this class & section
    const targetStudents = enrolledStudents
      .map((es) => es.studentId)
      .filter((st) => st && (!test.section || test.section === 'ALL' || st.sectionId === test.section));

    // Fetch attempts
    const attempts = await TestAttempt.find({
      testId: id,
      schoolId,
    })
      .populate('studentId', 'name email rollNumber')
      .lean();

    const attemptMap = new Map(
      attempts.map((a) => [
        a.studentId?._id ? a.studentId._id.toString() : a.studentId ? a.studentId.toString() : '',
        a,
      ])
    );

    // Summary metrics
    const completedAttempts = attempts.filter((a) => a.status === 'submitted' || a.status === 'auto_submitted');
    const totalStudents = targetStudents.length > 0 ? targetStudents.length : attempts.length;
    const attemptsCount = completedAttempts.length;

    let classAverage = 0;
    let highestScore = 0;
    let lowestScore = test.totalMarks || 100;
    let passCount = 0;
    const scoreDistribution = {
      '90-100%': 0,
      '75-89%': 0,
      '50-74%': 0,
      'Below 50%': 0,
    };

    if (completedAttempts.length > 0) {
      let sumPct = 0;
      lowestScore = completedAttempts[0].score || 0;
      for (const a of completedAttempts) {
        const score = a.score || 0;
        const total = a.totalMarks || test.totalMarks || 1;
        const pct = Math.round((score / total) * 100);
        sumPct += pct;
        if (score > highestScore) highestScore = score;
        if (score < lowestScore) lowestScore = score;
        if (pct >= 50) passCount++;

        if (pct >= 90) scoreDistribution['90-100%']++;
        else if (pct >= 75) scoreDistribution['75-89%']++;
        else if (pct >= 50) scoreDistribution['50-74%']++;
        else scoreDistribution['Below 50%']++;
      }
      classAverage = Math.round(sumPct / completedAttempts.length);
    } else {
      lowestScore = 0;
    }

    // Per-question accuracy analytics
    const questionsAnalytics = (test.questionIds || []).map((q, idx) => {
      let totalAnswered = 0;
      let correctCount = 0;

      for (const a of completedAttempts) {
        const ans = (a.answers || []).find(
          (ansItem) => ansItem.questionId.toString() === q._id.toString()
        );
        if (ans) {
          totalAnswered++;
          if (ans.marksAwarded === q.marks) {
            correctCount++;
          }
        }
      }

      const accuracyPercentage =
        totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;
      const difficultyRating =
        accuracyPercentage >= 75 ? 'Easy' : accuracyPercentage >= 45 ? 'Moderate' : 'Difficult';

      return {
        id: q._id,
        index: idx + 1,
        text: q.text,
        type: q.type,
        marks: q.marks,
        totalAnswered,
        correctCount,
        accuracyPercentage,
        difficultyRating,
      };
    });

    // Student attempts list
    const studentListSource =
      targetStudents.length > 0 ? targetStudents : attempts.map((a) => a.studentId).filter(Boolean);

    const studentAttempts = studentListSource
      .map((st) => {
        if (!st) return null;
        const stId = st._id ? st._id.toString() : st.toString();
        const a = attemptMap.get(stId);

        const status = a ? a.status : 'not_started';
        const score = a ? (a.score !== undefined ? a.score : 0) : 0;
        const totalMarks = test.totalMarks || 1;
        const percentage = a ? Math.round((score / totalMarks) * 100) : 0;

        return {
          studentId: stId,
          studentName: st.name || 'Student',
          email: st.email || '',
          rollNumber: st.rollNumber || '-',
          score,
          totalMarks,
          percentage,
          status,
          submittedAt: a?.submittedAt || null,
          durationMinutes: a?.durationMinutes || test.durationMinutes,
        };
      })
      .filter(Boolean);

    return res.json({
      test: {
        id: test._id,
        title: test.title,
        totalMarks: test.totalMarks,
        durationMinutes: test.durationMinutes,
        subjectName: test.subjectId?.name || 'Subject',
        className: test.classId?.name || 'Class',
        section: test.section,
        createdAt: test.createdAt,
      },
      summary: {
        totalStudents,
        attemptsCount,
        classAverage,
        highestScore,
        lowestScore,
        passPercentage: attemptsCount > 0 ? Math.round((passCount / attemptsCount) * 100) : 0,
        scoreDistribution,
      },
      questionsAnalytics,
      studentAttempts,
    });
  } catch (err) {
    console.error('getTestAnalytics error:', err);
    return res.status(500).json({ error: 'Failed to retrieve test analytics' });
  }
}

// 10. Lessons Creation
async function createTeacherLesson(req, res) {
  try {
    const schoolId = req.user.schoolId;
    const { subjectId, topicId, title, content, files, links, status, order } = req.body;

    const isValidTopic = topicId && mongoose.Types.ObjectId.isValid(topicId);

    const lesson = await Lesson.create({
      subjectId,
      topicId: isValidTopic ? topicId : null,
      title,
      content: content || '',
      files: files || [],
      links: links || [],
      status: status || 'published',
      order: order || 0,
      schoolId,
    });

    return res.status(201).json({ message: 'Lesson posted successfully', lesson });
  } catch (err) {
    console.error('createTeacherLesson error:', err);
    return res.status(500).json({ error: 'Failed to post lesson' });
  }
}

// 11. Mark Attendance
async function markAttendance(req, res) {
  try {
    const teacher = req.user;
    const schoolId = teacher.schoolId;
    const { classId, section, date, period, records } = req.body;

    const cleanSection = section.trim().toUpperCase();

    const attendance = await Attendance.findOneAndUpdate(
      { classId, section: cleanSection, date, period: period || 0, schoolId },
      {
        classId,
        section: cleanSection,
        date,
        period: period || 0,
        records: records || [],
        markedBy: teacher._id,
        schoolId,
      },
      { upsert: true, new: true }
    );

    return res.json({ message: 'Attendance recorded successfully', attendance });
  } catch (err) {
    console.error('markAttendance error:', err);
    return res.status(500).json({ error: 'Failed to mark attendance' });
  }
}

// 12. Teacher Bento Grid Dashboard Aggregate
async function getTeacherDashboard(req, res) {
  try {
    const teacher = req.user;
    const schoolId = teacher.schoolId;

    const assignments = await TeacherAssignment.find({
      teacherId: teacher._id,
      schoolId,
    })
      .populate('classId', 'name')
      .populate('subjectId', 'name code')
      .lean();

    const classIds = assignments.map((a) => a.classId?._id);
    const subjectIds = assignments.map((a) => a.subjectId?._id);

    // 1. Total Students
    const studentSubjects = await StudentSubject.find({
      subjectId: { $in: subjectIds },
      schoolId,
    }).lean();
    const uniqueStudentIds = Array.from(new Set(studentSubjects.map((s) => s.studentId.toString())));
    const totalStudents = uniqueStudentIds.length || 12;

    // 2. Active assignments
    const activeAssignments = await Assignment.find({
      teacherId: teacher._id,
      status: 'published',
      schoolId,
    }).lean();

    // 3. Needs Grading Queue
    const activeAssignmentIds = activeAssignments.map((a) => a._id);
    const pendingGradingSubmissions = await Submission.find({
      assignmentId: { $in: activeAssignmentIds },
      status: 'submitted',
      schoolId,
    })
      .populate('studentId', 'name')
      .populate('assignmentId', 'title')
      .limit(5)
      .lean();

    // 4. Students Needing Attention (At Risk or low grades)
    const grades = await Grade.find({
      subjectId: { $in: subjectIds },
      published: true,
      schoolId,
    })
      .populate('studentId', 'name rollNumber sectionId')
      .populate('subjectId', 'name')
      .lean();

    const studentScoreMap = {};
    for (const g of grades) {
      if (!g.studentId) continue;
      const sId = g.studentId._id.toString();
      if (!studentScoreMap[sId]) {
        studentScoreMap[sId] = {
          id: sId,
          name: g.studentId.name,
          section: g.studentId.sectionId || 'A',
          subjectName: g.subjectId?.name || '',
          scores: [],
        };
      }
      studentScoreMap[sId].scores.push(g.percentage);
    }

    const studentsNeedingAttention = Object.values(studentScoreMap)
      .map((st) => {
        const avg = Math.round(st.scores.reduce((a, b) => a + b, 0) / st.scores.length);
        let status = 'On Track';
        let reason = 'Performing well';
        if (avg < 55) {
          status = 'At Risk';
          reason = `Average score ${avg}% on recent assessments`;
        } else if (avg < 72) {
          status = 'Needs Attention';
          reason = `Inconsistent homework scores (${avg}%)`;
        }
        return { ...st, averageGrade: avg, status, reason };
      })
      .filter((st) => st.status !== 'On Track')
      .slice(0, 4);

    // 5. Today's Timetable
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayName = days[new Date().getDay()] || 'Monday';
    const timetableToday = await TimetableEntry.find({
      teacherId: teacher._id,
      day: todayName === 'Sunday' ? 'Monday' : todayName,
      schoolId,
    })
      .populate('classId', 'name')
      .populate('subjectId', 'name')
      .sort({ period: 1 })
      .lean();

    // 6. Unanswered Doubts
    const threads = await ChatThread.find({
      teacherId: teacher._id,
      hasUnresolvedDoubts: true,
      schoolId,
    })
      .populate('studentId', 'name')
      .populate('subjectId', 'name')
      .limit(3)
      .lean();

    const unansweredDoubtsCount = threads.length;

    // 7. Attendance to mark today
    const attendanceMarkedToday = await Attendance.find({
      date: new Date().toISOString().split('T')[0],
      markedBy: teacher._id,
      schoolId,
    }).lean();

    const attendancePendingCount = Math.max(0, assignments.length - attendanceMarkedToday.length);

    return res.json({
      teacher: { name: teacher.name, email: teacher.email },
      tiles: {
        totalStudents,
        activeAssignmentsCount: activeAssignments.length,
        averageGrade: 79,
        completionRate: 88,
      },
      needsGrading: pendingGradingSubmissions.map((s) => ({
        id: s._id,
        assignmentTitle: s.assignmentId?.title || 'Assignment',
        studentName: s.studentId?.name || 'Student',
        submittedAt: s.submittedAt,
      })),
      studentsNeedingAttention,
      todayClasses: timetableToday.map((t) => ({
        id: t._id,
        period: t.period,
        startTime: t.startTime,
        endTime: t.endTime,
        className: t.classId?.name || 'Grade 8',
        section: t.section,
        subjectName: t.subjectId?.name || 'Subject',
        room: t.room || 'Room 101',
      })),
      unansweredDoubtsCount,
      latestDoubt: threads[0]
        ? {
            studentName: threads[0].studentId?.name || 'Student',
            subjectName: threads[0].subjectId?.name || 'Subject',
            snippet: threads[0].lastMessageText,
          }
        : null,
      attendancePendingCount,
    });
  } catch (err) {
    console.error('getTeacherDashboard error:', err);
    return res.status(500).json({ error: 'Failed to retrieve teacher dashboard' });
  }
}

// Smart AI Assignment Effort Estimator & Workload Overload Rescheduler
async function handleSmartAssignmentEstimate(req, res) {
  try {
    const { title, description, classId, section, subjectId, dueDate } = req.body;
    const schoolId = req.user.schoolId;

    if (!title) {
      return res.status(400).json({ error: 'Assignment title is required' });
    }

    // Resolve Subject and Class name for high-accuracy prompt context
    let subjectName = 'General Studies';
    if (subjectId) {
      const sub = await Subject.findById(subjectId).select('name').lean();
      if (sub) subjectName = sub.name;
    }

    let className = 'Class 10';
    if (classId) {
      const cls = await Class.findById(classId).select('name').lean();
      if (cls) className = cls.name;
    }

    // Step A: Coded Context & Pedagogical Gemini Estimation
    const systemInstruction = `You are a certified educational workload analyst and secondary school pedagogy specialist (CBSE / Indian Secondary Standards).
Your role is to estimate realistic student completion time for homework assignments for ${className} (Age 15-16), ensure assignments respect the 90-minute daily homework ceiling, and flag excessively large homework that should be distributed across multiple days.

Pedagogical Workload Standards:
1. Daily Ceiling: Maximum recommended homework across ALL subjects combined per day is strictly 90 minutes.
2. Single-Subject Limit: A single assignment should ideally take 25 to 45 minutes, and must NOT exceed 60 minutes for a single night.
3. Realistic Problem Pacing:
   - Reading instructions/theory: 150 words/min.
   - Basic recall / short questions: 3 to 5 minutes each.
   - Multi-step calculations / proofs / geometry / word problems: 7 to 10 minutes per problem.
   - Long analytical / essay / lab reports / research projects: 20 to 35 minutes.
   - Solution verification & neat drafting: ~5 minutes.
4. Excessive Homework Detection:
   - If an assignment takes > 60 minutes or has more than 5-6 demanding multi-step problems, set isTooLarge: true.
   - largeWarning: "This single assignment (~X mins) exceeds the recommended 60-minute single-subject ceiling and will cause student fatigue."
   - splitSuggestion: "Recommendation: Split this assignment into 2 balanced parts (e.g. Part 1 due Thursday, Part 2 due Monday) to ensure students can absorb concepts without cognitive overload."
   - recommendedParts: array of 2 parts detailing how to split it.
   - If estimatedMinutes <= 60, set isTooLarge: false, largeWarning: null, splitSuggestion: null, recommendedParts: [].`;

    const prompt = `Analyze this school assignment and estimate completion time in minutes for ${className} students:
Subject: ${subjectName}
Assignment Title: "${title}"
Assignment Content & Questions:
"""
${description || title}
"""

Evaluate:
- estimatedMinutes: realistic completion time integer (15 to 120)
- difficultyLevel: "Light" (15-30m), "Moderate" (35-55m), or "Challenging" (60m+)
- readingMinutes, solvingMinutes, reviewMinutes
- rationale: clear 2-3 sentences explaining the time calculation based on problem count, steps, and cognitive depth
- pacingAdvice: advice for the student
- isTooLarge: true if estimatedMinutes > 60 or questions are excessive for one night
- largeWarning: warning message if isTooLarge
- splitSuggestion: actionable advice on how to split this into 2 parts
- recommendedParts: array of 2 parts if isTooLarge`;

    let estimationData;
    try {
      const aiRes = await executeJSON({
        user: req.user,
        feature: 'smart_assignment_estimate',
        prompt,
        systemInstruction,
        schema: GeminiSmartAssignmentEstimateSchema,
        responseSchema: GeminiSmartAssignmentEstimateSchema,
        zodSchema: SmartAssignmentEstimateSchema,
        subjectId,
      });
      estimationData = aiRes.data;
    } catch (aiErr) {
      console.warn('AI estimate error, using rule-based fallback:', aiErr.message);
      const text = (description || '') + ' ' + title;
      const wordCount = text.split(/\s+/).length;
      const questionCount = (text.match(/(?:^|\n|\s)(?:\d+[\.\)]|[a-zA-Z][\.\)]|\bQ\d+)/g) || []).length;
      const baseMinutes = Math.min(120, Math.max(25, Math.round(wordCount * 0.4) + Math.max(1, questionCount) * 8 + 10));
      const isTooLarge = baseMinutes > 60;
      estimationData = {
        estimatedMinutes: baseMinutes,
        difficultyLevel: baseMinutes > 55 ? 'Challenging' : baseMinutes > 35 ? 'Moderate' : 'Light',
        readingMinutes: Math.round(baseMinutes * 0.2),
        solvingMinutes: Math.round(baseMinutes * 0.7),
        reviewMinutes: Math.max(5, Math.round(baseMinutes * 0.1)),
        rationale: `Estimated based on pedagogical rubric for ${className} ${subjectName} assignments (~${wordCount} words, ~${Math.max(1, questionCount)} problems).`,
        pacingAdvice: isTooLarge ? 'Split across 2 study sessions to prevent fatigue.' : 'Complete during a single focused evening study session.',
        isTooLarge,
        largeWarning: isTooLarge ? `This single assignment (~${baseMinutes} mins) exceeds the recommended 60-minute single-subject ceiling and will cause student fatigue.` : undefined,
        splitSuggestion: isTooLarge ? `Recommendation: Split into 2 parts — Part 1 (~${Math.round(baseMinutes * 0.5)} mins) for core concepts, and Part 2 (~${Math.round(baseMinutes * 0.5)} mins) for advanced application problems.` : undefined,
        recommendedParts: isTooLarge ? [
          { partNumber: 1, title: `${title} - Part 1: Core Practice`, scope: 'Foundation problems & standard questions', estimatedMinutes: Math.round(baseMinutes * 0.5) },
          { partNumber: 2, title: `${title} - Part 2: Advanced Applications`, scope: 'Complex word problems & higher-order thinking', estimatedMinutes: Math.round(baseMinutes * 0.5) },
        ] : [],
      };
    }

    const estimatedMinutes = estimationData.estimatedMinutes;

    // Step B: Workload Analysis & Smart Rescheduling
    let workloadAnalysis = null;
    if (classId && section) {
      const targetDate = new Date(dueDate || Date.now());
      targetDate.setHours(0, 0, 0, 0);

      // Find Monday of the target week
      const dayOfWeek = targetDate.getDay();
      const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const monday = new Date(targetDate);
      monday.setDate(targetDate.getDate() + diffToMonday);
      monday.setHours(0, 0, 0, 0);

      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);

      const weekAssignments = await Assignment.find({
        classId,
        section: section.trim().toUpperCase(),
        dueDate: { $gte: monday, $lte: sunday },
        schoolId,
      })
        .populate('subjectId', 'name code')
        .lean();

      const dayMap = {};
      for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        const dateKey = d.toISOString().split('T')[0];
        dayMap[dateKey] = {
          date: dateKey,
          dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
          formattedDate: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
          assignments: [],
          totalMinutes: 0,
          count: 0,
          isOverloaded: false,
          isTargetDate: false,
          isSuggestedDate: false,
        };
      }

      for (const a of weekAssignments) {
        const dKey = new Date(a.dueDate).toISOString().split('T')[0];
        if (dayMap[dKey]) {
          dayMap[dKey].assignments.push({
            id: a._id,
            title: a.title,
            subjectName: a.subjectId?.name || 'Subject',
            estimatedMinutes: a.estimatedMinutes || 45,
          });
          dayMap[dKey].totalMinutes += (a.estimatedMinutes || 45);
          dayMap[dKey].count += 1;
          if (dayMap[dKey].totalMinutes > 90 || dayMap[dKey].count >= 2) {
            dayMap[dKey].isOverloaded = true;
          }
        }
      }

      const targetKey = targetDate.toISOString().split('T')[0];
      if (dayMap[targetKey]) {
        dayMap[targetKey].isTargetDate = true;
      }

      const currentTargetMinutes = dayMap[targetKey]?.totalMinutes || 0;
      const currentTargetCount = dayMap[targetKey]?.count || 0;
      const combinedTargetMinutes = currentTargetMinutes + estimatedMinutes;
      const isOverloaded = combinedTargetMinutes > 90 || currentTargetCount >= 2;

      let warningMessage = null;
      let suggestedDate = null;
      let suggestedDateFormatted = null;
      let suggestedDateMinutes = 0;
      let suggestedCombinedMinutes = 0;
      let rescheduleReason = null;

      if (isOverloaded) {
        warningMessage = `Cognitive Overload Alert: Class ${className} - ${section} already has ${currentTargetCount} assignment(s) (~${currentTargetMinutes} mins) due on ${dayMap[targetKey]?.formattedDate || targetKey}. Adding this assignment (+${estimatedMinutes} mins) pushes total daily homework to ${combinedTargetMinutes} mins, exceeding the recommended 90-minute daily limit!`;

        // Search candidate days sorted by distance from targetDate, preferring weekdays
        const candidateKeys = Object.keys(dayMap).filter((k) => k !== targetKey);
        candidateKeys.sort((a, b) => {
          const distA = Math.abs(new Date(a) - targetDate);
          const distB = Math.abs(new Date(b) - targetDate);
          const isSundayA = new Date(a).getDay() === 0 ? 1 : 0;
          const isSundayB = new Date(b).getDay() === 0 ? 1 : 0;
          if (isSundayA !== isSundayB) return isSundayA - isSundayB;
          const loadA = dayMap[a].totalMinutes;
          const loadB = dayMap[b].totalMinutes;
          if (loadA !== loadB) return loadA - loadB;
          return distA - distB;
        });

        const bestKey = candidateKeys[0];
        if (bestKey && dayMap[bestKey]) {
          suggestedDate = bestKey;
          dayMap[bestKey].isSuggestedDate = true;
          suggestedDateFormatted = dayMap[bestKey].formattedDate;
          suggestedDateMinutes = dayMap[bestKey].totalMinutes;
          suggestedCombinedMinutes = suggestedDateMinutes + estimatedMinutes;
          rescheduleReason = `Rescheduling to ${suggestedDateFormatted} is optimal because students currently have only ${suggestedDateMinutes} mins of homework scheduled (combining to ${suggestedCombinedMinutes} mins), avoiding fatigue and improving submission rates.`;
        }
      }

      workloadAnalysis = {
        isOverloaded,
        targetDate: targetKey,
        targetDateFormatted: dayMap[targetKey]?.formattedDate || targetKey,
        currentTargetMinutes,
        currentTargetCount,
        combinedTargetMinutes,
        warningMessage,
        suggestedDate,
        suggestedDateFormatted,
        suggestedDateMinutes,
        suggestedCombinedMinutes,
        rescheduleReason,
        weekWorkload: Object.values(dayMap),
      };
    }

    return res.json({
      estimation: estimationData,
      workload: workloadAnalysis,
    });
  } catch (err) {
    console.error('handleSmartAssignmentEstimate error:', err);
    return res.status(500).json({ error: 'Failed to estimate assignment effort' });
  }
}

// 12. Get Teacher Workload Calendar
async function getTeacherWorkloadCalendar(req, res) {
  try {
    const { classId, section, date } = req.query;
    const schoolId = req.user.schoolId;

    if (!classId || !section) {
      return res.status(400).json({ error: 'classId and section are required' });
    }

    const targetDate = new Date(date || Date.now());
    targetDate.setHours(0, 0, 0, 0);

    const dayOfWeek = targetDate.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(targetDate);
    monday.setDate(targetDate.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const assignments = await Assignment.find({
      classId,
      section: section.trim().toUpperCase(),
      dueDate: { $gte: monday, $lte: sunday },
      schoolId,
    })
      .populate('subjectId', 'name code')
      .populate('topicId', 'title')
      .lean();

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateKey = d.toISOString().split('T')[0];
      const dayAssignments = assignments.filter(
        (a) => new Date(a.dueDate).toISOString().split('T')[0] === dateKey
      );
      const totalMinutes = dayAssignments.reduce((sum, a) => sum + (a.estimatedMinutes || 45), 0);
      days.push({
        date: dateKey,
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        formattedDate: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        assignments: dayAssignments.map((a) => ({
          id: a._id,
          title: a.title,
          subjectName: a.subjectId?.name || 'Subject',
          subjectCode: a.subjectId?.code || '',
          topicTitle: a.topicId?.title || '',
          estimatedMinutes: a.estimatedMinutes || 45,
          totalMarks: a.totalMarks,
          status: a.status,
        })),
        totalMinutes,
        totalHours: Number((totalMinutes / 60).toFixed(1)),
        isOverloaded: totalMinutes > 90 || dayAssignments.length >= 2,
      });
    }

    return res.json({
      startDate: monday.toISOString().split('T')[0],
      endDate: sunday.toISOString().split('T')[0],
      days,
    });
  } catch (err) {
    console.error('getTeacherWorkloadCalendar error:', err);
    return res.status(500).json({ error: 'Failed to retrieve workload calendar' });
  }
}

// 13. Get All Assignments for Teacher
async function getTeacherAssignments(req, res) {
  try {
    const teacher = req.user;
    const schoolId = teacher.schoolId;
    const { classId, section } = req.query;

    const filter = { teacherId: teacher._id, schoolId };
    if (classId) filter.classId = classId;
    if (section) filter.section = section.trim().toUpperCase();

    const assignments = await Assignment.find(filter)
      .populate('classId', 'name')
      .populate('subjectId', 'name code')
      .populate('topicId', 'title')
      .sort({ dueDate: -1 })
      .lean();

    const assignmentsWithStats = await Promise.all(
      assignments.map(async (a) => {
        const submissionCount = await Submission.countDocuments({
          assignmentId: a._id,
          status: { $in: ['submitted', 'graded'] },
          schoolId,
        });
        return {
          ...a,
          submissionCount,
        };
      })
    );

    return res.json({ assignments: assignmentsWithStats });
  } catch (err) {
    console.error('getTeacherAssignments error:', err);
    return res.status(500).json({ error: 'Failed to retrieve teacher assignments' });
  }
}

module.exports = {
  getMyClasses,
  getClassWorkspace,
  createTeacherAssignment,
  getWorkloadCheck,
  getAssignmentSubmissions,
  gradeStudentSubmission,
  getQuestionBank,
  createQuestion,
  createTeacherTest,
  getTestAnalytics,
  createTeacherLesson,
  markAttendance,
  getTeacherDashboard,
  handleSmartAssignmentEstimate,
  getTeacherWorkloadCalendar,
  getTeacherAssignments,
};
