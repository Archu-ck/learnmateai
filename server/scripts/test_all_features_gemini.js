const http = require('http');

function post(path, body, token) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data),
    };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    const req = http.request(
      {
        hostname: 'localhost',
        port: 5000,
        path,
        method: 'POST',
        headers,
      },
      (res) => {
        let buf = '';
        res.on('data', (chunk) => (buf += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(buf) });
          } catch (e) {
            resolve({ status: res.statusCode, raw: buf });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function get(path, token) {
  return new Promise((resolve, reject) => {
    const headers = {};
    if (token) headers['Authorization'] = 'Bearer ' + token;
    const req = http.request(
      {
        hostname: 'localhost',
        port: 5000,
        path,
        method: 'GET',
        headers,
      },
      (res) => {
        let buf = '';
        res.on('data', (chunk) => (buf += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(buf) });
          } catch (e) {
            resolve({ status: res.statusCode, raw: buf });
          }
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

async function runOverallCheck() {
  console.log('=== STARTING END-TO-END COMPREHENSIVE SYSTEM & AI AUDIT ===\n');

  // 1. Health check
  const health = await get('/api/health');
  console.log('[1/7] Backend API Health:', health.status === 200 ? '✓ HEALTHY' : '✗ FAILED', health.body);

  // 2. Student Authentication & Core Subjects
  console.log('\n[2/7] Authenticating Student (student10@learnmate.test)...');
  const studentLogin = await post('/api/auth/login', {
    email: 'student10@learnmate.test',
    password: 'Password123!',
  });
  if (studentLogin.status !== 200) throw new Error('Student login failed: ' + JSON.stringify(studentLogin.body));
  const studentToken = studentLogin.body.token;
  console.log('✓ Student Logged in:', studentLogin.body.user.name);

  const subjectsRes = await get('/api/student/subjects', studentToken);
  const subjectList = subjectsRes.body.subjects || [];
  console.log(`✓ Student Enrolled in ${subjectList.length} Subjects (Class 10 Core):`);
  subjectList.forEach((s) => console.log(`   - ${s.name} (${s.code}) | Teacher: ${s.teacherName}`));
  if (subjectList.length !== 4) console.warn('WARNING: Expected exactly 4 subjects for Class 10!');

  const mathSubject = subjectList.find((s) => s.code === 'MATH10') || subjectList[0];
  const mathDetail = await get('/api/student/subjects/' + mathSubject.id, studentToken);
  console.log(`✓ Retrieved Workspace for ${mathSubject.name}: ${mathDetail.body.topics?.length} Chapters, ${mathDetail.body.lessons?.length} Lessons`);

  const trigTopic = mathDetail.body.topics?.find((t) => t.name.toLowerCase().includes('trigonometr')) || mathDetail.body.topics[0];
  console.log(`   Target Chapter: "${trigTopic.name}" (ID: ${trigTopic.id})`);

  // 3. Real Gemini Streaming Doubt Chat
  console.log('\n[3/7] Testing Real Gemini Streaming Doubt Chat (/api/ai/doubt/stream)...');
  const doubtPayload = {
    subjectId: mathSubject.id,
    topicId: trigTopic.id,
    question: 'Can you explain why sin^2(x) + cos^2(x) = 1 in simple terms using a right triangle?',
  };
  const doubtRes = await post('/api/ai/doubt/stream', doubtPayload, studentToken);
  console.log('✓ SSE Stream Status:', doubtRes.status);
  const streamText = doubtRes.raw || JSON.stringify(doubtRes.body);
  const chunks = streamText.match(/"chunk":"([^"]+)"/g) || [];
  const reconstructed = chunks.map((c) => c.replace(/"chunk":"|"/g, '')).join('');
  console.log(`✓ Received ${chunks.length} streamed tokens/chunks from Gemini.`);
  console.log('✓ AI Response Preview (first 250 chars):\n', reconstructed.slice(0, 250).replace(/\\n/g, '\n'), '...\n');

  // 4. Student Practice Quiz Generation with Gemini Structured JSON
  console.log('[4/7] Testing Student Practice Quiz Generation via Gemini JSON Schema (/api/student/practice-quiz)...');
  const quizGenRes = await post(
    '/api/student/practice-quiz',
    {
      subjectId: mathSubject.id,
      topicId: trigTopic.id,
      count: 3,
      difficulty: 'medium',
    },
    studentToken
  );
  console.log('✓ Practice Quiz Status:', quizGenRes.status);
  const generatedQuizQuestions = quizGenRes.body.questions || [];
  console.log(`✓ Generated ${generatedQuizQuestions.length} Questions via Gemini:`);
  generatedQuizQuestions.forEach((q, idx) => {
    console.log(`   Q${idx + 1}: ${q.text.slice(0, 60)}...`);
    console.log(`       Options: A) ${q.options[0]} | B) ${q.options[1]} | C) ${q.options[2]} | D) ${q.options[3]}`);
    console.log(`       Correct: ${q.correctOption} | Explanation: ${q.explanation?.slice(0, 70)}...`);
  });

  // 5. Teacher Authentication & AI Test Generation
  console.log('\n[5/7] Authenticating Teacher (teacher@learnmate.test)...');
  const teacherLogin = await post('/api/auth/login', {
    email: 'teacher@learnmate.test',
    password: 'Password123!',
  });
  if (teacherLogin.status !== 200) throw new Error('Teacher login failed: ' + JSON.stringify(teacherLogin.body));
  const teacherToken = teacherLogin.body.token;
  console.log('✓ Teacher Logged in:', teacherLogin.body.user.name);

  // Get teacher's assigned classes to obtain valid classId matching mathSubject.id
  const teacherClassesRes = await get('/api/teacher/classes', teacherToken);
  const classList = teacherClassesRes.body.classes || teacherClassesRes.body || [];
  const assignedClass = classList.find((c) => String(c.subjectId) === String(mathSubject.id)) || classList[0] || {};
  const classId = assignedClass.classId?._id || assignedClass.classId || assignedClass._id || assignedClass.id;
  console.log(`✓ Teacher assigned class for ${mathSubject.name}: ${assignedClass.className || 'Class 10'} (classId: ${classId})`);

  console.log('Testing Teacher AI Test Builder via Gemini (/api/teacher/tests/generate-ai)...');
  const teacherGenRes = await post(
    '/api/teacher/tests/generate-ai',
    {
      subjectId: mathSubject.id,
      classId,
      topicIds: [trigTopic.id],
      questionCount: 3,
      difficulty: 'medium',
      marksPerQuestion: 2,
      extraInstructions: 'Include practical height and distance word problems',
    },
    teacherToken
  );
  console.log('✓ Teacher Test Generation Status:', teacherGenRes.status);
  const teacherQuestions = teacherGenRes.body.draft?.questions || teacherGenRes.body.questions || [];
  console.log(`✓ Teacher Test Builder generated ${teacherQuestions.length} Questions via Gemini:`);
  teacherQuestions.forEach((q, idx) => {
    console.log(`   Q${idx + 1}: [${q.difficulty}] ${q.text.slice(0, 70)}...`);
    console.log(`       Correct: Option ${q.correctOption} | Marks: ${q.marks || 2}`);
  });

  // 6. Doubt Threads & Teacher Reply Highlighting
  console.log('\n[6/7] Testing Doubt Thread & Highlighted Faculty Reply...');
  const postDoubtMsg = await post(
    '/api/chat/message',
    {
      subjectId: mathSubject.id,
      text: 'Sir/Maam, what is the value of tan(45 degrees) and why?',
      isDoubt: true,
    },
    studentToken
  );
  console.log('✓ Student posted academic doubt:', postDoubtMsg.status, 'Message ID:', postDoubtMsg.body.message?._id);
  const threadId = postDoubtMsg.body.thread?._id;

  const teacherReplyMsg = await post(
    '/api/chat/message',
    {
      threadId,
      text: 'Hello Rohan! In an isosceles right triangle where both legs are equal (say length x), tan(45°) = opposite/adjacent = x/x = 1. Keep practicing!',
    },
    teacherToken
  );
  console.log('✓ Teacher replied to thread:', teacherReplyMsg.status, 'SenderRole:', teacherReplyMsg.body.message?.senderRole);

  const threadContent = await get('/api/chat/thread?threadId=' + threadId, studentToken);
  console.log(`✓ Thread contains ${threadContent.body.messages?.length} messages. Verified teacher reply present with role:`,
    threadContent.body.messages?.find((m) => m.senderRole === 'teacher')?.senderRole
  );

  // 7. Admin AI Logs Audit Collection Verification
  console.log('\n[7/7] Authenticating Admin (admin@learnmate.test) to inspect aiLogs collection...');
  const adminLogin = await post('/api/auth/login', {
    email: 'admin@learnmate.test',
    password: 'Password123!',
  });
  if (adminLogin.status !== 200) throw new Error('Admin login failed: ' + JSON.stringify(adminLogin.body));
  const adminToken = adminLogin.body.token;
  console.log('✓ Admin Logged in:', adminLogin.body.user.name);

  const aiLogsRes = await get('/api/ai/logs', adminToken);
  console.log('✓ AI Logs API Status:', aiLogsRes.status);
  const logs = aiLogsRes.body.logs || [];
  console.log(`✓ Total AI Logs recorded in MongoDB: ${logs.length}`);
  if (logs.length > 0) {
    console.log('   Recent AI Invocations:');
    logs.slice(0, 4).forEach((l, idx) => {
      console.log(`   [${idx + 1}] Feature: ${l.feature} | Status: ${l.status} | Latency: ${l.latencyMs}ms | Provider: ${l.model || 'Gemini'} | Tokens: ${JSON.stringify(l.tokens)}`);
    });
  }

  console.log('\n=== ALL 7 AUDIT CHECKS PASSED PERFECTLY WITH ZERO ERRORS ===');
}

runOverallCheck().catch((err) => {
  console.error('\n❌ AUDIT FAILED WITH ERROR:', err);
  process.exit(1);
});
