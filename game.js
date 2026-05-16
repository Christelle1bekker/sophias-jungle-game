const SOPHIA_SPEED = 200;
const RAT_GAP = 40;
const RAT_LERP = 0.08;

const PEEK_SPOTS = [
  { id: 'waterfall', x: 700, y: 430 }
];

const BANANA_SPOTS = [
  { x: 430, y: 290 },
  { x: 170, y: 230 },
  { x: 360, y: 480 },
  { x: 160, y: 440 },
  { x: 540, y: 280 },
  { x: 260, y: 180 },
  { x: 610, y: 440 },
  { x: 60,  y: 90  },
  { x: 460, y: 555 },
  { x: 510, y: 540 }
];

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

    if (!this.registry.has('collectedBananas')) this.registry.set('collectedBananas', []);
    if (!this.registry.has('bananaCount')) this.registry.set('bananaCount', 0);

    for (let i = 0; i < 14; i++) {
      const x = Phaser.Math.Between(20, 780);
      const y = Phaser.Math.Between(20, 580);
      const r = Phaser.Math.Between(30, 80);
      const shade = Phaser.Math.RND.pick([0x3a9c4a, 0x267d3a, 0x4eb05c]);
      this.add.ellipse(x, y, r * 2, r, shade, 0.4);
    }

    this.add.rectangle(700, 70, 100, 18, 0x6b4423);
    this.add.rectangle(680, 78, 18, 12, 0x4a2c1a);
    this.add.rectangle(720, 78, 18, 12, 0x4a2c1a);
    this.add.rectangle(700, 200, 60, 250, 0x6fa8dc);
    this.add.rectangle(700, 200, 50, 250, 0xa3cef0, 0.7);
    for (let i = 0; i < 8; i++) {
      const drop = this.add.rectangle(
        700 + Phaser.Math.Between(-22, 22),
        90 + i * 30,
        Phaser.Math.Between(4, 8),
        Phaser.Math.Between(12, 22),
        0xffffff, 0.85
      );
      this.waterfallDrops.push(drop);
    }
    this.add.ellipse(700, 350, 150, 55, 0x2e6da4);
    this.add.ellipse(700, 350, 130, 45, 0x4a90c8);
    this.add.ellipse(700, 348, 100, 30, 0x6fa8dc, 0.7);
    this.add.ellipse(685, 345, 20, 6, 0xffffff, 0.6);
    this.add.ellipse(715, 352, 20, 6, 0xffffff, 0.6);

    this.makePalmTree(100, 150);
    this.makePalmTree(250, 500);
    this.makePalmTree(480, 110);
    this.makeRoundTree(180, 350);
    this.makeRoundTree(560, 500);
    this.makeRoundTree(380, 210);
    this.makePineTree(50, 400);
    this.makePineTree(330, 90);
    this.makePineTree(540, 380);

    this.makeStump(220, 240);
    this.makeStump(440, 410);
    this.makeStump(130, 510);

    const flowerColors = [0xff5e7e, 0xffe066, 0xff8e3c, 0xb967ff, 0xff6b6b, 0xffffff, 0xff4081, 0x9c27b0];
    for (let i = 0; i < 70; i++) {
      const x = Phaser.Math.Between(20, 780);
      const y = Phaser.Math.Between(20, 580);
      if (this.solids.some(s => Math.abs(s.x - x) < 30 && Math.abs(s.y - y) < 30)) continue;
      if (Math.abs(x - 700) < 75 && y > 50 && y < 380) continue;
      if (Math.abs(x - 700) < 30 && Math.abs(y - 430) < 30) continue;
      if (BANANA_SPOTS.some(b => Math.abs(b.x - x) < 25 && Math.abs(b.y - y) < 25)) continue;
      const c = Phaser.Math.RND.pick(flowerColors);
      const size = Phaser.Math.FloatBetween(4, 8);
      this.add.circle(x, y, size, c);
      this.add.circle(x, y, size * 0.4, 0xffeb3b);
    }

    for (const spot of PEEK_SPOTS) this.makePeekMarker(spot);

    const collected = this.registry.get('collectedBananas');
    BANANA_SPOTS.forEach((spot, i) => {
      if (collected.includes(i)) return;
      this.bananas.push(this.makeBanana(spot.x, spot.y, i));
    });

    const startX = (data && data.returnTo && data.returnTo.x) || 400;
    const startY = (data && data.returnTo && data.returnTo.y) || 300;
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

    this.makeCounterUI();

    this.cursors = this.input.keyboard.createCursorKeys();
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    this.cameras.main.fadeIn(350, 255, 255, 255);
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
      shadow,
      leftShoe, rightShoe,
      leftLeg, rightLeg,
      shortsBg, shortsHi,
      shirtBg, shirtHi, collar,
      leftArm, rightArm, handL, handR,
      hairBack, hairBackShade,
      face,
      bangs1, bangs2, bangs3,
      eyeL, eyeR, eyeLHi, eyeRHi,
      cheekL, cheekR,
      smile
    ]);
    c.hitW = 22;
    c.hitH = 30;
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
      shadow,
      tail,
      f1, f2, f3, f4,
      body, bodyShade,
      head, headShade,
      earL, earR, earLInner, earRInner,
      eyeL, eyeR, eyeLHi, eyeRHi,
      nose,
      whiskers
    ]);
    c.hitW = bodyW + 4;
    c.hitH = bodyH + 4;
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
    this.add.rectangle(78, 32, 132, 50, 0x000000, 0.55)
      .setStrokeStyle(3, 0xffeb3b, 0.9)
      .setOrigin(0.5, 0.5)
      .setScrollFactor(0);

    const iconG = this.add.graphics().setScrollFactor(0);
    iconG.x = 38; iconG.y = 32;
    this.drawBananaShape(iconG, 0.95);

    const count = this.registry.get('bananaCount');
    this.bananaText = this.add.text(60, 32, '× ' + count, {
      fontFamily: 'Comic Sans MS, Chalkboard SE, system-ui, sans-serif',
      fontSize: '26px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
      fontStyle: 'bold'
    }).setOrigin(0, 0.5).setScrollFactor(0);
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

  update(time, delta) {
    if (this.exiting) return;
    const step = SOPHIA_SPEED * (delta / 1000);
    let dx = 0, dy = 0;
    if (this.cursors.left.isDown)  dx -= step;
    if (this.cursors.right.isDown) dx += step;
    if (this.cursors.up.isDown)    dy -= step;
    if (this.cursors.down.isDown)  dy += step;

    const oldX = this.sophia.x, oldY = this.sophia.y;
    this.tryMove(this.sophia, dx, dy);
    this.sophia.x = Phaser.Math.Clamp(this.sophia.x, 16, 784);
    this.sophia.y = Phaser.Math.Clamp(this.sophia.y, 16, 584);
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
      if (drop.y > 330) { drop.y = 85; drop.x = 700 + Phaser.Math.Between(-22, 22); }
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

    for (let i = this.bananas.length - 1; i >= 0; i--) {
      const b = this.bananas[i];
      b.y = b.baseY + Math.sin(time / 400 + b.bobOffset) * 3;
      const d = Phaser.Math.Distance.Between(this.sophia.x, this.sophia.y, b.x, b.y);
      if (d < 26) {
        this.collectBanana(b);
        this.bananas.splice(i, 1);
      }
    }
  }

  followBehind(follower, leader, time, offset, label) {
    const dx = leader.x - follower.x;
    const dy = leader.y - follower.y;
    const dist = Math.hypot(dx, dy);
    const moving = dist > RAT_GAP;
    if (moving) {
      follower.x += dx * RAT_LERP;
      follower.y += dy * RAT_LERP;
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

  collectBanana(b) {
    playPickup();
    const collected = this.registry.get('collectedBananas');
    collected.push(b.id);
    this.registry.set('collectedBananas', collected);
    const count = this.registry.get('bananaCount') + 1;
    this.registry.set('bananaCount', count);
    this.bananaText.setText('× ' + count);

    this.tweens.add({
      targets: this.bananaText,
      scale: { from: 1.5, to: 1 },
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

    this.buildWaterfallView();
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
