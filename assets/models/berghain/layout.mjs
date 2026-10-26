import {calibrateStudy, calibration} from './calibration.mjs';
import {addInteriorFixtures,fitFoyerChairs} from './interior-fixtures.mjs';
import {addSoundSystem,suspendMainSubwall,fitPanoramaSoundSystem} from './sound-system.mjs';
import {addArtworks,artworkMaterials} from './artworks.mjs';
import {addLandscape, landscapeMaterials} from './landscape.mjs';
import {addExteriorDetails} from './exterior-details.mjs';
import {addUpperLounge,addLoungeFurniture,loungeMaterials} from './upper-lounge.mjs';
import {addPanoramaCeiling} from './panorama-services.mjs';
import {addKloRooms,kloMaterials} from './klo-bar.mjs';
import {addLabRooms,labMaterials} from './lab-oratory.mjs';
import {addOriginalBalustrades} from './original-balustrades.mjs';
import {mainBarMaterials} from './main-bar.mjs';
import {sauleMaterials} from './saule.mjs';
import {addHalleStructure} from './halle.mjs';
import {addInteriorTopology,pinInteriorTopologyTones} from './interior-topology.mjs';
import {addAdmission,finishAdmission,admissionMaterials} from './admission.mjs';
import {addArchitecturalCirculation,smokingToAuthor} from './architectural-circulation.mjs';
import {addMainHallDetails,fitMainHallRoofFrame} from './main-hall-details.mjs';
import {addGroundSanitary} from './ground-sanitary.mjs';
import {registerPanorama} from './panorama-registration.mjs';
import {registerMainHall} from './main-hall-registration.mjs';
import {registerGround} from './ground-registration.mjs';
import {fitUpperSanitary} from './upper-sanitary.mjs';

export const materials = {
  ...admissionMaterials,
  ...landscapeMaterials,
  ...artworkMaterials,
  ...loungeMaterials,
  ...kloMaterials,
  ...labMaterials,
  ...mainBarMaterials,
  ...sauleMaterials,
  render: {color: '#b4b0a5', roughness: .96},
  concrete: {color: '#77766e', roughness: .98},
  pale: {color: '#c0bcb1', roughness: .94},
  panoramaCeilingWash: {color: '#c0bcb1', roughness: .94},
  recess: {color: '#8e8c83', roughness: .98},
  darkConcrete: {color: '#53554f', roughness: 1},
  stone: {color: '#85837b', roughness: .98},
  floor: {color: '#494b47', roughness: .78},
  steel: {color: '#495250', roughness: .55, metalness: .6},
  rust: {color: '#55483c', roughness: .92, metalness: .3},
  glass: {color: '#647773', roughness: .3, metalness: .12},
  lightGlass: {color: '#83938e', roughness: .25, transparent: true, opacity: .32},
  groundGlass: {color: '#83938e', roughness: .25, transparent: true, opacity: .32, depthWrite: false},
  rubber: {color: '#171a19', roughness: .92},
  timber: {color: '#6b5947', roughness: .9},
  gravel: {color: '#76766a', roughness: 1},
  ground: {color: '#444843', roughness: 1},
  foliage: {color: '#3f5140', roughness: 1},
  warm: {color: '#c2ad7d', roughness: .6, emissive: '#bfa36f', emissiveIntensity: .5},
  red: {color: '#6f2521', roughness: .5, emissive: '#be3020', emissiveIntensity: .55},
  upholstery: {color:'#282825',roughness:.88},
  foyerPlatformTop: {color:'#817867',roughness:.93},
  aluminium: {color:'#8b9087',roughness:.38,metalness:.72},
  opal: {color:'#cbd6c2',roughness:.6,emissive:'#8abc9b',emissiveIntensity:.35},
  speakerViolet:{color:'#73657c',roughness:.82},
  paRedMetal:{color:'#822f28',roughness:.58,metalness:.4}
};

export const layout = {units: 'metres', confidence: 'provisional', floors: [], solids: [], parts: []};

function box(name, center, size, material = 'concrete', section = 'structure', solid = false) {
  const part = {name, center, size, material, section, shape: 'box'};
  layout.parts.push(part);
  if (solid) layout.solids.push({name, x: [center[0] - size[0] / 2, center[0] + size[0] / 2],
    y: [center[1] - size[1] / 2, center[1] + size[1] / 2], z: [center[2] - size[2] / 2, center[2] + size[2] / 2], renderPart: part});
}

function floor(name, x, z, y, material = 'floor', section = 'interior') {
  layout.floors.push({name, x, z, y});
  box(name, [(x[0] + x[1]) / 2, y - .2, (z[0] + z[1]) / 2], [x[1] - x[0], .4, z[1] - z[0]], material, section, true);
}

function beam(name, start, end, width = .06, material = 'steel', section = 'interior') {
  layout.parts.push({name, start, end, width, material, section, shape: 'beam'});
}

function railing(name, start, end, section = 'interior') {
  for (const height of [.12, .55, 1.08]) beam(name, [start[0], start[1] + height, start[2]], [end[0], end[1] + height, end[2]], .045, 'steel', section);
  const count = Math.ceil(Math.hypot(end[0] - start[0], end[2] - start[2]) / 1.5);
  for (let i = 0; i <= count; i++) {
    const t = i / count, x = start[0] + (end[0] - start[0]) * t, y = start[1] + (end[1] - start[1]) * t, z = start[2] + (end[2] - start[2]) * t;
    beam(name, [x, y, z], [x, y + 1.1, z], .045, 'steel', section);
  }
}

function stair(name, x, z0, z1, y0, y1, width, steps, section='structure') {
  const ramp = {name, x: [x - width / 2, x + width / 2], z: [z0, z1], y: y1, endY: y0};
  layout.floors.push(ramp);
  layout.solids.push({name, x: ramp.x, z: ramp.z, y: [y0 - .15, y1], ramp});
  for (let i = 0; i < steps; i++) {
    const depth = (z1 - z0) / steps, height = y1 - (y1 - y0) * (i + .5) / steps;
    box(name + ' tread', [x, height - .06, z0 + depth * (i + .5)], [width, .12, depth + .015], 'steel', section, true);
    layout.solids.at(-1).undersideOnly = true;
    layout.solids.at(-1).treadFloor = ramp;
  }
  for (const dx of [-width / 2, width / 2]) railing(name + ' rail', [x + dx, y1, z0], [x + dx, y0, z1],section);
}

// P02 (2007) and P16 (2017): twelve entrance-elevation openings,
// wider blind fields near both ends, nine lower grilles and seventeen vents.
// Fractions are perspective-photo estimates, not measured bay dimensions.
export const entranceElevation = {
  sources:['P02','P16'],
  openings:[.075,.197,.268,.339,.409,.480,.551,.622,.691,.759,.826,.926],
  openingWidth:.036,
  grilles:[.082,.198,.304,.410,.517,.624,.724,.820,.923],
  vents:Array.from({length:17},(_,i)=>.084+i*.0524),
  confidence:'Observed counts and end-field pattern; spacing, widths and elevations estimated',
  panorama:'Six shuttered openings match the primary six-window sequence; exact room/floor registration unresolved'
};

function facade(axis, fixed, minimum, maximum, top, name) {
  const count = Math.round((maximum - minimum) / 4), pitch = (maximum - minimum) / count;
  const outward = fixed < 0 ? -1 : 1;
  const center = (along, y, out = 0) => axis === 'x' ? [along, y, fixed + outward * out] : [fixed + outward * out, y, along];
  const size = (length, height, depth) => axis === 'x' ? [length, height, depth] : [depth, height, length];
  const face = (label, along, y, length, height, depth, material, solid = false, out = 0) =>
    box(name + ' ' + label, center(along, y, out), size(length, height, depth), material, 'shell', solid);
  // Photo-estimated elevations in the calibrated building's metres. Convert
  // to the retained authoring frame; calibration still owns the final mass.
  const authorY = y => y <= 13.25 ? y : 13.25 + (y - 13.25) * (top - 13.25) / (calibration.mainRoof - 13.25);
  const band = (label, along, low, high, width, depth, material, solid = true, out = 0) =>
    face(label, along, (authorY(low) + authorY(high)) / 2, width, authorY(high) - authorY(low), depth, material, solid, out);
  const tiers = [[4.5, 5.25], [6.3, 8.15], [name === 'south' ? 9.9 : 9.7, 13.65], [14.8, 17.3]];
  // The ground entrance/plinth has its own retained arrangement.
  for (let i = 0; i < count; i++) {
    const along = minimum + (i + .5) * pitch;
    const entrance = name === 'south' && Math.abs(along) < 2;
    if (entrance) {
      face('door lintel', along, 3.75, pitch, .7, .55, 'stone', true);
      face('door jamb', along - 1.8, 1.7, .4, 3.4, .55, 'stone', true);
      face('door jamb', along + 1.8, 1.7, .4, 3.4, .55, 'stone', true);
    } else {
      for (const side of [-1, 1]) face('plinth pier', along + side * (pitch + 1.15) / 4, 2.05, (pitch - 1.15) / 2, 4.1, .55, 'stone', true);
      band('plinth lower panel', along, 0, 1.3, 1.15, .55, 'stone');
      band('plinth upper panel', along, 3.2, 4.1, 1.15, .55, 'stone');
      face('ground window', along, 2.25, 1.15, 1.9, .07, 'glass', true);
    }
  }
  const front = name === 'south';
  const centers = front ? entranceElevation.openings.map(t=>minimum+t*(maximum-minimum))
    : Array.from({length:count},(_,i)=>minimum+(i+.5)*pitch);
  const opening = front ? entranceElevation.openingWidth*(maximum-minimum) : pitch*.52;
  for (let i=0;i<centers.length;i++) {
    const along=centers[i],left=i===0?minimum:(centers[i-1]+along)/2,
      right=i===centers.length-1?maximum:(along+centers[i+1])/2;
    for (const [a,b] of (front ? [[left,along-opening/2],[along+opening/2,right]] : []))
      band('window jamb field',(a+b)/2,4.1,17.7,b-a,.54,'render');
    for (const side of [-1, 1]) {
      // Each observed opening has its own projecting masonry edge.
      if (!front) band('window jamb field', along + side * (pitch + opening) / 4, 4.1, 17.7, (pitch - opening) / 2, .54, 'render');
      band('pilaster', along + side * (front ? opening/2+.2 : pitch/2-.25), 4.1, 17.7, front?.4:.5, .76, 'render');
    }
    let previous = 4.1;
    for (const [low, high] of tiers) {
      if (low - previous > .8) {
        const panelLow = previous + .16, panelHigh = low - .16;
        // A 7 cm photo-estimated inset, bounded by actual masonry rims.
        // These pieces close the wall and share its collision geometry.
        band('recessed panel', along, panelLow, panelHigh, opening - .24, .4, 'render');
        for (const side of [-1, 1]) band('panel side rim', along + side * (opening / 2 - .06), panelLow, panelHigh, .12, .54, 'render');
        band('panel lower rim', along, previous, panelLow, opening, .54, 'render');
        band('panel upper rim', along, panelHigh, low, opening, .54, 'render');
      } else band('masonry spandrel', along, previous, low, opening, .54, 'render');
      band('tier window', along, low, high, opening, .1, 'glass');
      for (const offset of [-opening / 4, 0, opening / 4]) band('window mullion', along + offset, low, high, .045, .12, 'steel', false, .07);
      for (const side of [-1, 1]) band('window frame', along + side * opening / 2, low, high, .09, .18, 'steel', false, .07);
      const rows = Math.max(2, Math.round((high - low) / .65));
      for (let row = 1; row < rows; row++) {
        const y = low + (high - low) * row / rows;
        band('window transom', along, y - .025, y + .025, opening, .12, 'steel', false, .07);
      }
      band('window lintel', along, high, high + .12, opening + .12, .64, 'render');
      band('window sill', along, low - .1, low, opening + .15, .22, 'stone', true, .32);
      previous = high;
    }
    band('masonry head', along, previous, 17.7, opening, .54, 'render');
  }
  if(front)band('attic',(minimum+maximum)/2,17.7,calibration.mainRoof,maximum-minimum,.55,'render');
  else for(const along of centers)band('attic',along,17.7,calibration.mainRoof,pitch,.55,'render');
  const grilleCenters=front?entranceElevation.grilles.map(t=>minimum+t*(maximum-minimum))
    :centers.filter((_,i)=>i%2===0);
  for(const along of grilleCenters){
    band('attic grille recess',along,18.05,19.12,.6,.03,'rubber',false,.29);
    for(let row=0;row<13;row++){
      const y=18.08+row*.083;
      band('attic grille slat',along,y,y+.028,.56,.04,'pale',false,.32);
    }
  }
  const ventCenters=front?entranceElevation.vents.map(t=>minimum+t*(maximum-minimum)):centers;
  for(const along of ventCenters)band('upper attic vent',along,19.7,19.84,.52,.03,'rubber',false,.29);
  for(let i=0;i<count;i++)for(let y=.55;y<4;y+=.63){
    const along=minimum+(i+.5)*pitch;
    // The entrance jambs define a clear +/-1.6 m opening below 3.4 m.
    // Decorative joints stop at that opening, including above visitor height.
    if(name==='south'&&Math.abs(along)<2&&y<3.4){
      const edge=pitch/2-.03,width=edge-1.6;
      for(const side of [-1,1])face('rustication',along+side*(edge+1.6)/2,y,width,.035,.025,'recess',false,.29);
    }else face('rustication',along,y,pitch-.06,.035,.025,'recess',false,.29);
  }
  for (const [low, high, depth, extension] of [[17.7, 17.86, .86, .25], [19.22, 19.31, .75, .2],
    [20.23, 20.39, 1.05, .8], [20.4, 20.52, 1.15, 1]]) {
    band('cornice', (minimum + maximum) / 2, low, high, maximum - minimum + extension, depth, 'pale');
  }
  face('belt', (minimum + maximum) / 2, 4.18, maximum - minimum + .4, .18, .8, 'pale');
}

floor('forecourt', [-65, 65], [-65, 65], 0, 'ground', 'site');
floor('foyer', [-21.5, 21.5], [-21.5, 21.5], .05);
floor('Berghain dance floor', [-4, 21.5], [-21.5, 9.4], 5.45);
floor('main stair landing', [6.4, 9.6], [8.8, 9.5], 5.45);
floor('western first-floor passage', [-21.5, -4], [-21.5, 9.4], 5.45);
floor('Panorama Bar', [-21.5, -5], [-21.5, -5], 13.25);
floor('Panorama lounge', [-21.5, -7], [-5, 9.4], 13.25);
floor('Panorama stair landing', [-7.1, -3.1], [-6.5, -5], 13.25);
floor('Halle ground', [-21.5, 21.5], [-43.5, -22.5], .05);
floor('Halle upper west outer', [-21.5, -18.5], [-43.5, -22.5], 7.05);
floor('Halle upper west inner', [-15.5, -13], [-43.5, -22.5], 7.05);
floor('Halle west upper landing', [-18.5, -15.5], [-43.5, -39.5], 7.05);
floor('Halle west south landing', [-18.5, -15.5], [-25, -22.5], 7.05);
floor('Halle upper east', [13, 21.5], [-43.5, -22.5], 7.05);
floor('Halle upper north', [-13, 13], [-43.5, -39], 7.05);
floor('garden', [22.5, 49], [-19, 22], .05, 'gravel', 'garden');
stair('main stair', 8, 9.4, 20.5, .05, 5.45, 3, 37);
stair('Panorama stair', -5, -5, 8.5, 5.45, 13.25, 3, 36);
stair('Halle west stair', -17, -39.5, -25, .05, 7.05, 3, 39);
railing('foyer gallery west rail', [-21.5, 5.45, 9.4], [6.4, 5.45, 9.4]);
railing('foyer gallery east rail', [9.6, 5.45, 9.4], [21.5, 5.45, 9.4]);
railing('Halle upper west rail', [-13, 7.05, -39], [-13, 7.05, -22.6]);
railing('Halle upper east rail', [13, 7.05, -39], [13, 7.05, -22.6]);

facade('x', 22, -22, 22, 24.7, 'south');
facade('z', -22, -22, 22, 24.7, 'west');
facade('z', 22, -22, 22, 24.7, 'east');
box('north club wall', [0, 12.35, -22], [44, 24.7, .5], 'render', 'shell', true);
box('club roof', [0, 24.6, 0], [44, .3, 44], 'darkConcrete', 'roof');
box('roof plant', [-10, 25.5, -8], [9, 1.8, 6], 'render', 'roof');
box('Halle roof', [0, 22, -33], [44, .35, 22], 'darkConcrete', 'roof');
for (const x of [-22, 22]) box('Halle side wall', [x, 11, -33], [.5, 22, 22], 'render', 'shell', true);
box('Halle north wall', [0, 11, -44], [44, 22, .5], 'render', 'shell', true);
for (let x = -18; x <= 18; x += 6) {
  const columnX = x === -18 ? -20.5 : x; // Inferred grid must leave the provisional stair lane clear.
  for (const z of [-40, -27]) box('Halle column', [columnX, 10.5, z], [.85, 21, .85], 'concrete', 'structure', true);
  box('Halle roof beam', [columnX, 20.8, -33], [.5, 1, 21], 'concrete');
}
for (const x of [-9, 0, 9]) layout.parts.push({name: 'historic boiler hopper', center: [x, 16.5, -33],
  size: [4.5, 6, 4.5], material: 'darkConcrete', section: 'structure', shape: 'hopper'});

for (const x of [-19, -10, -1, 8, 19]) {
  for (const z of [-18, -7, 6]) box('load-bearing column', [x, 12.1, z], [.72, 24.1, .72], 'concrete', 'structure', true);
  for (const y of [5.1, 12.95, 23.6]) box('structural beam', [x, y, -6], [.65, .7, 30], 'concrete');
}
for (const z of [-18, -7, 6]) box('cross beam', [0, 23.4, z], [43, 1, .8], 'concrete');
box('Säule glass partition left', [-4, 2.5, 1], [.12, 4.9, 33], 'lightGlass', 'interior', true);
box('foyer west partition', [-10, 2.55, 12], [20, 5, .22], 'darkConcrete', 'interior', true);
box('cloakroom counter', [-15, 1.08, 15.7], [10, 1.1, 1.1], 'rubber', 'interior', true);
for (let x = -19; x < -10; x += .45) beam('cloakroom hanger', [x, 2.2, 17], [x, 2.6, 17], .025);
box('Säule stage', [5, .3, -18], [6, .5, 3], 'rubber', 'interior', true);
box('Säule booth', [5, 1.15, -18], [3.8, 1.2, .9], 'steel', 'interior', true);
box('main DJ platform', [5, 5.75, -18.6], [6, .6, 3.7], 'rubber', 'interior', true);
box('main DJ desk', [5, 6.8, -18], [3.8, 1.3, .85], 'rubber', 'interior', true);
for (const x of [-1.5, 11.5]) for (const z of [-15, 4]) {
  box('speaker stack', [x, 8.6, z], [1.1, 3.8, 1.2], 'rubber', 'interior', true);
  for (const y of [7.35, 8.3, 9.25]) box('speaker horn', [x, y, z + .62], [.86, .65, .06], 'darkConcrete');
}
box('bar hall counter', [18.4, 7.65, -5], [1.1, 2, 16], 'rubber', 'interior', true);
box('bar back', [21.1, 8.1, -5], [.6, 2.9, 16], 'steel', 'interior', true);
for (let z = -11; z < 3; z += .65) for (const y of [7.8, 8.4, 9]) box('bar bottle', [20.7, y, z], [.13, .32, .13], 'glass');
box('Panorama bar counter', [-18, 14.25, -10], [1.3, 2, 12], 'rubber', 'interior', true);
box('Panorama DJ desk', [-10, 14.1, -18.5], [4, 1.3, .8], 'steel', 'interior', true);
for (const x of [-14, -9]) box('Panorama speaker', [x, 14.6, -17], [.7, 2, .65], 'rubber', 'interior', true);
for (let x = -19; x <= -10; x += 3) {
  box('lounge concrete seat', [x, 13.65, 6], [2.6, .8, 1.5], 'concrete', 'interior', true);
  box('lounge cushion', [x, 14.1, 6], [2.3, .16, 1.2], 'rubber');
}
for (const z of [-4, 3]) {
  box('foyer concrete seat', [15, .45, z + 15], [3.4, .8, 1.5], 'concrete', 'interior', true);
  box('foyer seat back', [15, .9, z + 15.6], [3.4, 1, .18], 'concrete');
}
for (let i = 0; i < 7; i++) {
  box('industrial service pipe', [-20 + i * .13, 23, 0], [.08, .08, 42], i < 3 ? 'rust' : 'steel');
}
for (const x of [-19, -10, -1, 8, 19]) for (const z of [-18, -7, 6]) {
  box('Säule column light', [x, 2.4, z + .38], [.75, .1, .035], 'red');
}
for (const z of [-16, -6, 4]) {
  box('main lighting truss', [4, 16.5, z], [15, .12, .12], 'steel');
  for (const x of [-2, 2, 6, 10]) box('main lamp', [x, 16.25, z], [.28, .35, .3], 'steel');
}
for (const x of [-22.8, 22.8]) for (const z of [-16, 16]) beam('rainwater downpipe', [x, .2, z], [x, 24, z], .14, 'rust', 'shell');
box('garden bar', [35, .65, 0], [3, 1.3, 10], 'timber', 'garden', true);
for (const z of [-17, 20]) box('garden boundary', [36, .55, z], [26, 1.1, .4], 'concrete', 'garden', true);
box('garden east boundary', [49, 1, 1.5], [.4, 2, 37], 'concrete', 'garden', true);
for (let z = -14; z <= 16; z += 5) {
  box('garden seat', [46.5, .45, z], [2, .9, 3], 'concrete', 'garden', true);
}
for (const x of [-12, -6, 6, 12]) {
  beam('queue post', [x, 0, 30], [x, 1, 30], .06, 'steel', 'site');
  beam('queue rail', [x, .8, 27], [x, .8, 36], .04, 'steel', 'site');
  layout.solids.push({name: 'queue rail', x: [x - .03, x + .03], y: [0, 1.03], z: [26.98, 36.02]});
}

export const viewpoints = {
  groundToilets:{label:'Ground toilets',position:{x:-13.2,y:.05,z:20.6},yaw:Math.PI/2,
    confidence:'Ground cloakroom adjacency supported; placement and fittings estimated',sources:['U02','A01']},
  eisbar:{label:'Eisbar',position:{x:18.8,y:8.75,z:-14.6},yaw:.32,pitch:.12,
    confidence:'Raised mezzanine supported; datum, dimensions and registration estimated',sources:['A01','I04','I23','U02']},
  smoking:{label:'Smoking stair',position:Object.fromEntries(smokingToAuthor([27,13.25,-20]).map((v,i)=>[['x','y','z'][i],v])),yaw:2.8+Math.PI/2,pitch:-.4,
    confidence:'Photographed enclosure; upper interior connection unresolved',sources:['A01','I23','U02']},
  admission:{label:'Admission',position:{x:-6.3,y:.05,z:20.8},yaw:-.55,
    confidence:'Reported sequence; room and counter positions estimated',sources:['ENT03','ENT04']},
  queue:{label:'Queue',position:{x:-1.2,y:0,z:28.4},yaw:.2,
    confidence:'Photographed forms; arrangement and dimensions estimated',sources:['ENT01','ENT02']},
  foyer: {label: 'Foyer', position: {x: 0, y: .05, z: 19}, yaw: -.3,
    confidence: 'Approximate layout', sources: ['A01', 'I01', 'I02', 'I08', 'I09']},
  berghain: {label: 'Berghain', position: {x: 5, y: 5.45, z: 5}, yaw: 0,
    confidence: 'Approximate layout; reported PA arrangement', sources: ['A01', 'I01', 'I02', 'P05', 'S05', 'S07', 'S08', 'S09', 'S10']},
  panorama: {label: 'Panorama Bar', position: {x: -11, y: 13.25, z: -7}, yaw: 0,
    confidence: 'Approximate layout; artwork study', sources: ['A01', 'A07', 'I01', 'I02', 'A13', 'I11', 'ART02', 'ART03', 'ART13']},
  lounge: {label:'Upper Panorama lounge',position:{x:-11.4,y:16.35,z:.8},yaw:Math.PI/2,
    confidence:'Photo-derived forms; layout estimated',sources:['A13','I16','I18','I19','I20']},
  klo:{label:'Klo Bar',position:{x:-13,y:5.45,z:7.8},yaw:.25,
    confidence:'Photo-derived forms; room placement and Together sequence estimated',sources:['ART04','ART14','I19']},
  toilets:{label:'Toilets',position:{x:-9,y:5.45,z:-4.2},yaw:1.08,pitch:-.08,
    confidence:'Photographed fittings; floor, arrangement and dimensions estimated',sources:['I21']},
  saule: {label: 'Säule', position: {x: 5, y: .05, z: 4}, yaw: 0,
    confidence: 'Approximate layout', sources: ['I01', 'I02', 'I06']},
  lab:{label:'Lab.oratory',position:{x:-8.5,y:.05,z:-8.5},yaw:.65,
    confidence:'Photographed forms; footprint, levels, arrangement and connection estimated',sources:['A12','I22','A15']},
  halle: {label: 'Halle', position: {x: 4, y: .05, z: -25}, yaw: 0,
    confidence: 'Height documented; layout approximate', sources: ['A05', 'A06']},
  garden: {label: 'Garden', position: {x: 29, y: .05, z: 15}, yaw: -.2,
    confidence: 'Approximate layout', sources: ['I01']}
};

addLandscape(layout);
addExteriorDetails(layout);
addUpperLounge(layout,{box,floor,beam,railing,stair});
addPanoramaCeiling(layout,{box});
addKloRooms(layout,{box});
addInteriorTopology(layout,{box});
addLabRooms(layout,{box,floor,beam,railing,stair});
addAdmission(layout);
calibrateStudy(layout, viewpoints);
finishAdmission(layout);
addOriginalBalustrades(layout);
addInteriorFixtures(layout);
addLoungeFurniture(layout);
addSoundSystem(layout);
addArtworks(layout);
pinInteriorTopologyTones(layout);
fitFoyerChairs(layout);
addArchitecturalCirculation(layout);
addHalleStructure(layout);
addMainHallDetails(layout);
addGroundSanitary(layout);
registerPanorama(layout,viewpoints);
registerMainHall(layout,viewpoints);
fitMainHallRoofFrame(layout);
registerGround(layout,viewpoints);
fitUpperSanitary(layout);
suspendMainSubwall(layout);
fitPanoramaSoundSystem(layout);
