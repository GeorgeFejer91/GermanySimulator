/* ENV-01 office dressing for the existing 16 m Bürgeramt hall.
 * No renderer, camera, character, phone, queue or mission state is created.
 */
(function(scope){
  'use strict';
  const obstacles=Object.freeze([
    ...[-7.08,7.08].flatMap(x=>[-6.35,-2.45,3.05].map(z=>Object.freeze({id:`archive-${x}-${z}`,x,z,w:.58,d:1.22}))),
    Object.freeze({id:'copy-fax-corner',x:-6.35,z:-7.45,w:1.04,d:.79}),
    Object.freeze({id:'filing-trolley',x:6.5,z:-7.2,w:.78,d:.55})
  ]);
  const signs = [
    ['BÜRGERAMT', 'ABTEILUNG 03 · VORSPRACHE'], ['SCHALTER 1', 'BITTE NICHT DRÄNGELN'],
    ['SCHALTER 2', 'NUR MIT VOLLSTÄNDIGEN UNTERLAGEN'], ['SCHALTER 3', 'FRAU KNICK · SACHBEARBEITUNG'],
    ['NUMMER ZIEHEN', 'ANSCHLIESSEND BITTE WARTEN'], ['BITTE WARTEN', 'STEHEN BESCHLEUNIGT DEN VORGANG NICHT'],
    ['DIGITALISIERUNG', 'BITTE PER FAX EINREICHEN'], ['KOPIEN', 'NUR VOM ORIGINAL'],
    ['ORIGINALE', 'NUR MIT ZWEIFACHER KOPIE'], ['POSTEINGANG', 'NOCH NICHT ZUSTÄNDIG'],
    ['POSTAUSGANG', 'ZUSTÄNDIGKEIT WEITERGELEITET'], ['ABLAGE P', 'VORGANG ERLEDIGT'],
    ['SPRECHZEIT', 'DIENSTAG · NUR NACH VEREINBARUNG'], ['FORMBLATT 08/15', 'BITTE IN DRUCKBUCHSTABEN'],
    ['A38 · EINGANG', 'UNVOLLSTÄNDIG'], ['A38 · AUSGANG', 'ZUR ERGÄNZUNG ZURÜCK'],
    ['WIEDERVORLAGE', 'NACH EINGANG DER WIEDERVORLAGE'], ['DATENSCHUTZ', 'BITTE HINTER DER LINIE WARTEN'],
    ['KEINE AUSKUNFT', 'OHNE VORLIEGENDE AKTE'], ['AKTEN 1998–2004', 'NICHT ENTSORGEN'],
    ['AKTEN 2005–2012', 'DAUERHAFT VORLÄUFIG'], ['AKTEN 2013–2026', 'IN BEARBEITUNG'],
    ['INTERN', 'ZUTRITT NUR NACH AUFFORDERUNG'], ['HEFTKLAMMERN', 'VOR DEM KOPIEREN ENTFERNEN'],
    ['DIENSTANWEISUNG', 'DIESE MITTEILUNG NICHT ENTFERNEN'], ['KAFFEEKASSE', 'PASSEND EINWERFEN'],
    ['FAX 3000', 'ZUKUNFT AUF PAPIER'], ['PAPIERSTAU', 'FACH 2 · BITTE NICHT ÖFFNEN'],
    ['FUNDSACHEN', 'ABHOLUNG NUR GEGEN NACHWEIS'], ['FLUCHTWEG', 'FREIHALTEN'],
    ['ANTRAG AUF ANTRAG', 'UNTERSCHRIFT NICHT VERGESSEN'], ['BITTE NICHT STÖREN', 'BEARBEITUNGSPAUSE']
  ];
  function randomSource(seed) { let n = seed >>> 0; return () => ((n = (Math.imul(n, 1664525) + 1013904223) >>> 0) / 4294967296); }
  function create(T, options = {}) {
    if (!T || typeof T.Group !== 'function') throw new TypeError('Bürgeramt office requires the existing Three.js instance');
    const doc = options.document || scope.document;
    if (!doc?.createElement) throw new TypeError('Bürgeramt office requires a canvas-capable document');
    const compact = options.compact ?? ((scope.innerWidth || 1024) < 700);
    const scene = new T.Group(); scene.name = 'AmtOfficeDetail';
    const room = new T.Group(); room.name = 'AmtOfficeDressing'; scene.add(room);
    const textures = new Set(), materials = new Set(), geometries = new Set(), batches = new Map();
    const counts = Object.create(null), signsPlaced = [], signPositions = [], signUV = [];
    const random = randomSource(380815), dummy = new T.Object3D();
    let disposed = false, parent = null, instanceCount = 0, triangleCount = 0;
    const appliedMaps = [];
    let shift = {x:0,y:0,z:0};
    function placed(x,y,z,fn){const old=shift;shift={x,y,z};try{fn()}finally{shift=old}}
    function canvas(w, h) { const c = doc.createElement('canvas'); c.width = w; c.height = h; const ctx = c.getContext('2d'); if (!ctx) throw new Error('Canvas 2D unavailable'); return { c, ctx }; }
    function texture(c, repeat = false) {
      const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace;
      if (repeat) t.wrapS = t.wrapT = T.RepeatWrapping;
      t.anisotropy = Math.min(4, options.anisotropy || 1); textures.add(t); return t;
    }
    function surface(kind) {
      const { c, ctx } = canvas(256, 256), rng = randomSource(kind.length * 731 + kind.charCodeAt(0));
      ctx.fillStyle = { lino: '#a6a38c', plaster: '#d4cdb7', wood: '#b6a388', paper: '#e5d8b5', fabric: '#899086', ceiling: '#ded9c8' }[kind]; ctx.fillRect(0, 0, 256, 256);
      const amount = compact ? 1500 : 3500;
      for (let i = 0; i < amount; i++) {
        const tone = Math.floor(60 + rng() * 120); ctx.fillStyle = `rgba(${tone},${tone},${tone},${kind === 'plaster' ? .065 : kind === 'wood' ? .035 : .13})`;
        ctx.fillRect(rng() * 256, rng() * 256, kind === 'wood' ? 20 + rng() * 80 : 1 + rng() * 3, 1 + rng() * 2);
      }
      if (kind === 'lino') {
        ctx.strokeStyle = 'rgba(57,53,43,.35)'; ctx.lineWidth = 1;
        ctx.strokeRect(.5, .5, 255, 255); ctx.beginPath(); ctx.moveTo(128, 0); ctx.lineTo(128, 256); ctx.moveTo(0, 128); ctx.lineTo(256, 128); ctx.stroke();
        for (let i = 0; i < 28; i++) { ctx.strokeStyle = `rgba(48,43,34,${.02 + rng() * .08})`; ctx.lineWidth = 1 + rng() * 2; ctx.beginPath(); const x = rng() * 256, y = rng() * 256; ctx.moveTo(x, y); ctx.lineTo(x + rng() * 26, y + rng() * 8); ctx.stroke(); }
      }
      if (kind === 'paper') {
        ctx.fillStyle = '#625b4b'; ctx.font = 'bold 17px monospace'; ctx.fillText('FORMBLATT A38', 19, 30); ctx.fillRect(17, 40, 219, 2);
        for (let y = 65; y < 210; y += 23) { ctx.strokeStyle = '#a29a81'; ctx.strokeRect(18, y - 7, 8, 8); ctx.fillStyle = '#a49a80'; ctx.fillRect(37, y - 5, 185 - (y % 37), 2); }
        ctx.save(); ctx.translate(150, 204); ctx.rotate(-.15); ctx.strokeStyle = '#975a4d'; ctx.lineWidth = 3; ctx.strokeRect(-61, -18, 110, 26); ctx.fillStyle = '#975a4d'; ctx.font = 'bold 14px monospace'; ctx.fillText('EINGEGANGEN', -57, 0); ctx.restore();
      }
      if (kind === 'ceiling') { ctx.strokeStyle = '#aaa58f'; ctx.strokeRect(1, 1, 254, 254); for (let y = 6; y < 250; y += 8) for (let x = 6; x < 250; x += 8) { ctx.fillStyle = 'rgba(72,66,55,.12)'; ctx.fillRect(x, y, 1, 1); } }
      if (kind === 'fabric') { ctx.fillStyle = 'rgba(45,51,44,.1)'; for (let i = 0; i < 256; i += 3) { ctx.fillRect(i, 0, 1, 256); ctx.fillRect(0, i, 256, 1); } }
      return texture(c, kind !== 'paper');
    }
    function material(color, map = null, roughness = .9, basic = false) {
      const m = basic ? new T.MeshBasicMaterial({ color, map }) : new T.MeshStandardMaterial({ color, map, roughness }); materials.add(m); return m;
    }
    const maps = { lino: surface('lino'), wall: surface('plaster'), wood: surface('wood'), paper: surface('paper'), fabric: surface('fabric'), ceiling: surface('ceiling') };
    maps.lino.repeat.set(8, 10); maps.wall.repeat.set(3, 1); maps.ceiling.repeat.set(10, 12);
    const m = {
      floor: material(0xffffff, maps.lino), wall: material(0xffffff, maps.wall), lowerWall: material(0xa6ab98, maps.wall), ceiling: material(0xffffff, maps.ceiling),
      wood: material(0xffffff, maps.wood), paper: material(0xffffff, maps.paper), cream: material(0xc8c0a7), steel: material(0x676c65, null, .68),
      dark: material(0x303c39), black: material(0x292c29), rubber: material(0x45453e), burgundy: material(0x773e36), blue: material(0x465c61), olive: material(0x737852),
      upholstery: material(0x7e8d87, maps.fabric), yellow: material(0xd4b566), white: material(0xe2decb), skin: material(0xc6aa8e), hair: material(0xaca99b),
      coat: material(0x5b665e), coffee: material(0x33251a), lamp: material(0xf5edcf, null, .9, true), glass: material(0x9dafa8, null, .35)
    };
    const shapes = {
      box: new T.BoxGeometry(1, 1, 1), cylinder: new T.CylinderGeometry(1, 1, 1, 10),
      sphere: new T.SphereGeometry(1, 12, 8), torus: new T.TorusGeometry(1, .15, 6, 14)
    }; Object.values(shapes).forEach(g => geometries.add(g));
    function add(shape, mat, x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0) {
      x+=shift.x;y+=shift.y;z+=shift.z;
      if (![x, y, z, sx, sy, sz, rx, ry, rz].every(Number.isFinite) || Math.min(sx, sy, sz) <= 0) throw new Error('Invalid office primitive');
      const key = shape + ':' + mat.uuid; if (!batches.has(key)) batches.set(key, { shape, mat, items: [] });
      batches.get(key).items.push([x, y, z, sx, sy, sz, rx, ry, rz]);
    }
    const box = (x, y, z, w, h, d, mat = m.cream, ry = 0, rx = 0, rz = 0) => add('box', mat, x, y, z, w, h, d, rx, ry, rz);
    const cyl = (x, y, z, r, h, mat = m.steel, rx = 0, rz = 0) => add('cylinder', mat, x, y, z, r, h, r, rx, 0, rz);
    const ball = (x, y, z, r, mat, sx = 1, sy = 1, sz = 1) => add('sphere', mat, x, y, z, r * sx, r * sy, r * sz);
    const ring = (x, y, z, radius, mat, rx = 0, ry = 0) => add('torus', mat, x, y, z, radius, radius, radius, rx, ry, 0);
    function prop(name) { counts[name] = (counts[name] || 0) + 1; }
    // One atlas and one merged draw for all fixed signs and file labels.
    const atlasSize = compact ? 1024 : 2048, { c: atlas, ctx: at } = canvas(atlasSize, atlasSize / 2);
    const cw = atlas.width / 4, ch = atlas.height / 8;
    signs.forEach(([title, subtitle], i) => {
      const x = (i % 4) * cw, y = Math.floor(i / 4) * ch;
      at.fillStyle = i === 29 ? '#496958' : '#e6dcc1'; at.fillRect(x, y, cw, ch);
      at.strokeStyle = i === 29 ? '#d8e3cc' : '#66614f'; at.lineWidth = cw / 200; at.strokeRect(x + 4, y + 4, cw - 8, ch - 8);
      at.textAlign = 'center'; at.textBaseline = 'middle'; at.fillStyle = i === 29 ? '#eef0d8' : '#353e37';
      for (const [text, center, size] of [[title, .36, .245], [subtitle, .73, .13]]) {
        let font = ch * size; do { at.font = `bold ${font}px monospace`; if (at.measureText(text).width <= cw - 20 || font <= ch * .09) break; font -= .5; } while (true);
        at.fillText(text, x + cw / 2, y + ch * center);
      }
    });
    const signMaterial = material(0xffffff, texture(atlas), .9, true);
    function sign(id, x, y, z, w, h, ry = 0, rx = 0) {
      x+=shift.x;y+=shift.y;z+=shift.z;
      if (!signs[id]) throw new Error('Unknown office sign'); signsPlaced.push({ id, text: signs[id].join(' · '), x, y, z, w, h });
      dummy.position.set(x, y, z); dummy.rotation.set(rx, ry, 0); dummy.scale.set(1, 1, 1); dummy.updateMatrix();
      const uvLeft = (id % 4) / 4 + .001, uvRight = (id % 4 + 1) / 4 - .001;
      const uvTop = 1 - Math.floor(id / 4) / 8 - .002, uvBottom = 1 - (Math.floor(id / 4) + 1) / 8 + .002;
      for (const [vx, vy, u, v] of [[-w/2,-h/2,uvLeft,uvBottom],[w/2,-h/2,uvRight,uvBottom],[w/2,h/2,uvRight,uvTop],[-w/2,-h/2,uvLeft,uvBottom],[w/2,h/2,uvRight,uvTop],[-w/2,h/2,uvLeft,uvTop]]) {
        const point = new T.Vector3(vx, vy, 0).applyMatrix4(dummy.matrix); signPositions.push(point.x, point.y, point.z); signUV.push(u, v);
      }
    }
    function paperStack(x, y, z, sheets = 8, w = .28, d = .36) {
      prop('paper-stack'); const h = Math.min(.18, .018 + sheets * .005);
      box(x, y + h / 2, z, w, h, d, m.white);
      for (let i = 0; i < Math.min(sheets, 5); i++) box(x + (random() - .5) * .025, y + h + i * .002, z, w, .002, d, m.paper, (random() - .5) * .13);
    }
    function binder(x, y, z, color, lean = 0) {
      prop('lever-arch-file'); box(x, y, z, .065, .31, .23, color, 0, 0, lean);
      box(x, y, z + .118, .041, .20, .004, m.white, 0, 0, lean);
      for (let line = 0; line < 3; line++) box(x, y + .065 - line * .026, z + .122, .028, .003, .003, m.steel);
      ring(x, y - .091, z + .124, .011, m.black); box(x, y - .151, z + .01, .061, .008, .218, m.steel);
    }
    function shelving(x, z, rot = 0, label = 19) {
      prop('archive-cabinet'); const transform = (u, v) => [x + u * Math.cos(rot) + v * Math.sin(rot), z - u * Math.sin(rot) + v * Math.cos(rot)];
      const b = (u,y,v,w,h,d,mat) => { const p = transform(u,v); box(p[0],y,p[1],w,h,d,mat,rot); };
      b(0, 1.23, -.25, 1.2, 2.38, .05, m.steel);
      for (const side of [-1,1]) b(side*.59, 1.23, 0, .035, 2.4, .56, m.steel);
      for (const y of [.08,.52,.96,1.40,1.84,2.40]) b(0,y,0,1.2,.045,.56,m.steel);
      for (let row = 0; row < 5; row++) for (let col = 0; col < 14; col++) {
        const p = transform(-.51 + col * .077, .08); const tint = [m.dark,m.burgundy,m.blue,m.olive][(col + row * 3) % 4];
        // Shelf files are instanced in their cabinet orientation, including spine labels.
        prop('lever-arch-file'); box(p[0], .28 + row * .44, p[1], .065, .31, .23, tint, rot);
        const q = transform(-.51 + col * .077, .202); box(q[0],.28+row*.44,q[1],.041,.20,.004,m.white,rot);
        const r = transform(-.51 + col * .077, .207); add('torus',m.black,r[0],.20+row*.44,r[1],.011,.011,.011,0,rot,0);
      }
      const p = transform(0,.281); sign(label,p[0],2.24,p[1],1.04,.24,rot);
      for (let i = 0; i < 3; i++) { const p = transform(-.36+i*.36,0); box(p[0],2.54,p[1],.3,.23,.42,m.wood,rot); }
    }
    function stamp(x,y,z) { prop('rubber-stamp'); box(x,y+.027,z,.13,.053,.085,m.burgundy); cyl(x,y+.10,z,.024,.10,m.wood); ball(x,y+.165,z,.047,m.wood,1,.65,1); }
    function mug(x,y,z) { prop('coffee-mug'); cyl(x,y+.065,z,.048,.13,m.cream); cyl(x,y+.133,z,.041,.004,m.coffee); ring(x+.062,y+.074,z,.031,m.cream); }
    function tray(x,y,z) { prop('in-tray'); for (let i=0;i<3;i++) { const top=y+i*.068; box(x,top,z,.33,.013,.4,m.steel); for(const side of [-1,1])box(x+side*.168,top+.025,z,.015,.06,.4,m.steel); paperStack(x,top+.01,z,4,.28,.35); } }
    function keyboard(x,y,z) { prop('keyboard'); box(x,y+.016,z,.4,.032,.15,m.cream); for(let row=0;row<3;row++)for(let k=0;k<11;k++)box(x-.175+k*.034,y+.039,z-.055+row*.037,.026,.009,.024,m.white); box(x,y+.039,z+.058,.19,.009,.025,m.white); }
    function phone(x,y,z) { prop('desk-phone'); box(x,y+.025,z,.22,.05,.24,m.dark); for(let row=0;row<4;row++)for(let col=0;col<3;col++)box(x-.043+col*.04,y+.058,z-.028+row*.029,.022,.012,.019,m.cream); box(x-.086,y+.086,z,.045,.039,.22,m.black); for(let i=0;i<12;i++)ring(x-.145,y+.035,z-.035+i*.012,.018,m.black,Math.PI/2); }
    function monitor(x,y,z) { prop('crt-terminal'); box(x,y+.16,z,.43,.34,.31,m.cream); box(x,y+.16,z+.163,.37,.26,.018,m.black); box(x,y+.16,z+.175,.33,.21,.008,m.dark); for(let i=0;i<5;i++)box(x-.058,y+.23-i*.033,z+.182,.17-(i%2)*.06,.005,.003,m.olive); box(x,y-.035,z,.22,.065,.19,m.cream); for(let i=0;i<8;i++)box(x+.219,y+.23-i*.023,z,.006,.009,.19,m.steel); }
    function deskSupplies(x,clerkStation=false) {
      // Keep Frau Knick's face clear from the public side of Schalter 3.
      const screenOffset=clerkStation?-.74:0;
      monitor(x-.04+screenOffset,1.1775,-5.64); keyboard(x-.06+screenOffset,1.108,-5.12); phone(x+.67,1.108,-5.59); tray(x-(clerkStation?.28:.72),1.12,-5.38); mug(x+.39,1.11,-5.17);
      paperStack(x+.19,1.11,-5.44,12,.29,.37); stamp(x-.40,1.11,-5.04);
      box(x-.57,1.126,-5.05,.15,.023,.1,m.black); box(x-.57,1.141,-5.05,.124,.006,.077,m.burgundy); prop('ink-pad');
      box(x+.53,1.148,-5.03,.046,.06,.13,m.dark); box(x+.53,1.178,-5.04,.043,.026,.16,m.steel); prop('stapler');
      box(x+.74,1.13,-5.03,.14,.038,.085,m.steel); box(x+.74,1.178,-5.03,.14,.03,.048,m.black); prop('hole-punch');
      cyl(x+.42,1.16,-5.61,.037,.105,m.steel); for(let i=0;i<5;i++)cyl(x+.397+i*.010,1.245+(i%2)*.013,-5.61,.004,.17,[m.burgundy,m.blue,m.dark][i%3]); prop('pen-cup');
      for(let i=0;i<3;i++)binder(x+.44+i*.074,1.27,-5.87,[m.burgundy,m.blue,m.olive][i]);
      box(x+.19,1.119,-5.22,.084,.004,.064,m.yellow,-.15); prop('sticky-note');
      for(let i=0;i<3;i++)ring(x+.18+i*.025,1.121,-5.00,.009,m.steel,Math.PI/2); prop('paper-clips');
      sign(14,x-.76,.84,-4.869,.33,.14); sign(15,x+.76,.84,-4.869,.33,.14);
    }
    // Keep the accepted hall, rows of chairs, QR, red display and Frau Knick.
    // The integrator hides only the old four desks' simplified supplies after attach succeeds.
    for(const [i,x] of [-5.8,-1.6,3.9,6.2].entries())placed(0,-.06,-3.66,()=>deskSupplies(x,i===2));
    for(const o of obstacles.filter(o=>o.id.startsWith('archive-')))shelving(o.x,o.z,o.x<0?Math.PI/2:-Math.PI/2,o.z>0?21:o.z<-4?19:20);
    // Copier and fax are one compact corner, not a second interactive terminal.
    placed(-3.12,0,-3.39,()=>{
      box(-3.23,.43,-4.06,.96,.82,.74,m.cream);box(-3.23,.9,-4.06,1.02,.12,.77,m.steel);box(-3.23,.985,-4.10,.76,.055,.56,m.cream);
      for(let i=0;i<3;i++){box(-3.23,.25+i*.22,-3.682,.82,.19,.016,m.white);box(-3.23,.25+i*.22,-3.666,.25,.028,.024,m.steel);}
      paperStack(-3.64,1.015,-4.06,12,.16,.32);sign(27,-3.22,.69,-3.645,.73,.20);prop('photocopier');
      box(-3.25,1.1025,-4.10,.57,.17,.43,m.cream);box(-3.25,1.2175,-4.11,.54,.025,.33,m.dark);box(-3.25,1.3125,-4.33,.34,.24,.018,m.paper);box(-3.25,1.1875,-3.84,.28,.006,.21,m.paper);
      sign(26,-3.25,1.1125,-3.874,.47,.14);prop('fax-machine');
    });
    for(const y of [.24,.61,.98]){box(6.5,y,-7.2,.70,.025,.45,m.steel);paperStack(6.34,y+.025,-7.2,15,.27,.36);paperStack(6.66,y+.025,-7.2,9,.27,.36);}
    for(const x of [6.18,6.82])for(const z of [-7.38,-7.02]){cyl(x,.56,z,.016,.94,m.steel);cyl(x,.09,z,.055,.035,m.rubber,Math.PI/2);}prop('filing-trolley');
    // Fluorescent housings and louvres use the existing five luminous ceiling panels.
    for(const z of [-7.4,-3.8,0,3.8,7.4]){for(const side of [-1,1])box(0,3.946,z+side*.272,2.84,.07,.025,m.steel);for(let i=-6;i<=6;i++)box(i*.21,3.928,z,.014,.06,.54,m.cream);prop('fluorescent-louvre');}
    // Surface detail stays off the readable QR and number-board meshes.
    for(const side of [-1,1])for(const z of [-.1,6.9]){for(let i=0;i<13;i++)box(side*7.56,.72,z-.55+i*.092,.13,.69,.051,m.cream);prop('radiator');}
    // Straight-faced paperwork notices; main objective signage is not replaced.
    for(const side of [-1,1]){
      const turn=side<0?Math.PI/2:-Math.PI/2;
      sign(6,side*7.59,2.89,-7.6,1.45,.34,turn);sign(7,side*7.59,2.37,-7.6,1.35,.31,turn);sign(8,side*7.59,1.92,-7.6,1.35,.31,turn);
      sign(24,side*7.58,2.88,.18,1.55,.27,turn);sign(12,side*7.57,2.47,.18,1.48,.27,turn);sign(23,side*7.57,2.05,.18,1.48,.27,turn);
    }
    // Registration kiosk paper bundles rest on its existing 1.565 m top.
    for(let i=0;i<6;i++){
      box(-5.1+i*.18,1.585,.65,.17,.04,.25,i%2?m.paper:m.white,(i%3-1)*.08);prop('bound-paper-bundle');
    }
    for(const {shape,mat,items} of batches.values()){
      const g=shapes[shape],mesh=new T.InstancedMesh(g,mat,items.length);mesh.name='AmtBatch-'+shape+'-'+mat.color.getHexString();
      items.forEach(([x,y,z,sx,sy,sz,rx,ry,rz],i)=>{dummy.position.set(x,y,z);dummy.rotation.set(rx,ry,rz);dummy.scale.set(sx,sy,sz);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);});
      mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();room.add(mesh);instanceCount+=items.length;triangleCount+=(g.index?.count||g.attributes.position.count)/3*items.length;
    }
    const signGeometry=new T.BufferGeometry();signGeometry.setAttribute('position',new T.Float32BufferAttribute(signPositions,3));signGeometry.setAttribute('uv',new T.Float32BufferAttribute(signUV,2));signGeometry.computeVertexNormals();signGeometry.computeBoundingSphere();geometries.add(signGeometry);
    const signMesh=new T.Mesh(signGeometry,signMaterial);signMesh.name='AmtMergedSignage';room.add(signMesh);triangleCount+=signPositions.length/9;
    return {
      group:scene,
      obstacles,
      attach(target,surfaces={}){
        if(disposed)throw new Error('Office detail was disposed');
        if(parent){if(parent!==target)throw new Error('Office detail is already attached elsewhere');return;}
        if(!target||typeof target.add!=='function')throw new TypeError('An existing Three.js scene or group is required');
        for(const [name,map] of [['floor',maps.lino],['wall',maps.wall],['desk',maps.wood],['seat',maps.fabric]]){
          const material=surfaces[name];if(!material)continue;
          appliedMaps.push({material,old:material.map,map});material.map=map;material.needsUpdate=true;
        }
        target.add(scene);parent=target;
      },
      inspect(){return{disposed,attached:!!parent,compact,instances:instanceCount,triangles:triangleCount,staticDrawCalls:batches.size+1,textures:textures.size,texturePixels:[...textures].reduce((n,t)=>n+t.image.width*t.image.height,0),props:{...counts},signs:signsPlaced.map(s=>({...s})),obstacles:obstacles.map(o=>({...o}))};},
      dispose(){
        if(disposed)return;disposed=true;
        for(const {material,old,map} of appliedMaps)if(material.map===map){material.map=old;material.needsUpdate=true;}
        parent?.remove?.(scene);parent=null;
        for(const g of geometries)g.dispose();for(const mat of materials)mat.dispose();for(const t of textures)t.dispose();scene.clear();
      }
    };
  }
  const api=Object.freeze({create,obstacles});scope.GermanyAmtOfficeDetail=api;
  if(typeof module==='object'&&module.exports)module.exports=api;
})(globalThis);
