const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Class = require('./models/Class');
const Subject = require('./models/Subject');
const User = require('./models/User');
const TeacherAssignment = require('./models/TeacherAssignment');
const StudentSubject = require('./models/StudentSubject');
const Topic = require('./models/Topic');
const Lesson = require('./models/Lesson');
const Question = require('./models/Question');
const Test = require('./models/Test');
const TestAttempt = require('./models/TestAttempt');
const Grade = require('./models/Grade');
const MasteryRecord = require('./models/MasteryRecord');
const Announcement = require('./models/Announcement');

const SCHOOL_ID = process.env.SCHOOL_ID || 'school-default-01';

async function seedClass10() {
  console.log('--- Provisioning Class 10th Academic Ecosystem ---');

  const defaultUserHash = await bcrypt.hash('Password123!', 10);

  // 1. Provision Class 10
  const class10 = await Class.findOneAndUpdate(
    { name: 'Class 10', schoolId: SCHOOL_ID },
    { name: 'Class 10', sections: ['A', 'B'], academicYear: '2026-2027', schoolId: SCHOOL_ID },
    { upsert: true, new: true }
  );
  console.log('✓ Class 10 provisioned (Sections A & B).');

  // 2. Provision Teachers (Retrieve existing or create)
  const tMeera = await User.findOneAndUpdate(
    { email: 'teacher@learnmate.test' },
    { name: 'Meera Krishnan', email: 'teacher@learnmate.test', role: 'teacher', passwordHash: defaultUserHash, status: 'active', schoolId: SCHOOL_ID },
    { upsert: true, new: true }
  );

  const tRajesh = await User.findOneAndUpdate(
    { email: 'rajesh.v@learnmate.test' },
    { name: 'Rajesh Verma', email: 'rajesh.v@learnmate.test', role: 'teacher', passwordHash: defaultUserHash, status: 'active', schoolId: SCHOOL_ID },
    { upsert: true, new: true }
  );

  const tAnita = await User.findOneAndUpdate(
    { email: 'anita.d@learnmate.test' },
    { name: 'Anita Desai', email: 'anita.d@learnmate.test', role: 'teacher', passwordHash: defaultUserHash, status: 'active', schoolId: SCHOOL_ID },
    { upsert: true, new: true }
  );

  // 3. Provision Class 10 Dedicated Student
  const student10 = await User.findOneAndUpdate(
    { email: 'student10@learnmate.test' },
    {
      name: 'Rohan Joshi',
      email: 'student10@learnmate.test',
      role: 'student',
      admissionNo: 'ADM-2026-101',
      classId: class10._id,
      sectionId: 'A',
      passwordHash: defaultUserHash,
      status: 'active',
      mustChangePassword: false,
      schoolId: SCHOOL_ID,
    },
    { upsert: true, new: true }
  );

  const student10b = await User.findOneAndUpdate(
    { email: 'student10b@learnmate.test' },
    {
      name: 'Kavita Singhania',
      email: 'student10b@learnmate.test',
      role: 'student',
      admissionNo: 'ADM-2026-102',
      classId: class10._id,
      sectionId: 'B',
      passwordHash: defaultUserHash,
      status: 'active',
      mustChangePassword: false,
      schoolId: SCHOOL_ID,
    },
    { upsert: true, new: true }
  );

  // Also locate standard student account (student@learnmate.test)
  const defaultStudent = await User.findOne({ email: 'student@learnmate.test' });

  // 4. Provision the 4 Core Class 10 Subjects
  const class10SubjectsData = [
    { name: 'Mathematics (Class 10)', code: 'MATH10', isElective: false },
    { name: 'Science (Class 10)', code: 'SCI10', isElective: false },
    { name: 'English (Class 10)', code: 'ENG10', isElective: false },
    { name: 'Social Studies (Class 10)', code: 'SST10', isElective: false },
  ];

  const subjects = {};
  for (const s of class10SubjectsData) {
    const doc = await Subject.findOneAndUpdate(
      { code: s.code, schoolId: SCHOOL_ID },
      { name: s.name, code: s.code, isElective: false, classIds: [class10._id], schoolId: SCHOOL_ID },
      { upsert: true, new: true }
    );
    subjects[s.code] = doc;
  }
  console.log('✓ Class 10 Subjects created: Mathematics, Science, English, Social Studies.');

  const subMath = subjects['MATH10'];
  const subSci = subjects['SCI10'];
  const subEng = subjects['ENG10'];
  const subSst = subjects['SST10'];

  // 5. Register Teacher Assignments for Class 10
  const teacherAssignments = [
    { teacherId: tMeera._id, classId: class10._id, section: 'A', subjectId: subMath._id, isClassTeacher: true },
    { teacherId: tMeera._id, classId: class10._id, section: 'B', subjectId: subMath._id, isClassTeacher: false },
    { teacherId: tRajesh._id, classId: class10._id, section: 'A', subjectId: subSci._id, isClassTeacher: false },
    { teacherId: tRajesh._id, classId: class10._id, section: 'B', subjectId: subSci._id, isClassTeacher: true },
    { teacherId: tAnita._id, classId: class10._id, section: 'A', subjectId: subEng._id, isClassTeacher: false },
    { teacherId: tAnita._id, classId: class10._id, section: 'B', subjectId: subEng._id, isClassTeacher: false },
    { teacherId: tAnita._id, classId: class10._id, section: 'A', subjectId: subSst._id, isClassTeacher: false },
    { teacherId: tAnita._id, classId: class10._id, section: 'B', subjectId: subSst._id, isClassTeacher: false },
  ];

  for (const ta of teacherAssignments) {
    await TeacherAssignment.findOneAndUpdate(
      { teacherId: ta.teacherId, classId: ta.classId, section: ta.section, subjectId: ta.subjectId },
      { ...ta, schoolId: SCHOOL_ID },
      { upsert: true, new: true }
    );
  }
  console.log('✓ Teacher assignments registered for Class 10 (Meera, Rajesh, Anita).');

  // 6. Student Enrollments
  const targetStudents = [student10, student10b];
  if (defaultStudent) {
    defaultStudent.classId = class10._id;
    defaultStudent.sectionId = 'A';
    await defaultStudent.save();
    targetStudents.push(defaultStudent); // Set standard student to Class 10
  }

  const allClass10Subs = [subMath, subSci, subEng, subSst];
  for (const st of targetStudents) {
    // Ensure student only has the 4 Class 10 subjects
    await StudentSubject.deleteMany({
      studentId: st._id,
      subjectId: { $nin: allClass10Subs.map((s) => s._id) },
    });

    for (const sub of allClass10Subs) {
      await StudentSubject.findOneAndUpdate(
        { studentId: st._id, subjectId: sub._id },
        { studentId: st._id, subjectId: sub._id, classId: class10._id, isElective: false, schoolId: SCHOOL_ID },
        { upsert: true, new: true }
      );
    }
  }
  console.log(`✓ Enrolled ${targetStudents.length} students across Class 10 subjects.`);

  // 7. Topics for Class 10
  const topicsData = [
    // Mathematics
    { subjectId: subMath._id, name: 'Quadratic Equations & Discriminant', order: 1, description: 'Standard form ax² + bx + c = 0, roots nature and quadratic formula' },
    { subjectId: subMath._id, name: 'Arithmetic Progressions (AP)', order: 2, description: 'nth term formula, common difference, and sum of first n terms' },
    { subjectId: subMath._id, name: 'Introduction to Trigonometry', order: 3, description: 'Trigonometric ratios, standard angle values, and Pythagorean identities' },
    // Science
    { subjectId: subSci._id, name: 'Chemical Reactions & Equations', order: 1, description: 'Chemical balancing, 5 core reaction types, redox, and corrosion' },
    { subjectId: subSci._id, name: 'Life Processes: Nutrition & Respiration', order: 2, description: 'Human digestive system, aerobic/anaerobic respiration, and heart circulation' },
    { subjectId: subSci._id, name: 'Light — Reflection and Refraction', order: 3, description: 'Spherical mirror formulas, Snell’s law of refraction, and lens power' },
    // English
    { subjectId: subEng._id, name: 'First Flight: Prose & Critical Appreciation', order: 1, description: 'A Letter to God, Nelson Mandela: Long Walk to Freedom, and thematic analysis' },
    { subjectId: subEng._id, name: 'Writing Skills & Applied Grammar', order: 2, description: 'Analytical paragraph writing, reported speech rules, and formal modals' },
    // Social Studies (SST)
    { subjectId: subSst._id, name: 'History: The Rise of Nationalism in Europe', order: 1, description: 'French Revolution ideals, Napoleonic Civil Code of 1804, and Italian/German unification' },
    { subjectId: subSst._id, name: 'Geography: Resources & Sustainable Development', order: 2, description: 'Rio Summit 1992, Agenda 21, soil erosion conservation, and resource planning' },
    { subjectId: subSst._id, name: 'Political Science: Power Sharing', order: 3, description: 'Belgium accommodation model vs. Sri Lanka majoritarianism, prudential/moral reasons' },
    { subjectId: subSst._id, name: 'Economics: Understanding Development', order: 4, description: 'World Bank per capita income vs. UNDP Human Development Index (HDI) criteria' },
  ];

  const topicsMap = {};
  for (const td of topicsData) {
    const doc = await Topic.findOneAndUpdate(
      { subjectId: td.subjectId, name: td.name },
      { ...td, classId: class10._id, schoolId: SCHOOL_ID },
      { upsert: true, new: true }
    );
    topicsMap[`${td.subjectId}_${td.name}`] = doc;
  }
  console.log('✓ 12 Class 10 Syllabus Topics provisioned.');

  // 8. Rich Lessons & Reading Material
  const lessonsData = [
    // --- MATHEMATICS LESSONS ---
    {
      subjectId: subMath._id,
      topicId: topicsMap[`${subMath._id}_Quadratic Equations & Discriminant`]._id,
      title: 'Standard Quadratic Form & Quadratic Formula Mastery',
      content: `### Quadratic Equations — Comprehensive Study Guide

A quadratic equation in the variable $x$ is an algebraic equation of degree 2:
$$ax^2 + bx + c = 0 \\quad (a \\neq 0)$$

#### 1. The Quadratic Formula (Shreedharacharya's Rule)
For any quadratic equation $ax^2 + bx + c = 0$, the roots are given by:
$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$

#### 2. The Discriminant ($D = b^2 - 4ac$) & Nature of Roots:
- **Case 1: $D > 0$** $\\implies$ The equation has **two distinct real roots**:
  $$x_1 = \\frac{-b + \\sqrt{D}}{2a}, \\quad x_2 = \\frac{-b - \\sqrt{D}}{2a}$$
- **Case 2: $D = 0$** $\\implies$ The equation has **two equal real roots (coincident roots)**:
  $$x = -\\frac{b}{2a}$$
- **Case 3: $D < 0$** $\\implies$ The equation has **no real roots** (roots are complex/imaginary numbers).

#### 3. Step-by-Step Worked Example:
Solve $2x^2 - 5x + 3 = 0$:
1. Identify coefficients: $a = 2, b = -5, c = 3$.
2. Compute Discriminant: $D = (-5)^2 - 4(2)(3) = 25 - 24 = 1 > 0$ (Two distinct real roots).
3. Apply formula:
   $$x = \\frac{-(-5) \\pm \\sqrt{1}}{2(2)} = \\frac{5 \\pm 1}{4}$$
   $$x_1 = \\frac{6}{4} = \\frac{3}{2}, \\quad x_2 = \\frac{4}{4} = 1$$

> **Crucial Exam Tip**: When transposing terms across the equals sign, always reverse signs carefully. If $c$ is negative, $-4ac$ becomes a positive addition!`,
      files: [
        { name: 'Class10_Quadratic_Formula_Sheet.pdf', url: '/uploads/Class10_Quadratic_Formula_Sheet.pdf', type: 'application/pdf', size: 154200 },
        { name: 'NCERT_Chapter4_Worked_Solutions.pdf', url: '/uploads/NCERT_Chapter4_Worked_Solutions.pdf', type: 'application/pdf', size: 215000 },
      ],
      links: [
        { title: 'NCERT Class 10 Quadratic Equations Chapter', url: 'https://ncert.nic.in' },
        { title: 'Khan Academy: Quadratic Formula Practice', url: 'https://khanacademy.org' },
      ],
      order: 1,
    },
    {
      subjectId: subMath._id,
      topicId: topicsMap[`${subMath._id}_Quadratic Equations & Discriminant`]._id,
      title: 'Word Problems: Speed, Distance & River Motion Equations',
      content: `### Real-World Applications: Motion & Rate Problems

#### The Classic River Motion Model:
Let speed of the motorboat in still water = $x \\text{ km/h}$.
Speed of the water stream = $y \\text{ km/h}$ (where $x > y$).

- **Speed Upstream** (against the stream) = $(x - y) \\text{ km/h}$.
- **Speed Downstream** (along the stream) = $(x + y) \\text{ km/h}$.

$$\\text{Time} = \\frac{\\text{Distance}}{\\text{Speed}}$$
$$\\text{Total Time} = \\frac{d}{x - y} + \\frac{d}{x + y}$$

#### Model Problem:
A motorboat whose speed is $18 \\text{ km/h}$ in still water takes $1$ hour more to go $24 \\text{ km}$ upstream than to return downstream to the same spot. Find the speed of the stream.
- Time upstream: $t_1 = \\frac{24}{18 - y}$
- Time downstream: $t_2 = \\frac{24}{18 + y}$
- Equation: $\\frac{24}{18 - y} - \\frac{24}{18 + y} = 1$
- Simplifying: $24[(18 + y) - (18 - y)] = (18 - y)(18 + y) \\implies 48y = 324 - y^2$
- $y^2 + 48y - 324 = 0 \\implies (y + 54)(y - 6) = 0$
- Since stream speed cannot be negative, $y = 6 \\text{ km/h}$.`,
      files: [
        { name: 'Motion_Word_Problems_Handbook.pdf', url: '/uploads/Motion_Word_Problems_Handbook.pdf', type: 'application/pdf', size: 182000 },
      ],
      order: 2,
    },
    {
      subjectId: subMath._id,
      topicId: topicsMap[`${subMath._id}_Arithmetic Progressions (AP)`]._id,
      title: 'Arithmetic Progression Fundamentals & nth Term Formula',
      content: `### Arithmetic Progressions (AP) — Key Formulas & Theorems

An Arithmetic Progression is a sequence of numbers such that the difference between the consecutive terms is constant.

#### Core Definitions & Formulas:
1. **First Term**: $a$
2. **Common Difference**: $d = a_{k+1} - a_k$
3. **$n$-th Term Formula ($a_n$)**:
   $$a_n = a + (n - 1)d$$
4. **Sum of First $n$ Terms ($S_n$)**:
   $$S_n = \\frac{n}{2}[2a + (n - 1)d] = \\frac{n}{2}(a + l)$$
   where $l = a_n$ is the last term of the finite sequence.

#### Verification Rule:
Three terms $a, b, c$ are in AP if and only if $2b = a + c$, where $b = \\frac{a + c}{2}$ is called the **Arithmetic Mean**.`,
      files: [
        { name: 'Class10_AP_Formula_CheatSheet.pdf', url: '/uploads/Class10_AP_Formula_CheatSheet.pdf', type: 'application/pdf', size: 148000 },
      ],
      order: 1,
    },

    // --- SCIENCE LESSONS ---
    {
      subjectId: subSci._id,
      topicId: topicsMap[`${subSci._id}_Chemical Reactions & Equations`]._id,
      title: 'Balancing Equations & 5 Core Reaction Types',
      content: `### Chemical Reactions and Equations

A chemical reaction satisfies the **Law of Conservation of Mass**: Mass can neither be created nor destroyed in a chemical reaction. Therefore, the total number of atoms of each element remains identical on both sides of a balanced chemical equation.

#### 1. Five Fundamental Reaction Types:
1. **Combination Reaction**:
   Two or more substances combine to form a single product.
   $$CaO(s) + H_2O(l) \\to Ca(OH)_2(aq) + \\text{Heat} \\quad (\\text{Slaking of lime})$$
2. **Decomposition Reaction**:
   A single compound breaks down into two or more simpler substances.
   - *Thermal*: $2Pb(NO_3)_2(s) \\xrightarrow{\\Delta} 2PbO(s) + 4NO_2(g) \\text{ [brown fumes]} + O_2(g)$
   - *Electrolytic*: $2H_2O(l) \\xrightarrow{\\text{Electric current}} 2H_2(g) + O_2(g)$
   - *Photolytic*: $2AgCl(s) \\xrightarrow{h\\nu} 2Ag(s) + Cl_2(g) \\quad (\\text{Black & white photography})$$
3. **Displacement Reaction**:
   A more reactive element displaces a less reactive element from its compound.
   $$Fe(s) + CuSO_4(aq) \\to FeSO_4(aq) + Cu(s) \\quad (\\text{Blue to pale green})$$
4. **Double Displacement (Precipitation)**:
   Ion exchange between two ionic reactants forming an insoluble solid.
   $$Na_2SO_4(aq) + BaCl_2(aq) \\to BaSO_4\\downarrow(s) + 2NaCl(aq) \\quad (\\text{White precipitate})$$
5. **Redox (Oxidation-Reduction)**:
   - Oxidation: Gain of oxygen or loss of hydrogen/electrons.
   - Reduction: Loss of oxygen or gain of hydrogen/electrons.
   $$CuO(s) + H_2(g) \\xrightarrow{\\Delta} Cu(s) + H_2O(l)$$
   Here, $CuO$ is reduced to $Cu$ (oxidizing agent) and $H_2$ is oxidized to $H_2O$ (reducing agent).`,
      files: [
        { name: 'Class10_Chemical_Reactions_Revision.pdf', url: '/uploads/Class10_Chemical_Reactions_Revision.pdf', type: 'application/pdf', size: 210000 },
      ],
      order: 1,
    },
    {
      subjectId: subSci._id,
      topicId: topicsMap[`${subSci._id}_Light — Reflection and Refraction`]._id,
      title: 'Spherical Mirrors, Mirror Formula & Snell’s Law of Refraction',
      content: `### Optics: Reflection, Spherical Mirrors & Refraction

#### 1. Spherical Mirrors:
- **Concave Mirror**: Converging mirror. Focal length $f$ is **negative**.
- **Convex Mirror**: Diverging mirror. Focal length $f$ is **positive**. Used as rear-view vehicle mirror due to wider field of view.

#### 2. The Mirror Formula & Magnification:
$$\\frac{1}{f} = \\frac{1}{v} + \\frac{1}{u}$$
$$m = -\\frac{v}{u} = \\frac{h_i}{h_o}$$
*New Cartesian Sign Convention*:
- Object is always placed to the left of the mirror ($u$ is always negative).
- Distances measured in the direction of incident light are positive.

#### 3. Refraction of Light & Snell's Law:
When light travels obliquely from medium 1 to medium 2:
$$\\frac{\\sin i}{\\sin r} = \\frac{n_2}{n_1} = n_{21} \\quad (\\text{Constant for given pair of media})$$

#### 4. Power of an Optical Lens:
$$P = \\frac{1}{f \\text{ (in metres)}} \\quad (\\text{SI Unit: Dioptre, D})$$
- Convex lens: $f > 0 \\implies P > 0$ (+D).
- Concave lens: $f < 0 \\implies P < 0$ (-D).`,
      files: [
        { name: 'Optics_Ray_Diagrams_and_Formulae.pdf', url: '/uploads/Optics_Ray_Diagrams_and_Formulae.pdf', type: 'application/pdf', size: 275000 },
      ],
      order: 1,
    },

    // --- ENGLISH LESSONS ---
    {
      subjectId: subEng._id,
      topicId: topicsMap[`${subEng._id}_First Flight: Prose & Critical Appreciation`]._id,
      title: 'A Letter to God by G.L. Fuentes — Faith vs. Dramatic Irony',
      content: `### Literature Study: "A Letter to God" by Gregorio López y Fuentes

#### 1. Character Analysis:
- **Lencho**: A deeply devoted, simple-hearted farmer. His faith in God is pure, absolute, and childlike.
- **The Postmaster**: A fat, amiable man who represents genuine human empathy and altruism.

#### 2. The Narrative Arc & Dramatic Irony:
1. **The Devastation**: A catastrophic hailstorm completely destroys Lencho's ripe cornfields, plunging his family into famine.
2. **The Letter**: Lencho writes directly to God requesting 100 pesos to sow his field again and survive until the next crop.
3. **The Compassion**: The postmaster, unwilling to shake such unwavering faith, gathers contributions from his colleagues and gives a part of his own salary, managing to collect 70 pesos.
4. **The Dramatic Irony**: When Lencho receives the envelope with 70 pesos, he is not awestruck; rather, he becomes indignant. He believes God could never make an arithmetic mistake, concluding:
   > *"The post office employees are a bunch of crooks."*

#### 3. Core Thematic Takeaways:
- True faith can withstand natural catastrophe, yet ironically remain blind to human goodness.
- The highest form of charity is often thankless and misunderstood.`,
      files: [
        { name: 'A_Letter_to_God_Critical_Summary.pdf', url: '/uploads/A_Letter_to_God_Critical_Summary.pdf', type: 'application/pdf', size: 125000 },
      ],
      order: 1,
    },
    {
      subjectId: subEng._id,
      topicId: topicsMap[`${subEng._id}_Writing Skills & Applied Grammar`]._id,
      title: 'High-Scoring Analytical Paragraph Writing (100–120 Words)',
      content: `### Writing Section: The 3-Tier Analytical Paragraph Blueprint

An analytical paragraph interprets factual information given in a chart, graph, table, or outline.

#### Three-Tier Structure:
1. **Introduction (1–2 Sentences)**:
   - Paraphrase the given prompt.
   - Example: *"The provided bar chart illustrates the comparative trends in renewable energy adoption across five developing economies between 2015 and 2025."*
2. **Body Paragraph (3–5 Sentences)**:
   - Detail the most prominent features, peaks, and troughs.
   - Group data logically using comparative transition words (*in stark contrast*, *followed closely by*, *experienced an exponential surge*).
3. **Conclusion (1–2 Sentences)**:
   - Provide an overarching synthesis of the data.
   - NEVER inject personal opinions, predictions, or unsolicited moral advice.`,
      files: [
        { name: 'Analytical_Paragraph_Master_Templates.pdf', url: '/uploads/Analytical_Paragraph_Master_Templates.pdf', type: 'application/pdf', size: 115000 },
      ],
      order: 1,
    },

    // --- SOCIAL STUDIES (SST) LESSONS ---
    {
      subjectId: subSst._id,
      topicId: topicsMap[`${subSst._id}_History: The Rise of Nationalism in Europe`]._id,
      title: 'The French Revolution, Napoleonic Civil Code of 1804 & Zollverein',
      content: `### The Rise of Nationalism in Europe

#### 1. Frédéric Sorrieu’s Utopian Vision (1848):
- A series of 4 prints depicting democratic and social republics.
- Peoples of Europe and America marching in a long train past the Statue of Liberty.
- The shattered symbols of absolutist institutions lie on the earth in the foreground.

#### 2. The Civil Code of 1804 (Napoleonic Code):
- **Abolition of Birth Privileges**: Established equality before the law and secured property rights.
- **Administrative Simplification**: Feudal system abolished, serfdom and manorial dues ended.
- **Economic Freedom**: Guild restrictions removed in towns; uniform weights, measures, and a single national currency introduced.

#### 3. The Zollverein (1834):
- Customs union initiated by Prussia and joined by most German states.
- Abolished internal tariff barriers and reduced currencies from over 30 to just 2, harnessing economic nationalism to unify Germany.`,
      files: [
        { name: 'Nationalism_in_Europe_Study_Guide.pdf', url: '/uploads/Nationalism_in_Europe_Study_Guide.pdf', type: 'application/pdf', size: 210000 },
      ],
      order: 1,
    },
    {
      subjectId: subSst._id,
      topicId: topicsMap[`${subSst._id}_Political Science: Power Sharing`]._id,
      title: 'Belgium Accommodation Model vs. Sri Lanka Majoritarianism',
      content: `### Political Science: Comparative Power Sharing

#### 1. Ethnic Demographics:
- **Belgium**: 59% Dutch-speaking (Flemish), 40% French-speaking (Wallonia), 1% German. In Brussels: 80% French, 20% Dutch.
- **Sri Lanka**: 74% Sinhala-speaking (Buddhists), 18% Tamil-speaking (Hindus and Muslims).

#### 2. The Two Paths:
- **Sri Lanka (Majoritarianism)**:
  - 1956 Act made Sinhala the sole official language.
  - State favored Sinhalas in university admissions and government jobs.
  - Result: Estrangement, formation of LTTE, and a prolonged civil war.
- **Belgium (Accommodation Model)**:
  - Equal number of Dutch and French ministers in the central government.
  - Brussels has its own equal-representation government.
  - 'Community Government' handles culture, education, and language affairs.
  - Result: Complete stability; Brussels chosen as the headquarters of the European Union.

#### 3. Why Power Sharing is Desirable:
1. **Prudential Reason**: It prevents violent conflict and political instability.
2. **Moral Reason**: Power sharing is the fundamental essence of democracy.`,
      files: [
        { name: 'Power_Sharing_Class10_Notes.pdf', url: '/uploads/Power_Sharing_Class10_Notes.pdf', type: 'application/pdf', size: 165000 },
      ],
      order: 1,
    },
    {
      subjectId: subSst._id,
      topicId: topicsMap[`${subSst._id}_Economics: Understanding Development`]._id,
      title: 'Development Metrics: World Bank Per Capita Income vs. UNDP HDI',
      content: `### Understanding Economic & Human Development

#### 1. The Core Concept:
Development involves not just higher monetary income, but also equal treatment, freedom, security, respect, and a clean environment.

#### 2. Measuring National Development:
- **World Bank Criterion (World Development Reports)**:
  - Uses only **Per Capita Income (Average Income)**:
    $$\\text{Per Capita Income} = \\frac{\\text{Total National Income}}{\\text{Total Population}}$$
  - *Limitation*: Hides disparities in income distribution.
- **UNDP Criterion (Human Development Report)**:
  - Evaluates quality of life across three holistic dimensions:
    1. **Health**: Life Expectancy at birth.
    2. **Education**: Mean and expected years of schooling, literacy rate.
    3. **Standard of Living**: Gross National Income (GNI) per capita in Purchasing Power Parity (PPP \\$).`,
      files: [
        { name: 'Development_Economics_Handbook.pdf', url: '/uploads/Development_Economics_Handbook.pdf', type: 'application/pdf', size: 175000 },
      ],
      order: 1,
    },
  ];

  for (const ld of lessonsData) {
    await Lesson.findOneAndUpdate(
      { subjectId: ld.subjectId, title: ld.title },
      {
        ...ld,
        status: 'published',
        readBy: [student10._id, defaultStudent?._id].filter(Boolean),
        schoolId: SCHOOL_ID,
      },
      { upsert: true, new: true }
    );
  }
  console.log(`✓ ${lessonsData.length} comprehensive Class 10 Lessons provisioned.`);

  // 9. Provision Question Bank for Class 10 Tests
  const class10Questions = [
    // MATHEMATICS (5 MCQs)
    {
      subjectId: subMath._id,
      topicId: topicsMap[`${subMath._id}_Quadratic Equations & Discriminant`]._id,
      type: 'mcq',
      text: 'What is the discriminant (D) of the quadratic equation 3x² - 5x + 2 = 0?',
      options: ['D = 1', 'D = -1', 'D = 25', 'D = 49'],
      answer: 'D = 1',
      explanation: 'In 3x² - 5x + 2 = 0, a=3, b=-5, c=2. D = b² - 4ac = (-5)² - 4(3)(2) = 25 - 24 = 1. Since D > 0, roots are real and distinct.',
      marks: 2,
      difficulty: 'easy',
      tags: ['algebra', 'quadratics', 'discriminant'],
      source: 'manual',
    },
    {
      subjectId: subMath._id,
      topicId: topicsMap[`${subMath._id}_Quadratic Equations & Discriminant`]._id,
      type: 'mcq',
      text: 'If the quadratic equation kx² - 6x + 1 = 0 has two equal real roots, what is the value of k?',
      options: ['k = 3', 'k = 6', 'k = 9', 'k = 12'],
      answer: 'k = 9',
      explanation: 'For equal roots, D = 0 => b² - 4ac = 0 => (-6)² - 4(k)(1) = 0 => 36 - 4k = 0 => 4k = 36 => k = 9.',
      marks: 2,
      difficulty: 'medium',
      tags: ['algebra', 'quadratics', 'roots'],
      source: 'manual',
    },
    {
      subjectId: subMath._id,
      topicId: topicsMap[`${subMath._id}_Arithmetic Progressions (AP)`]._id,
      type: 'mcq',
      text: 'What is the 10th term of the Arithmetic Progression: 2, 7, 12, 17, ...?',
      options: ['42', '47', '52', '57'],
      answer: '47',
      explanation: 'Here a = 2, d = 7 - 2 = 5. a_10 = a + (10 - 1)d = 2 + 9(5) = 2 + 45 = 47.',
      marks: 2,
      difficulty: 'easy',
      tags: ['ap', 'sequences'],
      source: 'manual',
    },
    {
      subjectId: subMath._id,
      topicId: topicsMap[`${subMath._id}_Arithmetic Progressions (AP)`]._id,
      type: 'mcq',
      text: 'What is the sum of the first 20 natural numbers using the AP summation formula?',
      options: ['190', '200', '210', '220'],
      answer: '210',
      explanation: 'Sum S_n = n(n + 1)/2. For n=20, S_20 = 20(21)/2 = 10 * 21 = 210.',
      marks: 2,
      difficulty: 'easy',
      tags: ['ap', 'summation'],
      source: 'manual',
    },
    {
      subjectId: subMath._id,
      topicId: topicsMap[`${subMath._id}_Introduction to Trigonometry`]._id,
      type: 'mcq',
      text: 'Which of the following is equivalent to (1 - cos²θ) / sin θ for 0° < θ < 90°?',
      options: ['cos θ', 'sin θ', 'tan θ', 'sec θ'],
      answer: 'sin θ',
      explanation: 'By the fundamental trigonometric identity sin²θ + cos²θ = 1, we have 1 - cos²θ = sin²θ. Hence sin²θ / sin θ = sin θ.',
      marks: 2,
      difficulty: 'medium',
      tags: ['trigonometry', 'identities'],
      source: 'manual',
    },

    // SCIENCE (5 MCQs)
    {
      subjectId: subSci._id,
      topicId: topicsMap[`${subSci._id}_Chemical Reactions & Equations`]._id,
      type: 'mcq',
      text: 'What color precipitate is formed when barium chloride solution is mixed with sodium sulfate solution?',
      options: ['Yellow', 'White', 'Blue', 'Brown'],
      answer: 'White',
      explanation: 'BaCl2(aq) + Na2SO4(aq) -> BaSO4(s) [white precipitate] + 2NaCl(aq). This is a double displacement precipitation reaction.',
      marks: 2,
      difficulty: 'easy',
      tags: ['chemistry', 'precipitation'],
      source: 'manual',
    },
    {
      subjectId: subSci._id,
      topicId: topicsMap[`${subSci._id}_Chemical Reactions & Equations`]._id,
      type: 'mcq',
      text: 'In the chemical reaction CuO + H₂ -> Cu + H₂O, which chemical substance undergoes reduction?',
      options: ['H₂', 'CuO', 'Cu', 'H₂O'],
      answer: 'CuO',
      explanation: 'CuO loses oxygen to form Cu. Loss of oxygen is reduction; therefore, Copper(II) oxide (CuO) is reduced, acting as the oxidizing agent.',
      marks: 2,
      difficulty: 'easy',
      tags: ['chemistry', 'redox'],
      source: 'manual',
    },
    {
      subjectId: subSci._id,
      topicId: topicsMap[`${subSci._id}_Light — Reflection and Refraction`]._id,
      type: 'mcq',
      text: 'A concave mirror has a radius of curvature of 30 cm. What is its focal length under the Cartesian sign convention?',
      options: ['+15 cm', '-15 cm', '+30 cm', '-30 cm'],
      answer: '-15 cm',
      explanation: 'Focal length f = R / 2 = 30 / 2 = 15 cm. Since a concave mirror converges light in front of the reflecting surface to the left, f = -15 cm.',
      marks: 2,
      difficulty: 'medium',
      tags: ['physics', 'optics'],
      source: 'manual',
    },
    {
      subjectId: subSci._id,
      topicId: topicsMap[`${subSci._id}_Life Processes: Nutrition & Respiration`]._id,
      type: 'mcq',
      text: 'Which pancreatic enzyme is responsible for digesting proteins in the alkaline medium of the small intestine?',
      options: ['Pepsin', 'Salivary Amylase', 'Trypsin', 'Lipase'],
      answer: 'Trypsin',
      explanation: 'Trypsin is secreted by the pancreas to break down proteins in the alkaline intestinal juice, whereas pepsin operates in the acidic stomach.',
      marks: 2,
      difficulty: 'medium',
      tags: ['biology', 'digestion'],
      source: 'manual',
    },
    {
      subjectId: subSci._id,
      topicId: topicsMap[`${subSci._id}_Light — Reflection and Refraction`]._id,
      type: 'mcq',
      text: 'What is the SI unit of power of an optical lens?',
      options: ['Metre', 'Dioptre', 'Candela', 'Watt'],
      answer: 'Dioptre',
      explanation: 'Power of a lens P = 1 / f (in metres). Its SI unit is Dioptre (symbol D). 1 D = 1 m⁻¹.',
      marks: 2,
      difficulty: 'easy',
      tags: ['physics', 'lenses'],
      source: 'manual',
    },

    // ENGLISH (5 MCQs)
    {
      subjectId: subEng._id,
      topicId: topicsMap[`${subEng._id}_First Flight: Prose & Critical Appreciation`]._id,
      type: 'mcq',
      text: 'In "A Letter to God", how many pesos did the postmaster manage to collect and send to Lencho?',
      options: ['50 pesos', '70 pesos', '75 pesos', '100 pesos'],
      answer: '70 pesos',
      explanation: 'The postmaster could not gather the full 100 pesos, but managed to collect 70 pesos through contributions from his staff and his own salary.',
      marks: 2,
      difficulty: 'easy',
      tags: ['prose', 'lencho'],
      source: 'manual',
    },
    {
      subjectId: subEng._id,
      topicId: topicsMap[`${subEng._id}_First Flight: Prose & Critical Appreciation`]._id,
      type: 'mcq',
      text: 'According to Nelson Mandela in "Long Walk to Freedom", what does true courage mean?',
      options: ['Absence of fear', 'Triumph over fear', 'Lack of emotion', 'Physical bravery'],
      answer: 'Triumph over fear',
      explanation: 'Mandela famously said: "I learned that courage was not the absence of fear, but the triumph over it. The brave man is not he who does not feel afraid, but he who conquers that fear."',
      marks: 2,
      difficulty: 'easy',
      tags: ['prose', 'mandela'],
      source: 'manual',
    },
    {
      subjectId: subEng._id,
      topicId: topicsMap[`${subEng._id}_Writing Skills & Applied Grammar`]._id,
      type: 'mcq',
      text: 'Which of the following elements should NOT be included in an objective analytical paragraph?',
      options: ['Introductory paraphrase', 'Data trend comparisons', 'Personal subjective opinion', 'Overarching concluding pattern'],
      answer: 'Personal subjective opinion',
      explanation: 'An analytical paragraph is an objective, evidence-based interpretation of given data and must strictly avoid personal opinions or speculations.',
      marks: 2,
      difficulty: 'medium',
      tags: ['writing', 'analytical-paragraph'],
      source: 'manual',
    },
    {
      subjectId: subEng._id,
      topicId: topicsMap[`${subEng._id}_Writing Skills & Applied Grammar`]._id,
      type: 'mcq',
      text: 'Identify the correct indirect speech conversion for: The teacher said, "I have checked your answer sheets."',
      options: [
        'The teacher said that she has checked our answer sheets.',
        'The teacher said that she had checked our answer sheets.',
        'The teacher said that she checked our answer sheets.',
        'The teacher said that she will check our answer sheets.',
      ],
      answer: 'The teacher said that she had checked our answer sheets.',
      explanation: 'In indirect speech with a past reporting verb ("said"), the present perfect ("have checked") converts into past perfect ("had checked").',
      marks: 2,
      difficulty: 'medium',
      tags: ['grammar', 'reported-speech'],
      source: 'manual',
    },
    {
      subjectId: subEng._id,
      topicId: topicsMap[`${subEng._id}_First Flight: Prose & Critical Appreciation`]._id,
      type: 'mcq',
      text: 'Why did Lencho describe the post office employees as "a bunch of crooks"?',
      options: [
        'They delayed his letter delivery',
        'He suspected they stole the missing 30 pesos',
        'They mocked his handwriting',
        'They refused to give him free stamps',
      ],
      answer: 'He suspected they stole the missing 30 pesos',
      explanation: 'Lencho was convinced God could never deny his request of 100 pesos, and thus concluded that the postal workers must have pocketed the missing 30 pesos.',
      marks: 2,
      difficulty: 'easy',
      tags: ['prose', 'irony'],
      source: 'manual',
    },

    // SOCIAL STUDIES (SST) (5 MCQs)
    {
      subjectId: subSst._id,
      topicId: topicsMap[`${subSst._id}_History: The Rise of Nationalism in Europe`]._id,
      type: 'mcq',
      text: 'Which of the following was a key reform introduced by the Napoleonic Civil Code of 1804?',
      options: [
        'Restoration of feudal privileges',
        'Abolition of birth privileges and establishment of equality before law',
        'Reimposition of internal trade tariffs',
        'Restriction of private property ownership',
      ],
      answer: 'Abolition of birth privileges and establishment of equality before law',
      explanation: 'The Civil Code of 1804 abolished feudal privileges based on birth, instituted equality of all citizens before the law, and secured the right to property.',
      marks: 2,
      difficulty: 'easy',
      tags: ['history', 'napoleon'],
      source: 'manual',
    },
    {
      subjectId: subSst._id,
      topicId: topicsMap[`${subSst._id}_Political Science: Power Sharing`]._id,
      type: 'mcq',
      text: 'Under the Belgian constitutional accommodation model, how is ministerial power shared in the central government?',
      options: [
        'Dutch ministers hold veto power',
        'Equal number of Dutch and French-speaking ministers',
        'Brussels representatives alone form the cabinet',
        'Community governments hold all ministerial posts',
      ],
      answer: 'Equal number of Dutch and French-speaking ministers',
      explanation: 'The Belgian constitution prescribes that Dutch and French-speaking ministers shall be equal in the central government, preventing unilateral majority decisions.',
      marks: 2,
      difficulty: 'easy',
      tags: ['civics', 'power-sharing'],
      source: 'manual',
    },
    {
      subjectId: subSst._id,
      topicId: topicsMap[`${subSst._id}_Geography: Resources & Sustainable Development`]._id,
      type: 'mcq',
      text: 'Which landmark international summit adopted Agenda 21 to combat environmental degradation and poverty in 1992?',
      options: ['Kyoto Protocol', 'Paris Climate Summit', 'Rio de Janeiro Earth Summit', 'Geneva Convention'],
      answer: 'Rio de Janeiro Earth Summit',
      explanation: 'The 1992 UN Earth Summit in Rio de Janeiro endorsed Agenda 21, establishing global cooperation for sustainable environmental and social development.',
      marks: 2,
      difficulty: 'easy',
      tags: ['geography', 'agenda21'],
      source: 'manual',
    },
    {
      subjectId: subSst._id,
      topicId: topicsMap[`${subSst._id}_Economics: Understanding Development`]._id,
      type: 'mcq',
      text: 'Which international agency publishes the Human Development Report comparing countries across health, education, and per capita income?',
      options: [
        'World Bank',
        'International Monetary Fund (IMF)',
        'United Nations Development Programme (UNDP)',
        'World Health Organization (WHO)',
      ],
      answer: 'United Nations Development Programme (UNDP)',
      explanation: 'UNDP publishes the annual Human Development Report using HDI, measuring longevity, educational attainment, and standard of living (GNI per capita in PPP$).',
      marks: 2,
      difficulty: 'easy',
      tags: ['economics', 'hdi'],
      source: 'manual',
    },
    {
      subjectId: subSst._id,
      topicId: topicsMap[`${subSst._id}_Geography: Resources & Sustainable Development`]._id,
      type: 'mcq',
      text: 'Which soil conservation practice is specifically designed to decelerate surface water runoff on steep slopes?',
      options: ['Strip cropping', 'Contour ploughing and terrace farming', 'Deforestation', 'Over-irrigation'],
      answer: 'Contour ploughing and terrace farming',
      explanation: 'Ploughing along contour lines creates natural ridges that decelerate water flow down slopes, dramatically preventing sheet and gully soil erosion.',
      marks: 2,
      difficulty: 'medium',
      tags: ['geography', 'soil-conservation'],
      source: 'manual',
    },
  ];

  const qDocs = [];
  for (const q of class10Questions) {
    const doc = await Question.findOneAndUpdate(
      { subjectId: q.subjectId, text: q.text },
      { ...q, schoolId: SCHOOL_ID },
      { upsert: true, new: true }
    );
    qDocs.push(doc);
  }
  console.log(`✓ ${qDocs.length} high-quality MCQs seeded into Class 10 Question Bank.`);

  const mathQIds = qDocs.filter((q) => q.subjectId.toString() === subMath._id.toString()).map((q) => q._id);
  const sciQIds = qDocs.filter((q) => q.subjectId.toString() === subSci._id.toString()).map((q) => q._id);
  const engQIds = qDocs.filter((q) => q.subjectId.toString() === subEng._id.toString()).map((q) => q._id);
  const sstQIds = qDocs.filter((q) => q.subjectId.toString() === subSst._id.toString()).map((q) => q._id);

  // 10. Provision Default Static Tests for All 4 Subjects
  const testsToCreate = [
    {
      title: 'Class 10 Mathematics Diagnostic Assessment — Quadratics & AP',
      subjectId: subMath._id,
      classId: class10._id,
      section: 'all',
      teacherId: tMeera._id,
      questionIds: mathQIds,
      durationMinutes: 25,
      totalMarks: 10,
      startWindow: new Date(Date.now() - 24 * 3600 * 1000),
      endWindow: new Date(Date.now() + 14 * 24 * 3600 * 1000),
      shuffleQuestions: false,
      attemptLimit: 3,
      status: 'published',
    },
    {
      title: 'Class 10 Science Term-1 Unit Test — Reactions, Light & Life Processes',
      subjectId: subSci._id,
      classId: class10._id,
      section: 'all',
      teacherId: tRajesh._id,
      questionIds: sciQIds,
      durationMinutes: 25,
      totalMarks: 10,
      startWindow: new Date(Date.now() - 24 * 3600 * 1000),
      endWindow: new Date(Date.now() + 14 * 24 * 3600 * 1000),
      shuffleQuestions: false,
      attemptLimit: 3,
      status: 'published',
    },
    {
      title: 'Class 10 English Literature & Language Evaluation',
      subjectId: subEng._id,
      classId: class10._id,
      section: 'all',
      teacherId: tAnita._id,
      questionIds: engQIds,
      durationMinutes: 20,
      totalMarks: 10,
      startWindow: new Date(Date.now() - 24 * 3600 * 1000),
      endWindow: new Date(Date.now() + 14 * 24 * 3600 * 1000),
      shuffleQuestions: false,
      attemptLimit: 3,
      status: 'published',
    },
    {
      title: 'Class 10 Social Studies Board Diagnostic — History, Civics & Economics',
      subjectId: subSst._id,
      classId: class10._id,
      section: 'all',
      teacherId: tAnita._id,
      questionIds: sstQIds,
      durationMinutes: 25,
      totalMarks: 10,
      startWindow: new Date(Date.now() - 24 * 3600 * 1000),
      endWindow: new Date(Date.now() + 14 * 24 * 3600 * 1000),
      shuffleQuestions: false,
      attemptLimit: 3,
      status: 'published',
    },
  ];

  const createdTests = [];
  for (const t of testsToCreate) {
    const doc = await Test.findOneAndUpdate(
      { title: t.title, classId: t.classId },
      { ...t, schoolId: SCHOOL_ID },
      { upsert: true, new: true }
    );
    createdTests.push(doc);
  }
  console.log(`✓ 4 Default Static Tests created for Class 10 (Maths, Science, English, SST).`);

  // 11. Seed a sample completed test attempt for Rohan Joshi (student10) in Maths Test
  const mathTest = createdTests[0];
  await TestAttempt.findOneAndUpdate(
    { testId: mathTest._id, studentId: student10._id },
    {
      testId: mathTest._id,
      studentId: student10._id,
      answers: [
        { questionId: mathQIds[0], answer: 'D = 1', isCorrect: true, marksAwarded: 2 },
        { questionId: mathQIds[1], answer: 'k = 9', isCorrect: true, marksAwarded: 2 },
        { questionId: mathQIds[2], answer: '47', isCorrect: true, marksAwarded: 2 },
        { questionId: mathQIds[3], answer: '210', isCorrect: true, marksAwarded: 2 },
        { questionId: mathQIds[4], answer: 'sin θ', isCorrect: true, marksAwarded: 2 },
      ],
      score: 10,
      totalMarks: 10,
      startedAt: new Date(Date.now() - 2 * 3600 * 1000),
      submittedAt: new Date(Date.now() - 1.6 * 3600 * 1000),
      status: 'submitted',
      schoolId: SCHOOL_ID,
    },
    { upsert: true, new: true }
  );

  // Record Grade
  await Grade.findOneAndUpdate(
    { studentId: student10._id, assessmentId: mathTest._id },
    {
      studentId: student10._id,
      assessmentType: 'test',
      assessmentId: mathTest._id,
      assessmentTitle: mathTest.title,
      subjectId: subMath._id,
      classId: class10._id,
      marksObtained: 10,
      totalMarks: 10,
      percentage: 100,
      published: true,
      schoolId: SCHOOL_ID,
    },
    { upsert: true, new: true }
  );

  // 12. Seed Mastery Records for Class 10 topics
  await MasteryRecord.findOneAndUpdate(
    { studentId: student10._id, topicId: topicsMap[`${subMath._id}_Quadratic Equations & Discriminant`]._id },
    {
      studentId: student10._id,
      topicId: topicsMap[`${subMath._id}_Quadratic Equations & Discriminant`]._id,
      subjectId: subMath._id,
      level: 'mastered',
      scorePercentage: 96,
      schoolId: SCHOOL_ID,
    },
    { upsert: true, new: true }
  );

  await MasteryRecord.findOneAndUpdate(
    { studentId: student10._id, topicId: topicsMap[`${subSci._id}_Chemical Reactions & Equations`]._id },
    {
      studentId: student10._id,
      topicId: topicsMap[`${subSci._id}_Chemical Reactions & Equations`]._id,
      subjectId: subSci._id,
      level: 'proficient',
      scorePercentage: 85,
      schoolId: SCHOOL_ID,
    },
    { upsert: true, new: true }
  );

  // 13. Announcement for Class 10
  await Announcement.create({
    title: 'Class 10 CBSE Board Diagnostic & Pre-Board Schedule',
    content: 'All Class 10 students must review the newly published syllabus reading materials and complete the diagnostic evaluations in Maths, Science, English, and SST.',
    targetType: 'class',
    targetId: class10._id.toString(),
    authorId: tMeera._id,
    authorName: 'Meera Krishnan',
    schoolId: SCHOOL_ID,
  });

  console.log('--- Class 10 Academic Provisioning Finished Successfully ---');
  return { class10, subjects, createdTests };
}

module.exports = { seedClass10 };
