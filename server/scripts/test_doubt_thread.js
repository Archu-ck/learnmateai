const http = require('http');

function post(path, body, token) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path,
      method: 'POST',
      headers
    }, res => {
      let buf = '';
      res.on('data', chunk => buf += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(buf) }));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function get(path, token) {
  return new Promise((resolve, reject) => {
    const headers = {};
    if (token) headers['Authorization'] = 'Bearer ' + token;
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path,
      method: 'GET',
      headers
    }, res => {
      let buf = '';
      res.on('data', chunk => buf += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(buf) }));
    });
    req.on('error', reject);
    req.end();
  });
}

async function run() {
  console.log('1. Logging in as student (student10@learnmate.test)...');
  const studentLogin = await post('/api/auth/login', {
    email: 'student10@learnmate.test',
    password: 'Password123!'
  });
  const studentToken = studentLogin.body.token;
  console.log('Student logged in:', studentLogin.body.user.name);

  console.log('2. Logging in as teacher (teacher@learnmate.test)...');
  const teacherLogin = await post('/api/auth/login', {
    email: 'teacher@learnmate.test',
    password: 'Password123!'
  });
  const teacherToken = teacherLogin.body.token;
  console.log('Teacher logged in:', teacherLogin.body.user.name);

  console.log('3. Fetching student subjects...');
  const subjects = await get('/api/student/subjects', studentToken);
  const mathSubject = subjects.body.subjects.find(s => s.code === 'MATH10');
  console.log('Math subject:', mathSubject.id, mathSubject.name);

  console.log('4. Student posting a Doubt in Math...');
  const doubtRes = await post('/api/chat/message', {
    subjectId: mathSubject.id,
    text: "Ma'am, in Trigonometry, how do we prove that sin^2(theta) + cos^2(theta) = 1 using Pythagoras theorem?",
    isDoubt: true
  }, studentToken);
  console.log('Doubt posted! Status:', doubtRes.status, 'Message ID:', doubtRes.body.message._id);
  const threadId = doubtRes.body.thread._id;

  console.log('5. Teacher replying to Doubt in thread ' + threadId + '...');
  const replyRes = await post('/api/chat/message', {
    threadId,
    text: "Excellent doubt Rohan! By Pythagoras theorem in a right triangle: a^2 + b^2 = c^2. Dividing by c^2 yields (a/c)^2 + (b/c)^2 = 1. Since sin(theta)=a/c and cos(theta)=b/c, sin^2(theta)+cos^2(theta)=1. Try applying this to Exercise 8.4!"
  }, teacherToken);
  console.log('Teacher reply posted! Status:', replyRes.status, 'SenderRole:', replyRes.body.message.senderRole);

  console.log('6. Student fetching thread messages...');
  const threadRes = await get('/api/chat/thread?threadId=' + threadId, studentToken);
  console.log('Messages retrieved:', threadRes.body.messages.length);
  for (const m of threadRes.body.messages) {
    console.log(`- [${m.senderRole.toUpperCase()}] isDoubt=${m.isDoubt}: ${m.text.slice(0, 70)}...`);
  }
  console.log('--- Verification complete: Doubt thread and teacher reply successful! ---');
}

run().catch(console.error);
