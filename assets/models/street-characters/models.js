/** Eight original street-NPC caricatures. Source is the asset authority.
 * Reuses the existing mesh tools; no downloaded art, fonts or character meshes.
 * One indexed, vertex-coloured skinned primitive per character.
 */
import {KitMesh} from '../satire-kit/geometry.js';
import {createRig, encodeCharacterGLB, VERSION} from './rig.js';
export {VERSION, CLIP_NAMES, CLIP_SECONDS, WALK_DISTANCE} from './rig.js';

const entries = [
  {id: 'kehrwoche', title: 'Frau Besenrein', role: 'Kehrwoche supervisor', width: 1.10, height: .94, belly: 1.15, head: 1.05, coat: 0x9e594e, trim: 0x738071, skin: 0xd5ad8b, hair: 0xb9b5a8, style: 'bun', carry: {L: true, R: true}, feature: 'Broom, checked apron, rolled sleeves and severe silver bun'},
  {id: 'ordnungsamt', title: 'Herr Dienstweg', role: 'Clipboard inspector', width: .92, height: 1.07, belly: .85, head: .95, coat: 0x465969, trim: 0x909e9b, skin: 0xc89875, hair: 0x594b3d, style: 'parted', carry: {L: true, R: false}, feature: 'Service cap, A38 clipboard, brass pencil and judging spectacles'},
  {id: 'pfand', title: 'Petra Mehrweg', role: 'Pfand collector', width: 1.12, height: .92, belly: 1.13, head: 1.02, coat: 0x60775f, trim: 0xc4a576, skin: 0xb77e5d, hair: 0x46372f, style: 'curls', carry: {L: false, R: true}, feature: 'Open bottle tote, patched jacket, knit cap and counting hand'},
  {id: 'wanderer', title: 'Uwe Allwetter', role: 'Over-equipped urban hiker', width: .97, height: 1.08, belly: .9, head: .95, coat: 0xb58c40, trim: 0x596f72, skin: 0xd0a37e, hair: 0x6b6254, style: 'beard', carry: {L: true, R: true}, feature: 'Expedition backpack, rolled mat, hiking poles, shorts and thick socks'},
  {id: 'garten', title: 'Gisela Paragraf', role: 'Allotment guardian', width: 1.08, height: .97, belly: 1.04, head: 1.04, coat: 0x718066, trim: 0xb9aa7c, skin: 0xdfb493, hair: 0xaaa89a, style: 'bun', carry: {L: true, R: true}, feature: 'Sunhat, pocketed apron, watering can and folding hedge ruler'},
  {id: 'pendler', title: 'Rolf Anschluss', role: 'Permanently delayed commuter', width: .91, height: 1.10, belly: .92, head: .97, coat: 0x958a74, trim: 0x52697a, skin: 0xcf9d7b, hair: 0x59493a, style: 'moustache', carry: {L: true, R: true}, feature: 'Long coat, scarf, briefcase, rolled umbrella and oversized wristwatch'},
  {id: 'radweg', title: 'Alex Klingel', role: 'Bicycle-lane enforcer', width: .91, height: 1.02, belly: .89, head: .97, coat: 0xc0ad59, trim: 0x546f72, skin: 0x986747, hair: 0x352d29, style: 'short', carry: {L: true, R: false}, feature: 'Vented helmet, reflective vest, bell and distance-measuring ruler'},
  {id: 'warteschlange', title: 'Erika Reihenfolge', role: 'Queue-order expert', width: 1.08, height: .98, belly: 1.12, head: 1.08, coat: 0x776b83, trim: 0xa9b0a2, skin: 0xd0a888, hair: 0x76665a, style: 'curls', carry: {L: true, R: true}, feature: 'Heavy ring binder, absurdly long numbered ticket and reading glasses'}
];
export const STREET_CATALOG = Object.freeze(entries.map(p => Object.freeze({...p, carry: Object.freeze(p.carry)})));
export const STREET_IDS = Object.freeze(STREET_CATALOG.map(p => p.id));
const BASE_COLORS = Object.freeze({ink: 0x292d2b, paper: 0xe8dfc9, steel: 0x929b96, wood: 0x9d7b52, amber: 0x725029,
  sage: 0x677c5e, oxide: 0xa75340, ochre: 0xc8aa57, blue: 0x55738b, rubber: 0x353631, enamel: 0xc0b6a0, soil: 0x68523e, screen: 0x86aaa0});
function linearColor(hex) {return [16, 8, 0].map(shift => {const s = ((hex >> shift) & 255) / 255; return s <= .04045 ? s / 12.92 : ((s + .055) / 1.055) ** 2.4;});}

class CharacterMesh extends KitMesh {
  constructor(profile) {
    super(profile.id); this.profile = profile; this.rig = createRig(profile.width, profile.height);
    this.joint = 2; this.vertices = new Map(); this.positions = []; this.normals = []; this.colors = []; this.joints = []; this.indices = [];
    this.palette = {...BASE_COLORS, coat: profile.coat, trim: profile.trim, skin: profile.skin, hair: profile.hair};
    this.linear = Object.fromEntries(Object.entries(this.palette).map(([key, value]) => [key, linearColor(value)]));
  }
  bone(name, fn) {
    const previous = this.joint, index = this.rig.findIndex(b => b.name === name);
    if (index < 0) throw new RangeError(`Unknown bone: ${name}`);
    this.joint = index; try {fn(this);} finally {this.joint = previous;}
  }
  tri(a, b, c, material) {
    if (!Object.hasOwn(this.linear, material)) throw new RangeError(`Unknown character colour: ${material}`);
    const transform = p => {
      let q = [...p];
      for (let i = this.transforms.length - 1; i >= 0; i--) {
        const t = this.transforms[i], co = Math.cos(t.turn), si = Math.sin(t.turn);
        q = q.map(v => v * t.scale); q = [q[0] * co + q[2] * si, q[1], -q[0] * si + q[2] * co]; q = q.map((v, k) => v + t.at[k]);
      }
      return [q[0] * this.profile.width, q[1] * this.profile.height, q[2]].map(Math.fround);
    };
    const points = [a, b, c].map(transform), u = points[1].map((v, i) => v - points[0][i]), v = points[2].map((n, i) => n - points[0][i]);
    let normal = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    const length = Math.hypot(...normal); if (length < 1e-10) return;
    normal = normal.map(n => Math.fround(n / length));
    for (const point of points) {
      const key = `${point.join(',')}/${normal.map(n => n.toFixed(5)).join(',')}/${material}/${this.joint}`;
      let index = this.vertices.get(key);
      if (index === undefined) {
        index = this.joints.length; this.vertices.set(key, index);
        this.positions.push(...point); this.normals.push(...normal); this.colors.push(...this.linear[material]); this.joints.push(this.joint);
      }
      this.indices.push(index);
    }
  }
  finish() {
    const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
    this.positions.forEach((value, i) => {if (!Number.isFinite(value)) throw new TypeError('Nonfinite vertex'); const axis = i % 3; min[axis] = Math.min(min[axis], value); max[axis] = Math.max(max[axis], value);});
    return {id: this.id, version: VERSION, height: this.profile.height, carry: this.profile.carry, rig: this.rig, features: [this.profile.feature],
      positions: this.positions, normals: this.normals, colors: this.colors, joints: this.joints, indices: this.indices,
      triangles: this.indices.length / 3, bounds: {min, max}, dimensions: max.map((v, i) => v - min[i])};
  }
}

function face(m, p) {
  m.bone('Head', () => {
    const rings = [[1.43, .145, .13], [1.50, .213, .18], [1.66, .258, .214], [1.81, .233, .194], [1.90, .15, .125]];
    const points = rings.map(([y, rx, rz], k) => Array.from({length: 12}, (_, i) => {
      const a = i * Math.PI / 6; return [Math.cos(a) * rx * p.head + (k === 3 ? -.008 : 0), y, Math.sin(a) * rz];
    }));
    m.face(points[0], 'skin', [0, -1, 0]); m.face(points.at(-1), 'skin', [0, 1, 0]);
    for (let r = 0; r < points.length - 1; r++) for (let i = 0; i < 12; i++) {
      const j = (i + 1) % 12; m.face([points[r][i], points[r][j], points[r + 1][j], points[r + 1][i]], 'skin', [Math.cos((i + .5) * Math.PI / 6), 0, Math.sin((i + .5) * Math.PI / 6)]);
    }
    for (const side of [-1, 1]) {
      const x = side * .102;
      m.ellipsoid([side * .255 * p.head, 1.63, -.008], [.051, .078, .043], 'skin', 8, 4);
      m.ellipsoid([x, 1.696, .186], [.062, .034, .032], 'paper', 8, 4);
      m.ellipsoid([x - .008, 1.691, .215], [.015, .021, .010], 'ink', 8, 4);
      m.beam([x - .068, 1.749 + side * .012, .198], [x + .063, 1.750 - side * .012, .200], .019, 'hair', 5);
      m.beam([x - .041, 1.646, .194], [x + .035, 1.639, .20], .007, 'wood', 4);
    }
    // A long wedge bridge and a faceted nose, not a spherical placeholder head.
    m.face([[-.030, 1.738, .207], [.032, 1.738, .207], [.047, 1.605, .277], [-.043, 1.605, .277]], 'skin', [0, 0, 1]);
    m.ellipsoid([0, 1.605, .251], [.050, .043, .065], 'skin', 8, 4);
    m.beam([-.068, 1.527, .180], [.061, 1.537, .183], .010, 'ink', 5);
    if (['moustache', 'beard'].includes(p.style)) {
      for (const s of [-1, 1]) m.ellipsoid([s * .057, 1.564, .204], [.064, .030, .022], 'hair', 8, 4);
      if (p.style === 'beard') m.ellipsoid([0, 1.473, .102], [.17, .070, .095], 'hair', 10, 4);
    }
    if (p.style === 'curls') {
      for (let i = 0; i < 9; i++) {const a = i * Math.PI / 8; m.ellipsoid([Math.cos(a) * .22, 1.79 + Math.sin(a) * .13, -.022], [.064, .066, .063], 'hair', 8, 4);}
    } else {
      m.lathe([-.014, 1.797, -.023], [0, 1, 0], [[0, .225], [.08, .205], [.14, .12], [.15, .025]], 'hair', 12);
      for (const s of [-1, 1]) m.box([s * .22, 1.737, -.041], [.047, .12, .092], 'hair', .015);
      if (p.style === 'bun') m.ellipsoid([0, 1.846, -.221], [.103, .098, .087], 'hair', 10, 5);
    }
  });
}
function glasses(m, round = false) {
  m.bone('Head', () => {
    for (const x of [-.106, .106]) {
      if (round) m.ring([x, 1.696, .225], .072, .009, 'ink', 12);
      else {for (const y of [1.655, 1.736]) m.beam([x - .074, y, .227], [x + .074, y, .227], .008, 'ink', 4); for (const sx of [-.074, .074]) m.beam([x + sx, 1.655, .227], [x + sx, 1.736, .227], .008, 'ink', 4);}
      m.beam([Math.sign(x) * .176, 1.703, .218], [Math.sign(x) * .248, 1.70, -.019], .008, 'ink', 4);
    }
    m.beam([-.031, 1.711, .231], [.031, 1.711, .231], .008, 'ink', 4);
  });
}
function watch(m) {
  m.bone('Hand_L', () => {
    m.box([-.467, .902, .105], [.11, .075, .10], 'ink', .018);
    m.lathe([-.467, .902, .158], [0, 0, 1], [[0, .042], [.010, .042]], 'paper', 12);
    m.path([[-.483, .915, .173], [-.467, .902, .173], [-.447, .908, .173]], .004, 'ink', 4);
  });
}
function clothing(m, p) {
  m.bone('Hips', () => {
    m.ellipsoid([0, .84, -.005], [.235 * p.belly, .14, .169], 'trim', 10, 5);
    m.box([0, .91, .012], [.47 * p.belly, .065, .33], 'ink', .025);
    m.box([.012, .916, .184], [.073, .054, .022], 'steel', .008);
  });
  m.bone('Spine', () => {
    m.lathe([0, .935, 0], [0, 1, 0], [[0, .231 * p.belly], [.12, .274 * p.belly], [.31, .257], [.405, .248], [.445, .169]], 'coat', 12);
    // Flatten the jacket depth without adding a second runtime material.
    m.box([0, 1.404, .015], [.188, .067, .14], 'paper', .018);
    for (const s of [-1, 1]) m.beam([s * .025, 1.43, .093], [s * .15, 1.329, .209], .037, 'trim', 5);
    for (const y of [1.07, 1.17, 1.27]) m.ellipsoid([.025, y, .282 * p.belly], [.017, .017, .012], 'ink', 6, 4);
    for (const x of [-.144, .144]) m.box([x, 1.108, .249 * p.belly], [.12, .16, .034], 'trim', .013);
    m.lathe([0, 1.394, 0], [0, 1, 0], [[0, .088], [.135, .082]], 'skin', 10);
  });
  for (const [side, s] of [['L', -1], ['R', 1]]) {
    m.bone(`UpperArm_${side}`, () => {
      m.ellipsoid([s * .33, 1.304, .005], [.122, .123, .119], 'coat', 8, 5);
      m.beam([s * .34, 1.30, 0], [s * .43, 1.065, .015], .084, 'coat', 8);
    });
    m.bone(`LowerArm_${side}`, () => {
      m.ellipsoid([s * .43, 1.069, .015], [.082, .077, .077], 'coat', 8, 4);
      m.beam([s * .43, 1.065, .015], [s * .47, .876, .063], .067, 'coat', 8);
      m.beam([s * .465, .91, .055], [s * .47, .865, .07], .073, 'trim', 8);
    });
    m.bone(`Hand_${side}`, () => {
      m.ellipsoid([s * .47, .829, .079], [.069, .081, .049], 'skin', 8, 5);
      m.ellipsoid([s * .426, .837, .109], [.028, .042, .029], 'skin', 8, 4);
      for (let i = 0; i < 3; i++) m.beam([s * .45, .79 + i * .019, .119], [s * .495, .793 + i * .019, .114], .004, 'wood', 4);
    });
    m.bone(`Thigh_${side}`, () => {m.beam([s * .15, .85, 0], [s * .15, .472, 0], .113, 'trim', 10);});
    m.bone(`Shin_${side}`, () => {
      m.ellipsoid([s * .15, .47, 0], [.101, .074, .098], 'trim', 8, 4);
      m.beam([s * .15, .468, 0], [s * .15, .133, 0], .080, p.id === 'wanderer' ? 'paper' : 'trim', 10);
      if (p.id === 'wanderer') for (let i = 0; i < 2; i++) m.lathe([s * .15, .335 + i * .034, 0], [0, 1, 0], [[0, .082], [.018, .082]], 'coat', 10);
    });
    m.bone(`Foot_${side}`, () => {
      m.box([s * .15, .040, .044], [.213, .080, .345], 'rubber', .019);
      m.ellipsoid([s * .15, .096, .043], [.097, .070, .150], p.id === 'wanderer' ? 'wood' : 'ink', 10, 5);
      for (let i = 0; i < 3; i++) m.box([s * .15, .151 - i * .010, .04 + i * .030], [.066, .009, .011], 'paper');
    });
  }
}
function apron(m, color) {
  m.bone('Spine', () => {m.box([0, 1.245, .263], [.33, .28, .032], color, .025); for (const x of [-.12, .12]) m.beam([x, 1.34, .28], [x, 1.417, .08], .020, color, 5);});
  m.bone('Hips', () => {
    m.box([0, .832, .246], [.485, .46, .035], color, .032);
    m.box([.02, .86, .272], [.22, .12, .029], 'paper', .014);
    for (const x of [-.16, 0, .16]) m.box([x, .819, .270], [.010, .393, .008], 'paper');
    for (const y of [.67, .77, .97]) m.box([0, y, .271], [.425, .010, .008], 'paper');
  });
}
const accessories = {
  kehrwoche(m) {
    apron(m, 'trim'); glasses(m, true);
    m.bone('Hand_R', () => {
      m.beam([.50, .28, .13], [.50, 1.33, .13], .019, 'wood', 8);
      m.box([.50, .272, .13], [.33, .09, .14], 'wood', .018);
      for (let i = 0; i < 9; i++) m.beam([.36 + i * .035, .248, .13], [.345 + i * .039, .183, .13], .013, 'ochre', 5);
    });
    m.bone('Hand_L', () => {m.panel('MO', [-.48, .78, .14], [.22, .28], 'paper', 'ink');});
  },
  ordnungsamt(m) {
    glasses(m);
    m.bone('Head', () => {
      m.lathe([0, 1.848, -.012], [0, 1, 0], [[0, .253], [.090, .253], [.118, .206]], 'coat', 12);
      m.box([0, 1.868, .224], [.31, .031, .17], 'ink', .014);
      m.box([0, 1.914, .241], [.057, .048, .017], 'ochre', .008);
    });
    m.bone('Hand_L', () => {
      m.box([-.46, .884, .17], [.28, .405, .043], 'wood', .020);
      m.box([-.46, .884, .198], [.243, .36, .015], 'paper');
      m.box([-.46, 1.085, .20], [.097, .043, .047], 'steel', .01);
      m.text('A38', [-.46, .966, .215], .066, .22, 'ink');
      for (let i = 0; i < 4; i++) m.box([-.445, .898 - i * .041, .215], [.16, .007, .008], 'ink');
    });
    m.bone('Hand_R', () => {m.beam([.465, .80, .14], [.465, 1.053, .14], .013, 'ochre', 6);});
  },
  pfand(m) {
    m.bone('Head', () => {m.lathe([0, 1.82, -.025], [0, 1, 0], [[0, .25], [.10, .23], [.165, .10]], 'trim', 12); m.lathe([0, 1.823, -.025], [0, 1, 0], [[0, .253], [.047, .253]], 'coat', 12);});
    m.bone('Hand_R', () => {
      m.box([.565, .51, .09], [.31, .30, .25], 'trim', .038);
      m.path([[.45, .66, .09], [.47, .83, .09], [.64, .83, .09], [.68, .66, .09]], .017, 'wood', 6);
      for (const x of [.48, .63]) for (const z of [.04, .15]) {
        m.lathe([x, .585, z], [0, 1, 0], [[0, .043], [.13, .043], [.17, .018], [.235, .018]], 'amber', 8);
        m.lathe([x, .64, z], [0, 1, 0], [[0, .044], [.058, .044]], 'paper', 8);
        m.lathe([x, .81, z], [0, 1, 0], [[0, .020], [.014, .020]], 'steel', 8);
      }
      m.text('PFAND', [.565, .50, .222], .061, .277, 'ink');
    });
    m.bone('Spine', () => {m.box([-.151, 1.109, .3], [.075, .09, .02], 'oxide');});
  },
  wanderer(m) {
    m.bone('Spine', () => {
      m.box([0, 1.175, -.285], [.43, .48, .235], 'trim', .058);
      m.box([0, 1.087, -.427], [.31, .20, .07], 'coat', .025);
      for (const x of [-.205, .205]) m.box([x, 1.14, -.27], [.10, .21, .16], 'wood', .025);
      m.lathe([-.244, 1.454, -.275], [1, 0, 0], [[0, .083], [.488, .083]], 'sage', 12);
      for (const x of [-.144, .144]) m.beam([x, 1.394, -.20], [x, 1.00, .285], .028, 'ink', 6);
    });
    m.bone('Head', () => {m.ellipsoid([0, 1.854, .002], [.258, .063, .245], 'trim', 12, 4);});
    for (const [side, s] of [['L', -1], ['R', 1]]) m.bone(`Hand_${side}`, () => {
      m.beam([s * .49, .17, .13], [s * .49, .88, .13], .014, 'steel', 6);
      m.beam([s * .49, .79, .13], [s * .49, .94, .13], .024, 'ink', 6);
      m.lathe([s * .49, .161, .13], [0, 1, 0], [[0, .036], [.017, .036]], 'ink', 8);
    });
  },
  garten(m) {
    apron(m, 'trim');
    m.bone('Head', () => {m.lathe([0, 1.854, -.012], [0, 1, 0], [[0, .33], [.03, .33], [.05, .23], [.15, .20]], 'wood', 14); m.lathe([0, 1.897, -.012], [0, 1, 0], [[0, .231], [.034, .226]], 'sage', 14);});
    m.bone('Hand_L', () => {
      m.lathe([-.51, .40, .1], [0, 1, 0], [[0, .115], [.23, .135], [.25, .12]], 'sage', 10);
      m.ring([-.51, .725, .1], .121, .017, 'steel', 12);
      m.beam([-.6, .58, .13], [-.77, .77, .13], .032, 'sage', 8);
      m.ellipsoid([-.778, .781, .13], [.055, .028, .044], 'steel', 8, 4);
    });
    m.bone('Hand_R', () => {m.box([.48, 1.029, .13], [.046, .43, .025], 'ochre'); for (let i = 0; i < 6; i++) m.box([.48, .878 + i * .055, .147], [.025, .006, .008], 'ink');});
  },
  pendler(m) {
    glasses(m); watch(m);
    m.bone('Hips', () => {m.box([0, .842, -.091], [.47, .48, .21], 'coat', .046);});
    m.bone('Spine', () => {
      m.box([0, 1.392, .115], [.28, .087, .27], 'trim', .025);
      m.box([-.105, 1.195, .278], [.096, .38, .034], 'trim', .012);
      for (let i = 0; i < 4; i++) m.box([-.141 + i * .023, .992, .283], [.010, .059, .019], 'trim');
    });
    m.bone('Hand_L', () => {
      m.box([-.54, .49, .07], [.32, .33, .18], 'wood', .034);
      m.path([[-.60, .658, .07], [-.60, .794, .07], [-.47, .794, .07], [-.47, .658, .07]], .016, 'ink', 6);
      m.box([-.54, .52, .168], [.062, .041, .019], 'ochre', .006);
    });
    m.bone('Hand_R', () => {
      m.lathe([.49, .40, .13], [0, 1, 0], [[0, .008], [.07, .055], [.45, .038], [.53, .012]], 'trim', 10);
      m.beam([.49, .86, .13], [.49, 1.021, .13], .013, 'steel', 6);
      m.path([[.49, 1.021, .13], [.49, 1.08, .13], [.535, 1.10, .13], [.568, 1.074, .13], [.568, 1.029, .13]], .015, 'wood', 6);
    });
  },
  radweg(m) {
    m.bone('Head', () => {
      m.lathe([0, 1.832, -.01], [0, 1, 0], [[0, .268], [.09, .245], [.155, .13]], 'trim', 12);
      for (const x of [-.15, 0, .15]) m.box([x, 1.932, .07], [.040, .035, .20], 'ink', .012);
      for (const x of [-.24, .24]) m.beam([x, 1.826, 0], [x * .54, 1.476, .085], .009, 'ink', 5);
    });
    m.bone('Spine', () => {
      for (const x of [-.155, .155]) m.box([x, 1.233, .249], [.04, .265, .016], 'paper');
      m.box([0, 1.078, .287], [.42, .042, .019], 'paper');
      m.box([0, 1.262, .275], [.012, .26, .014], 'ink');
    });
    m.bone('Hand_R', () => {m.beam([.41, .846, .14], [.57, .846, .14], .014, 'ink', 6); m.ellipsoid([.49, .901, .15], [.068, .036, .06], 'steel', 12, 5);});
    m.bone('Hand_L', () => {m.box([-.48, 1.006, .14], [.041, .44, .022], 'ochre'); for (let i = 0; i < 6; i++) m.box([-.48, .846 + i * .056, .157], [.024, .006, .007], 'ink');});
  },
  warteschlange(m) {
    glasses(m, true); watch(m);
    m.bone('Spine', () => {for (const y of [1.016, 1.192, 1.283]) m.box([0, y, .282], [.36, .026, .019], 'trim');});
    m.bone('Hand_L', () => {
      m.box([-.465, .804, .17], [.21, .35, .105], 'oxide', .020);
      m.box([-.451, .804, .232], [.167, .31, .020], 'paper');
      m.box([-.554, .804, .172], [.025, .35, .122], 'oxide');
      m.lathe([-.553, .74, .24], [0, 0, 1], [[0, .024], [.01, .024]], 'steel', 8);
    });
    m.bone('Hand_R', () => {
      m.box([.48, .667, .143], [.166, .394, .02], 'paper', .006);
      m.box([.498, .454, .163], [.202, .064, .022], 'paper', .01);
      m.text('038', [.48, .771, .164], .056, .15, 'ink');
      for (let i = 0; i < 4; i++) m.box([.48, .681 - i * .041, .165], [.113, .007, .007], 'ink');
    });
  }
};
export function buildStreetCharacter(id) {
  const profile = STREET_CATALOG.find(p => p.id === id);
  if (!profile) throw new RangeError(`Unknown street character: ${id}`);
  const mesh = new CharacterMesh(profile); clothing(mesh, profile); face(mesh, profile); accessories[id](mesh);
  return mesh.finish();
}
export function createStreetGLB(id) {return encodeCharacterGLB(buildStreetCharacter(id));}
