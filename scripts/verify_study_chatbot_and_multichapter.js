const http = require('http');

function post(urlStr, data, token) {
  const url = new URL(urlStr);
  const postData = JSON.stringify(data);
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(body) });
          } catch {
            resolve({ status: res.statusCode, raw: body });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function postStream(urlStr, data, token) {
  const url = new URL(urlStr);
  const postData = JSON.stringify(data);
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
      (res) => {
        let streamOutput = '';
        res.on('data', (chunk) => {
          streamOutput += chunk.toString();
        });
        res.on('end', () => {
          resolve({ status: res.statusCode, raw: streamOutput });
        });
      }
    );
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function get(urlStr, token) {
  const url = new URL(urlStr);
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: 'GET',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(body) });
          } catch {
            resolve({ status: res.statusCode, raw: body });
          }
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

function parseSSE(raw) {
  const lines = raw.split('\n');
  let text = '';
  for (const line of lines) {
    if (line.startsWith('data: ') && !line.includes('[DONE]')) {
      try {
        const json = JSON.parse(line.replace('data: ', ''));
        if (json.chunk) text += json.chunk;
      } catch {}
    }
  }
  return text;
}

async function runVerification() {
  console.log('=== VERIFYING STUDY-ONLY CHATBOT AND MULTI-CHAPTER AUTO TEST GENERATION ===');

  // 1. Login as Student
  const studentLogin = await post('http://localhost:5000/api/auth/login', {
    email: 'student10@learnmate.test',
    password: 'Password123!',
  });
  if (studentLogin.status !== 200) {
    throw new Error('Student login failed: ' + JSON.stringify(studentLogin.data));
  }
  const studentToken = studentLogin.data.token;
  console.log('✓ Student logged in:', studentLogin.data.user.name);

  // 2. Login as Teacher
  const teacherLogin = await post('http://localhost:5000/api/auth/login', {
    email: 'teacher@learnmate.test',
    password: 'Password123!',
  });
  if (teacherLogin.status !== 200) {
    throw new Error('Teacher login failed: ' + JSON.stringify(teacherLogin.data));
  }
  const teacherToken = teacherLogin.data.token;
  console.log('✓ Teacher logged in:', teacherLogin.data.user.name);

  // 3. Get Student's Subjects & Topics (Class 10)
  const studentSubjects = await get('http://localhost:5000/api/student/subjects', studentToken);
  const mathSub = studentSubjects.data.subjects.find((s) => s.code === 'MATH10');
  if (!mathSub) throw new Error('MATH10 not found for student');
  console.log('✓ Found Class 10 Maths subject:', mathSub.id, mathSub.name);

  const mathDetail = await get(`http://localhost:5000/api/student/subjects/${mathSub.id}`, studentToken);
  const mathTopics = mathDetail.data.topics || [];
  console.log('✓ Available Chapters in Maths:', mathTopics.map((t) => t.name).join(' | '));
  if (mathTopics.length < 2) throw new Error('Need at least 2 chapters in Maths for multi-chapter test');

  // 4. Test Chatbot Guardrail - Off-Topic Rejection
  console.log('\n--- 4. Testing Chatbot Academic Guardrail (Off-Topic Refusal) ---');
  const offTopicStream = await postStream(
    'http://localhost:5000/api/ai/doubt/stream',
    {
      subjectId: mathSub.id,
      question: 'What is your favorite video game to play on weekends?',
    },
    studentToken
  );
  const offTopicText = parseSSE(offTopicStream.raw);
  console.log('Off-topic assembled response:\n"' + offTopicText + '"');
  const isRefusal = /only able to help with your school studies|LearnMate Academic Tutor|focus on your learning/i.test(
    offTopicText
  );
  if (!isRefusal) {
    throw new Error('Off-topic question was not politely refused by the study guardrail!');
  }
  console.log('✓ Off-topic query successfully caught and redirected to academic syllabus!');

  // 5. Test Chatbot Academic Query - Study Help Allowed
  console.log('\n--- 5. Testing Chatbot Academic Query (Study Help Allowed) ---');
  const studyStream = await postStream(
    'http://localhost:5000/api/ai/doubt/stream',
    {
      subjectId: mathSub.id,
      question: 'How do I find the discriminant of 2x^2 - 4x + 2 = 0?',
    },
    studentToken
  );
  const studyText = parseSSE(studyStream.raw);
  console.log('Study assembled response:\n"' + studyText + '"');
  const isStudyHelp = /formula|discriminant|step|equation|let/i.test(studyText);
  if (!isStudyHelp) {
    throw new Error('Academic query failed to receive educational guidance!');
  }
  console.log('✓ Academic study question properly answered with step-by-step guidance!');

  // 6. Test Teacher Auto Test Generator with MULTIPLE CHAPTERS
  console.log('\n--- 6. Testing Teacher Auto Test Generator (Multi-Chapter Selection) ---');
  const teacherClasses = await get('http://localhost:5000/api/teacher/classes', teacherToken);
  const mathClass = teacherClasses.data.classes.find((c) => c.subjectCode === 'MATH10');
  if (!mathClass) throw new Error('Teacher MATH10 class assignment not found');

  const selectedTwoChapterIds = [mathTopics[0].id, mathTopics[1].id];
  const selectedTwoChapterNames = [mathTopics[0].name, mathTopics[1].name];
  console.log('Generating teacher test covering 2 chapters:', selectedTwoChapterNames);

  const genTestRes = await post(
    'http://localhost:5000/api/teacher/tests/generate-ai',
    {
      subjectId: mathClass.subjectId,
      classId: mathClass.classId,
      topicIds: selectedTwoChapterIds,
      questionCount: 6,
      difficulty: 'medium',
      marksPerQuestion: 2,
    },
    teacherToken
  );

  if (genTestRes.status !== 200 || !genTestRes.data.questions) {
    throw new Error('Failed to generate test: ' + JSON.stringify(genTestRes.data));
  }

  const generatedQuestions = genTestRes.data.questions;
  console.log(`✓ AI generated ${generatedQuestions.length} questions for teacher.`);
  const questionsTopics = generatedQuestions.map((q) => q.topic);
  console.log('Topics assigned to questions:', questionsTopics);

  const hasTopic1 = questionsTopics.some((t) => t && t.includes(selectedTwoChapterNames[0]));
  const hasTopic2 = questionsTopics.some((t) => t && t.includes(selectedTwoChapterNames[1]));

  if (!hasTopic1 || !hasTopic2) {
    throw new Error(`Questions did not cover both selected chapters! Found topics: ${questionsTopics.join(', ')}`);
  }
  console.log('✓ Teacher test questions successfully distributed across both selected chapters!');

  // 7. Test Student Practice Quiz with MULTIPLE CHAPTERS
  console.log('\n--- 7. Testing Student Practice Quiz (Multi-Chapter Selection) ---');
  const practiceRes = await post(
    'http://localhost:5000/api/student/practice-quiz',
    {
      subjectId: mathSub.id,
      topicIds: selectedTwoChapterIds,
      count: 4,
      difficulty: 'medium',
    },
    studentToken
  );

  if (practiceRes.status !== 200 || !practiceRes.data.questions) {
    throw new Error('Failed to generate student practice quiz: ' + JSON.stringify(practiceRes.data));
  }

  const practiceQuestions = practiceRes.data.questions;
  console.log(`✓ AI generated ${practiceQuestions.length} practice questions for student.`);
  const practiceTopics = practiceQuestions.map((q) => q.topic);
  console.log('Topics assigned to practice questions:', practiceTopics);

  const practiceHasTopic1 = practiceTopics.some((t) => t && t.includes(selectedTwoChapterNames[0]));
  const practiceHasTopic2 = practiceTopics.some((t) => t && t.includes(selectedTwoChapterNames[1]));

  if (!practiceHasTopic1 || !practiceHasTopic2) {
    throw new Error(`Practice questions did not cover both selected chapters! Found: ${practiceTopics.join(', ')}`);
  }
  console.log('✓ Student practice quiz successfully generated across multiple selected chapters!');

  // 8. Submit practice quiz and verify mastery updates
  console.log('\n--- 8. Testing Student Practice Quiz Submission & Mastery Update ---');
  const submitPractice = await post(
    'http://localhost:5000/api/student/practice-quiz/submit',
    {
      subjectId: mathSub.id,
      topicNames: selectedTwoChapterNames,
      totalQuestions: 4,
      correctCount: 4,
    },
    studentToken
  );

  if (submitPractice.status !== 200 || !submitPractice.data.success) {
    throw new Error('Practice submission failed: ' + JSON.stringify(submitPractice.data));
  }
  console.log('✓ Practice submission success:', submitPractice.data.message);
  console.log('✓ Updated mastery summary:', submitPractice.data.updatedMastery);

  console.log('\n======================================================');
  console.log('ALL VERIFICATION CHECKS PASSED WITH 100% SUCCESS!');
  console.log('======================================================');
}

runVerification().catch((err) => {
  console.error('VERIFICATION ERROR:', err);
  process.exit(1);
});
