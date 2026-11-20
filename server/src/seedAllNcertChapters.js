require('dotenv').config({ path: 'server/.env' });
const dns = require('dns');
if (dns && dns.setServers) {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
}
const mongoose = require('mongoose');
const Subject = require('./models/Subject');
const Topic = require('./models/Topic');
const Class = require('./models/Class');

const CLASS_10_CURRICULUM = {
  // 1. Mathematics (14 NCERT Chapters)
  MATH10: {
    subjectName: 'Mathematics',
    chapters: [
      { order: 1, name: 'Chapter 1: Real Numbers', description: 'Fundamental Theorem of Arithmetic, irrational numbers revisit, proofs of irrationality (√2, √3, √5).' },
      { order: 2, name: 'Chapter 2: Polynomials', description: 'Geometrical meaning of zeroes, relationship between zeroes and coefficients of quadratic polynomials.' },
      { order: 3, name: 'Chapter 3: Pair of Linear Equations in Two Variables', description: 'Graphical and algebraic methods: substitution, elimination, consistency and real-world word problems.' },
      { order: 4, name: 'Chapter 4: Quadratic Equations', description: 'Standard form, solving by factorisation and quadratic formula, nature of roots (discriminant D = b² - 4ac).' },
      { order: 5, name: 'Chapter 5: Arithmetic Progressions', description: 'nth term of an AP (an = a + (n-1)d), sum of first n terms (Sn = n/2[2a + (n-1)d]), application problems.' },
      { order: 6, name: 'Chapter 6: Triangles', description: 'Similarity of figures, Basic Proportionality Theorem (Thales Theorem) and its converse, criteria for similarity of triangles (AAA, SSS, SAS).' },
      { order: 7, name: 'Chapter 7: Coordinate Geometry', description: 'Distance formula, Section formula (internal division), midpoint formula and coordinate geometry applications.' },
      { order: 8, name: 'Chapter 8: Introduction to Trigonometry', description: 'Trigonometric ratios of acute angles, values of ratios for 0°, 30°, 45°, 60°, 90°, fundamental trigonometric identities (sin²θ + cos²θ = 1).' },
      { order: 9, name: 'Chapter 9: Some Applications of Trigonometry', description: 'Heights and distances, line of sight, angle of elevation, angle of depression, practical word problems.' },
      { order: 10, name: 'Chapter 10: Circles', description: 'Tangent to a circle, radius-tangent perpendicularity theorem, tangents from an external point theorem.' },
      { order: 11, name: 'Chapter 11: Areas Related to Circles', description: 'Area of sector and segment of a circle, arc length formulas (θ/360° × 2πr, θ/360° × πr²).' },
      { order: 12, name: 'Chapter 12: Surface Areas and Volumes', description: 'Surface areas and volumes of combinations of solids: cubes, cuboids, spheres, hemispheres, right circular cylinders/cones.' },
      { order: 13, name: 'Chapter 13: Statistics', description: 'Mean of grouped data (direct, assumed mean), mode of grouped data, median of grouped data, empirical relationship.' },
      { order: 14, name: 'Chapter 14: Probability', description: 'Classical theoretical probability P(E) = n(E)/n(S), elementary events, impossible and sure events, complementary events.' },
    ],
  },

  // 2. Science (13 NCERT Chapters)
  SCI10: {
    subjectName: 'Science',
    chapters: [
      { order: 1, name: 'Chapter 1: Chemical Reactions and Equations', description: 'Chemical equation balancing, types of reactions: combination, decomposition, displacement, double displacement, oxidation and reduction, corrosion and rancidity.' },
      { order: 2, name: 'Chapter 2: Acids, Bases and Salts', description: 'Chemical properties of acids and bases, pH scale and importance, salts: baking soda, washing soda, bleaching powder, plaster of paris.' },
      { order: 3, name: 'Chapter 3: Metals and Non-metals', description: 'Physical and chemical properties, reactivity series, formation and properties of ionic compounds, basic metallurgy, corrosion prevention.' },
      { order: 4, name: 'Chapter 4: Carbon and its Compounds', description: 'Covalent bonding, versatile nature of carbon, homologous series, nomenclature of functional groups, chemical properties: combustion, oxidation, addition, substitution, soaps and detergents.' },
      { order: 5, name: 'Chapter 5: Life Processes', description: 'Autotrophic and heterotrophic nutrition, human digestive system, respiration (aerobic & anaerobic), human circulatory system, excretion in plants and humans.' },
      { order: 6, name: 'Chapter 6: Control and Coordination', description: 'Nervous system in animals: neuron structure, reflex arc, human brain, plant hormones (auxin, gibberellin, cytokinin, abscisic acid), endocrine glands and animal hormones.' },
      { order: 7, name: 'Chapter 7: How do Organisms Reproduce?', description: 'Asexual reproduction (fission, budding, regeneration, spore formation, vegetative propagation), sexual reproduction in flowering plants, human male and female reproductive systems, reproductive health.' },
      { order: 8, name: 'Chapter 8: Heredity', description: 'Heredity, Mendel’s laws of inheritance (monohybrid and dihybrid crosses), sex determination in human beings.' },
      { order: 9, name: 'Chapter 9: Light – Reflection and Refraction', description: 'Spherical mirrors (concave and convex), mirror formula and magnification, refraction of light, Snell’s law, refractive index, spherical lenses, lens formula and power of a lens.' },
      { order: 10, name: 'Chapter 10: The Human Eye and the Colourful World', description: 'Structure and working of human eye, defects of vision (myopia, hypermetropia, presbyopia) and corrections, refraction through prism, dispersion of white light, atmospheric refraction, scattering of light (Tyndall effect).' },
      { order: 11, name: 'Chapter 11: Electricity', description: 'Electric current, potential difference, Ohm’s law, resistance and resistivity, factors affecting resistance, series and parallel resistor circuits, heating effect of electric current (Joule’s law), electric power.' },
      { order: 12, name: 'Chapter 12: Magnetic Effects of Electric Current', description: 'Magnetic field and field lines, field due to current-carrying straight wire, circular loop and solenoid, Fleming’s left-hand rule, electric motor, electromagnetic induction, Fleming’s right-hand rule, domestic electric circuits.' },
      { order: 13, name: 'Chapter 13: Our Environment', description: 'Ecosystem components (biotic and abiotic), food chains and food webs, 10% energy transfer law, biomagnification, ozone layer depletion and waste management.' },
    ],
  },

  // 3. English Language & Literature (NCERT First Flight + Footprints Without Feet + Skills)
  ENG10: {
    subjectName: 'English Language & Literature',
    chapters: [
      // First Flight: Prose
      { order: 1, name: 'First Flight: Chapter 1 - A Letter to God', description: 'By G.L. Fuentes. Story of Lencho’s unwavering faith in God, the hailstorm, and his encounter with the post office employees.' },
      { order: 2, name: 'First Flight: Poem 1 - Dust of Snow & Fire and Ice', description: 'By Robert Frost. Two introspective poems exploring nature’s uplifting power and humanity’s destructive passions (desire vs hatred).' },
      { order: 3, name: 'First Flight: Chapter 2 - Nelson Mandela: Long Walk to Freedom', description: 'Extract from Nelson Mandela’s autobiography covering his historic inauguration as South Africa’s first democratic president.' },
      { order: 4, name: 'First Flight: Poem 2 - A Tiger in the Zoo', description: 'By Leslie Norris. Poignant contrast between a caged tiger in a zoo and its natural majestic life in the wild forest.' },
      { order: 5, name: 'First Flight: Chapter 3 - Two Stories about Flying', description: 'Part I: His First Flight by Liam O’Flaherty (a young seagull overcoming fear); Part II: Black Aeroplane by Frederick Forsyth (mysterious navigation through storm clouds).' },
      { order: 6, name: 'First Flight: Poem 3 - How to Tell Wild Animals & The Ball Poem', description: 'Humorous wildlife identification by Carolyn Wells, and John Berryman’s profound reflection on loss and growing up in The Ball Poem.' },
      { order: 7, name: 'First Flight: Chapter 4 - From the Diary of Anne Frank', description: 'Extract from Anne Frank’s world-renowned wartime diary documenting her school days, friendship with Kitty, and humorous math essay.' },
      { order: 8, name: 'First Flight: Poem 4 - Amanda! & The Trees', description: 'Robin Klein’s Amanda! (a young girl’s longing for freedom from nagging) and Adrienne Rich’s The Trees (allegory of emancipation and nature’s rebellion).' },
      { order: 9, name: 'First Flight: Chapter 5 - Glimpses of India', description: 'Three vivid travelogues: I. A Baker from Goa (Lucio Rodrigues), II. Coorg (Lokesh Abrol), and III. Tea from Assam (Arup Kumar Datta).' },
      { order: 10, name: 'First Flight: Poem 5 - Fog & The Tale of Custard the Dragon', description: 'Carl Sandburg’s evocative Fog and Ogden Nash’s whimsical ballad about a cowardly pet dragon Custard who turns out to be heroic.' },
      { order: 11, name: 'First Flight: Chapter 6 - Mijbil the Otter', description: 'By Gavin Maxwell. Charming memoir about the author’s pet otter Mijbil brought from Iraq to London.' },
      { order: 12, name: 'First Flight: Poem 6 - For Anne Gregory', description: 'By W.B. Yeats. Philosophical dialogue on external physical beauty versus genuine spiritual and inner love.' },
      { order: 13, name: 'First Flight: Chapter 7 - Madam Rides the Bus', description: 'By Vallikkannan. Heartwarming tale of eight-year-old Valliammai (Valli) and her maiden independent bus journey to town.' },
      { order: 14, name: 'First Flight: Chapter 8 - The Sermon at Benares', description: 'Teachings of Gautama Buddha at Benares and the story of Kisa Gotami realizing the universality of death and suffering.' },
      { order: 15, name: 'First Flight: Chapter 9 - The Proposal (Play)', description: 'One-act farce by Anton Chekhov satirizing Russian landed gentry, courtship, and petty squabbles between Lomov and Natalya.' },

      // Footprints Without Feet: Supplementary Reader
      { order: 16, name: 'Footprints: Chapter 1 - A Triumph of Surgery', description: 'By James Herriot. Humorous veterinary story of Tricki, an overfed pampered dog, cured through sensible discipline and exercise.' },
      { order: 17, name: 'Footprints: Chapter 2 - The Thief’s Story', description: 'By Ruskin Bond. Touching story of young thief Hari Singh reformed by the trust, kindness, and education offered by Anil.' },
      { order: 18, name: 'Footprints: Chapter 3 - The Midnight Visitor', description: 'By Robert Arthur. Clever spy story where secret agent Ausable outwits armed rival Max with sheer wit and presence of mind.' },
      { order: 19, name: 'Footprints: Chapter 4 - A Question of Trust', description: 'By Victor Canning. Horace Danby, a careful gentleman burglar, is outsmarted by a deceptive young woman posing as the homeowner.' },
      { order: 20, name: 'Footprints: Chapter 5 - Footprints without Feet', description: 'By H.G. Wells. Scientist Griffin discovers formula for invisibility but turns lawless and creates havoc in London and Iping.' },
      { order: 21, name: 'Footprints: Chapter 6 - The Making of a Scientist', description: 'By Robert W. Peterson. Inspiring biographical account of Richard Ebright’s journey from butterfly collector to groundbreaking molecular biologist.' },
      { order: 22, name: 'Footprints: Chapter 7 - The Necklace', description: 'By Guy de Maupassant. Classic moral tale of Mathilde Loisel, whose vanity leads to ten years of grueling poverty over a borrowed fake necklace.' },
      { order: 23, name: 'Footprints: Chapter 8 - Bholi', description: 'By K.A. Abbas. Empowering story of Sulekha (Bholi), whose compassionate teacher transforms her into a confident, self-respecting young woman.' },
      { order: 24, name: 'Footprints: Chapter 9 - The Book That Saved the Earth', description: 'By Claire Boiko. Science fiction play where a Martian invasion led by haughty Think-Tank is thwarted by nursery rhymes in Mother Goose.' },

      // English Language Skills
      { order: 25, name: 'Section A: Reading Comprehension', description: 'Techniques for solving unseen discursive and case-based factual passages, vocabulary inference, and thematic analysis.' },
      { order: 26, name: 'Section B: Writing Skills (Letters & Analytical Paragraphs)', description: 'Formal letter writing (complaint, inquiry, placing order, editor) and data interpretation for analytical paragraphs.' },
      { order: 27, name: 'Section C: Integrated Grammar', description: 'Class 10 CBSE grammar: tenses, modals, subject-verb concord, reported speech (commands, requests, statements, questions).' },
    ],
  },

  // 4. Social Science (SST) (22 NCERT Chapters across History, Geography, Pol Sci, Economics)
  SST10: {
    subjectName: 'Social Science',
    chapters: [
      // History: India and the Contemporary World - II
      { order: 1, name: 'History Ch 1: The Rise of Nationalism in Europe', description: 'French Revolution and the idea of nation, making of nationalism in Europe, revolutions of 1848, unifications of Germany and Italy, visualizing the nation.' },
      { order: 2, name: 'History Ch 2: Nationalism in India', description: 'First World War, Khilafat and Non-Cooperation Movement, differing strands within movements, Civil Disobedience Movement, Salt March, sense of collective belonging.' },
      { order: 3, name: 'History Ch 3: The Making of a Global World', description: 'Pre-modern world, Silk routes, 19th-century global economy, colonial impacts, Great Depression, rebuilding post-war economy (Bretton Woods institutions).' },
      { order: 4, name: 'History Ch 4: The Age of Industrialisation', description: 'Before the industrial revolution, proto-industrialisation, hand labour vs steam power, industrialisation in colonies, factories coming up in India, market for goods.' },
      { order: 5, name: 'History Ch 5: Print Culture and the Modern World', description: 'First printed books in East Asia, print comes to Europe, Gutenberg press, print revolution and French Revolution, reading mania, print culture in India.' },

      // Geography: Contemporary India - II
      { order: 6, name: 'Geography Ch 1: Resources and Development', description: 'Classification of resources, resource planning in India, land resources, land degradation and conservation measures, soil types and soil erosion/conservation.' },
      { order: 7, name: 'Geography Ch 2: Forest and Wildlife Resources', description: 'Flora and fauna in India, IUCN classification, factors causing depletion, conservation of forest and wildlife in India, Project Tiger, community conservation.' },
      { order: 8, name: 'Geography Ch 3: Water Resources', description: 'Water scarcity and need for conservation, multi-purpose river projects and integrated water resources management, rainwater harvesting techniques.' },
      { order: 9, name: 'Geography Ch 4: Agriculture', description: 'Types of farming (primitive subsistence, intensive subsistence, commercial), cropping pattern (Rabi, Kharif, Zaid), major food and non-food crops, technological and institutional reforms.' },
      { order: 10, name: 'Geography Ch 5: Minerals and Energy Resources', description: 'What is a mineral, mode of occurrence, classification (ferrous, non-ferrous, non-metallic), energy resources (conventional vs non-conventional), conservation.' },
      { order: 11, name: 'Geography Ch 6: Manufacturing Industries', description: 'Importance of manufacturing, industrial location, classification of industries, agro-based and mineral-based industries, industrial pollution and environmental degradation.' },
      { order: 12, name: 'Geography Ch 7: Lifelines of National Economy', description: 'Transport systems (roadways, railways, pipelines, waterways, major sea ports, airways), communication networks, international trade, tourism as a trade.' },

      // Political Science: Democratic Politics - II
      { order: 13, name: 'Pol Science Ch 1: Power-sharing', description: 'Case studies of Belgium and Sri Lanka, majoritarianism in Sri Lanka, accommodation in Belgium, why power sharing is desirable (prudential vs moral), forms of power sharing.' },
      { order: 14, name: 'Pol Science Ch 2: Federalism', description: 'What is federalism, key features, coming together vs holding together federations, what makes India a federal country, how is federalism practised, decentralisation in India.' },
      { order: 15, name: 'Pol Science Ch 3: Gender, Religion and Caste', description: 'Gender and politics (public/private division, women’s political representation), religion, communalism and politics, secular state, caste inequalities and caste in politics.' },
      { order: 16, name: 'Pol Science Ch 4: Political Parties', description: 'Why do we need political parties, functions and necessity, how many parties should we have, national vs state parties in India, challenges to political parties, reforming parties.' },
      { order: 17, name: 'Pol Science Ch 5: Outcomes of Democracy', description: 'How do we assess democracy’s outcomes, accountable, responsive and legitimate government, economic growth and development, reduction of inequality and poverty, accommodation of social diversity.' },

      // Economics: Understanding Economic Development
      { order: 18, name: 'Economics Ch 1: Development', description: 'What development promises (different people, different goals), income and other goals, national development, comparison of countries (per capita income, HDI), public facilities, sustainability.' },
      { order: 19, name: 'Economics Ch 2: Sectors of the Indian Economy', description: 'Primary, secondary and tertiary sectors, historical change in sectors, rising importance of tertiary sector, disguised unemployment, NREGA 2005, organized vs unorganized sectors.' },
      { order: 20, name: 'Economics Ch 3: Money and Credit', description: 'Money as a medium of exchange, modern forms of money, loan activities of banks, terms of credit, formal sector credit vs informal sector, Self Help Groups (SHGs) for the poor.' },
      { order: 21, name: 'Economics Ch 4: Globalisation and the Indian Economy', description: 'Production across countries, MNCs, integration of production and foreign trade, what is globalisation, factors enabling globalisation (technology, trade liberalisation, WTO), impact in India, fair globalisation.' },
      { order: 22, name: 'Economics Ch 5: Consumer Rights', description: 'Consumer movement in India, consumer rights (right to safety, information, choice, seek redressal, consumer education), COPRA (Consumer Protection Act), consumer courts.' },
    ],
  },
};

async function seedAllChapters() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB Atlas');

  const classObj = await Class.findOne({ name: 'Class 10' });
  if (!classObj) {
    throw new Error('Class 10 not found');
  }
  const classId = classObj._id;
  const schoolId = classObj.schoolId || 'school-default-01';

  console.log(`Target Class: ${classObj.name} (${classId}), School: ${schoolId}`);

  for (const [code, subjectData] of Object.entries(CLASS_10_CURRICULUM)) {
    // 1. Find or update subject
    let subject = await Subject.findOne({ code });
    if (!subject) {
      subject = await Subject.create({
        name: subjectData.subjectName,
        code,
        classIds: [classId],
        isElective: false,
        schoolId,
      });
      console.log(`Created Subject: ${subject.name} (${code})`);
    } else {
      // Update name if changed (e.g. English Communicative -> English Language & Literature)
      if (subject.name !== subjectData.subjectName) {
        subject.name = subjectData.subjectName;
      }
      if (!subject.classIds.some((c) => c.toString() === classId.toString())) {
        subject.classIds.push(classId);
      }
      await subject.save();
      console.log(`Updated Subject: ${subject.name} (${code})`);
    }

    // 2. Fetch existing topics for this subject
    const existingTopics = await Topic.find({ subjectId: subject._id }).lean();

    console.log(`Subject ${subject.name} currently has ${existingTopics.length} topics in DB.`);

    // 3. For each NCERT chapter, find matching or create
    for (const chapter of subjectData.chapters) {
      // Try to match by exact name or chapter number prefix
      const match = existingTopics.find((t) => {
        const cleanT = t.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const cleanC = chapter.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        return cleanT === cleanC || (t.name.includes(`Chapter ${chapter.order}:`) && chapter.name.includes(`Chapter ${chapter.order}:`));
      });

      if (match) {
        // Update existing topic while preserving _id
        await Topic.findByIdAndUpdate(match._id, {
          name: chapter.name,
          order: chapter.order,
          description: chapter.description,
          classId,
          schoolId,
        });
      } else {
        // Insert new topic
        await Topic.create({
          subjectId: subject._id,
          classId,
          name: chapter.name,
          order: chapter.order,
          description: chapter.description,
          schoolId,
        });
      }
    }

    const finalCount = await Topic.countDocuments({ subjectId: subject._id });
    console.log(`✅ Subject ${subject.name} (${code}) now has ${finalCount} complete NCERT chapters.`);
  }

  console.log('\n🎉 ALL NCERT CLASS 10 CHAPTERS INGESTED SUCCESSFULLY!');
  await mongoose.disconnect();
}

seedAllChapters().catch((err) => {
  console.error('Fatal seeding error:', err);
  process.exit(1);
});
