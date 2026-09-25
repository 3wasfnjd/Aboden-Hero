import * as T from './vendor/three.js';

const TAU = Math.PI * 2;
const mix = (a, b, t) => a + (b - a) * t;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const angleMix = (a, b, t) => a + Math.atan2(Math.sin(b - a), Math.cos(b - a)) * t;

function canvasTexture(draw, size = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  draw(canvas.getContext('2d'), size);
  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  return texture;
}

function symbol(ctx, index, x, y, radius) {
  ctx.save(); ctx.translate(x, y); ctx.strokeStyle = '#3a291a'; ctx.fillStyle = '#3a291a'; ctx.lineWidth = radius * .14;
  if (index === 0) {
    ctx.beginPath(); ctx.arc(0, 0, radius * .43, 0, TAU); ctx.stroke();
    for (let i = 0; i < 8; i++) { const a = i * TAU / 8; ctx.beginPath(); ctx.moveTo(Math.cos(a) * radius * .66, Math.sin(a) * radius * .66); ctx.lineTo(Math.cos(a) * radius, Math.sin(a) * radius); ctx.stroke(); }
  } else if (index === 1) {
    ctx.beginPath(); ctx.moveTo(-radius * .7, radius * .7); ctx.bezierCurveTo(-radius, -radius, radius, -radius, radius * .72, -radius * .72); ctx.bezierCurveTo(radius, radius, -radius, radius, -radius * .7, radius * .7); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-radius * .7, radius * .7); ctx.lineTo(radius * .62, -radius * .62); ctx.stroke();
  } else if (index === 2) {
    ctx.beginPath(); ctx.arc(0, 0, radius * .9, .35 * Math.PI, 1.7 * Math.PI); ctx.bezierCurveTo(-radius * .2, -radius * .45, -radius * .35, radius * .5, radius * .4, radius * .78); ctx.closePath(); ctx.fill();
  } else if (index === 3) {
    ctx.beginPath(); ctx.moveTo(0, -radius); ctx.bezierCurveTo(-radius * 1.5, radius * .7, -radius * .2, radius * 1.3, radius * .58, radius * .62); ctx.bezierCurveTo(radius, radius * .2, radius * .2, -radius * .65, 0, -radius); ctx.stroke();
  } else if (index === 4) {
    ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 - Math.PI / 2, r = i % 2 ? radius * .43 : radius; const x = Math.cos(a) * r, y = Math.sin(a) * r; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); } ctx.closePath(); ctx.stroke();
  } else { ctx.beginPath(); ctx.moveTo(0, -radius); ctx.lineTo(radius * .65, 0); ctx.lineTo(0, radius); ctx.lineTo(-radius * .65, 0); ctx.closePath(); ctx.fill(); }
  ctx.restore();
}

function woodTexture() {
  return canvasTexture((ctx, n) => {
    let seed = 91871;
    const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    ctx.fillStyle = '#765137'; ctx.fillRect(0, 0, n, n);
    for (let i = 0; i < 1450; i++) {
      const y = random() * n, amplitude = 2 + random() * 8;
      ctx.strokeStyle = random() > .43 ? `rgba(27,14,8,${random() * .15})` : `rgba(196,153,99,${random() * .13})`;
      ctx.lineWidth = .3 + random() * 1.4; ctx.beginPath();
      for (let x = 0; x <= n; x += 8) { const yy = y + Math.sin(x * .012 + y * .028) * amplitude + Math.sin(x * .035 + y) * 1.8; if (x) ctx.lineTo(x, yy); else ctx.moveTo(x, yy); } ctx.stroke();
    }
    for (let i = 0; i < 70; i++) { ctx.strokeStyle = `rgba(24,15,9,${.08 * (1 - i / 80)})`; ctx.beginPath(); ctx.ellipse(n * .73, n * .37, 4 + i * 2.5, 1 + i * .8, .1, 0, TAU); ctx.stroke(); }
  });
}

export class BoxScene {
  constructor(host, { onAction, onError }) {
    this.host = host; this.onAction = onAction; this.onError = onError;
    this.abort = new AbortController(); this.disposed = false; this.running = true;
    this.reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.state = null; this.stage = 0; this.selectedWeight = -1; this.targets = []; this.rings = []; this.gears = []; this.slides = []; this.weights = []; this.digitMeshes = [];
    this.view = { yaw: .61, pitch: .36, distance: 6.9 }; this.desiredView = { ...this.view }; this.look = new T.Vector3(0, 1.25, 0);
    this.renderer = new T.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.6));
    this.renderer.outputColorSpace = T.SRGBColorSpace;
    this.renderer.toneMapping = T.ACESFilmicToneMapping; this.renderer.toneMappingExposure = 1.25;
    this.renderer.shadowMap.enabled = true; this.renderer.shadowMap.type = T.PCFSoftShadowMap;
    host.append(this.renderer.domElement);
    this.scene = new T.Scene(); this.camera = new T.PerspectiveCamera(39, 1, .1, 45);
    this.scene.add(new T.HemisphereLight(0xd6e5ef, 0x795336, 2.25));
    const key = new T.DirectionalLight(0xffe1b0, 4.0); key.position.set(4, 7, 5); key.castShadow = true; key.shadow.mapSize.set(1024, 1024); key.shadow.camera.left = -6; key.shadow.camera.right = 6; key.shadow.camera.top = 6; key.shadow.camera.bottom = -6; key.shadow.normalBias = .025; this.scene.add(key);
    const fill = new T.DirectionalLight(0x9fc6e6, 2.2); fill.position.set(-4, 3, -3); this.scene.add(fill);
    const room = new T.RoomEnvironment(); const pmrem = new T.PMREMGenerator(this.renderer); this.environment = pmrem.fromScene(room, .04); this.scene.environment = this.environment.texture; room.dispose(); pmrem.dispose();
    this.woodMap = woodTexture();
    this.materials = {
      wood: new T.MeshStandardMaterial({ color: 0xc6a078, map: this.woodMap, roughness: .72 }),
      darkWood: new T.MeshStandardMaterial({ color: 0x735c42, map: this.woodMap, roughness: .8 }),
      brass: new T.MeshStandardMaterial({ color: 0xc3a366, metalness: .75, roughness: .38 }),
      darkBrass: new T.MeshStandardMaterial({ color: 0x72572e, metalness: .6, roughness: .53 }),
      inset: new T.MeshStandardMaterial({ color: 0x191c1b, metalness: .3, roughness: .7 }),
      highlight: new T.MeshStandardMaterial({ color: 0xe9ce8c, metalness: .65, roughness: .3 })
    };
    const floor = this.mesh(new T.CylinderGeometry(4.5, 4.6, .18, 80), new T.MeshStandardMaterial({ color: 0x242d30, roughness: .82 }), this.scene); floor.position.y = -.12; floor.receiveShadow = true;
    const circle = this.mesh(new T.TorusGeometry(4.14, .007, 4, 100), this.materials.darkBrass, this.scene); circle.rotation.x = Math.PI / 2; circle.position.y = -.025;
    this.assembly = new T.Group(); this.assembly.position.y = 1.34; this.scene.add(this.assembly);
    this.buildBox();
    this.raycaster = new T.Raycaster(); this.pointer = new T.Vector2(); this.pointers = new Map();
    this.bindInput();
    this.resizeObserver = new ResizeObserver(() => this.resize()); this.resizeObserver.observe(host); this.resize();
    this.lastFrame = 0; this.renderer.setAnimationLoop(time => this.frame(time));
  }

  mesh(geometry, material, parent = this.assembly) { const object = new T.Mesh(geometry, material); object.castShadow = true; object.receiveShadow = true; parent.add(object); return object; }
  block(parent, size, pos, material = this.materials.wood, radius = .025) { const m = this.mesh(new T.RoundedBoxGeometry(...size, 2, radius), material, parent); m.position.set(...pos); return m; }
  cylinder(parent, radius, height, pos, material = this.materials.brass, segments = 32) { const m = this.mesh(new T.CylinderGeometry(radius, radius, height, segments), material, parent); m.position.set(...pos); return m; }
  decal(parent, texture, width, height, pos, rotation = [0, 0, 0]) { const material = new T.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }); const m = this.mesh(new T.PlaneGeometry(width, height), material, parent); m.position.set(...pos); m.rotation.set(...rotation); m.castShadow = false; return m; }
  moving(parent, pos, rotation = [0, 0, 0]) { const group = new T.Group(); group.position.set(...pos); group.rotation.set(...rotation); parent.add(group); group.userData.home = [...pos]; group.userData.homeRotation = [...rotation]; group.userData.target = [...pos]; group.userData.targetRotation = [...rotation]; this.targets.push(group); return group; }
  screw(parent, x, y, z) { const s = this.cylinder(parent, .035, .016, [x, y, z], this.materials.darkBrass, 12); s.rotation.x = Math.PI / 2; this.block(parent, [.037, .004, .006], [x, y, z + .01], this.materials.inset, .001); }

  buildBox() {
    const mat = this.materials;
    this.base = this.moving(this.assembly, [0, -1.13, 0]); this.base.userData.action = { type: 'part', index: 3 };
    this.block(this.base, [2.52, .22, 2.52], [0, 0, 0]);
    this.block(this.base, [2.54, .035, 2.54], [0, -.06, 0], mat.darkBrass, .01);
    this.frameGroup = this.moving(this.assembly, [0, 0, 0]);
    for (const x of [-1.12, 1.12]) for (const z of [-1.12, 1.12]) { this.block(this.frameGroup, [.17, 2.28, .17], [x, 0, z], mat.darkWood); for (const y of [-1.04, .96]) this.block(this.frameGroup, [.24, .19, .24], [x, y, z], mat.brass, .015); }
    this.front = this.moving(this.assembly, [0, -.02, 1.17]); this.front.userData.action = { type: 'part', index: 1 };
    this.block(this.front, [2.27, 2.15, .16], [0, 0, 0]);
    for (const x of [-.99, .99]) for (const y of [-.93, .93]) this.screw(this.front, x, y, .09);
    const disk = this.cylinder(this.front, .96, .04, [0, .03, .115], mat.darkBrass, 64); disk.rotation.x = Math.PI / 2;
    [ [.81, .13, .165], [.52, .12, .175] ].forEach(([radius, thickness, z], index) => {
      const group = new T.Group(); group.position.set(0, .03, z); group.userData.action = { type: 'ring', index }; this.front.add(group); this.rings.push(group);
      this.mesh(new T.TorusGeometry(radius, thickness, 8, 72), mat.brass, group);
      const texture = canvasTexture((ctx, n) => { const r = n * .40; for (let i = 0; i < 6; i++) { const a = i * TAU / 6; symbol(ctx, i, n / 2 + Math.sin(a) * r, n / 2 - Math.cos(a) * r, n * .052); } });
      this.decal(group, texture, radius * 2.5, radius * 2.5, [0, 0, thickness * .94]);
      // A transparent hit surface fills the annular gaps, not the center.
      const hit = this.mesh(new T.RingGeometry(radius - thickness, radius + thickness, 64), new T.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }), group); hit.position.z = thickness; hit.castShadow = false;
    });
    const seal = new T.Group(); seal.position.set(0, .03, .20); seal.userData.action = { type: 'unlock' }; this.front.add(seal);
    const sealDisk = this.cylinder(seal, .31, .09, [0, 0, 0], mat.brass); sealDisk.rotation.x = Math.PI / 2;
    this.decal(seal, canvasTexture((ctx, n) => symbol(ctx, 1, n / 2, n / 2, n * .31), 128), .40, .40, [0, 0, .052]);
    const markerShape = new T.Shape(); markerShape.moveTo(-.075, 0); markerShape.lineTo(.075, 0); markerShape.lineTo(0, -.16); markerShape.closePath();
    const marker = this.mesh(new T.ExtrudeGeometry(markerShape, { depth: .025, bevelEnabled: false }), mat.highlight, this.front); marker.position.set(0, 1.015, .16);

    this.lid = this.moving(this.assembly, [0, 1.12, 0]); this.lid.userData.action = { type: 'part', index: 0 };
    this.block(this.lid, [2.53, .18, 2.53], [0, 0, 0]);
    for (const x of [-1.08, 1.08]) for (const z of [-1.08, 1.08]) { this.block(this.lid, [.35, .035, .35], [x, .105, z], mat.brass, .012); this.cylinder(this.lid, .034, .01, [x, .128, z], mat.darkBrass, 12); }
    const plant = canvasTexture((ctx, n) => {
      ctx.strokeStyle = '#372516'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(n * .5, n * .82); ctx.bezierCurveTo(n * .34, n * .50, n * .60, n * .45, n * .50, n * .25); ctx.stroke();
      for (let i = 0; i < 5; i++) { const y = n * (.34 + i * .08); for (const dir of [-1, 1]) { ctx.beginPath(); ctx.moveTo(n * .5, y + 30); ctx.quadraticCurveTo(n * (.5 + dir * .10), y - 5, n * (.5 + dir * .20), y - 15); ctx.stroke(); symbol(ctx, 1, n * (.5 + dir * .21), y - 22, 19); } }
      symbol(ctx, 0, n * .5, n * .14, 30);
    });
    this.decal(this.lid, plant, 1.95, 1.95, [0, .102, 0], [-Math.PI / 2, 0, 0]);

    this.right = this.moving(this.assembly, [1.18, -.02, 0], [0, Math.PI / 2, 0]); this.right.userData.action = { type: 'part', index: 2 };
    this.block(this.right, [2.26, 2.12, .14], [0, 0, 0], mat.darkWood);
    this.block(this.right, [2.10, 1.89, .045], [0, 0, .092], mat.inset, .018);
    for (const x of [-1.02, 1.02]) this.block(this.right, [.055, 1.96, .07], [x, 0, .13], mat.brass, .01);
    for (const y of [-.97, .97]) this.block(this.right, [2.1, .055, .07], [0, y, .13], mat.brass, .01);
    for (let i = 0; i < 4; i++) {
      const group = new T.Group(); group.position.set(0, .66 - i * .44, .155); group.userData.action = { type: 'slide-tap', index: i }; this.right.add(group); this.slides.push(group);
      this.block(group, [1.47, .33, .10], [0, 0, 0], mat.wood, .018);
      const knob = this.cylinder(group, .052, .035, [.49, 0, .07], mat.brass, 16); knob.rotation.x = Math.PI / 2;
      this.block(group, [.15, .045, .055], [-.65, -.19, -.035], mat.brass, .004);
    }
    // Engraved latch route: 4 → 2 → 3 → 1. Visible when the front comes off.
    this.decal(this.right, canvasTexture((ctx, n) => { ctx.strokeStyle = '#c6ad75'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(70, 420); ctx.lineTo(170, 420); ctx.lineTo(170, 185); ctx.lineTo(285, 185); ctx.lineTo(285, 300); ctx.lineTo(395, 300); ctx.lineTo(395, 70); ctx.lineTo(450, 70); ctx.stroke(); ctx.fillStyle = '#c6ad75'; ctx.font = '35px sans-serif'; ['4','2','3','1'].forEach((s, i) => ctx.fillText(s, [35,130,250,365][i], [450,170,335,58][i])); }), .25, 1.65, [-.96, 0, .195]);
    this.pin = this.cylinder(this.right, .035, 1.73, [.91, 0, .205], mat.brass, 16); this.pin.userData.action = { type: 'unlock' };
    this.left = this.moving(this.assembly, [-1.18, -.02, 0], [0, -Math.PI / 2, 0]); this.block(this.left, [2.26, 2.12, .14], [0, 0, 0]);
    this.back = this.moving(this.assembly, [0, -.02, -1.18]); this.block(this.back, [2.26, 2.12, .14], [0, 0, 0]);

    this.gearTray = this.moving(this.assembly, [0, .88, 0], [-Math.PI / 2, 0, 0]);
    this.block(this.gearTray, [2.10, 1.92, .085], [0, 0, 0], mat.darkWood);
    this.block(this.gearTray, [1.93, .075, .05], [0, -.30, .07], mat.darkBrass);
    for (let i = 0; i < 3; i++) {
      const group = new T.Group(); group.position.set((i - 1) * .65, .10, .095); group.userData.action = { type: 'gear', index: i, direction: 1 }; this.gearTray.add(group); this.gears.push(group);
      const shape = new T.Shape(); for (let j = 0; j < 48; j++) { const a = j * TAU / 48, r = j % 4 < 2 ? .33 : .285; if (j) shape.lineTo(Math.cos(a) * r, Math.sin(a) * r); else shape.moveTo(Math.cos(a) * r, Math.sin(a) * r); } shape.closePath();
      this.mesh(new T.ExtrudeGeometry(shape, { depth: .045, bevelEnabled: true, bevelThickness: .006, bevelSize: .006, bevelSegments: 1 }), mat.brass, group);
      const face = this.cylinder(group, .235, .035, [0, 0, .055], mat.darkBrass, 32); face.rotation.x = Math.PI / 2;
      this.decal(group, canvasTexture((ctx, n) => { ctx.fillStyle = '#ecdaaa'; ctx.beginPath(); ctx.moveTo(n * .5, n * .18); ctx.lineTo(n * .73, n * .46); ctx.lineTo(n * .57, n * .46); ctx.lineTo(n * .57, n * .8); ctx.lineTo(n * .43, n * .8); ctx.lineTo(n * .43, n * .46); ctx.lineTo(n * .27, n * .46); ctx.closePath(); ctx.fill(); }, 128), .35, .35, [0, 0, .08]);
      this.decal(this.gearTray, canvasTexture((ctx, n) => { ctx.fillStyle = '#c7b58d'; ctx.textAlign = 'center'; ctx.font = '70px serif'; ctx.fillText(['I + II','II + III','III'][i], n / 2, n * .62); }, 256), .55, .28, [(i - 1) * .65, -.51, .052]);
    }
    const lever = this.block(this.gearTray, [.48, .14, .13], [0, -.79, .15], mat.brass); lever.userData.action = { type: 'unlock' };

    this.codeGroup = new T.Group(); this.codeGroup.position.set(0, -.88, 1.02); this.assembly.add(this.codeGroup);
    this.block(this.codeGroup, [1.44, .43, .16], [0, 0, 0], mat.darkBrass);
    for (let i = 0; i < 3; i++) { const m = this.decal(this.codeGroup, this.numberTexture(0), .33, .33, [(i - 1) * .43, 0, .091]); m.userData.action = { type: 'digit', index: i }; this.digitMeshes.push(m); }

    this.core = new T.Group(); this.assembly.add(this.core);
    this.cylinder(this.core, .56, .92, [0, -.63, 0], mat.brass, 48);
    for (const y of [-1.06, -.22]) this.cylinder(this.core, .585, .045, [0, y, 0], mat.darkBrass, 48);
    const corePlate = this.block(this.core, [.44, .35, .035], [0, -.62, .552], mat.darkBrass, .01);
    this.decal(this.core, canvasTexture((ctx, n) => { ctx.strokeStyle = '#e1c696'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(n * .15, n * .36); ctx.lineTo(n * .85, n * .36); ctx.moveTo(n * .5, n * .2); ctx.lineTo(n * .5, n * .80); ctx.moveTo(n * .2, n * .7); ctx.lineTo(n * .8, n * .7); ctx.stroke(); }, 128), .27, .27, [0, -.62, corePlate.position.z + .025]);
    this.coreLid = this.moving(this.core, [0, -.15, 0]); this.coreLid.userData.action = { type: 'unlock' };
    this.cylinder(this.coreLid, .58, .105, [0, 0, 0], mat.brass, 48);
    this.cylinder(this.coreLid, .055, .35, [0, .20, 0], mat.darkBrass, 16);
    this.beam = new T.Group(); this.beam.position.y = .39; this.coreLid.add(this.beam);
    this.block(this.beam, [1.33, .046, .09], [0, 0, 0], mat.brass, .015);
    for (const [index, x] of [-.59, .59].entries()) {
      const side = index === 0 ? 'left' : 'right'; const pan = new T.Group(); pan.position.x = x; pan.userData.action = { type: 'pan', location: side }; this.beam.add(pan);
      this.cylinder(pan, .016, .28, [0, -.14, 0], mat.darkBrass, 8);
      this.cylinder(pan, .29, .035, [0, -.29, 0], mat.brass, 32);
      const rim = this.mesh(new T.TorusGeometry(.28, .018, 6, 32), mat.darkBrass, pan); rim.rotation.x = Math.PI / 2; rim.position.y = -.27;
    }
    for (let i = 0; i < 4; i++) {
      const g = this.moving(this.assembly, [(i - 1.5) * .36, -1.16, 1.77]); g.userData.action = { type: 'select-weight', index: i }; this.weights.push(g);
      const h = .13 + i * .025; this.cylinder(g, .12, h, [0, 0, 0], mat.brass, 24); this.cylinder(g, .045, .08, [0, h / 2 + .035, 0], mat.darkBrass, 16);
      const bead = this.mesh(new T.TorusGeometry(.045, .014, 6, 16), mat.brass, g); bead.position.y = h / 2 + .085;
      this.decal(g, canvasTexture((ctx, n) => { ctx.fillStyle = '#352919'; for (let j = 0; j <= i; j++) { ctx.beginPath(); ctx.arc(n * .5 + (j - i / 2) * 23, n * .5, 7, 0, TAU); ctx.fill(); } }, 128), .19, .09, [0, 0, .124]);
    }
    this.key = this.moving(this.assembly, [0, -.48, 0]); this.key.userData.action = { type: 'extract' };
    this.mesh(new T.TorusGeometry(.145, .032, 8, 40), mat.highlight, this.key);
    this.block(this.key, [.055, .45, .05], [0, -.32, 0], mat.highlight, .01);
    this.block(this.key, [.16, .055, .05], [.055, -.47, 0], mat.highlight, .006);
    this.block(this.key, [.12, .055, .05], [.04, -.36, 0], mat.highlight, .006);
  }

  numberTexture(n) { return canvasTexture((ctx, size) => { ctx.fillStyle = '#221f19'; ctx.fillRect(0, 0, size, size); ctx.strokeStyle = '#b09a65'; ctx.lineWidth = 6; ctx.strokeRect(6, 6, size - 12, size - 12); ctx.fillStyle = '#ebd3a0'; ctx.font = `500 ${size * .7}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(n), size / 2, size * .53); }, 128); }

  setState(state, selectedWeight = -1, immediate = false) {
    const previousStage = this.stage; this.stage = state.stage; this.state = state; this.selectedWeight = selectedWeight;
    const move = (object, position, rotation) => { object.userData.target = position; object.userData.targetRotation = rotation || object.userData.homeRotation; };
    move(this.lid, state.stage > 0 ? [-2.33, -.89, -.54] : this.lid.userData.home, state.stage > 0 ? [.12, 0, -.20] : [0, 0, 0]);
    move(this.front, state.stage > 1 ? [-2.10, -1.13, 1.70] : this.front.userData.home, state.stage > 1 ? [-Math.PI / 2, 0, -.16] : [0, 0, 0]);
    move(this.right, state.stage > 2 ? [2.26, -1.11, .22] : this.right.userData.home, state.stage > 2 ? [-Math.PI / 2, 0, .12] : [0, Math.PI / 2, 0]);
    move(this.left, state.stage > 2 ? [-2.22, -1.16, -1.52] : this.left.userData.home, state.stage > 2 ? [Math.PI / 2, 0, -.16] : [0, -Math.PI / 2, 0]);
    move(this.back, state.stage > 3 ? [.6, -1.15, -2.15] : this.back.userData.home, state.stage > 3 ? [-Math.PI / 2, 0, .1] : [0, 0, 0]);
    move(this.base, state.stage > 3 ? [2.04, -1.22, -1.72] : this.base.userData.home);
    move(this.frameGroup, state.stage > 3 ? [-2.85, .02, -1.7] : [0, 0, 0]);
    move(this.gearTray, state.stage > 1 ? [.05, -1.14, -2.23] : this.gearTray.userData.home, [-Math.PI / 2, 0, 0]);
    this.codeGroup.visible = state.stage === 3;
    this.key.visible = state.stage >= 5; this.coreLid.visible = !state.extracted;
    move(this.coreLid, state.stage >= 5 ? [.9, .5, -.42] : [0, -.15, 0], state.stage >= 5 ? [0, 0, -.45] : [0, 0, 0]);
    move(this.key, state.extracted ? [0, .7, .45] : [0, .17, 0], state.extracted ? [0, -.25, -.28] : [0, 0, 0]);
    this.weights.forEach((g, i) => {
      g.visible = state.stage > i && !state.extracted;
      const side = state.weights[i], panX = side === 'left' ? -.59 : .59;
      const peers = state.weights.slice(0, i).filter(s => s === side).length;
      const target = side === 'tray' || state.stage === 5 ? [(i - 1.5) * .36, -1.16, 1.77] : [panX + (peers % 2 ? .12 : -.12), .01, peers > 1 ? -.10 : .02];
      if (i === selectedWeight && state.stage === 4) target[1] += .1;
      move(g, target);
    });
    this.digitMeshes.forEach((m, i) => { if (m.userData.value !== state.code[i]) { m.material.map.dispose(); m.material.map = this.numberTexture(state.code[i]); m.userData.value = state.code[i]; } });
    if (immediate) {
      this.targets.forEach(g => { g.position.set(...g.userData.target); g.rotation.set(...g.userData.targetRotation); });
      this.rings.forEach((g, i) => { g.rotation.z = state.rings[i] * TAU / 6; }); this.gears.forEach((g, i) => { g.rotation.z = -state.gears[i] * Math.PI / 2; });
    }
    if (state.stage !== previousStage && !immediate) this.focusStage();
  }

  focusStage() {
    const poses = [{ yaw: 0, pitch: .22, distance: 6.3 }, { yaw: .05, pitch: 1.07, distance: 6.8 }, { yaw: 1.24, pitch: .27, distance: 6.7 }, { yaw: .2, pitch: .57, distance: 8.7 }, { yaw: .10, pitch: .45, distance: 5.8 }, { yaw: .16, pitch: .35, distance: 5.3 }];
    this.desiredView = { ...poses[this.stage] };
  }
  overview() { this.desiredView = { yaw: .61, pitch: .40, distance: this.stage > 0 ? 9.7 : 6.9 }; }
  zoom(amount) { this.desiredView.distance = clamp(this.desiredView.distance + amount, 4.5, 12); }
  resize() { const { width, height } = this.host.getBoundingClientRect(); if (!width || !height) return; this.renderer.setSize(width, height, false); this.camera.aspect = width / height; this.camera.updateProjectionMatrix(); }

  actionAt(x, y) {
    const rect = this.host.getBoundingClientRect(); this.pointer.set((x - rect.left) / rect.width * 2 - 1, -(y - rect.top) / rect.height * 2 + 1); this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObject(this.assembly, true);
    for (const hit of hits) {
      let object = hit.object, visible = true, action = null;
      while (object) { if (!object.visible) visible = false; if (!action && object.userData.action) action = object.userData.action; object = object.parent; }
      if (visible) return action; // An opaque front panel must occlude its hidden mechanisms.
    }
    return null;
  }

  bindInput() {
    const element = this.renderer.domElement, opts = { signal: this.abort.signal };
    element.addEventListener('pointerdown', event => { if (event.button > 0) return; element.setPointerCapture(event.pointerId); this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY }); this.dragStart = { x: event.clientX, y: event.clientY, moved: this.pointers.size > 1 }; if (this.pointers.size === 2) { const [a, b] = [...this.pointers.values()]; this.pinchDistance = Math.hypot(a.x - b.x, a.y - b.y); } }, opts);
    element.addEventListener('pointermove', event => {
      const before = this.pointers.get(event.pointerId);
      if (!before) { element.style.cursor = this.actionAt(event.clientX, event.clientY) ? 'pointer' : 'grab'; return; }
      const dx = event.clientX - before.x, dy = event.clientY - before.y; this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (Math.hypot(event.clientX - this.dragStart.x, event.clientY - this.dragStart.y) > 7) this.dragStart.moved = true;
      if (this.pointers.size === 2) { const [a, b] = [...this.pointers.values()]; const distance = Math.hypot(a.x - b.x, a.y - b.y); if (this.pinchDistance) this.zoom((this.pinchDistance - distance) * .015); this.pinchDistance = distance; this.dragStart.moved = true; }
      else { this.desiredView.yaw -= dx * .007; this.desiredView.pitch = clamp(this.desiredView.pitch + dy * .006, -.22, 1.30); }
    }, opts);
    const end = event => { const valid = this.pointers.has(event.pointerId); this.pointers.delete(event.pointerId); if (event.type === 'pointerup' && valid && this.dragStart && !this.dragStart.moved && !this.pointers.size) { const action = this.actionAt(event.clientX, event.clientY); if (action) this.onAction(action); } if (!this.pointers.size) this.pinchDistance = 0; };
    element.addEventListener('pointerup', end, opts); element.addEventListener('pointercancel', end, opts); element.addEventListener('lostpointercapture', event => { this.pointers.delete(event.pointerId); }, opts);
    element.addEventListener('wheel', event => { event.preventDefault(); this.zoom(event.deltaY * .004); }, { ...opts, passive: false });
    element.addEventListener('contextmenu', event => event.preventDefault(), opts);
    element.addEventListener('webglcontextlost', event => { event.preventDefault(); this.running = false; this.onError('توقف العرض ثلاثي الأبعاد. أعد تحميل الصفحة؛ تقدمك محفوظ على هذا الجهاز.'); }, opts);
    this.host.addEventListener('keydown', event => { const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '+', '-', '=']; if (!keys.includes(event.key)) return; event.preventDefault(); if (event.key === 'ArrowLeft') this.desiredView.yaw -= .15; if (event.key === 'ArrowRight') this.desiredView.yaw += .15; if (event.key === 'ArrowUp') this.desiredView.pitch = clamp(this.desiredView.pitch + .12, -.22, 1.3); if (event.key === 'ArrowDown') this.desiredView.pitch = clamp(this.desiredView.pitch - .12, -.22, 1.3); if (event.key === '+' || event.key === '=') this.zoom(-.5); if (event.key === '-') this.zoom(.5); }, opts);
  }

  frame(time) {
    if (this.disposed || !this.running || document.hidden || time - this.lastFrame < 30) return;
    const dt = Math.min(.08, (time - this.lastFrame) / 1000 || .03); this.lastFrame = time;
    const t = this.reduceMotion ? 1 : 1 - Math.exp(-dt * 6);
    this.targets.forEach(g => { g.position.x = mix(g.position.x, g.userData.target[0], t); g.position.y = mix(g.position.y, g.userData.target[1], t); g.position.z = mix(g.position.z, g.userData.target[2], t); ['x','y','z'].forEach((axis, i) => { g.rotation[axis] = angleMix(g.rotation[axis], g.userData.targetRotation[i], t); }); });
    if (this.state) {
      this.rings.forEach((g, i) => { g.rotation.z = angleMix(g.rotation.z, this.state.rings[i] * TAU / 6, t); });
      this.gears.forEach((g, i) => { g.rotation.z = angleMix(g.rotation.z, -this.state.gears[i] * Math.PI / 2, t); });
      this.slides.forEach((g, i) => { g.position.x = mix(g.position.x, this.state.slides[i] * .235, t); });
      const left = this.state.weights.reduce((s, loc, i) => s + (loc === 'left' ? i + 1 : 0), 0), right = this.state.weights.reduce((s, loc, i) => s + (loc === 'right' ? i + 1 : 0), 0);
      this.beam.rotation.z = mix(this.beam.rotation.z, clamp((left - right) * .04, -.28, .28), t);
      if (this.state.stage === 4) this.weights.forEach((g, i) => { const loc = this.state.weights[i]; if (loc !== 'tray') g.userData.target[1] = .01 + Math.sin(this.beam.rotation.z) * (loc === 'left' ? -.59 : .59) + (this.selectedWeight === i ? .1 : 0); });
    }
    this.view.yaw = angleMix(this.view.yaw, this.desiredView.yaw, t); this.view.pitch = mix(this.view.pitch, this.desiredView.pitch, t); this.view.distance = mix(this.view.distance, this.desiredView.distance, t);
    const aspect = this.camera.aspect;
    const distance = this.view.distance * (aspect < .95 ? 1.14 : 1);
    this.camera.position.set(Math.sin(this.view.yaw) * Math.cos(this.view.pitch) * distance, this.look.y + Math.sin(this.view.pitch) * distance, Math.cos(this.view.yaw) * Math.cos(this.view.pitch) * distance);
    this.camera.lookAt(this.look); this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    this.disposed = true; this.renderer.setAnimationLoop(null); this.abort.abort(); this.resizeObserver.disconnect();
    const geometries = new Set(), materials = new Set(), textures = new Set();
    this.scene.traverse(object => { if (object.geometry) geometries.add(object.geometry); if (object.material) for (const mat of [object.material].flat()) { materials.add(mat); if (mat.map) textures.add(mat.map); } });
    geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); textures.forEach(t => t.dispose()); this.environment.dispose(); this.renderer.dispose(); this.renderer.domElement.remove();
  }
}
