// ============================================================
// Sophia and the Rat Jungle
// ============================================================
// SAVE SHAPE: locked at version 3. See SaveManager.
// (v1 → v3 and v2 → v3 migrations: puzzlesSolved restructured to
//  story-based names matching the animal-stop framing.)
//
// GAME SHAPE: Top-down jungle is a MAP. Sophia walks paths between
// 5 STOPS. Each stop is a parallax scene where she meets an animal
// in trouble and helps by solving a 3-question quiz (QuizManager).
// Stop puzzles are CONTENT, not custom mini-games — same engine for
// every stop. Parent Mode lets a parent set this week's homework
// (spelling/maths/reading) — the game uses real school content if
// entered, defaults otherwise.
//
// FIVE STOPS (story-based puzzlesSolved keys):
//   1. 🐀 Snowy's hungry      → MATHS                 (sumBridge)
//   2. 🦀 Crab's sore claw    → SPELLING              (wordTree)
//   3. 🐍 Knotted snake       → PATTERNS (default)    (snakeKnots)
//   4. 🦇 Bat's hurt wing     → COUNTING under load   (batWing)
//   5. 🦜 Lost parrot         → READING comprehension (parrotStory)
//
// Each stop unlocks the next. Finale = the PARTY (all animals gather,
// Golden Banana descends, Play Again).
//
// SOPHIA SPAWN: always (1200, 900). Position not persisted.
//
// CAVE: currently Option A (dim-overlay). Graduate to Option B
// (separate scene) when wiring Stop 4 (Bat's hurt wing).
//
// ARCHIVED: see disabled/flower-puzzle.js for the old colour-match
// puzzle (binned as too babyish — kept for potential little-kid mode).
// The Sum Bridge in-world maths puzzle was attempted and rolled back
// before commit (replaced by the QuizManager architecture).
// ============================================================

const SOPHIA_SPEED = 200;
const RAT_GAP = 40;
const RAT_LERP = 0.08;
const WORLD_W = 2400;
const WORLD_H = 1800;
const CAVE_CENTER = { x: 2000, y: 280 };
const CAVE_DIM_RADIUS = 380;

const PEEK_SPOTS = [
  { id: 'waterfall',    x: 1500, y: 1030 },
  { id: 'beach-sunset', x: 500,  y: 1450 }
];

const BANANA_SPOTS = [
  { x: 200,  y: 250  },
  { x: 1100, y: 250  },
  { x: 1850, y: 400  },
  { x: 2000, y: 220  },
  { x: 470,  y: 1020 },
  { x: 1300, y: 900  },
  { x: 1900, y: 870  },
  { x: 320,  y: 1430 },
  { x: 1300, y: 1380 },
  { x: 2100, y: 1450 }
];

const SCENERY_LABELS = [
  { x: 1500, y: 1000, text: 'waterfall' },
  { x: 300,  y: 870,  text: 'bridge' },
  { x: 300,  y: 1100, text: 'river' },
  { x: 2000, y: 370,  text: 'cave' },
  { x: 500,  y: 1480, text: 'beach' },
  { x: 1200, y: 510,  text: 'tall tree' },
  { x: 200,  y: 230,  text: 'forest' },
  { x: 1820, y: 420,  text: 'boulder' },
  { x: 820,  y: 1320, text: 'palm tree' },
  { x: 1020, y: 850,  text: 'stump' },
  { x: 1060, y: 530,  text: 'mushroom' },
  { x: 1850, y: 700,  text: 'flower' }
];

const SNOWY_PHRASES = [
  'I see a flower!',
  'Look, water!',
  'I am Snowy.',
  'I see a tree.',
  'I see the cave.',
  'Look, a banana!',
  'I like flowers.',
  'I see the river.'
];

const MIDNIGHT_PHRASES = [
  'I like bananas.',
  'I see a tree.',
  'I am Midnight.',
  'Look, a stump!',
  'I see the beach.',
  'Look, a flower!',
  'I like the cave.',
  'I see a palm tree.'
];

const NUMBER_WORDS = ['none yet!', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
function numberWord(n) {
  return n >= 0 && n < NUMBER_WORDS.length ? NUMBER_WORDS[n] : n.toString();
}

const STOP_MARKERS = [
  { id: 'snowy',  x: 1080, y: 800,  animal: 'rat',    color: 0x6b4423, displayName: 'Snowy',  puzzleKey: 'sumBridge',    prereq: null,     placeholder: "🚧 Coming soon! Snowy's maths puzzle is being built." },
  { id: 'crab',   x: 1200, y: 1500, animal: 'crab',   color: 0xef5350, displayName: 'Crab',   puzzleKey: 'wordTree',     prereq: 'snowy',  placeholder: "🚧 Coming soon! The crab's spelling puzzle is being built." },
  { id: 'snake',  x: 1200, y: 590,  animal: 'snake',  color: 0x66bb6a, displayName: 'Snake',  puzzleKey: 'snakeKnots',   prereq: 'crab',   placeholder: "🚧 Coming soon! The snake's pattern puzzle is being built." },
  { id: 'bat',    x: 2000, y: 380,  animal: 'bat',    color: 0x424242, displayName: 'Bat',    puzzleKey: 'batWing',      prereq: 'snake',  placeholder: "🚧 Coming soon! The bat's counting puzzle is being built." },
  { id: 'parrot', x: 400,  y: 200,  animal: 'parrot', color: 0x42a5f5, displayName: 'Parrot', puzzleKey: 'parrotStory',  prereq: 'bat',    placeholder: "🚧 Coming soon! The parrot's story puzzle is being built." }
];

const MATHS_QUESTIONS_DEFAULT = [
  { question: '80 - 70 = ?',  answers: [10, 20, 0, 100], correctIndex: 0 },
  { question: '100 - 30 = ?', answers: [70, 60, 80, 90], correctIndex: 0 },
  { question: '50 - 20 = ?',  answers: [30, 20, 40, 10], correctIndex: 0 },
  { question: '90 - 40 = ?',  answers: [50, 40, 60, 30], correctIndex: 0 },
  { question: '100, 90, 80, 70, 60, ?', answers: [50, 40, 30, 55], correctIndex: 0 },
  { question: '80, 70, 60, 50, ?',      answers: [40, 30, 45, 50], correctIndex: 0 },
  { question: '90, 80, 70, ?',          answers: [60, 50, 70, 65], correctIndex: 0 },
  { question: '10, 20, 30, ?, 50, 60', answers: [40, 35, 45, 50], correctIndex: 0 },
  { question: '?, 30, 40, 50, 60',     answers: [20, 10, 25, 15], correctIndex: 0 },
  { question: '40, 50, ?, 70, 80',     answers: [60, 55, 65, 70], correctIndex: 0 },
  { question: '40 + 30 = ?',  answers: [70, 60, 80, 50], correctIndex: 0 },
  { question: '50 + 25 = ?',  answers: [75, 70, 80, 65], correctIndex: 0 },
  { question: '20 + 60 = ?',  answers: [80, 70, 90, 60], correctIndex: 0 },
  { question: '5 × 2 = ?',   answers: [10, 7, 12, 8],    correctIndex: 0 },
  { question: '10 × 3 = ?',  answers: [30, 20, 40, 13],  correctIndex: 0 },
  { question: '2 × 4 = ?',   answers: [8, 6, 10, 12],    correctIndex: 0 },
  { question: '5 × 5 = ?',   answers: [25, 20, 30, 15],  correctIndex: 0 },
  { question: '10 × 5 = ?',  answers: [50, 40, 60, 15],  correctIndex: 0 }
];

const SPELLING_QUESTIONS_DEFAULT = [
  { question: 'Spell this: 🐟',  answers: ['fish',  'fihs',  'fsih',  'fush'],   correctIndex: 0 },
  { question: 'Spell this: 🏖️',  answers: ['sand',  'snad',  'sadn',  'sahd'],   correctIndex: 0 },
  { question: 'Spell this: 🌊',  answers: ['wave',  'wvae',  'wvea',  'waev'],   correctIndex: 0 },
  { question: 'Spell this: 🦀',  answers: ['crab',  'cabr',  'crba',  'carb'],   correctIndex: 0 },
  { question: 'Spell this: 🐚',  answers: ['shell', 'shel',  'shlel', 'shele'],  correctIndex: 0 },
  { question: 'Spell this: 🏝️',  answers: ['beach', 'baech', 'bech',  'beech'],  correctIndex: 0 },
  { question: 'Spell this: 🏊',  answers: ['swim',  'swmi',  'siwm',  'swiim'],  correctIndex: 0 },
  { question: 'Spell this: 🐸',  answers: ['frog',  'frgo',  'fogr',  'frrg'],   correctIndex: 0 },
  { question: 'Spell this: 🤸',  answers: ['jump',  'jmpu',  'jupm',  'jmup'],   correctIndex: 0 },
  { question: 'Spell this: 👒',  answers: ['hat',   'aht',   'tah',   'hta'],    correctIndex: 0 },
  { question: 'Spell this: 🐈',  answers: ['cat',   'cta',   'tca',   'act'],    correctIndex: 0 },
  { question: 'Spell this: 🐕',  answers: ['dog',   'dgo',   'odg',   'gdo'],    correctIndex: 0 },
  { question: 'Spell this: ☀️',  answers: ['sun',   'snu',   'usn',   'uns'],    correctIndex: 0 },
  { question: 'Spell this: 🌳',  answers: ['tree',  'treee', 'tre',   'teer'],   correctIndex: 0 },
  { question: 'Spell this: 🐦',  answers: ['bird',  'brid',  'bdri',  'birb'],   correctIndex: 0 }
];

const PATTERN_QUESTIONS_DEFAULT = [
  // AABB / AAB patterns
  { question: '🌟 🌟 🌙 🌟 🌟 🌙 ?',  answers: ['🌟', '🌙', '☀️', '⭐'],      correctIndex: 0 },
  { question: '🍎 🍌 🍌 🍎 🍌 🍌 ?',  answers: ['🍎', '🍌', '🍇', '🍊'],     correctIndex: 0 },
  { question: '🐱 🐱 🐶 🐱 🐱 🐶 ?',  answers: ['🐱', '🐶', '🐰', '🐻'],     correctIndex: 0 },

  // ABCABC patterns
  { question: '🔴 🔵 🟡 🔴 🔵 🟡 ?',  answers: ['🔴', '🔵', '🟡', '🟢'],     correctIndex: 0 },
  { question: 'A B C A B C ?',     answers: ['A', 'B', 'C', 'D'],         correctIndex: 0 },
  { question: '🐰 🐢 🐦 🐰 🐢 🐦 ?',  answers: ['🐰', '🐢', '🐦', '🐱'],     correctIndex: 0 },

  // Add 2 sequences
  { question: '2, 4, 6, 8, ?',     answers: [10, 9, 11, 12],              correctIndex: 0 },
  { question: '1, 3, 5, 7, ?',     answers: [9, 8, 11, 10],               correctIndex: 0 },
  { question: '10, 12, 14, ?',     answers: [16, 15, 17, 18],             correctIndex: 0 },

  // Subtract 2 sequences
  { question: '20, 18, 16, ?',     answers: [14, 13, 15, 12],             correctIndex: 0 },
  { question: '15, 13, 11, ?',     answers: [9, 10, 8, 7],                correctIndex: 0 },

  // Skip counting (5s)
  { question: '5, 10, 15, 20, ?',  answers: [25, 20, 30, 35],             correctIndex: 0 },
  { question: '10, 15, 20, 25, ?', answers: [30, 35, 28, 32],             correctIndex: 0 },

  // Reasoning patterns
  { question: '🐰 hops 2, then 4, then 6, then?', answers: [8, 7, 10, 12], correctIndex: 0 },
  { question: '🐌 1 step, 🐌🐌 2 steps, 🐌🐌🐌 3 steps. Next?',
                                   answers: ['🐌🐌🐌🐌 4 steps', '5', '3', '2'], correctIndex: 0 },

  // Letter sequence
  { question: 'A B C D ?',         answers: ['E', 'F', 'D', 'G'],         correctIndex: 0 }
];

const COUNTING_QUESTIONS_DEFAULT = [
  { question: 'How many butterflies? 🦋🦋🦋🦋🦋',     answers: [5, 4, 6, 3],   correctIndex: 0 },
  { question: 'Count the bugs: 🐛🐛🐛🐛🐛🐛🐛',       answers: [7, 6, 8, 5],   correctIndex: 0 },
  { question: 'Count the stars: ⭐⭐⭐⭐⭐⭐⭐⭐',       answers: [8, 7, 9, 10],  correctIndex: 0 },
  { question: 'Count the leaves: 🍃🍃🍃🍃🍃🍃',       answers: [6, 5, 7, 4],   correctIndex: 0 },
  { question: 'Count the flowers: 🌸🌸🌸🌸🌸🌸🌸🌸🌸', answers: [9, 8, 10, 7],  correctIndex: 0 },
  { question: 'Count the rocks: 🪨🪨🪨🪨',           answers: [4, 3, 5, 6],   correctIndex: 0 },
  { question: 'Count the snails: 🐌🐌🐌🐌🐌🐌🐌🐌🐌🐌', answers: [10, 9, 11, 8], correctIndex: 0 },
  { question: 'Count the cherries: 🍒🍒🍒🍒🍒',       answers: [5, 4, 6, 3],   correctIndex: 0 },
  { question: 'Count the fish: 🐟🐟🐟🐟🐟🐟🐟',       answers: [7, 6, 8, 5],   correctIndex: 0 },
  { question: 'Count the apples: 🍎🍎🍎🍎🍎🍎🍎🍎',   answers: [8, 7, 9, 6],   correctIndex: 0 },
  { question: 'Count the moons: 🌙🌙🌙',             answers: [3, 2, 4, 5],   correctIndex: 0 },
  { question: 'Count the suns: ☀️☀️☀️☀️☀️☀️☀️☀️☀️☀️', answers: [10, 9, 11, 8], correctIndex: 0 }
];

const CVC_WORD_BANK_DEFAULT = [
  // -at
  'cat','bat','hat','mat','rat','sat','fat','pat',
  // -ot
  'dot','got','hot','lot','not','pot','rot','top',
  // -it
  'bit','fit','hit','kit','lit','pit','sit',
  // -et
  'bet','get','jet','let','met','net','pet','set','vet','wet',
  // -un
  'bun','fun','gun','nun','pun','run','sun',
  // -og
  'bog','cog','dog','fog','hog','jog','log',
  // -ad
  'bad','dad','had','lad','mad','pad','sad','tad',
  // -ig
  'big','dig','fig','gig','jig','pig','rig','wig',
  // -up
  'cup','pup','sup','up',
  // -ip
  'dip','hip','lip','nip','pip','rip','sip','tip','zip',
  // -ut
  'but','cut','gut','hut','jut','nut','put','rut',
  // -an
  'ban','can','fan','man','pan','ran','tan','van',
  // -im
  'dim','him','rim',
  // -id
  'bid','did','hid','kid','lid','mid','rid',
  // Common high-frequency
  'all','and','said','but','for','his','the','was','you','are'
];

const READING_QUESTIONS_DEFAULT = [
  {
    passage: 'Snowy is hungry. Midnight is sleepy.',
    question: 'Who needs food?',
    answers: ['Snowy', 'Midnight', 'Both', 'Neither'],
    correctIndex: 0
  },
  {
    passage: 'The crab lives by the sea. He has a sore claw.',
    question: 'Where does the crab live?',
    answers: ['By the sea', 'In a tree', 'In a cave', 'On a mountain'],
    correctIndex: 0
  },
  {
    passage: 'Coco the parrot has a nest. Her nest is in a red tree.',
    question: "What colour is Coco's tree?",
    answers: ['Red', 'Blue', 'Green', 'Yellow'],
    correctIndex: 0
  },
  {
    passage: 'The bat sleeps all day. He flies at night.',
    question: 'When does the bat fly?',
    answers: ['At night', 'In the morning', 'All day', 'Never'],
    correctIndex: 0
  },
  {
    passage: 'Sophia has two pet rats. Their names are Snowy and Midnight.',
    question: 'How many pets does Sophia have?',
    answers: ['Two', 'One', 'Three', 'Four'],
    correctIndex: 0
  },
  {
    passage: 'The snake was stuck in a tree. Sophia helped him get down.',
    question: 'Who helped the snake?',
    answers: ['Sophia', 'Snowy', 'Midnight', 'The bat'],
    correctIndex: 0
  },
  {
    passage: 'Snowy loves cheese. Midnight loves bananas.',
    question: 'What does Midnight love?',
    answers: ['Bananas', 'Cheese', 'Apples', 'Fish'],
    correctIndex: 0
  },
  {
    passage: 'The party is at the big tree. Everyone is going.',
    question: 'Where is the party?',
    answers: ['At the big tree', 'At the beach', 'In the cave', 'By the river'],
    correctIndex: 0
  },
  {
    passage: 'The bat sleeps in the cave. He likes the dark.',
    question: 'Where does the bat sleep?',
    answers: ['The cave', 'A tree', 'The beach', 'A nest'],
    correctIndex: 0
  },
  {
    passage: 'Sophia helped Snowy. Snowy got some cheese.',
    question: 'What did Snowy get?',
    answers: ['Cheese', 'Bananas', 'A flower', 'Water'],
    correctIndex: 0
  },
  {
    passage: 'The snake was sad. He was stuck in a tree. Now he is happy.',
    question: 'How does the snake feel now?',
    answers: ['Happy', 'Sad', 'Tired', 'Hungry'],
    correctIndex: 0
  },
  {
    passage: 'The party has cake. The party has music. Everyone is dancing.',
    question: 'What is at the party?',
    answers: ['Cake and music', 'Just cake', 'Just music', 'Snacks'],
    correctIndex: 0
  },
  {
    passage: 'Midnight is a black rat. Snowy is a white rat. They are friends.',
    question: 'What colour is Snowy?',
    answers: ['White', 'Black', 'Brown', 'Grey'],
    correctIndex: 0
  },
  {
    passage: 'The waterfall is by the river. The river is cold. The fish swim in it.',
    question: 'Where do the fish swim?',
    answers: ['In the river', 'In the waterfall', 'On the beach', 'In the cave'],
    correctIndex: 0
  }
];

const STOP_CONFIGS = {
  snowy: {
    id: 'snowy', built: true, displayName: 'Snowy', puzzleKey: 'sumBridge',
    nextActKey: 'act2', nextStopId: 'crab', partyItemKey: 'bananas',
    puzzleBank: () => MATHS_QUESTIONS_DEFAULT,
    sceneBuilder: 'buildSnowyScene', celebrationBuilder: 'celebrateSnowy',
    dialogue: ["Oh Sophia! I'm so hungry... 🥺", "Can you help me get the cheese? Solve some puzzles!"],
    replayDialogue: ["That was fun! Want to do more maths?"],
    completeBannerText: 'Stop 1 complete! 🐀✨',
    winBannerText: '🎉 You did it!',
    hintText: "It's okay, take your time! 🐀"
  },
  crab: {
    id: 'crab', built: true, displayName: 'Crab', puzzleKey: 'wordTree',
    puzzleType: 'speedRead',
    nextActKey: 'act3', nextStopId: 'snake', partyItemKey: 'flowers',
    puzzleBank: () => SPELLING_QUESTIONS_DEFAULT, // legacy, unused for speedRead
    sceneBuilder: 'buildCrabScene', celebrationBuilder: 'celebrateCrab',
    dialogue: ["Ouch! My claw is so sore...", "Read the magic words quickly to make it better!"],
    replayDialogue: ["Want to try again?", "Read fast and beat your best!"],
    completeBannerText: 'Stop 2 complete! 🦀✨',
    winBannerText: '✨ Magic worked!',
    hintText: "You can do it! 🦀"
  },
  snake: {
    id: 'snake', built: true, displayName: 'Snake', puzzleKey: 'snakeKnots',
    nextActKey: 'act4', nextStopId: 'bat', partyItemKey: 'stones',
    puzzleBank: () => PATTERN_QUESTIONS_DEFAULT,
    sceneBuilder: 'buildSnakeScene', celebrationBuilder: 'celebrateSnake',
    dialogue: ["I am in terrible knots, darling!", "Solve some patterns to un-knot me!"],
    replayDialogue: ["Oh I do love a pattern! More please, darling?"],
    completeBannerText: 'Stop 3 complete! 🐍✨',
    winBannerText: '🐍 Un-knotted!',
    hintText: "No rush, darling! 🐍"
  },
  bat: {
    id: 'bat', built: true, displayName: 'Bat', puzzleKey: 'batWing',
    nextActKey: 'act5', nextStopId: 'parrot', partyItemKey: 'musicNotes',
    puzzleBank: () => COUNTING_QUESTIONS_DEFAULT,
    sceneBuilder: 'buildBatScene', celebrationBuilder: 'celebrateBat',
    dialogue: ["I'm too dizzy to count...", "Help me count and I'll find my strength!"],
    replayDialogue: ["I feel stronger! Count with me again?"],
    completeBannerText: 'Stop 4 complete! 🦇✨',
    winBannerText: '🦇 Healed!',
    hintText: "Try again, friend! 🦇"
  },
  parrot: {
    id: 'parrot', built: true, displayName: 'Parrot', puzzleKey: 'parrotStory',
    nextActKey: null, nextStopId: null, partyItemKey: null,
    puzzleBank: () => READING_QUESTIONS_DEFAULT,
    sceneBuilder: 'buildParrotScene', celebrationBuilder: 'celebrateParrotFinale',
    dialogue: ["I'm lost! I can't remember the way home...", "Read my stories and help me find my way!"],
    replayDialogue: ["I love stories! Read with me again?"],
    completeBannerText: 'GAME COMPLETE! 🌟',
    winBannerText: '🎉 YOU HELPED EVERYONE!',
    hintText: "Have another think! 🦜"
  }
};

const SAVE_KEY = 'sophias-rat-jungle-save';
const DEFAULT_SAVE_STATE = {
  version: 3,
  bananaCount: 0,
  bananasCollected: [],
  puzzlesSolved: {
    sumBridge: false,
    wordTree: false,
    snakeKnots: false,
    batWing: false,
    parrotStory: false
  },
  actsUnlocked: {
    act1: true,
    act2: false,
    act3: false,
    act4: false,
    act5: false
  },
  partyItems: {
    bananas: 0,
    flowers: 0,
    stones: 0,
    musicNotes: 0,
    goldenBanana: false
  },
  speedReadBest: {
    defaultBank: 0,
    homeworkBank: 0
  },
  stats: {
    startedAt: null,
    lastPlayedAt: null,
    gameCompleted: false,
    crabPracticeDone: false,
    openingSeen: false,
    endingSeen: false
  }
};

const SaveManager = {
  _inMemory: null,
  _cloneDefault() {
    return JSON.parse(JSON.stringify(DEFAULT_SAVE_STATE));
  },
  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) {
        if (this._inMemory) return this._inMemory;
        return this._cloneDefault();
      }
      const parsed = JSON.parse(raw);
      const fresh = this._cloneDefault();
      const fromVersion = parsed.version || 1;
      const needsPuzzleReset = fromVersion < 3;
      const merged = Object.assign(fresh, parsed, {
        version: 3,
        puzzlesSolved: needsPuzzleReset
          ? fresh.puzzlesSolved
          : Object.assign(fresh.puzzlesSolved, parsed.puzzlesSolved || {}),
        actsUnlocked: Object.assign(fresh.actsUnlocked, parsed.actsUnlocked || {}),
        partyItems: Object.assign(fresh.partyItems, parsed.partyItems || {}),
        speedReadBest: Object.assign(fresh.speedReadBest, parsed.speedReadBest || {}),
        stats: Object.assign(fresh.stats, parsed.stats || {})
      });
      if (fromVersion === 1) {
        console.log('Save migrated v1 → v3');
        this.save(merged);
      } else if (fromVersion === 2) {
        console.log('Save migrated v2 → v3');
        this.save(merged);
      }
      return merged;
    } catch (e) {
      if (!this._inMemory) this._inMemory = this._cloneDefault();
      return this._inMemory;
    }
  },
  save(state) {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    } catch (e) {
      this._inMemory = state;
    }
  },
  reset() {
    try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
    this._inMemory = null;
  },
  isFirstPlay() {
    try {
      return localStorage.getItem(SAVE_KEY) === null;
    } catch (e) {
      return this._inMemory === null;
    }
  }
};
window.SaveManager = SaveManager;

// ============================================================
// HomeworkManager — parent-set words/sums (spelling only for now)
// ============================================================
// Pack shape:
//   {
//     version: 1,
//     active: true|false,
//     spelling: { words: [string, ...] },
//     savedAt: ISO timestamp
//   }
const HOMEWORK_KEY = 'sophias-rat-jungle-homework';
const HomeworkManager = {
  _inMemory: null,
  load() {
    try {
      const raw = localStorage.getItem(HOMEWORK_KEY);
      if (!raw) return this._inMemory;
      return JSON.parse(raw);
    } catch (e) {
      return this._inMemory;
    }
  },
  save(pack) {
    try {
      localStorage.setItem(HOMEWORK_KEY, JSON.stringify(pack));
    } catch (e) {
      this._inMemory = pack;
    }
  },
  clear() {
    try { localStorage.removeItem(HOMEWORK_KEY); } catch (e) {}
    this._inMemory = null;
  },
  hasActivePack() {
    const pack = this.load();
    return !!(pack && pack.active && pack.spelling && Array.isArray(pack.spelling.words) && pack.spelling.words.length > 0);
  },
  getActiveWords() {
    if (!this.hasActivePack()) return null;
    return this.load().spelling.words.slice();
  }
};
window.HomeworkManager = HomeworkManager;

// Parse comma-separated word string. Returns { words: [...], errors: [...] }.
function parseHomeworkWords(text) {
  const errors = [];
  const words = [];
  if (typeof text !== 'string') return { words, errors: ['Please enter some words.'] };
  const parts = text.split(',').map(s => s.trim()).filter(s => s.length > 0);
  for (const raw of parts) {
    const word = raw.toLowerCase();
    if (!/^[a-z]{2,6}$/.test(word)) {
      errors.push("Hmm, '" + raw + "' doesn't look right. Just letters (2-6)!");
    } else {
      words.push(word);
    }
  }
  return { words, errors };
}

let audioCtx = null;
function getAudioCtx() {
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    audioCtx = new Ctx();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

// Explicitly unlock audio on first user interaction (Chromium autoplay policy).
function unlockAudio() {
  try {
    const ctx = getAudioCtx();
    if (ctx && ctx.state === 'suspended') ctx.resume();
  } catch (e) {}
}
window.unlockAudio = unlockAudio;

// ============================================================
// PERF_TIER — performance tier auto-detection
// ============================================================
// "low"  — Pi Zero 2 W / low-spec ARM / tiny viewport: halve particles
// "mid"  — iPad / mid-spec: stock counts
// "high" — desktop with hardware accel: stock counts (room to boost)
//
// Override via URL param: ?perf=low | ?perf=mid | ?perf=high
window.PERF_TIER = (function () {
  try {
    const url = new URL(window.location.href);
    const param = (url.searchParams.get('perf') || '').toLowerCase();
    if (param === 'low' || param === 'mid' || param === 'high') return param;
  } catch (e) {}
  const ua = (navigator.userAgent || '').toLowerCase();
  const cores = navigator.hardwareConcurrency || 4;
  const w = window.innerWidth || 1024;
  const h = window.innerHeight || 600;
  const isArm = /arm|aarch|raspberry/.test(ua) || /linux armv/.test(ua);
  // Tiny viewport + low core count + ARM signals → low.
  if (isArm) return 'low';
  if (w <= 1100 && cores <= 4) return 'low';
  if (w <= 1366) return 'mid';
  return 'high';
})();

function tierScale(low, mid, high) {
  if (window.PERF_TIER === 'low') return low;
  if (window.PERF_TIER === 'mid') return mid;
  return high;
}

function playSqueak(pitchKind) {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'square';
  const base = pitchKind === 'high' ? 1150 : 820;
  const t = ctx.currentTime;
  osc.frequency.setValueAtTime(base, t);
  osc.frequency.exponentialRampToValueAtTime(base * 1.5, t + 0.05);
  osc.frequency.exponentialRampToValueAtTime(base * 1.1, t + 0.12);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(0.05, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.18);
}

function playPickup() {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const freqs = [659.25, 783.99, 987.77];
  freqs.forEach((f, i) => {
    const t = ctx.currentTime + i * 0.055;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = f;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.16, t + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.12);
  });
}

function playFanfare() {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
  notes.forEach((f, i) => {
    const t = ctx.currentTime + i * 0.1;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = f;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.2, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.34);
  });
}

function playWrong() {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sawtooth';
  const t = ctx.currentTime;
  osc.frequency.setValueAtTime(220, t);
  osc.frequency.exponentialRampToValueAtTime(110, t + 0.2);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(0.06, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.25);
}

function playCorrect() {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const notes = [659.25, 987.77];
  notes.forEach((f, i) => {
    const t = ctx.currentTime + i * 0.08;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = f;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.15, t + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.2);
  });
}

class QuizManager {
  constructor(scene, questions, options) {
    this.scene = scene;
    this.questions = questions;
    this.options = options || {};
    this.onComplete = this.options.onComplete || (() => {});
    this.onWrong = this.options.onWrong || (() => {});
    this.onFail = this.options.onFail || (() => {});
    this.questionsToAsk = Math.min(5, questions.length);
    this.selectedQuestions = [];
    this.currentIndex = 0;
    this.modalElements = [];
    this.currentButtons = [];
    this.isOpen = false;
    this.dismissed = false;
    this._answering = false;
    this.keyHandlers = null;
    this.maxHearts = 3;
    this.heartsLeft = 3;
    this.heartTexts = [];
    this._failing = false;
  }

  start() {
    const pool = this.questions.slice();
    Phaser.Math.RND.shuffle(pool);
    this.selectedQuestions = pool.slice(0, this.questionsToAsk).map(q => {
      const tagged = q.answers.map((a, i) => ({ a, isCorrect: i === q.correctIndex }));
      Phaser.Math.RND.shuffle(tagged);
      const shuffled = {
        question: q.question,
        passage: q.passage,
        answers: tagged.map(x => x.a),
        correctIndex: tagged.findIndex(x => x.isCorrect)
      };
      return shuffled;
    });
    this.currentIndex = 0;
    this.dismissed = false;
    this.isOpen = true;
    this._wrongStreak = 0;
    this._lastWrongIndex = -1;
    this.scene.activeQuiz = this;
    this._showCurrent();
  }

  _showCurrent() {
    this._destroyModal();
    if (this.currentIndex >= this.selectedQuestions.length) {
      this.isOpen = false;
      this._removeKeyHandlers();
      if (this.scene.activeQuiz === this) this.scene.activeQuiz = null;
      this.onComplete();
      return;
    }
    this._buildModal(this.selectedQuestions[this.currentIndex]);
  }

  _buildModal(q) {
    const scene = this.scene;
    const cam = scene.cameras.main;
    const cw = cam.width, ch = cam.height;
    const cx = cw / 2;

    const cardW = 580;

    const overlay = scene.add.rectangle(cw / 2, ch / 2, cw, ch, 0x000000, 0.55)
      .setScrollFactor(0).setDepth(2000).setInteractive();

    // Build text first (off-screen at y=0), measure, then position.
    const progress = scene.add.text(cx, 0,
      'Question ' + (this.currentIndex + 1) + ' of ' + this.questionsToAsk, {
      fontFamily: 'DM Sans, Comic Sans MS, system-ui, sans-serif',
      fontSize: '16px',
      color: '#6b4423',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(2002);

    let passageText = null;
    if (q.passage) {
      passageText = scene.add.text(cx, 0, q.passage, {
        fontFamily: 'DM Sans, Comic Sans MS, system-ui, sans-serif',
        fontSize: '18px',
        color: '#4a2c1a',
        fontStyle: 'italic',
        align: 'center',
        wordWrap: { width: cardW - 80 }
      }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(2002);
    }

    const questionText = scene.add.text(cx, 0, q.question, {
      fontFamily: 'DM Sans, Comic Sans MS, system-ui, sans-serif',
      fontSize: q.passage ? '22px' : '26px',
      color: '#2a2a2a',
      fontStyle: 'bold',
      align: 'center',
      wordWrap: { width: cardW - 60 }
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(2002);

    // Layout pass: compute heights + Y positions.
    const topPad = 28;
    const gapAfterProgress = 14;
    const gapAfterPassage = 12;
    const gapAfterQuestion = 26;
    const btnW = 240, btnH = 90;
    const btnGapX = 24, btnGapY = 18;
    const buttonsBlockH = btnH * 2 + btnGapY;
    const bottomPad = 28;

    const progressH = progress.height;
    const passageH = passageText ? passageText.height : 0;
    const questionH = questionText.height;

    let contentH = topPad + progressH + gapAfterProgress;
    if (passageText) contentH += passageH + gapAfterPassage;
    contentH += questionH + gapAfterQuestion + buttonsBlockH + bottomPad;

    const minCardH = 440;
    const maxCardH = ch * 0.85;
    const cardH = Phaser.Math.Clamp(contentH, minCardH, maxCardH);

    const cy = ch / 2;
    const cardTop = cy - cardH / 2;

    let y = cardTop + topPad;
    progress.setY(y);
    y += progressH + gapAfterProgress;
    if (passageText) {
      passageText.setY(y);
      y += passageH + gapAfterPassage;
    }
    questionText.setY(y);
    y += questionH + gapAfterQuestion;

    const gridCenterY = y + buttonsBlockH / 2;

    const shadow = scene.add.rectangle(cx + 6, cy + 8, cardW, cardH, 0x000000, 0.3)
      .setScrollFactor(0).setDepth(2001);
    const card = scene.add.rectangle(cx, cy, cardW, cardH, 0xfffaf0)
      .setStrokeStyle(4, 0x4a2c1a)
      .setScrollFactor(0).setDepth(2001);

    const btnColors = [0xa8e6cf, 0xffd3b6, 0xb5d7f0, 0xd5b8e8];
    const btnTextColors = ['#1f5e44', '#7a3a14', '#1a4a6e', '#4e2a6e'];
    const letters = ['A', 'B', 'C', 'D'];
    const buttons = [];
    for (let i = 0; i < 4; i++) {
      const col = i % 2, row = Math.floor(i / 2);
      const bx = cx + (col === 0 ? -(btnW / 2 + btnGapX / 2) : (btnW / 2 + btnGapX / 2));
      const by = gridCenterY + (row === 0 ? -(btnH / 2 + btnGapY / 2) : (btnH / 2 + btnGapY / 2));
      const bg = scene.add.rectangle(bx, by, btnW, btnH, btnColors[i])
        .setStrokeStyle(3, 0x4a2c1a)
        .setScrollFactor(0).setDepth(2002)
        .setInteractive({ useHandCursor: true });
      const letter = scene.add.text(bx - btnW / 2 + 18, by, letters[i], {
        fontFamily: 'DM Sans, Comic Sans MS, system-ui, sans-serif',
        fontSize: '24px',
        color: btnTextColors[i],
        fontStyle: 'bold'
      }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(2003);
      const answer = q.answers[i] !== undefined ? String(q.answers[i]) : '';
      const answerText = scene.add.text(bx + 14, by, answer, {
        fontFamily: 'DM Sans, Comic Sans MS, system-ui, sans-serif',
        fontSize: '20px',
        color: btnTextColors[i],
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: btnW - 50 }
      }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(2003);
      const idx = i;
      bg.on('pointerdown', () => this._answerSelected(idx, bg));
      buttons.push({ bg, letter, answerText, originalColor: btnColors[i], row });
    }

    const closeR = 18;
    const closeBg = scene.add.circle(cx + cardW / 2 - closeR - 8, cardTop + closeR + 8, closeR, 0xff6b6b)
      .setStrokeStyle(3, 0x4a2c1a)
      .setScrollFactor(0).setDepth(2003)
      .setInteractive({ useHandCursor: true });
    const closeText = scene.add.text(closeBg.x, closeBg.y, '✕', {
      fontFamily: 'DM Sans, system-ui, sans-serif',
      fontSize: '22px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(2004);
    closeBg.on('pointerdown', () => this.dismiss());

    this.cardH = cardH;
    this.cardTop = cardTop;
    this.cardW = cardW;

    this.modalElements = [overlay, shadow, card, progress, questionText, closeBg, closeText];
    if (passageText) this.modalElements.push(passageText);
    for (const b of buttons) {
      this.modalElements.push(b.bg, b.letter, b.answerText);
    }
    this.currentButtons = buttons;

    this._buildHeartsUI();
    this._installKeyHandlers();
  }

  _buildHeartsUI() {
    const scene = this.scene;
    const heartY = this.cardTop + 22;
    const heartXStart = (scene.cameras.main.width / 2) - (this.cardW ? this.cardW / 2 : 290) + 18;
    this.heartTexts = [];
    for (let i = 0; i < this.maxHearts; i++) {
      const isFilled = i < this.heartsLeft;
      const t = scene.add.text(heartXStart + i * 26, heartY, isFilled ? '❤️' : '🤍', {
        fontFamily: 'DM Sans, system-ui, sans-serif',
        fontSize: '20px'
      }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(2003);
      this.heartTexts.push(t);
      this.modalElements.push(t);
    }
  }

  _installKeyHandlers() {
    this._removeKeyHandlers();
    this.keyHandlers = (e) => {
      if (!this.isOpen || this._answering) return;
      const key = e.key.toLowerCase();
      const map = { a: 0, b: 1, c: 2, d: 3 };
      if (key in map) {
        e.preventDefault();
        const idx = map[key];
        if (this.currentButtons[idx]) this._answerSelected(idx, this.currentButtons[idx].bg);
      } else if (key === 'escape') {
        e.preventDefault();
        this.dismiss();
      }
    };
    window.addEventListener('keydown', this.keyHandlers);
  }

  _removeKeyHandlers() {
    if (this.keyHandlers) {
      window.removeEventListener('keydown', this.keyHandlers);
      this.keyHandlers = null;
    }
  }

  _answerSelected(index, btn) {
    if (this._answering || !this.isOpen) return;
    const q = this.selectedQuestions[this.currentIndex];
    if (index === q.correctIndex) {
      this._answering = true;
      this._flashButton(btn, 0x4caf50);
      playCorrect();
      this._wrongStreak = 0;
      this.scene.time.delayedCall(550, () => {
        this._answering = false;
        this.currentIndex++;
        this._showCurrent();
      });
    } else {
      this._flashButton(btn, 0xef5350);
      playWrong();
      this._wrongStreak++;
      this._loseHeart();
      if (this.heartsLeft <= 0) {
        this._answering = true;
        this._failing = true;
        this.scene.time.delayedCall(900, () => this._fail());
        this.onWrong(index);
        return;
      }
      const willShowAnimalHint = (this._wrongStreak >= 2 && this.options.animalHints && this.options.animalHints.hint);
      if (willShowAnimalHint) {
        this._showHintBubble(this.options.animalHints.hint);
      } else {
        this._showReassuranceBubble(btn, index);
      }
      this.onWrong(index);
    }
  }

  _loseHeart() {
    if (this.heartsLeft <= 0) return;
    const lostIdx = this.heartsLeft - 1;
    this.heartsLeft = lostIdx;
    const lost = this.heartTexts[lostIdx];
    if (!lost || !lost.active) return;
    this.scene.tweens.add({
      targets: lost,
      scaleX: { from: 1, to: 1.4 },
      scaleY: { from: 1, to: 1.4 },
      duration: 180,
      yoyo: true,
      ease: 'Back.easeOut'
    });
    this.scene.time.delayedCall(140, () => {
      if (lost && lost.active) lost.setText('🤍');
    });
  }

  _fail() {
    if (this.dismissed) return;
    this.isOpen = false;
    this._destroyModal();
    this._removeKeyHandlers();
    if (this.scene.activeQuiz === this) this.scene.activeQuiz = null;
    this.onFail();
  }

  _showReassuranceBubble(btn, index) {
    if (this._hintActive) return;
    const scene = this.scene;
    const row = (index < 2) ? 0 : 1;
    const offset = row === 0 ? -56 : 56;
    const bubbleX = btn.x;
    const bubbleY = btn.y + offset;
    const t = scene.add.text(bubbleX, bubbleY, 'Not quite! Try again.', {
      fontFamily: 'DM Sans, Comic Sans MS, system-ui, sans-serif',
      fontSize: '14px',
      color: '#2a2a2a',
      fontStyle: 'bold',
      align: 'center'
    }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(2008);
    const padX = 14, padY = 8;
    const bg = scene.add.rectangle(bubbleX, bubbleY, t.width + padX * 2, t.height + padY * 2, 0xfffaf0, 0.96)
      .setStrokeStyle(2, 0x8b6f3a)
      .setScrollFactor(0).setDepth(2007);
    bg.alpha = 0; t.alpha = 0;
    bg.setScale(0.8); t.setScale(0.8);
    scene.tweens.add({
      targets: [bg, t],
      alpha: 1,
      scale: 1,
      duration: 180,
      ease: 'Back.easeOut'
    });
    scene.time.delayedCall(1500, () => {
      scene.tweens.add({
        targets: [bg, t],
        alpha: 0,
        duration: 250,
        onComplete: () => {
          if (bg.active) bg.destroy();
          if (t.active) t.destroy();
        }
      });
    });
  }

  _showHintBubble(text) {
    if (this._hintActive) return;
    this._hintActive = true;
    const scene = this.scene;
    const cam = scene.cameras.main;
    const cx = cam.width / 2;
    const hintY = (this.cardTop != null ? this.cardTop : (cam.height / 2 - 220)) - 30;
    const t = scene.add.text(cx, hintY, text, {
      fontFamily: 'DM Sans, Comic Sans MS, system-ui, sans-serif',
      fontSize: '16px',
      color: '#2a2a2a',
      fontStyle: 'bold',
      align: 'center'
    }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(2010);
    const bg = scene.add.rectangle(cx, hintY, t.width + 28, t.height + 14, 0xfff9c4, 0.95)
      .setStrokeStyle(2, 0xc9a13d).setScrollFactor(0).setDepth(2009);
    const tail = scene.add.triangle(cx, hintY + 18, -8, 0, 8, 0, 0, 10, 0xfff9c4)
      .setStrokeStyle(2, 0xc9a13d).setScrollFactor(0).setDepth(2009);
    bg.alpha = 0; t.alpha = 0; tail.alpha = 0;
    scene.tweens.add({ targets: [bg, t, tail], alpha: 1, duration: 220, ease: 'Back.easeOut' });
    scene.time.delayedCall(3000, () => {
      scene.tweens.add({
        targets: [bg, t, tail], alpha: 0, duration: 350,
        onComplete: () => {
          if (bg.active) bg.destroy();
          if (t.active) t.destroy();
          if (tail.active) tail.destroy();
          this._hintActive = false;
        }
      });
    });
  }

  _flashButton(btn, flashColor) {
    const original = btn.fillColor;
    btn.setFillStyle(flashColor);
    this.scene.tweens.add({
      targets: btn,
      scaleX: { from: 1.08, to: 1 },
      scaleY: { from: 1.08, to: 1 },
      duration: 280,
      ease: 'Back.easeOut',
      onComplete: () => { if (btn.active) btn.setFillStyle(original); }
    });
  }

  _destroyModal() {
    for (const e of this.modalElements) {
      if (e && e.destroy) e.destroy();
    }
    this.modalElements = [];
    this.currentButtons = [];
  }

  dismiss() {
    this.isOpen = false;
    this.dismissed = true;
    this._destroyModal();
    this._removeKeyHandlers();
    if (this.scene.activeQuiz === this) this.scene.activeQuiz = null;
  }
}

// ============================================================
// SpeedReadManager — Crab stop's timed word-flash mechanic
// ============================================================
// 30 second timer. Word flashes for 1s, then 4 options appear.
// Correct + fast (<2s) = +3, medium (2-4s) = +2, slow (>4s) = +1.
// Wrong = -1, advance to next word (no replay — speed practice).
// Practice round (first play ever): 3 words, 2s flash, no timer.
class SpeedReadManager {
  constructor(scene, options) {
    this.scene = scene;
    this.options = options || {};
    this.onPass = this.options.onPass || (() => {});
    this.onFail = this.options.onFail || (() => {});
    this.words = this.options.words || [];
    this.bankKey = this.options.bankKey || 'defaultBank';
    this.distractorBank = this.options.distractorBank || this.words;
    this.skipPractice = !!this.options.skipPractice;
    this.flashMs = 1000;
    this.practiceFlashMs = 2000;
    this.timeLimitMs = 30000;
    this.passThreshold = 4;
    this.score = 0;
    this.wordsCompleted = 0;
    this.optionsShownAt = 0;
    this.isOpen = false;
    this.modalElements = [];
    this.optionButtons = [];
    this.timerEvent = null;
    this.endTime = 0;
    this.flashedWord = null;
    this.expectedIndex = -1;
    this.answering = false;
    this.timerText = null;
    this.scoreText = null;
    this.wordText = null;
    this.bannerText = null;
    this.keyHandler = null;
    this.isPractice = false;
    this.practiceIndex = 0;
    this.practiceWords = [];
    this.recentWords = [];
  }

  start() {
    this.isOpen = true;
    this.scene.activeQuiz = this;
    this._buildModal();
    if (this.skipPractice) {
      this._startRealRound();
    } else {
      this._startPracticeRound();
    }
  }

  _buildModal() {
    const scene = this.scene;
    const cam = scene.cameras.main;
    const cw = cam.width, ch = cam.height;
    const cx = cw / 2, cy = ch / 2;
    const cardW = 580, cardH = 480;

    const overlay = scene.add.rectangle(cx, cy, cw, ch, 0x000000, 0.55)
      .setScrollFactor(0).setDepth(2000).setInteractive();
    const shadow = scene.add.rectangle(cx + 6, cy + 8, cardW, cardH, 0x000000, 0.3)
      .setScrollFactor(0).setDepth(2001);
    const card = scene.add.rectangle(cx, cy, cardW, cardH, 0xfffaf0)
      .setStrokeStyle(4, 0x4a2c1a)
      .setScrollFactor(0).setDepth(2001);

    const cardTop = cy - cardH / 2;
    this.timerText = scene.add.text(cx - cardW / 2 + 20, cardTop + 18, '⏱ 30', {
      fontFamily: 'DM Sans, Comic Sans MS, system-ui, sans-serif',
      fontSize: '20px', color: '#c62828', fontStyle: 'bold'
    }).setOrigin(0, 0).setScrollFactor(0).setDepth(2003);
    this.scoreText = scene.add.text(cx + cardW / 2 - 20, cardTop + 18, '★ 0', {
      fontFamily: 'DM Sans, Comic Sans MS, system-ui, sans-serif',
      fontSize: '20px', color: '#6b4423', fontStyle: 'bold'
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(2003);

    this.bannerText = scene.add.text(cx, cardTop + 56, '', {
      fontFamily: 'DM Sans, Comic Sans MS, system-ui, sans-serif',
      fontSize: '16px', color: '#6b4423', fontStyle: 'italic', align: 'center',
      wordWrap: { width: cardW - 40 }
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(2003);

    this.wordText = scene.add.text(cx, cy - 50, '', {
      fontFamily: 'DM Sans, Comic Sans MS, system-ui, sans-serif',
      fontSize: '72px', color: '#2a2a2a', fontStyle: 'bold', align: 'center'
    }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(2003);

    const closeR = 18;
    const closeBg = scene.add.circle(cx + cardW / 2 - closeR - 8, cardTop + closeR + 8, closeR, 0xff6b6b)
      .setStrokeStyle(3, 0x4a2c1a)
      .setScrollFactor(0).setDepth(2004)
      .setInteractive({ useHandCursor: true });
    const closeText = scene.add.text(closeBg.x, closeBg.y, '✕', {
      fontFamily: 'DM Sans, system-ui, sans-serif',
      fontSize: '22px', color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(2005);
    closeBg.on('pointerdown', () => this.dismiss());

    this.cardW = cardW;
    this.cardH = cardH;
    this.cardCx = cx;
    this.cardCy = cy;
    this.cardTop = cardTop;
    this.modalElements = [overlay, shadow, card, this.timerText, this.scoreText, this.bannerText, this.wordText, closeBg, closeText];

    this.keyHandler = (e) => {
      if (!this.isOpen || this.answering) return;
      const key = e.key.toLowerCase();
      const map = { a: 0, b: 1, c: 2, d: 3 };
      if (key in map && this.optionButtons.length > 0) {
        e.preventDefault();
        const idx = map[key];
        if (this.optionButtons[idx]) this._answer(idx);
      } else if (key === 'escape') {
        e.preventDefault();
        this.dismiss();
      }
    };
    window.addEventListener('keydown', this.keyHandler);
  }

  _startPracticeRound() {
    this.isPractice = true;
    this.practiceIndex = 0;
    this.practiceWords = this._pickWords(3);
    this.bannerText.setText('Practice round! Read the word, then tap what you saw.');
    this.timerText.setVisible(false);
    this._flashNextPracticeWord();
  }

  _flashNextPracticeWord() {
    this._clearOptions();
    if (this.practiceIndex >= this.practiceWords.length) {
      this._endPractice();
      return;
    }
    const w = this.practiceWords[this.practiceIndex];
    this._flashWord(w, this.practiceFlashMs, () => {
      this._showOptions(w, true);
    });
  }

  _endPractice() {
    this._clearOptions();
    this.wordText.setText('');
    this.bannerText.setText('Ready for real? Tap to start!');
    const save = SaveManager.load();
    save.stats.crabPracticeDone = true;
    SaveManager.save(save);

    const scene = this.scene;
    const cx = this.cardCx, cy = this.cardCy + 40;
    const btnBg = scene.add.rectangle(cx, cy, 260, 70, 0xa8e6cf)
      .setStrokeStyle(3, 0x4a2c1a)
      .setScrollFactor(0).setDepth(2003)
      .setInteractive({ useHandCursor: true });
    const btnTxt = scene.add.text(cx, cy, 'START! 🦀', {
      fontFamily: 'DM Sans, Comic Sans MS, system-ui, sans-serif',
      fontSize: '24px', color: '#1f5e44', fontStyle: 'bold'
    }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(2004);
    this.modalElements.push(btnBg, btnTxt);
    btnBg.on('pointerdown', () => {
      btnBg.destroy(); btnTxt.destroy();
      this._startRealRound();
    });
  }

  _startRealRound() {
    this.isPractice = false;
    this.score = 0;
    this.wordsCompleted = 0;
    this.recentWords = [];
    this.scoreText.setText('★ 0');
    this.timerText.setVisible(true);
    this.bannerText.setText('Read the word and tap what you saw — be quick!');
    this.endTime = this.scene.time.now + this.timeLimitMs;
    this._tickTimer();
    this._flashNextRealWord();
  }

  _tickTimer() {
    if (!this.isOpen || this.isPractice) return;
    const remaining = Math.max(0, this.endTime - this.scene.time.now);
    const secs = Math.ceil(remaining / 1000);
    this.timerText.setText('⏱ ' + secs);
    if (remaining <= 0) {
      this._endRound();
      return;
    }
    this.scene.time.delayedCall(100, () => this._tickTimer());
  }

  _flashNextRealWord() {
    if (!this.isOpen || this.isPractice) return;
    const remaining = this.endTime - this.scene.time.now;
    if (remaining <= 0) return;
    this._clearOptions();
    const w = this._pickWords(1, this.recentWords)[0];
    this.recentWords.push(w);
    if (this.recentWords.length > 6) this.recentWords.shift();
    this._flashWord(w, this.flashMs, () => {
      if (!this.isOpen || this.isPractice) return;
      this._showOptions(w, false);
    });
  }

  _flashWord(word, durationMs, onDone) {
    this.flashedWord = word;
    this.wordText.setText(word.toUpperCase());
    this.wordText.setAlpha(0);
    this.scene.tweens.add({
      targets: this.wordText,
      alpha: { from: 0, to: 1 },
      duration: 100,
      yoyo: false
    });
    this.scene.time.delayedCall(durationMs, () => {
      if (!this.isOpen) return;
      this.scene.tweens.add({
        targets: this.wordText,
        alpha: 0,
        duration: 120,
        onComplete: () => {
          this.wordText.setText('');
          this.wordText.setAlpha(1);
          if (onDone) onDone();
        }
      });
    });
  }

  _showOptions(target, isPractice) {
    const scene = this.scene;
    const options = this._buildOptions(target);
    this.expectedIndex = options.indexOf(target);
    this.optionsShownAt = scene.time.now;
    const cx = this.cardCx, cy = this.cardCy + 90;
    const btnW = 220, btnH = 56, gapX = 20, gapY = 14;
    const btnColors = [0xa8e6cf, 0xffd3b6, 0xb5d7f0, 0xd5b8e8];
    const btnTextColors = ['#1f5e44', '#7a3a14', '#1a4a6e', '#4e2a6e'];
    const letters = ['A', 'B', 'C', 'D'];
    this.optionButtons = [];
    for (let i = 0; i < 4; i++) {
      const col = i % 2, row = Math.floor(i / 2);
      const bx = cx + (col === 0 ? -(btnW / 2 + gapX / 2) : (btnW / 2 + gapX / 2));
      const by = cy + (row === 0 ? -(btnH / 2 + gapY / 2) : (btnH / 2 + gapY / 2));
      const bg = scene.add.rectangle(bx, by, btnW, btnH, btnColors[i])
        .setStrokeStyle(3, 0x4a2c1a)
        .setScrollFactor(0).setDepth(2003)
        .setInteractive({ useHandCursor: true });
      const letter = scene.add.text(bx - btnW / 2 + 14, by, letters[i], {
        fontFamily: 'DM Sans, Comic Sans MS, system-ui, sans-serif',
        fontSize: '18px', color: btnTextColors[i], fontStyle: 'bold'
      }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(2004);
      const txt = scene.add.text(bx + 8, by, options[i], {
        fontFamily: 'DM Sans, Comic Sans MS, system-ui, sans-serif',
        fontSize: '24px', color: btnTextColors[i], fontStyle: 'bold'
      }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(2004);
      const idx = i;
      bg.on('pointerdown', () => this._answer(idx));
      this.optionButtons.push({ bg, letter, txt });
    }
  }

  _clearOptions() {
    for (const b of this.optionButtons) {
      if (b.bg) b.bg.destroy();
      if (b.letter) b.letter.destroy();
      if (b.txt) b.txt.destroy();
    }
    this.optionButtons = [];
  }

  _answer(idx) {
    if (this.answering || !this.isOpen) return;
    const correct = idx === this.expectedIndex;
    this.answering = true;
    const btn = this.optionButtons[idx];
    const flashColor = correct ? 0x4caf50 : 0xef5350;
    if (btn && btn.bg && btn.bg.active) {
      const orig = btn.bg.fillColor;
      btn.bg.setFillStyle(flashColor);
      this.scene.tweens.add({
        targets: btn.bg,
        scaleX: { from: 1.08, to: 1 },
        scaleY: { from: 1.08, to: 1 },
        duration: 220,
        ease: 'Back.easeOut',
        onComplete: () => { if (btn.bg.active) btn.bg.setFillStyle(orig); }
      });
    }
    if (this.isPractice) {
      if (correct) playCorrect(); else playWrong();
      this.scene.time.delayedCall(450, () => {
        this.answering = false;
        this.practiceIndex++;
        this._flashNextPracticeWord();
      });
      return;
    }
    // Real round scoring
    const elapsed = this.scene.time.now - this.optionsShownAt;
    let delta = 0;
    if (correct) {
      if (elapsed < 2000) delta = 3;
      else if (elapsed < 4000) delta = 2;
      else delta = 1;
      playCorrect();
    } else {
      delta = -1;
      playWrong();
    }
    this.score = Math.max(0, this.score + delta);
    this.wordsCompleted++;
    this.scoreText.setText('★ ' + this.score);
    const remaining = this.endTime - this.scene.time.now;
    this.scene.time.delayedCall(remaining <= 0 ? 200 : 350, () => {
      this.answering = false;
      if (remaining <= 0) {
        this._endRound();
      } else {
        this._flashNextRealWord();
      }
    });
  }

  _endRound() {
    if (this._revealShown) return;
    this._revealShown = true;
    this._clearOptions();
    this.wordText.setText('');
    this.timerText.setText('⏱ 0');

    const save = SaveManager.load();
    if (!save.speedReadBest) save.speedReadBest = { defaultBank: 0, homeworkBank: 0 };
    const prevBest = save.speedReadBest[this.bankKey] || 0;
    let newBest = prevBest;
    if (this.score > prevBest) {
      newBest = this.score;
      save.speedReadBest[this.bankKey] = this.score;
      SaveManager.save(save);
    }
    const beatBest = this.score > prevBest;
    const passed = this.score >= this.passThreshold;

    let rating;
    if (this.score >= 12) rating = 'WOW! ⭐⭐⭐';
    else if (this.score >= 8) rating = 'Amazing! ⭐⭐';
    else if (this.score >= 4) rating = 'Great reading! ⭐';
    else rating = 'Good start! Try again to beat it!';

    const scene = this.scene;
    const cx = this.cardCx, cy = this.cardCy;
    const reveal = scene.add.text(cx, cy - 60, 'You read ' + this.score + ' words! 🌟', {
      fontFamily: 'DM Sans, Comic Sans MS, system-ui, sans-serif',
      fontSize: '30px', color: '#2a2a2a', fontStyle: 'bold', align: 'center'
    }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(2004);
    const ratingTxt = scene.add.text(cx, cy - 10, rating, {
      fontFamily: 'DM Sans, Comic Sans MS, system-ui, sans-serif',
      fontSize: '24px', color: '#6b4423', fontStyle: 'bold', align: 'center'
    }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(2004);
    const bestLine = beatBest
      ? 'New best! Previous: ' + prevBest
      : 'Your best: ' + newBest + ' words!';
    const bestTxt = scene.add.text(cx, cy + 26, bestLine, {
      fontFamily: 'DM Sans, Comic Sans MS, system-ui, sans-serif',
      fontSize: '18px', color: '#4a2c1a', fontStyle: 'italic', align: 'center'
    }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(2004);
    this.modalElements.push(reveal, ratingTxt, bestTxt);

    if (!passed) {
      const failTxt = scene.add.text(cx, cy + 60, 'Almost! Try again — read fast!', {
        fontFamily: 'DM Sans, Comic Sans MS, system-ui, sans-serif',
        fontSize: '16px', color: '#c62828', fontStyle: 'bold', align: 'center'
      }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(2004);
      this.modalElements.push(failTxt);
    }

    const btnY = cy + 110;
    const btnBg = scene.add.rectangle(cx, btnY, 240, 60, passed ? 0xa8e6cf : 0xffd3b6)
      .setStrokeStyle(3, 0x4a2c1a)
      .setScrollFactor(0).setDepth(2004)
      .setInteractive({ useHandCursor: true });
    const btnTxt = scene.add.text(cx, btnY, passed ? 'CONTINUE 🌟' : 'BACK TO MAP', {
      fontFamily: 'DM Sans, Comic Sans MS, system-ui, sans-serif',
      fontSize: '20px', color: passed ? '#1f5e44' : '#7a3a14', fontStyle: 'bold'
    }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(2005);
    this.modalElements.push(btnBg, btnTxt);
    btnBg.on('pointerdown', () => {
      this._destroyModal();
      this._removeKeyHandler();
      this.isOpen = false;
      if (this.scene.activeQuiz === this) this.scene.activeQuiz = null;
      if (passed) this.onPass(this.score);
      else this.onFail(this.score);
    });
  }

  _pickWords(n, excludeList) {
    const pool = this.words.filter(w => !excludeList || !excludeList.includes(w));
    const source = pool.length >= n ? pool : this.words.slice();
    const shuffled = source.slice();
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, n);
  }

  _buildOptions(target) {
    const sameLen = this.distractorBank.filter(w => w !== target && w.length === target.length);
    const scored = sameLen.map(w => {
      let m = 0;
      for (let i = 0; i < w.length; i++) if (w[i] === target[i]) m++;
      return { w, m };
    });
    scored.sort((a, b) => b.m - a.m + (Math.random() - 0.5));
    const distractors = [];
    for (const s of scored) {
      if (distractors.length >= 3) break;
      if (!distractors.includes(s.w)) distractors.push(s.w);
    }
    // Fallback: pull any words from distractor bank if not enough same-length
    if (distractors.length < 3) {
      const others = this.distractorBank.filter(w => w !== target && !distractors.includes(w));
      while (distractors.length < 3 && others.length > 0) {
        const j = Math.floor(Math.random() * others.length);
        distractors.push(others.splice(j, 1)[0]);
      }
    }
    const opts = [target, ...distractors.slice(0, 3)];
    while (opts.length < 4) opts.push(target); // last-ditch — only if bank is tiny
    // Shuffle
    for (let i = opts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [opts[i], opts[j]] = [opts[j], opts[i]];
    }
    return opts;
  }

  _destroyModal() {
    for (const e of this.modalElements) {
      if (e && e.destroy) e.destroy();
    }
    this.modalElements = [];
    this._clearOptions();
  }

  _removeKeyHandler() {
    if (this.keyHandler) {
      window.removeEventListener('keydown', this.keyHandler);
      this.keyHandler = null;
    }
  }

  dismiss() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this._destroyModal();
    this._removeKeyHandler();
    if (this.scene.activeQuiz === this) this.scene.activeQuiz = null;
  }
}

class DialogueSequence {
  constructor(scene, lines, onComplete) {
    this.scene = scene;
    this.lines = lines;
    this.onComplete = onComplete;
    this.index = 0;
    this.elements = [];
    this.dismissed = false;
    this.tapHandler = null;
    this.keyHandler = null;
    this.advanceTimer = null;
  }

  start() {
    this.tapHandler = () => this._advance();
    this.scene.input.on('pointerdown', this.tapHandler);
    this.keyHandler = (e) => {
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight') {
        e.preventDefault();
        this._advance();
      }
    };
    window.addEventListener('keydown', this.keyHandler);
    this._show();
  }

  _show() {
    this._destroyCurrent();
    if (this.index >= this.lines.length) {
      this._cleanup();
      this.onComplete();
      return;
    }
    const scene = this.scene;
    const cam = scene.cameras.main;
    const cx = cam.width / 2;
    const cy = cam.height - 110;
    const text = this.lines[this.index];
    const t = scene.add.text(cx, cy, text, {
      fontFamily: 'DM Sans, Comic Sans MS, system-ui, sans-serif',
      fontSize: '22px',
      color: '#2a2a2a',
      fontStyle: 'bold',
      align: 'center',
      wordWrap: { width: cam.width - 100 }
    }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(1500);
    const padX = 24, padY = 16;
    const bg = scene.add.rectangle(cx, cy, t.width + padX * 2, t.height + padY * 2, 0xfffaf0, 0.96)
      .setStrokeStyle(3, 0x4a2c1a)
      .setScrollFactor(0).setDepth(1499);
    const hint = scene.add.text(cx, cam.height - 28, 'Tap to continue', {
      fontFamily: 'DM Sans, Comic Sans MS, system-ui, sans-serif',
      fontSize: '12px',
      color: '#8b6f3a',
      fontStyle: 'italic'
    }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(1500);
    bg.alpha = 0; t.alpha = 0; hint.alpha = 0;
    scene.tweens.add({ targets: [bg, t, hint], alpha: 1, duration: 280 });
    this.elements = [bg, t, hint];
    this.advanceTimer = scene.time.delayedCall(4000, () => this._advance());
  }

  _advance() {
    if (this.dismissed) return;
    if (this.advanceTimer) this.advanceTimer.remove(false);
    this.advanceTimer = null;
    this.index++;
    this._show();
  }

  _destroyCurrent() {
    for (const e of this.elements) {
      if (e && e.destroy) e.destroy();
    }
    this.elements = [];
  }

  _cleanup() {
    if (this.dismissed) return;
    this.dismissed = true;
    this._destroyCurrent();
    if (this.tapHandler) {
      this.scene.input.off('pointerdown', this.tapHandler);
      this.tapHandler = null;
    }
    if (this.keyHandler) {
      window.removeEventListener('keydown', this.keyHandler);
      this.keyHandler = null;
    }
    if (this.advanceTimer) {
      this.advanceTimer.remove(false);
      this.advanceTimer = null;
    }
  }
}

class StopScene extends Phaser.Scene {
  constructor() { super('Stop'); }

  create(data) {
    this.config = STOP_CONFIGS[data.stopId];
    this.returnTo = data.returnTo;
    this.lookHeld = { left: false, right: false };
    this.exiting = false;
    this.activeQuiz = null;
    this.completedThisVisit = false;
    this.isReplay = false;
    this.dialogue = null;

    this.cameras.main.setBounds(-200, 0, 1200, 600);
    this.cameras.main.scrollX = 0;

    if (typeof this[this.config.sceneBuilder] === 'function') {
      this[this.config.sceneBuilder]();
    }
    this.buildLookZones();
    this.buildBackButton();
    this.cursors = this.input.keyboard.createCursorKeys();
    this.cameras.main.fadeIn(500, 255, 255, 255);
    this.time.delayedCall(700, () => this.startDialogue());
  }

  startDialogue() {
    const save = SaveManager.load();
    this.isReplay = save.puzzlesSolved[this.config.puzzleKey] === true;
    let lines;
    if (this.config.id === 'crab') {
      const useHomework = HomeworkManager.hasActivePack();
      const bankKey = useHomework ? 'homeworkBank' : 'defaultBank';
      const best = (save.speedReadBest && save.speedReadBest[bankKey]) || 0;
      if (best > 0) {
        lines = ['Want to try again? Your best is ' + best + ' words!', 'Read fast and beat it!'];
      } else {
        lines = this.isReplay ? this.config.replayDialogue : this.config.dialogue;
      }
    } else {
      lines = this.isReplay ? this.config.replayDialogue : this.config.dialogue;
    }
    this.dialogue = new DialogueSequence(this, lines, () => this.startPuzzle());
    this.dialogue.start();
  }

  startPuzzle() {
    if (this.config.puzzleType === 'speedRead') {
      this.startSpeedRead();
    } else {
      this.startQuiz();
    }
  }

  startQuiz() {
    const questions = this.config.puzzleBank();
    const quiz = new QuizManager(this, questions, {
      onComplete: () => this.startCelebration(),
      onWrong: () => {},
      onFail: () => this.exitToMapNoSave(),
      animalHints: { hint: this.config.hintText }
    });
    quiz.start();
  }

  startSpeedRead() {
    const save = SaveManager.load();
    const useHomework = HomeworkManager.hasActivePack();
    const bankKey = useHomework ? 'homeworkBank' : 'defaultBank';
    const words = useHomework ? HomeworkManager.getActiveWords() : CVC_WORD_BANK_DEFAULT.slice();
    const distractorBank = words; // homework: pull all from pack; default: full bank
    const skipPractice = !!(save.stats && save.stats.crabPracticeDone);
    const speed = new SpeedReadManager(this, {
      words,
      distractorBank,
      bankKey,
      skipPractice,
      onPass: () => this.startCelebration(),
      onFail: () => this.exitToMapNoSave()
    });
    speed.start();
  }

  exitToMapNoSave() {
    if (this.exiting) return;
    this.exiting = true;
    const cam = this.cameras.main;
    const cx = cam.width / 2, cy = cam.height / 2;
    const msg = this.add.text(cx, cy, 'Try again! ' + this.config.displayName + ' is waiting.', {
      fontFamily: 'DM Sans, Comic Sans MS, system-ui, sans-serif',
      fontSize: '24px', color: '#4a2c1a', fontStyle: 'bold', align: 'center',
      stroke: '#fffaf0', strokeThickness: 6
    }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(3000);
    msg.alpha = 0;
    this.tweens.add({ targets: msg, alpha: 1, duration: 250 });
    this.time.delayedCall(2000, () => {
      this.cameras.main.fadeOut(500, 255, 255, 255);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('TopDown', {
          returnTo: this.returnTo,
          justCompleted: null
        });
      });
    });
  }

  startCelebration() {
    if (!this.isReplay) {
      this.applySaveProgress();
      this.completedThisVisit = true;
    }
    const onCelDone = (this.config.id === 'parrot')
      ? () => this.parrotCelebrationDone()
      : () => this.exitToMap(false);
    if (typeof this[this.config.celebrationBuilder] === 'function') {
      this[this.config.celebrationBuilder](onCelDone);
    } else {
      onCelDone();
    }
  }

  parrotCelebrationDone() {
    const save = SaveManager.load();
    if (!save.stats.endingSeen) {
      save.stats.endingSeen = true;
      SaveManager.save(save);
      this.exitToEnding();
    } else {
      this.exitToMap(false);
    }
  }

  exitToEnding() {
    if (this.exiting) return;
    this.exiting = true;
    if (this.dialogue) this.dialogue._cleanup();
    if (this.activeQuiz && this.activeQuiz.isOpen) this.activeQuiz.dismiss();
    this.cameras.main.fadeOut(700, 255, 255, 255);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('Ending', {});
    });
  }

  applySaveProgress() {
    const save = SaveManager.load();
    save.puzzlesSolved[this.config.puzzleKey] = true;
    if (this.config.nextActKey) save.actsUnlocked[this.config.nextActKey] = true;
    if (this.config.partyItemKey) {
      save.partyItems[this.config.partyItemKey] = (save.partyItems[this.config.partyItemKey] || 0) + 1;
    }
    if (this.config.id === 'parrot') {
      save.partyItems.goldenBanana = true;
      save.stats.gameCompleted = true;
    }
    SaveManager.save(save);
  }

  exitToMap(viaBack) {
    if (this.exiting) return;
    this.exiting = true;
    if (this.dialogue) this.dialogue._cleanup();
    if (this.activeQuiz && this.activeQuiz.isOpen) this.activeQuiz.dismiss();
    this.cameras.main.fadeOut(500, 255, 255, 255);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('TopDown', {
        returnTo: this.returnTo,
        justCompleted: (this.completedThisVisit && !viaBack) ? this.config.id : null
      });
    });
  }

  buildLookZones() {
    const cam = this.cameras.main;
    const cw = cam.width, ch = cam.height;
    const left = this.add.rectangle(cw * 0.18, ch / 2, cw * 0.36, ch * 0.6, 0xffffff, 0)
      .setScrollFactor(0).setDepth(900).setInteractive();
    const right = this.add.rectangle(cw * 0.82, ch / 2, cw * 0.36, ch * 0.6, 0xffffff, 0)
      .setScrollFactor(0).setDepth(900).setInteractive();
    left.on('pointerdown', () => { this.lookHeld.left = true; });
    left.on('pointerup',   () => { this.lookHeld.left = false; });
    left.on('pointerout',  () => { this.lookHeld.left = false; });
    left.on('pointerupoutside', () => { this.lookHeld.left = false; });
    right.on('pointerdown', () => { this.lookHeld.right = true; });
    right.on('pointerup',   () => { this.lookHeld.right = false; });
    right.on('pointerout',  () => { this.lookHeld.right = false; });
    right.on('pointerupoutside', () => { this.lookHeld.right = false; });
  }

  buildBackButton() {
    const backBg = this.add.rectangle(60, 50, 96, 50, 0xffeb3b, 0.95)
      .setScrollFactor(0).setStrokeStyle(3, 0x8b5a2b).setDepth(1000);
    const backTxt = this.add.text(60, 50, 'BACK', {
      fontFamily: 'DM Sans, Comic Sans MS, system-ui, sans-serif',
      fontSize: '22px', color: '#4a2c1a', fontStyle: 'bold'
    }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(1001);
    backBg.setInteractive({ useHandCursor: true });
    backBg.on('pointerdown', () => this.exitToMap(true));
    backTxt.setInteractive({ useHandCursor: true });
    backTxt.on('pointerdown', () => this.exitToMap(true));
  }

  update(time, delta) {
    if (this.exiting) return;
    if (this.activeQuiz && this.activeQuiz.isOpen) return;
    const step = 320 * delta / 1000;
    if (this.cursors.left.isDown || this.lookHeld.left) this.cameras.main.scrollX -= step;
    if (this.cursors.right.isDown || this.lookHeld.right) this.cameras.main.scrollX += step;
    this.cameras.main.scrollX = Phaser.Math.Clamp(this.cameras.main.scrollX, -200, 400);
  }

  makeWinBanner(text) {
    const cam = this.cameras.main;
    const cx = cam.width / 2;
    const bg = this.add.rectangle(cx, 70, 600, 80, 0x4a2c1a, 0.92)
      .setStrokeStyle(4, 0xffeb3b).setScrollFactor(0).setDepth(2500);
    const txt = this.add.text(cx, 70, text, {
      fontFamily: 'DM Sans, Comic Sans MS, system-ui, sans-serif',
      fontSize: '32px', color: '#ffeb3b', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 4
    }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(2501);
    bg.alpha = 0; txt.alpha = 0;
    this.tweens.add({ targets: [bg, txt], alpha: 1, scale: { from: 0.5, to: 1 }, duration: 400, ease: 'Back.easeOut' });
    return { bg, txt };
  }

  updateBanner(banner, newText) {
    banner.txt.setText(newText);
    this.tweens.add({ targets: [banner.bg, banner.txt], scale: { from: 1.15, to: 1 }, duration: 300, ease: 'Back.easeOut' });
  }

  spawnConfetti(count) {
    const cam = this.cameras.main;
    const cw = cam.width;
    // Scale by perf tier: low halves, mid/high keep stock.
    const scaled = Math.max(8, Math.round(count * tierScale(0.5, 1.0, 1.0)));
    const colors = [0xff5e7e, 0xffeb3b, 0xa8e6cf, 0xb5d7f0, 0xd5b8e8, 0xffd3b6];
    for (let i = 0; i < scaled; i++) {
      const x = Math.random() * cw;
      const y = -10 - Math.random() * 80;
      const piece = this.add.rectangle(x, y, 8, 12, Phaser.Math.RND.pick(colors))
        .setScrollFactor(0).setDepth(2400);
      piece.setAngle(Math.random() * 360);
      this.tweens.add({
        targets: piece,
        y: cam.height + 30,
        angle: piece.angle + 360 * (Math.random() > 0.5 ? 1 : -1),
        x: x + Phaser.Math.Between(-80, 80),
        duration: 3000 + Math.random() * 1500,
        ease: 'Cubic.easeIn',
        onComplete: () => piece.destroy()
      });
    }
  }

  spawnSparkles(x, y, count) {
    const scaled = Math.max(4, Math.round(count * tierScale(0.5, 1.0, 1.0)));
    for (let i = 0; i < scaled; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 50 + Math.random() * 100;
      const star = this.add.star(x, y, 4, 3, 8, 0xffeb3b).setDepth(2400);
      this.tweens.add({
        targets: star,
        x: x + Math.cos(angle) * radius,
        y: y + Math.sin(angle) * radius,
        scale: { from: 1.2, to: 0 },
        alpha: { from: 1, to: 0 },
        angle: 360,
        duration: 900 + Math.random() * 600,
        ease: 'Cubic.easeOut',
        onComplete: () => star.destroy()
      });
    }
  }

  scheduleContinue(onComplete, delayMs) {
    let fired = false;
    const fire = () => {
      if (fired) return;
      fired = true;
      this.input.off('pointerdown', tapHandler);
      window.removeEventListener('keydown', keyHandler);
      onComplete();
    };
    const tapHandler = () => fire();
    const keyHandler = (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); fire(); } };
    this.time.delayedCall(delayMs || 4000, fire);
    this.input.on('pointerdown', tapHandler);
    window.addEventListener('keydown', keyHandler);
  }

  // ====================================================
  // Stop 1 — Snowy's hungry
  // ====================================================
  buildSnowyScene() {
    this.add.rectangle(400, 100, 2000, 220, 0xffd180).setScrollFactor(0);
    this.add.rectangle(400, 240, 2000, 80, 0xffe0a0).setScrollFactor(0);
    this.add.rectangle(400, 305, 2000, 50, 0xfff0c0).setScrollFactor(0);

    this.add.circle(620, 110, 55, 0xfff9c4, 0.4).setScrollFactor(0.05);
    this.add.circle(620, 110, 40, 0xffeb3b, 0.95).setScrollFactor(0.05);
    this.add.circle(612, 102, 16, 0xffffff, 0.7).setScrollFactor(0.05);

    for (let i = 0; i < 4; i++) {
      const cx = -200 + i * 320 + Phaser.Math.Between(-30, 30);
      const cy = 150 + Phaser.Math.Between(-15, 25);
      this.add.ellipse(cx, cy, 140, 28, 0xffffff, 0.7).setScrollFactor(0.12);
      this.add.ellipse(cx + 30, cy + 5, 100, 22, 0xffffff, 0.7).setScrollFactor(0.12);
    }

    for (let i = 0; i < 9; i++) {
      const tx = -300 + i * 180 + Phaser.Math.Between(-30, 30);
      this.add.circle(tx, 340, Phaser.Math.Between(40, 75), 0x2a4a2a).setScrollFactor(0.25);
    }

    for (let i = 0; i < 7; i++) {
      const tx = -200 + i * 200 + Phaser.Math.Between(-30, 30);
      this.add.circle(tx, 380, Phaser.Math.Between(50, 80), 0x4a7a3a).setScrollFactor(0.45);
    }

    const treeX = 600;
    this.add.rectangle(treeX, 320, 30, 250, 0x6b4423).setScrollFactor(0.6).setOrigin(0.5, 0);
    this.add.rectangle(treeX - 6, 320, 6, 250, 0x4a2c1a).setScrollFactor(0.6).setOrigin(0.5, 0);
    this.add.circle(treeX - 30, 280, 55, 0x1b5e20).setScrollFactor(0.6);
    this.add.circle(treeX + 30, 280, 55, 0x2e7d32).setScrollFactor(0.6);
    this.add.circle(treeX, 250, 60, 0x388e3c).setScrollFactor(0.6);
    this.add.rectangle(treeX, 360, 3, 90, 0x8b5a2b).setScrollFactor(0.6).setOrigin(0.5, 0);

    this.cheese = this.add.container(treeX, 460);
    this.cheese.add(this.add.circle(0, 0, 16, 0xfff176));
    this.cheese.add(this.add.circle(0, 0, 16, 0x000000, 0).setStrokeStyle(2, 0xc9a13d));
    this.cheese.add(this.add.circle(-5, -3, 2.5, 0xc9a13d));
    this.cheese.add(this.add.circle(3, 5, 2.5, 0xc9a13d));
    this.cheese.add(this.add.circle(6, -5, 1.5, 0xc9a13d));
    this.cheese.setScrollFactor(0.6);
    this.tweens.add({
      targets: this.cheese,
      angle: { from: -4, to: 4 },
      duration: 2200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    const logY = 540;
    this.add.ellipse(300, logY + 16, 320, 16, 0x000000, 0.3).setScrollFactor(1);
    this.add.ellipse(300, logY, 320, 80, 0x6b4423).setScrollFactor(1);
    this.add.ellipse(300, logY - 6, 320, 60, 0x8b5a2b).setScrollFactor(1);
    this.add.ellipse(140, logY, 40, 50, 0x4a2c1a).setScrollFactor(1);
    this.add.ellipse(460, logY, 40, 50, 0x4a2c1a).setScrollFactor(1);
    this.add.ellipse(140, logY, 28, 36, 0x2a1810).setScrollFactor(1);
    this.add.ellipse(460, logY, 28, 36, 0x2a1810).setScrollFactor(1);

    this.snowyChar = this.makeSnowyCharacter(280, logY - 28);

    this.add.rectangle(400, 600, 2000, 80, 0x267d3a).setScrollFactor(1);
    this.add.rectangle(400, 585, 2000, 30, 0x3a9c4a, 0.6).setScrollFactor(1);

    this.makeButterfly(150, 220);
    this.makeButterfly(450, 200);
    this.makeButterfly(720, 260);
  }

  makeSnowyCharacter(x, y) {
    const c = this.add.container(x, y);
    c.setScrollFactor(1);
    const tail = this.add.graphics();
    tail.lineStyle(5, 0xffc4c4, 1);
    tail.beginPath();
    tail.moveTo(-30, 4); tail.lineTo(-44, -6); tail.lineTo(-56, 6); tail.lineTo(-64, -2);
    tail.strokePath();
    const body = this.add.ellipse(0, 0, 64, 40, 0xf5f5f5);
    const bodyShade = this.add.ellipse(0, 10, 56, 14, 0xd0d0d0);
    const head = this.add.circle(26, 0, 22, 0xf5f5f5);
    const earL = this.add.circle(32, -14, 9, 0xf5f5f5);
    const earR = this.add.circle(32, 14, 9, 0xf5f5f5);
    const earLInner = this.add.circle(32, -14, 5, 0xffc4c4);
    const earRInner = this.add.circle(32, 14, 5, 0xffc4c4);
    const eyeL = this.add.ellipse(34, -6, 6, 3, 0x2a2a2a);
    const eyeR = this.add.ellipse(34, 6, 6, 3, 0x2a2a2a);
    const nose = this.add.circle(46, 0, 4, 0xff8888);
    const whiskers = this.add.graphics();
    whiskers.lineStyle(1, 0x888888, 0.7);
    whiskers.beginPath();
    whiskers.moveTo(42, -3); whiskers.lineTo(54, -6);
    whiskers.moveTo(42, 0);  whiskers.lineTo(56, 0);
    whiskers.moveTo(42, 3);  whiskers.lineTo(54, 6);
    whiskers.strokePath();
    c.add([tail, body, bodyShade, head, earL, earR, earLInner, earRInner, eyeL, eyeR, nose, whiskers]);
    this.tweens.add({
      targets: c,
      scaleY: { from: 1, to: 0.96 },
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    return c;
  }

  makeButterfly(x, y) {
    const c = this.add.container(x, y);
    c.setScrollFactor(0.7);
    const color = Phaser.Math.RND.pick([0xff8e3c, 0xff5e7e, 0xffeb3b, 0xb967ff]);
    const wing1 = this.add.ellipse(-7, 0, 16, 22, color);
    const wing2 = this.add.ellipse(7, 0, 16, 22, color);
    const body = this.add.ellipse(0, 0, 3, 16, 0x4a2c1a);
    c.add([wing1, wing2, body]);
    this.tweens.add({
      targets: c,
      x: x + Phaser.Math.Between(-80, 80),
      y: y + Phaser.Math.Between(-30, 30),
      duration: 3000 + Math.random() * 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    this.tweens.add({
      targets: [wing1, wing2],
      scaleX: 0.35,
      duration: 180,
      yoyo: true,
      repeat: -1
    });
    return c;
  }

  celebrateSnowy(onComplete) {
    const banner = this.makeWinBanner(this.config.winBannerText);
    playFanfare();
    this.tweens.add({
      targets: this.cheese,
      y: 530,
      duration: 1500,
      ease: 'Cubic.easeIn'
    });
    this.time.delayedCall(1600, () => {
      this.tweens.add({
        targets: this.snowyChar,
        angle: { from: -10, to: 10 },
        duration: 200,
        yoyo: true,
        repeat: 5
      });
      this.tweens.add({
        targets: this.snowyChar,
        y: this.snowyChar.y - 22,
        duration: 380,
        yoyo: true,
        repeat: 2,
        ease: 'Sine.easeInOut'
      });
      this.spawnSparkles(this.snowyChar.x, this.snowyChar.y, 24);
    });
    this.spawnConfetti(60);
    this.time.delayedCall(2800, () => {
      this.updateBanner(banner, this.config.completeBannerText);
    });
    this.scheduleContinue(onComplete, 4500);
  }

  // ====================================================
  // Stop 2 — Crab's sore claw
  // ====================================================
  buildCrabScene() {
    this.add.rectangle(400, 60, 2000, 140, 0x4a148c).setScrollFactor(0);
    this.add.rectangle(400, 150, 2000, 60, 0x7b1fa2).setScrollFactor(0);
    this.add.rectangle(400, 200, 2000, 40, 0xc2185b).setScrollFactor(0);
    this.add.rectangle(400, 235, 2000, 30, 0xef5350).setScrollFactor(0);
    this.add.rectangle(400, 260, 2000, 25, 0xff7043).setScrollFactor(0);
    this.add.rectangle(400, 285, 2000, 30, 0xff9800).setScrollFactor(0);
    this.add.rectangle(400, 310, 2000, 25, 0xffb74d).setScrollFactor(0);

    this.add.circle(420, 320, 90, 0xff5722, 0.35).setScrollFactor(0.08);
    this.add.circle(420, 320, 70, 0xff7043, 0.7).setScrollFactor(0.08);
    this.add.circle(420, 320, 55, 0xff9800, 1).setScrollFactor(0.08);
    this.add.circle(415, 315, 24, 0xffffff, 0.6).setScrollFactor(0.08);

    for (let i = 0; i < 5; i++) {
      const ix = -300 + i * 280 + Phaser.Math.Between(-30, 30);
      this.add.ellipse(ix, 410, 100, 22, 0x311b4a, 0.9).setScrollFactor(0.18);
    }

    this.add.rectangle(400, 440, 2000, 50, 0x1a237e).setScrollFactor(0.4);
    this.add.rectangle(400, 470, 2000, 30, 0x303f9f).setScrollFactor(0.4);
    this.add.ellipse(420, 425, 320, 18, 0xff7043, 0.7).setScrollFactor(0.4);
    this.add.ellipse(420, 440, 240, 12, 0xff9800, 0.6).setScrollFactor(0.4);
    for (let i = 0; i < 10; i++) {
      const sx = -200 + i * 100 + Phaser.Math.Between(-15, 15);
      const sy = 430 + Phaser.Math.Between(0, 40);
      const sh = this.add.ellipse(sx, sy, Phaser.Math.Between(18, 36), 4, 0xffffff, 0.6).setScrollFactor(0.4);
      this.tweens.add({ targets: sh, alpha: { from: 0.6, to: 0.15 }, duration: 1500, yoyo: true, repeat: -1, delay: i * 130 });
    }

    for (let i = 0; i < 5; i++) {
      const dx = -300 + i * 240 + Phaser.Math.Between(-30, 30);
      this.add.ellipse(dx, 510, 220, 18, 0xddc89a, 0.85).setScrollFactor(0.6);
    }

    this.add.rectangle(400, 580, 2000, 100, 0xf5deb3).setScrollFactor(1);
    this.add.rectangle(400, 555, 2000, 30, 0xddc89a, 0.7).setScrollFactor(1);

    for (let i = 0; i < 8; i++) {
      const sx = Phaser.Math.Between(-100, 900);
      const sy = 555 + Phaser.Math.Between(0, 50);
      this.add.ellipse(sx, sy, Phaser.Math.Between(12, 20), Phaser.Math.Between(6, 10), 0xffe0d0).setScrollFactor(1).setRotation(Math.random() * Math.PI);
    }

    this.crabChar = this.makeCrabCharacter(400, 540);
  }

  makeCrabCharacter(x, y) {
    const c = this.add.container(x, y);
    c.setScrollFactor(1);
    const shadow = this.add.ellipse(0, 22, 90, 14, 0x000000, 0.35);
    const body = this.add.ellipse(0, 0, 80, 50, 0xef5350);
    const bodyShade = this.add.ellipse(0, 12, 70, 18, 0xc62828);
    const bodyShine = this.add.ellipse(-10, -10, 30, 15, 0xff8a80, 0.7);
    const eyeStalkL = this.add.rectangle(-10, -22, 3, 14, 0xc62828);
    const eyeStalkR = this.add.rectangle(10, -22, 3, 14, 0xc62828);
    const eyeBaseL = this.add.circle(-10, -32, 7, 0xffffff);
    const eyeBaseR = this.add.circle(10, -32, 7, 0xffffff);
    const eyeL = this.add.circle(-10, -32, 4, 0x2a2a2a);
    const eyeR = this.add.circle(10, -32, 4, 0x2a2a2a);
    const eyeLHi = this.add.circle(-9, -33, 1.5, 0xffffff);
    const eyeRHi = this.add.circle(11, -33, 1.5, 0xffffff);
    const clawL = this.add.circle(-50, -8, 16, 0xef5350);
    const clawLPinch = this.add.triangle(-62, -16, 0, 0, -10, -8, 0, -16, 0xef5350);
    const clawLPinch2 = this.add.triangle(-62, 0, 0, 0, -10, 8, 0, 16, 0xef5350);
    this.sorClaw = this.add.container(50, -8);
    const sorClawBody = this.add.circle(0, 0, 16, 0xef5350);
    const sorClawTop = this.add.triangle(-12, -8, 0, 0, 12, 0, 12, -8, 0xef5350);
    const sorClawBot = this.add.triangle(-12, 8, 0, 0, 12, 0, 12, 8, 0xef5350);
    const soreOverlay = this.add.circle(0, 0, 18, 0xff9800, 0.4);
    this.sorClawShade = soreOverlay;
    this.sorClaw.add([sorClawBody, sorClawTop, sorClawBot, soreOverlay]);
    const legL1 = this.add.rectangle(-30, 16, 3, 12, 0xc62828).setRotation(0.3);
    const legL2 = this.add.rectangle(-18, 18, 3, 12, 0xc62828).setRotation(0.15);
    const legL3 = this.add.rectangle(-6, 19, 3, 12, 0xc62828).setRotation(0);
    const legR1 = this.add.rectangle(6, 19, 3, 12, 0xc62828).setRotation(0);
    const legR2 = this.add.rectangle(18, 18, 3, 12, 0xc62828).setRotation(-0.15);
    const legR3 = this.add.rectangle(30, 16, 3, 12, 0xc62828).setRotation(-0.3);
    c.add([
      shadow, body, bodyShade, bodyShine,
      legL1, legL2, legL3, legR1, legR2, legR3,
      eyeStalkL, eyeStalkR, eyeBaseL, eyeBaseR, eyeL, eyeR, eyeLHi, eyeRHi,
      clawL, clawLPinch, clawLPinch2, this.sorClaw
    ]);
    this.sorClaw.angle = -25;
    this.tweens.add({ targets: this.sorClawShade, alpha: { from: 0.4, to: 0.7 }, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: c, y: y - 4, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    return c;
  }

  celebrateCrab(onComplete) {
    const banner = this.makeWinBanner(this.config.winBannerText);
    playFanfare();
    this.tweens.add({
      targets: this.sorClawShade,
      alpha: 0,
      duration: 800
    });
    this.tweens.add({
      targets: this.sorClaw,
      angle: 0,
      duration: 700,
      ease: 'Back.easeOut'
    });
    this.spawnSparkles(this.crabChar.x + 50, this.crabChar.y - 8, 18);
    this.time.delayedCall(900, () => {
      this.tweens.add({
        targets: this.crabChar,
        angle: { from: -8, to: 8 },
        duration: 180,
        yoyo: true,
        repeat: 5
      });
      this.tweens.add({
        targets: this.crabChar,
        y: this.crabChar.y - 12,
        duration: 280,
        yoyo: true,
        repeat: 3,
        ease: 'Sine.easeInOut'
      });
    });
    this.time.delayedCall(2200, () => {
      this.tweens.add({
        targets: this.crabChar,
        x: this.crabChar.x - 120,
        y: this.crabChar.y + 10,
        duration: 1500,
        ease: 'Sine.easeInOut'
      });
      this.spawnSplash(this.crabChar.x - 200, 510);
    });
    this.spawnConfetti(60);
    this.time.delayedCall(2800, () => {
      this.updateBanner(banner, this.config.completeBannerText);
    });
    this.scheduleContinue(onComplete, 4800);
  }

  spawnSplash(x, y) {
    for (let i = 0; i < 10; i++) {
      const drop = this.add.circle(x, y, Phaser.Math.Between(4, 8), 0xb5d7f0).setScrollFactor(1);
      const angle = -Math.PI / 2 + Phaser.Math.FloatBetween(-1, 1);
      const speed = Phaser.Math.Between(60, 120);
      this.tweens.add({
        targets: drop,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: { from: 1, to: 0 },
        duration: 700,
        ease: 'Cubic.easeOut',
        onComplete: () => drop.destroy()
      });
    }
  }

  // ====================================================
  // Stop 3 — Knotted snake
  // ====================================================
  buildSnakeScene() {
    this.add.rectangle(400, 100, 2000, 220, 0x81d4fa).setScrollFactor(0);
    this.add.rectangle(400, 240, 2000, 80, 0xb3e5fc).setScrollFactor(0);
    this.add.rectangle(400, 305, 2000, 50, 0xd4eeff).setScrollFactor(0);

    this.add.circle(620, 110, 50, 0xfff9c4, 0.4).setScrollFactor(0.05);
    this.add.circle(620, 110, 35, 0xffeb3b, 0.95).setScrollFactor(0.05);

    for (let i = 0; i < 3; i++) {
      const cx = -200 + i * 400 + Phaser.Math.Between(-30, 30);
      this.add.ellipse(cx, 150 + Phaser.Math.Between(-20, 20), 140, 26, 0xffffff, 0.7).setScrollFactor(0.1);
    }

    for (let i = 0; i < 11; i++) {
      const tx = -300 + i * 170 + Phaser.Math.Between(-30, 30);
      this.add.circle(tx, 340, Phaser.Math.Between(45, 75), 0x1a4d2e).setScrollFactor(0.3);
    }
    for (let i = 0; i < 9; i++) {
      const tx = -200 + i * 200 + Phaser.Math.Between(-30, 30);
      this.add.circle(tx, 380, Phaser.Math.Between(50, 80), 0x2e7d32).setScrollFactor(0.45);
    }

    const treeX = 400;
    this.add.ellipse(treeX, 600, 200, 30, 0x000000, 0.3).setScrollFactor(1);
    this.add.rectangle(treeX, 600, 90, 540, 0x8b5a2b).setScrollFactor(1).setOrigin(0.5, 1);
    this.add.rectangle(treeX - 18, 600, 24, 540, 0x6b4423).setScrollFactor(1).setOrigin(0.5, 1);
    this.add.rectangle(treeX + 26, 600, 8, 540, 0xa67248).setScrollFactor(1).setOrigin(0.5, 1);
    this.add.rectangle(treeX - 60, 320, 50, 12, 0x8b5a2b).setScrollFactor(1).setRotation(-0.3);
    this.add.rectangle(treeX + 60, 200, 50, 12, 0x8b5a2b).setScrollFactor(1).setRotation(0.3);
    this.add.rectangle(treeX - 70, 130, 60, 12, 0x8b5a2b).setScrollFactor(1).setRotation(-0.4);
    this.add.circle(treeX - 30, 80, 60, 0x1b5e20).setScrollFactor(1);
    this.add.circle(treeX + 30, 80, 55, 0x2e7d32).setScrollFactor(1);
    this.add.circle(treeX, 50, 60, 0x4caf50).setScrollFactor(1);
    this.add.circle(treeX - 70, 100, 45, 0x66bb6a).setScrollFactor(1);
    this.add.circle(treeX + 70, 100, 45, 0x388e3c).setScrollFactor(1);
    this.add.ellipse(treeX + 12, 480, 16, 22, 0x2a1810).setScrollFactor(1);
    this.add.ellipse(treeX + 12, 480, 10, 16, 0x000000).setScrollFactor(1);

    this.snakeChar = this.makeSnakeCharacter(treeX, 280);
  }

  makeSnakeCharacter(x, y) {
    const c = this.add.container(x, y);
    c.setScrollFactor(1);
    this.snakeKnotSegments = [];
    const positions = [
      { x: -50, y: 70 },
      { x: -20, y: 50 },
      { x: 30, y: 40 },
      { x: 50, y: 0 },
      { x: 10, y: -20 },
      { x: -30, y: -10 },
      { x: -40, y: 30 },
      { x: 0, y: 40 },
      { x: 40, y: 60 },
      { x: 70, y: 80 }
    ];
    for (let i = 0; i < positions.length; i++) {
      const p = positions[i];
      const seg = this.add.circle(p.x, p.y, 14 - i * 0.3, 0x66bb6a);
      const segShade = this.add.ellipse(p.x, p.y + 3, (12 - i * 0.3) * 2, 4, 0x2e7d32);
      c.add([seg, segShade]);
      this.snakeKnotSegments.push({ seg, shade: segShade, knotX: p.x, knotY: p.y, unknotX: -120 + i * 30, unknotY: 50 });
    }
    const headX = 70, headY = 80;
    this.snakeHead = this.add.circle(headX, headY, 16, 0x66bb6a);
    const headShade = this.add.ellipse(headX, headY + 4, 26, 5, 0x2e7d32);
    this.snakeEyeL = this.add.circle(headX + 4, headY - 6, 5, 0xffffff);
    this.snakeEyeR = this.add.circle(headX + 12, headY - 4, 5, 0xffffff);
    this.snakeEyePupilL = this.add.circle(headX + 5, headY - 6, 2.5, 0x2a2a2a);
    this.snakeEyePupilR = this.add.circle(headX + 13, headY - 4, 2.5, 0x2a2a2a);
    this.snakeTongue = this.add.rectangle(headX + 18, headY, 8, 2, 0xe53935);
    c.add([this.snakeHead, headShade, this.snakeEyeL, this.snakeEyeR, this.snakeEyePupilL, this.snakeEyePupilR, this.snakeTongue]);
    this.tweens.add({
      targets: this.snakeTongue,
      scaleX: { from: 1, to: 1.3 },
      duration: 400,
      yoyo: true,
      repeat: -1
    });
    this.tweens.add({
      targets: [this.snakeEyePupilL, this.snakeEyePupilR],
      x: '+=2',
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    return c;
  }

  celebrateSnake(onComplete) {
    const banner = this.makeWinBanner(this.config.winBannerText);
    playFanfare();
    for (let i = 0; i < this.snakeKnotSegments.length; i++) {
      const s = this.snakeKnotSegments[i];
      this.tweens.add({
        targets: [s.seg, s.shade],
        x: s.unknotX,
        y: s.unknotY + (s === this.snakeKnotSegments[0] ? 0 : 0),
        duration: 1200,
        delay: i * 80,
        ease: 'Sine.easeInOut'
      });
    }
    this.tweens.add({
      targets: [this.snakeHead, this.snakeEyeL, this.snakeEyeR, this.snakeEyePupilL, this.snakeEyePupilR, this.snakeTongue],
      x: '+=' + (180),
      duration: 1300,
      ease: 'Sine.easeInOut'
    });
    this.spawnSparkles(400, 280, 24);
    this.time.delayedCall(1400, () => {
      this.tweens.add({
        targets: this.snakeChar,
        y: this.snakeChar.y + 200,
        duration: 1200,
        ease: 'Sine.easeInOut'
      });
    });
    this.spawnConfetti(60);
    this.time.delayedCall(2800, () => {
      this.updateBanner(banner, this.config.completeBannerText);
    });
    this.scheduleContinue(onComplete, 4800);
  }

  // ====================================================
  // Stop 4 — Bat with hurt wing
  // ====================================================
  buildBatScene() {
    this.add.rectangle(400, 300, 2000, 600, 0x0a0820).setScrollFactor(0);
    this.add.rectangle(400, 300, 2000, 600, 0x1a103a, 0.6).setScrollFactor(0);

    // Far cave wall (parallax 0.15)
    for (let i = 0; i < 14; i++) {
      const rx = -300 + i * 130 + Phaser.Math.Between(-15, 15);
      const ry = Phaser.Math.Between(100, 480);
      this.add.circle(rx, ry, Phaser.Math.Between(40, 80), 0x2a1a3a, 0.6).setScrollFactor(0.15);
    }

    // Distant cave mouth light (faint warm glow)
    this.add.circle(420, 240, 110, 0xffb74d, 0.12).setScrollFactor(0.18);
    this.add.circle(420, 240, 80, 0xffd180, 0.18).setScrollFactor(0.18);

    // Stalactites hanging from ceiling
    for (let i = 0; i < 10; i++) {
      const sx = -200 + i * 130 + Phaser.Math.Between(-25, 25);
      const sh = Phaser.Math.Between(40, 80);
      this.add.triangle(sx, 0, -16, 0, 16, 0, 0, sh, 0x3a2a4a).setScrollFactor(0.4);
      this.add.triangle(sx - 2, 0, -14, 0, 0, sh - 8, -8, 0, 0x4a3a5a).setScrollFactor(0.4);
    }

    // Magical glow particles floating
    for (let i = 0; i < 18; i++) {
      const px = -200 + Phaser.Math.Between(0, 1100);
      const py = 100 + Phaser.Math.Between(0, 400);
      const c = Phaser.Math.RND.pick([0xb967ff, 0x42a5f5, 0xa8e6cf, 0xffd180]);
      const p = this.add.circle(px, py, Phaser.Math.Between(3, 6), c, 0.7).setScrollFactor(0.5);
      this.tweens.add({
        targets: p,
        y: py - Phaser.Math.Between(30, 80),
        alpha: { from: 0.8, to: 0.1 },
        duration: 3000 + Math.random() * 2000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        delay: i * 150
      });
    }

    // Cave ground (foreground)
    this.add.rectangle(400, 580, 2000, 80, 0x2a1a3a).setScrollFactor(1);
    this.add.rectangle(400, 555, 2000, 30, 0x3a2a4a, 0.7).setScrollFactor(1);

    // Stalagmites rising from ground
    for (let i = 0; i < 6; i++) {
      const sx = -100 + i * 200 + Phaser.Math.Between(-20, 20);
      this.add.triangle(sx, 540, -14, 30, 14, 30, 0, -Phaser.Math.Between(20, 50), 0x4a3a5a).setScrollFactor(1);
    }

    // Stones
    this.add.ellipse(250, 565, 36, 14, 0x4a3a5a).setScrollFactor(1);
    this.add.ellipse(550, 568, 40, 16, 0x3a2a4a).setScrollFactor(1);

    this.batChar = this.makeBatCharacter(400, 530);
  }

  makeBatCharacter(x, y) {
    const c = this.add.container(x, y);
    c.setScrollFactor(1);
    const shadow = this.add.ellipse(0, 20, 70, 10, 0x000000, 0.4);
    this.batBody = this.add.ellipse(0, 0, 24, 32, 0x424242);
    this.batBodyShade = this.add.ellipse(0, 8, 18, 8, 0x222222);
    this.batWingL = this.add.triangle(-26, 4, 0, 0, 24, -12, 24, 14, 0x424242);
    this.batWingR = this.add.triangle(26, 4, 0, 0, -24, -12, -24, 14, 0x424242);
    this.batHead = this.add.circle(0, -16, 12, 0x424242);
    this.batEarL = this.add.triangle(-7, -22, -4, 0, 4, 0, 0, -10, 0x424242);
    this.batEarR = this.add.triangle(7, -22, -4, 0, 4, 0, 0, -10, 0x424242);
    this.batEyeL = this.add.circle(-4, -16, 2.5, 0xff5722);
    this.batEyeR = this.add.circle(4, -16, 2.5, 0xff5722);
    const fangL = this.add.triangle(-2, -10, -1, 0, 1, 0, 0, 4, 0xffffff);
    const fangR = this.add.triangle(2, -10, -1, 0, 1, 0, 0, 4, 0xffffff);
    this.hurtOverlay = this.add.ellipse(-26, 4, 30, 18, 0xff9800, 0.45);
    c.add([shadow, this.batWingL, this.batWingR, this.batBody, this.batBodyShade, this.batHead, this.batEarL, this.batEarR, this.batEyeL, this.batEyeR, fangL, fangR, this.hurtOverlay]);
    // Hurt wing droops (rotated)
    this.batWingL.angle = -30;
    this.tweens.add({ targets: this.hurtOverlay, alpha: { from: 0.4, to: 0.7 }, duration: 800, yoyo: true, repeat: -1 });
    this.tweens.add({ targets: c, scaleY: { from: 1, to: 0.97 }, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    return c;
  }

  celebrateBat(onComplete) {
    const banner = this.makeWinBanner(this.config.winBannerText);
    playFanfare();
    this.tweens.add({
      targets: this.hurtOverlay,
      alpha: 0,
      duration: 800
    });
    this.tweens.add({
      targets: this.batWingL,
      angle: 0,
      duration: 700,
      ease: 'Back.easeOut'
    });
    this.spawnSparkles(this.batChar.x - 20, this.batChar.y, 20);
    this.time.delayedCall(900, () => {
      // Both wings flap rapidly
      this.tweens.add({
        targets: this.batWingL,
        scaleX: { from: 1, to: 0.5 },
        duration: 120,
        yoyo: true,
        repeat: 15
      });
      this.tweens.add({
        targets: this.batWingR,
        scaleX: { from: 1, to: 0.5 },
        duration: 120,
        yoyo: true,
        repeat: 15
      });
      // Bat flies up + loops
      this.tweens.add({
        targets: this.batChar,
        y: this.batChar.y - 200,
        duration: 1500,
        ease: 'Sine.easeOut'
      });
      this.tweens.add({
        targets: this.batChar,
        x: { from: this.batChar.x, to: this.batChar.x + 120 },
        duration: 800,
        yoyo: true,
        ease: 'Sine.easeInOut'
      });
    });
    this.time.delayedCall(2400, () => {
      // Fly off into cave depths
      this.tweens.add({
        targets: this.batChar,
        x: this.batChar.x + 350,
        y: 240,
        scale: 0.3,
        alpha: 0,
        duration: 1500,
        ease: 'Cubic.easeIn'
      });
    });
    this.spawnConfetti(60);
    this.time.delayedCall(2800, () => {
      this.updateBanner(banner, this.config.completeBannerText);
    });
    this.scheduleContinue(onComplete, 4800);
  }

  // ====================================================
  // Stop 5 — Lost parrot (FINALE)
  // ====================================================
  buildParrotScene() {
    // Beautiful sunset gradient
    this.add.rectangle(400, 50, 2000, 100, 0x3a1a4a).setScrollFactor(0);
    this.add.rectangle(400, 130, 2000, 60, 0x7b1fa2).setScrollFactor(0);
    this.add.rectangle(400, 180, 2000, 50, 0xc2185b).setScrollFactor(0);
    this.add.rectangle(400, 225, 2000, 40, 0xef5350).setScrollFactor(0);
    this.add.rectangle(400, 260, 2000, 30, 0xff7043).setScrollFactor(0);
    this.add.rectangle(400, 290, 2000, 30, 0xff9800).setScrollFactor(0);
    this.add.rectangle(400, 320, 2000, 25, 0xffb74d).setScrollFactor(0);

    // Sun on horizon
    this.add.circle(400, 340, 90, 0xff5722, 0.35).setScrollFactor(0.08);
    this.add.circle(400, 340, 65, 0xff7043, 0.85).setScrollFactor(0.08);
    this.add.circle(400, 340, 45, 0xff9800).setScrollFactor(0.08);
    this.add.circle(395, 335, 18, 0xffffff, 0.6).setScrollFactor(0.08);

    // Soft cloud wisps
    for (let i = 0; i < 4; i++) {
      const cx = -200 + i * 320 + Phaser.Math.Between(-30, 30);
      const cy = 130 + Phaser.Math.Between(-15, 25);
      this.add.ellipse(cx, cy, 180, 22, 0xff7043, 0.6).setScrollFactor(0.08);
      this.add.ellipse(cx + 30, cy + 5, 120, 16, 0xff9800, 0.55).setScrollFactor(0.08);
    }

    // Distant mountains
    for (let i = 0; i < 7; i++) {
      const mx = -300 + i * 230 + Phaser.Math.Between(-20, 20);
      const mh = Phaser.Math.Between(70, 140);
      this.add.triangle(mx, 360, 0, 0, 220, 0, 110, -mh, 0x4a2c5a).setScrollFactor(0.15);
    }

    // Mid jungle clearing
    for (let i = 0; i < 9; i++) {
      const tx = -200 + i * 180 + Phaser.Math.Between(-30, 30);
      this.add.circle(tx, 400, Phaser.Math.Between(45, 70), 0x2a4a3a).setScrollFactor(0.35);
    }

    // Ground (clearing)
    this.add.rectangle(400, 560, 2000, 120, 0x4a7a3a).setScrollFactor(1);
    this.add.rectangle(400, 510, 2000, 30, 0x66bb6a, 0.5).setScrollFactor(1);

    // Petals scattered
    for (let i = 0; i < 18; i++) {
      const px = Phaser.Math.Between(-100, 900);
      const py = 520 + Phaser.Math.Between(0, 50);
      const c = Phaser.Math.RND.pick([0xff5e7e, 0xffeb3b, 0xb967ff, 0xff8e3c]);
      this.add.circle(px, py, Phaser.Math.Between(3, 6), c).setScrollFactor(1);
    }

    // Perch (a vertical tree stump in the middle)
    const perchX = 400, perchY = 470;
    this.add.ellipse(perchX, 540, 50, 14, 0x000000, 0.4).setScrollFactor(1);
    this.add.rectangle(perchX, 540, 36, 80, 0x6b4423).setScrollFactor(1).setOrigin(0.5, 1);
    this.add.rectangle(perchX - 6, 540, 8, 80, 0x4a2c1a).setScrollFactor(1).setOrigin(0.5, 1);
    this.add.ellipse(perchX, 460, 50, 16, 0x8b5a2b).setScrollFactor(1);
    this.add.ellipse(perchX, 458, 40, 12, 0xa67248).setScrollFactor(1);

    this.parrotChar = this.makeParrotCharacter(perchX, perchY - 30);

    // Containers for finale characters (added later in celebration)
    this.finaleAnimals = [];
  }

  makeParrotCharacter(x, y) {
    const c = this.add.container(x, y);
    c.setScrollFactor(1);
    const body = this.add.ellipse(0, 6, 30, 42, 0x42a5f5);
    const bodyShade = this.add.ellipse(0, 16, 24, 10, 0x1976d2);
    const wing = this.add.ellipse(-8, 4, 18, 28, 0x1976d2);
    const tail = this.add.ellipse(0, 28, 14, 16, 0x0d47a1);
    const head = this.add.circle(0, -12, 16, 0x42a5f5);
    const headShade = this.add.ellipse(0, -8, 22, 6, 0x1976d2);
    const eyeBase = this.add.circle(6, -14, 5, 0xffffff);
    const eye = this.add.circle(7, -14, 3, 0x2a2a2a);
    this.parrotEyeHi = this.add.circle(8, -15, 1, 0xffffff);
    const beak = this.add.triangle(13, -10, 0, -3, 0, 3, 10, 0, 0xffa726);
    const beakLower = this.add.triangle(13, -8, 0, 0, 0, 5, 8, 2, 0xff9800);
    const plume = this.add.ellipse(-3, -24, 4, 10, 0xff5e7e);
    const plume2 = this.add.ellipse(2, -25, 4, 10, 0xffeb3b);
    const plume3 = this.add.ellipse(7, -23, 4, 10, 0x66bb6a);
    this.parrotTear = this.add.circle(4, -8, 2, 0x42a5f5, 0.9);
    c.add([tail, wing, body, bodyShade, head, headShade, eyeBase, eye, this.parrotEyeHi, beak, beakLower, plume, plume2, plume3, this.parrotTear]);
    this.tweens.add({
      targets: c,
      y: y - 4,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    this.tweens.add({
      targets: this.parrotTear,
      y: '+=8',
      alpha: { from: 0.9, to: 0 },
      duration: 1800,
      repeat: -1,
      ease: 'Sine.easeIn'
    });
    return c;
  }

  celebrateParrotFinale(onComplete) {
    const banner = this.makeWinBanner(this.config.winBannerText);
    playFanfare();
    if (this.parrotTear) this.parrotTear.alpha = 0;
    // Parrot flies up joyfully
    this.tweens.add({
      targets: this.parrotChar,
      y: this.parrotChar.y - 80,
      duration: 800,
      ease: 'Sine.easeOut'
    });
    this.tweens.add({
      targets: this.parrotChar,
      angle: { from: -10, to: 10 },
      duration: 200,
      yoyo: true,
      repeat: 6
    });
    // Spawn all animals gathering
    this.time.delayedCall(900, () => this.spawnFinaleAnimals());
    // Confetti rain (heavier than other stops)
    this.spawnConfetti(120);
    // Fireworks bursts
    this.time.delayedCall(1500, () => this.spawnFireworks());
    this.time.delayedCall(2500, () => this.spawnFireworks());
    this.time.delayedCall(3300, () => this.spawnFireworks());
    // Golden Banana descends
    this.time.delayedCall(2200, () => this.spawnGoldenBanana());
    // Update banner to "PARTY TIME!"
    this.time.delayedCall(3600, () => {
      this.updateBanner(banner, '🎊 PARTY TIME! 🎊');
    });
    // Final banner
    this.time.delayedCall(5500, () => {
      this.updateBanner(banner, this.config.completeBannerText);
    });
    this.scheduleContinue(onComplete, 7500);
  }

  spawnFinaleAnimals() {
    const ground = 530;
    // Snowy (white rat)
    const snowy = this.makeFinaleRat(180, ground, 0xf5f5f5, 0xffc4c4);
    // Midnight (black rat)
    const midnight = this.makeFinaleRat(260, ground, 0x2a2a2a, 0xff8888);
    // Crab
    const crab = this.makeFinaleCrab(330, ground);
    // Snake
    const snake = this.makeFinaleSnake(490, ground);
    // Bat (in air above)
    const bat = this.makeFinaleBat(570, ground - 80);
    this.finaleAnimals.push(snowy, midnight, crab, snake, bat);
    // Dance: bob up and down
    for (let i = 0; i < this.finaleAnimals.length; i++) {
      const a = this.finaleAnimals[i];
      a.alpha = 0;
      this.tweens.add({ targets: a, alpha: 1, duration: 400, delay: i * 120 });
      this.tweens.add({
        targets: a,
        y: a.y - 12,
        duration: 380 + i * 40,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        delay: 500 + i * 120
      });
      this.tweens.add({
        targets: a,
        angle: { from: -6, to: 6 },
        duration: 320,
        yoyo: true,
        repeat: -1,
        delay: 600 + i * 120
      });
    }
  }

  makeFinaleRat(x, y, body, ear) {
    const c = this.add.container(x, y);
    c.setScrollFactor(1);
    c.add(this.add.ellipse(0, 6, 18, 4, 0x000000, 0.35));
    c.add(this.add.ellipse(0, 0, 26, 18, body));
    c.add(this.add.circle(11, -1, 8, body));
    c.add(this.add.circle(13, -7, 3, ear));
    c.add(this.add.circle(13, 5, 3, ear));
    c.add(this.add.circle(14, -3, 1.4, 0x2a2a2a));
    c.add(this.add.circle(14, 3, 1.4, 0x2a2a2a));
    c.add(this.add.circle(18, 0, 1.6, 0xff8888));
    return c;
  }

  makeFinaleCrab(x, y) {
    const c = this.add.container(x, y);
    c.setScrollFactor(1);
    c.add(this.add.ellipse(0, 6, 30, 6, 0x000000, 0.35));
    c.add(this.add.ellipse(0, 0, 32, 22, 0xef5350));
    c.add(this.add.circle(-18, -4, 6, 0xef5350));
    c.add(this.add.circle(18, -4, 6, 0xef5350));
    c.add(this.add.circle(-5, -8, 2.5, 0xffffff));
    c.add(this.add.circle(5, -8, 2.5, 0xffffff));
    c.add(this.add.circle(-5, -8, 1.5, 0x2a2a2a));
    c.add(this.add.circle(5, -8, 1.5, 0x2a2a2a));
    return c;
  }

  makeFinaleSnake(x, y) {
    const c = this.add.container(x, y);
    c.setScrollFactor(1);
    c.add(this.add.ellipse(0, 6, 30, 6, 0x000000, 0.35));
    for (let i = 0; i < 5; i++) {
      c.add(this.add.circle(-12 + i * 6, Math.sin(i) * 4, 7, 0x66bb6a));
    }
    c.add(this.add.circle(20, 0, 10, 0x66bb6a));
    c.add(this.add.circle(23, -3, 2, 0xffffff));
    c.add(this.add.circle(23, 3, 2, 0xffffff));
    c.add(this.add.circle(23, -3, 1, 0x2a2a2a));
    c.add(this.add.circle(23, 3, 1, 0x2a2a2a));
    return c;
  }

  makeFinaleBat(x, y) {
    const c = this.add.container(x, y);
    c.setScrollFactor(1);
    c.add(this.add.ellipse(0, 16, 26, 6, 0x000000, 0.35));
    const wingL = this.add.triangle(-12, 0, 0, 0, 16, -8, 16, 8, 0x424242);
    const wingR = this.add.triangle(12, 0, 0, 0, -16, -8, -16, 8, 0x424242);
    c.add([wingL, wingR]);
    c.add(this.add.ellipse(0, 0, 16, 20, 0x424242));
    c.add(this.add.circle(0, -10, 9, 0x424242));
    c.add(this.add.circle(-3, -10, 2, 0xff5722));
    c.add(this.add.circle(3, -10, 2, 0xff5722));
    this.tweens.add({ targets: [wingL, wingR], scaleX: 0.4, duration: 200, yoyo: true, repeat: -1 });
    return c;
  }

  spawnFireworks() {
    const cam = this.cameras.main;
    const fx = Phaser.Math.Between(100, cam.width - 100);
    const fy = Phaser.Math.Between(120, 280);
    const color = Phaser.Math.RND.pick([0xff5e7e, 0xffeb3b, 0xa8e6cf, 0xb5d7f0, 0xd5b8e8, 0xff8e3c]);
    const burst = tierScale(14, 24, 24);
    for (let i = 0; i < burst; i++) {
      const angle = (i / burst) * Math.PI * 2;
      const star = this.add.star(fx, fy, 4, 3, 8, color).setScrollFactor(0).setDepth(2400);
      const r = 120;
      this.tweens.add({
        targets: star,
        x: fx + Math.cos(angle) * r,
        y: fy + Math.sin(angle) * r,
        scale: { from: 1.5, to: 0 },
        alpha: { from: 1, to: 0 },
        duration: 1200,
        ease: 'Cubic.easeOut',
        onComplete: () => star.destroy()
      });
    }
  }

  spawnGoldenBanana() {
    const cam = this.cameras.main;
    const cx = cam.width / 2;
    const gb = this.add.container(cx, -60);
    gb.setScrollFactor(0).setDepth(2500);
    const glow = this.add.circle(0, 0, 50, 0xffeb3b, 0.4);
    const glowMid = this.add.circle(0, 0, 35, 0xfff176, 0.7);
    const body = this.add.ellipse(0, 0, 60, 22, 0xffd54f);
    const hi = this.add.ellipse(0, -3, 45, 8, 0xfff176);
    const tip1 = this.add.circle(-30, 0, 5, 0xc9a13d);
    const tip2 = this.add.circle(30, 0, 5, 0xc9a13d);
    gb.add([glow, glowMid, body, hi, tip1, tip2]);
    gb.angle = -25;
    this.tweens.add({
      targets: gb,
      y: 200,
      duration: 1800,
      ease: 'Cubic.easeIn'
    });
    this.tweens.add({
      targets: gb,
      angle: 0,
      duration: 1800,
      ease: 'Cubic.easeOut'
    });
    this.tweens.add({
      targets: glow,
      alpha: { from: 0.4, to: 0.8 },
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    this.time.delayedCall(2000, () => {
      this.spawnSparkles(cx, 200, 30);
    });
  }
}

class TopDownScene extends Phaser.Scene {
  constructor() { super('TopDown'); }

  create(data) {
    this.solids = [];
    this.waterfallDrops = [];
    this.peekMarkers = [];
    this.bananas = [];
    this.exiting = false;
    this.snowyMoving = false;
    this.midnightMoving = false;

    const save = SaveManager.load();
    const now = new Date().toISOString();
    if (save.stats.startedAt === null) save.stats.startedAt = now;
    save.stats.lastPlayedAt = now;
    SaveManager.save(save);

    if (!this.registry.has('collectedBananas')) {
      this.registry.set('collectedBananas', save.bananasCollected.slice());
    }
    if (!this.registry.has('bananaCount')) {
      this.registry.set('bananaCount', save.bananaCount);
    }

    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);

    this.buildBeach();
    this.buildNorthwestForest();
    this.buildTallTreeArea();
    this.buildCaveArea();
    this.buildRiverBridge();
    this.buildCenterJungle();
    this.buildEastTrail();

    for (const spot of PEEK_SPOTS) this.makePeekMarker(spot);

    const collected = this.registry.get('collectedBananas');
    BANANA_SPOTS.forEach((spot, i) => {
      if (collected.includes(i)) return;
      this.bananas.push(this.makeBanana(spot.x, spot.y, i));
    });

    const startX = (data && data.returnTo && data.returnTo.x) || 1200;
    const startY = (data && data.returnTo && data.returnTo.y) || 900;
    this.sophia = this.createSophia(startX, startY);

    this.snowy = this.createRat(startX - 40, startY, {
      body: 0xf5f5f5, bodyShadow: 0xd0d0d0, ear: 0xffc4c4,
      nose: 0xff8888, eye: 0x2a2a2a, foot: 0xffd6d6, tail: 0xffc4c4
    }, 1.0, 0);
    this.midnight = this.createRat(startX - 80, startY, {
      body: 0x2a2a2a, bodyShadow: 0x111111, ear: 0xff8888,
      nose: 0xff6666, eye: 0xffeb3b, foot: 0x555555, tail: 0xff8888
    }, 1.0, 5);

    this.snowyLabel = this.makeNameLabel('Snowy');
    this.midnightLabel = this.makeNameLabel('Midnight');
    this.snowyLabel.setDepth(850);
    this.midnightLabel.setDepth(850);

    this.makeCounterUI();

    this.sceneryLabels = SCENERY_LABELS.map(spec => {
      const t = this.add.text(spec.x, spec.y, spec.text, {
        fontFamily: 'Comic Sans MS, Chalkboard SE, system-ui, sans-serif',
        fontSize: '22px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 4,
        fontStyle: 'bold'
      }).setOrigin(0.5, 1).setAlpha(0).setDepth(850);
      return { x: spec.x, y: spec.y, text: t };
    });

    this.chatterActive = false;
    this.lastChatterTime = 0;
    this.nextChatterDelay = 20000 + Math.random() * 20000;
    this.activeBubble = null;

    this.makeComingSoonSign(1100, 320);

    this.activeQuiz = null;
    this.placeholderOpen = false;
    this.parentModeOpen = false;
    this.stopMarkers = [];
    this.breadcrumbGraphics = this.add.graphics().setDepth(40);
    this.pathHighlightUntil = 0;
    this.buildStopMarkers();

    this.buildHomeworkIndicator();
    this.buildMapTopButtons();

    this.caveDim = this.add.rectangle(400, 300, 800, 600, 0x080820)
      .setAlpha(0)
      .setScrollFactor(0)
      .setDepth(800);
    this.caveLight = this.add.circle(400, 300, 160, 0xffe082)
      .setAlpha(0)
      .setScrollFactor(0)
      .setDepth(801);
    this.caveLight.setBlendMode(Phaser.BlendModes.ADD);
    this.caveLightCore = this.add.circle(400, 300, 70, 0xfff9c4)
      .setAlpha(0)
      .setScrollFactor(0)
      .setDepth(802);
    this.caveLightCore.setBlendMode(Phaser.BlendModes.ADD);

    this.cameras.main.startFollow(this.sophia, true, 0.12, 0.12);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    this.cameras.main.fadeIn(350, 255, 255, 255);

    if (data && data.justCompleted) {
      this.handleReturnFromStop(data.justCompleted);
    }

    if (SaveManager.load().stats.gameCompleted) {
      this.partyMode = true;
    }
  }

  handleReturnFromStop(stopId) {
    const m = this.stopMarkers.find(x => x.spec.id === stopId);
    if (m) {
      this.tweens.add({
        targets: m.container,
        scale: { from: 1.4, to: 1 },
        duration: 600,
        ease: 'Back.easeOut'
      });
      this.spawnReturnSparkles(m.spec.x, m.spec.y);
    }
    const nextSpec = STOP_MARKERS.find(s => s.prereq === stopId);
    if (nextSpec) {
      this.pathHighlightUntil = this.scene.systems.game.getTime() + 3500;
      const nextMarker = this.stopMarkers.find(x => x.spec.id === nextSpec.id);
      if (nextMarker) {
        this.tweens.add({
          targets: nextMarker.container,
          scale: { from: 1.6, to: 1 },
          duration: 800,
          ease: 'Back.easeOut',
          delay: 400
        });
      }
    }
    if (this.snowy) this.spawnRatPuff(this.snowy.x, this.snowy.y);
    if (this.midnight) this.spawnRatPuff(this.midnight.x, this.midnight.y);
  }

  spawnReturnSparkles(x, y) {
    for (let i = 0; i < 14; i++) {
      const angle = (i / 14) * Math.PI * 2;
      const star = this.add.star(x, y, 4, 3, 8, 0xffeb3b).setDepth(70);
      this.tweens.add({
        targets: star,
        x: x + Math.cos(angle) * 60,
        y: y + Math.sin(angle) * 60,
        scale: { from: 1, to: 0 },
        alpha: { from: 1, to: 0 },
        angle: 360,
        duration: 700,
        ease: 'Cubic.easeOut',
        onComplete: () => star.destroy()
      });
    }
  }

  spawnRatPuff(x, y) {
    for (let i = 0; i < 6; i++) {
      const puff = this.add.circle(x + Phaser.Math.Between(-8, 8), y + Phaser.Math.Between(-4, 4), 6, 0xffffff, 0.8).setDepth(70);
      this.tweens.add({
        targets: puff,
        scale: { from: 0.6, to: 1.6 },
        alpha: { from: 0.85, to: 0 },
        duration: 500,
        ease: 'Cubic.easeOut',
        onComplete: () => puff.destroy()
      });
    }
  }

  updatePartyModeConfetti(time) {
    if (!this.lastConfettiTime || time - this.lastConfettiTime > 1500) {
      this.lastConfettiTime = time;
      const cam = this.cameras.main;
      const cx = this.sophia.x + Phaser.Math.Between(-360, 360);
      const cy = this.sophia.y - 320;
      const colors = [0xff5e7e, 0xffeb3b, 0xa8e6cf, 0xb5d7f0, 0xd5b8e8, 0xff8e3c];
      for (let i = 0; i < 6; i++) {
        const piece = this.add.rectangle(
          cx + Phaser.Math.Between(-40, 40),
          cy,
          6, 10,
          Phaser.Math.RND.pick(colors)
        ).setDepth(950);
        piece.setAngle(Math.random() * 360);
        this.tweens.add({
          targets: piece,
          y: cy + Phaser.Math.Between(500, 700),
          x: piece.x + Phaser.Math.Between(-80, 80),
          angle: piece.angle + 540 * (Math.random() > 0.5 ? 1 : -1),
          alpha: { from: 0.9, to: 0 },
          duration: 4000 + Math.random() * 1500,
          ease: 'Cubic.easeIn',
          onComplete: () => piece.destroy()
        });
      }
    }
  }

  buildBeach() {
    this.add.rectangle(WORLD_W / 2, 1500, WORLD_W, 600, 0xf5deb3);
    this.add.rectangle(WORLD_W / 2, 1680, WORLD_W, 240, 0xd4b483, 0.6);
    this.add.rectangle(WORLD_W / 2, 1780, WORLD_W, 80, 0x4a90c8);
    this.add.rectangle(WORLD_W / 2, 1775, WORLD_W, 60, 0x6fa8dc, 0.85);
    this.add.rectangle(WORLD_W / 2, 1772, WORLD_W, 30, 0xa3cef0, 0.55);
    for (let i = 0; i < 30; i++) {
      const x = 40 + i * 80 + Phaser.Math.Between(-15, 15);
      const ripple = this.add.ellipse(x, 1745 + Phaser.Math.Between(-3, 5), 60, 9, 0xffffff, 0.75);
      this.tweens.add({ targets: ripple, scaleX: { from: 0.9, to: 1.2 }, alpha: { from: 0.75, to: 0.4 }, duration: 1600 + Phaser.Math.Between(0, 600), yoyo: true, repeat: -1, delay: i * 80 });
    }
    for (let i = 0; i < 12; i++) {
      const x = Phaser.Math.Between(50, WORLD_W - 50);
      const y = 1260 + Phaser.Math.Between(0, 110);
      this.add.ellipse(x, y, 36, 12, 0x9caf88, 0.55);
    }
    this.makePalmTree(200, 1320);
    this.makePalmTree(450, 1380);
    this.makePalmTree(800, 1300);
    this.makePalmTree(1100, 1360);
    this.makePalmTree(1500, 1310);
    this.makePalmTree(1750, 1370);
    this.makePalmTree(2050, 1320);
    this.makePalmTree(2300, 1380);
    this.add.ellipse(620, 1620, 22, 12, 0xffe0d0).setRotation(0.3);
    this.add.ellipse(1180, 1660, 16, 9, 0xffd0c0).setRotation(-0.5);
    this.add.ellipse(1820, 1640, 18, 10, 0xffe4d0).setRotation(0.2);
    this.add.circle(900, 1700, 5, 0xff7043);
    this.add.circle(900, 1700, 3, 0xff8a65);
    this.add.circle(2200, 1690, 5, 0xff7043);
    this.add.circle(2200, 1690, 3, 0xff8a65);
  }

  buildNorthwestForest() {
    for (let i = 0; i < 10; i++) {
      const x = Phaser.Math.Between(20, 780);
      const y = Phaser.Math.Between(20, 580);
      const r = Phaser.Math.Between(40, 90);
      this.add.ellipse(x, y, r * 2, r, 0x1b5e20, 0.45);
    }
    for (let i = 0; i < 30; i++) {
      const x = Phaser.Math.Between(20, 780);
      const y = Phaser.Math.Between(20, 580);
      const c = Phaser.Math.RND.pick([0xff5e7e, 0xffe066, 0xffffff, 0xff8e3c]);
      this.add.circle(x, y, Phaser.Math.FloatBetween(3, 6), c);
      this.add.circle(x, y, 1.5, 0xffeb3b);
    }
    this.makePineTree(110, 220);
    this.makePineTree(220, 450);
    this.makePineTree(340, 320);
    this.makePineTree(480, 180);
    this.makePineTree(620, 470);
    this.makePineTree(710, 330);
    this.makeRoundTree(280, 100);
    this.makeRoundTree(520, 540);
    this.makeRoundTree(700, 150);
    this.makeRoundTree(150, 540);
    this.makeStump(420, 380);
    this.makeStump(620, 230);
  }

  buildTallTreeArea() {
    this.add.ellipse(1200, 340, 700, 460, 0x4eb05c, 0.35);
    this.add.ellipse(1200, 500, 260, 60, 0x2e7d32, 0.7);
    this.makeTallTree(1200, 500);
    this.add.circle(1060, 520, 9, 0xc62828);
    this.add.circle(1060, 520, 6, 0xffffff, 0.7);
    this.add.ellipse(1060, 528, 7, 9, 0xfff3a8);
    this.add.circle(1350, 530, 8, 0xc62828);
    this.add.circle(1350, 530, 5, 0xffffff, 0.7);
    this.add.ellipse(1350, 537, 6, 8, 0xfff3a8);
    this.add.circle(1260, 540, 7, 0xc62828);
    this.add.circle(1260, 540, 4, 0xffffff, 0.7);
    this.makePineTree(880, 240);
    this.makePineTree(1520, 200);
    this.makeRoundTree(950, 480);
    this.makeRoundTree(1500, 460);
    for (let i = 0; i < 25; i++) {
      const x = Phaser.Math.Between(820, 1580);
      const y = Phaser.Math.Between(40, 580);
      if (Math.abs(x - 1200) < 90 && Math.abs(y - 400) < 200) continue;
      const c = Phaser.Math.RND.pick([0xffe066, 0xffffff, 0xff8e3c, 0xb967ff]);
      this.add.circle(x, y, Phaser.Math.FloatBetween(3, 5), c);
      this.add.circle(x, y, 1.5, 0xffeb3b);
    }
  }

  buildCaveArea() {
    for (let i = 0; i < 12; i++) {
      const x = 1620 + Phaser.Math.Between(0, 760);
      const y = Phaser.Math.Between(20, 580);
      const r = Phaser.Math.Between(30, 60);
      this.add.ellipse(x, y, r * 2, r * 0.7, 0x7a7a7a, 0.35);
    }
    this.add.rectangle(2000, 80, 760, 180, 0x6a6a6a);
    this.add.ellipse(2000, 120, 780, 90, 0x5a5a5a, 0.7);
    this.add.ellipse(1700, 80, 200, 60, 0x8a8a8a, 0.5);
    this.add.ellipse(2300, 80, 200, 60, 0x8a8a8a, 0.5);

    const cx = CAVE_CENTER.x, cy = CAVE_CENTER.y;
    this.add.ellipse(cx, cy, 200, 240, 0x0a0a0a);
    this.add.ellipse(cx, cy + 10, 170, 210, 0x000000);
    this.add.ellipse(cx, cy + 40, 130, 160, 0x000000);
    this.add.ellipse(cx - 60, cy - 80, 30, 18, 0x4a4a4a);
    this.add.ellipse(cx + 60, cy - 80, 30, 18, 0x4a4a4a);

    this.makeBoulder(1820, 400);
    this.makeBoulder(2180, 430);
    this.makeBoulder(2230, 290);
    this.makeBoulder(1790, 290);
    this.add.ellipse(1900, 480, 32, 14, 0x5a5a5a);
    this.add.ellipse(2080, 500, 42, 18, 0x6a6a6a);
    this.add.ellipse(2160, 520, 26, 12, 0x4a4a4a);
    this.add.ellipse(2020, 540, 30, 14, 0x7a7a7a);
  }

  buildRiverBridge() {
    this.add.rectangle(300, 900, 130, 600, 0x2e6da4);
    this.add.rectangle(300, 900, 110, 600, 0x4a90c8);
    this.add.rectangle(300, 900, 90, 600, 0x6fa8dc, 0.85);
    this.add.rectangle(290, 900, 22, 600, 0xa3cef0, 0.5);
    this.add.rectangle(316, 900, 16, 600, 0xa3cef0, 0.4);
    for (let i = 0; i < 12; i++) {
      const ry = 620 + i * 48;
      const ripple = this.add.ellipse(300 + Phaser.Math.Between(-30, 30), ry, 60, 8, 0xffffff, 0.45);
      this.tweens.add({ targets: ripple, scaleX: { from: 0.7, to: 1.1 }, alpha: { from: 0.5, to: 0.15 }, duration: 2400, yoyo: true, repeat: -1, delay: i * 200 });
    }

    this.solids.push({ x: 300, y: 900, w: 130, h: 600 });

    const bx = 300, by = 900;
    this.add.rectangle(bx - 130, by, 50, 36, 0x6a6a6a);
    this.add.rectangle(bx + 130, by, 50, 36, 0x6a6a6a);
    this.add.ellipse(bx - 130, by - 18, 50, 14, 0x8a8a8a);
    this.add.ellipse(bx + 130, by - 18, 50, 14, 0x8a8a8a);
    this.add.rectangle(bx - 90, by, 36, 16, 0x8b5a2b);
    this.add.rectangle(bx - 50, by, 26, 16, 0x6b4423);
    this.add.rectangle(bx + 60, by, 30, 16, 0x8b5a2b);
    this.add.rectangle(bx + 100, by, 28, 16, 0x6b4423);
    this.add.rectangle(bx - 105, by - 22, 4, 36, 0x5d3a1a);
    this.add.rectangle(bx - 50, by - 22, 4, 30, 0x5d3a1a);
    this.add.rectangle(bx + 50, by - 22, 4, 30, 0x5d3a1a);
    this.add.rectangle(bx + 105, by - 22, 4, 36, 0x5d3a1a);
    this.add.rectangle(bx - 105, by - 32, 110, 4, 0x6b4423);
    this.add.rectangle(bx + 105, by - 32, 110, 4, 0x6b4423);

    const glow = this.add.ellipse(bx, by, 240, 60, 0xfff3a8, 0.3);
    this.tweens.add({ targets: glow, alpha: { from: 0.15, to: 0.55 }, scaleX: { from: 0.85, to: 1.1 }, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    this.makePineTree(80, 720);
    this.makeRoundTree(150, 1080);
    this.makePalmTree(580, 720);
    this.makeRoundTree(640, 1080);
    this.makeStump(530, 840);
  }

  buildCenterJungle() {
    const OX = 800, OY = 600;
    for (let i = 0; i < 14; i++) {
      const x = OX + Phaser.Math.Between(20, 780);
      const y = OY + Phaser.Math.Between(20, 580);
      const r = Phaser.Math.Between(30, 80);
      const shade = Phaser.Math.RND.pick([0x3a9c4a, 0x267d3a, 0x4eb05c]);
      this.add.ellipse(x, y, r * 2, r, shade, 0.4);
    }

    this.waterfallCenterX = OX + 700;
    this.waterfallDropResetY = OY + 330;
    this.waterfallDropStartY = OY + 85;

    this.add.rectangle(OX + 700, OY + 70, 100, 18, 0x6b4423);
    this.add.rectangle(OX + 680, OY + 78, 18, 12, 0x4a2c1a);
    this.add.rectangle(OX + 720, OY + 78, 18, 12, 0x4a2c1a);
    this.add.rectangle(OX + 700, OY + 200, 60, 250, 0x6fa8dc);
    this.add.rectangle(OX + 700, OY + 200, 50, 250, 0xa3cef0, 0.7);
    for (let i = 0; i < 8; i++) {
      const drop = this.add.rectangle(
        OX + 700 + Phaser.Math.Between(-22, 22),
        OY + 90 + i * 30,
        Phaser.Math.Between(4, 8),
        Phaser.Math.Between(12, 22),
        0xffffff, 0.85
      );
      this.waterfallDrops.push(drop);
    }
    this.add.ellipse(OX + 700, OY + 350, 150, 55, 0x2e6da4);
    this.add.ellipse(OX + 700, OY + 350, 130, 45, 0x4a90c8);
    this.add.ellipse(OX + 700, OY + 348, 100, 30, 0x6fa8dc, 0.7);
    this.add.ellipse(OX + 685, OY + 345, 20, 6, 0xffffff, 0.6);
    this.add.ellipse(OX + 715, OY + 352, 20, 6, 0xffffff, 0.6);

    this.makePalmTree(OX + 100, OY + 150);
    this.makePalmTree(OX + 250, OY + 500);
    this.makePalmTree(OX + 480, OY + 110);
    this.makeRoundTree(OX + 180, OY + 350);
    this.makeRoundTree(OX + 560, OY + 500);
    this.makeRoundTree(OX + 380, OY + 210);
    this.makePineTree(OX + 50, OY + 400);
    this.makePineTree(OX + 330, OY + 90);
    this.makePineTree(OX + 540, OY + 380);
    this.makeStump(OX + 220, OY + 240);
    this.makeStump(OX + 440, OY + 410);
    this.makeStump(OX + 130, OY + 510);

    const flowerColors = [0xff5e7e, 0xffe066, 0xff8e3c, 0xb967ff, 0xff6b6b, 0xffffff, 0xff4081];
    for (let i = 0; i < 50; i++) {
      const x = OX + Phaser.Math.Between(20, 780);
      const y = OY + Phaser.Math.Between(20, 580);
      if (this.solids.some(s => Math.abs(s.x - x) < 30 && Math.abs(s.y - y) < 30)) continue;
      if (Math.abs(x - (OX + 700)) < 75 && y > OY + 50 && y < OY + 380) continue;
      const c = Phaser.Math.RND.pick(flowerColors);
      const size = Phaser.Math.FloatBetween(4, 8);
      this.add.circle(x, y, size, c);
      this.add.circle(x, y, size * 0.4, 0xffeb3b);
    }
  }

  buildEastTrail() {
    this.add.ellipse(1820, 880, 320, 90, 0xc4a877, 0.45);
    this.add.ellipse(2030, 820, 280, 70, 0xc4a877, 0.4);
    this.add.ellipse(2230, 950, 240, 60, 0xc4a877, 0.4);
    this.add.ellipse(2100, 1080, 200, 50, 0xc4a877, 0.35);
    this.makePalmTree(1720, 720);
    this.makePalmTree(2280, 720);
    this.makeRoundTree(2180, 760);
    this.makePineTree(1700, 1080);
    this.makePineTree(2330, 1050);
    this.makeStump(1900, 1080);
    this.makeStump(2050, 760);
    for (let i = 0; i < 18; i++) {
      const x = Phaser.Math.Between(1620, 2380);
      const y = Phaser.Math.Between(620, 1180);
      const c = Phaser.Math.RND.pick([0xffe066, 0xff8e3c, 0xffffff]);
      this.add.circle(x, y, Phaser.Math.FloatBetween(3, 5), c);
      this.add.circle(x, y, 1.5, 0xffeb3b);
    }
  }

  createSophia(x, y) {
    const c = this.add.container(x, y);
    const skin = 0xffd9a8;
    const blonde = 0xf4d35e;
    const blondeShadow = 0xc9a13d;
    const shirtCol = 0xffeb3b;
    const shirtShade = 0xf9a825;
    const shortsCol = 0x4caf50;
    const shortsShade = 0x2e7d32;

    const shadow = this.add.ellipse(0, 18, 30, 8, 0x000000, 0.3);
    const leftShoe = this.add.ellipse(-5, 18, 8, 5, 0x6b4423);
    const rightShoe = this.add.ellipse(5, 18, 8, 5, 0x6b4423);
    const leftLeg = this.add.rectangle(-5, 14, 6, 8, skin);
    const rightLeg = this.add.rectangle(5, 14, 6, 8, skin);
    const shortsBg = this.add.rectangle(0, 8, 20, 9, shortsCol);
    const shortsHi = this.add.rectangle(0, 11, 20, 2, shortsShade);
    const shirtBg = this.add.rectangle(0, -2, 22, 14, shirtCol);
    const shirtHi = this.add.rectangle(0, 4, 22, 3, shirtShade);
    const collar = this.add.rectangle(0, -9, 8, 3, shirtShade);
    const leftArm = this.add.rectangle(-13, 0, 5, 12, skin);
    const rightArm = this.add.rectangle(13, 0, 5, 12, skin);
    const handL = this.add.circle(-13, 6, 3, skin);
    const handR = this.add.circle(13, 6, 3, skin);
    const hairBack = this.add.circle(0, -13, 13, blonde);
    const hairBackShade = this.add.ellipse(0, -7, 22, 8, blondeShadow);
    const face = this.add.circle(0, -12, 9, skin);
    const bangs1 = this.add.ellipse(-5, -18, 11, 7, blonde);
    const bangs2 = this.add.ellipse(5, -18, 11, 7, blonde);
    const bangs3 = this.add.ellipse(0, -20, 16, 5, blonde);
    const eyeL = this.add.circle(-3, -11, 1.6, 0x2a2a2a);
    const eyeR = this.add.circle(3, -11, 1.6, 0x2a2a2a);
    const eyeLHi = this.add.circle(-2.5, -11.3, 0.6, 0xffffff);
    const eyeRHi = this.add.circle(3.5, -11.3, 0.6, 0xffffff);
    const cheekL = this.add.circle(-6, -8, 1.8, 0xffb3b3, 0.7);
    const cheekR = this.add.circle(6, -8, 1.8, 0xffb3b3, 0.7);
    const smile = this.add.graphics();
    smile.lineStyle(1.5, 0x8b3a3a, 1);
    smile.beginPath();
    smile.arc(0, -9, 3, 0.2, Math.PI - 0.2);
    smile.strokePath();

    c.add([
      shadow, leftShoe, rightShoe, leftLeg, rightLeg,
      shortsBg, shortsHi, shirtBg, shirtHi, collar,
      leftArm, rightArm, handL, handR,
      hairBack, hairBackShade, face,
      bangs1, bangs2, bangs3,
      eyeL, eyeR, eyeLHi, eyeRHi,
      cheekL, cheekR, smile
    ]);
    c.hitW = 22; c.hitH = 30;
    c.setSize(22, 30);
    return c;
  }

  createRat(x, y, colors, sizeFactor, chub) {
    const sf = sizeFactor;
    const bodyW = (22 + chub) * sf;
    const bodyH = (14 + chub * 0.7) * sf;
    const c = this.add.container(x, y);
    const shadow = this.add.ellipse(0, bodyH / 2 + 2, bodyW + 4, 5, 0x000000, 0.3);
    const tail = this.add.graphics();
    tail.lineStyle(2.5 * sf, colors.tail, 1);
    tail.beginPath();
    tail.moveTo(-bodyW / 2 + 2, 0);
    tail.lineTo(-bodyW / 2 - 4 * sf, -4 * sf);
    tail.lineTo(-bodyW / 2 - 9 * sf, 2 * sf);
    tail.lineTo(-bodyW / 2 - 13 * sf, -2 * sf);
    tail.strokePath();
    const f1 = this.add.ellipse(-bodyW / 2 + 4, -bodyH / 2 - 1, 4 * sf, 5 * sf, colors.foot);
    const f2 = this.add.ellipse(-bodyW / 2 + 4, bodyH / 2 + 1, 4 * sf, 5 * sf, colors.foot);
    const f3 = this.add.ellipse(bodyW / 2 - 4, -bodyH / 2 - 1, 4 * sf, 5 * sf, colors.foot);
    const f4 = this.add.ellipse(bodyW / 2 - 4, bodyH / 2 + 1, 4 * sf, 5 * sf, colors.foot);
    const body = this.add.ellipse(0, 0, bodyW, bodyH, colors.body);
    const bodyShade = this.add.ellipse(0, bodyH / 4, bodyW * 0.8, bodyH * 0.3, colors.bodyShadow);
    const headX = bodyW / 2 - 2 * sf;
    const head = this.add.circle(headX, 0, 8 * sf, colors.body);
    const headShade = this.add.ellipse(headX, 3 * sf, 12 * sf, 3 * sf, colors.bodyShadow);
    const earL = this.add.circle(headX + 2 * sf, -5 * sf, 3.6 * sf, colors.body);
    const earR = this.add.circle(headX + 2 * sf, 5 * sf, 3.6 * sf, colors.body);
    const earLInner = this.add.circle(headX + 2 * sf, -5 * sf, 2 * sf, colors.ear);
    const earRInner = this.add.circle(headX + 2 * sf, 5 * sf, 2 * sf, colors.ear);
    const eyeL = this.add.circle(headX + 2 * sf, -2.4 * sf, 1.7 * sf, colors.eye);
    const eyeR = this.add.circle(headX + 2 * sf, 2.4 * sf, 1.7 * sf, colors.eye);
    const eyeLHi = this.add.circle(headX + 2.4 * sf, -2.7 * sf, 0.7 * sf, 0xffffff);
    const eyeRHi = this.add.circle(headX + 2.4 * sf, 2.1 * sf, 0.7 * sf, 0xffffff);
    const nose = this.add.circle(headX + 7 * sf, 0, 1.9 * sf, colors.nose);
    const whiskers = this.add.graphics();
    whiskers.lineStyle(0.6, 0x888888, 0.8);
    whiskers.beginPath();
    whiskers.moveTo(headX + 5 * sf, -1 * sf);
    whiskers.lineTo(headX + 13 * sf, -3 * sf);
    whiskers.moveTo(headX + 5 * sf, 0);
    whiskers.lineTo(headX + 14 * sf, 0);
    whiskers.moveTo(headX + 5 * sf, 1 * sf);
    whiskers.lineTo(headX + 13 * sf, 3 * sf);
    whiskers.strokePath();

    c.add([
      shadow, tail, f1, f2, f3, f4,
      body, bodyShade, head, headShade,
      earL, earR, earLInner, earRInner,
      eyeL, eyeR, eyeLHi, eyeRHi, nose, whiskers
    ]);
    c.hitW = bodyW + 4; c.hitH = bodyH + 4;
    c.setSize(bodyW + 4, bodyH + 4);
    return c;
  }

  makeNameLabel(name) {
    return this.add.text(0, 0, name, {
      fontFamily: 'Comic Sans MS, Chalkboard SE, system-ui, sans-serif',
      fontSize: '16px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
      fontStyle: 'bold'
    }).setOrigin(0.5, 1).setAlpha(0);
  }

  makeCounterUI() {
    this.add.rectangle(140, 32, 264, 52, 0x000000, 0.6)
      .setStrokeStyle(3, 0xffeb3b, 0.9)
      .setOrigin(0.5, 0.5)
      .setScrollFactor(0)
      .setDepth(1000);
    const iconG = this.add.graphics().setScrollFactor(0).setDepth(1000);
    iconG.x = 30; iconG.y = 32;
    this.drawBananaShape(iconG, 0.95);
    const count = this.registry.get('bananaCount');
    this.bananaText = this.add.text(54, 32, '× ' + count, {
      fontFamily: 'Comic Sans MS, Chalkboard SE, system-ui, sans-serif',
      fontSize: '26px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
      fontStyle: 'bold'
    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(1000);
    this.bananaWordText = this.add.text(0, 34, '(' + numberWord(count) + ')', {
      fontFamily: 'Comic Sans MS, Chalkboard SE, system-ui, sans-serif',
      fontSize: '15px',
      color: '#ffe082',
      stroke: '#000000',
      strokeThickness: 3,
      fontStyle: 'italic'
    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(1000);
    this.bananaWordText.x = this.bananaText.x + this.bananaText.width + 6;
  }

  drawBananaShape(g, scale) {
    const s = scale || 1;
    const seg = 8;
    const quad = (x0, y0, cx, cy, x1, y1) => {
      for (let i = 1; i <= seg; i++) {
        const t = i / seg;
        const x = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * x1;
        const y = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * cy + t * t * y1;
        g.lineTo(x, y);
      }
    };
    g.fillStyle(0xffd54f);
    g.beginPath();
    g.moveTo(-13 * s, 0);
    quad(-13 * s, 0, 0, -11 * s, 13 * s, 0);
    quad(13 * s, 0, 10 * s, 5 * s, 0, 7 * s);
    quad(0, 7 * s, -10 * s, 5 * s, -13 * s, 0);
    g.closePath();
    g.fillPath();
    g.fillStyle(0xfff176, 0.6);
    g.beginPath();
    g.moveTo(-10 * s, -1 * s);
    quad(-10 * s, -1 * s, 0, -7 * s, 10 * s, -1 * s);
    g.lineTo(9 * s, 0);
    quad(9 * s, 0, 0, -5 * s, -9 * s, 0);
    g.closePath();
    g.fillPath();
    g.fillStyle(0x4a2c1a);
    g.fillCircle(-13 * s, 0, 2 * s);
    g.fillCircle(13 * s, 0, 2 * s);
  }

  makeBanana(x, y, id) {
    const c = this.add.container(x, y);
    const shadow = this.add.ellipse(0, 8, 22, 5, 0x000000, 0.3);
    const g = this.add.graphics();
    this.drawBananaShape(g, 1);
    c.add([shadow, g]);
    c.bobOffset = Phaser.Math.FloatBetween(0, Math.PI * 2);
    c.baseY = y;
    c.id = id;
    return c;
  }

  makePeekMarker(spot) {
    const outerRing = this.add.circle(spot.x, spot.y, 26, 0xffeb3b, 0).setStrokeStyle(3, 0xffeb3b, 0.9);
    const ring = this.add.circle(spot.x, spot.y, 20, 0xffffaa, 0).setStrokeStyle(2, 0xffffff, 0.9);
    const dot = this.add.circle(spot.x, spot.y, 9, 0xffffaa, 1);
    const highlight = this.add.circle(spot.x - 2, spot.y - 2, 3, 0xffffff, 0.95);
    this.tweens.add({ targets: dot, scale: { from: 0.85, to: 1.25 }, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: highlight, alpha: { from: 0.4, to: 1 }, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: ring, scale: { from: 0.6, to: 1.8 }, alpha: { from: 0.95, to: 0 }, duration: 1500, repeat: -1, ease: 'Cubic.easeOut' });
    this.tweens.add({ targets: outerRing, scale: { from: 0.5, to: 2.2 }, alpha: { from: 0.85, to: 0 }, duration: 1800, delay: 500, repeat: -1, ease: 'Cubic.easeOut' });
    dot.setInteractive(new Phaser.Geom.Circle(0, 0, 30), Phaser.Geom.Circle.Contains);
    dot.on('pointerdown', () => this.enterPeek(spot.id, spot.x, spot.y));
    this.peekMarkers.push({ id: spot.id, x: spot.x, y: spot.y, dot });
  }

  makePalmTree(x, y) {
    this.add.ellipse(x, y + 4, 28, 8, 0x000000, 0.25);
    this.add.rectangle(x, y, 14, 70, 0x8b5a2b).setOrigin(0.5, 1);
    this.add.rectangle(x - 2, y - 35, 3, 60, 0x6b4423);
    this.add.ellipse(x - 22, y - 65, 52, 18, 0x2e7d32);
    this.add.ellipse(x + 22, y - 65, 52, 18, 0x388e3c);
    this.add.ellipse(x, y - 80, 22, 50, 0x2e7d32);
    this.add.ellipse(x - 30, y - 75, 32, 14, 0x4caf50).setRotation(0.5);
    this.add.ellipse(x + 30, y - 75, 32, 14, 0x4caf50).setRotation(-0.5);
    this.add.circle(x - 4, y - 60, 4, 0x4a2c1a);
    this.add.circle(x + 4, y - 62, 4, 0x4a2c1a);
    this.solids.push({ x, y: y - 5, w: 16, h: 14 });
  }

  makeRoundTree(x, y) {
    this.add.ellipse(x, y + 4, 36, 10, 0x000000, 0.25);
    this.add.rectangle(x, y, 18, 42, 0x6b4423).setOrigin(0.5, 1);
    this.add.circle(x, y - 58, 40, 0x1b5e20);
    this.add.circle(x - 18, y - 50, 24, 0x2e7d32);
    this.add.circle(x + 18, y - 52, 24, 0x388e3c);
    this.add.circle(x - 4, y - 74, 22, 0x4caf50);
    this.add.circle(x + 12, y - 38, 18, 0x66bb6a);
    this.solids.push({ x, y: y - 8, w: 22, h: 18 });
  }

  makePineTree(x, y) {
    this.add.ellipse(x, y + 4, 24, 8, 0x000000, 0.25);
    this.add.rectangle(x, y, 10, 26, 0x5d4037).setOrigin(0.5, 1);
    this.add.triangle(x, y - 26, 0, 0, 32, 0, 16, -38, 0x1b5e20);
    this.add.triangle(x, y - 48, 0, 0, 26, 0, 13, -30, 0x2e7d32);
    this.add.triangle(x, y - 64, 0, 0, 20, 0, 10, -24, 0x4caf50);
    this.solids.push({ x, y: y - 6, w: 12, h: 12 });
  }

  makeStump(x, y) {
    this.add.ellipse(x, y + 6, 32, 10, 0x000000, 0.25);
    this.add.ellipse(x, y + 4, 32, 16, 0x4a2c1a);
    this.add.ellipse(x, y, 32, 16, 0x8b5a2b);
    this.add.ellipse(x, y - 1, 22, 10, 0xa67248);
    this.add.ellipse(x, y - 1, 14, 6, 0x8b5a2b);
    this.add.ellipse(x, y - 1, 6, 3, 0x6b4423);
    this.solids.push({ x, y, w: 30, h: 14 });
  }

  makeTallTree(x, y) {
    this.add.ellipse(x, y + 10, 80, 18, 0x000000, 0.3);
    this.add.ellipse(x, y + 4, 60, 18, 0x4a2c1a);
    this.add.rectangle(x, y, 36, 220, 0x8b5a2b).setOrigin(0.5, 1);
    this.add.rectangle(x - 7, y - 110, 8, 200, 0x6b4423);
    this.add.rectangle(x + 9, y - 110, 4, 200, 0xa67248, 0.6);
    this.add.ellipse(x + 8, y - 40, 14, 22, 0x2a1810);
    this.add.ellipse(x + 8, y - 40, 10, 16, 0x000000);
    this.add.ellipse(x + 8.5, y - 38, 5, 8, 0x1a0805);
    this.add.circle(x, y - 240, 78, 0x1b5e20);
    this.add.circle(x - 50, y - 220, 52, 0x2e7d32);
    this.add.circle(x + 50, y - 230, 52, 0x388e3c);
    this.add.circle(x - 20, y - 280, 48, 0x4caf50);
    this.add.circle(x + 25, y - 270, 46, 0x66bb6a);
    this.add.circle(x, y - 320, 38, 0x4caf50);
    this.add.circle(x - 30, y - 180, 6, 0xe53935);
    this.add.circle(x + 28, y - 195, 6, 0xe53935);
    this.add.circle(x - 8, y - 240, 5, 0xe53935);
    this.add.circle(x + 45, y - 220, 5, 0xe53935);
    this.add.circle(x - 50, y - 250, 5, 0xe53935);
    this.add.circle(x + 10, y - 290, 5, 0xe53935);
    this.solids.push({ x, y: y - 6, w: 30, h: 18 });
  }

  makeBoulder(x, y) {
    this.add.ellipse(x, y + 8, 70, 14, 0x000000, 0.3);
    this.add.circle(x, y, 30, 0x6a6a6a);
    this.add.circle(x - 10, y - 8, 22, 0x7a7a7a);
    this.add.circle(x + 8, y - 6, 18, 0x8a8a8a);
    this.add.circle(x - 6, y + 5, 14, 0x5a5a5a);
    this.solids.push({ x, y, w: 56, h: 50 });
  }

  update(time, delta) {
    if (this.exiting) return;
    const step = SOPHIA_SPEED * (delta / 1000);
    let dx = 0, dy = 0;
    const quizOpen = this.activeQuiz && this.activeQuiz.isOpen;
    const modalActive = quizOpen || this.placeholderOpen || this.parentModeOpen;
    if (!modalActive) {
      if (this.cursors.left.isDown)  dx -= step;
      if (this.cursors.right.isDown) dx += step;
      if (this.cursors.up.isDown)    dy -= step;
      if (this.cursors.down.isDown)  dy += step;
    }

    const oldX = this.sophia.x, oldY = this.sophia.y;
    this.tryMove(this.sophia, dx, dy);
    this.sophia.x = Phaser.Math.Clamp(this.sophia.x, 16, WORLD_W - 16);
    this.sophia.y = Phaser.Math.Clamp(this.sophia.y, 16, WORLD_H - 16);
    const sophiaMoving = (Math.abs(this.sophia.x - oldX) > 0.1) || (Math.abs(this.sophia.y - oldY) > 0.1);
    this.sophia.scaleY = sophiaMoving ? 1 + Math.sin(time / 90) * 0.06 : 1;

    this.followBehind(this.snowy, this.sophia, time, 0, 'snowy');
    this.followBehind(this.midnight, this.snowy, time, 1, 'midnight');

    if (this.snowyMoving && Math.random() < 0.002) playSqueak('high');
    if (this.midnightMoving && Math.random() < 0.002) playSqueak('low');

    this.updateNameLabel(this.snowyLabel, this.snowy);
    this.updateNameLabel(this.midnightLabel, this.midnight);

    for (const drop of this.waterfallDrops) {
      drop.y += 4;
      if (drop.y > this.waterfallDropResetY) {
        drop.y = this.waterfallDropStartY;
        drop.x = this.waterfallCenterX + Phaser.Math.Between(-22, 22);
      }
    }

    let nearest = null, nearestDist = Infinity;
    for (const m of this.peekMarkers) {
      const d = Phaser.Math.Distance.Between(this.sophia.x, this.sophia.y, m.x, m.y);
      if (d < 55 && d < nearestDist) { nearest = m; nearestDist = d; }
      m.dot.setFillStyle(0xffffaa, 1);
    }
    if (nearest) nearest.dot.setFillStyle(0xffffff, 1);

    if (nearest && Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.enterPeek(nearest.id, nearest.x, nearest.y);
    }

    this.updateStopMarkers(time);
    this.updateBreadcrumb(time);
    if (!modalActive) {
      this.handleStopProximityInput();
    }
    if (this.partyMode) {
      this.updatePartyModeConfetti(time);
    }

    for (let i = this.bananas.length - 1; i >= 0; i--) {
      const b = this.bananas[i];
      b.y = b.baseY + Math.sin(time / 400 + b.bobOffset) * 3;
      const d = Phaser.Math.Distance.Between(this.sophia.x, this.sophia.y, b.x, b.y);
      if (d < 24) {
        this.collectBanana(b);
        this.bananas.splice(i, 1);
      }
    }

    const cd = Phaser.Math.Distance.Between(this.sophia.x, this.sophia.y, CAVE_CENTER.x, CAVE_CENTER.y);
    const darkness = Phaser.Math.Clamp(1 - cd / CAVE_DIM_RADIUS, 0, 1);
    this.caveDim.alpha = darkness * 0.7;
    this.caveLight.alpha = darkness * 0.45;
    this.caveLightCore.alpha = darkness * 0.4;
    const lx = this.sophia.x - this.cameras.main.scrollX;
    const ly = this.sophia.y - this.cameras.main.scrollY;
    this.caveLight.x = lx; this.caveLight.y = ly;
    this.caveLightCore.x = lx; this.caveLightCore.y = ly;

    for (const lbl of this.sceneryLabels) {
      const ddx = lbl.x - this.sophia.x;
      const ddy = lbl.y - this.sophia.y;
      const ld = Math.hypot(ddx, ddy);
      const target = ld < 70 ? 1 : 0;
      lbl.text.alpha += (target - lbl.text.alpha) * 0.15;
    }

    if (!this.chatterActive && time - this.lastChatterTime > this.nextChatterDelay) {
      const candidates = [];
      if (this.snowyMoving) candidates.push({ rat: this.snowy, phrases: SNOWY_PHRASES });
      if (this.midnightMoving) candidates.push({ rat: this.midnight, phrases: MIDNIGHT_PHRASES });
      if (candidates.length > 0) {
        const c = Phaser.Math.RND.pick(candidates);
        this.showChatter(c.rat, Phaser.Math.RND.pick(c.phrases));
        this.lastChatterTime = time;
        this.nextChatterDelay = 20000 + Math.random() * 20000;
      }
    }
    if (this.activeBubble) {
      this.activeBubble.container.x = this.activeBubble.rat.x;
      this.activeBubble.container.y = this.activeBubble.rat.y - 55;
    }
  }

  followBehind(follower, leader, time, offset, label) {
    const dx = leader.x - follower.x;
    const dy = leader.y - follower.y;
    const dist = Math.hypot(dx, dy);
    const moving = dist > RAT_GAP;

    if (dist > 500) {
      follower.x = leader.x - 40 + Phaser.Math.Between(-15, 15);
      follower.y = leader.y - 30 + Phaser.Math.Between(-10, 10);
    } else if (moving) {
      let lerp = RAT_LERP;
      if (dist > 200) lerp = Math.min(0.25, RAT_LERP + (dist - 200) / 1200);
      follower.x += dx * lerp;
      follower.y += dy * lerp;
      if (dx > 0.3) follower.scaleX = 1;
      else if (dx < -0.3) follower.scaleX = -1;
      follower.scaleY = 1 + Math.sin(time / 80 + offset * 1.7) * 0.08;
    } else {
      follower.scaleY = 1;
    }
    if (label === 'snowy') this.snowyMoving = moving;
    if (label === 'midnight') this.midnightMoving = moving;
  }

  updateNameLabel(label, rat) {
    label.x = rat.x;
    label.y = rat.y - 16;
    const d = Phaser.Math.Distance.Between(this.sophia.x, this.sophia.y, rat.x, rat.y);
    const target = d < 80 ? 1 : 0;
    label.alpha += (target - label.alpha) * 0.15;
  }

  saveProgress() {
    const save = SaveManager.load();
    save.bananaCount = this.registry.get('bananaCount');
    save.bananasCollected = this.registry.get('collectedBananas').slice();
    SaveManager.save(save);
  }

  markPuzzleSolved(name) {
    const save = SaveManager.load();
    if (save.puzzlesSolved.hasOwnProperty(name)) {
      save.puzzlesSolved[name] = true;
      SaveManager.save(save);
    }
  }

  collectBanana(b) {
    playPickup();
    const collected = this.registry.get('collectedBananas');
    collected.push(b.id);
    this.registry.set('collectedBananas', collected);
    const count = this.registry.get('bananaCount') + 1;
    this.registry.set('bananaCount', count);
    this.saveProgress();
    this.bananaText.setText('× ' + count);
    this.bananaWordText.setText('(' + numberWord(count) + ')');
    this.bananaWordText.x = this.bananaText.x + this.bananaText.width + 6;

    this.tweens.add({
      targets: this.bananaText,
      scale: { from: 1.5, to: 1 },
      duration: 260,
      ease: 'Back.easeOut'
    });
    this.tweens.add({
      targets: this.bananaWordText,
      scale: { from: 1.4, to: 1 },
      duration: 260,
      ease: 'Back.easeOut'
    });
    this.tweens.add({
      targets: b,
      scale: 1.7,
      alpha: 0,
      y: b.y - 24,
      duration: 280,
      ease: 'Cubic.easeOut',
      onComplete: () => b.destroy()
    });
  }

  showChatter(rat, text) {
    this.chatterActive = true;
    const c = this.add.container(rat.x, rat.y - 55);
    c.setDepth(900);

    const t = this.add.text(0, 0, text, {
      fontFamily: 'Comic Sans MS, Chalkboard SE, system-ui, sans-serif',
      fontSize: '14px',
      color: '#2a2a2a',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5);

    const padX = 8, padY = 4;
    const bg = this.add.rectangle(0, 0, t.width + padX * 2, t.height + padY * 2, 0xffffff, 0.95)
      .setStrokeStyle(2, 0x333333);

    const ty = t.height / 2 + padY;
    const tail = this.add.graphics();
    tail.fillStyle(0xffffff, 0.95);
    tail.fillTriangle(-6, ty, 6, ty, 0, ty + 9);
    tail.lineStyle(2, 0x333333);
    tail.beginPath();
    tail.moveTo(-6, ty);
    tail.lineTo(0, ty + 9);
    tail.lineTo(6, ty);
    tail.strokePath();

    c.add([bg, tail, t]);
    c.alpha = 0;
    c.setScale(0.7);

    this.tweens.add({
      targets: c,
      alpha: 1,
      scale: 1,
      duration: 220,
      ease: 'Back.easeOut'
    });

    this.activeBubble = { container: c, rat };

    this.time.delayedCall(3000, () => {
      if (!c.active) return;
      this.tweens.add({
        targets: c,
        alpha: 0,
        scale: 0.8,
        duration: 350,
        onComplete: () => {
          c.destroy();
          this.activeBubble = null;
          this.chatterActive = false;
        }
      });
    });
  }

  makeComingSoonSign(x, y) {
    this.add.ellipse(x, y + 40, 22, 7, 0x000000, 0.3);
    this.add.rectangle(x, y + 18, 6, 44, 0x6b4423);
    this.add.rectangle(x, y, 110, 34, 0x8b5a2b);
    this.add.rectangle(x, y - 1, 106, 4, 0xa67248);
    this.add.rectangle(x, y, 110, 34, 0x4a2c1a, 0).setStrokeStyle(2, 0x4a2c1a);
    this.add.text(x, y, 'coming soon!', {
      fontFamily: 'Comic Sans MS, Chalkboard SE, system-ui, sans-serif',
      fontSize: '13px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
      fontStyle: 'italic'
    }).setOrigin(0.5, 0.5);
  }

  buildStopMarkers() {
    for (const spec of STOP_MARKERS) {
      this.stopMarkers.push(this.makeStopMarker(spec));
    }
  }

  isStopUnlocked(stopSpec) {
    if (!stopSpec.prereq) return true;
    const save = SaveManager.load();
    const prereqSpec = STOP_MARKERS.find(s => s.id === stopSpec.prereq);
    if (!prereqSpec) return true;
    return save.puzzlesSolved[prereqSpec.puzzleKey] === true;
  }

  makeStopMarker(spec) {
    const save = SaveManager.load();
    const completed = save.puzzlesSolved[spec.puzzleKey] === true;
    const unlocked = this.isStopUnlocked(spec);
    const c = this.add.container(spec.x, spec.y);
    c.setDepth(60);

    const groundShadow = this.add.ellipse(0, 16, 50, 10, 0x000000, 0.35);

    const outerGlow = this.add.circle(0, 0, 38, 0xffeb3b, 0.0);
    const midGlow = this.add.circle(0, 0, 30, 0xffeb3b, 0.0);

    const padBase = this.add.ellipse(0, 4, 50, 14, 0x4a2c1a);
    const padTop = this.add.circle(0, 0, 22, unlocked ? 0xfff3a8 : 0x9a9a9a);
    const padRim = this.add.circle(0, 0, 22, 0x000000, 0).setStrokeStyle(2, unlocked ? 0xc9a13d : 0x666666);

    const silhouetteColor = unlocked ? spec.color : 0x666666;
    const silhouetteParts = this.makeAnimalSilhouette(spec.animal, silhouetteColor);

    const lockedRing = this.add.circle(0, -2, 12, 0x222222, unlocked ? 0 : 0.6);
    const lockedQuestion = this.add.text(0, -2, '?', {
      fontFamily: 'DM Sans, Comic Sans MS, system-ui, sans-serif',
      fontSize: '18px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5).setAlpha(unlocked ? 0 : 0.95);

    const sparkle = unlocked
      ? this.add.star(0, -28, 5, 2, 4, 0xffffff).setAlpha(0.85)
      : null;

    const completedRingBg = this.add.circle(18, -16, 11, 0x4caf50, completed ? 1 : 0).setStrokeStyle(2, 0x1b5e20, completed ? 1 : 0);
    const completedCheck = this.add.text(18, -16, '✓', {
      fontFamily: 'DM Sans, system-ui, sans-serif',
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5).setAlpha(completed ? 1 : 0);

    const elements = [groundShadow, outerGlow, midGlow, padBase, padTop, padRim, ...silhouetteParts, lockedRing, lockedQuestion, completedRingBg, completedCheck];
    if (sparkle) elements.push(sparkle);
    c.add(elements);

    if (unlocked) {
      this.tweens.add({
        targets: outerGlow,
        scale: { from: 0.85, to: 1.25 },
        alpha: { from: 0.35, to: 0.0 },
        duration: 1500,
        yoyo: true,
        repeat: -1
      });
      this.tweens.add({
        targets: midGlow,
        alpha: { from: 0.5, to: 0.15 },
        duration: 900,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    padTop.setInteractive(new Phaser.Geom.Circle(0, 0, 26), Phaser.Geom.Circle.Contains);
    padTop.on('pointerdown', () => {
      if (this.placeholderOpen || (this.activeQuiz && this.activeQuiz.isOpen)) return;
      this.routeStopEntry(spec);
    });

    return {
      spec,
      container: c,
      outerGlow,
      midGlow,
      padTop,
      sparkle,
      sparkleOffset: Math.random() * Math.PI * 2,
      unlocked,
      nearPulseScale: 1
    };
  }

  makeAnimalSilhouette(animal, color) {
    switch (animal) {
      case 'rat':    return this.makeRatSilhouette(color);
      case 'crab':   return this.makeCrabSilhouette(color);
      case 'snake':  return this.makeSnakeSilhouette(color);
      case 'bat':    return this.makeBatSilhouette(color);
      case 'parrot': return this.makeParrotSilhouette(color);
      default: return [];
    }
  }

  makeRatSilhouette(color) {
    return [
      this.add.ellipse(-2, -1, 18, 11, color),
      this.add.circle(6, -1, 5, color),
      this.add.circle(8, -4, 2, color),
      this.add.circle(8, 2, 2, color),
      this.add.circle(10, -1, 1.2, 0xffffff)
    ];
  }

  makeCrabSilhouette(color) {
    return [
      this.add.ellipse(0, 0, 18, 11, color),
      this.add.circle(-10, -2, 4, color),
      this.add.circle(10, -2, 4, color),
      this.add.rectangle(-12, -2, 2, 5, color),
      this.add.rectangle(12, -2, 2, 5, color),
      this.add.rectangle(-5, 6, 2, 4, color),
      this.add.rectangle(0, 6, 2, 4, color),
      this.add.rectangle(5, 6, 2, 4, color),
      this.add.circle(-3, -2, 1, 0xffffff),
      this.add.circle(3, -2, 1, 0xffffff)
    ];
  }

  makeSnakeSilhouette(color) {
    return [
      this.add.circle(-8, -4, 4, color),
      this.add.circle(-3, -2, 4, color),
      this.add.circle(2, 1, 4, color),
      this.add.circle(7, -1, 4, color),
      this.add.circle(11, -3, 4.5, color),
      this.add.circle(12, -4, 1, 0xffffff),
      this.add.rectangle(14, -1, 3, 1, 0xe53935)
    ];
  }

  makeBatSilhouette(color) {
    return [
      this.add.ellipse(0, 0, 7, 11, color),
      this.add.triangle(-9, -1, 0, -4, 9, -2, 0, 4, color),
      this.add.triangle(9, -1, 0, -4, -9, -2, 0, 4, color),
      this.add.circle(0, -7, 4, color),
      this.add.circle(-1.5, -7, 1, 0xff0000),
      this.add.circle(1.5, -7, 1, 0xff0000)
    ];
  }

  makeParrotSilhouette(color) {
    return [
      this.add.ellipse(-2, 2, 11, 14, color),
      this.add.circle(3, -4, 5, color),
      this.add.triangle(8, -3, 0, -2, 0, 3, 6, 0, 0xffa726),
      this.add.ellipse(-1, -8, 3, 6, color),
      this.add.ellipse(-9, 4, 8, 5, color),
      this.add.circle(4, -5, 1.2, 0xffffff)
    ];
  }

  updateStopMarkers(time) {
    for (const m of this.stopMarkers) {
      if (m.sparkle) {
        const a = time / 700 + m.sparkleOffset;
        m.sparkle.x = Math.cos(a) * 26;
        m.sparkle.y = -8 + Math.sin(a) * 14;
        m.sparkle.angle = a * 60;
      }
    }
  }

  updateBreadcrumb(time) {
    this.breadcrumbGraphics.clear();
    const target = this.findNextStop();
    if (!target) return;
    const x1 = this.sophia.x, y1 = this.sophia.y;
    const x2 = target.spec.x, y2 = target.spec.y;
    const dist = Math.hypot(x2 - x1, y2 - y1);
    if (dist < 90) return;

    const highlighted = time < this.pathHighlightUntil;
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const startOffset = 40, endOffset = 40;
    const usable = dist - startOffset - endOffset;
    if (usable <= 0) return;
    const spacing = 22;
    const dotCount = Math.floor(usable / spacing);
    const baseAlpha = highlighted ? 0.9 : 0.3;
    const baseRadius = highlighted ? 5 : 3;
    const color = highlighted ? 0xffeb3b : 0xfff176;
    for (let i = 0; i <= dotCount; i++) {
      const t = startOffset + i * spacing;
      const px = x1 + Math.cos(angle) * t;
      const py = y1 + Math.sin(angle) * t;
      const flow = (time / 250 - i * 0.4) % (Math.PI * 2);
      const a = baseAlpha * (0.55 + 0.45 * Math.max(0, Math.sin(flow)));
      this.breadcrumbGraphics.fillStyle(color, a);
      this.breadcrumbGraphics.fillCircle(px, py, baseRadius);
    }
  }

  findNextStop() {
    const save = SaveManager.load();
    for (const m of this.stopMarkers) {
      if (!this.isStopUnlocked(m.spec)) continue;
      if (save.puzzlesSolved[m.spec.puzzleKey]) continue;
      return m;
    }
    return null;
  }

  handleStopProximityInput() {
    let nearest = null;
    let nearestDist = Infinity;
    for (const m of this.stopMarkers) {
      const d = Math.hypot(m.spec.x - this.sophia.x, m.spec.y - this.sophia.y);
      if (d < 60 && d < nearestDist) { nearest = m; nearestDist = d; }
      const targetScale = (d < 60) ? 1.18 : 1.0;
      m.container.scale += (targetScale - m.container.scale) * 0.12;
    }
    if (nearest && Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.routeStopEntry(nearest.spec);
    }
  }

  routeStopEntry(spec) {
    if (!this.isStopUnlocked(spec)) {
      this.showLockedToast(spec);
      return;
    }
    const cfg = STOP_CONFIGS[spec.id];
    if (cfg && cfg.built) {
      this.enterStop(spec);
    } else {
      this.showStopPlaceholder(spec);
    }
  }

  enterStop(spec) {
    if (this.exiting) return;
    this.exiting = true;
    this.cameras.main.fadeOut(450, 255, 255, 255);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('Stop', {
        stopId: spec.id,
        returnTo: { x: spec.x, y: spec.y + 70 }
      });
    });
  }

  markStopUnlocked(stopId) {
    const m = this.stopMarkers.find(x => x.spec.id === stopId);
    if (!m) return;
    m.unlocked = true;
    this.pathHighlightUntil = this.scene.systems.game.getTime() + 3000;
  }

  showStopPlaceholder(spec) {
    if (this.placeholderOpen) return;
    this.placeholderOpen = true;
    const cam = this.cameras.main;
    const cw = cam.width, ch = cam.height;
    const cx = cw / 2, cy = ch / 2;

    const overlay = this.add.rectangle(cx, cy, cw, ch, 0x000000, 0.55)
      .setScrollFactor(0).setDepth(2000).setInteractive();
    const shadow = this.add.rectangle(cx + 6, cy + 8, 560, 300, 0x000000, 0.3)
      .setScrollFactor(0).setDepth(2001);
    const card = this.add.rectangle(cx, cy, 560, 300, 0xfffaf0)
      .setStrokeStyle(4, 0x4a2c1a)
      .setScrollFactor(0).setDepth(2001);

    const titleY = cy - 105;
    const title = this.add.text(cx, titleY, spec.displayName + "'s stop", {
      fontFamily: 'DM Sans, Comic Sans MS, system-ui, sans-serif',
      fontSize: '20px',
      color: '#6b4423',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(2002);

    const text = this.add.text(cx, cy - 25, spec.placeholder, {
      fontFamily: 'DM Sans, Comic Sans MS, system-ui, sans-serif',
      fontSize: '22px',
      color: '#2a2a2a',
      fontStyle: 'bold',
      align: 'center',
      wordWrap: { width: 480 }
    }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(2002);

    const hint = this.add.text(cx, cy + 110, 'Tap anywhere to close', {
      fontFamily: 'DM Sans, Comic Sans MS, system-ui, sans-serif',
      fontSize: '13px',
      color: '#8b6f3a',
      fontStyle: 'italic'
    }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(2002);

    const animationParts = this.makeStopPlaceholderAnimation(spec.animal, cx, cy + 60);

    const elements = [overlay, shadow, card, title, text, hint, ...animationParts];

    let dismissed = false;
    const keyHandler = (e) => {
      if (dismissed) return;
      e.preventDefault();
      dismiss();
    };
    const dismiss = () => {
      if (dismissed) return;
      dismissed = true;
      window.removeEventListener('keydown', keyHandler);
      elements.forEach(el => { if (el && el.destroy) el.destroy(); });
      this.placeholderOpen = false;
    };
    overlay.on('pointerdown', dismiss);
    card.setInteractive().on('pointerdown', dismiss);
    window.addEventListener('keydown', keyHandler);
  }

  showLockedToast(spec) {
    if (this.placeholderOpen) return;
    this.placeholderOpen = true;
    const cam = this.cameras.main;
    const cw = cam.width, ch = cam.height;
    const cx = cw / 2, cy = ch / 2;

    const prereqSpec = STOP_MARKERS.find(s => s.id === spec.prereq);
    const prereqName = prereqSpec ? prereqSpec.displayName : 'the first animal';
    const msg = 'Not yet! Help ' + prereqName + ' first.';

    const overlay = this.add.rectangle(cx, cy, cw, ch, 0x000000, 0.4)
      .setScrollFactor(0).setDepth(2000).setInteractive();
    const card = this.add.rectangle(cx, cy, 480, 140, 0xfffaf0)
      .setStrokeStyle(4, 0x4a2c1a)
      .setScrollFactor(0).setDepth(2001);
    const text = this.add.text(cx, cy - 10, msg, {
      fontFamily: 'DM Sans, Comic Sans MS, system-ui, sans-serif',
      fontSize: '22px',
      color: '#4a2c1a',
      fontStyle: 'bold',
      align: 'center',
      wordWrap: { width: 440 }
    }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(2002);
    const hint = this.add.text(cx, cy + 40, 'Tap to close', {
      fontFamily: 'DM Sans, Comic Sans MS, system-ui, sans-serif',
      fontSize: '13px',
      color: '#8b6f3a',
      fontStyle: 'italic'
    }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(2002);

    const elements = [overlay, card, text, hint];
    let dismissed = false;
    const keyHandler = (e) => { if (dismissed) return; e.preventDefault(); dismiss(); };
    const dismiss = () => {
      if (dismissed) return;
      dismissed = true;
      window.removeEventListener('keydown', keyHandler);
      elements.forEach(el => { if (el && el.destroy) el.destroy(); });
      this.placeholderOpen = false;
    };
    overlay.on('pointerdown', dismiss);
    card.setInteractive().on('pointerdown', dismiss);
    window.addEventListener('keydown', keyHandler);
  }

  makeStopPlaceholderAnimation(animal, cx, cy) {
    const parts = [];
    if (animal === 'rat') {
      for (let i = 0; i < 5; i++) {
        const leaf = this.add.ellipse(cx - 200 + i * 40, cy, 10, 5, 0x66bb6a).setScrollFactor(0).setDepth(2003);
        leaf.angle = Phaser.Math.Between(-30, 30);
        this.tweens.add({
          targets: leaf,
          x: leaf.x + 220,
          y: leaf.y + Phaser.Math.Between(-15, 15),
          angle: leaf.angle + 360,
          duration: 4000 + i * 600,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
        parts.push(leaf);
      }
    } else if (animal === 'crab') {
      for (let i = 0; i < 6; i++) {
        const puff = this.add.circle(cx - 100 + i * 40, cy + 10, 6, 0xddc89a, 0.0).setScrollFactor(0).setDepth(2003);
        this.tweens.add({
          targets: puff,
          y: cy - 20,
          alpha: { from: 0.6, to: 0 },
          scale: { from: 0.6, to: 1.4 },
          duration: 1400,
          delay: i * 250,
          repeat: -1,
          ease: 'Cubic.easeOut'
        });
        parts.push(puff);
      }
    } else if (animal === 'snake') {
      const leaf = this.add.ellipse(cx, cy, 60, 22, 0x66bb6a).setScrollFactor(0).setDepth(2003);
      const stem = this.add.rectangle(cx, cy + 12, 3, 18, 0x4a6b2c).setScrollFactor(0).setDepth(2003);
      this.tweens.add({
        targets: [leaf, stem],
        angle: { from: -12, to: 12 },
        duration: 1800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      parts.push(leaf, stem);
    } else if (animal === 'bat') {
      const mouth = this.add.ellipse(cx, cy, 80, 40, 0x000000, 0.7).setScrollFactor(0).setDepth(2003);
      const mouthInner = this.add.ellipse(cx, cy + 4, 60, 30, 0x000000, 0.9).setScrollFactor(0).setDepth(2003);
      this.tweens.add({
        targets: [mouth, mouthInner],
        alpha: { from: 0.5, to: 0.95 },
        duration: 1600,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      parts.push(mouth, mouthInner);
    } else if (animal === 'parrot') {
      for (let i = 0; i < 3; i++) {
        const feather = this.add.ellipse(cx - 80 + i * 80, cy - 30, 8, 16, 0x42a5f5).setScrollFactor(0).setDepth(2003);
        feather.angle = -15;
        this.tweens.add({
          targets: feather,
          y: cy + 30,
          x: feather.x + Phaser.Math.Between(-15, 15),
          angle: { from: -25, to: 25 },
          duration: 3000 + i * 800,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
        parts.push(feather);
      }
    }
    return parts;
  }

  enterPeek(spotId, sx, sy) {
    if (this.exiting) return;
    this.exiting = true;
    for (let i = 0; i < 14; i++) {
      const angle = (i / 14) * Math.PI * 2;
      const star = this.add.star(this.sophia.x, this.sophia.y, 4, 4, 11, 0xffffaa);
      this.tweens.add({
        targets: star,
        x: this.sophia.x + Math.cos(angle) * 90,
        y: this.sophia.y + Math.sin(angle) * 90,
        scale: { from: 1.2, to: 0 },
        alpha: { from: 1, to: 0 },
        angle: 360,
        duration: 550,
        ease: 'Cubic.easeOut',
        onComplete: () => star.destroy()
      });
    }
    this.cameras.main.fadeOut(550, 255, 255, 255);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('Peek', { spot: spotId, returnTo: { x: sx, y: sy } });
    });
  }

  tryMove(obj, dx, dy) {
    if (dx !== 0) {
      obj.x += dx;
      if (this.overlapsAnySolid(obj)) obj.x -= dx;
    }
    if (dy !== 0) {
      obj.y += dy;
      if (this.overlapsAnySolid(obj)) obj.y -= dy;
    }
  }

  overlapsAnySolid(obj) {
    const ow = obj.hitW || obj.width || 24;
    const oh = obj.hitH || obj.height || 24;
    for (const s of this.solids) {
      const hw = (ow + s.w) / 2;
      const hh = (oh + s.h) / 2;
      if (Math.abs(obj.x - s.x) < hw && Math.abs(obj.y - s.y) < hh) return true;
    }
    return false;
  }

  // ====================================================
  // Top-of-map UI buttons: Title (top-left) + My Adventure (top-right)
  // ====================================================
  buildMapTopButtons() {
    const cam = this.cameras.main;
    const cw = cam.width;
    // Title button (top-left, beside banana counter — counter at x=14..264)
    const tx = cw - 100;
    const ty = 32;
    const titleBg = this.add.rectangle(tx, ty, 120, 36, 0x000000, 0.55)
      .setStrokeStyle(2, 0xffeb3b, 0.8)
      .setScrollFactor(0).setDepth(1000)
      .setInteractive({ useHandCursor: true });
    const titleTxt = this.add.text(tx, ty, '📖 My Adventure', {
      fontFamily: 'DM Sans, Comic Sans MS, system-ui, sans-serif',
      fontSize: '13px', color: '#ffffff', stroke: '#000000', strokeThickness: 2,
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(1001);
    titleBg.on('pointerdown', () => openMyAdventurePanel(() => {}));

    // ← Title button bottom-left
    const bx = 60;
    const by = cam.height - 28;
    const backBg = this.add.rectangle(bx, by, 100, 32, 0x000000, 0.55)
      .setStrokeStyle(2, 0xffeb3b, 0.8)
      .setScrollFactor(0).setDepth(1000)
      .setInteractive({ useHandCursor: true });
    const backTxt = this.add.text(bx, by, '← Title', {
      fontFamily: 'DM Sans, Comic Sans MS, system-ui, sans-serif',
      fontSize: '13px', color: '#ffffff', stroke: '#000000', strokeThickness: 2,
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(1001);
    backBg.on('pointerdown', () => this.returnToTitle());
  }

  returnToTitle() {
    if (this.exiting) return;
    this.exiting = true;
    this.cameras.main.fadeOut(400, 255, 255, 255);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Title', {}));
  }

  buildHomeworkIndicator() {
    const x = 14, y = 70;
    this.homeworkIndicatorBg = this.add.rectangle(x, y, 220, 30, 0x000000, 0.55)
      .setStrokeStyle(2, 0xffeb3b, 0.8)
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(1000);
    this.homeworkIndicatorText = this.add.text(x + 12, y, '', {
      fontFamily: 'DM Sans, Comic Sans MS, system-ui, sans-serif',
      fontSize: '15px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
      fontStyle: 'bold'
    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(1001);
    this.homeworkIndicatorBg.setInteractive({ useHandCursor: true });
    this.homeworkIndicatorBg.on('pointerdown', () => this.openHomeworkSummary());
    this.refreshHomeworkIndicator();
  }

  refreshHomeworkIndicator() {
    if (!this.homeworkIndicatorBg) return;
    const active = HomeworkManager.hasActivePack();
    const words = active ? HomeworkManager.getActiveWords() : null;
    if (active && words) {
      const label = '📝 Homework: ' + words.length + (words.length === 1 ? ' word' : ' words');
      this.homeworkIndicatorText.setText(label);
      const w = Math.max(180, this.homeworkIndicatorText.width + 24);
      this.homeworkIndicatorBg.width = w;
      this.homeworkIndicatorBg.setVisible(true);
      this.homeworkIndicatorText.setVisible(true);
    } else {
      this.homeworkIndicatorBg.setVisible(false);
      this.homeworkIndicatorText.setVisible(false);
    }
  }

  openHomeworkSummary() {
    if (this.parentModeOpen) return;
    const words = HomeworkManager.getActiveWords();
    if (!words || words.length === 0) return;

    const wrap = document.createElement('div');
    wrap.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:9998;display:flex;align-items:center;justify-content:center;font-family:"DM Sans","Comic Sans MS",system-ui,sans-serif;';
    const card = document.createElement('div');
    card.style.cssText = 'background:#fffaf0;border:4px solid #4a2c1a;border-radius:14px;padding:22px;max-width:360px;width:80%;max-height:70vh;overflow-y:auto;box-shadow:0 8px 24px rgba(0,0,0,0.4);';
    const title = document.createElement('div');
    title.textContent = '📝 This week\'s homework';
    title.style.cssText = 'font-size:18px;font-weight:bold;color:#6b4423;margin-bottom:14px;text-align:center;';
    const list = document.createElement('div');
    list.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;justify-content:center;';
    for (const w of words) {
      const chip = document.createElement('span');
      chip.textContent = w;
      chip.style.cssText = 'background:#fff3a8;border:2px solid #c9a13d;border-radius:8px;padding:4px 10px;font-size:16px;color:#4a2c1a;font-weight:bold;';
      list.appendChild(chip);
    }
    const hint = document.createElement('div');
    hint.textContent = 'Tap anywhere to close';
    hint.style.cssText = 'margin-top:16px;font-size:12px;color:#8b6f3a;font-style:italic;text-align:center;';
    card.appendChild(title); card.appendChild(list); card.appendChild(hint);
    wrap.appendChild(card);
    document.body.appendChild(wrap);
    const dismiss = () => { if (wrap.parentNode) wrap.parentNode.removeChild(wrap); };
    wrap.addEventListener('pointerdown', dismiss);
  }

  openParentMode() {
    if (this.parentModeOpen) return;
    this.parentModeOpen = true;
    openParentModePanel(() => {
      this.parentModeOpen = false;
      this.refreshHomeworkIndicator();
    });
  }
}

class PeekScene extends Phaser.Scene {
  constructor() { super('Peek'); }

  create(data) {
    this.returnTo = data.returnTo;
    this.spot = data.spot;
    this.drops = [];
    this.leftHeld = false;
    this.rightHeld = false;
    this.exiting = false;

    this.cameras.main.setBounds(-400, 0, 1600, 600);
    this.cameras.main.scrollX = 0;

    if (this.spot === 'beach-sunset') this.buildSunsetView();
    else this.buildWaterfallView();

    this.buildTouchZones();
    this.buildOverlayUI();

    this.cursors = this.input.keyboard.createCursorKeys();
    this.cameras.main.fadeIn(500, 255, 255, 255);
  }

  buildWaterfallView() {
    this.add.rectangle(400, 100, 2400, 200, 0xb3e0ff).setScrollFactor(0);
    this.add.rectangle(400, 250, 2400, 100, 0xd4eeff).setScrollFactor(0);
    this.add.circle(620, 110, 50, 0xfff3a8, 0.35).setScrollFactor(0.05);
    this.add.circle(620, 110, 38, 0xfff3a8, 1).setScrollFactor(0.05);
    this.add.circle(615, 105, 22, 0xffffff, 0.7).setScrollFactor(0.05);
    for (let i = 0; i < 5; i++) {
      const cx = -200 + i * 350 + Phaser.Math.Between(-40, 40);
      const cy = 180 + Phaser.Math.Between(-20, 20);
      this.add.ellipse(cx, cy, 160, 40, 0xffffff, 0.85).setScrollFactor(0.08);
      this.add.ellipse(cx + 30, cy - 8, 100, 30, 0xffffff, 0.85).setScrollFactor(0.08);
    }
    for (let i = 0; i < 7; i++) {
      const mx = -300 + i * 230 + Phaser.Math.Between(-20, 20);
      const mh = Phaser.Math.Between(70, 140);
      this.add.triangle(mx, 290, 0, 0, 220, 0, 110, -mh, 0x6e8ca6).setScrollFactor(0.15);
      this.add.triangle(mx + 110, 290, 0, -mh, 70, -mh + 30, 110, 0, 0x8aa5bd, 0.7).setScrollFactor(0.15);
    }
    for (let i = 0; i < 11; i++) {
      const tx = -350 + i * 170 + Phaser.Math.Between(-30, 30);
      this.add.circle(tx, 330, Phaser.Math.Between(45, 75), 0x1a4d2e).setScrollFactor(0.3);
    }
    for (let i = 0; i < 9; i++) {
      const tx = -300 + i * 200 + Phaser.Math.Between(-30, 30);
      this.add.circle(tx, 340, Phaser.Math.Between(35, 60), 0x2e6d3a).setScrollFactor(0.4);
    }
    this.add.rectangle(400, 90, 300, 50, 0x6b4423).setScrollFactor(0.5);
    this.add.ellipse(290, 95, 70, 35, 0x4a2c1a).setScrollFactor(0.5);
    this.add.ellipse(510, 95, 70, 35, 0x4a2c1a).setScrollFactor(0.5);
    this.add.ellipse(360, 80, 90, 30, 0x8b5a2b).setScrollFactor(0.5);
    this.add.ellipse(440, 82, 90, 30, 0x8b5a2b).setScrollFactor(0.5);
    this.add.rectangle(400, 280, 220, 380, 0x4a90c8).setScrollFactor(0.5);
    this.add.rectangle(400, 280, 190, 380, 0x6fa8dc).setScrollFactor(0.5);
    this.add.rectangle(400, 280, 150, 380, 0xa3cef0, 0.6).setScrollFactor(0.5);
    this.add.rectangle(350, 280, 24, 380, 0xffffff, 0.45).setScrollFactor(0.5);
    this.add.rectangle(395, 280, 14, 380, 0xffffff, 0.35).setScrollFactor(0.5);
    this.add.rectangle(445, 280, 20, 380, 0xffffff, 0.4).setScrollFactor(0.5);
    for (let i = 0; i < 18; i++) {
      const d = this.add.rectangle(
        400 + Phaser.Math.Between(-95, 95),
        Phaser.Math.Between(110, 460),
        Phaser.Math.Between(6, 14),
        Phaser.Math.Between(18, 34),
        0xffffff, 0.85
      ).setScrollFactor(0.5);
      this.drops.push(d);
    }
    this.add.ellipse(400, 490, 520, 100, 0x2e6da4).setScrollFactor(0.5);
    this.add.ellipse(400, 488, 460, 80, 0x4a90c8).setScrollFactor(0.5);
    this.add.ellipse(400, 486, 360, 58, 0x6fa8dc, 0.75).setScrollFactor(0.5);
    for (let i = 0; i < 5; i++) {
      const rx = 400 + Phaser.Math.Between(-200, 200);
      const ry = 482 + Phaser.Math.Between(-12, 12);
      const ripple = this.add.ellipse(rx, ry, Phaser.Math.Between(40, 80), Phaser.Math.Between(8, 16), 0xffffff, 0.6).setScrollFactor(0.5);
      this.tweens.add({ targets: ripple, scaleX: { from: 0.7, to: 1.3 }, alpha: { from: 0.6, to: 0.1 }, duration: 2200, yoyo: true, repeat: -1, delay: i * 300 });
    }
    for (let i = 0; i < 12; i++) {
      const sx = 400 + Phaser.Math.Between(-110, 110);
      const sy = 470 + Phaser.Math.Between(-8, 8);
      this.add.circle(sx, sy, Phaser.Math.Between(2, 5), 0xffffff, 0.9).setScrollFactor(0.5);
    }
    this.makeForegroundPalm(-80, 600);
    this.makeForegroundPalm(60, 600);
    this.makeForegroundPalm(740, 600);
    this.makeForegroundPalm(890, 600);
    this.add.rectangle(400, 580, 2400, 80, 0x267d3a).setScrollFactor(1);
    this.add.rectangle(400, 575, 2400, 50, 0x3a9c4a, 0.6).setScrollFactor(1);
    const flowerColors = [0xff5e7e, 0xffe066, 0xff8e3c, 0xb967ff, 0xff6b6b, 0xffffff, 0xff4081];
    for (let i = 0; i < 26; i++) {
      const fx = -350 + i * 55 + Phaser.Math.Between(-15, 15);
      const fy = 558 + Phaser.Math.Between(-6, 14);
      const c = Phaser.Math.RND.pick(flowerColors);
      const s = Phaser.Math.FloatBetween(6, 12);
      this.add.circle(fx, fy - 8, 3, 0x2e6d3a).setScrollFactor(1);
      this.add.circle(fx, fy, s, c).setScrollFactor(1);
      this.add.circle(fx, fy, s * 0.4, 0xffeb3b).setScrollFactor(1);
    }
    const bx = 250, by = 320;
    this.butterfly = this.add.container(bx, by);
    const wing1 = this.add.ellipse(-7, 0, 16, 22, 0xff8e3c);
    const wing2 = this.add.ellipse(7, 0, 16, 22, 0xff8e3c);
    const wing3 = this.add.ellipse(-7, 6, 10, 12, 0xffe066);
    const wing4 = this.add.ellipse(7, 6, 10, 12, 0xffe066);
    const body = this.add.ellipse(0, 0, 3, 16, 0x4a2c1a);
    this.butterfly.add([wing1, wing3, wing2, wing4, body]);
    this.butterfly.setScrollFactor(0.7);
    this.tweens.add({ targets: this.butterfly, y: by - 40, x: bx + 30, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: [wing1, wing3], scaleX: 0.3, duration: 180, yoyo: true, repeat: -1 });
    this.tweens.add({ targets: [wing2, wing4], scaleX: 0.3, duration: 180, yoyo: true, repeat: -1 });
  }

  buildSunsetView() {
    this.add.rectangle(400, 60, 2400, 120, 0x4a148c).setScrollFactor(0);
    this.add.rectangle(400, 130, 2400, 60, 0x7b1fa2).setScrollFactor(0);
    this.add.rectangle(400, 180, 2400, 50, 0xc2185b).setScrollFactor(0);
    this.add.rectangle(400, 225, 2400, 50, 0xef5350).setScrollFactor(0);
    this.add.rectangle(400, 270, 2400, 40, 0xff7043).setScrollFactor(0);
    this.add.rectangle(400, 305, 2400, 30, 0xff9800).setScrollFactor(0);
    this.add.rectangle(400, 330, 2400, 20, 0xffb74d).setScrollFactor(0);

    const sun = this.add.circle(400, 360, 130, 0xff5722, 1).setScrollFactor(0.1);
    this.add.circle(400, 360, 160, 0xff7043, 0.5).setScrollFactor(0.1);
    this.add.circle(400, 360, 200, 0xff9800, 0.25).setScrollFactor(0.1);
    this.tweens.add({ targets: sun, scale: { from: 0.98, to: 1.04 }, duration: 4000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    for (let i = 0; i < 4; i++) {
      const cx = -200 + i * 380 + Phaser.Math.Between(-30, 30);
      const cy = 100 + Phaser.Math.Between(-10, 20);
      this.add.ellipse(cx, cy, 180, 22, 0xff7043, 0.6).setScrollFactor(0.08);
      this.add.ellipse(cx + 30, cy + 5, 120, 16, 0xff9800, 0.55).setScrollFactor(0.08);
    }
    for (let i = 0; i < 3; i++) {
      const cx = -100 + i * 500 + Phaser.Math.Between(-40, 40);
      const cy = 230 + Phaser.Math.Between(-10, 10);
      this.add.ellipse(cx, cy, 220, 14, 0xc62828, 0.55).setScrollFactor(0.05);
    }

    for (let i = 0; i < 5; i++) {
      const ix = -300 + i * 280 + Phaser.Math.Between(-30, 30);
      const w = Phaser.Math.Between(80, 140);
      this.add.ellipse(ix, 410, w, 22, 0x311b4a).setScrollFactor(0.2);
      this.add.ellipse(ix + 10, 405, w * 0.7, 14, 0x4a2c1a, 0.7).setScrollFactor(0.2);
    }

    this.add.rectangle(400, 460, 2400, 60, 0x1a237e).setScrollFactor(0.4);
    this.add.rectangle(400, 440, 2400, 30, 0x303f9f).setScrollFactor(0.4);
    this.add.rectangle(400, 480, 2400, 60, 0x0d47a1).setScrollFactor(0.4);
    this.add.ellipse(400, 430, 360, 22, 0xff7043, 0.7).setScrollFactor(0.4);
    this.add.ellipse(400, 445, 280, 14, 0xff9800, 0.6).setScrollFactor(0.4);
    this.add.ellipse(400, 458, 200, 10, 0xffb74d, 0.5).setScrollFactor(0.4);
    for (let i = 0; i < 14; i++) {
      const x = -250 + i * 80 + Phaser.Math.Between(-20, 20);
      const y = 430 + Phaser.Math.Between(0, 80);
      const shimmer = this.add.ellipse(x, y, Phaser.Math.Between(20, 50), 5, 0xffffff, 0.6).setScrollFactor(0.4);
      this.tweens.add({ targets: shimmer, alpha: { from: 0.6, to: 0.15 }, duration: 1800, yoyo: true, repeat: -1, delay: i * 130 });
    }

    for (let i = 0; i < 4; i++) {
      const bx = -200 + i * 280 + Phaser.Math.Between(-60, 60);
      const by = 180 + Phaser.Math.Between(0, 80);
      const gull = this.add.graphics().setScrollFactor(0.25);
      gull.lineStyle(2, 0x2a1a1a, 0.85);
      gull.beginPath();
      gull.moveTo(bx - 12, by);
      gull.lineTo(bx - 6, by - 6);
      gull.lineTo(bx, by - 2);
      gull.lineTo(bx + 6, by - 6);
      gull.lineTo(bx + 12, by);
      gull.strokePath();
      this.tweens.add({ targets: gull, x: '+=80', y: '+=20', duration: 6000 + i * 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }

    this.add.rectangle(400, 540, 2400, 70, 0xf5deb3).setScrollFactor(1);
    this.add.rectangle(400, 530, 2400, 30, 0xd4b483, 0.6).setScrollFactor(1);
    for (let i = 0; i < 22; i++) {
      const sx = -350 + i * 60 + Phaser.Math.Between(-12, 12);
      const sy = 545 + Phaser.Math.Between(-8, 14);
      this.add.circle(sx, sy, 2, 0xb8a17c, 0.7).setScrollFactor(1);
    }
    this.add.ellipse(180, 555, 24, 12, 0xffe0d0).setScrollFactor(1).setRotation(0.4);
    this.add.ellipse(540, 565, 18, 9, 0xffd0c0).setScrollFactor(1).setRotation(-0.3);
    this.add.ellipse(820, 552, 22, 11, 0xffe4d0).setScrollFactor(1).setRotation(0.6);

    this.makeForegroundPalmSilhouette(-50, 600);
    this.makeForegroundPalmSilhouette(110, 600);
    this.makeForegroundPalmSilhouette(720, 600);
    this.makeForegroundPalmSilhouette(880, 600);
  }

  makeForegroundPalm(x, y) {
    this.add.rectangle(x, y, 30, 240, 0x5d3a1a).setOrigin(0.5, 1).setScrollFactor(0.9);
    this.add.rectangle(x - 5, y - 120, 7, 220, 0x3d2a14).setScrollFactor(0.9);
    this.add.ellipse(x - 55, y - 220, 150, 38, 0x1b5e20).setScrollFactor(0.9).setRotation(0.18);
    this.add.ellipse(x + 55, y - 220, 150, 38, 0x2e7d32).setScrollFactor(0.9).setRotation(-0.18);
    this.add.ellipse(x, y - 255, 55, 150, 0x1b5e20).setScrollFactor(0.9);
    this.add.ellipse(x - 80, y - 240, 80, 25, 0x388e3c).setScrollFactor(0.9).setRotation(0.55);
    this.add.ellipse(x + 80, y - 240, 80, 25, 0x388e3c).setScrollFactor(0.9).setRotation(-0.55);
    this.add.ellipse(x - 60, y - 200, 70, 20, 0x4caf50).setScrollFactor(0.9).setRotation(0.3);
    this.add.ellipse(x + 60, y - 200, 70, 20, 0x4caf50).setScrollFactor(0.9).setRotation(-0.3);
    this.add.circle(x - 8, y - 195, 9, 0x4a2c1a).setScrollFactor(0.9);
    this.add.circle(x + 8, y - 200, 9, 0x4a2c1a).setScrollFactor(0.9);
    this.add.circle(x, y - 188, 9, 0x4a2c1a).setScrollFactor(0.9);
  }

  makeForegroundPalmSilhouette(x, y) {
    this.add.rectangle(x, y, 30, 240, 0x1a0d1f).setOrigin(0.5, 1).setScrollFactor(0.9);
    this.add.ellipse(x - 55, y - 220, 150, 38, 0x14081a).setScrollFactor(0.9).setRotation(0.18);
    this.add.ellipse(x + 55, y - 220, 150, 38, 0x14081a).setScrollFactor(0.9).setRotation(-0.18);
    this.add.ellipse(x, y - 255, 55, 150, 0x14081a).setScrollFactor(0.9);
    this.add.ellipse(x - 80, y - 240, 80, 25, 0x14081a).setScrollFactor(0.9).setRotation(0.55);
    this.add.ellipse(x + 80, y - 240, 80, 25, 0x14081a).setScrollFactor(0.9).setRotation(-0.55);
    this.add.ellipse(x - 60, y - 200, 70, 20, 0x14081a).setScrollFactor(0.9).setRotation(0.3);
    this.add.ellipse(x + 60, y - 200, 70, 20, 0x14081a).setScrollFactor(0.9).setRotation(-0.3);
  }

  buildTouchZones() {
    const leftZone = this.add.rectangle(150, 300, 300, 540, 0xffffff, 0).setOrigin(0.5, 0.5).setScrollFactor(0).setInteractive();
    const rightZone = this.add.rectangle(650, 300, 300, 540, 0xffffff, 0).setOrigin(0.5, 0.5).setScrollFactor(0).setInteractive();
    leftZone.on('pointerdown', () => { this.leftHeld = true; });
    leftZone.on('pointerup',   () => { this.leftHeld = false; });
    leftZone.on('pointerout',  () => { this.leftHeld = false; });
    leftZone.on('pointerupoutside', () => { this.leftHeld = false; });
    rightZone.on('pointerdown', () => { this.rightHeld = true; });
    rightZone.on('pointerup',   () => { this.rightHeld = false; });
    rightZone.on('pointerout',  () => { this.rightHeld = false; });
    rightZone.on('pointerupoutside', () => { this.rightHeld = false; });
  }

  buildOverlayUI() {
    this.add.rectangle(400, 558, 520, 56, 0x000000, 0.55).setScrollFactor(0).setStrokeStyle(2, 0xffffff, 0.4);
    this.add.text(400, 558, '← →  look around    ↓  go back', {
      fontFamily: 'Comic Sans MS, Chalkboard SE, system-ui, sans-serif',
      fontSize: '24px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5, 0.5).setScrollFactor(0);
    const backBg = this.add.rectangle(60, 50, 96, 50, 0xffeb3b, 0.95).setScrollFactor(0).setStrokeStyle(3, 0x8b5a2b);
    const backTxt = this.add.text(60, 50, 'BACK', {
      fontFamily: 'Comic Sans MS, Chalkboard SE, system-ui, sans-serif',
      fontSize: '22px',
      color: '#4a2c1a',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5).setScrollFactor(0);
    backBg.setInteractive({ useHandCursor: true });
    backBg.on('pointerdown', () => this.exitPeek());
    backTxt.setInteractive({ useHandCursor: true });
    backTxt.on('pointerdown', () => this.exitPeek());
  }

  update(time, delta) {
    if (this.exiting) return;
    const step = 320 * delta / 1000;
    if (this.cursors.left.isDown || this.leftHeld) this.cameras.main.scrollX -= step;
    if (this.cursors.right.isDown || this.rightHeld) this.cameras.main.scrollX += step;
    this.cameras.main.scrollX = Phaser.Math.Clamp(this.cameras.main.scrollX, -400, 400);

    for (const d of this.drops) {
      d.y += 3;
      if (d.y > 450) {
        d.y = 110;
        d.x = 400 + Phaser.Math.Between(-95, 95);
      }
    }

    if (this.cursors.down.isDown) this.exitPeek();
  }

  exitPeek() {
    if (this.exiting) return;
    this.exiting = true;
    this.cameras.main.fadeOut(500, 255, 255, 255);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('TopDown', { returnTo: this.returnTo });
    });
  }
}

// ============================================================
// openParentModePanel — DOM overlay used by both TopDown and Title
// ============================================================
function openParentModePanel(onClose) {
  const existing = HomeworkManager.load();
  const existingWords = (existing && existing.spelling && existing.spelling.words) ? existing.spelling.words.slice() : [];
  const useHomework = !!(existing && existing.active);

  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:9999;display:flex;align-items:center;justify-content:center;font-family:"DM Sans","Comic Sans MS",system-ui,sans-serif;';

  const card = document.createElement('div');
  card.style.cssText = 'background:#fffaf0;border:4px solid #4a2c1a;border-radius:14px;padding:24px;max-width:520px;width:90%;max-height:90vh;overflow-y:auto;box-shadow:0 8px 24px rgba(0,0,0,0.4);';

  const header = document.createElement('div');
  header.textContent = '👋 Hi Mum & Dad — set this week\'s words';
  header.style.cssText = 'font-size:20px;font-weight:bold;color:#6b4423;margin-bottom:14px;text-align:center;';

  const piTip = document.createElement('div');
  piTip.textContent = '💡 Tip: easier to type on a computer or iPad with a keyboard.';
  piTip.style.cssText = 'font-size:12px;color:#7a5a14;background:#fff3a8;border:1px dashed #c9a13d;border-radius:6px;padding:6px 8px;margin-bottom:12px;text-align:center;';

  const label = document.createElement('div');
  label.textContent = 'Paste spelling words separated by commas';
  label.style.cssText = 'font-size:14px;color:#4a2c1a;margin-bottom:6px;';

  const textarea = document.createElement('textarea');
  textarea.placeholder = 'e.g. vet, van, hip, pot, had, fun, bad, zip...';
  textarea.value = existingWords.join(', ');
  textarea.style.cssText = 'width:100%;box-sizing:border-box;height:120px;padding:10px;border:2px solid #8b6f3a;border-radius:8px;font-family:inherit;font-size:16px;resize:vertical;color:#2a2a2a;background:#fffdf5;';

  const status = document.createElement('div');
  status.style.cssText = 'margin-top:8px;font-size:14px;min-height:20px;color:#4a2c1a;';
  const errorBox = document.createElement('div');
  errorBox.style.cssText = 'margin-top:4px;font-size:13px;color:#c62828;white-space:pre-wrap;';

  const toggleRow = document.createElement('label');
  toggleRow.style.cssText = 'display:flex;align-items:center;gap:10px;margin-top:14px;cursor:pointer;font-size:15px;color:#4a2c1a;';
  const toggleCheckbox = document.createElement('input');
  toggleCheckbox.type = 'checkbox';
  toggleCheckbox.checked = useHomework;
  toggleCheckbox.style.cssText = 'width:20px;height:20px;cursor:pointer;';
  const toggleLabel = document.createElement('span');
  const updateToggleLabel = () => {
    toggleLabel.innerHTML = toggleCheckbox.checked
      ? '🟢 Using <b>homework</b> words for the Crab'
      : '⚪ Using <b>default</b> words for the Crab';
  };
  updateToggleLabel();
  toggleCheckbox.addEventListener('change', updateToggleLabel);
  toggleRow.appendChild(toggleCheckbox);
  toggleRow.appendChild(toggleLabel);

  const validate = () => {
    const { words, errors } = parseHomeworkWords(textarea.value);
    if (errors.length > 0) {
      errorBox.textContent = errors.slice(0, 4).join('\n') + (errors.length > 4 ? '\n…and ' + (errors.length - 4) + ' more' : '');
      status.textContent = words.length > 0 ? ('✓ Parsed ' + words.length + ' valid (with some issues above)') : '';
      return { words, errors };
    }
    errorBox.textContent = '';
    status.textContent = words.length > 0 ? ('✓ Parsed ' + words.length + ' words') : '';
    return { words, errors };
  };
  textarea.addEventListener('input', validate);

  const btnRow = document.createElement('div');
  btnRow.style.cssText = 'display:flex;gap:10px;margin-top:18px;flex-wrap:wrap;';
  const mkBtn = (text, bg, fg) => {
    const b = document.createElement('button');
    b.textContent = text;
    b.style.cssText = 'flex:1;min-width:90px;padding:12px;font-family:inherit;font-size:16px;font-weight:bold;border:3px solid #4a2c1a;border-radius:10px;cursor:pointer;background:' + bg + ';color:' + fg + ';';
    return b;
  };
  const saveBtn = mkBtn('💾 SAVE', '#a8e6cf', '#1f5e44');
  const clearBtn = mkBtn('🗑 CLEAR', '#ffd3b6', '#7a3a14');
  const closeBtn = mkBtn('✕ CLOSE', '#e0e0e0', '#2a2a2a');

  const dismiss = () => {
    if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
    if (typeof onClose === 'function') onClose();
  };

  saveBtn.addEventListener('click', () => {
    const { words, errors } = validate();
    if (errors.length > 0) { status.textContent = 'Please fix the issues above first.'; return; }
    if (words.length < 3) { errorBox.textContent = 'Need at least 3 words (so we have enough for distractors).'; return; }
    HomeworkManager.save({
      version: 1, active: toggleCheckbox.checked,
      spelling: { words },
      savedAt: new Date().toISOString()
    });
    status.textContent = 'Saved! The crab is ready to read 🦀';
    errorBox.textContent = '';
    setTimeout(dismiss, 900);
  });
  clearBtn.addEventListener('click', () => {
    if (!confirm('Clear homework and use defaults?')) return;
    HomeworkManager.clear();
    textarea.value = '';
    toggleCheckbox.checked = false;
    updateToggleLabel();
    status.textContent = 'Homework cleared.';
    errorBox.textContent = '';
  });
  closeBtn.addEventListener('click', dismiss);

  btnRow.appendChild(saveBtn); btnRow.appendChild(clearBtn); btnRow.appendChild(closeBtn);
  card.appendChild(header); card.appendChild(piTip); card.appendChild(label); card.appendChild(textarea);
  card.appendChild(status); card.appendChild(errorBox); card.appendChild(toggleRow); card.appendChild(btnRow);
  wrap.appendChild(card);
  document.body.appendChild(wrap);
  if (existingWords.length > 0) validate();
  textarea.focus();
}

// ============================================================
// openMyAdventurePanel — sticker-album / trophy DOM overlay
// ============================================================
function openMyAdventurePanel(onClose) {
  const save = SaveManager.load();
  const completed = save.puzzlesSolved;
  const stopOrder = ['snowy', 'crab', 'snake', 'bat', 'parrot'];
  const stopMeta = {
    snowy:  { emoji: '🐀', title: "Snowy's hungry",   line: 'You helped Snowy get cheese! 🧀' },
    crab:   { emoji: '🦀', title: "Crab's sore claw", line: 'You read the magic words! ✨' },
    snake:  { emoji: '🐍', title: 'Knotted snake',    line: 'You un-knotted the snake! 🌿' },
    bat:    { emoji: '🦇', title: "Bat's hurt wing",  line: 'You helped the bat fly again! 🦇' },
    parrot: { emoji: '🦜', title: 'Lost parrot',      line: 'You guided the parrot home! 🦜' }
  };
  const doneCount = stopOrder.filter(id => completed[STOP_CONFIGS[id].puzzleKey]).length;

  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:9999;display:flex;align-items:center;justify-content:center;font-family:"DM Sans","Comic Sans MS",system-ui,sans-serif;';
  const card = document.createElement('div');
  card.style.cssText = 'background:#fffaf0;border:4px solid #4a2c1a;border-radius:14px;padding:24px;max-width:580px;width:92%;max-height:90vh;overflow-y:auto;box-shadow:0 8px 24px rgba(0,0,0,0.4);';

  const header = document.createElement('div');
  header.textContent = "Sophia's Adventure 🌟";
  header.style.cssText = 'font-size:24px;font-weight:bold;color:#6b4423;margin-bottom:6px;text-align:center;';

  const progressLine = document.createElement('div');
  progressLine.textContent = 'Adventure Progress: ' + doneCount + ' of 5 stops';
  progressLine.style.cssText = 'font-size:14px;color:#4a2c1a;text-align:center;margin-bottom:8px;';

  const dots = document.createElement('div');
  dots.style.cssText = 'display:flex;justify-content:center;gap:8px;margin-bottom:16px;';
  for (let i = 0; i < 5; i++) {
    const dot = document.createElement('div');
    const filled = i < doneCount;
    dot.style.cssText = 'width:22px;height:22px;border-radius:50%;border:2px solid #4a2c1a;background:' + (filled ? '#ffeb3b' : '#e0d5b8') + ';';
    dots.appendChild(dot);
  }

  const grid = document.createElement('div');
  grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px;margin-bottom:20px;';
  stopOrder.forEach((id, idx) => {
    const cfg = STOP_CONFIGS[id];
    const meta = stopMeta[id];
    const isDone = !!completed[cfg.puzzleKey];
    const prereqId = idx > 0 ? stopOrder[idx - 1] : null;
    const isLocked = prereqId && !completed[STOP_CONFIGS[prereqId].puzzleKey];
    const stopCard = document.createElement('div');
    let bg, fg, status;
    if (isDone) { bg = '#a8e6cf'; fg = '#1f5e44'; status = '✓ Helped!'; }
    else if (isLocked) { bg = '#d4d4d4'; fg = '#666'; status = '🔒 Locked'; }
    else { bg = '#fff3a8'; fg = '#7a5a14'; status = '🌟 Ready to help'; }
    stopCard.style.cssText = 'background:' + bg + ';border:2px solid #4a2c1a;border-radius:10px;padding:12px;text-align:center;color:' + fg + ';' + (isLocked ? 'filter:grayscale(0.6);opacity:0.7;' : '');
    const big = document.createElement('div');
    big.textContent = isLocked ? '❓' : meta.emoji;
    big.style.cssText = 'font-size:34px;line-height:1;margin-bottom:4px;';
    const nm = document.createElement('div');
    nm.textContent = cfg.displayName;
    nm.style.cssText = 'font-size:16px;font-weight:bold;';
    const ttl = document.createElement('div');
    ttl.textContent = meta.title;
    ttl.style.cssText = 'font-size:12px;font-style:italic;margin:2px 0 6px 0;';
    const stt = document.createElement('div');
    stt.textContent = status;
    stt.style.cssText = 'font-size:13px;font-weight:bold;';
    stopCard.appendChild(big); stopCard.appendChild(nm); stopCard.appendChild(ttl); stopCard.appendChild(stt);
    if (isDone) {
      const note = document.createElement('div');
      note.textContent = meta.line;
      note.style.cssText = 'font-size:11px;margin-top:6px;color:#4a2c1a;';
      stopCard.appendChild(note);
    }
    grid.appendChild(stopCard);
  });

  const itemsHeader = document.createElement('div');
  itemsHeader.textContent = '🎁 Party items collected';
  itemsHeader.style.cssText = 'font-size:16px;font-weight:bold;color:#6b4423;margin:8px 0 8px 0;';
  const items = document.createElement('div');
  items.style.cssText = 'display:flex;flex-wrap:wrap;gap:14px;margin-bottom:16px;font-size:14px;color:#4a2c1a;';
  const pItems = save.partyItems || {};
  const itemRow = (emoji, label, val) => {
    const span = document.createElement('span');
    span.innerHTML = '<b style="font-size:18px;">' + emoji + '</b> ' + label + ': <b>' + val + '</b>';
    items.appendChild(span);
  };
  itemRow('🧀', 'Cheese', pItems.bananas || 0);
  itemRow('🌸', 'Flowers', pItems.flowers || 0);
  itemRow('💎', 'Stones', pItems.stones || 0);
  itemRow('🎵', 'Music notes', pItems.musicNotes || 0);
  itemRow('🍌', 'Golden Banana', pItems.goldenBanana ? '✓' : 'Not yet');

  const recordsHeader = document.createElement('div');
  recordsHeader.textContent = '🏆 Records';
  recordsHeader.style.cssText = 'font-size:16px;font-weight:bold;color:#6b4423;margin:8px 0 8px 0;';
  const records = document.createElement('div');
  records.style.cssText = 'display:flex;flex-direction:column;gap:4px;margin-bottom:18px;font-size:14px;color:#4a2c1a;';
  const best = save.speedReadBest || { defaultBank: 0, homeworkBank: 0 };
  if (best.defaultBank > 0) {
    const r = document.createElement('div');
    r.innerHTML = '🦀 Speed Read best: <b>' + best.defaultBank + ' words</b>';
    records.appendChild(r);
  }
  if (best.homeworkBank > 0) {
    const r = document.createElement('div');
    r.innerHTML = '🦀 Speed Read best (homework): <b>' + best.homeworkBank + ' words</b>';
    records.appendChild(r);
  }
  const bananas = document.createElement('div');
  bananas.innerHTML = '🐀 Bananas collected: <b>' + (save.bananaCount || 0) + '</b>';
  records.appendChild(bananas);
  const fmtDate = (iso) => {
    if (!iso) return null;
    try { return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }); }
    catch (e) { return iso; }
  };
  const firstDate = fmtDate(save.stats && save.stats.startedAt);
  const lastDate = fmtDate(save.stats && save.stats.lastPlayedAt);
  if (firstDate) {
    const r = document.createElement('div');
    r.innerHTML = '📅 First played: <b>' + firstDate + '</b>';
    records.appendChild(r);
  }
  if (lastDate) {
    const r = document.createElement('div');
    r.innerHTML = '📅 Last played: <b>' + lastDate + '</b>';
    records.appendChild(r);
  }

  const backBtn = document.createElement('button');
  backBtn.textContent = '← Back';
  backBtn.style.cssText = 'width:100%;padding:12px;font-family:inherit;font-size:16px;font-weight:bold;border:3px solid #4a2c1a;border-radius:10px;cursor:pointer;background:#e0e0e0;color:#2a2a2a;';
  const dismiss = () => {
    if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
    if (typeof onClose === 'function') onClose();
  };
  backBtn.addEventListener('click', dismiss);

  card.appendChild(header); card.appendChild(progressLine); card.appendChild(dots);
  card.appendChild(grid);
  card.appendChild(itemsHeader); card.appendChild(items);
  card.appendChild(recordsHeader); card.appendChild(records);
  card.appendChild(backBtn);
  wrap.appendChild(card);
  document.body.appendChild(wrap);
}

// ============================================================
// TitleScene — entry point, decides Continue/New/Start routing
// ============================================================
class TitleScene extends Phaser.Scene {
  constructor() { super('Title'); }

  create() {
    this.settingsOpen = false;
    const cam = this.cameras.main;
    const cw = cam.width, ch = cam.height;
    const cx = cw / 2;

    // Warm sky gradient
    this.add.rectangle(cx, 60, cw, 120, 0xffd180).setScrollFactor(0);
    this.add.rectangle(cx, 170, cw, 100, 0xffe0a0).setScrollFactor(0);
    this.add.rectangle(cx, 250, cw, 60, 0xfff0c0).setScrollFactor(0);

    // Sun
    this.add.circle(cw - 100, 110, 55, 0xfff9c4, 0.4).setScrollFactor(0);
    this.add.circle(cw - 100, 110, 40, 0xffeb3b, 0.95).setScrollFactor(0);
    this.add.circle(cw - 108, 102, 14, 0xffffff, 0.7).setScrollFactor(0);

    // Distant cloud wisps
    for (let i = 0; i < 4; i++) {
      const cxw = 80 + i * 200 + Phaser.Math.Between(-20, 20);
      const cy = 130 + Phaser.Math.Between(-15, 15);
      this.add.ellipse(cxw, cy, 110, 22, 0xffffff, 0.7).setScrollFactor(0);
      this.add.ellipse(cxw + 22, cy + 4, 80, 18, 0xffffff, 0.7).setScrollFactor(0);
    }

    // Distant jungle silhouettes
    for (let i = 0; i < 10; i++) {
      const tx = -50 + i * 100 + Phaser.Math.Between(-20, 20);
      this.add.circle(tx, 330, Phaser.Math.Between(40, 70), 0x1b5e20, 0.7);
    }
    // Closer jungle
    for (let i = 0; i < 9; i++) {
      const tx = -40 + i * 110 + Phaser.Math.Between(-30, 30);
      this.add.circle(tx, 380, Phaser.Math.Between(45, 75), 0x2e7d32);
    }
    // Ground
    this.add.rectangle(cx, 560, cw, 100, 0x4a7a3a);
    this.add.rectangle(cx, 510, cw, 30, 0x66bb6a, 0.6);

    // Flowers
    for (let i = 0; i < 12; i++) {
      const fx = 20 + Math.random() * (cw - 40);
      const fy = 510 + Math.random() * 70;
      const c = Phaser.Math.RND.pick([0xff5e7e, 0xffe066, 0xff8e3c, 0xb967ff, 0xffffff]);
      this.add.circle(fx, fy, 4, c);
    }

    // Title text — big bobbing
    const titleGroup = this.add.container(cx, 100);
    const titleShadow = this.add.text(2, 4, 'Sophia and the Rat Jungle', {
      fontFamily: 'Comic Sans MS, Chalkboard SE, system-ui, sans-serif',
      fontSize: '38px', color: '#000000', fontStyle: 'bold', align: 'center'
    }).setOrigin(0.5, 0.5).setAlpha(0.35);
    const titleTxt = this.add.text(0, 0, 'Sophia and the Rat Jungle', {
      fontFamily: 'Comic Sans MS, Chalkboard SE, system-ui, sans-serif',
      fontSize: '38px', color: '#ffeb3b', fontStyle: 'bold', align: 'center',
      stroke: '#4a2c1a', strokeThickness: 5
    }).setOrigin(0.5, 0.5);
    titleGroup.add([titleShadow, titleTxt]);
    this.tweens.add({ targets: titleGroup, y: { from: 100, to: 90 }, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // Subtitle
    this.add.text(cx, 152, '~ a small jungle adventure ~', {
      fontFamily: 'DM Sans, Comic Sans MS, system-ui, sans-serif',
      fontSize: '15px', color: '#6b4423', fontStyle: 'italic'
    }).setOrigin(0.5, 0.5);

    // Sophia + rats in centre
    this.drawSophia(cx, 360);
    this.drawTitleRat(cx - 70, 410, 0xf5f5f5, 0xffc4c4); // Snowy
    this.drawTitleRat(cx + 70, 410, 0x2a2a2a, 0xff8888); // Midnight

    // Butterfly
    this.makeTitleButterfly(80, 230);

    // Sparkles
    this.time.addEvent({
      delay: 1500, loop: true, callback: () => {
        const sx = Phaser.Math.Between(30, cw - 30);
        const sy = Phaser.Math.Between(450, 540);
        const star = this.add.star(sx, sy, 4, 3, 7, 0xffeb3b);
        this.tweens.add({
          targets: star,
          y: sy - 80,
          alpha: { from: 1, to: 0 },
          scale: { from: 1.2, to: 0 },
          angle: 360,
          duration: 1800,
          ease: 'Cubic.easeOut',
          onComplete: () => star.destroy()
        });
      }
    });

    // Buttons
    this.buildTitleButtons();

    this.cameras.main.fadeIn(500, 255, 255, 255);
  }

  drawSophia(x, y) {
    const c = this.add.container(x, y);
    // Hair (back)
    c.add(this.add.ellipse(0, -8, 36, 38, 0x6b4423));
    // Body (dress)
    c.add(this.add.triangle(0, 18, -22, 0, 22, 0, 0, 30, 0xff5e7e));
    // Body top
    c.add(this.add.rectangle(0, -2, 26, 22, 0xff8e9e));
    // Head
    c.add(this.add.circle(0, -16, 14, 0xffd6b8));
    // Hair (front fringe)
    c.add(this.add.ellipse(0, -22, 26, 10, 0x6b4423));
    c.add(this.add.ellipse(-12, -16, 8, 18, 0x6b4423));
    c.add(this.add.ellipse(12, -16, 8, 18, 0x6b4423));
    // Eyes
    const eyeL = this.add.ellipse(-4, -16, 3, 4, 0x2a2a2a);
    const eyeR = this.add.ellipse(4, -16, 3, 4, 0x2a2a2a);
    c.add(eyeL); c.add(eyeR);
    // Smile
    c.add(this.add.ellipse(0, -10, 6, 2, 0xc62828));
    // Arms
    c.add(this.add.ellipse(-18, 0, 6, 16, 0xffd6b8));
    c.add(this.add.ellipse(18, 0, 6, 16, 0xffd6b8));
    // Legs
    c.add(this.add.ellipse(-7, 30, 6, 14, 0xffd6b8));
    c.add(this.add.ellipse(7, 30, 6, 14, 0xffd6b8));
    // Blink
    this.time.addEvent({
      delay: 3500, loop: true, callback: () => {
        eyeL.scaleY = 0.1; eyeR.scaleY = 0.1;
        this.time.delayedCall(120, () => { eyeL.scaleY = 1; eyeR.scaleY = 1; });
      }
    });
    // Bob
    this.tweens.add({ targets: c, y: y - 3, duration: 1700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    return c;
  }

  drawTitleRat(x, y, body, ear) {
    const c = this.add.container(x, y);
    c.add(this.add.ellipse(0, 6, 28, 6, 0x000000, 0.35));
    c.add(this.add.ellipse(0, 0, 30, 20, body));
    c.add(this.add.circle(14, -1, 9, body));
    c.add(this.add.circle(16, -8, 4, ear));
    c.add(this.add.circle(16, 6, 4, ear));
    c.add(this.add.circle(17, -3, 1.6, 0x2a2a2a));
    c.add(this.add.circle(17, 3, 1.6, 0x2a2a2a));
    c.add(this.add.circle(22, 0, 1.8, 0xff8888));
    this.tweens.add({ targets: c, y: y - 3, duration: 1500 + Math.random() * 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    return c;
  }

  makeTitleButterfly(x, y) {
    const cam = this.cameras.main;
    const c = this.add.container(x, y);
    const color = Phaser.Math.RND.pick([0xff8e3c, 0xff5e7e, 0xffeb3b, 0xb967ff]);
    const wing1 = this.add.ellipse(-6, 0, 14, 18, color);
    const wing2 = this.add.ellipse(6, 0, 14, 18, color);
    const body = this.add.ellipse(0, 0, 2, 14, 0x4a2c1a);
    c.add([wing1, wing2, body]);
    this.tweens.add({
      targets: c,
      x: cam.width + 40,
      y: y + Phaser.Math.Between(-30, 30),
      duration: 14000,
      ease: 'Sine.easeInOut',
      onComplete: () => { c.x = -40; this.makeTitleButterfly(-40, Phaser.Math.Between(150, 320)); c.destroy(); }
    });
    this.tweens.add({ targets: [wing1, wing2], scaleX: 0.35, duration: 180, yoyo: true, repeat: -1 });
    return c;
  }

  buildTitleButtons() {
    const cam = this.cameras.main;
    const cx = cam.width / 2;
    const save = SaveManager.load();
    const hasProgress = Object.values(save.puzzlesSolved).some(v => v === true)
      || (save.bananaCount > 0)
      || (save.stats && save.stats.openingSeen);

    const mkBtn = (x, y, w, h, bg, fg, label, fontSize, onClick) => {
      const shadow = this.add.rectangle(x + 4, y + 6, w, h, 0x000000, 0.3);
      const bgRect = this.add.rectangle(x, y, w, h, bg)
        .setStrokeStyle(4, 0x4a2c1a)
        .setInteractive({ useHandCursor: true });
      const txt = this.add.text(x, y, label, {
        fontFamily: 'DM Sans, Comic Sans MS, system-ui, sans-serif',
        fontSize: fontSize + 'px', color: fg, fontStyle: 'bold', align: 'center'
      }).setOrigin(0.5, 0.5);
      bgRect.on('pointerover', () => bgRect.setScale(1.04));
      bgRect.on('pointerout', () => bgRect.setScale(1));
      bgRect.on('pointerdown', () => { unlockAudio(); if (!this.settingsOpen) onClick(); });
      return { shadow, bgRect, txt };
    };

    if (hasProgress) {
      mkBtn(cx, 470, 320, 64, 0xa8e6cf, '#1f5e44', '▶ Continue Adventure', 22, () => this.startContinue());
      mkBtn(cx, 545, 260, 44, 0xffd3b6, '#7a3a14', '🌟 New Adventure', 16, () => this.startNew(true));
    } else {
      mkBtn(cx, 500, 320, 70, 0xa8e6cf, '#1f5e44', '▶ Start Adventure', 24, () => this.startNew(false));
    }

    // Settings gear bottom-right
    const sX = cam.width - 36, sY = cam.height - 30;
    const sBg = this.add.circle(sX, sY, 22, 0xfffaf0).setStrokeStyle(3, 0x4a2c1a).setInteractive({ useHandCursor: true });
    const sTxt = this.add.text(sX, sY, '⚙', { fontFamily: 'DM Sans, system-ui, sans-serif', fontSize: '22px', color: '#4a2c1a' }).setOrigin(0.5, 0.5);
    sBg.on('pointerdown', () => this.openSettings());
  }

  startContinue() {
    this.cameras.main.fadeOut(400, 255, 255, 255);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('TopDown', {});
    });
  }

  startNew(confirmFirst) {
    const go = () => {
      SaveManager.reset();
      this.cameras.main.fadeOut(400, 255, 255, 255);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('Opening', {});
      });
    };
    if (!confirmFirst) {
      go();
    } else {
      if (confirm('Start a brand new adventure? This will wipe your progress.')) go();
    }
  }

  openSettings() {
    if (this.settingsOpen) return;
    this.settingsOpen = true;
    const wrap = document.createElement('div');
    wrap.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:9999;display:flex;align-items:center;justify-content:center;font-family:"DM Sans","Comic Sans MS",system-ui,sans-serif;';
    const card = document.createElement('div');
    card.style.cssText = 'background:#fffaf0;border:4px solid #4a2c1a;border-radius:14px;padding:24px;max-width:380px;width:88%;box-shadow:0 8px 24px rgba(0,0,0,0.4);';

    const h = document.createElement('div');
    h.textContent = '⚙ Settings';
    h.style.cssText = 'font-size:20px;font-weight:bold;color:#6b4423;margin-bottom:14px;text-align:center;';

    const mkRow = (label, bg, fg) => {
      const b = document.createElement('button');
      b.textContent = label;
      b.style.cssText = 'display:block;width:100%;margin-bottom:10px;padding:14px;font-family:inherit;font-size:16px;font-weight:bold;border:3px solid #4a2c1a;border-radius:10px;cursor:pointer;background:' + bg + ';color:' + fg + ';';
      return b;
    };
    const adventureBtn = mkRow('📖 My Adventure', '#b5d7f0', '#1a4a6e');
    const parentBtn = mkRow('👋 Parent Mode (hold 3s)', '#fff3a8', '#7a5a14');
    const resetBtn = mkRow('🗑 Reset progress', '#ffd3b6', '#7a3a14');
    const aboutLine = document.createElement('div');
    aboutLine.textContent = 'Made with love by Sophia & Mum 💛';
    aboutLine.style.cssText = 'text-align:center;font-style:italic;font-size:13px;color:#6b4423;margin:14px 0 12px 0;';
    const closeBtn = mkRow('✕ Close', '#e0e0e0', '#2a2a2a');

    const dismiss = () => {
      if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
      this.settingsOpen = false;
    };

    adventureBtn.addEventListener('click', () => {
      openMyAdventurePanel(() => {});
    });
    resetBtn.addEventListener('click', () => {
      if (!confirm('Reset all progress? This cannot be undone.')) return;
      SaveManager.reset();
      HomeworkManager.clear();
      dismiss();
      this.scene.restart();
    });
    closeBtn.addEventListener('click', dismiss);

    // Parent Mode requires 3-sec hold
    let holdTimer = null;
    let holdPip = null;
    const cancelHold = () => {
      if (holdTimer) { clearTimeout(holdTimer); holdTimer = null; }
      if (holdPip && holdPip.parentNode) holdPip.parentNode.removeChild(holdPip);
      holdPip = null;
      parentBtn.style.background = '#fff3a8';
    };
    parentBtn.addEventListener('pointerdown', () => {
      cancelHold();
      parentBtn.style.background = '#ffcc33';
      holdPip = document.createElement('span');
      holdPip.textContent = ' …';
      holdPip.style.cssText = 'font-size:20px;';
      parentBtn.appendChild(holdPip);
      holdTimer = setTimeout(() => {
        cancelHold();
        openParentModePanel(() => {});
      }, 3000);
    });
    parentBtn.addEventListener('pointerup', cancelHold);
    parentBtn.addEventListener('pointerleave', cancelHold);
    parentBtn.addEventListener('pointercancel', cancelHold);

    card.appendChild(h);
    card.appendChild(adventureBtn);
    card.appendChild(parentBtn);
    card.appendChild(resetBtn);
    card.appendChild(aboutLine);
    card.appendChild(closeBtn);
    wrap.appendChild(card);
    document.body.appendChild(wrap);
  }
}

// ============================================================
// OpeningScene — 4-bubble intro after Start/New Adventure
// ============================================================
class OpeningScene extends Phaser.Scene {
  constructor() { super('Opening'); }

  create() {
    const cam = this.cameras.main;
    const cw = cam.width, ch = cam.height;

    // Soft jungle background gradient
    this.add.rectangle(cw / 2, 50, cw, 100, 0xffd180);
    this.add.rectangle(cw / 2, 140, cw, 80, 0xffe0a0);
    this.add.rectangle(cw / 2, 220, cw, 50, 0xb3e5fc);
    // Jungle silhouettes
    for (let i = 0; i < 10; i++) {
      const tx = -40 + i * 100 + Phaser.Math.Between(-20, 20);
      this.add.circle(tx, 360, Phaser.Math.Between(45, 75), 0x2e7d32);
    }
    this.add.rectangle(cw / 2, 560, cw, 100, 0x4a7a3a);
    this.add.rectangle(cw / 2, 510, cw, 30, 0x66bb6a, 0.6);

    // Skip button
    const skip = this.add.text(cw - 14, 14, 'Skip story →', {
      fontFamily: 'DM Sans, Comic Sans MS, system-ui, sans-serif',
      fontSize: '13px', color: '#4a2c1a', fontStyle: 'italic'
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
    skip.on('pointerdown', () => this.finish());

    this.bubbleIndex = 0;
    this.bubbles = [
      'Sophia and her rats Snowy and Midnight love adventures.',
      "Today, they're going to the jungle to throw a party for all their animal friends!",
      'But the animals need help first — five of them are in trouble.',
      'Can you help Sophia and her rats save the party?'
    ];

    // Draw Sophia + rats for visual continuity
    this.sceneActor = this.add.container(cw / 2, 350);
    this.drawIntroActors(this.sceneActor);

    this.tapHint = this.add.text(cw / 2, ch - 36, 'Tap to continue', {
      fontFamily: 'DM Sans, Comic Sans MS, system-ui, sans-serif',
      fontSize: '13px', color: '#6b4423', fontStyle: 'italic'
    }).setOrigin(0.5, 0.5);
    this.tweens.add({ targets: this.tapHint, alpha: { from: 0.4, to: 1 }, duration: 1200, yoyo: true, repeat: -1 });

    this.bubbleBg = null;
    this.bubbleTxt = null;
    this.showBubble();

    this.input.on('pointerdown', (p, objs) => {
      // Don't advance if tap was on skip
      if (objs && objs.length > 0 && objs[0] === skip) return;
      this.advance();
    });
    const keyHandler = (e) => {
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight') {
        e.preventDefault();
        this.advance();
      } else if (e.key === 'Escape') {
        this.finish();
      }
    };
    window.addEventListener('keydown', keyHandler);
    this.events.once('shutdown', () => window.removeEventListener('keydown', keyHandler));

    this.cameras.main.fadeIn(400, 255, 255, 255);
  }

  drawIntroActors(container) {
    // Sophia centre
    container.add(this.add.ellipse(0, -8, 36, 38, 0x6b4423));
    container.add(this.add.triangle(0, 18, -22, 0, 22, 0, 0, 30, 0xff5e7e));
    container.add(this.add.rectangle(0, -2, 26, 22, 0xff8e9e));
    container.add(this.add.circle(0, -16, 14, 0xffd6b8));
    container.add(this.add.ellipse(0, -22, 26, 10, 0x6b4423));
    container.add(this.add.ellipse(-4, -16, 3, 4, 0x2a2a2a));
    container.add(this.add.ellipse(4, -16, 3, 4, 0x2a2a2a));
    container.add(this.add.ellipse(0, -10, 6, 2, 0xc62828));
    // Snowy left
    const sX = -56;
    container.add(this.add.ellipse(sX, 26, 26, 16, 0xf5f5f5));
    container.add(this.add.circle(sX + 11, 25, 8, 0xf5f5f5));
    container.add(this.add.circle(sX + 13, 19, 4, 0xffc4c4));
    container.add(this.add.circle(sX + 13, 31, 4, 0xffc4c4));
    container.add(this.add.circle(sX + 14, 23, 1.5, 0x2a2a2a));
    container.add(this.add.circle(sX + 14, 27, 1.5, 0x2a2a2a));
    // Midnight right
    const mX = 56;
    container.add(this.add.ellipse(mX, 26, 26, 16, 0x2a2a2a));
    container.add(this.add.circle(mX - 11, 25, 8, 0x2a2a2a));
    container.add(this.add.circle(mX - 13, 19, 4, 0xff8888));
    container.add(this.add.circle(mX - 13, 31, 4, 0xff8888));
    container.add(this.add.circle(mX - 14, 23, 1.5, 0xffeb3b));
    container.add(this.add.circle(mX - 14, 27, 1.5, 0xffeb3b));
  }

  showBubble() {
    const cam = this.cameras.main;
    const cx = cam.width / 2;
    const bubbleY = 120;
    if (this.bubbleBg) this.bubbleBg.destroy();
    if (this.bubbleTxt) this.bubbleTxt.destroy();
    const text = this.bubbles[this.bubbleIndex];
    const t = this.add.text(cx, bubbleY, text, {
      fontFamily: 'DM Sans, Comic Sans MS, system-ui, sans-serif',
      fontSize: '22px', color: '#2a2a2a', fontStyle: 'bold', align: 'center',
      wordWrap: { width: cam.width - 80 }
    }).setOrigin(0.5, 0.5);
    const bg = this.add.rectangle(cx, bubbleY, t.width + 40, t.height + 28, 0xfffaf0, 0.97)
      .setStrokeStyle(3, 0x4a2c1a);
    t.setDepth(10); bg.setDepth(9);
    bg.alpha = 0; t.alpha = 0;
    this.tweens.add({ targets: [bg, t], alpha: 1, scale: { from: 0.92, to: 1 }, duration: 300, ease: 'Back.easeOut' });
    this.bubbleBg = bg;
    this.bubbleTxt = t;

    // Progress dots
    if (this.dotsContainer) this.dotsContainer.destroy();
    this.dotsContainer = this.add.container(cx, 220);
    for (let i = 0; i < this.bubbles.length; i++) {
      const filled = i === this.bubbleIndex;
      this.dotsContainer.add(this.add.circle(-30 + i * 20, 0, filled ? 6 : 4, filled ? 0xffeb3b : 0x8b6f3a, filled ? 1 : 0.6));
    }
  }

  advance() {
    this.bubbleIndex++;
    if (this.bubbleIndex >= this.bubbles.length) {
      this.finish();
    } else {
      this.showBubble();
    }
  }

  finish() {
    const save = SaveManager.load();
    save.stats.openingSeen = true;
    SaveManager.save(save);
    this.cameras.main.fadeOut(450, 255, 255, 255);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('TopDown', {});
    });
  }
}

// ============================================================
// EndingScene — closing beat after parrot finale + credits
// ============================================================
class EndingScene extends Phaser.Scene {
  constructor() { super('Ending'); }

  create() {
    const cam = this.cameras.main;
    const cw = cam.width, ch = cam.height;
    const cx = cw / 2;

    // Sunset background (matches parrot finale tone)
    this.add.rectangle(cx, 30, cw, 60, 0x3a1a4a);
    this.add.rectangle(cx, 90, cw, 50, 0x7b1fa2);
    this.add.rectangle(cx, 140, cw, 40, 0xc2185b);
    this.add.rectangle(cx, 185, cw, 30, 0xef5350);
    this.add.rectangle(cx, 215, cw, 25, 0xff7043);
    this.add.rectangle(cx, 245, cw, 25, 0xff9800);
    this.add.rectangle(cx, 275, cw, 20, 0xffb74d);
    // Sun
    this.add.circle(cx, 300, 60, 0xff7043, 0.85);
    this.add.circle(cx, 300, 40, 0xff9800);
    // Ground
    this.add.rectangle(cx, 560, cw, 100, 0x4a7a3a);
    this.add.rectangle(cx, 510, cw, 30, 0x66bb6a, 0.6);

    // All animals gathered in a row
    const groundY = 460;
    this.spawnRat(cx - 130, groundY, 0xf5f5f5, 0xffc4c4); // Snowy
    this.spawnRat(cx - 95,  groundY, 0x2a2a2a, 0xff8888); // Midnight
    this.spawnFinaleCrab(cx - 40, groundY);
    this.drawEndingSophia(cx, groundY - 18);
    this.spawnFinaleSnake(cx + 50, groundY + 4);
    this.spawnFinaleBat(cx + 100, groundY - 40);
    this.spawnFinaleParrot(cx + 140, groundY - 12);

    // Confetti continuous (slower cadence on low-tier devices)
    this.confettiTimer = this.time.addEvent({
      delay: tierScale(500, 250, 250), loop: true, callback: () => this.dropConfetti()
    });

    this.bubbleIndex = 0;
    this.bubbles = [
      '🎉 You did it, Sophia!',
      'All the animals are safe, and the party is in full swing!',
      'Snowy and Midnight have never been happier.',
      "You can visit your animal friends anytime — they'll always be here for you."
    ];

    this.tapHint = this.add.text(cx, ch - 36, 'Tap to continue', {
      fontFamily: 'DM Sans, Comic Sans MS, system-ui, sans-serif',
      fontSize: '13px', color: '#ffeb3b', fontStyle: 'italic',
      stroke: '#000000', strokeThickness: 2
    }).setOrigin(0.5, 0.5);
    this.tweens.add({ targets: this.tapHint, alpha: { from: 0.4, to: 1 }, duration: 1200, yoyo: true, repeat: -1 });

    this.bubbleBg = null;
    this.bubbleTxt = null;
    this.showBubble();

    this.input.on('pointerdown', () => this.advance());
    const keyHandler = (e) => {
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight') {
        e.preventDefault();
        this.advance();
      }
    };
    window.addEventListener('keydown', keyHandler);
    this.events.once('shutdown', () => window.removeEventListener('keydown', keyHandler));

    this.cameras.main.fadeIn(700, 255, 255, 255);
  }

  drawEndingSophia(x, y) {
    const c = this.add.container(x, y);
    c.add(this.add.ellipse(0, -8, 36, 38, 0x6b4423));
    c.add(this.add.triangle(0, 18, -22, 0, 22, 0, 0, 30, 0xff5e7e));
    c.add(this.add.rectangle(0, -2, 26, 22, 0xff8e9e));
    c.add(this.add.circle(0, -16, 14, 0xffd6b8));
    c.add(this.add.ellipse(0, -22, 26, 10, 0x6b4423));
    c.add(this.add.ellipse(-4, -16, 3, 4, 0x2a2a2a));
    c.add(this.add.ellipse(4, -16, 3, 4, 0x2a2a2a));
    c.add(this.add.ellipse(0, -10, 6, 2, 0xc62828));
    this.tweens.add({ targets: c, y: y - 5, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    return c;
  }

  spawnRat(x, y, body, ear) {
    const c = this.add.container(x, y);
    c.add(this.add.ellipse(0, 6, 22, 5, 0x000000, 0.35));
    c.add(this.add.ellipse(0, 0, 24, 14, body));
    c.add(this.add.circle(10, -1, 7, body));
    c.add(this.add.circle(12, -6, 3, ear));
    c.add(this.add.circle(12, 4, 3, ear));
    c.add(this.add.circle(13, -3, 1.2, 0x2a2a2a));
    c.add(this.add.circle(13, 3, 1.2, 0x2a2a2a));
    this.tweens.add({ targets: c, y: y - 4, duration: 1200 + Math.random() * 400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    return c;
  }

  spawnFinaleCrab(x, y) {
    const c = this.add.container(x, y);
    c.add(this.add.ellipse(0, 6, 32, 6, 0x000000, 0.35));
    c.add(this.add.ellipse(0, 0, 32, 22, 0xef5350));
    c.add(this.add.circle(-18, -4, 6, 0xef5350));
    c.add(this.add.circle(18, -4, 6, 0xef5350));
    c.add(this.add.circle(-5, -8, 2.5, 0xffffff));
    c.add(this.add.circle(5, -8, 2.5, 0xffffff));
    this.tweens.add({ targets: c, y: y - 4, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    return c;
  }

  spawnFinaleSnake(x, y) {
    const c = this.add.container(x, y);
    c.add(this.add.ellipse(0, 6, 30, 6, 0x000000, 0.35));
    for (let i = 0; i < 5; i++) c.add(this.add.circle(-12 + i * 6, Math.sin(i) * 4, 7, 0x66bb6a));
    c.add(this.add.circle(20, 0, 10, 0x66bb6a));
    c.add(this.add.circle(23, -3, 2, 0xffffff));
    c.add(this.add.circle(23, 3, 2, 0xffffff));
    this.tweens.add({ targets: c, y: y - 4, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    return c;
  }

  spawnFinaleBat(x, y) {
    const c = this.add.container(x, y);
    const wingL = this.add.triangle(-12, 0, 0, 0, 16, -8, 16, 8, 0x424242);
    const wingR = this.add.triangle(12, 0, 0, 0, -16, -8, -16, 8, 0x424242);
    c.add([wingL, wingR]);
    c.add(this.add.ellipse(0, 0, 16, 20, 0x424242));
    c.add(this.add.circle(0, -10, 9, 0x424242));
    c.add(this.add.circle(-3, -10, 2, 0xff5722));
    c.add(this.add.circle(3, -10, 2, 0xff5722));
    this.tweens.add({ targets: [wingL, wingR], scaleX: 0.4, duration: 200, yoyo: true, repeat: -1 });
    this.tweens.add({ targets: c, y: y - 6, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    return c;
  }

  spawnFinaleParrot(x, y) {
    const c = this.add.container(x, y);
    c.add(this.add.ellipse(0, 6, 22, 26, 0x42a5f5));
    c.add(this.add.circle(0, -10, 11, 0x42a5f5));
    c.add(this.add.triangle(8, -8, 0, -2, 0, 3, 8, 0, 0xffa726));
    c.add(this.add.ellipse(-8, 4, 8, 12, 0x1976d2));
    c.add(this.add.circle(3, -10, 2, 0xffffff));
    c.add(this.add.circle(3.5, -10, 1, 0x2a2a2a));
    this.tweens.add({ targets: c, y: y - 6, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    return c;
  }

  dropConfetti() {
    const cam = this.cameras.main;
    const colors = [0xff5e7e, 0xffeb3b, 0xa8e6cf, 0xb5d7f0, 0xd5b8e8, 0xff8e3c];
    const per = tierScale(1, 3, 3);
    for (let i = 0; i < per; i++) {
      const x = Math.random() * cam.width;
      const piece = this.add.rectangle(x, -10, 6, 10, Phaser.Math.RND.pick(colors));
      piece.setAngle(Math.random() * 360);
      this.tweens.add({
        targets: piece,
        y: cam.height + 30,
        x: x + Phaser.Math.Between(-60, 60),
        angle: piece.angle + 540 * (Math.random() > 0.5 ? 1 : -1),
        duration: 3500 + Math.random() * 1500,
        ease: 'Cubic.easeIn',
        onComplete: () => piece.destroy()
      });
    }
  }

  showBubble() {
    const cam = this.cameras.main;
    const cx = cam.width / 2;
    const bubbleY = 130;
    if (this.bubbleBg) this.bubbleBg.destroy();
    if (this.bubbleTxt) this.bubbleTxt.destroy();
    const text = this.bubbles[this.bubbleIndex];
    const t = this.add.text(cx, bubbleY, text, {
      fontFamily: 'DM Sans, Comic Sans MS, system-ui, sans-serif',
      fontSize: '22px', color: '#2a2a2a', fontStyle: 'bold', align: 'center',
      wordWrap: { width: cam.width - 80 }
    }).setOrigin(0.5, 0.5);
    const bg = this.add.rectangle(cx, bubbleY, t.width + 40, t.height + 28, 0xfffaf0, 0.97)
      .setStrokeStyle(3, 0x4a2c1a);
    t.setDepth(10); bg.setDepth(9);
    bg.alpha = 0; t.alpha = 0;
    this.tweens.add({ targets: [bg, t], alpha: 1, scale: { from: 0.92, to: 1 }, duration: 300, ease: 'Back.easeOut' });
    this.bubbleBg = bg;
    this.bubbleTxt = t;
  }

  advance() {
    this.bubbleIndex++;
    if (this.bubbleIndex >= this.bubbles.length) {
      this.showCredits();
    } else {
      this.showBubble();
    }
  }

  showCredits() {
    if (this.bubbleBg) this.bubbleBg.destroy();
    if (this.bubbleTxt) this.bubbleTxt.destroy();
    if (this.tapHint) this.tapHint.setVisible(false);

    const cam = this.cameras.main;
    const cx = cam.width / 2;
    const card = this.add.rectangle(cx, 220, 500, 200, 0xfffaf0, 0.97).setStrokeStyle(4, 0x4a2c1a);
    const txt = this.add.text(cx, 220,
      'Sophia and the Rat Jungle\n\nMade with love by\nSophia & Mum 💛\n\nThank you for playing!', {
      fontFamily: 'DM Sans, Comic Sans MS, system-ui, sans-serif',
      fontSize: '20px', color: '#4a2c1a', fontStyle: 'bold', align: 'center',
      wordWrap: { width: 460 }
    }).setOrigin(0.5, 0.5);
    card.alpha = 0; txt.alpha = 0;
    this.tweens.add({ targets: [card, txt], alpha: 1, duration: 600 });

    this.time.delayedCall(2000, () => this.showFinalButtons());
  }

  showFinalButtons() {
    const cam = this.cameras.main;
    const cx = cam.width / 2;
    const mk = (x, y, w, h, bg, fg, label, onClick) => {
      const shadow = this.add.rectangle(x + 4, y + 6, w, h, 0x000000, 0.3);
      const rect = this.add.rectangle(x, y, w, h, bg)
        .setStrokeStyle(4, 0x4a2c1a)
        .setInteractive({ useHandCursor: true });
      const t = this.add.text(x, y, label, {
        fontFamily: 'DM Sans, Comic Sans MS, system-ui, sans-serif',
        fontSize: '18px', color: fg, fontStyle: 'bold', align: 'center'
      }).setOrigin(0.5, 0.5);
      rect.on('pointerover', () => rect.setScale(1.04));
      rect.on('pointerout', () => rect.setScale(1));
      rect.on('pointerdown', onClick);
      [shadow, rect, t].forEach(el => el.alpha = 0);
      this.tweens.add({ targets: [shadow, rect, t], alpha: 1, duration: 400 });
      return { shadow, rect, t };
    };
    mk(cx, 410, 320, 60, 0xa8e6cf, '#1f5e44', '▶ Keep Exploring', () => this.exitToMap());
    mk(cx, 490, 320, 56, 0xffd3b6, '#7a3a14', '🌟 Play Again from Start', () => this.playAgain());
  }

  exitToMap() {
    this.cameras.main.fadeOut(500, 255, 255, 255);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('TopDown', {}));
  }

  playAgain() {
    if (!confirm('Start a brand new adventure? This will wipe your progress.')) return;
    SaveManager.reset();
    this.cameras.main.fadeOut(500, 255, 255, 255);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Title', {}));
  }
}

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: 800,
  height: 600,
  backgroundColor: '#2d8a3e',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [TitleScene, OpeningScene, TopDownScene, PeekScene, StopScene, EndingScene]
};

window.game = new Phaser.Game(config);

// Resize handler — Phaser FIT scales canvas automatically on parent
// resize, but we explicitly refresh on window resize for orientation
// changes (iPad) and detached windows. Debounced.
(function () {
  let timer = null;
  window.addEventListener('resize', () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      try { window.game.scale.refresh(); } catch (e) {}
    }, 150);
  });
  window.addEventListener('orientationchange', () => {
    setTimeout(() => { try { window.game.scale.refresh(); } catch (e) {} }, 200);
  });
})();

// First-pointer audio unlock at document level — belt and braces over
// the Title-button unlock for Pi Chromium autoplay policy.
(function () {
  const handler = () => {
    try { unlockAudio(); } catch (e) {}
    window.removeEventListener('pointerdown', handler, true);
    window.removeEventListener('touchstart', handler, true);
    window.removeEventListener('keydown', handler, true);
  };
  window.addEventListener('pointerdown', handler, true);
  window.addEventListener('touchstart', handler, true);
  window.addEventListener('keydown', handler, true);
})();

window.testStop = function (stopId) {
  const top = window.game.scene.getScene('TopDown');
  if (!top || !top.sys.isActive()) {
    console.log('TopDown not ready');
    return;
  }
  const spec = STOP_MARKERS.find(s => s.id === stopId);
  if (!spec) { console.log('Unknown stop:', stopId); return; }
  top.enterStop(spec);
};

window.completeStop = function (stopId) {
  const cfg = STOP_CONFIGS[stopId];
  if (!cfg) return;
  const save = SaveManager.load();
  save.puzzlesSolved[cfg.puzzleKey] = true;
  if (cfg.nextActKey) save.actsUnlocked[cfg.nextActKey] = true;
  if (cfg.partyItemKey) save.partyItems[cfg.partyItemKey] = (save.partyItems[cfg.partyItemKey] || 0) + 1;
  SaveManager.save(save);
  console.log('Marked', stopId, 'complete in save. Reload to see effect.');
};

window.testQuiz = function () {
  const top = window.game.scene.getScene('TopDown');
  if (!top || !top.sys.isActive()) {
    console.log('TopDown scene not ready yet');
    return null;
  }
  if (top.activeQuiz && top.activeQuiz.isOpen) {
    console.log('Quiz already open — dismissing previous');
    top.activeQuiz.dismiss();
  }
  const questions = [
    { question: 'What is 3 + 4?', answers: ['5', '6', '7', '8'], correctIndex: 2 },
    { question: 'How many legs does a spider have?', answers: ['4', '6', '8', '10'], correctIndex: 2 },
    { question: 'What sound does a cat make?', answers: ['Woof', 'Meow', 'Moo', 'Tweet'], correctIndex: 1 },
    { question: 'What colour is the sky on a sunny day?', answers: ['Red', 'Green', 'Blue', 'Yellow'], correctIndex: 2 },
    { question: 'What is 10 - 4?', answers: ['4', '5', '6', '7'], correctIndex: 2 }
  ];
  const q = new QuizManager(top, questions, {
    onComplete: () => console.log('[testQuiz] complete'),
    onWrong: (i) => console.log('[testQuiz] wrong answer', i)
  });
  q.start();
  window._currentQuiz = q;
  return q;
};
