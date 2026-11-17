// Simulated network delay (500 - 1200 ms)
function delay(ms = Math.floor(Math.random() * 700) + 500) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class MockAIProvider {
  /**
   * Generic text generation
   */
  async generateText(args) {
    const prompt = typeof args === 'string' ? args : (args?.prompt || '');
    const systemInstruction = typeof args === 'object' ? args?.systemInstruction : '';
    await delay(300);
    return {
      text: `[Mock AI Response] Addressing your prompt: "${prompt.slice(0, 80)}..."\n\nKey Concept: Systematic problem solving with verified step-by-step principles.`,
      tokens: { promptTokens: 35, candidatesTokens: 42, totalTokens: 77 },
    };
  }

  /**
   * Generic multi-turn chat
   */
  async chat({ messages, systemInstruction }) {
    await delay(300);
    const lastMsg = messages[messages.length - 1]?.content || '';
    return {
      text: `[Mock AI Tutor] Great question! Regarding "${lastMsg.slice(0, 60)}", remember to check the core syllabus formula first. What is your first hypothesis?`,
      tokens: { promptTokens: 45, candidatesTokens: 38, totalTokens: 83 },
    };
  }

  /**
   * Simulated streaming chat via onChunk callback
   */
  async streamChat({ messages, systemInstruction, onChunk, signal }) {
    const lastMsg = messages[messages.length - 1]?.content || '';
    const isNonAcademic = /\b(play a game|video game|minecraft|fortnite|roblox|gta|favorite movie|favorite actor|celebrity|tell me a joke|tell a joke|dating|girlfriend|crush|match score|cricket score)\b/i.test(lastMsg);

    const sampleWords = isNonAcademic
      ? [
          'I', 'am', 'your', 'LearnMate', 'Academic', 'Tutor,', 'and', 'I', 'am', 'only', 'able', 'to', 'help', 'with', 'your',
          'school', 'studies,', 'syllabus', 'concepts,', 'and', 'homework.',
          '\n\nLet\'s', 'focus', 'on', 'your', 'learning!', 'What', 'academic', 'topic', 'or', 'problem', 'from', 'your',
          'syllabus', 'would', 'you', 'like', 'help', 'with?'
        ]
      : [
          'Hello!',
          'Let',
          'us',
          'explore',
          `"${lastMsg.slice(0, 30)}..."`,
          'step',
          'by',
          'step.',
          '\n\nFirst,',
          'what',
          'formula',
          'from',
          'your',
          'lesson',
          'applies',
          'here?',
          'Think',
          'about',
          'the',
          'given',
          'variables.',
          '\n\nTry',
          'setting',
          'up',
          'the',
          'first',
          'equation,',
          'and',
          'let',
          'me',
          'know',
          'what',
          'you',
          'get!',
        ];

    let fullText = '';
    for (const word of sampleWords) {
      if (signal?.aborted) break;
      await new Promise((r) => setTimeout(r, 45));
      fullText += (fullText ? ' ' : '') + word;
      if (typeof onChunk === 'function') {
        onChunk(word + ' ');
      }
    }

    return {
      text: fullText,
      tokens: { promptTokens: 50, candidatesTokens: sampleWords.length, totalTokens: 50 + sampleWords.length },
    };
  }

  /**
   * Generic JSON generator with fallback mock data
   */
  async generateJSON(args, schemaFallback) {
    const prompt = typeof args === 'string' ? args : (args?.prompt || '');
    const schema = typeof args === 'object' ? (args?.schema || args?.responseSchema) : schemaFallback;
    const responseSchema = schema;
    await delay(250);
    const p = (prompt || '').toLowerCase();

    // 1. Test / Questions Generator (Check schema first to avoid prompt keyword collisions)
    if (responseSchema?.properties?.questions || p.includes('multiple-choice') || p.includes('generate exactly') || p.includes('exam author') || p.includes('practice quiz')) {
      const matchCount = prompt.match(/exactly (\d+)/i) || prompt.match(/count.*?(\d+)/i);
      const reqCount = matchCount ? parseInt(matchCount[1], 10) : 5;

      // Extract requested topics/chapters from prompt
      let extractedTopics = [];
      const topicsMatch = prompt.match(/(?:selected chapters to cover|topics to cover|topics\/chapters to cover|chapters to cover):\s*([^\n\.]+)/i);
      if (topicsMatch) {
        extractedTopics = topicsMatch[1].split(',').map((s) => s.trim()).filter(Boolean);
      }

      const chapterKnowledgeBase = {
        'Quadratic Equations': [
          {
            text: 'What is the discriminant (D) of the quadratic equation 2x² - 4x + 2 = 0?',
            options: ['-16', '0', '16', '32'],
            correctOption: 'B',
            explanation: 'The discriminant is D = b² - 4ac. For 2x² - 4x + 2 = 0: a = 2, b = -4, c = 2. D = (-4)² - 4(2)(2) = 16 - 16 = 0, indicating real and equal roots.',
            difficulty: 'medium',
          },
          {
            text: 'If the roots of the quadratic equation ax² + bx + c = 0 are real and distinct, which condition must hold true?',
            options: ['b² - 4ac < 0', 'b² - 4ac > 0', 'b² - 4ac = 0', 'b = 0'],
            correctOption: 'B',
            explanation: 'For real and distinct roots, the discriminant D = b² - 4ac must be strictly greater than zero (D > 0).',
            difficulty: 'easy',
          },
          {
            text: 'Find the nature of roots for the equation 3x² - 5x + 3 = 0.',
            options: ['Two distinct real roots', 'No real roots (imaginary)', 'Two equal real roots', 'Infinite roots'],
            correctOption: 'B',
            explanation: 'Here D = (-5)² - 4(3)(3) = 25 - 36 = -11. Since D < 0, there are no real roots.',
            difficulty: 'hard',
          },
        ],
        'Arithmetic Progressions': [
          {
            text: 'In an AP where the first term a = 3 and common difference d = 4, what is the 10th term (a₁₀)?',
            options: ['35', '39', '43', '47'],
            correctOption: 'B',
            explanation: 'The n-th term formula is aₙ = a + (n - 1)d. For n = 10: a₁₀ = 3 + (9 × 4) = 3 + 36 = 39.',
            difficulty: 'easy',
          },
          {
            text: 'What is the sum of the first 20 natural numbers using the AP series formula Sₙ = n(n + 1)/2?',
            options: ['190', '210', '200', '220'],
            correctOption: 'B',
            explanation: 'Using Sₙ = n(n + 1)/2 for n = 20: S₂₀ = 20(21)/2 = 10 × 21 = 210.',
            difficulty: 'medium',
          },
          {
            text: 'If the 3rd term of an AP is 7 and the 7th term is 15, what is the common difference d?',
            options: ['1', '2', '3', '4'],
            correctOption: 'B',
            explanation: 'a₇ - a₃ = 4d => 15 - 7 = 8 => 4d = 8 => d = 2.',
            difficulty: 'hard',
          },
        ],
        'Chemical Reactions & Equations': [
          {
            text: 'Which type of chemical reaction is represented by 2Mg(s) + O₂(g) → 2MgO(s)?',
            options: ['Decomposition', 'Combination (Synthesis)', 'Displacement', 'Double Displacement'],
            correctOption: 'B',
            explanation: 'When two or more reactants combine to form a single product, it is classified as a combination reaction.',
            difficulty: 'easy',
          },
          {
            text: 'What gas is evolved when zinc granules react with dilute sulphuric acid (Zn + H₂SO₄)?',
            options: ['Oxygen', 'Hydrogen', 'Carbon Dioxide', 'Sulphur Dioxide'],
            correctOption: 'B',
            explanation: 'Metals react with dilute acids to produce metal salts and liberate flammable hydrogen gas (H₂).',
            difficulty: 'medium',
          },
        ],
        'Life Processes & Nutrition': [
          {
            text: 'Which cellular organelle is known as the powerhouse of the cell and site of aerobic cellular respiration?',
            options: ['Chloroplast', 'Mitochondria', 'Ribosome', 'Golgi apparatus'],
            correctOption: 'B',
            explanation: 'Mitochondria generate the majority of cellular chemical energy in the form of ATP through oxidative phosphorylation.',
            difficulty: 'easy',
          },
          {
            text: 'In human digestion, which enzyme in gastric juice initiates the breakdown of proteins into peptones?',
            options: ['Salivary Amylase', 'Pepsin', 'Trypsin', 'Pancreatic Lipase'],
            correctOption: 'B',
            explanation: 'Hydrochloric acid in the stomach activates pepsinogen into pepsin, which digests proteins into smaller peptones.',
            difficulty: 'medium',
          },
        ],
        'First Flight: Prose & Poetry': [
          {
            text: 'In the story "A Letter to God", what caused complete destruction to Lencho\'s valley crops?',
            options: ['A devastating river flood', 'A severe hailstorm', 'A swarm of locusts', 'A seasonal drought'],
            correctOption: 'B',
            explanation: 'A violent hailstorm pelted the valley for an hour, leaving the cornfields completely covered in white hail.',
            difficulty: 'easy',
          },
        ],
        'The Rise of Nationalism in Europe': [
          {
            text: 'Which French artist created the famous 1848 four-print series visualizing "Democratic and Social Republics"?',
            options: ['Eugène Delacroix', 'Frédéric Sorrieu', 'Claude Monet', 'Jacques-Louis David'],
            correctOption: 'B',
            explanation: 'Frédéric Sorrieu visualized utopian nation-states where citizens paid homage to the Statue of Liberty in 1848.',
            difficulty: 'medium',
          },
        ],
        'Linear Equations': [
          {
            text: 'Solve for x in the linear equation: 3x + 6 = 21.',
            options: ['x = 3', 'x = 5', 'x = 7', 'x = 9'],
            correctOption: 'B',
            explanation: 'Subtract 6 from both sides to get 3x = 15. Divide by 3 to get x = 5. Other options are arithmetic errors.',
            difficulty: 'easy',
          },
        ],
        'Coordinate Geometry': [
          {
            text: 'What is the slope of the line represented by y = -4x + 9 in Cartesian space?',
            options: ['9', '-4', '4', '1/4'],
            correctOption: 'B',
            explanation: 'In slope-intercept form y = mx + c, the coefficient of x is the slope m = -4.',
            difficulty: 'medium',
          },
        ],
      };

      const generatedQuestions = [];
      const topicsList = extractedTopics.length > 0 ? extractedTopics : ['Linear Equations', 'Coordinate Geometry'];

      for (let i = 0; i < reqCount; i++) {
        const currentTopic = topicsList[i % topicsList.length];
        const topicPool = chapterKnowledgeBase[currentTopic];

        if (topicPool && topicPool.length > 0) {
          const poolItem = topicPool[Math.floor(i / topicsList.length) % topicPool.length];
          generatedQuestions.push({
            text: poolItem.text,
            options: poolItem.options,
            correctOption: poolItem.correctOption,
            explanation: poolItem.explanation,
            topic: currentTopic,
            difficulty: poolItem.difficulty || 'medium',
          });
        } else {
          // Dynamic chapter-grounded question fallback
          generatedQuestions.push({
            text: `In the study of ${currentTopic}, which core principle correctly describes the relationship between the governing variables (Concept #${(i % 3) + 1})?`,
            options: [
              `Independent variable changes inversely with the core syllabus rule`,
              `The standard governing equation is satisfied when calculated step-by-step`,
              `The constant term is omitted during standard simplification`,
              `No relationship exists between the fundamental parameters`,
            ],
            correctOption: 'B',
            explanation: `According to standard ${currentTopic} curriculum principles, applying the verified formula step-by-step satisfies the governing equilibrium equation.`,
            topic: currentTopic,
            difficulty: i % 2 === 0 ? 'easy' : 'medium',
          });
        }
      }

      return {
        data: {
          questions: generatedQuestions,
        },
        tokens: { promptTokens: 120, candidatesTokens: 90, totalTokens: 210 },
      };
    }

    // 2. Study Plan
    if (p.includes('study plan') || p.includes('study routine') || responseSchema?.properties?.weeklyGoal) {
      return {
        data: {
          weeklyGoal: 'Master core curriculum units and complete all revision assignments.',
          dailyRoutines: [
            { day: 'Monday', subject: 'Mathematics', focusTopic: 'Linear Equations', durationMinutes: 45 },
            { day: 'Tuesday', subject: 'Science', focusTopic: 'Force & Pressure', durationMinutes: 45 },
            { day: 'Wednesday', subject: 'English', focusTopic: 'Grammar & Comprehension', durationMinutes: 30 },
            { day: 'Thursday', subject: 'Social Studies', focusTopic: 'Historical Maps', durationMinutes: 30 },
            { day: 'Friday', subject: 'Computer Science', focusTopic: 'Algorithms', durationMinutes: 30 },
          ],
          examTips: [
            'Review weak topics flagged on your Progress dashboard.',
            'Take a 5-question AI practice quiz every other day.',
            'Summarize key formulas on your personal notes cards.',
          ],
        },
        tokens: { promptTokens: 60, candidatesTokens: 90, totalTokens: 150 },
      };
    }

    // 2. Explain Mistake
    if (p.includes('diagnose') || p.includes('misconception') || responseSchema?.properties?.whyWrong) {
      return {
        data: {
          whyWrong: 'The student likely forgot to invert the mathematical sign when transposing terms across the equals sign, resulting in an off-by-one arithmetic error.',
          keyRule: 'Transposing a term to the opposite side of an equation always inverts its sign (+ becomes -, and - becomes +).',
        },
        tokens: { promptTokens: 50, candidatesTokens: 40, totalTokens: 90 },
      };
    }

    // 3. Summarize Lesson
    if (p.includes('summarize this lesson') || p.includes('lesson title') || responseSchema?.properties?.discussionQuestion) {
      return {
        data: {
          summary: 'This lesson explains foundational principles, core governing laws, and step-by-step problem-solving methods for secondary school students.',
          keyPoints: [
            'Core definitions and governing scientific laws.',
            'Step-by-step algebraic substitution methods.',
            'Real-world applications in everyday phenomena.',
          ],
          discussionQuestion: 'How does this scientific principle apply to everyday objects at home?',
        },
        tokens: { promptTokens: 60, candidatesTokens: 70, totalTokens: 130 },
      };
    }

    // 4. Draft Assignment
    if (p.includes('draft a structured assignment') || responseSchema?.properties?.rubric) {
      return {
        data: {
          title: 'Problem Solving Worksheet',
          description: 'Solve the assigned exercises showing all calculation steps clearly. Double-check your final units.',
          estimatedMinutes: 40,
          totalMarks: 30,
          rubric: [
            { criterion: 'Step-by-step algebraic procedure', maxMarks: 15 },
            { criterion: 'Final calculation and units accuracy', maxMarks: 15 },
          ],
          aiHelpLevel: 'Hints only',
        },
        tokens: { promptTokens: 80, candidatesTokens: 60, totalTokens: 140 },
      };
    }

    // 5. Estimate Effort
    if (p.includes('estimate the realistic student effort') || responseSchema?.properties?.recommendedDailyPace) {
      return {
        data: {
          estimatedMinutes: 35,
          recommendedDailyPace: '15-20 mins/day over 2 days',
          rationale: 'Moderate conceptual problem set requiring variable transposition and verification.',
        },
        tokens: { promptTokens: 40, candidatesTokens: 30, totalTokens: 70 },
      };
    }

    // 6. Suggest Feedback
    if (p.includes('constructive teacher feedback') || responseSchema?.properties?.improvementAreas) {
      return {
        data: {
          feedback: 'Commendable effort on this evaluation! Your procedural steps and formulas are well laid out. Keep practicing multi-step problems to build speed and accuracy.',
          strengths: 'Clear logical structure and thorough step-by-step presentation.',
          improvementAreas: 'Carefully verify arithmetic signs when subtracting negative values.',
        },
        tokens: { promptTokens: 50, candidatesTokens: 50, totalTokens: 100 },
      };
    }

    // 7. Class Insights
    if (p.includes('class insights') || responseSchema?.properties?.struggleAreas) {
      return {
        data: {
          strengths: [
            'High completion rate and strong procedural layout on homework assignments.',
            'Over 85% accuracy on foundational algebraic concepts.',
          ],
          struggleAreas: [
            'Word problem formulation and translating textual descriptions into equations.',
            'Geometric proofs involving angle sum properties.',
          ],
          recommendedActions: [
            'Conduct a 10-minute starter review on transposing terms with negative signs.',
            'Introduce paired peer discussions for word problems before independent work.',
            'Reinforce formula recall using interactive practice quizzes.',
          ],
        },
        tokens: { promptTokens: 70, candidatesTokens: 80, totalTokens: 150 },
      };
    }

    return {
      data: { success: true, message: 'Mock JSON payload generated successfully.' },
      tokens: { promptTokens: 40, candidatesTokens: 25, totalTokens: 65 },
    };
  }

  // Student 1: Ask Doubt
  static async askDoubt({ question, subjectName = 'Mathematics' }) {
    await delay();
    return {
      answer: `In ${subjectName}, when approaching this problem, remember that the foundational principle relies on systematically isolating variables and maintaining equivalence across algebraic operations.

First, identify the unknown variables and list any given constraints or boundary values. Next, substitute known values step-by-step rather than solving mentally to avoid basic sign errors. Finally, verify your final answer by substituting it back into the initial equation.`,
      steps: [
        'Identify given variables and constants from the problem statement.',
        'Apply the standard formula or substitution method step-by-step.',
        'Simplify terms by collecting like terms on one side of the equation.',
        'Double-check negative signs and test the solution against the original equation.',
      ],
      keyTakeaway: 'Always perform algebraic operations simultaneously to both sides to maintain strict mathematical equivalence.',
    };
  }

  // Student 2: Practice Quiz
  static async generatePracticeQuiz({ topicName = 'Linear Equations', count = 3 }) {
    await delay();
    return {
      topic: topicName,
      questions: [
        {
          id: 'q1',
          text: `For the linear system 2x + y = 7 and x - y = 2, what is the value of x?`,
          options: ['x = 3', 'x = 2', 'x = 4', 'x = 5'],
          answer: 'x = 3',
          explanation: 'Adding both equations cancels y: 3x = 9, therefore x = 3.',
        },
        {
          id: 'q2',
          text: `What is the geometric representation of a linear equation with two variables?`,
          options: ['A straight line', 'A parabola', 'A circle', 'A hyperbola'],
          answer: 'A straight line',
          explanation: 'Every linear equation of degree 1 represents a straight line on the Cartesian plane.',
        },
        {
          id: 'q3',
          text: `If the discriminant of an equation b² - 4ac = 0, how many distinct real roots exist?`,
          options: ['One repeated real root', 'Two distinct real roots', 'No real roots', 'Infinitely many'],
          answer: 'One repeated real root',
          explanation: 'When discriminant is zero, the roots are real and equal.',
        },
      ].slice(0, count),
    };
  }

  // Student 3: Study Plan Generator
  static async generateStudyPlan({ targetExam = 'Term 1 Evaluations', dailyHours = 2.5 }) {
    await delay();
    return {
      targetExam,
      dailyHours,
      blocks: [
        {
          day: 'Monday',
          startTime: '17:00',
          endTime: '18:15',
          title: 'Mathematics: Quadratic Systems Revision',
          subjectName: 'Mathematics',
          type: 'study',
          isCompleted: false,
        },
        {
          day: 'Tuesday',
          startTime: '17:30',
          endTime: '18:30',
          title: 'Science: Ray Optics & Lens Diagrams',
          subjectName: 'Science',
          type: 'study',
          isCompleted: false,
        },
        {
          day: 'Wednesday',
          startTime: '18:00',
          endTime: '19:15',
          title: 'Computer Science: Binary Trees & Algorithmic Complexity',
          subjectName: 'Computer Science',
          type: 'study',
          isCompleted: false,
        },
        {
          day: 'Thursday',
          startTime: '17:00',
          endTime: '18:30',
          title: 'Social Studies: Revision of Constitutional Framework',
          subjectName: 'Social Studies',
          type: 'study',
          isCompleted: false,
        },
        {
          day: 'Friday',
          startTime: '16:30',
          endTime: '18:00',
          title: 'English: Analytical Essay Drafting Practice',
          subjectName: 'English',
          type: 'study',
          isCompleted: false,
        },
      ],
    };
  }

  // Student 4: Explain My Mistake
  static async explainMistake({ questionText, studentAnswer, correctAnswer, topicName }) {
    await delay();
    return {
      whyWrong: `You chose "${studentAnswer}". In this case, you likely overlooked the negative coefficient during transposition. When moving a term to the opposite side of the equals sign, its sign must be inverted.`,
      keyRule: `The correct answer is "${correctAnswer}". Remember: a - (-b) = a + b, and transposition changes positive terms into negative terms and vice-versa.`,
      suggestedReview: `Review Lesson 2 examples on signs and multi-step substitution in ${topicName || 'Algebra'}.`,
    };
  }

  // Student 5: Summarize Lesson
  static async summarizeLesson({ title, content }) {
    await delay();
    return {
      title,
      summaryBullets: [
        'Covers the definition, canonical algebraic form, and geometrical interpretation of the topic.',
        'Outlines the three primary solution methodologies: Substitution, Elimination, and Graphical intersection.',
        'Emphasizes consistency checks to identify unique, infinite, or no-solution states.',
      ],
      keyTerms: [
        { term: 'Linearity', definition: 'An equation where the highest exponent of any variable is exactly 1.' },
        { term: 'Simultaneous Equations', definition: 'Two or more equations with common variables solved together.' },
        { term: 'Elimination Method', definition: 'Adding or subtracting equations to eliminate one variable.' },
        { term: 'Substitution Method', definition: 'Expressing one variable in terms of the other to reduce dimensionality.' },
        { term: 'Coincident Lines', definition: 'Lines that overlap completely, producing infinitely many solutions.' },
      ],
    };
  }

  // Teacher 1: Generate Test
  static async generateTest({ topic = 'Linear Equations', difficulty = 'medium', count = 3 }) {
    await delay();
    return {
      topic,
      difficulty,
      generatedQuestions: [
        {
          type: 'mcq',
          text: `What is the solution to the system 3x + 2y = 12 and x - y = 1?`,
          options: ['(x=2.8, y=1.8)', '(x=2, y=3)', '(x=3, y=1.5)', '(x=4, y=0)'],
          answer: '(x=2.8, y=1.8)',
          explanation: 'Multiply second equation by 2: 2x - 2y = 2. Add to first: 5x = 14 => x = 2.8. Then y = 1.8.',
          marks: 2,
        },
        {
          type: 'true_false',
          text: `Parallel lines on a Cartesian coordinate plane have exactly one intersection point.`,
          options: ['True', 'False'],
          answer: 'False',
          explanation: 'Parallel lines possess identical slopes and never intersect, resulting in zero solutions.',
          marks: 1,
        },
        {
          type: 'short_answer',
          text: `Define the condition under which a system a₁x + b₁y = c₁ and a₂x + b₂y = c₂ has infinitely many solutions.`,
          options: [],
          answer: 'a₁/a₂ = b₁/b₂ = c₁/c₂',
          explanation: 'When all ratios of coefficients and constants are equal, the equations represent identical lines.',
          marks: 3,
        },
      ].slice(0, count),
    };
  }

  // Teacher 2: Draft Assignment
  static async draftAssignment({ topic = 'Algebraic Formulations', level = 'Grade 8' }) {
    await delay();
    return {
      title: `${topic} Practice & Applications Worksheet`,
      description: `In this assignment, students will explore real-world applications of ${topic}. Complete questions 1 through 10, clearly showing variable definitions, equation formulations, and working calculations. Submit either typed work or a clear PDF scan of your handwritten solution sheet.`,
      estimatedMinutes: 45,
      rubric: [
        { criterion: 'Equation Formulation', maxMarks: 15, description: 'Correctly translating problem wordings into mathematical expressions.' },
        { criterion: 'Step-by-step Calculations', maxMarks: 25, description: 'Accurate algebraic manipulation without arithmetic slips.' },
        { criterion: 'Verification & Presentation', maxMarks: 10, description: 'Final answers clearly stated with correct units and checks.' },
      ],
    };
  }

  // Teacher 3: Estimate Effort
  static async estimateEffort({ title = '', description = '' }) {
    await delay();
    const length = (title + description).length;
    const minutes = length > 200 ? 50 : 35;
    return {
      estimatedMinutes: minutes,
      reasoning: `Calculated based on ~5 word problems requiring formulation, algebraic manipulation, and verification (~7-10 minutes per problem).`,
    };
  }

  // Teacher 4: Suggest Feedback
  static async suggestFeedback({ marksAwarded = 45, totalMarks = 50 }) {
    await delay();
    const percent = Math.round((marksAwarded / totalMarks) * 100);
    if (percent >= 85) {
      return {
        feedback: `Excellent submission! Your algebraic steps were clear, well-structured, and methodically verified. Keep up this high standard of presentation.`,
      };
    } else if (percent >= 65) {
      return {
        feedback: `Good effort overall. Your equation setups are mostly accurate, but watch out for minor sign slips during elimination. Review the worked examples in Lesson 2.`,
      };
    } else {
      return {
        feedback: `Consider revising the core substitution rules. Several key variables were miscalculated during transposition. Please connect during doubt hours for additional practice.`,
      };
    }
  }

  // Teacher 5: Class Insights
  static async generateClassInsights({ className = 'Grade 8', subjectName = 'Mathematics' }) {
    await delay();
    return {
      className,
      subjectName,
      observations: [
        'Strong conceptual mastery in direct algebraic substitution (88% class average on basic questions).',
        'Persistent friction in coordinate mapping and graphing linear slopes (42% incorrect on recent test).',
        'Homework completion rate is healthy at 88%, with Section A averaging 2 days ahead of schedule.',
      ],
      suggestedActions: [
        'Conduct a 15-minute whiteboard session on negative slope graphing before Friday.',
        'Assign 3 low-stakes practice problems focusing strictly on Cartesian quadrant identification.',
      ],
    };
  }
}

module.exports = MockAIProvider;
