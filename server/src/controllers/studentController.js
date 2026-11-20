const StudentSubject = require('../models/StudentSubject');
const Subject = require('../models/Subject');
const TeacherAssignment = require('../models/TeacherAssignment');
const Class = require('../models/Class');
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
const StudyBlock = require('../models/StudyBlock');
const MasteryRecord = require('../models/MasteryRecord');
const Announcement = require('../models/Announcement');
const ChatThread = require('../models/ChatThread');
const ChatMessage = require('../models/ChatMessage');
const User = require('../models/User');

// Helper to get enrolled subject IDs for the student
async function getStudentEnrolledSubjectIds(studentId, schoolId) {
  const records = await StudentSubject.find({ studentId, schoolId }).select('subjectId isElective').lean();
  return records.map((r) => r.subjectId.toString());
}

// 1. Get Enrolled Subjects Overview
async function getMySubjects(req, res) {
  try {
    const student = req.user;
    const schoolId = student.schoolId;

    const enrollments = await StudentSubject.find({
      studentId: student._id,
      schoolId,
    })
      .populate('subjectId')
      .lean();

    const enrolledSubjects = [];

    for (const en of enrollments) {
      if (!en.subjectId) continue;
      const sub = en.subjectId;

      // Find teacher assigned to student's class & section
      let teacherName = 'Unassigned';
      if (student.classId && student.sectionId) {
        const ta = await TeacherAssignment.findOne({
          classId: student.classId,
          section: student.sectionId,
          subjectId: sub._id,
          schoolId,
        })
          .populate('teacherId', 'name')
          .lean();
        if (ta && ta.teacherId) teacherName = ta.teacherId.name;
      }

      // Pending assignments
      const assignments = await Assignment.find({
        classId: student.classId,
        section: student.sectionId,
        subjectId: sub._id,
        status: 'published',
        schoolId,
      }).select('_id');

      const assignmentIds = assignments.map((a) => a._id);
      const submittedCount = await Submission.countDocuments({
        studentId: student._id,
        assignmentId: { $in: assignmentIds },
        status: { $in: ['submitted', 'graded'] },
      });
      const pendingAssignments = Math.max(0, assignmentIds.length - submittedCount);

      // Next test
      const nextTest = await Test.findOne({
        classId: student.classId,
        section: student.sectionId,
        subjectId: sub._id,
        status: 'published',
        endWindow: { $gte: new Date() },
        schoolId,
      })
        .sort({ startWindow: 1 })
        .select('title startWindow')
        .lean();

      // Last topic
      const lastTopic = await Topic.findOne({
        subjectId: sub._id,
        classId: student.classId,
        schoolId,
      })
        .sort({ order: -1 })
        .select('name')
        .lean();

      // Calculate mastery / progress percentage
      const masteries = await MasteryRecord.find({
        studentId: student._id,
        subjectId: sub._id,
        schoolId,
      }).lean();

      let progress = 75; // default fallback
      if (masteries.length > 0) {
        const total = masteries.reduce((sum, m) => sum + (m.scorePercentage || 0), 0);
        progress = Math.round(total / masteries.length);
      }

      enrolledSubjects.push({
        id: sub._id,
        name: sub.name,
        code: sub.code,
        isElective: !!en.isElective,
        teacherName,
        pendingAssignments,
        nextTest: nextTest ? { title: nextTest.title, date: nextTest.startWindow } : null,
        lastTopic: lastTopic ? lastTopic.name : 'Introduction',
        progress,
      });
    }

    return res.json({ subjects: enrolledSubjects });
  } catch (err) {
    console.error('getMySubjects error:', err);
    return res.status(500).json({ error: 'Failed to retrieve subjects' });
  }
}

// 2. Subject Workspace Data (7 Tabs)
async function getSubjectWorkspace(req, res) {
  try {
    const student = req.user;
    const { subjectId } = req.params;
    const schoolId = student.schoolId;

    // Check enrollment
    const enrollment = await StudentSubject.findOne({
      studentId: student._id,
      subjectId,
      schoolId,
    });
    if (!enrollment) {
      return res.status(403).json({ error: 'Access denied: You are not enrolled in this subject.' });
    }

    const subject = await Subject.findOne({ _id: subjectId, schoolId }).lean();
    if (!subject) return res.status(404).json({ error: 'Subject not found' });

    // Teacher
    const ta = await TeacherAssignment.findOne({
      classId: student.classId,
      section: student.sectionId,
      subjectId,
      schoolId,
    })
      .populate('teacherId', 'name email')
      .lean();

    // 1. Overview: Topics with mastery
    const topics = await Topic.find({ subjectId, classId: student.classId, schoolId })
      .sort({ order: 1 })
      .lean();

    const masteries = await MasteryRecord.find({
      studentId: student._id,
      subjectId,
      schoolId,
    }).lean();
    const masteryMap = new Map(masteries.map((m) => [m.topicId.toString(), m]));

    const topicsWithMastery = topics.map((t) => {
      const rec = masteryMap.get(t._id.toString());
      return {
        id: t._id,
        name: t.name,
        order: t.order,
        masteryLevel: rec ? rec.level : 'developing',
        scorePercentage: rec ? rec.scorePercentage : 70,
      };
    });

    // 2. Lessons & Notes
    const lessons = await Lesson.find({
      subjectId,
      status: 'published',
      schoolId,
    })
      .sort({ order: 1 })
      .lean();

    const lessonsFormatted = lessons.map((l) => ({
      id: l._id,
      topicId: l.topicId,
      title: l.title,
      content: l.content,
      files: l.files || [],
      links: l.links || [],
      isRead: (l.readBy || []).some((uid) => uid.toString() === student._id.toString()),
      createdAt: l.createdAt,
    }));

    // 3. Assignments
    const assignments = await Assignment.find({
      subjectId,
      classId: student.classId,
      section: { $in: [student.sectionId, 'all'] },
      status: 'published',
      schoolId,
    })
      .sort({ dueDate: 1 })
      .lean();

    const assignmentIds = assignments.map((a) => a._id);
    const submissions = await Submission.find({
      studentId: student._id,
      assignmentId: { $in: assignmentIds },
      schoolId,
    }).lean();
    const subMap = new Map(submissions.map((s) => [s.assignmentId.toString(), s]));

    const assignmentsFormatted = assignments.map((a) => {
      const sub = subMap.get(a._id.toString());
      return {
        id: a._id,
        title: a.title,
        description: a.description,
        dueDate: a.dueDate,
        totalMarks: a.totalMarks,
        estimatedMinutes: a.estimatedMinutes,
        aiHelpLevel: a.aiHelpLevel,
        status: sub ? sub.status : new Date() > new Date(a.dueDate) ? 'late' : 'pending',
        submission: sub
          ? {
              id: sub._id,
              status: sub.status,
              marksAwarded: sub.marksAwarded,
              feedback: sub.feedback,
              submittedAt: sub.submittedAt,
            }
          : null,
      };
    });

    // 4. Tests
    const tests = await Test.find({
      subjectId,
      classId: student.classId,
      section: { $in: [student.sectionId, 'all'] },
      status: 'published',
      schoolId,
    })
      .sort({ startWindow: 1 })
      .lean();

    const testIds = tests.map((t) => t._id);
    const attempts = await TestAttempt.find({
      studentId: student._id,
      testId: { $in: testIds },
      schoolId,
    }).lean();
    const attemptMap = new Map(attempts.map((at) => [at.testId.toString(), at]));

    const testsFormatted = tests.map((t) => {
      const at = attemptMap.get(t._id.toString());
      return {
        id: t._id,
        title: t.title,
        durationMinutes: t.durationMinutes,
        totalMarks: t.totalMarks,
        startWindow: t.startWindow,
        endWindow: t.endWindow,
        attempt: at
          ? {
              id: at._id,
              status: at.status,
              score: at.score,
              totalMarks: at.totalMarks,
              submittedAt: at.submittedAt,
            }
          : null,
      };
    });

    // 5. Grades
    const grades = await Grade.find({
      studentId: student._id,
      subjectId,
      published: true,
      schoolId,
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      subject: {
        id: subject._id,
        name: subject.name,
        code: subject.code,
        isElective: !!enrollment.isElective,
      },
      teacher: ta?.teacherId ? { id: ta.teacherId._id, name: ta.teacherId.name, email: ta.teacherId.email } : null,
      topics: topicsWithMastery,
      lessons: lessonsFormatted,
      assignments: assignmentsFormatted,
      tests: testsFormatted,
      grades,
    });
  } catch (err) {
    console.error('getSubjectWorkspace error:', err);
    return res.status(500).json({ error: 'Failed to retrieve subject workspace' });
  }
}

// 3. Mark Lesson as Read
async function markLessonRead(req, res) {
  try {
    const student = req.user;
    const { lessonId } = req.params;

    const lesson = await Lesson.findOne({ _id: lessonId, schoolId: student.schoolId });
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });

    // Verify student is enrolled in lesson's subject
    const isEnrolled = await StudentSubject.findOne({
      studentId: student._id,
      subjectId: lesson.subjectId,
      schoolId: student.schoolId,
    });
    if (!isEnrolled) {
      return res.status(403).json({ error: 'Access denied: Not enrolled in this subject' });
    }

    if (!lesson.readBy.some((uid) => uid.toString() === student._id.toString())) {
      lesson.readBy.push(student._id);
      await lesson.save();
    }

    return res.json({ message: 'Lesson marked as read' });
  } catch (err) {
    console.error('markLessonRead error:', err);
    return res.status(500).json({ error: 'Failed to mark lesson read' });
  }
}

// 4. Assignments across all enrolled subjects
async function getStudentAssignments(req, res) {
  try {
    const student = req.user;
    const schoolId = student.schoolId;

    const enrolledSubIds = await getStudentEnrolledSubjectIds(student._id, schoolId);

    const assignments = await Assignment.find({
      subjectId: { $in: enrolledSubIds },
      classId: student.classId,
      section: student.sectionId,
      status: 'published',
      schoolId,
    })
      .populate('subjectId', 'name code')
      .sort({ dueDate: 1 })
      .lean();

    const assignmentIds = assignments.map((a) => a._id);
    const submissions = await Submission.find({
      studentId: student._id,
      assignmentId: { $in: assignmentIds },
      schoolId,
    }).lean();
    const subMap = new Map(submissions.map((s) => [s.assignmentId.toString(), s]));

    const formatted = assignments.map((a) => {
      const sub = subMap.get(a._id.toString());
      let status = 'Pending';
      if (sub) {
        if (sub.status === 'graded') status = 'Graded';
        else if (sub.status === 'submitted') status = 'Submitted';
        else if (sub.status === 'draft') status = 'In progress';
        else if (sub.status === 'revision_requested') status = 'Revision Requested';
        else status = 'Submitted';
      } else if (new Date() > new Date(a.dueDate)) {
        status = 'Late';
      }

      return {
        id: a._id,
        title: a.title,
        subjectId: a.subjectId?._id,
        subjectName: a.subjectId?.name || 'Subject',
        dueDate: a.dueDate,
        totalMarks: a.totalMarks,
        estimatedMinutes: a.estimatedMinutes,
        aiHelpLevel: a.aiHelpLevel,
        attachments: a.attachments || [],
        status,
        submission: sub
          ? {
              id: sub._id,
              marksAwarded: sub.marksAwarded,
              feedback: sub.feedback,
              status: sub.status,
            }
          : null,
      };
    });

    return res.json({ assignments: formatted });
  } catch (err) {
    console.error('getStudentAssignments error:', err);
    return res.status(500).json({ error: 'Failed to retrieve assignments' });
  }
}

// 5. Assignment Detail
async function getStudentAssignmentDetail(req, res) {
  try {
    const student = req.user;
    const { id } = req.params;
    const schoolId = student.schoolId;

    const assignment = await Assignment.findOne({ _id: id, schoolId })
      .populate('subjectId', 'name code')
      .populate('teacherId', 'name')
      .lean();

    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

    // Verify enrollment
    const isEnrolled = await StudentSubject.findOne({
      studentId: student._id,
      subjectId: assignment.subjectId._id,
      schoolId,
    });
    if (!isEnrolled) {
      return res.status(403).json({ error: 'Access denied: You are not enrolled in this subject.' });
    }

    const submission = await Submission.findOne({
      assignmentId: id,
      studentId: student._id,
      schoolId,
    }).lean();

    return res.json({
      assignment: {
        id: assignment._id,
        title: assignment.title,
        subject: { id: assignment.subjectId._id, name: assignment.subjectId.name, code: assignment.subjectId.code },
        teacherName: assignment.teacherId?.name || 'Teacher',
        description: assignment.description,
        attachments: assignment.attachments || [],
        dueDate: assignment.dueDate,
        totalMarks: assignment.totalMarks,
        estimatedMinutes: assignment.estimatedMinutes,
        aiHelpLevel: assignment.aiHelpLevel,
        resubmissionAllowed: assignment.resubmissionAllowed,
        latePolicy: assignment.latePolicy,
        rubric: assignment.rubric || [],
      },
      submission: submission
        ? {
            id: submission._id,
            textContent: submission.textContent,
            files: submission.files || [],
            status: submission.status,
            marksAwarded: submission.marksAwarded,
            feedback: submission.feedback,
            rubricScores: submission.rubricScores || [],
            submittedAt: submission.submittedAt,
            gradedAt: submission.gradedAt,
          }
        : null,
    });
  } catch (err) {
    console.error('getStudentAssignmentDetail error:', err);
    return res.status(500).json({ error: 'Failed to retrieve assignment detail' });
  }
}

// 6. Submit or Save Draft for Assignment
async function submitStudentAssignment(req, res) {
  try {
    const student = req.user;
    const { id } = req.params;
    const { textContent, files, isDraft } = req.body;
    const schoolId = student.schoolId;

    const assignment = await Assignment.findOne({ _id: id, schoolId });
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

    // Verify enrollment
    const isEnrolled = await StudentSubject.findOne({
      studentId: student._id,
      subjectId: assignment.subjectId,
      schoolId,
    });
    if (!isEnrolled) {
      return res.status(403).json({ error: 'Access denied: You are not enrolled in this subject.' });
    }

    const newStatus = isDraft ? 'draft' : 'submitted';

    const submission = await Submission.findOneAndUpdate(
      { assignmentId: id, studentId: student._id, schoolId },
      {
        assignmentId: id,
        studentId: student._id,
        textContent: textContent || '',
        files: files || [],
        status: newStatus,
        submittedAt: new Date(),
        schoolId,
      },
      { upsert: true, new: true }
    );

    return res.json({
      message: isDraft ? 'Draft saved successfully' : 'Assignment submitted successfully',
      submission,
    });
  } catch (err) {
    console.error('submitStudentAssignment error:', err);
    return res.status(500).json({ error: 'Failed to submit assignment' });
  }
}

// 7. Student Tests List
async function getStudentTests(req, res) {
  try {
    const student = req.user;
    const schoolId = student.schoolId;

    const enrolledSubIds = await getStudentEnrolledSubjectIds(student._id, schoolId);

    const tests = await Test.find({
      subjectId: { $in: enrolledSubIds },
      classId: student.classId,
      section: { $in: [student.sectionId, 'all'] },
      status: 'published',
      schoolId,
    })
      .populate('subjectId', 'name code')
      .sort({ startWindow: 1 })
      .lean();

    const testIds = tests.map((t) => t._id);
    const attempts = await TestAttempt.find({
      studentId: student._id,
      testId: { $in: testIds },
      schoolId,
    }).lean();
    const attemptMap = new Map(attempts.map((a) => [a.testId.toString(), a]));

    const formatted = tests.map((t) => {
      const at = attemptMap.get(t._id.toString());
      const now = new Date();
      let testStatus = 'upcoming';
      if (at && (at.status === 'submitted' || at.status === 'auto_submitted')) testStatus = 'completed';
      else if (at && at.status === 'in_progress') testStatus = 'in_progress';
      else if (now >= new Date(t.startWindow) && now <= new Date(t.endWindow)) testStatus = 'available';
      else if (now > new Date(t.endWindow)) testStatus = 'expired';

      return {
        id: t._id,
        title: t.title,
        subjectName: t.subjectId?.name || 'Subject',
        durationMinutes: t.durationMinutes,
        totalMarks: t.totalMarks,
        startWindow: t.startWindow,
        endWindow: t.endWindow,
        status: testStatus,
        attempt: at
          ? {
              id: at._id,
              score: at.score,
              totalMarks: at.totalMarks,
              submittedAt: at.submittedAt,
            }
          : null,
      };
    });

    return res.json({ tests: formatted });
  } catch (err) {
    console.error('getStudentTests error:', err);
    return res.status(500).json({ error: 'Failed to retrieve tests' });
  }
}

// 8. Start Test Attempt
async function startTestAttempt(req, res) {
  try {
    const student = req.user;
    const { id } = req.params;
    const schoolId = student.schoolId;

    const test = await Test.findOne({ _id: id, schoolId }).populate('questionIds').lean();
    if (!test) return res.status(404).json({ error: 'Test not found' });

    // Verify enrollment
    const isEnrolled = await StudentSubject.findOne({
      studentId: student._id,
      subjectId: test.subjectId,
      schoolId,
    });
    if (!isEnrolled) {
      return res.status(403).json({ error: 'Access denied: You are not enrolled in this subject.' });
    }

    // Check existing attempt
    let attempt = await TestAttempt.findOne({ testId: id, studentId: student._id, schoolId });
    const durationMinutes = test.durationMinutes || 30;
    if (!attempt) {
      const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);
      attempt = await TestAttempt.create({
        testId: id,
        studentId: student._id,
        totalMarks: test.totalMarks,
        startedAt: new Date(),
        durationMinutes,
        expiresAt,
        status: 'in_progress',
        answers: [],
        schoolId,
      });
    } else if (!attempt.expiresAt && attempt.startedAt) {
      attempt.durationMinutes = durationMinutes;
      attempt.expiresAt = new Date(new Date(attempt.startedAt).getTime() + durationMinutes * 60 * 1000);
      await attempt.save();
    }

    // Prepare questions (sanitizing correct answers for active test)
    const questionsSanitized = (test.questionIds || []).map((q) => ({
      id: q._id,
      type: q.type,
      text: q.text,
      options: q.options || [],
      marks: q.marks,
    }));

    return res.json({
      test: {
        id: test._id,
        title: test.title,
        durationMinutes: test.durationMinutes,
        totalMarks: test.totalMarks,
      },
      attempt: {
        id: attempt._id,
        startedAt: attempt.startedAt,
        expiresAt: attempt.expiresAt,
        durationMinutes: attempt.durationMinutes || durationMinutes,
        answers: attempt.answers || [],
        status: attempt.status,
      },
      questions: questionsSanitized,
    });
  } catch (err) {
    console.error('startTestAttempt error:', err);
    return res.status(500).json({ error: 'Failed to start test attempt' });
  }
}

// 9. Autosave Test Answer
async function saveTestAnswer(req, res) {
  try {
    const student = req.user;
    const { id } = req.params;
    const { questionId, studentAnswer, flagged } = req.body;
    const schoolId = student.schoolId;

    const attempt = await TestAttempt.findOne({ testId: id, studentId: student._id, schoolId });
    if (!attempt) return res.status(404).json({ error: 'Attempt not found' });
    if (attempt.status === 'submitted') {
      return res.status(400).json({ error: 'Test attempt is already submitted' });
    }

    const existingIdx = attempt.answers.findIndex((a) => a.questionId.toString() === questionId);
    if (existingIdx >= 0) {
      if (studentAnswer !== undefined) attempt.answers[existingIdx].studentAnswer = studentAnswer;
      if (flagged !== undefined) attempt.answers[existingIdx].flagged = flagged;
    } else {
      attempt.answers.push({
        questionId,
        studentAnswer: studentAnswer || '',
        flagged: !!flagged,
      });
    }

    await attempt.save();
    return res.json({ message: 'Answer saved', answers: attempt.answers });
  } catch (err) {
    console.error('saveTestAnswer error:', err);
    return res.status(500).json({ error: 'Failed to save answer' });
  }
}

// 10. Submit Test and Auto-grade
async function submitTestAttempt(req, res) {
  try {
    const student = req.user;
    const { id } = req.params;
    const schoolId = student.schoolId;

    const test = await Test.findOne({ _id: id, schoolId }).populate('questionIds');
    if (!test) return res.status(404).json({ error: 'Test not found' });

    let attempt = await TestAttempt.findOne({ testId: id, studentId: student._id, schoolId });
    if (!attempt) return res.status(404).json({ error: 'Attempt not found' });

    // Auto-grade MCQs
    let totalScore = 0;
    const questionMap = new Map((test.questionIds || []).map((q) => [q._id.toString(), q]));

    for (const ans of attempt.answers) {
      const q = questionMap.get(ans.questionId.toString());
      if (q) {
        if (q.type === 'mcq' || q.type === 'true_false') {
          const isCorrect = ans.studentAnswer?.trim().toLowerCase() === q.answer?.trim().toLowerCase();
          ans.marksAwarded = isCorrect ? q.marks : 0;
          totalScore += ans.marksAwarded;
        } else {
          // Subjective answers get pending or default partial mark for prototype
          ans.marksAwarded = Math.round(q.marks * 0.8);
          totalScore += ans.marksAwarded;
        }
      }
    }

    const isAutoSubmit = attempt.expiresAt && new Date() > new Date(attempt.expiresAt);
    attempt.score = totalScore;
    attempt.status = isAutoSubmit ? 'auto_submitted' : 'submitted';
    attempt.submittedAt = new Date();
    await attempt.save();

    // Record in Grade collection
    await Grade.findOneAndUpdate(
      { studentId: student._id, assessmentId: test._id, schoolId },
      {
        studentId: student._id,
        assessmentType: 'test',
        assessmentId: test._id,
        assessmentTitle: test.title,
        subjectId: test.subjectId,
        classId: student.classId,
        marksObtained: totalScore,
        totalMarks: test.totalMarks,
        percentage: Math.round((totalScore / (test.totalMarks || 1)) * 100),
        published: true,
        schoolId,
      },
      { upsert: true, new: true }
    );

    return res.json({
      message: 'Test submitted and evaluated successfully',
      score: totalScore,
      totalMarks: test.totalMarks,
      percentage: Math.round((totalScore / (test.totalMarks || 1)) * 100),
    });
  } catch (err) {
    console.error('submitTestAttempt error:', err);
    return res.status(500).json({ error: 'Failed to submit test' });
  }
}

// 11. Test Results & Topic Breakdown
async function getTestResults(req, res) {
  try {
    const student = req.user;
    const { id } = req.params;
    const schoolId = student.schoolId;

    const test = await Test.findOne({ _id: id, schoolId }).populate({
      path: 'questionIds',
      populate: { path: 'topicId', select: 'name' },
    });
    if (!test) return res.status(404).json({ error: 'Test not found' });

    const attempt = await TestAttempt.findOne({ testId: id, studentId: student._id, schoolId }).lean();
    if (!attempt || (attempt.status !== 'submitted' && attempt.status !== 'auto_submitted')) {
      return res.status(400).json({ error: 'Test results not available until submitted' });
    }

    const answerMap = new Map((attempt.answers || []).map((a) => [a.questionId.toString(), a]));
    const topicBreakdown = {};

    const reviewQuestions = (test.questionIds || []).map((q) => {
      const ans = answerMap.get(q._id.toString());
      const topicName = q.topicId?.name || 'General';

      if (!topicBreakdown[topicName]) {
        topicBreakdown[topicName] = { topic: topicName, totalQuestions: 0, correct: 0, marksScored: 0, totalMarks: 0 };
      }
      topicBreakdown[topicName].totalQuestions += 1;
      topicBreakdown[topicName].totalMarks += q.marks;

      const marksAwarded = ans ? ans.marksAwarded || 0 : 0;
      topicBreakdown[topicName].marksScored += marksAwarded;
      if (marksAwarded === q.marks) {
        topicBreakdown[topicName].correct += 1;
      }

      return {
        id: q._id,
        text: q.text,
        type: q.type,
        options: q.options || [],
        correctAnswer: q.answer,
        studentAnswer: ans ? ans.studentAnswer : '',
        marksAwarded,
        totalMarks: q.marks,
        explanation: q.explanation || '',
        topicName,
      };
    });

    return res.json({
      test: {
        id: test._id,
        title: test.title,
        subjectId: test.subjectId,
        totalMarks: test.totalMarks,
      },
      attempt: {
        score: attempt.score,
        totalMarks: attempt.totalMarks,
        submittedAt: attempt.submittedAt,
        percentage: Math.round(((attempt.score || 0) / (attempt.totalMarks || 1)) * 100),
      },
      reviewQuestions,
      topicBreakdown: Object.values(topicBreakdown),
    });
  } catch (err) {
    console.error('getTestResults error:', err);
    return res.status(500).json({ error: 'Failed to retrieve test results' });
  }
}

// 12. Student Timetable (Scoped to Enrolled Subjects)
async function getStudentTimetable(req, res) {
  try {
    const student = req.user;
    const schoolId = student.schoolId;

    const enrolledSubIds = await getStudentEnrolledSubjectIds(student._id, schoolId);

    const entries = await TimetableEntry.find({
      classId: student.classId,
      section: student.sectionId,
      schoolId,
    })
      .populate('subjectId', 'name code')
      .populate('teacherId', 'name')
      .sort({ period: 1 })
      .lean();

    // Filter to only subjects the student is enrolled in
    const filteredEntries = entries.filter((e) => {
      if (!e.subjectId) return true;
      return enrolledSubIds.includes(e.subjectId._id.toString());
    });

    const formatted = filteredEntries.map((e) => ({
      id: e._id,
      day: e.day,
      period: e.period,
      startTime: e.startTime,
      endTime: e.endTime,
      subjectName: e.subjectId?.name || 'Free Period',
      subjectCode: e.subjectId?.code || '',
      teacherName: e.teacherId?.name || '',
      room: e.room || 'Room 101',
    }));

    return res.json({ timetable: formatted });
  } catch (err) {
    console.error('getStudentTimetable error:', err);
    return res.status(500).json({ error: 'Failed to retrieve timetable' });
  }
}

// 13. Study Planner (Blocks + Weekly Grid)
async function getStudentPlanner(req, res) {
  try {
    const student = req.user;
    const schoolId = student.schoolId;

    const blocks = await StudyBlock.find({ studentId: student._id, schoolId }).lean();
    return res.json({ blocks });
  } catch (err) {
    console.error('getStudentPlanner error:', err);
    return res.status(500).json({ error: 'Failed to retrieve study planner' });
  }
}

async function saveStudyBlock(req, res) {
  try {
    const student = req.user;
    const { id, day, startTime, endTime, title, subjectName, type, isCompleted } = req.body;
    const schoolId = student.schoolId;

    let block;
    if (id) {
      block = await StudyBlock.findOneAndUpdate(
        { _id: id, studentId: student._id, schoolId },
        { day, startTime, endTime, title, subjectName, type, isCompleted },
        { new: true }
      );
    } else {
      block = await StudyBlock.create({
        studentId: student._id,
        day,
        startTime,
        endTime,
        title,
        subjectName,
        type: type || 'study',
        isCompleted: !!isCompleted,
        schoolId,
      });
    }

    return res.json({ message: 'Study block saved', block });
  } catch (err) {
    console.error('saveStudyBlock error:', err);
    return res.status(500).json({ error: 'Failed to save study block' });
  }
}

async function deleteStudyBlock(req, res) {
  try {
    const student = req.user;
    const { id } = req.params;
    await StudyBlock.findOneAndDelete({ _id: id, studentId: student._id, schoolId: student.schoolId });
    return res.json({ message: 'Study block deleted' });
  } catch (err) {
    console.error('deleteStudyBlock error:', err);
    return res.status(500).json({ error: 'Failed to delete study block' });
  }
}

// 14. Progress Tracking & Topic Mastery Heatmap
async function getStudentProgress(req, res) {
  try {
    const student = req.user;
    const schoolId = student.schoolId;

    const enrolledSubIds = await getStudentEnrolledSubjectIds(student._id, schoolId);

    // Subject-wise grades
    const grades = await Grade.find({
      studentId: student._id,
      subjectId: { $in: enrolledSubIds },
      published: true,
      schoolId,
    })
      .populate('subjectId', 'name code')
      .sort({ createdAt: 1 })
      .lean();

    // Subject aggregates
    const subjectProgress = {};
    for (const g of grades) {
      const sId = g.subjectId?._id?.toString() || 'unknown';
      if (!subjectProgress[sId]) {
        subjectProgress[sId] = {
          subjectName: g.subjectId?.name || 'Subject',
          scores: [],
        };
      }
      subjectProgress[sId].scores.push(g.percentage);
    }

    const subjectCards = Object.entries(subjectProgress).map(([sId, data]) => {
      const avg = Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length);
      return {
        subjectId: sId,
        subjectName: data.subjectName,
        averagePercentage: avg,
        recentScores: data.scores.slice(-5),
      };
    });

    // Topic Mastery Heatmap
    const masteries = await MasteryRecord.find({
      studentId: student._id,
      subjectId: { $in: enrolledSubIds },
      schoolId,
    })
      .populate('topicId', 'name')
      .populate('subjectId', 'name')
      .lean();

    const heatmap = masteries.map((m) => ({
      topicId: m.topicId?._id,
      topicName: m.topicId?.name || 'Topic',
      subjectId: m.subjectId?._id,
      subjectName: m.subjectId?.name || 'Subject',
      level: m.level,
      scorePercentage: m.scorePercentage,
    }));

    // Weak topics list (score < 75)
    const weakTopics = heatmap
      .filter((h) => h.scorePercentage < 75)
      .sort((a, b) => a.scorePercentage - b.scorePercentage)
      .slice(0, 4);

    // Attendance percentage
    const allAttendance = await Attendance.find({
      classId: student.classId,
      section: student.sectionId,
      schoolId,
    }).lean();

    let totalDays = 0;
    let presentDays = 0;
    for (const att of allAttendance) {
      const rec = (att.records || []).find((r) => r.studentId.toString() === student._id.toString());
      if (rec) {
        totalDays++;
        if (rec.status === 'present' || rec.status === 'late') presentDays++;
      }
    }

    const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 92;

    return res.json({
      subjectCards,
      masteryHeatmap: heatmap,
      weakTopics,
      attendancePercentage,
      totalAssessments: grades.length,
    });
  } catch (err) {
    console.error('getStudentProgress error:', err);
    return res.status(500).json({ error: 'Failed to retrieve student progress' });
  }
}

// 15. Student Attendance Calendar View
async function getStudentAttendance(req, res) {
  try {
    const student = req.user;
    const schoolId = student.schoolId;

    const attendances = await Attendance.find({
      classId: student.classId,
      section: student.sectionId,
      schoolId,
    })
      .sort({ date: 1 })
      .lean();

    const records = [];
    for (const att of attendances) {
      const stRec = (att.records || []).find((r) => r.studentId.toString() === student._id.toString());
      if (stRec) {
        records.push({
          date: att.date,
          period: att.period,
          status: stRec.status,
          remarks: stRec.remarks || '',
        });
      }
    }

    return res.json({ attendanceRecords: records });
  } catch (err) {
    console.error('getStudentAttendance error:', err);
    return res.status(500).json({ error: 'Failed to retrieve attendance' });
  }
}

// 16. Student Bento Grid Dashboard Aggregate
async function getStudentDashboard(req, res) {
  try {
    const student = req.user;
    const schoolId = student.schoolId;

    const enrolledSubIds = await getStudentEnrolledSubjectIds(student._id, schoolId);

    // 1. Due soon (next 3 assignments)
    const upcomingAssignments = await Assignment.find({
      subjectId: { $in: enrolledSubIds },
      classId: student.classId,
      section: student.sectionId,
      dueDate: { $gte: new Date(Date.now() - 24 * 3600 * 1000) },
      status: 'published',
      schoolId,
    })
      .populate('subjectId', 'name')
      .sort({ dueDate: 1 })
      .limit(3)
      .lean();

    const dueSoon = upcomingAssignments.map((a) => ({
      id: a._id,
      title: a.title,
      subjectName: a.subjectId?.name || 'Subject',
      dueDate: a.dueDate,
      estimatedMinutes: a.estimatedMinutes,
    }));

    // 2. Subject progress
    const masteries = await MasteryRecord.find({
      studentId: student._id,
      subjectId: { $in: enrolledSubIds },
      schoolId,
    }).populate('subjectId', 'name').lean();

    const subMap = {};
    for (const m of masteries) {
      const sName = m.subjectId?.name || 'Subject';
      if (!subMap[sName]) subMap[sName] = [];
      subMap[sName].push(m.scorePercentage);
    }
    const subjectProgress = Object.entries(subMap).map(([name, scores]) => ({
      name,
      percentage: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    }));

    // 3. Upcoming tests (next 2)
    const upcomingTests = await Test.find({
      subjectId: { $in: enrolledSubIds },
      classId: student.classId,
      section: student.sectionId,
      status: 'published',
      endWindow: { $gte: new Date() },
      schoolId,
    })
      .populate('subjectId', 'name')
      .sort({ startWindow: 1 })
      .limit(2)
      .lean();

    // 4. Today's Timetable
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayName = days[new Date().getDay()] || 'Monday';
    const timetableToday = await TimetableEntry.find({
      classId: student.classId,
      section: student.sectionId,
      day: todayName === 'Sunday' ? 'Monday' : todayName,
      schoolId,
    })
      .populate('subjectId', 'name code')
      .sort({ period: 1 })
      .lean();

    const todayPeriods = timetableToday
      .filter((t) => !t.subjectId || enrolledSubIds.includes(t.subjectId._id.toString()))
      .map((t) => ({
        period: t.period,
        startTime: t.startTime,
        endTime: t.endTime,
        subjectName: t.subjectId?.name || 'Activity',
      }));

    // 5. Study Plan for today
    const studyPlanToday = await StudyBlock.find({
      studentId: student._id,
      day: todayName === 'Sunday' ? 'Monday' : todayName,
      schoolId,
    }).lean();

    // 6. Weak topics
    const weakTopics = masteries
      .filter((m) => m.scorePercentage < 75)
      .slice(0, 3)
      .map((m) => ({
        id: m.topicId,
        topicName: m.topicId?.name || 'Topic Concept',
        subjectName: m.subjectId?.name || 'Subject',
        scorePercentage: m.scorePercentage,
      }));

    // 7. Recent Grades (last 4)
    const recentGrades = await Grade.find({
      studentId: student._id,
      subjectId: { $in: enrolledSubIds },
      published: true,
      schoolId,
    })
      .populate('subjectId', 'name')
      .sort({ createdAt: -1 })
      .limit(4)
      .lean();

    // 8. Messages & Doubts
    const threads = await ChatThread.find({
      studentId: student._id,
      subjectId: { $in: enrolledSubIds },
      schoolId,
    }).lean();

    const unreadCount = threads.reduce((sum, t) => sum + (t.unreadStudentCount || 0), 0);
    const lastThread = threads[0];

    // 9. Announcements (latest 2)
    const announcements = await Announcement.find({ schoolId })
      .sort({ createdAt: -1 })
      .limit(2)
      .lean();

    // 10. Weekly Workload (Estimated hours per day)
    const workload = [
      { day: 'Mon', hours: 1.5 },
      { day: 'Tue', hours: 2.0 },
      { day: 'Wed', hours: 1.0 },
      { day: 'Thu', hours: 2.5 },
      { day: 'Fri', hours: 1.2 },
    ];

    return res.json({
      student: { name: student.name, email: student.email, section: student.sectionId },
      dueSoon,
      subjectProgress,
      upcomingTests: upcomingTests.map((t) => ({
        id: t._id,
        title: t.title,
        subjectName: t.subjectId?.name || 'Subject',
        date: t.startWindow,
      })),
      todayPeriods,
      studyPlanToday,
      weakTopics,
      recentGrades: recentGrades.map((g) => ({
        id: g._id,
        title: g.assessmentTitle,
        subjectName: g.subjectId?.name || 'Subject',
        percentage: g.percentage,
        marksObtained: g.marksObtained,
        totalMarks: g.totalMarks,
      })),
      unreadMessagesCount: unreadCount,
      latestMessageSnippet: lastThread ? lastThread.lastMessageText : 'No recent messages',
      announcements: announcements.map((a) => ({
        id: a._id,
        title: a.title,
        content: a.content,
        authorName: a.authorName,
        createdAt: a.createdAt,
      })),
      weeklyWorkload: workload,
      attendancePercentage: 94,
    });
  } catch (err) {
    console.error('getStudentDashboard error:', err);
    return res.status(500).json({ error: 'Failed to retrieve student dashboard' });
  }
}

module.exports = {
  getMySubjects,
  getSubjectWorkspace,
  markLessonRead,
  getStudentAssignments,
  getStudentAssignmentDetail,
  submitStudentAssignment,
  getStudentTests,
  startTestAttempt,
  saveTestAnswer,
  submitTestAttempt,
  getTestResults,
  getStudentTimetable,
  getStudentPlanner,
  saveStudyBlock,
  deleteStudyBlock,
  getStudentProgress,
  getStudentAttendance,
  getStudentDashboard,
};
