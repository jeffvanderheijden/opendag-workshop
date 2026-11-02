import Phaser from 'phaser';

const TILE_W = 80, TILE_H = 40;
const OX = 560, OY = 150;
const iso = (x, y) => ({ x: OX + (x - y) * TILE_W / 2, y: OY + (x + y) * TILE_H / 2 });

const CORRIDOR = { x1: 4, x2: 31, y1: 6, y2: 7 };
const CLASSROOMS = [
  { name: 'B5.410', x1: 6,  x2: 9,  y1: 1, y2: 5 },
  { name: 'B5.420', x1: 10, x2: 13, y1: 1, y2: 5 },
  { name: 'B5.430', x1: 14, x2: 17, y1: 1, y2: 5 },
  { name: 'B5.440', x1: 18, x2: 21, y1: 1, y2: 5 },
  { name: 'B5.450', x1: 22, x2: 25, y1: 1, y2: 5 },
];
const STAIRS = [
  { name: 'LIFT / TRAP', x1: 8,  x2: 10, y1: 8, y2: 11 },
  { name: 'TRAPPENHUIS', x1: 16, x2: 18, y1: 8, y2: 11 },
  { name: 'TRAPPENHUIS', x1: 24, x2: 26, y1: 8, y2: 11 },
];
const END400 = { name: 'B5.400', x1: 0,  x2: 3,  y1: 4, y2: 9 };
const END460 = { name: 'B5.460', x1: 32, x2: 35, y1: 4, y2: 9 };
const WALKABLE = [CORRIDOR, ...CLASSROOMS, ...STAIRS, END400, END460];

function pointInRect(x, y, r) { return x >= r.x1 - .28 && x <= r.x2 + .28 && y >= r.y1 - .28 && y <= r.y2 + .28; }
function nearestPointOnRect(x, y, r) { return { x: Phaser.Math.Clamp(x, r.x1, r.x2), y: Phaser.Math.Clamp(y, r.y1, r.y2) }; }
function nearestWalkable(x, y) {
  for (const r of WALKABLE) if (pointInRect(x, y, r)) return { x, y };
  let best = null, bestD = Infinity;
  for (const r of WALKABLE) {
    const p = nearestPointOnRect(x, y, r);
    const d = (p.x - x) ** 2 + (p.y - y) ** 2;
    if (d < bestD) { bestD = d; best = p; }
  }
  return best;
}

function diamond(g, p, fill, line = 0x596879, alpha = .18) {
  g.fillStyle(fill, 1);
  g.lineStyle(1, line, alpha);
  const pts = [
    { x: p.x, y: p.y },
    { x: p.x + TILE_W / 2, y: p.y + TILE_H / 2 },
    { x: p.x, y: p.y + TILE_H },
    { x: p.x - TILE_W / 2, y: p.y + TILE_H / 2 },
  ];
  g.fillPoints(pts, true);
  g.strokePoints(pts, true);
}
function quad(g, pts, fill, line, alpha = .9) {
  g.fillStyle(fill, 1);
  g.lineStyle(2, line, alpha);
  g.fillPoints(pts, true);
  g.strokePoints(pts, true);
}
function wallFace(g, a, b, h, fill, line, accent = null) {
  quad(g, [{ x: a.x, y: a.y }, { x: b.x, y: b.y }, { x: b.x, y: b.y - h }, { x: a.x, y: a.y - h }], fill, line);
  if (accent !== null) {
    g.lineStyle(3, accent, .85);
    g.lineBetween(a.x, a.y - h + 8, b.x, b.y - h + 8);
  }
}
function panelLabel(scene, x, y, text, size = '10px', depth = 900) {
  return scene.add.text(x, y, text, {
    fontFamily: 'monospace', fontSize: size, fontStyle: 'bold',
    color: '#f5f7f9', backgroundColor: '#192433', padding: { x: 6, y: 4 }
  }).setOrigin(.5).setDepth(depth);
}

function doorGapForRoom(room) {
  const center = (room.x1 + room.x2 + 1) / 2;
  return { start: center - .45, end: center + .45 };
}

export function makePixelCampusScene({ done, lockedRef, talkRef }) {
  return class PixelCampusScene extends Phaser.Scene {
    constructor() {
      super({ key: 'PixelCampus' });
      this.nearId = null;
      this.frameIndex = 0;
      this.lastFrame = 0;
      this.facing = 'south-east';
      this.animationMode = null;
    }
    preload() {
      for (const dir of ['south-east', 'south-west', 'north-east', 'north-west']) {
        this.load.image(`player_${dir}_idle`, `/assets/player/${dir}_idle.png`);
        for (let f = 0; f < 6; f++) this.load.image(`player_${dir}_${f}`, `/assets/player/${dir}_walk_${f}.png`);
        for (let f = 0; f < 4; f++) this.load.image(`player_${dir}_run_${f}`, `/assets/player/${dir}_run_${f}.png`);
      }
      for (const teacher of [0, 1, 2, 3]) {
        for (const dir of ['south-west', 'south-east', 'north-west', 'north-east']) {
          this.load.image(`teacher_${teacher}_${dir}`, `/assets/teachers/teacher${teacher}_${dir}.png`);
        }
      }
    }
    create() {
      this.cameras.main.setBackgroundColor('#111923');

      const floor = this.add.graphics().setDepth(-300);
      const walls = this.add.graphics().setDepth(-260);
      const glass = this.add.graphics().setDepth(-245);
      const details = this.add.graphics().setDepth(-244);

      // corridor floor with dark edges and lighter center strip
      for (let x = CORRIDOR.x1; x <= CORRIDOR.x2; x++) {
        for (let y = CORRIDOR.y1; y <= CORRIDOR.y2; y++) {
          diamond(floor, iso(x, y), y === 6 ? 0x202933 : 0x455463, 0x667484, .18);
        }
      }
      // classroom floors (empty rooms)
      for (const r of CLASSROOMS) {
        for (let x = r.x1; x <= r.x2; x++) for (let y = r.y1; y <= r.y2; y++) diamond(floor, iso(x, y), 0x4f5f6d, 0x69798a, .16);
      }
      // stair / lift recesses
      for (const r of STAIRS) {
        for (let x = r.x1; x <= r.x2; x++) for (let y = r.y1; y <= r.y2; y++) diamond(floor, iso(x, y), 0x2a333d, 0x556273, .18);
      }
      // head rooms
      for (const r of [END400, END460]) {
        for (let x = r.x1; x <= r.x2; x++) for (let y = r.y1; y <= r.y2; y++) diamond(floor, iso(x, y), 0x465564, 0x6b7b8d, .18);
      }

      // upper classroom back wall and lower service-side wall segments
      wallFace(walls, iso(5, 1), iso(26, 1), 88, 0xcdd3d8, 0x7f8a95);
      const lowerSegments = [[4, 8], [11, 16], [19, 24], [27, 31]];
      for (const [a, b] of lowerSegments) wallFace(walls, iso(a, 12), iso(b, 12), 88, 0x756a5f, 0x463d36);
      wallFace(walls, iso(0, 4), iso(0, 10), 92, 0xb4bcc4, 0x67727d, 0x78c841);
      wallFace(walls, iso(36, 4), iso(36, 10), 92, 0xb4bcc4, 0x67727d, 0x78c841);

      // classroom glass fronts with centered door openings
      const drawClassroomFront = (r) => {
        const y = 6, h = 80;
        const { start, end } = doorGapForRoom(r);
        const leftA = iso(r.x1, y), leftB = iso(start, y);
        const rightA = iso(end, y), rightB = iso(r.x2 + 1, y);
        glass.lineStyle(2, 0xeaf5ff, .78);
        glass.lineBetween(leftA.x, leftA.y, leftB.x, leftB.y);
        glass.lineBetween(rightA.x, rightA.y, rightB.x, rightB.y);
        glass.lineStyle(2, 0xb9c7d3, .52);
        glass.lineBetween(leftA.x, leftA.y - h, leftB.x, leftB.y - h);
        glass.lineBetween(rightA.x, rightA.y - h, rightB.x, rightB.y - h);
        for (let x = r.x1; x <= r.x2 + 1; x++) {
          if (x > start - .05 && x < end + .05) continue;
          const p = iso(x, y);
          glass.lineStyle(2, 0xc4d0da, .52);
          glass.lineBetween(p.x, p.y, p.x, p.y - h);
        }
        for (const x of [start, end]) {
          const p = iso(x, y);
          glass.lineStyle(3, 0xffffff, .82);
          glass.lineBetween(p.x, p.y, p.x, p.y - h);
        }
        // small room-number plaque just above the entrance
        const lp = iso((start + end) / 2, y - .12);
        panelLabel(this, lp.x, lp.y - 28, r.name, '10px', 905);
      };
      CLASSROOMS.forEach(drawClassroomFront);

      // end rooms with door openings facing the corridor
      const drawEndFront = (r, xBoundary, labelText) => {
        const h = 80, start = 5.6, end = 7.3;
        const topA = iso(xBoundary, r.y1), topB = iso(xBoundary, start);
        const botA = iso(xBoundary, end), botB = iso(xBoundary, r.y2 + 1);
        glass.lineStyle(2, 0xeaf5ff, .78);
        glass.lineBetween(topA.x, topA.y, topB.x, topB.y);
        glass.lineBetween(botA.x, botA.y, botB.x, botB.y);
        glass.lineStyle(2, 0xb9c7d3, .52);
        glass.lineBetween(topA.x, topA.y - h, topB.x, topB.y - h);
        glass.lineBetween(botA.x, botA.y - h, botB.x, botB.y - h);
        for (const y of [r.y1, r.y2 + 1]) {
          const p = iso(xBoundary, y);
          glass.lineStyle(2, 0xc4d0da, .52);
          glass.lineBetween(p.x, p.y, p.x, p.y - h);
        }
        for (const y of [start, end]) {
          const p = iso(xBoundary, y);
          glass.lineStyle(3, 0xffffff, .82);
          glass.lineBetween(p.x, p.y, p.x, p.y - h);
        }
        const lp = iso(xBoundary + (xBoundary < CORRIDOR.x1 ? .55 : -.55), (start + end) / 2);
        panelLabel(this, lp.x, lp.y - 34, labelText, '10px', 905);
      };
      drawEndFront(END400, 4, 'B5.400');
      drawEndFront(END460, 31, 'B5.460');

      // lower openings (stairs/lift)
      for (const e of STAIRS) {
        const a = iso(e.x1, 8), b = iso(e.x2 + 1, 8);
        details.lineStyle(4, 0x4d3b2c, .95);
        details.lineBetween(a.x, a.y, b.x, b.y);
        details.lineStyle(3, 0x2e2621, .8);
        details.lineBetween(a.x, a.y - 84, b.x, b.y - 84);
        const lp = iso((e.x1 + e.x2) / 2 + .5, 8.3);
        panelLabel(this, lp.x, lp.y + 14, e.name, '9px', 880);
      }

      // hallway info screens
      for (const pos of [[18.2, 11.2], [26.4, 11.2]]) {
        const p = iso(pos[0], pos[1]);
        details.fillStyle(0x78c841, 1).fillRect(p.x - 14, p.y - 74, 28, 12);
        details.lineStyle(2, 0x374438, .85).strokeRect(p.x - 14, p.y - 74, 28, 12);
      }

      for (const key of this.textures.getTextureKeys()) {
        if (key.startsWith('player_') || key.startsWith('teacher_')) this.textures.get(key).setFilter(Phaser.Textures.FilterMode.LINEAR);
      }

      const start = iso(5.1, 6.45);
      this.player = this.physics.add.sprite(start.x, start.y, 'player_south-east_idle').setOrigin(.5, 64 / 68).setScale(1.15);
      this.player.body.setSize(14, 9).setOffset(27, 56);
      this.player.setDepth(this.player.y + 20);
      this.playerName = this.add.text(start.x, start.y + 8, 'JIJ', {
        fontFamily: 'monospace', fontSize: '11px', fontStyle: 'bold', color: '#fff', backgroundColor: '#192433', padding: { x: 7, y: 4 }
      }).setOrigin(.5, 0).setDepth(1100);

      this.actors = [];
      const actorDefs = [
        { id: 'sam',   name: 'MR. VAN DER HEIJDEN', teacher: 0, gx: 7.2,  gy: 6.45 },
        { id: 'css',   name: 'MVR. HEINSDIJK',     teacher: 1, gx: 14.8, gy: 6.45 },
        { id: 'game',  name: 'MVR. GOLDEWIJK',     teacher: 3, gx: 22.2, gy: 6.45 },
        { id: 'final', name: 'MR. BIJLSMA',        teacher: 2, gx: 29.0, gy: 6.45, final: true },
      ];
      for (const { id, name, teacher, gx, gy, final = false } of actorDefs) {
        const pos = iso(gx, gy);
        const completed = done.includes(id);
        const enabled = !final || ['sam', 'css', 'game'].every(q => done.includes(q));
        const actor = this.add.image(pos.x, pos.y, `teacher_${teacher}_south-west`).setScale(.82).setOrigin(.5, 64 / 68).setDepth(pos.y + 10);
        const nameTag = this.add.text(pos.x, pos.y + 8, name, {
          fontFamily: 'monospace', fontSize: '10px', fontStyle: 'bold', color: '#fff', backgroundColor: '#192433', padding: { x: 6, y: 4 }
        }).setOrigin(.5, 0).setDepth(1100);
        const marker = this.add.text(pos.x, pos.y - 62, completed ? '✓' : enabled ? '!' : '…', {
          fontFamily: 'Arial Black', fontSize: '29px', color: completed ? '#78c841' : '#78c841', stroke: '#1b2535', strokeThickness: 6
        }).setOrigin(.5).setDepth(1101);
        if (!completed && enabled) this.tweens.add({ targets: marker, y: pos.y - 70, duration: 700, yoyo: true, repeat: -1 });
        this.actors.push({ id, actor, nameTag, marker, enabled, teacher });
      }

      this.prompt = this.add.text(0, 0, 'E  PRAAT', {
        fontFamily: 'monospace', fontStyle: 'bold', fontSize: '14px', color: '#151d28', backgroundColor: '#78c841', padding: { x: 11, y: 7 }
      }).setOrigin(.5).setDepth(1200).setVisible(false);

      this.keys = this.input.keyboard.addKeys({ w: 'W', a: 'A', s: 'S', d: 'D', shift: 'SHIFT' });
      this.arrows = this.input.keyboard.createCursorKeys();
      this.lastMoveKey = 'd';
      for (const key of ['W', 'A', 'S', 'D']) this.input.keyboard.on(`keydown-${key}`, () => { this.lastMoveKey = key.toLowerCase(); });
      this.input.keyboard.on('keydown-UP', () => { this.lastMoveKey = 'w'; });
      this.input.keyboard.on('keydown-LEFT', () => { this.lastMoveKey = 'a'; });
      this.input.keyboard.on('keydown-DOWN', () => { this.lastMoveKey = 's'; });
      this.input.keyboard.on('keydown-RIGHT', () => { this.lastMoveKey = 'd'; });
      this.input.keyboard.on('keydown-E', event => {
        const el = event?.target;
        const editing = el && (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT' || el.isContentEditable);
        if (!editing && !lockedRef.current && this.nearId) talkRef.current(this.nearId);
      });

      const corners = [iso(-2, 0), iso(37, 0), iso(37, 13), iso(-2, 13)];
      const minX = Math.min(...corners.map(p => p.x)) - 220, maxX = Math.max(...corners.map(p => p.x)) + 220;
      const minY = Math.min(...corners.map(p => p.y)) - 180, maxY = Math.max(...corners.map(p => p.y)) + 180;
      this.cameras.main.setBounds(minX, minY, maxX - minX, maxY - minY);
      this.cameras.main.startFollow(this.player, true, .09, .09);
      this.cameras.main.setDeadzone(320, 220);
      this.cameras.main.setZoom(1.08);
      this.cameras.main.centerOn(start.x, start.y);
    }

    update(t) {
      if (!this.player) return;
      if (lockedRef.current) { this.player.body.setVelocity(0); return; }

      const k = this.keys, a = this.arrows;
      const held = { w: k.w.isDown || a.up.isDown, a: k.a.isDown || a.left.isDown, s: k.s.isDown || a.down.isDown, d: k.d.isDown || a.right.isDown };
      const active = Object.values(held).some(Boolean);
      let chosen = null;
      if (active) chosen = held[this.lastMoveKey] ? this.lastMoveKey : (['w', 'a', 's', 'd'].find(key => held[key]) || null);
      const gx = chosen === 'd' ? 1 : chosen === 'a' ? -1 : 0;
      const gy = chosen === 's' ? 1 : chosen === 'w' ? -1 : 0;
      const sprinting = active && k.shift.isDown;
      const vx = gx - gy, vy = gx + gy, speed = sprinting ? 1.7 : 1;
      this.player.body.setVelocity(vx * 133 * speed, vy * 68 * speed);

      if (active) {
        if (vx >= 0 && vy < 0) this.facing = 'north-east';
        else if (vx < 0 && vy <= 0) this.facing = 'north-west';
        else if (vx <= 0 && vy > 0) this.facing = 'south-west';
        else this.facing = 'south-east';
        const mode = sprinting ? 'run' : 'walk';
        const count = sprinting ? 4 : 6;
        const duration = sprinting ? 85 : 115;
        if (this.animationMode !== mode) { this.animationMode = mode; this.frameIndex = 0; this.lastFrame = t; }
        else if (t - this.lastFrame >= duration) { this.frameIndex = (this.frameIndex + 1) % count; this.lastFrame = t; }
        const key = sprinting ? `player_${this.facing}_run_${this.frameIndex}` : `player_${this.facing}_${this.frameIndex}`;
        if (this.player.texture.key !== key) this.player.setTexture(key);
      } else {
        this.frameIndex = 0; this.animationMode = null;
        const key = `player_${this.facing}_idle`;
        if (this.player.texture.key !== key) this.player.setTexture(key);
      }

      const dx = (this.player.x - OX) / (TILE_W / 2), dy = (this.player.y - OY) / (TILE_H / 2);
      let cx = (dx + dy) / 2, cy = (dy - dx) / 2;
      const valid = nearestWalkable(cx, cy);
      cx = valid.x; cy = valid.y;
      const bounded = iso(cx, cy);
      this.player.setPosition(bounded.x, bounded.y);
      this.player.setDepth(this.player.y + 20);
      this.playerName.setPosition(this.player.x, this.player.y + 8);

      this.nearId = null;
      let best = 88;
      for (const n of this.actors) {
        const lx = this.player.x - n.actor.x, ly = this.player.y - n.actor.y;
        const desiredDir = ly >= 0 ? (lx >= 0 ? 'south-east' : 'south-west') : (lx >= 0 ? 'north-east' : 'north-west');
        // Teacher 1 (Mvr. Heinsdijk) has a bad north-west asset; use the north-east asset mirrored so she can correctly look upper-left.
        let tex = `teacher_${n.teacher}_${desiredDir}`;
        let flip = false;
        if (n.teacher === 1 && desiredDir === 'north-west') {
          tex = 'teacher_1_north-east';
          flip = true;
        }
        n.actor.setFlipX(flip);
        if (n.actor.texture.key !== tex) n.actor.setTexture(tex);
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, n.actor.x, n.actor.y);
        if (n.enabled && dist < best) { best = dist; this.nearId = n.id; }
      }
      this.prompt.setVisible(!!this.nearId);
      if (this.nearId) this.prompt.setPosition(this.player.x, this.player.y - 80);
    }
  };
}
