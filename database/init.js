/* YourTeacher - Database Schema & Seed Data (A1 -> C1) */

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  level TEXT NOT NULL DEFAULT 'A1',
  total_xp INTEGER NOT NULL DEFAULT 0,
  streak_days INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS levels (
  id INTEGER PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS units (
  id INTEGER PRIMARY KEY,
  level_id INTEGER NOT NULL,
  unit_number INTEGER NOT NULL,
  theme TEXT NOT NULL,
  grammar_focus TEXT NOT NULL,
  FOREIGN KEY (level_id) REFERENCES levels (id)
);
CREATE TABLE IF NOT EXISTS lessons (
  id INTEGER PRIMARY KEY,
  unit_id INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('reading','vocab','grammar')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  audio_url TEXT,
  FOREIGN KEY (unit_id) REFERENCES units (id)
);
CREATE TABLE IF NOT EXISTS quiz_questions (
  id INTEGER PRIMARY KEY,
  unit_id INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('mcq','fill_blank','match')),
  question_text TEXT NOT NULL,
  options_json TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  FOREIGN KEY (unit_id) REFERENCES units (id)
);
CREATE TABLE IF NOT EXISTS games (
  id INTEGER PRIMARY KEY,
  unit_id INTEGER NOT NULL,
  game_type TEXT NOT NULL CHECK (game_type IN ('flip_cards','sentence_builder')),
  data_json TEXT NOT NULL,
  FOREIGN KEY (unit_id) REFERENCES units (id)
);
CREATE TABLE IF NOT EXISTS user_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  unit_id INTEGER NOT NULL,
  lesson_type TEXT,
  lesson_completed INTEGER NOT NULL DEFAULT 0,
  quiz_score INTEGER,
  last_attempt DATE,
  FOREIGN KEY (user_id) REFERENCES users (id),
  FOREIGN KEY (unit_id) REFERENCES units (id),
  UNIQUE (user_id, unit_id, lesson_type)
);
`;

const SEED_LEVELS = [
  { code: 'A1', title: 'Beginner' },
  { code: 'A2', title: 'Elementary' },
  { code: 'B1', title: 'Intermediate' },
  { code: 'B2', title: 'Upper-Intermediate' },
  { code: 'C1', title: 'Advanced' }
];

const SEED_UNITS = [
  { level: 'A1', unit_number: 1, theme: 'Greetings',         grammar_focus: 'Verb "to be" and greetings' },
  { level: 'A1', unit_number: 2, theme: 'Numbers & Family',  grammar_focus: 'Possessive adjectives and "have got"' },
  { level: 'A1', unit_number: 3, theme: 'Food',              grammar_focus: 'Countable/uncountable nouns with "some/any"' },
  { level: 'A1', unit_number: 4, theme: 'Daily Routine',     grammar_focus: 'Present Simple for routines' },
  { level: 'A1', unit_number: 5, theme: 'Weather',           grammar_focus: 'Present Continuous and weather expressions' },
  { level: 'A2', unit_number: 1, theme: 'Past Tense',        grammar_focus: 'Past Simple regular & irregular verbs' },
  { level: 'A2', unit_number: 2, theme: 'Travel',            grammar_focus: 'Past Continuous and travel prepositions' },
  { level: 'A2', unit_number: 3, theme: 'Shopping',          grammar_focus: 'Comparatives & superlatives' },
  { level: 'A2', unit_number: 4, theme: 'Health',            grammar_focus: 'Modal verbs: should, must, can' },
  { level: 'A2', unit_number: 5, theme: 'Hobbies',           grammar_focus: 'Present Perfect vs Past Simple' },
  { level: 'B1', unit_number: 1, theme: 'Future Plans',      grammar_focus: 'Future forms: will, going to, present continuous' },
  { level: 'B1', unit_number: 2, theme: 'Work',              grammar_focus: 'Conditionals (0, 1st, 2nd)' },
  { level: 'B1', unit_number: 3, theme: 'Education',         grammar_focus: 'Passive voice' },
  { level: 'B1', unit_number: 4, theme: 'Environment',       grammar_focus: 'Relative clauses' },
  { level: 'B1', unit_number: 5, theme: 'Technology',        grammar_focus: 'Used to / would for past habits' },
  { level: 'B2', unit_number: 1, theme: 'Idioms',            grammar_focus: 'Advanced idiom structures & collocations' },
  { level: 'B2', unit_number: 2, theme: 'Business English',  grammar_focus: 'Formal registers & indirect language' },
  { level: 'B2', unit_number: 3, theme: 'Media',             grammar_focus: 'Reported speech & media discourse' },
  { level: 'B2', unit_number: 4, theme: 'Law & Justice',     grammar_focus: 'Modals of deduction (must/might/can\'t have)' },
  { level: 'B2', unit_number: 5, theme: 'Science',           grammar_focus: 'Cause, effect & concession linkers' },
  { level: 'C1', unit_number: 1, theme: 'Academic Writing',  grammar_focus: 'Nominalization & hedging' },
  { level: 'C1', unit_number: 2, theme: 'Nuanced Phrasal Verbs', grammar_focus: 'Three-part phrasal verbs & separability' },
  { level: 'C1', unit_number: 3, theme: 'Literature',        grammar_focus: 'Inversion & emphasis' },
  { level: 'C1', unit_number: 4, theme: 'Politics',          grammar_focus: 'Subjunctive & advanced conditionals' },
  { level: 'C1', unit_number: 5, theme: 'Negotiation',       grammar_focus: 'Diplomatic language & softening' }
];

/* LESSONS PART 2: A1 (appended by chunked write) */
const L = [];
function lesson(level, unit, type, title, content) { L.push({ level, unit, type, title, content }); }
function vocab(level, unit, title, items) { L.push({ level, unit, type: 'vocab', title, content: items }); }
function grammar(level, unit, title, explanation, examples, tip) { L.push({ level, unit, type: 'grammar', title, content: { explanation, examples, tip } }); }

lesson('A1',1,'reading','Meeting Someone New','Hello! My name is Emma. I am twenty-five years old and I live in London. Today is my first day at the new office. I meet my manager, Mr. Brown. "Good morning," he says. "Welcome to the team!" I smile and say, "Nice to meet you." Then I meet my colleagues. They are very friendly. We drink coffee together and talk about our weekend plans. I feel happy and excited. This is the start of a great adventure.');
vocab('A1',1,'Essential Greetings',[{word:'hello',definition:'A common word used to greet someone or answer the phone.'},{word:'goodbye',definition:'A word said when leaving someone.'},{word:'please',definition:'A polite word used when asking for something.'},{word:'thank you',definition:'A phrase expressing gratitude.'},{word:'sorry',definition:'A word used to apologize or express regret.'},{word:'morning',definition:'The early part of the day, from sunrise to noon.'},{word:'introduce',definition:'To tell someone the name of another person for the first time.'},{word:'acquaintance',definition:'A person you know slightly, but who is not a close friend.'},{word:'farewell',definition:'An act of parting; saying goodbye, often for a long time.'},{word:'courteous',definition:'Polite, respectful, and considerate in manner.'}]);
grammar('A1',1,'The Verb "To Be"','The verb "to be" is the most important verb in English. We use it to talk about identity, feelings, locations, and descriptions. The present forms are: I am, you are, he/she/it is, we are, they are. Negatives add "not" (I am not, she is not). Questions swap subject and verb: "Are you a student?" "Yes, I am."',['I am a student.','She is from Canada.','They are not at home.','Are you happy today?','It is a beautiful day.'],'Contractions make speech natural: I\'m, you\'re, he\'s, she\'s, they\'re, isn\'t, aren\'t.');

lesson('A1',2,'reading','My Big Family','I come from a big family. I have two brothers and one sister. My older brother is twenty-eight years old and my sister is twenty. My parents live in a small house near the sea. Every Sunday, we have lunch together. My grandmother always cooks her famous chicken soup. There are twelve people at the table. We laugh, we talk, and we feel lucky. Family is the most important thing in my life.');
vocab('A1',2,'Family Members',[{word:'mother',definition:'A female parent.'},{word:'father',definition:'A male parent.'},{word:'sibling',definition:'A brother or a sister.'},{word:'relative',definition:'A person connected by blood or marriage.'},{word:'daughter',definition:'A female child of a parent.'},{word:'nephew',definition:'The son of your brother or sister.'},{word:'cousin',definition:'The child of your aunt or uncle.'},{word:'grandfather',definition:'The father of your mother or father.'},{word:'twins',definition:'Two children born at the same birth.'},{word:'orphan',definition:'A child whose parents are no longer alive.'}]);
grammar('A1',2,'Have Got & Possessives','We use "have got" to talk about family, possessions, and relationships. I have got two brothers. She has got long hair. The negative is "haven\'t got / hasn\'t got" and the question is "Have you got...?" Possessive adjectives (my, your, his, her, our, their) always come before a noun: my mother, their house.',['I have got three cousins.','She has got a new bike.','Have you got any sisters?','My uncle lives in Rome.','Their dog is very friendly.'],'"Have got" is informal British English; American English often uses just "have": "I have two brothers."');

lesson('A1',3,'reading','At the Market','It is Saturday morning and Sarah goes to the local market. She buys fresh vegetables, some fruit, and a loaf of bread. The seller has beautiful red apples and sweet oranges. "How much is the cheese?" she asks. "Three euros," he answers. She also buys a bottle of milk and a small piece of chocolate. At home, she cooks pasta with tomatoes and basil. The kitchen smells delicious. Dinner is ready!');
vocab('A1',3,'Food & Drink',[{word:'breakfast',definition:'The first meal of the day, eaten in the morning.'},{word:'ingredient',definition:'One of the foods used to make a particular dish.'},{word:'recipe',definition:'Instructions for cooking a particular food.'},{word:'beverage',definition:'A drink, other than water.'},{word:'appetite',definition:'The feeling of wanting to eat.'},{word:'cuisine',definition:'A style or method of cooking, especially from a country.'},{word:'spicy',definition:'Tasting strongly of spices, especially hot spices.'},{word:'sour',definition:'Having a sharp, acidic taste, like lemon.'},{word:'portion',definition:'An amount of food served for one person.'},{word:'leftovers',definition:'Food remaining after a meal is finished.'}]);
grammar('A1',3,'Some, Any & Countables','Nouns can be countable (apple, book) or uncountable (water, rice). With countable nouns we use "some" in positive sentences and "any" in negatives and questions. Uncountable nouns are always singular: "some water", never "some waters". We ask about quantity with "How many...?" for countables and "How much...?" for uncountables.',['I have some apples.','Do you have any milk?','There isn\'t any rice left.','How many eggs do we need?','How much sugar do you want?'],'Some common uncountable nouns: water, bread, cheese, meat, juice, money, information, advice.');

lesson('A1',4,'reading','A Perfect Morning','Tom wakes up at seven o\'clock every morning. First, he takes a shower and gets dressed. Then he eats breakfast with his family. He usually has toast and coffee. At eight thirty, he walks to work. The walk takes twenty minutes. Tom likes his morning routine because it helps him start the day calmly. "Every day is a new chance," he often says with a smile.');
vocab('A1',4,'Daily Activities',[{word:'wake up',definition:'To stop sleeping and become conscious.'},{word:'commute',definition:'The journey from home to work and back.'},{word:'exercise',definition:'Physical activity done to stay healthy.'},{word:'schedule',definition:'A plan of activities with the times they will happen.'},{word:'household',definition:'Tasks done to maintain a home, like cleaning.'},{word:'errand',definition:'A short trip to do a specific task, like buying food.'},{word:'punctual',definition:'Arriving or doing something at the agreed time.'},{word:'habit',definition:'Something you do regularly, often without thinking.'},{word:'chores',definition:'Routine tasks, especially in the home.'},{word:'leisure',definition:'Free time when you are not working.'}]);
grammar('A1',4,'Present Simple','We use the Present Simple for habits, routines, and facts. With he, she, and it, we add -s or -es to the verb: she works, he watches. Negatives use "don\'t / doesn\'t": I don\'t smoke, she doesn\'t drive. Questions use "Do / Does": Do you like tea? Does he play football?',['I drink tea every morning.','She works in a hospital.','He doesn\'t eat meat.','Do they live here?','The sun rises in the east.'],'Adverbs of frequency (always, usually, sometimes, never) go before the main verb: "I always walk to work."');

lesson('A1',5,'reading','The Rainy Week','This week the weather in Manchester was terrible. It rained every day and the wind blew hard. On Tuesday, there was a big storm. Many trees fell down in the park. But on Friday, the sun finally came out. The sky was blue and the birds were singing. Everyone went outside to enjoy the warmth. Children played football in the garden. After a rainy week, the sunshine felt like a gift.');
vocab('A1',5,'Weather Words',[{word:'cloudy',definition:'When the sky is covered with clouds.'},{word:'humid',definition:'When the air feels warm and full of moisture.'},{word:'thunder',definition:'The loud noise after lightning during a storm.'},{word:'forecast',definition:'A prediction of future weather conditions.'},{word:'snowfall',definition:'An amount of snow that falls at one time.'},{word:'drizzle',definition:'Light rain falling in very small drops.'},{word:'breeze',definition:'A gentle, pleasant wind.'},{word:'frost',definition:'A thin layer of ice on surfaces in cold weather.'},{word:'drought',definition:'A long period with very little rain.'},{word:'umbrella',definition:'An object used to protect against rain.'}]);
grammar('A1',5,'Present Continuous','The Present Continuous describes actions happening right now. We form it with am/is/are + verb-ing: I am reading, she is cooking, they are playing. We also use it for temporary situations and future arrangements. It is not used with state verbs like know, want, or believe.',['I am studying English now.','It is raining outside.','They are not listening to music.','Are you coming tonight?','She is staying with us this week.'],'Spelling note: run \u2192 running, write \u2192 writing, swim \u2192 swimming (double the final consonant in short verbs).');

/* LESSONS PART 3: A2 */
lesson('A2',1,'reading','Last Summer Holiday','Last summer, I travelled to Italy with my best friend. We flew to Rome on a Friday morning. The city was hot and crowded, but we loved every minute. We visited the Colosseum, ate amazing pasta, and drank Italian coffee in small squares. On the last day, we got lost in a narrow street and found a tiny restaurant. The owner cooked us a free meal. Sometimes the best memories come from unexpected moments.');
vocab('A2',1,'Past Time Words',[{word:'yesterday',definition:'The day before today.'},{word:'fortnight',definition:'A period of two weeks.'},{word:'decade',definition:'A period of ten years.'},{word:'century',definition:'A period of one hundred years.'},{word:'recently',definition:'Not long ago; a short time in the past.'},{word:'previously',definition:'At an earlier time; before now.'},{word:'meanwhile',definition:'At the same time as something else.'},{word:'afterwards',definition:'At a later time; following an event.'},{word:'ago',definition:'Used to say how far back in time something happened.'},{word:'once',definition:'One single time in the past.'}]);
grammar('A2',1,'Past Simple','The Past Simple describes finished actions in the past. Regular verbs add -ed: worked, played, watched. Irregular verbs change form: go \u2192 went, eat \u2192 ate, see \u2192 saw. Negatives use "didn\'t" + base verb, and questions use "Did + subject + base verb?". Time expressions like yesterday, last week, and in 2019 signal the Past Simple.',['I watched a film last night.','She went to Paris in May.','We didn\'t eat breakfast.','Did you enjoy the party?','He bought a new car yesterday.'],'Remember common irregulars: go\u2192went, do\u2192did, have\u2192had, say\u2192said, make\u2192made, take\u2192took.');

lesson('A2',2,'reading','The Lost Suitcase','Maria arrived in Bangkok at midnight. She was tired but excited. When she went to collect her suitcase, she could not find it. The baggage office said it would arrive the next day. Maria was disappointed, but she did not cry. She bought some clothes in a night market and enjoyed a great dinner. The next morning, the airport called. Her suitcase was safe. In the end, the adventure was more fun than she expected.');
vocab('A2',2,'Travel Vocabulary',[{word:'luggage',definition:'Bags and suitcases used when travelling.'},{word:'departure',definition:'The act of leaving a place, or the time of leaving.'},{word:'destination',definition:'The place someone is travelling to.'},{word:'itinerary',definition:'A detailed plan or route of a journey.'},{word:'boarding pass',definition:'A card that allows you to get on a plane.'},{word:'customs',definition:'The place at a border where bags are checked.'},{word:'accommodation',definition:'A place to stay, such as a hotel or hostel.'},{word:'excursion',definition:'A short trip taken for pleasure.'},{word:'passport',definition:'An official document for travelling abroad.'},{word:'journey',definition:'The act of travelling from one place to another.'}]);
grammar('A2',2,'Past Continuous','The Past Continuous (was/were + verb-ing) describes an action in progress at a moment in the past. We often combine it with the Past Simple: the Past Continuous sets the scene and the Past Simple interrupts it. "I was cooking when the phone rang." It also describes two parallel actions: "While she was reading, he was watching TV."',['I was sleeping at ten o\'clock.','They were playing when it started to rain.','While I was walking, I saw an old friend.','What were you doing yesterday at five?','The sun was shining all morning.'],'Use "when" before the Past Simple and "while" before the Past Continuous.');

lesson('A2',3,'reading','The Big Sale','It was the first day of the winter sales and the shop was packed. Lisa wanted a warm coat, but everything looked too expensive. Then she saw a beautiful blue jacket. The original price was one hundred pounds, but the sale price was only forty-five. "This is a bargain!" she thought. She tried it on and it fitted perfectly. At the till, she paid by card and received a discount coupon for her next visit. Lisa left the shop feeling like a winner.');
vocab('A2',3,'Shopping Words',[{word:'receipt',definition:'A paper proof of payment for goods.'},{word:'refund',definition:'Money returned when you bring goods back.'},{word:'warranty',definition:'A promise to repair or replace a faulty product.'},{word:'checkout',definition:'The place in a shop where you pay.'},{word:'trolley',definition:'A cart used to carry goods in a supermarket.'},{word:'outlet',definition:'A shop selling goods at reduced prices.'},{word:'aisle',definition:'A passage between shelves in a shop.'},{word:'in stock',definition:'Available to buy at the moment.'},{word:'price tag',definition:'A label showing the price of an item.'},{word:'customer',definition:'A person who buys goods or services.'}]);
grammar('A2',3,'Comparatives & Superlatives','We use comparatives to compare two things: cheap \u2192 cheaper, interesting \u2192 more interesting. Superlatives describe the extreme in a group: the cheapest, the most interesting. Short adjectives take -er/-est; long adjectives use more/most. Irregular forms: good \u2192 better \u2192 the best, bad \u2192 worse \u2192 the worst.',['This shop is cheaper than that one.','She is the tallest girl in the class.','My phone is more expensive than yours.','It was the worst film I have ever seen.','Winter is colder than autumn.'],'Don\'t forget "the" before superlatives: "the best", not "best".');

lesson('A2',4,'reading','A Day at the Clinic','John did not feel well on Monday. His head hurt and he had a high temperature. His wife told him to stay at home and see a doctor. At the clinic, the doctor listened carefully and asked many questions. "You have the flu," she said. "You must rest, drink lots of water, and take these tablets." John followed the advice. After three days, he felt much better. Health is wealth, he decided.');
vocab('A2',4,'Health Vocabulary',[{word:'symptom',definition:'A sign that you are ill, like a fever or cough.'},{word:'prescription',definition:'A doctor\'s written order for medicine.'},{word:'allergy',definition:'A bad reaction to certain food or substances.'},{word:'injury',definition:'Damage to the body, such as a cut or broken bone.'},{word:'recovery',definition:'The process of becoming well again after illness.'},{word:'vaccination',definition:'An injection that protects against disease.'},{word:'exercise',definition:'Physical activity done to improve health.'},{word:'diet',definition:'The food and drink a person usually eats.'},{word:'check-up',definition:'A general health examination by a doctor.'},{word:'fatigue',definition:'A feeling of extreme tiredness.'}]);
grammar('A2',4,'Modal Verbs: Should, Must, Can','Modal verbs express advice, obligation, and ability. "Should" gives advice: You should sleep more. "Must" expresses strong obligation or necessity: You must see a doctor. "Can" expresses ability or permission: I can swim. The negative of "must" for prohibition is "mustn\'t", while "don\'t have to" means no obligation.',['You should eat more vegetables.','She must finish the report today.','I can speak three languages.','You mustn\'t smoke here.','We don\'t have to work on Sundays.'],'Modals never take -s, -ing, or -ed: "She can", never "She cans".');

lesson('A2',5,'reading','The Photography Club','Anna has always loved taking photos. Last year, she joined a photography club at the community centre. Every Wednesday, members meet and share their best pictures. Anna has already won two small competitions. Her favourite subject is nature: birds, flowers, and sunsets. "Photography teaches me to slow down and notice beauty," she explains. Her dream is to have an exhibition one day.');
vocab('A2',5,'Hobbies & Free Time',[{word:'collect',definition:'To gather things of the same type as a hobby.'},{word:'craft',definition:'Making things by hand with skill.'},{word:'gardening',definition:'Growing and caring for plants in a garden.'},{word:'knitting',definition:'Making clothes from wool using two needles.'},{word:'instrument',definition:'An object used to make music, like a guitar.'},{word:'tournament',definition:'A competition with many players or teams.'},{word:'volunteer',definition:'To work for free to help others.'},{word:'puzzle',definition:'A game that tests your thinking skills.'},{word:'hiking',definition:'Walking long distances in nature for pleasure.'},{word:'pastime',definition:'An activity done for enjoyment in free time.'}]);
grammar('A2',5,'Present Perfect vs Past Simple','The Present Perfect (have/has + past participle) connects the past to the present: experiences, unfinished time, and recent results. The Past Simple talks about finished actions at a known time. "I have visited Rome" (at some point in my life) vs "I visited Rome in 2019" (finished, specific time).',['I have lived here for five years.','She has never eaten sushi.','Have you ever seen a whale?','We met him yesterday.','They went to the cinema last week.'],'Signal words for Present Perfect: ever, never, yet, already, just, for, since.');

/* LESSONS PART 3b: B1 */
lesson('B1',1,'reading','Five Years From Now','What will life look like in 2031? Experts predict that technology will change everything. Self-driving cars will be common, and many people will work from home permanently. Artificial intelligence will assist doctors, teachers, and engineers. However, some jobs will disappear completely. The challenge for our generation will be to adapt quickly and keep learning. One thing is certain: the future belongs to those who prepare for it today.');
vocab('B1',1,'Future Vocabulary',[{word:'forecast',definition:'A prediction about future events, especially weather.'},{word:'ambition',definition:'A strong desire to achieve something.'},{word:'deadline',definition:'The latest time by which something must be done.'},{word:'postpone',definition:'To delay something to a later time.'},{word:'anticipate',definition:'To expect or predict something will happen.'},{word:'prospects',definition:'The chances of future success.'},{word:'upcoming',definition:'Happening soon; in the near future.'},{word:'eventual',definition:'Happening at the end of a process or period.'},{word:'inevitable',definition:'Certain to happen; unavoidable.'},{word:'tentative',definition:'Not certain or fixed; provisional.'}]);
grammar('B1',1,'Future Forms','English has several ways to talk about the future. "Will" is for predictions and instant decisions. "Going to" is for plans and intentions. The Present Continuous is for fixed arrangements with a time. The Present Simple is for timetables. Choose the form based on how certain and planned the action is.',['I think it will rain tomorrow.','I\'m going to study medicine.','We\'re meeting Sarah at six.','The train leaves at nine.','I\'ll help you with those bags.'],'"Will" for promises and offers: "I\'ll call you tonight."');

lesson('B1',2,'reading','The Job Interview','Nadia had prepared for the interview for weeks. She researched the company, practised common questions, and chose a smart outfit. When the manager asked why she wanted the job, she answered confidently: "Your company values innovation, and I want to contribute to projects that matter." The interview lasted an hour. Two days later, she received the offer. Her preparation had paid off.');
vocab('B1',2,'Work & Career',[{word:'colleague',definition:'A person you work with.'},{word:'salary',definition:'Fixed regular payment for work, usually monthly.'},{word:'promotion',definition:'Being raised to a higher position at work.'},{word:'resign',definition:'To formally leave a job.'},{word:'recruit',definition:'To find and hire new employees.'},{word:'shift',definition:'A scheduled period of work, e.g., night shift.'},{word:'overtime',definition:'Time worked beyond the normal hours.'},{word:'redundant',definition:'No longer needed; often losing a job for this reason.'},{word:'applicants',definition:'People who apply for a job.'},{word:'workload',definition:'The amount of work a person has to do.'}]);
grammar('B1',2,'Conditionals 0, 1, 2','Conditionals express cause and effect. Zero conditional (if + present, present) states facts: If you heat water, it boils. First conditional (if + present, will + verb) talks about real future possibilities: If it rains, I will stay home. Second conditional (if + past, would + verb) talks about unreal or hypothetical situations: If I had money, I would travel.',['If you mix red and blue, you get purple.','If she studies hard, she will pass.','If I were you, I would apologise.','What will you do if you miss the bus?','I would buy a house if I won the lottery.'],'In the second conditional, "were" is correct for all persons: "If I were rich..."');

lesson('B1',3,'reading','The Online Classroom','Education is being transformed by technology. Millions of students now attend online lectures, submit assignments digitally, and collaborate with classmates across the world. Universities are being redesigned around hybrid models. Critics argue that online learning reduces social skills, while supporters claim it increases access for everyone. What cannot be denied is that the traditional classroom is being challenged as never before.');
vocab('B1',3,'Education Vocabulary',[{word:'curriculum',definition:'The subjects taught in a school or course.'},{word:'semester',definition:'One of the two periods of a school year.'},{word:'graduate',definition:'A person who has completed a degree.'},{word:'scholarship',definition:'Money given to support a student\'s studies.'},{word:'assignment',definition:'A piece of work given to a student.'},{word:'lecture',definition:'A formal talk given to students on a subject.'},{word:'discipline',definition:'A branch of knowledge, e.g., biology.'},{word:'tuition',definition:'Teaching, or the fee paid for it.'},{word:'enrol',definition:'To register as a student on a course.'},{word:'thesis',definition:'A long written study for a university degree.'}]);
grammar('B1',3,'The Passive Voice','In the passive voice, the object of an action becomes the subject. We form it with be + past participle: The book was written by her. We use the passive when the actor is unknown, unimportant, or obvious, or to sound formal and objective. Every tense has a passive form: is done, was done, will be done, has been done.',['English is spoken in many countries.','The bridge was built in 1920.','My car is being repaired.','The results will be announced tomorrow.','The window has been broken.'],'Add "by + agent" only when the actor matters: "The Mona Lisa was painted by da Vinci."');

lesson('B1',4,'reading','The Green City','Copenhagen is often called one of the greenest cities in the world. Bicycles outnumber cars on most streets, and wind turbines supply a large share of the city\'s electricity. Citizens sort their waste carefully and many buildings are covered with plants. The government has promised to become carbon neutral by 2025. Experts who have studied similar projects believe that small daily choices, made by millions of people, create the biggest change.');
vocab('B1',4,'Environment Words',[{word:'pollution',definition:'Harmful substances in air, water, or soil.'},{word:'renewable',definition:'Energy from sources that never run out, like wind.'},{word:'emissions',definition:'Gases released into the air, especially CO2.'},{word:'recycle',definition:'To process waste so it can be used again.'},{word:'habitat',definition:'The natural home of a plant or animal.'},{word:'biodiversity',definition:'The variety of living species in an area.'},{word:'fossil fuels',definition:'Coal, oil, and gas formed from ancient organisms.'},{word:'deforestation',definition:'The large-scale cutting down of forests.'},{word:'ecosystem',definition:'A community of living things and their environment.'},{word:'sustainable',definition:'Using resources without destroying the future.'}]);
grammar('B1',4,'Relative Clauses','Relative clauses give extra information about a noun using who, which, that, where, and whose. Defining clauses are essential to meaning and have no commas: The man who lives next door is a pilot. Non-defining clauses add extra information and use commas: My brother, who lives in Berlin, is visiting us. In non-defining clauses we cannot use "that".',['The book that I borrowed is excellent.','She met a woman who speaks six languages.','Paris, which is the capital of France, is beautiful.','This is the caf\u00e9 where we first met.','The student whose project won is very proud.'],'We can omit "who/which/that" when it is the object: "The film (that) we watched was great."');

lesson('B1',5,'reading','Life Before Smartphones','People who grew up before smartphones remember a different world. They used paper maps, wrote letters, and memorised phone numbers. Teenagers arranged meetings at fixed times and places. Today, many young adults cannot imagine life without constant connection. Researchers who have compared the two generations note that earlier generations developed stronger face-to-face communication skills, while younger ones excel at multitasking and information access.');
vocab('B1',5,'Technology Words',[{word:'device',definition:'A machine or tool made for a specific purpose.'},{word:'software',definition:'The programs used by a computer.'},{word:'download',definition:'To copy data from the internet to your device.'},{word:'password',definition:'A secret word used to access an account.'},{word:'network',definition:'A system connecting computers to share information.'},{word:'browsing',definition:'Looking through information on the internet.'},{word:'storage',definition:'Space for keeping digital files.'},{word:'update',definition:'A newer version of software.'},{word:'backup',definition:'A copy of data kept in case of loss.'},{word:'interface',definition:'The screen through which a user operates software.'}]);
grammar('B1',5,'Used To & Would','"Used to + infinitive" describes past habits and states that are no longer true: I used to play tennis every weekend. "Would + infinitive" also describes repeated past actions, but not states: Every summer we would visit grandma. For negatives and questions we use "didn\'t use to" and "Did you use to...?" Be careful: "be used to + -ing" means being accustomed to something now.',['I used to live in the countryside.','She didn\'t use to like fish.','Did you use to have long hair?','We would sit by the fire every evening.','I am used to waking up early now.'],'"Used to" is only for the past. For present habits, use the Present Simple or "be used to + -ing".');

/* LESSONS PART 4: B2 */
lesson('B2',1,'reading','Reading Between the Lines','Idioms are the spice of any language. When someone says "it\'s raining cats and dogs", no animals are falling from the sky. Idioms like "bite the bullet", "hit the nail on the head", and "let the cat out of the bag" carry meanings that cannot be understood word by word. Linguists argue that idioms reflect the culture and history of their speakers. Mastering them is a milestone for language learners, because it signals that they think in the new language, not just translate from the old one.');
vocab('B2',1,'Common Idioms',[{word:'piece of cake',definition:'Something very easy to do.'},{word:'break the ice',definition:'To start a conversation in a tense or new situation.'},{word:'hit the books',definition:'To study hard.'},{word:'under the weather',definition:'Feeling ill or sick.'},{word:'cost an arm and a leg',definition:'To be very expensive.'},{word:'once in a blue moon',definition:'Very rarely.'},{word:'spill the beans',definition:'To reveal a secret.'},{word:'bite the bullet',definition:'To face something unpleasant bravely.'},{word:'the ball is in your court',definition:'It is your turn to decide or act.'},{word:'burn the midnight oil',definition:'To work late into the night.'}]);
grammar('B2',1,'Collocations & Fixed Expressions','Collocations are word combinations that native speakers use naturally: make a decision (not do a decision), heavy rain (not strong rain). Learning collocations, rather than isolated words, makes speech fluent and natural. Common patterns include verb + noun (take a break), adjective + noun (strong coffee), and adverb + adjective (deeply sorry).',['She made a strong impression.','We reached an agreement.','He paid attention to the details.','It was a heated discussion.','They committed a crime.'],'Keep a collocation notebook: record words with their partners, not alone.');

lesson('B2',2,'reading','The Merger','The merger between the two firms was announced after months of secret negotiations. Executives promised that no jobs would be cut, but employees remained sceptical. The new CEO addressed the staff in a town-hall meeting: "Change can be uncomfortable, but it also brings opportunities. We must embrace innovation and hold each other accountable." In the following quarter, productivity rose and morale improved. The sceptics began to believe.');
vocab('B2',2,'Business Vocabulary',[{word:'stakeholder',definition:'Anyone with an interest in a company\'s success.'},{word:'revenue',definition:'Money earned from business activities.'},{word:'deadline',definition:'The final time by which work must be completed.'},{word:'outsource',definition:'To pay an outside company to do work.'},{word:'benchmark',definition:'A standard against which things are measured.'},{word:'agenda',definition:'A list of items to discuss in a meeting.'},{word:'consensus',definition:'General agreement among a group.'},{word:'liability',definition:'A legal or financial responsibility.'},{word:'turnover',definition:'The rate at which employees leave and are replaced.'},{word:'strategy',definition:'A long-term plan to achieve goals.'}]);
grammar('B2',2,'Formal & Indirect Language','Business English relies on indirect, polite language. Instead of "I want", we say "I would like". Instead of "You must", we say "It would be advisable to". Passive structures and modal verbs soften statements: "The report could be improved" instead of "The report is bad". Question tags and negative openings also make requests less direct: "Would you mind sending the file?"',['I was wondering if you could help me.','It might be better to postpone the meeting.','We would appreciate your feedback.','Could you possibly send the report by Friday?','I\'m afraid that won\'t be possible.'],'In emails, open with context before the request: "Following our call yesterday, I would like to..."');

lesson('B2',3,'reading','The 24-Hour News Cycle','News used to be something we checked once a day. Today, headlines are updated every minute, and algorithms decide what we see. Media analysts warn that constant exposure to dramatic stories increases anxiety and distorts our view of reality. "We are not consuming news; news is consuming us," one journalist wrote. Meanwhile, fact-checking organisations have grown rapidly, helping readers separate verified information from rumour and manipulation.');
vocab('B2',3,'Media Vocabulary',[{word:'headline',definition:'The title of a news story.'},{word:'editorial',definition:'An article expressing the opinion of the editors.'},{word:'broadcast',definition:'To transmit a program on radio or television.'},{word:'coverage',definition:'The reporting of a particular event by media.'},{word:'paparazzi',definition:'Photographers who follow famous people.'},{word:'censorship',definition:'The suppression of information by authorities.'},{word:'circulation',definition:'The number of copies of a newspaper sold.'},{word:'scoop',definition:'An important news story reported first.'},{word:'bias',definition:'Unfair favouring of one side over another.'},{word:'viral',definition:'Spreading rapidly across the internet.'}]);
grammar('B2',3,'Reported Speech','Reported speech tells us what someone said without quoting them exactly. We shift the tense back: present becomes past, past becomes past perfect, and will becomes would. Pronouns and time expressions also change: "I am busy today" becomes "She said she was busy that day". Reporting verbs include say, tell, ask, explain, and claim.',['He said he was tired.','She told me she had finished.','They asked where the station was.','He promised he would help.','She explained that she had already eaten.'],'Use "tell + person" (she told me) and "say" without a person (she said that...).');

lesson('B2',4,'reading','The Jury\'s Dilemma','The courtroom was silent as the jury returned. Twelve ordinary citizens had spent three days weighing evidence, listening to witnesses, and debating the meaning of reasonable doubt. The defendant, a young man accused of theft, watched them nervously. "We find the defendant not guilty," announced the foreman. Relief spread across the room. The case demonstrated how justice depends not only on laws, but on the careful judgment of ordinary people.');
vocab('B2',4,'Law & Justice Words',[{word:'verdict',definition:'The jury\'s formal decision of guilty or not guilty.'},{word:'testimony',definition:'A formal statement given in court.'},{word:'innocent',definition:'Not guilty of a crime.'},{word:'prosecution',definition:'The lawyers trying to prove someone is guilty.'},{word:'acquittal',definition:'A formal decision that someone is not guilty.'},{word:'sentence',definition:'The punishment given by a judge.'},{word:'witness',definition:'A person who saw an event and can describe it.'},{word:'statute',definition:'A written law passed by a legislature.'},{word:'appeal',definition:'A request for a higher court to review a decision.'},{word:'parole',definition:'Early release from prison under conditions.'}]);
grammar('B2',4,'Modals of Deduction','Modals of deduction express how certain we are about a conclusion. "Must have + past participle" means we are almost sure: She must have forgotten. "Might/may/could have" means it is possible: He might have missed the train. "Can\'t have" means we are sure something did not happen: They can\'t have arrived yet \u2014 the flight was delayed.',['She must have studied hard; she passed easily.','He might have left already.','You could have told me!','They can\'t have seen us; it was too dark.','The lights are off \u2014 they must have gone out.'],'For present deduction: must be (sure), might be (possible), can\'t be (impossible).');

lesson('B2',5,'reading','The Discovery','In 2012, physicists at CERN announced the detection of the Higgs boson, a particle that had been predicted decades earlier. The discovery confirmed a key part of our understanding of how matter acquires mass. Thousands of scientists from dozens of countries had collaborated on the experiment, which consumed enormous resources. Although the result delighted the scientific community, researchers were quick to note that many questions about the universe remain unanswered.');
vocab('B2',5,'Science Vocabulary',[{word:'hypothesis',definition:'An idea that can be tested by experiments.'},{word:'experiment',definition:'A scientific test to prove or disprove something.'},{word:'observation',definition:'Careful watching to gather information.'},{word:'molecule',definition:'The smallest unit of a chemical compound.'},{word:'gravity',definition:'The force that pulls objects toward each other.'},{word:'species',definition:'A group of similar living organisms.'},{word:'climate',definition:'The typical weather of a region over time.'},{word:'laboratory',definition:'A room equipped for scientific work.'},{word:'research',definition:'Systematic study to discover new facts.'},{word:'theory',definition:'A well-supported explanation of natural phenomena.'}]);
grammar('B2',5,'Linkers: Cause, Effect & Concession','Advanced writing connects ideas with linkers. Cause: because, due to, as a result of. Effect: therefore, consequently, as a result, so. Concession (contrast): although, despite, however, nevertheless. "Despite" and "in spite of" are followed by a noun or -ing form, not a full clause. Formal linkers improve the flow and logic of essays and reports.',['The flight was cancelled due to the storm.','He missed the bus; therefore, he was late.','Although it rained, we enjoyed the walk.','Despite being tired, she finished the race.','The project was expensive. Nevertheless, it succeeded.'],'"Because of" + noun; "because" + clause: "We stayed in because it was raining."');

/* LESSONS PART 4b: C1 */
lesson('C1',1,'reading','The Art of Academic Prose','Academic writing demands precision, restraint, and structure. Scholars avoid sweeping claims; instead, they hedge: "The evidence suggests" rather than "This proves". Ideas are nominalized \u2014 turned into nouns \u2014 to increase density: "The implementation of the policy" instead of "They implemented the policy". Citations anchor every claim in prior research. The result is prose that reads slowly but rewards careful attention, carrying arguments that can withstand the scrutiny of peers across decades.');
vocab('C1',1,'Academic Vocabulary',[{word:'abstract',definition:'A short summary of a research paper.'},{word:'methodology',definition:'The system of methods used in research.'},{word:'empirical',definition:'Based on observation or experiment.'},{word:'premise',definition:'A statement that an argument is based on.'},{word:'synthesize',definition:'To combine ideas from different sources.'},{word:'paradigm',definition:'A typical example or model of something.'},{word:'correlation',definition:'A mutual relationship between two things.'},{word:'variable',definition:'An element that can change in an experiment.'},{word:'conclusion',definition:'The end part of a study summarising findings.'},{word:'peer review',definition:'Evaluation of research by experts in the field.'}]);
grammar('C1',1,'Hedging & Nominalization','Hedging softens claims to sound objective: use modal verbs (may, might, could), adverbs (apparently, presumably, arguably), and verbs like suggest, indicate, and appear. Nominalization turns verbs and adjectives into nouns, making writing more formal and compact: "The destruction of the forest" instead of "They destroyed the forest". Both techniques are hallmarks of advanced academic style.',['The data suggest a possible correlation.','It appears that the hypothesis is correct.','The implementation of reforms took years.','His failure to respond was surprising.','Climate change is widely acknowledged as a threat.'],'Avoid absolutes like "always", "never", and "proves" in academic writing.');

lesson('C1',2,'reading','Breaking Down Barriers','Phrasal verbs are the invisible engine of natural English. A native speaker does not "tolerate" a difficult situation; they "put up with" it. They do not "postpone" a meeting; they "put it off". Three-part phrasal verbs add another layer: "come up with" an idea, "look forward to" an event, "get along with" a colleague. Their meaning often cannot be guessed from the individual words, which is why they separate fluent speakers from competent ones.');
vocab('C1',2,'Advanced Phrasal Verbs',[{word:'bring about',definition:'To cause something to happen.'},{word:'carry out',definition:'To perform or complete a task.'},{word:'come across',definition:'To find something by chance.'},{word:'do away with',definition:'To abolish or get rid of something.'},{word:'fall through',definition:'When a plan fails to happen.'},{word:'keep up with',definition:'To stay at the same level as others.'},{word:'put up with',definition:'To tolerate something unpleasant.'},{word:'run into',definition:'To meet someone unexpectedly.'},{word:'take after',definition:'To resemble a family member.'},{word:'look down on',definition:'To regard someone as inferior.'}]);
grammar('C1',2,'Separable Phrasal Verbs','Some phrasal verbs are separable: the object can go between the verb and the particle. "Turn the light off" or "turn off the light". With pronouns, separation is mandatory: "turn it off" (never "turn off it"). Inseparable phrasal verbs keep the object after the particle: "look after the children". Three-part phrasal verbs are always inseparable: "come up with a plan".',['She picked the children up. / She picked up the children.','I\'ll look it up.','He ran into an old friend.','We must get rid of this furniture.','They called the meeting off.'],'When in doubt, put the object after the particle \u2014 it is almost always safe.');

lesson('C1',3,'reading','Why We Read Novels','Great literature does not merely entertain; it transforms. When we read Dostoevsky or Morrison, we inhabit minds unlike our own and confront questions we might otherwise avoid. Literary critics distinguish between plot \u2014 what happens \u2014 and theme \u2014 what it means. The finest novels achieve both simultaneously: a gripping narrative that also illuminates the human condition. In an age of distraction, the sustained attention that reading demands has itself become a kind of resistance.');
vocab('C1',3,'Literary Terms',[{word:'protagonist',definition:'The main character of a story.'},{word:'metaphor',definition:'A figure of speech describing something as another.'},{word:'narrative',definition:'A spoken or written account of events.'},{word:'satire',definition:'Work using humour to criticise society.'},{word:'allegory',definition:'A story with a hidden moral or political meaning.'},{word:'foreshadowing',definition:'Hints about what will happen later in a story.'},{word:'soliloquy',definition:'A speech in which a character speaks their thoughts.'},{word:'genre',definition:'A category of artistic composition, e.g., thriller.'},{word:'motif',definition:'A recurring image or idea in a work of art.'},{word:'epilogue',definition:'A section at the end of a book adding closure.'}]);
grammar('C1',3,'Inversion & Emphasis','Inversion reverses the normal word order for dramatic or formal emphasis. After negative adverbials at the start of a sentence, we invert the auxiliary: "Never had I seen..." "Rarely does she complain." "Not only... but also" structures also trigger inversion in the first clause. Inversion is common in formal writing and speeches.',['Never have I heard such a brilliant idea.','Rarely does the team lose at home.','Not only did she win, but she broke the record.','Under no circumstances should you open that door.','Hardly had we sat down when the phone rang.'],'Inversion only happens when the negative phrase begins the sentence.');

lesson('C1',4,'reading','The Art of Compromise','Democracy runs on compromise, yet compromise has acquired a bad reputation. Politicians who concede ground are labelled weak; those who refuse are praised as principled. Political scientists counter that enduring agreements are almost always the product of mutual concession. The challenge is distinguishing compromise from capitulation: the former serves the public interest, the latter abandons core values. Healthy democracies need citizens who can tell the difference.');
vocab('C1',4,'Politics Vocabulary',[{word:'legislation',definition:'Laws considered or made by a parliament.'},{word:'constituency',definition:'An area represented by an elected official.'},{word:'bipartisan',definition:'Involving cooperation between two parties.'},{word:'ratify',definition:'To formally approve an agreement or treaty.'},{word:'incumbent',definition:'The person currently holding an office.'},{word:'veto',definition:'The power to reject a decision or proposal.'},{word:'sanction',definition:'A penalty imposed to enforce compliance.'},{word:'referendum',definition:'A vote by the public on a single issue.'},{word:'ideology',definition:'A system of political beliefs and ideas.'},{word:'diplomacy',definition:'The management of relations between states.'}]);
grammar('C1',4,'Subjunctive & Advanced Conditionals','The subjunctive expresses wishes, demands, and hypotheticals using the base form: "I suggest that he attend the meeting." After adjectives like essential or crucial: "It is essential that she be informed." Advanced conditionals mix tenses and use inversion: "Had I known, I would have acted differently" (= If I had known). "Were it not for..." is a formal alternative to "If it weren\'t for..."',['The judge demanded that the witness tell the truth.','It is vital that the data remain confidential.','Had we left earlier, we would not have missed the flight.','Were it not for your help, I would have failed.','Should you need assistance, call this number.'],'"Should" inversion is common in formal letters: "Should you have questions, please reply."');

lesson('C1',5,'reading','The Deal','Negotiation is less about winning arguments than about discovering mutual interests. Skilled negotiators ask open questions, listen more than they speak, and frame proposals in terms the other side can accept. They avoid ultimata, which corner counterparts and damage relationships. Instead, they create options: "If we extend the timeline, could you increase the volume?" The best agreements are those where both parties leave feeling respected \u2014 and return to the table willingly.');
vocab('C1',5,'Negotiation Vocabulary',[{word:'concession',definition:'Something granted in a negotiation.'},{word:'stakeholder',definition:'A person with an interest in the outcome.'},{word:'deadlock',definition:'A situation where no progress is possible.'},{word:'leverage',definition:'Power or influence used to gain advantage.'},{word:'counteroffer',definition:'A new offer made in response to another.'},{word:'clause',definition:'A specific provision in a contract.'},{word:'consensus',definition:'General agreement among all parties.'},{word:'ultimatum',definition:'A final demand with a stated consequence.'},{word:'goodwill',definition:'Friendly and cooperative intentions.'},{word:'binding',definition:'Legally obligatory and enforceable.'}]);
grammar('C1',5,'Diplomatic Language & Softening','Diplomatic language achieves goals without causing offence. Techniques include: distancing ("It would seem that..."), downtoners ("somewhat", "rather", "a little"), conditional framing ("That might be difficult"), and partial agreement before disagreement ("I see your point, but..."). Indirect questions and passive structures also reduce confrontation. Mastery of softening is essential in high-stakes conversations.',['I\'m afraid that might not work for us.','Perhaps we could consider an alternative.','With respect, I see it somewhat differently.','It would appear that the deadline has passed.','That\'s a fair point; however, we have other constraints.'],'Combine agreement and disagreement: "I agree up to a point, but..."');

/* QUIZ QUESTIONS PART 5 */
const Q = [];
function q(level, unit, type, question, options, correct) { Q.push({ level, unit, type, question, options, correct }); }
function qm(level, unit, question, pairs) { Q.push({ level, unit, type: 'match', question, options: pairs, correct: null }); }

// A1 Unit 1
q('A1',1,'mcq','Which greeting is formal?',['Hey!','What\'s up?','Good morning','Hiya'],'Good morning');
q('A1',1,'fill_blank','"Nice to ____ you," she said when they met for the first time.',['meet','know','see','have'],'meet');
q('A1',1,'mcq','Choose the correct sentence:',['I am fine, thank you.','I is fine, thank you.','I are fine, thank you.','I be fine, thank you.'],'I am fine, thank you.');
qm('A1',1,'Match the greetings to their use.',{ 'Goodbye': 'When leaving someone', 'Please': 'When asking politely', 'Sorry': 'When apologising', 'Welcome': 'Greeting a guest' });
q('A1',1,'fill_blank','"Good ____!" \u2014 said at 8 in the morning.',['night','morning','evening','afternoon'],'morning');

// A1 Unit 2
q('A1',2,'mcq','Your father\'s brother is your...',['uncle','nephew','cousin','grandfather'],'uncle');
q('A1',2,'fill_blank','I have ____ two brothers and one sister.',['got','get','getting','gets'],'got');
q('A1',2,'mcq','Choose the correct form:',['She have got long hair.','She has got long hair.','She has get long hair.','She haves got long hair.'],'She has got long hair.');
qm('A1',2,'Match family members to definitions.',{ 'Sibling': 'A brother or sister', 'Niece': 'Your brother\'s daughter', 'Twin': 'Born at the same birth', 'Orphan': 'Child without living parents' });
q('A1',2,'fill_blank','____ you got any sisters?',['Have','Has','Do','Are'],'Have');

// A1 Unit 3
q('A1',3,'mcq','Which word is uncountable?',['apple','bread','egg','banana'],'bread');
q('A1',3,'fill_blank','Do you have ____ milk?',['some','any','many','a'],'any');
q('A1',3,'mcq','"How ____ sugar do you want?"',['many','much','more','lot'],'much');
qm('A1',3,'Match taste words to foods.',{ 'Lemon': 'Sour', 'Chilli': 'Spicy', 'Sugar': 'Sweet', 'Salt': 'Salty' });
q('A1',3,'fill_blank','I have ____ apples in my bag.',['some','any','much','an'],'some');

// A1 Unit 4
q('A1',4,'mcq','She ____ to work every day.',['walk','walks','walking','walked'],'walks');
q('A1',4,'fill_blank','I ____ smoke. It\'s bad for me.',['don\'t','doesn\'t','not','am not'],'don\'t');
q('A1',4,'mcq','Choose the correct question:',['Do she likes tea?','Does she like tea?','Does she likes tea?','Do she like tea?'],'Does she like tea?');
qm('A1',4,'Match verbs to times.',{ 'Wake up': 'In the morning', 'Have lunch': 'At midday', 'Go to bed': 'At night', 'Commute': 'To and from work' });
q('A1',4,'fill_blank','He always ____ up early.',['wakes','wake','waking','woke'],'wakes');

// A1 Unit 5
q('A1',5,'mcq','Which describes gentle wind?',['storm','breeze','frost','flood'],'breeze');
q('A1',5,'fill_blank','It ____ right now. Take an umbrella!',['is raining','rains','raining','rain'],'is raining');
q('A1',5,'mcq','Choose the correct sentence:',['They are playing in the garden.','They is playing in the garden.','They playing in the garden.','They be playing in the garden.'],'They are playing in the garden.');
qm('A1',5,'Match weather words to meanings.',{ 'Drizzle': 'Light rain', 'Thunder': 'Loud storm noise', 'Frost': 'Ice layer in cold', 'Drought': 'No rain for long' });
q('A1',5,'fill_blank','The birds ____ singing. The sun ____ shining.',['are / is','is / are','are / are','is / is'],'are / is');

// A2 Unit 1
q('A2',1,'mcq','Past tense of "go":',['goed','went','gone','going'],'went');
q('A2',1,'fill_blank','We ____ a great film last night.',['watch','watched','watching','watches'],'watched');
q('A2',1,'mcq','Choose the correct negative:',['I didn\'t went there.','I didn\'t go there.','I not went there.','I don\'t went there.'],'I didn\'t go there.');
qm('A2',1,'Match irregular past forms.',{ 'eat': 'ate', 'see': 'saw', 'take': 'took', 'make': 'made' });
q('A2',1,'fill_blank','____ you enjoy the party yesterday?',['Do','Did','Were','Had'],'Did');

// A2 Unit 2
q('A2',2,'mcq','What do you show to board a plane?',['passport','boarding pass','receipt','coupon'],'boarding pass');
q('A2',2,'fill_blank','I ____ sleeping when the alarm rang.',['am','was','were','been'],'was');
q('A2',2,'mcq','Choose the correct sentence:',['While she read, I cooked.','While she was reading, I cooked.','While she reading, I cooked.','While she was read, I cooked.'],'While she was reading, I cooked.');
qm('A2',2,'Match travel words to meanings.',{ 'Itinerary': 'Journey plan', 'Destination': 'Where you are going', 'Accommodation': 'Place to stay', 'Excursion': 'Short pleasure trip' });
q('A2',2,'fill_blank','They ____ playing football when it started to rain.',['was','were','are','is'],'were');

// A2 Unit 3
q('A2',3,'mcq','Comparative of "cheap":',['more cheap','cheaper','cheapier','most cheap'],'cheaper');
q('A2',3,'fill_blank','This is the ____ book I have ever read.',['good','better','best','goodest'],'best');
q('A2',3,'mcq','Choose the correct sentence:',['She is more tall than me.','She is taller than me.','She is tallest than me.','She is most tall than me.'],'She is taller than me.');
qm('A2',3,'Match shopping words to meanings.',{ 'Receipt': 'Proof of payment', 'Refund': 'Money returned', 'Warranty': 'Repair promise', 'Outlet': 'Discount shop' });
q('A2',3,'fill_blank','My phone is ____ expensive ____ yours.',['more / than','most / than','more / then','much / of'],'more / than');

// A2 Unit 4
q('A2',4,'mcq','Which gives advice?',['You must sleep.','You should sleep.','You can sleep.','You do sleep.'],'You should sleep.');
q('A2',4,'fill_blank','You ____ smoke here. It\'s prohibited.',['shouldn\'t','mustn\'t','can\'t to','don\'t have to'],'mustn\'t');
q('A2',4,'mcq','"You don\'t have to work on Sundays" means:',['Working Sunday is forbidden','Working Sunday is optional','You must work Sunday','You can never work Sunday'],'Working Sunday is optional');
qm('A2',4,'Match health words to meanings.',{ 'Symptom': 'Sign of illness', 'Prescription': 'Doctor\'s medicine order', 'Allergy': 'Bad reaction', 'Recovery': 'Getting well again' });
q('A2',4,'fill_blank','I ____ speak three languages.',['should','must','can','ought'],'can');

// A2 Unit 5
q('A2',5,'mcq','"I have lived here for five years" uses:',['Past Simple','Present Perfect','Present Continuous','Future'],'Present Perfect');
q('A2',5,'fill_blank','She has never ____ sushi.',['eat','ate','eaten','eating'],'eaten');
q('A2',5,'mcq','Choose the correct sentence:',['I visited Rome in my life.','I have visited Rome in my life.','I am visiting Rome in my life.','I visit Rome in my life.'],'I have visited Rome in my life.');
qm('A2',5,'Match hobby words to meanings.',{ 'Knitting': 'Making clothes with needles', 'Hiking': 'Long nature walks', 'Tournament': 'Many-team competition', 'Volunteer': 'Work for free' });
q('A2',5,'fill_blank','We met him ____.',['yet','yesterday','already','ever'],'yesterday');

// B1 Unit 1
q('B1',1,'mcq','Which is a fixed arrangement?',['I will meet her.','I\'m meeting her at six.','I meet her at six.','I going to meet her.'],'I\'m meeting her at six.');
q('B1',1,'fill_blank','The train ____ at nine o\'clock.',['will leave','is leaving','leaves','going to leave'],'leaves');
q('B1',1,'mcq','"I\'ll help you with those bags" is:',['A plan','An offer','A timetable','A prediction'],'An offer');
qm('B1',1,'Match future forms to uses.',{ 'Will': 'Instant decision', 'Going to': 'Intention', 'Present Continuous': 'Fixed arrangement', 'Present Simple': 'Timetable' });
q('B1',1,'fill_blank','I think it ____ rain tomorrow.',['will','is going','is','shall to'],'will');

// B1 Unit 2
q('B1',2,'mcq','"If it rains, I ____ stay home." (First conditional)',['will','would','am','did'],'will');
q('B1',2,'fill_blank','If I ____ rich, I would travel the world.',['am','was','were','be'],'were');
q('B1',2,'mcq','Zero conditional expresses:',['Hypothetical situations','Scientific facts','Future plans','Past regrets'],'Scientific facts');
qm('B1',2,'Match conditional types to structures.',{ 'Zero': 'If + present, present', 'First': 'If + present, will', 'Second': 'If + past, would', 'Third': 'If + past perfect, would have' });
q('B1',2,'fill_blank','If you ____ red and blue, you get purple.',['mix','mixed','will mix','would mix'],'mix');

// B1 Unit 3
q('B1',3,'mcq','Passive form of "They built the bridge in 1920":',['The bridge was built in 1920.','The bridge built in 1920.','The bridge is building in 1920.','The bridge were built in 1920.'],'The bridge was built in 1920.');
q('B1',3,'fill_blank','English ____ in many countries.',['speaks','is spoken','spoken','speaking'],'is spoken');
q('B1',3,'mcq','When do we prefer the passive?',['When the actor is unimportant','When we want informal tone','When the subject is short','Never'],'When the actor is unimportant');
qm('B1',3,'Match education words to meanings.',{ 'Curriculum': 'Subjects taught', 'Scholarship': 'Study funding', 'Thesis': 'Degree study', 'Enrol': 'Register for a course' });
q('B1',3,'fill_blank','The results ____ announced tomorrow.',['will','will be','are be','been'],'will be');

// B1 Unit 4
q('B1',4,'mcq','"The book ____ I borrowed" \u2014 choose the pronoun:',['who','which','where','whose'],'which');
q('B1',4,'fill_blank','My brother, ____ lives in Berlin, is visiting us.',['that','which','who','whose'],'who');
q('B1',4,'mcq','Which sentence uses a non-defining clause?',['The man who called is my boss.','Paris, which is the capital, is beautiful.','The book that I read was great.','The car which I bought is red.'],'Paris, which is the capital, is beautiful.');
qm('B1',4,'Match environment words to meanings.',{ 'Renewable': 'Never-runs-out energy', 'Emissions': 'Released gases', 'Habitat': 'Natural home', 'Sustainable': 'Future-safe use' });
q('B1',4,'fill_blank','This is the cafe ____ we first met.',['which','who','where','whose'],'where');

// B1 Unit 5
q('B1',5,'mcq','"I ____ play tennis every weekend" (past habit):',['used to','use to','was used','using to'],'used to');
q('B1',5,'fill_blank','Every summer we ____ visit grandma.',['would','will','are','used'],'would');
q('B1',5,'mcq','Which describes a present habit?',['I used to wake early.','I am used to waking early.','I would wake early.','I use to waking early.'],'I am used to waking early.');
qm('B1',5,'Match tech words to meanings.',{ 'Software': 'Computer programs', 'Network': 'Connected systems', 'Backup': 'Safety copy', 'Interface': 'User screen' });
q('B1',5,'fill_blank','She didn\'t use ____ like fish.',['to','too','two','\u2014'],'to');

// B2 Unit 1
q('B2',1,'mcq','"It\'s a piece of cake" means:',['It\'s delicious','It\'s very easy','It\'s expensive','It\'s complicated'],'It\'s very easy');
q('B2',1,'fill_blank','I have to study tonight \u2014 I need to ____.',['break the ice','hit the books','spill the beans','burn bridges'],'hit the books');
q('B2',1,'mcq','"Once in a blue moon" means:',['Every night','Very rarely','On Mondays','During storms'],'Very rarely');
qm('B2',1,'Match idioms to meanings.',{ 'Break the ice': 'Start a conversation', 'Under the weather': 'Feeling ill', 'Cost an arm and a leg': 'Very expensive', 'Burn the midnight oil': 'Work late' });
q('B2',1,'fill_blank','Don\'t ____ \u2014 it\'s a surprise!',['break the ice','spill the beans','hit the books','sleep on it'],'spill the beans');

// B2 Unit 2
q('B2',2,'mcq','Most polite business request:',['Send me the file.','I want the file.','Could you possibly send the file?','Give the file.'],'Could you possibly send the file?');
q('B2',2,'fill_blank','I ____ wondering if you could help me.',['am','was','were','been'],'was');
q('B2',2,'mcq','"It might be better to postpone" is an example of:',['Direct command','Indirect softening','Threat','Sarcasm'],'Indirect softening');
qm('B2',2,'Match business words to meanings.',{ 'Revenue': 'Money earned', 'Stakeholder': 'Interested party', 'Consensus': 'General agreement', 'Outsource': 'Pay outside company' });
q('B2',2,'fill_blank','We would ____ your feedback.',['appreciate','appreciation','appreciating','appreciated'],'appreciate');

// B2 Unit 3
q('B2',3,'mcq','Reported: "I am busy" \u2192 She said she ____ busy.',['is','was','were','been'],'was');
q('B2',3,'fill_blank','He told me he ____ finished the report.',['has','had','have','having'],'had');
q('B2',3,'mcq','Which reporting verb needs a person after it?',['say','tell','claim','explain'],'tell');
qm('B2',3,'Match media words to meanings.',{ 'Editorial': 'Editors\' opinion piece', 'Bias': 'Unfair favouring', 'Scoop': 'First-reported story', 'Coverage': 'Event reporting' });
q('B2',3,'fill_blank','She asked ____ the station was.',['that','where','what','which'],'where');

// B2 Unit 4
q('B2',4,'mcq','"She must have forgotten" expresses:',['Obligation','Near certainty about the past','Permission','A command'],'Near certainty about the past');
q('B2',4,'fill_blank','They ____ have arrived yet \u2014 the flight was delayed.',['mustn\'t','can\'t','shouldn\'t','wouldn\'t'],'can\'t');
q('B2',4,'mcq','The jury\'s decision of guilt is called the:',['verdict','testimony','appeal','parole'],'verdict');
qm('B2',4,'Match law words to meanings.',{ 'Acquittal': 'Found not guilty', 'Sentence': 'Punishment given', 'Testimony': 'Court statement', 'Statute': 'Written law' });
q('B2',4,'fill_blank','He ____ have missed the train; it\'s possible.',['must','can\'t','might','shouldn\'t'],'might');

// B2 Unit 5
q('B2',5,'mcq','"Due to" must be followed by:',['A clause','A noun phrase','An adjective','A verb'],'A noun phrase');
q('B2',5,'fill_blank','He missed the bus; ____, he was late.',['because','therefore','although','despite'],'therefore');
q('B2',5,'mcq','Choose the correct sentence:',['Despite it rained, we walked.','Despite the rain, we walked.','Despite of the rain, we walked.','Despite raining we walked.'],'Despite the rain, we walked.');
qm('B2',5,'Match science words to meanings.',{ 'Hypothesis': 'Testable idea', 'Empirical': 'Observation-based', 'Correlation': 'Mutual relation', 'Peer review': 'Expert evaluation' });
q('B2',5,'fill_blank','The project was expensive. ____, it succeeded.',['Therefore','Nevertheless','Because','Although'],'Nevertheless');

// C1 Unit 1
q('C1',1,'mcq','Which is an academic hedge?',['This proves that...','The evidence suggests...','It is obvious that...','Everyone knows...'],'The evidence suggests...');
q('C1',1,'fill_blank','Nominalized form of "They implemented the policy":',['The policy implementation','Implementing the policy','The implement','Policy was implement'],'The policy implementation');
q('C1',1,'mcq','Which word is academic hedging?',['always','never','presumably','undoubtedly'],'presumably');
qm('C1',1,'Match academic words to meanings.',{ 'Abstract': 'Paper summary', 'Empirical': 'Observation-based', 'Premise': 'Argument foundation', 'Synthesize': 'Combine sources' });
q('C1',1,'fill_blank','The ____ of reforms took many years.',['implement','implementation','implementing','implemented'],'implementation');

// C1 Unit 2
q('C1',2,'mcq','Correct pronoun position: "turn off the light":',['turn off it','turn it off','turn off them light','it turn off'],'turn it off');
q('C1',2,'fill_blank','I\'ll ____ the word in the dictionary.',['look it up','look up it','look it','look up'],'look it up');
q('C1',2,'mcq','"Put up with" means:',['Build','Tolerate','Raise','Delay'],'Tolerate');
qm('C1',2,'Match phrasal verbs to meanings.',{ 'Bring about': 'Cause to happen', 'Fall through': 'Plan fails', 'Run into': 'Meet by chance', 'Take after': 'Resemble family' });
q('C1',2,'fill_blank','We must ____ this old furniture.',['do away','do away with','do with away','away do'],'do away with');

// C1 Unit 3
q('C1',3,'mcq','Inversion in:',['I never saw that.','Never have I seen that.','Never I have seen that.','Have never I seen that.'],'Never have I seen that.');
q('C1',3,'fill_blank','____ I known, I would have acted differently.',['If','Had','Have','Having'],'Had');
q('C1',3,'mcq','A "soliloquy" is:',['A love poem','A character\'s spoken thoughts','A chorus song','A stage direction'],'A character\'s spoken thoughts');
qm('C1',3,'Match literary terms to meanings.',{ 'Metaphor': 'A-as-B figure of speech', 'Allegory': 'Hidden-meaning story', 'Foreshadowing': 'Hints of later events', 'Motif': 'Recurring image' });
q('C1',3,'fill_blank','Not only did she win, ____ she broke the record.',['and','but','but also','also'],'but also');

// C1 Unit 4
q('C1',4,'mcq','Subjunctive correct form:',['I suggest that he attends.','I suggest that he attend.','I suggest that he attending.','I suggest that he attended.'],'I suggest that he attend.');
q('C1',4,'fill_blank','It is essential that she ____ informed.',['is','be','was','being'],'be');
q('C1',4,'mcq','"Were it not for your help" means:',['If it were not for your help','Because of your help','When your help arrived','Your help was unnecessary'],'If it were not for your help');
qm('C1',4,'Match politics words to meanings.',{ 'Ratify': 'Formally approve', 'Veto': 'Power to reject', 'Bipartisan': 'Two-party cooperation', 'Referendum': 'Public vote on one issue' });
q('C1',4,'fill_blank','____ you need assistance, call this number.',['If','Should','Would','Could'],'Should');

// C1 Unit 5
q('C1',5,'mcq','Best diplomatic disagreement:',['You are wrong.','That\'s stupid.','I see your point, but I see it differently.','No way.'],'I see your point, but I see it differently.');
q('C1',5,'fill_blank','I\'m ____ that might not work for us.',['afraid','afraidly','fear','scare'],'afraid');
q('C1',5,'mcq','A "deadlock" in negotiation means:',['Fast agreement','No progress possible','Final contract','Friendly talk'],'No progress possible');
qm('C1',5,'Match negotiation words to meanings.',{ 'Leverage': 'Influence for advantage', 'Counteroffer': 'Response offer', 'Ultimatum': 'Final demand', 'Binding': 'Legally obligatory' });
q('C1',5,'fill_blank','Perhaps we ____ consider an alternative.',['could','can to','may to','might to'],'could');

/* GAMES PART 7 */
const G = [];
function flip(level, unit, cards) { G.push({ level, unit, game_type: 'flip_cards', data: { cards } }); }
function build(level, unit, sentences) { G.push({ level, unit, game_type: 'sentence_builder', data: { sentences } }); }

// Flip cards: vocabulary per unit
flip('A1',1,[{front:'hello',back:'A common word used to greet someone.'},{front:'goodbye',back:'A word said when leaving someone.'},{front:'please',back:'A polite word used when asking.'},{front:'acquaintance',back:'A person you know slightly.'},{front:'courteous',back:'Polite and respectful in manner.'}]);
flip('A1',2,[{front:'sibling',back:'A brother or a sister.'},{front:'nephew',back:'The son of your brother or sister.'},{front:'twins',back:'Two children born at the same birth.'},{front:'orphan',back:'A child without living parents.'},{front:'relative',back:'A person connected by blood or marriage.'}]);
flip('A1',3,[{front:'ingredient',back:'A food used to make a dish.'},{front:'beverage',back:'A drink other than water.'},{front:'cuisine',back:'A style of cooking from a country.'},{front:'appetite',back:'The feeling of wanting to eat.'},{front:'leftovers',back:'Food remaining after a meal.'}]);
flip('A1',4,[{front:'commute',back:'The journey from home to work and back.'},{front:'punctual',back:'Arriving at the agreed time.'},{front:'chores',back:'Routine tasks, especially at home.'},{front:'leisure',back:'Free time when not working.'},{front:'errand',back:'A short trip to do a task.'}]);
flip('A1',5,[{front:'drizzle',back:'Light rain in very small drops.'},{front:'breeze',back:'A gentle, pleasant wind.'},{front:'thunder',back:'Loud noise after lightning.'},{front:'frost',back:'Thin ice layer in cold weather.'},{front:'drought',back:'A long period with little rain.'}]);
flip('A2',1,[{front:'fortnight',back:'A period of two weeks.'},{front:'decade',back:'A period of ten years.'},{front:'previously',back:'At an earlier time.'},{front:'meanwhile',back:'At the same time as something else.'},{front:'afterwards',back:'At a later time.'}]);
flip('A2',2,[{front:'itinerary',back:'A detailed plan or route of a journey.'},{front:'departure',back:'The act or time of leaving.'},{front:'accommodation',back:'A place to stay.'},{front:'excursion',back:'A short trip for pleasure.'},{front:'boarding pass',back:'A card that lets you board a plane.'}]);
flip('A2',3,[{front:'receipt',back:'Proof of payment for goods.'},{front:'refund',back:'Money returned for returned goods.'},{front:'warranty',back:'Promise to repair a faulty product.'},{front:'outlet',back:'A shop selling at reduced prices.'},{front:'aisle',back:'A passage between shop shelves.'}]);
flip('A2',4,[{front:'symptom',back:'A sign that you are ill.'},{front:'prescription',back:'A doctor\'s written order for medicine.'},{front:'allergy',back:'A bad reaction to substances.'},{front:'recovery',back:'The process of becoming well again.'},{front:'fatigue',back:'A feeling of extreme tiredness.'}]);
flip('A2',5,[{front:'collect',back:'To gather things of the same type.'},{front:'knitting',back:'Making clothes from wool with needles.'},{front:'tournament',back:'A competition with many players.'},{front:'volunteer',back:'To work for free to help others.'},{front:'pastime',back:'An activity done for enjoyment.'}]);
flip('B1',1,[{front:'ambition',back:'A strong desire to achieve something.'},{front:'deadline',back:'The latest time work must be done.'},{front:'postpone',back:'To delay to a later time.'},{front:'inevitable',back:'Certain to happen; unavoidable.'},{front:'prospects',back:'Chances of future success.'}]);
flip('B1',2,[{front:'colleague',back:'A person you work with.'},{front:'resign',back:'To formally leave a job.'},{front:'promotion',back:'Being raised to a higher position.'},{front:'redundant',back:'No longer needed; often losing a job.'},{front:'workload',back:'The amount of work to do.'}]);
flip('B1',3,[{front:'curriculum',back:'Subjects taught in a course.'},{front:'scholarship',back:'Money supporting a student\'s studies.'},{front:'lecture',back:'A formal talk to students.'},{front:'thesis',back:'A long study for a degree.'},{front:'tuition',back:'Teaching or the fee for it.'}]);
flip('B1',4,[{front:'renewable',back:'Energy from sources that never run out.'},{front:'emissions',back:'Gases released into the air.'},{front:'biodiversity',back:'Variety of living species.'},{front:'deforestation',back:'Large-scale cutting of forests.'},{front:'ecosystem',back:'A community of living things.'}]);
flip('B1',5,[{front:'device',back:'A machine made for a purpose.'},{front:'storage',back:'Space for keeping digital files.'},{front:'backup',back:'A copy of data kept in case of loss.'},{front:'interface',back:'The screen for operating software.'},{front:'network',back:'A system connecting computers.'}]);
flip('B2',1,[{front:'piece of cake',back:'Something very easy.'},{front:'break the ice',back:'To start a tense or new conversation.'},{front:'burn the midnight oil',back:'To work late into the night.'},{front:'once in a blue moon',back:'Very rarely.'},{front:'the ball is in your court',back:'It is your turn to decide.'}]);
flip('B2',2,[{front:'stakeholder',back:'Anyone with an interest in a company.'},{front:'revenue',back:'Money earned from business.'},{front:'consensus',back:'General agreement among a group.'},{front:'liability',back:'A legal or financial responsibility.'},{front:'benchmark',back:'A standard for measurement.'}]);
flip('B2',3,[{front:'editorial',back:'An article expressing editors\' opinion.'},{front:'bias',back:'Unfair favouring of one side.'},{front:'scoop',back:'An important story reported first.'},{front:'censorship',back:'Suppression of information.'},{front:'circulation',back:'Number of copies sold.'}]);
flip('B2',4,[{front:'verdict',back:'The jury\'s decision of guilt.'},{front:'testimony',back:'A formal court statement.'},{front:'acquittal',back:'A decision of not guilty.'},{front:'statute',back:'A written law.'},{front:'parole',back:'Early release under conditions.'}]);
flip('B2',5,[{front:'hypothesis',back:'An idea testable by experiment.'},{front:'empirical',back:'Based on observation.'},{front:'correlation',back:'A mutual relationship.'},{front:'molecule',back:'The smallest unit of a compound.'},{front:'peer review',back:'Evaluation by field experts.'}]);
flip('C1',1,[{front:'abstract',back:'A short summary of a paper.'},{front:'methodology',back:'The system of research methods.'},{front:'premise',back:'A statement an argument rests on.'},{front:'paradigm',back:'A typical model of something.'},{front:'nominalization',back:'Turning verbs into nouns.'}]);
flip('C1',2,[{front:'bring about',back:'To cause something to happen.'},{front:'do away with',back:'To abolish or get rid of.'},{front:'keep up with',back:'To stay at the same level.'},{front:'put up with',back:'To tolerate something unpleasant.'},{front:'look down on',back:'To regard as inferior.'}]);
flip('C1',3,[{front:'protagonist',back:'The main character.'},{front:'soliloquy',back:'A character\'s spoken thoughts.'},{front:'satire',back:'Humour criticising society.'},{front:'motif',back:'A recurring image or idea.'},{front:'foreshadowing',back:'Hints of later events.'}]);
flip('C1',4,[{front:'legislation',back:'Laws made by a parliament.'},{front:'ratify',back:'To formally approve.'},{front:'incumbent',back:'The person currently in office.'},{front:'veto',back:'Power to reject a decision.'},{front:'diplomacy',back:'Managing relations between states.'}]);
flip('C1',5,[{front:'concession',back:'Something granted in negotiation.'},{front:'deadlock',back:'No progress possible.'},{front:'leverage',back:'Influence used for advantage.'},{front:'counteroffer',back:'A response offer.'},{front:'ultimatum',back:'A final demand with a consequence.'}]);

// Sentence builder: reorder jumbled words into correct sentences
build('A1',1,[{target:'I am very happy to meet you',words:['happy','meet','I','am','to','very','you']},{target:'She is my best friend',words:['is','friend','best','my','She']},{target:'Good morning everyone',words:['Good','everyone','morning']},{target:'Please sit down and relax',words:['relax','Please','down','and','sit']}]);
build('A1',2,[{target:'I have got two brothers',words:['got','have','brothers','two','I']},{target:'My mother is very kind',words:['very','is','kind','mother','My']},{target:'Their house is near the sea',words:['sea','house','Their','the','near','is']},{target:'She has got a new bike',words:['got','bike','She','new','has','a']}]);
build('A1',3,[{target:'I would like some water please',words:['like','would','please','water','I','some']},{target:'Do you have any milk',words:['milk','Do','any','have','you']},{target:'How much sugar do you want',words:['want','do','much','you','How','sugar']},{target:'There is some cheese on the table',words:['cheese','some','There','table','the','is','on']}]);
build('A1',4,[{target:'He walks to work every day',words:['to','every','He','day','walks','work']},{target:'She does not drink coffee',words:['coffee','She','not','does','drink']},{target:'Do they live here',words:['live','Do','they','here']},{target:'I always wake up early',words:['early','always','I','wake','up']}]);
build('A1',5,[{target:'It is raining outside right now',words:['raining','right','now','It','outside','is']},{target:'They are playing in the garden',words:['garden','the','They','in','playing','are']},{target:'The sun is shining today',words:['shining','today','is','The','sun']},{target:'Are you coming tonight',words:['tonight','coming','Are','you']}]);
build('A2',1,[{target:'I watched a great film last night',words:['night','a','I','film','last','watched','great']},{target:'She went to Paris in May',words:['Paris','May','in','She','went','to']},{target:'We did not eat breakfast yesterday',words:['eat','not','We','did','yesterday','breakfast']},{target:'Did you enjoy the party',words:['enjoy','Did','the','you','party']}]);
build('A2',2,[{target:'I was sleeping at ten o clock',words:['ten','sleeping','at','I','clock','was']},{target:'They were playing when it rained',words:['were','it','playing','when','They','rained']},{target:'While I was walking I saw a friend',words:['I','While','friend','walking','was','saw','a']}]);
build('A2',3,[{target:'This shop is cheaper than that one',words:['one','shop','This','that','than','cheaper','is']},{target:'She is the tallest girl in class',words:['in','tallest','She','girl','the','class','is']},{target:'It was the worst film ever',words:['was','worst','ever','the','It','film']}]);
build('A2',4,[{target:'You should eat more vegetables',words:['more','You','vegetables','should','eat']},{target:'She must finish the report today',words:['must','finish','She','report','today','the']},{target:'We do not have to work on Sundays',words:['to','on','not','We','work','Sundays','have','do']}]);
build('A2',5,[{target:'I have lived here for five years',words:['lived','for','I','years','have','here','five']},{target:'She has never eaten sushi',words:['never','sushi','eaten','She','has']},{target:'We met him yesterday at noon',words:['him','at','We','noon','yesterday','met']}]);
build('B1',1,[{target:'I am going to study medicine next year',words:['to','study','going','next','am','I','medicine','year']},{target:'The train leaves at nine o clock',words:['leaves','nine','clock','The','at','train','o']},{target:'We are meeting Sarah at six',words:['six','Sarah','We','at','meeting','are']},{target:'I think it will rain tomorrow',words:['tomorrow','think','will','rain','I','it']}]);
build('B1',2,[{target:'If it rains I will stay home',words:['home','rains','stay','If','will','it','I']},{target:'If I were you I would apologise',words:['were','would','you','If','I','apologise','I']},{target:'If you heat water it boils',words:['boils','you','water','If','heat','it']}]);
build('B1',3,[{target:'The bridge was built in nineteen twenty',words:['nineteen','built','bridge','The','in','was','twenty']},{target:'My car is being repaired right now',words:['being','car','right','My','now','repaired','is']},{target:'The results will be announced tomorrow',words:['tomorrow','announced','will','The','be','results']}]);
build('B1',4,[{target:'The book that I borrowed is excellent',words:['borrowed','I','book','is','The','that','excellent']},{target:'Paris which is the capital is beautiful',words:['Paris','capital','the','is','which','beautiful','is']},{target:'This is the cafe where we met',words:['cafe','where','met','we','This','is','the']}]);
build('B1',5,[{target:'I used to play tennis every weekend',words:['to','tennis','play','every','I','used','weekend']},{target:'Every summer we would visit grandma',words:['summer','we','Every','grandma','would','visit']},{target:'I am used to waking up early',words:['to','early','am','up','I','waking','used']}]);
build('B2',1,[{target:'Learning idioms is a piece of cake for her',words:['idioms','cake','Learning','piece','of','her','a','is']},{target:'I hit the books before the exam',words:['the','before','books','exam','hit','I','the']},{target:'Once in a blue moon we eat out',words:['we','in','moon','blue','Once','eat','out','a']}]);
build('B2',2,[{target:'I was wondering if you could help me',words:['wondering','help','was','if','you','I','could','me']},{target:'It might be better to postpone the meeting',words:['better','postpone','meeting','the','It','to','might','be']},{target:'We would appreciate your feedback',words:['would','appreciate','feedback','We','your']}]);
build('B2',3,[{target:'He said he had finished the report',words:['finished','said','He','report','he','the','had']},{target:'She told me she was very busy',words:['me','told','busy','She','very','she','was']},{target:'They asked where the station was',words:['where','asked','They','station','was','the']}]);
build('B2',4,[{target:'She must have studied very hard',words:['studied','She','have','very','must','hard']},{target:'They can not have seen us in the dark',words:['seen','have','the','They','us','can','dark','not','in']},{target:'He might have missed the morning train',words:['might','the','train','He','have','morning','missed']}]);
build('B2',5,[{target:'The flight was cancelled due to the storm',words:['cancelled','The','to','storm','due','flight','the','was']},{target:'Despite being tired she finished the race',words:['she','tired','finished','Despite','race','the','being']},{target:'The project was expensive nevertheless it succeeded',words:['it','was','expensive','nevertheless','project','The','succeeded']}]);
build('C1',1,[{target:'The evidence suggests a possible correlation',words:['suggests','evidence','The','a','possible','correlation']},{target:'The implementation of reforms took years',words:['of','implementation','reforms','took','The','years']},{target:'His failure to respond was surprising',words:['to','failure','was','His','respond','surprising']}]);
build('C1',2,[{target:'She picked the children up from school',words:['the','up','picked','children','from','She','school']},{target:'I will look it up in the dictionary',words:['it','will','dictionary','the','in','up','I','look']},{target:'We must do away with this furniture',words:['away','furniture','We','must','with','do','this']}]);
build('C1',3,[{target:'Never have I seen such a brilliant idea',words:['I','such','Never','a','have','idea','brilliant','seen']},{target:'Had I known I would have acted differently',words:['I','Had','known','differently','have','would','acted','I']},{target:'Not only did she win but also she broke the record',words:['did','she','win','but','Not','only','also','she','the','record','broke']}]);
build('C1',4,[{target:'I suggest that he attend the meeting',words:['that','the','suggest','he','I','attend','meeting']},{target:'It is essential that she be informed',words:['It','essential','be','that','she','informed','is']},{target:'Should you need assistance call this number',words:['you','assistance','need','Should','number','call','this']}]);
build('C1',5,[{target:'I am afraid that might not work for us',words:['afraid','for','might','I','that','not','am','us','work']},{target:'Perhaps we could consider an alternative',words:['consider','Perhaps','we','could','an','alternative']},{target:'With respect I see it somewhat differently',words:['respect','I','it','differently','With','somewhat','see']}]);

/* WRITING PROMPTS PART 8 */
const W = [];
function w(level, prompt) { W.push({ level, prompt }); }
w('A1','Write 5 sentences introducing yourself: your name, age, where you live, and one thing you like.');
w('A1','Describe your family. Write about your parents, siblings, or friends using "have got".');
w('A1','Describe your favourite meal. What ingredients does it have?');
w('A1','Write about your daily routine from morning to night using the Present Simple.');
w('A1','Describe the weather today and what people are doing because of it.');
w('A2','Write about your last holiday. What did you do and where did you go?');
w('A2','Tell a short story about a travel problem you had or imagine.');
w('A2','Compare two shops or two products using comparatives and superlatives.');
w('A2','Give advice to a friend who is sick. Use "should", "must", and "can".');
w('A2','Describe your favourite hobby and why you enjoy it.');
w('B1','Describe your plans for the next five years using different future forms.');
w('B1','Describe your dream job. What would you do if you got it?');
w('B1','Write about an invention that changed the world. Use the passive voice.');
w('B1','Write an opinion paragraph about protecting the environment.');
w('B1','Compare life before smartphones and life today.');
w('B2','Write a formal email asking a company for information about their services.');
w('B2','Summarise a news story you heard recently in your own words.');
w('B2','Write a courtroom speech defending or accusing a character from a film.');
w('B2','Explain a scientific discovery to a friend using cause-effect linkers.');
w('B2','Write a review of a film or book using idiom-rich language.');
w('C1','Write an academic-style paragraph about the benefits of reading literature.');
w('C1','Write a short dialogue where two colleagues disagree politely about a project.');
w('C1','Describe a character from a novel using inversion and emphasis for effect.');
w('C1','Write a speech about why compromise is essential in politics.');
w('C1','Write a negotiation email proposing new contract terms diplomatically.');

/* ASSEMBLE EXPORTS */
function toLessons() {
  return L.map((l) => ({ level: l.level, unit: l.unit, type: l.type, title: l.title, content: JSON.stringify(l.content), audio_url: null }));
}
function toQuestions() {
  return Q.map((q) => ({
    level: q.level, unit: q.unit, type: q.type,
    question_text: q.question,
    options_json: JSON.stringify(q.options || []),
    correct_answer: q.correct !== undefined && q.correct !== null ? q.correct : ''
  }));
}
function toGames() {
  return G.map((g) => ({ level: g.level, unit: g.unit, game_type: g.game_type, data_json: JSON.stringify(g.data) }));
}

module.exports = { SCHEMA_SQL, SEED_LEVELS, SEED_UNITS, SEED_LESSONS: toLessons(), SEED_QUESTIONS: toQuestions(), SEED_GAMES: toGames() };
