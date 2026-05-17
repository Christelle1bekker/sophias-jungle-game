// ============================================================
// DISABLED: Flower Match Puzzle (Session 1-2 era)
// ============================================================
// Archived from game.js when Session 3 replaced the colour-match
// puzzle with the Sum Bridge (real maths). Kept here in case a
// future "little kid mode" wants to reintroduce it.
//
// Also archived: the bridge thought-bubble system (showSophiaThought
// / dismissSophiaThought), which was paired with the flower puzzle
// era as the bridge proximity hook.
//
// HOW TO RESTORE (rough notes for future-us):
// 1. Move FLOWER_PUZZLE + BRIDGE_HOOK constants back into game.js
//    top-of-file constants area.
// 2. Add methods (buildFlowerPuzzle, makePedestal, makeSlot,
//    makeCarryFlower, pickupFlower, dropFlower, checkPuzzleWin,
//    resetPuzzle, showSophiaThought, dismissSophiaThought) into
//    the TopDownScene class.
// 3. In TopDownScene.create(): re-init this.puzzle, call
//    this.buildFlowerPuzzle(), create this.spaceHint, set up
//    this.sophiaThought + this.bridgeHookActive, define
//    this.bridgeHookSpot (was set in buildRiverBridge).
// 4. In TopDownScene.update(): re-add the puzzle proximity check,
//    space hint visibility, space-down routing to pickup/drop,
//    carrying flower position update, puzzle reset on leaving area,
//    bridge thought-bubble proximity check, and sophiaThought
//    follow-Sophia position update.
// 5. The save shape change (puzzlesSolved.sumBridge replacing
//    .colourMatch in v2): bump save version again or add a separate
//    field — your call at that point.
// ============================================================

const FLOWER_PUZZLE = {
  center: { x: 1100, y: 320 },
  resetRadius: 520,
  interactRadius: 50,
  pedestals: [
    { id: 'red',    x: 970,  y: 410, color: 0xe53935, label: 'red' },
    { id: 'blue',   x: 1100, y: 410, color: 0x1976d2, label: 'blue' },
    { id: 'yellow', x: 1230, y: 410, color: 0xfdd835, label: 'yellow' }
  ],
  slots: [
    { id: 'blue',   x: 970,  y: 230, color: 0x1976d2, label: 'blue' },
    { id: 'yellow', x: 1100, y: 230, color: 0xfdd835, label: 'yellow' },
    { id: 'red',    x: 1230, y: 230, color: 0xe53935, label: 'red' }
  ]
};

const BRIDGE_HOOK_RADIUS = 110;
const BRIDGE_HOOK_DISMISS_RADIUS = 170;

// --- Methods that lived on TopDownScene ---

function buildFlowerPuzzle() {
  for (const ped of FLOWER_PUZZLE.pedestals) {
    this.puzzle.pedestalNodes.push(this.makePedestal(ped));
  }
  for (const slot of FLOWER_PUZZLE.slots) {
    this.puzzle.slotNodes.push(this.makeSlot(slot));
    this.puzzle.slotFilled[slot.id] = null;
  }
}

function makePedestal(spec) {
  this.add.ellipse(spec.x, spec.y + 28, 36, 10, 0x000000, 0.3);
  this.add.rectangle(spec.x, spec.y + 12, 22, 40, 0x6a6a6a).setOrigin(0.5, 0.5);
  this.add.rectangle(spec.x - 7, spec.y + 12, 5, 40, 0x4a4a4a);
  this.add.rectangle(spec.x + 7, spec.y + 12, 5, 40, 0x8a8a8a);
  this.add.ellipse(spec.x, spec.y - 6, 32, 12, 0x9a9a9a);
  this.add.ellipse(spec.x, spec.y - 8, 28, 10, 0xababab);
  const glow = this.add.circle(spec.x, spec.y - 14, 22, spec.color, 0.3);
  const flower = this.add.container(spec.x, spec.y - 14);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    flower.add(this.add.circle(Math.cos(a) * 7, Math.sin(a) * 7, 6, spec.color));
  }
  flower.add(this.add.circle(0, 0, 5, 0xffeb3b));
  flower.add(this.add.circle(0, 0, 2, 0xff8e3c));
  this.tweens.add({ targets: flower, y: spec.y - 18, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  this.tweens.add({ targets: glow, alpha: { from: 0.25, to: 0.6 }, duration: 1400, yoyo: true, repeat: -1 });
  this.solids.push({ x: spec.x, y: spec.y + 12, w: 22, h: 40 });
  return { spec, flower, glow, picked: false };
}

function makeSlot(spec) {
  this.add.ellipse(spec.x, spec.y + 10, 40, 8, 0x000000, 0.3);
  this.add.ellipse(spec.x, spec.y + 6, 40, 12, 0x4a2c1a);
  this.add.ellipse(spec.x, spec.y + 4, 38, 10, 0x6b4423);
  this.add.ellipse(spec.x, spec.y + 3, 32, 8, 0x8b5a2b);
  const ring = this.add.circle(spec.x, spec.y - 4, 14, spec.color, 0)
    .setStrokeStyle(3, spec.color, 0.95);
  const inner = this.add.circle(spec.x, spec.y - 4, 10, spec.color, 0.15);
  const labelColor = spec.id === 'red' ? '#e53935'
                   : spec.id === 'blue' ? '#1976d2' : '#fdd835';
  const text = this.add.text(spec.x, spec.y + 26, spec.label, {
    fontFamily: 'Comic Sans MS, Chalkboard SE, system-ui, sans-serif',
    fontSize: '18px',
    color: labelColor,
    stroke: '#000000',
    strokeThickness: 3,
    fontStyle: 'bold'
  }).setOrigin(0.5, 0);
  return { spec, ring, inner, text, filledFlower: null };
}

function makeCarryFlower(color) {
  const c = this.add.container(0, 0);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    c.add(this.add.circle(Math.cos(a) * 7, Math.sin(a) * 7, 6, color));
  }
  c.add(this.add.circle(0, 0, 5, 0xffeb3b));
  c.add(this.add.circle(0, 0, 2, 0xff8e3c));
  c.setDepth(700);
  return c;
}

function pickupFlower(pedestal) {
  if (this.puzzle.carrying) return;
  if (pedestal.picked) return;
  pedestal.picked = true;
  this.tweens.add({
    targets: [pedestal.flower, pedestal.glow],
    alpha: 0,
    scale: 0.5,
    duration: 220
  });
  this.puzzle.carrying = pedestal.spec.id;
  this.puzzle.carryFlower = this.makeCarryFlower(pedestal.spec.color);
  this.puzzle.carryFlower.x = this.sophia.x;
  this.puzzle.carryFlower.y = this.sophia.y - 40;
  this.puzzle.carryFlower.alpha = 0;
  this.puzzle.carryFlower.setScale(0.7);
  this.tweens.add({
    targets: this.puzzle.carryFlower,
    alpha: 1,
    scale: 1,
    duration: 250,
    ease: 'Back.easeOut'
  });
  playPickup();
}

function dropFlower(slot) {
  if (!this.puzzle.carrying) return;
  if (slot.filledFlower) return;
  const correct = (this.puzzle.carrying === slot.spec.id);
  if (correct) {
    const cf = this.puzzle.carryFlower;
    this.tweens.add({
      targets: cf,
      x: slot.spec.x,
      y: slot.spec.y - 4,
      scale: 0.85,
      duration: 280,
      ease: 'Cubic.easeOut'
    });
    slot.filledFlower = cf;
    this.puzzle.slotFilled[slot.spec.id] = this.puzzle.carrying;
    this.puzzle.carrying = null;
    this.puzzle.carryFlower = null;
    playPickup();
    this.checkPuzzleWin();
  } else {
    this.tweens.add({
      targets: slot.ring,
      x: { from: slot.spec.x - 6, to: slot.spec.x + 6 },
      duration: 60,
      yoyo: true,
      repeat: 4,
      onComplete: () => { slot.ring.x = slot.spec.x; }
    });
    this.tweens.add({
      targets: slot.inner,
      alpha: { from: 0.5, to: 0.15 },
      duration: 400
    });
    this.tweens.add({
      targets: this.puzzle.carryFlower,
      scale: { from: 1.25, to: 1 },
      duration: 200
    });
    playWrong();
  }
}

function checkPuzzleWin() {
  const all = Object.values(this.puzzle.slotFilled).every(v => v !== null);
  if (all && !this.puzzle.solved) {
    this.puzzle.solved = true;
    this.markPuzzleSolved('colourMatch');
    playFanfare();
    const cx = FLOWER_PUZZLE.center.x, cy = FLOWER_PUZZLE.center.y;
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      const star = this.add.star(cx, cy, 5, 5, 14, 0xffeb3b).setDepth(700);
      this.tweens.add({
        targets: star,
        x: cx + Math.cos(a) * 160,
        y: cy + Math.sin(a) * 120,
        scale: { from: 1.2, to: 0 },
        alpha: { from: 1, to: 0 },
        angle: 360,
        duration: 900,
        ease: 'Cubic.easeOut',
        onComplete: () => star.destroy()
      });
    }
    if (!this.puzzle.rewardSpawned) {
      this.puzzle.rewardSpawned = true;
      const rewardId = 1000 + Math.floor(Math.random() * 9000);
      const banana = this.makeBanana(cx, cy, rewardId);
      banana.alpha = 0;
      banana.setScale(0.4);
      this.tweens.add({
        targets: banana,
        alpha: 1,
        scale: 1,
        duration: 500,
        delay: 400,
        ease: 'Back.easeOut'
      });
      this.bananas.push(banana);
    }
  }
}

function resetPuzzle() {
  for (const ped of this.puzzle.pedestalNodes) {
    ped.picked = false;
    ped.flower.alpha = 1;
    ped.flower.setScale(1);
    ped.glow.alpha = 0.3;
    ped.glow.setScale(1);
  }
  for (const slot of this.puzzle.slotNodes) {
    if (slot.filledFlower) {
      slot.filledFlower.destroy();
      slot.filledFlower = null;
    }
    this.puzzle.slotFilled[slot.spec.id] = null;
  }
  if (this.puzzle.carryFlower) {
    this.puzzle.carryFlower.destroy();
    this.puzzle.carryFlower = null;
  }
  this.puzzle.carrying = null;
  this.puzzle.solved = false;
  this.puzzle.rewardSpawned = false;
}

function showSophiaThought(text) {
  if (this.sophiaThought) return;
  const c = this.add.container(this.sophia.x, this.sophia.y - 55);
  c.setDepth(900);
  const t = this.add.text(0, 0, text, {
    fontFamily: 'Comic Sans MS, Chalkboard SE, system-ui, sans-serif',
    fontSize: '15px',
    color: '#2a2a2a',
    fontStyle: 'bold'
  }).setOrigin(0.5, 0.5);
  const padX = 10, padY = 5;
  const bg = this.add.rectangle(0, 0, t.width + padX * 2, t.height + padY * 2, 0xffffff, 0.95)
    .setStrokeStyle(2, 0x333333);
  const tailY = t.height / 2 + padY + 6;
  const cloud1 = this.add.circle(-5, tailY, 4, 0xffffff, 0.95).setStrokeStyle(1.5, 0x333333);
  const cloud2 = this.add.circle(2, tailY + 5, 3, 0xffffff, 0.95).setStrokeStyle(1.5, 0x333333);
  c.add([bg, cloud1, cloud2, t]);
  c.alpha = 0;
  c.setScale(0.7);
  this.tweens.add({
    targets: c,
    alpha: 1,
    scale: 1,
    duration: 220,
    ease: 'Back.easeOut'
  });
  this.sophiaThought = c;
}

function dismissSophiaThought() {
  if (!this.sophiaThought) return;
  const c = this.sophiaThought;
  this.sophiaThought = null;
  this.tweens.add({
    targets: c,
    alpha: 0,
    scale: 0.8,
    duration: 250,
    onComplete: () => c.destroy()
  });
}

// --- Update-loop snippets from TopDownScene.update() ---

/*
// Flower puzzle proximity + space hint:
let puzzleInteract = null;
const pir = FLOWER_PUZZLE.interactRadius;
if (this.puzzle.carrying) {
  for (const slot of this.puzzle.slotNodes) {
    if (slot.filledFlower) continue;
    const d = Phaser.Math.Distance.Between(this.sophia.x, this.sophia.y, slot.spec.x, slot.spec.y);
    if (d < pir) { puzzleInteract = { kind: 'slot', node: slot }; break; }
  }
} else {
  for (const ped of this.puzzle.pedestalNodes) {
    if (ped.picked) continue;
    const d = Phaser.Math.Distance.Between(this.sophia.x, this.sophia.y, ped.spec.x, ped.spec.y);
    if (d < pir) { puzzleInteract = { kind: 'ped', node: ped }; break; }
  }
}

if (puzzleInteract) {
  this.spaceHint.x = this.sophia.x;
  this.spaceHint.y = this.sophia.y - 48;
  this.spaceHint.alpha += (1 - this.spaceHint.alpha) * 0.2;
} else {
  this.spaceHint.alpha += (0 - this.spaceHint.alpha) * 0.2;
}

if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
  if (nearest) {  // peek marker priority
    this.enterPeek(nearest.id, nearest.x, nearest.y);
  } else if (puzzleInteract) {
    if (puzzleInteract.kind === 'ped') this.pickupFlower(puzzleInteract.node);
    else this.dropFlower(puzzleInteract.node);
  }
}

if (this.puzzle.carryFlower) {
  this.puzzle.carryFlower.x = this.sophia.x;
  this.puzzle.carryFlower.y = this.sophia.y - 40 + Math.sin(time / 200) * 2;
}

if (this.puzzle.solved || this.puzzle.carrying || this.puzzle.pedestalNodes.some(p => p.picked)) {
  const dpc = Phaser.Math.Distance.Between(this.sophia.x, this.sophia.y, FLOWER_PUZZLE.center.x, FLOWER_PUZZLE.center.y);
  if (dpc > FLOWER_PUZZLE.resetRadius) this.resetPuzzle();
}

// Bridge thought-bubble proximity:
const bd = Phaser.Math.Distance.Between(this.sophia.x, this.sophia.y, this.bridgeHookSpot.x, this.bridgeHookSpot.y);
if (bd < BRIDGE_HOOK_RADIUS && !this.bridgeHookActive) {
  this.bridgeHookActive = true;
  this.showSophiaThought('I need 3 bananas.');
}
if (this.bridgeHookActive && bd > BRIDGE_HOOK_DISMISS_RADIUS) {
  this.bridgeHookActive = false;
  this.dismissSophiaThought();
}
if (this.sophiaThought) {
  this.sophiaThought.x = this.sophia.x;
  this.sophiaThought.y = this.sophia.y - 55;
}
*/
