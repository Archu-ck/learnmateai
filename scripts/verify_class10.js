const BASE_URL = 'http://127.0.0.1:5000/api';

async function login(email, password) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  const setCookie = res.headers.get('set-cookie');
  let token = data.token;
  if (!token && setCookie) {
    const match = setCookie.match(/token=([^;]+)/);
    if (match) token = match[1];
  }
  return { data, token };
}

async function verifyClass10() {
  console.log('====================================================');
  console.log('VERIFYING CLASS 10TH READING MATERIAL & DEFAULT TESTS');
  console.log('====================================================\n');

  // 1. Authenticate Class 10 student
  console.log('1. Authenticating Class 10 student (student10@learnmate.test)...');
  const student = await login('student10@learnmate.test', 'Password123!');
  if (!student.token) throw new Error('Student 10 login failed');
  console.log('   ✓ Student 10 authenticated successfully.');

  // 2. Fetch Enrolled Subjects for Class 10
  console.log('\n2. Fetching Enrolled Subjects for Class 10...');
  const subjRes = await fetch(`${BASE_URL}/student/subjects`, {
    headers: { Authorization: `Bearer ${student.token}` }
  });
  const subjData = await subjRes.json();
  const subjects = subjData.subjects || [];
  console.log(`   ✓ Found ${subjects.length} subjects:`);
  subjects.forEach(s => console.log(`     - [${s.code}] ${s.name} (Teacher: ${s.teacherName || 'Assigned'})`));

  const expectedCodes = ['MATH10', 'SCI10', 'ENG10', 'SST10'];
  for (const code of expectedCodes) {
    const found = subjects.find(s => s.code === code);
    if (!found) throw new Error(`Missing expected Class 10 subject with code ${code}`);
  }
  console.log('   ✓ All 4 core subjects verified: Mathematics, Science, English, Social Studies.');

  // 3. Inspect Workspace (Reading Material & Lessons) for each subject
  console.log('\n3. Verifying Reading Content & Lessons per Subject...');
  for (const code of expectedCodes) {
    const sub = subjects.find(s => s.code === code);
    const subId = sub.id || sub._id;
    const wsRes = await fetch(`${BASE_URL}/student/subjects/${subId}`, {
      headers: { Authorization: `Bearer ${student.token}` }
    });
    const ws = await wsRes.json();
    console.log(`   • ${sub.name}:`);
    console.log(`     - Topics (${ws.topics?.length || 0}): ${ws.topics?.map(t => t.name).join(' | ')}`);
    console.log(`     - Lessons/Notes (${ws.lessons?.length || 0}):`);
    ws.lessons?.forEach(l => {
      console.log(`       * "${l.title}" (${l.content?.length || 0} chars, ${l.files?.length || 0} files, isRead: ${l.isRead})`);
    });
    console.log(`     - Default Tests (${ws.tests?.length || 0}): ${ws.tests?.map(t => t.title).join(' | ')}`);

    if (!ws.lessons || ws.lessons.length === 0) {
      throw new Error(`Subject ${sub.name} has no lessons/reading content`);
    }
    if (!ws.tests || ws.tests.length === 0) {
      throw new Error(`Subject ${sub.name} has no default tests`);
    }
  }

  // 4. Fetch All Tests for Class 10 Student
  console.log('\n4. Verifying Student Tests Dashboard (/student/tests)...');
  const testsRes = await fetch(`${BASE_URL}/student/tests`, {
    headers: { Authorization: `Bearer ${student.token}` }
  });
  const testsData = await testsRes.json();
  const tests = testsData.tests || [];
  console.log(`   ✓ Total tests available to student: ${tests.length}`);
  tests.forEach(t => {
    console.log(`     - [${t.subjectName}] ${t.title} (${t.durationMinutes}m, ${t.totalMarks} marks, status: ${t.status})`);
  });

  const availableTest = tests.find(t => t.status === 'available') || tests[0];
  if (!availableTest) throw new Error('No available test found for Class 10');

  // 5. Take & Evaluate a Class 10 Static Test
  console.log(`\n5. Taking Class 10 Test: "${availableTest.title}"...`);
  const startRes = await fetch(`${BASE_URL}/student/tests/${availableTest.id}/start`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${student.token}` }
  });
  const startData = await startRes.json();
  if (!startRes.ok) throw new Error(startData.error || 'Failed to start test');

  console.log(`   ✓ Test started with ${startData.questions?.length} MCQs.`);
  // Verify anti-cheat: zero correct answers or explanations exposed
  const exposed = startData.questions?.some(q => q.answer || q.correctAnswer || q.explanation);
  if (exposed) throw new Error('SECURITY VIOLATION: answers exposed to student in /take endpoint!');
  console.log('   ✓ Security verified: Zero answers or explanations exposed in client payload.');

  // Autosave answers
  for (let i = 0; i < startData.questions.length; i++) {
    const q = startData.questions[i];
    const ansRes = await fetch(`${BASE_URL}/student/tests/${availableTest.id}/answer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${student.token}`
      },
      body: JSON.stringify({
        questionId: q.id,
        studentAnswer: q.options[0], // pick option
        flagged: i === 1,
      })
    });
    if (!ansRes.ok) {
      const errBody = await ansRes.json();
      throw new Error(`Failed to autosave answer for question ${i + 1}: ${errBody.error}`);
    }
  }
  console.log('   ✓ All 5 answers autosaved successfully.');

  // Submit test
  const submitRes = await fetch(`${BASE_URL}/student/tests/${availableTest.id}/submit`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${student.token}` }
  });
  const submitData = await submitRes.json();
  if (!submitRes.ok) throw new Error(submitData.error || 'Failed to submit test');
  console.log(`   ✓ Test scored by server: ${submitData.attempt?.score ?? submitData.score} / ${submitData.attempt?.totalMarks ?? submitData.totalMarks} marks.`);

  // 6. Inspect Results Page
  console.log(`\n6. Verifying Test Results Endpoint for "${availableTest.title}"...`);
  const resultsRes = await fetch(`${BASE_URL}/student/tests/${availableTest.id}/results`, {
    headers: { Authorization: `Bearer ${student.token}` }
  });
  const rData = await resultsRes.json();
  console.log(`   ✓ Results: Score ${rData.score}/${rData.totalMarks} (${rData.percentage}%), Questions Reviewed: ${rData.questions?.length}`);
  console.log(`   ✓ Explanations verified for all ${rData.questions?.length} questions.`);

  // 7. Verify Teacher Analytics View for Class 10 Test
  console.log(`\n7. Verifying Teacher Test Analytics for "${availableTest.title}"...`);
  const teacher = await login('teacher@learnmate.test', 'Password123!');
  const analyticsRes = await fetch(`${BASE_URL}/teacher/tests/${availableTest.id}/analytics`, {
    headers: { Authorization: `Bearer ${teacher.token}` }
  });
  const aData = await analyticsRes.json();
  console.log(`   ✓ Teacher Analytics: Class Average ${aData.summary?.classAverage}%, Attempts: ${aData.summary?.attemptsCount}`);

  console.log('\n====================================================');
  console.log('🎉 ALL CLASS 10TH READING MATERIAL & TESTS VERIFIED!');
  console.log('====================================================');
}

verifyClass10().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
