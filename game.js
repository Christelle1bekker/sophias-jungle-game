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
  stats: {
    startedAt: null,
    lastPlayedAt: null,
    gameCompleted: false
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
    this.questionsToAsk = Math.min(3, questions.length);
    this.selectedQuestions = [];
    this.currentIndex = 0;
    this.modalElements = [];
    this.currentButtons = [];
    this.isOpen = false;
    this.dismissed = false;
    this._answering = false;
    this.keyHandlers = null;
  }

  start() {
    const pool = this.questions.slice();
    Phaser.Math.RND.shuffle(pool);
    this.selectedQuestions = pool.slice(0, this.questionsToAsk);
    this.currentIndex = 0;
    this.dismissed = false;
    this.isOpen = true;
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
    const cx = cw / 2, cy = ch / 2;

    const overlay = scene.add.rectangle(cx, cy, cw, ch, 0x000000, 0.55)
      .setScrollFactor(0).setDepth(2000).setInteractive();

    const cardW = 580, cardH = 440;
    const shadow = scene.add.rectangle(cx + 6, cy + 8, cardW, cardH, 0x000000, 0.3)
      .setScrollFactor(0).setDepth(2001);
    const card = scene.add.rectangle(cx, cy, cardW, cardH, 0xfffaf0)
      .setStrokeStyle(4, 0x4a2c1a)
      .setScrollFactor(0).setDepth(2001);

    const progress = scene.add.text(cx, cy - cardH / 2 + 26,
      'Question ' + (this.currentIndex + 1) + ' of ' + this.questionsToAsk, {
      fontFamily: 'DM Sans, Comic Sans MS, system-ui, sans-serif',
      fontSize: '16px',
      color: '#6b4423',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(2002);

    const questionText = scene.add.text(cx, cy - 90, q.question, {
      fontFamily: 'DM Sans, Comic Sans MS, system-ui, sans-serif',
      fontSize: '26px',
      color: '#2a2a2a',
      fontStyle: 'bold',
      align: 'center',
      wordWrap: { width: cardW - 60 }
    }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(2002);

    const btnW = 240, btnH = 90;
    const btnGapX = 24, btnGapY = 18;
    const btnColors = [0xa8e6cf, 0xffd3b6, 0xb5d7f0, 0xd5b8e8];
    const btnTextColors = ['#1f5e44', '#7a3a14', '#1a4a6e', '#4e2a6e'];
    const letters = ['A', 'B', 'C', 'D'];
    const gridTop = cy + 35;
    const buttons = [];
    for (let i = 0; i < 4; i++) {
      const col = i % 2, row = Math.floor(i / 2);
      const bx = cx + (col === 0 ? -(btnW / 2 + btnGapX / 2) : (btnW / 2 + btnGapX / 2));
      const by = gridTop + (row === 0 ? -(btnH / 2 + btnGapY / 2) : (btnH / 2 + btnGapY / 2));
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
      buttons.push({ bg, letter, answerText, originalColor: btnColors[i] });
    }

    const closeR = 18;
    const closeBg = scene.add.circle(cx + cardW / 2 - closeR - 8, cy - cardH / 2 + closeR + 8, closeR, 0xff6b6b)
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

    this.modalElements = [overlay, shadow, card, progress, questionText, closeBg, closeText];
    for (const b of buttons) {
      this.modalElements.push(b.bg, b.letter, b.answerText);
    }
    this.currentButtons = buttons;

    this._installKeyHandlers();
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
      this.scene.time.delayedCall(550, () => {
        this._answering = false;
        this.currentIndex++;
        this._showCurrent();
      });
    } else {
      this._flashButton(btn, 0xef5350);
      playWrong();
      this.onWrong(index);
    }
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
    this.stopMarkers = [];
    this.breadcrumbGraphics = this.add.graphics().setDepth(40);
    this.pathHighlightUntil = 0;
    this.buildStopMarkers();

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
    const modalActive = quizOpen || this.placeholderOpen;
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

    const elements = [groundShadow, outerGlow, midGlow, padBase, padTop, padRim, ...silhouetteParts, lockedRing, lockedQuestion];
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
      if (this.isStopUnlocked(spec)) this.showStopPlaceholder(spec);
      else this.showLockedToast(spec);
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
      if (this.isStopUnlocked(nearest.spec)) this.showStopPlaceholder(nearest.spec);
      else this.showLockedToast(nearest.spec);
    }
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

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: 800,
  height: 600,
  backgroundColor: '#2d8a3e',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [TopDownScene, PeekScene]
};

window.game = new Phaser.Game(config);

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
