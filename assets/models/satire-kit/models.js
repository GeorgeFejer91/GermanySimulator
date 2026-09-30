/** GermanySimulator: 45 original reusable station, civic and clutter meshes.
 * No external artwork, model service, texture, new library or random geometry.
 * The original four studies supply reusable source geometry, never new copies.
 */
import {buildDetailMesh,encodePropGLB} from '../prop-details/models.js';
import {KitMesh,pigeon,bottle,stamp,pretzel,bench} from './geometry.js';
export const KIT_VERSION='satire-kit-1';
const catalog=[
 ['departure-board','station','Abfahrt nach Aktenlage'],['station-clock','station','Bahnhofsuhr'],['platform-sign','station','Gleis-Schilderbaum'],['platform-shelter','station','Wartehalle'],['ticket-machine','station','Fahrkartenautomat'],['ticket-validator','station','Entwerter'],['station-bench','station','Wartebank'],['station-bin','station','Bahnhofsmuell'],['luggage-lockers','station','Schliessfaecher'],['underpass-entrance','station','Unterfuehrung'],['regional-station','station','Regionalbahnhof'],['catenary-mast','station','Oberleitungsmast'],['platform-barrier','station','Bahnsteigabsperrung'],['pretzel-kiosk','station','Brezelbude'],['info-column','station','Informationssaeule'],['platform-edge','station','Tastkante'],['platform-lamp','station','Bahnsteiglampe'],
 ['judgmental-fax','civic','Misstrauischer Faxkiosk'],['pfand-machine','civic','Pfandpruefstelle'],['beer-crate','civic','Pfandreserve'],['kehrwoche-set','civic','Kehrwoche'],['recycling-judges','civic','Muelltrennungsgericht'],['garden-wheelbarrow','civic','Kleingarten-Schubkarre'],['garden-gnome','civic','Gartenaufsicht'],['watering-gnome','civic','Giessbeauftragter'],['ordnung-gnome','civic','Ruhebeauftragter'],['garden-shed','civic','Gartenlaube'],['forms-pedestal','civic','Antragsannahme'],['socks-sandals','civic','Sockensandalen-Denkmal'],['city-bench','civic','Sitzordnung'],['reserved-lounger','civic','Handtuchterritorium'],['currywurst-kiosk','civic','Wurstversorgung'],['passive-bin','civic','Muellaufsicht'],
 ['notice-board','clutter','Aushang'],['utility-box','clutter','Digitalisierungskasten'],['queue-barrier','clutter','Wartepflicht'],['suitcase','clutter','Reisegepaeck'],['bottle-cluster','clutter','Leergutgruppe'],['snack-litter','clutter','Imbissreste'],['planter','clutter','Normgruener Kuebel'],['traffic-cone','clutter','Leitkegel'],['bollard','clutter','Zustaendigkeitspoller'],['garden-fence','clutter','Parzellengrenze'],['rubber-stamp','clutter','Dienststempel'],['form-stack','clutter','Formularstapel']
];
export const SATIRE_CATALOG=Object.freeze(catalog.map(([id,family,title])=>Object.freeze({id,family,title})));
export const SATIRE_IDS=Object.freeze(SATIRE_CATALOG.map(p=>p.id));
function clockFace(m,y=2.5,r=.55,z=.04){
 m.lathe([0,y,z],[0,0,1],[[0,r],[.16,r]],'ink',32);m.lathe([0,y,z+.166],[0,0,1],[[0,r*.91],[.012,r*.91]],'paper',32);
 for(let i=0;i<12;i++){const a=i*Math.PI/6; m.beam([Math.sin(a)*r*.76,y+Math.cos(a)*r*.76,z+.19],[Math.sin(a)*r*.87,y+Math.cos(a)*r*.87,z+.19],r*.025,'ink',4);}
 m.beam([0,y,z+.205],[-r*.43,y+r*.26,z+.205],r*.037,'ink',5);m.beam([0,y,z+.21],[r*.53,y+r*.38,z+.21],r*.025,'ink',5);
 m.beam([0,y,z+.23],[r*.50,y-r*.49,z+.23],r*.019,'oxide',5);m.ellipsoid([r*.50,y-r*.49,z+.23],[r*.065,r*.065,.015],'oxide',8,4);
}
function boardPosts(m,w,h){for(const x of [-w*.40,w*.40]){m.box([x,h/2,0],[.10,h,.10],'steel',.012);m.box([x,.06,0],[.35,.12,.36],'ink',.02);}}
function stripedBarrier(m){
 for(const x of [-1,1]){m.box([x,.065,0],[.36,.13,.65],'ink',.025);m.box([x,.68,0],[.095,1.3,.095],'steel',.015);m.ellipsoid([x,1.45,0],[.10,.10,.08],'ochre',10,5);}
 for(const y of [.52,1.13]){m.box([0,y,0],[2.25,.22,.09],'paper',.025);for(let i=0;i<5;i++)m.box([-.94+i*.47,y,.055],[.24,.215,.026],'oxide');}
}
function wasteBin(m,color='steel',face=true){
 m.box([0,.07,0],[.61,.14,.58],'ink',.025);m.box([0,.59,0],[.57,1.03,.51],color,.055);
 m.box([0,1.21,-.08],[.65,.13,.58],'ink',.04);for(const x of [-.27,.27])m.box([x,1.095,.16],[.08,.20,.12],color,.015);
 m.box([0,1.035,.265],[.42,.11,.045],'ink');if(face)m.eyes(.88,.28,.49);
 for(const x of [-.19,.19])m.lathe([x,.09,-.21],[1,0,0],[[-.028,.08],[.028,.08]],'rubber',10);
}
function gnome(m,variant){
 for(const x of [-.16,.16])m.ellipsoid([x,.10,.05],[.17,.10,.25],'ink',10,5);
 m.ellipsoid([0,.44,0],[.32,.36,.22],'sage',14,8);m.box([0,.34,.22],[.51,.08,.035],'ink',.015);m.box([0,.34,.247],[.12,.10,.025],'ochre',.015);
 m.ellipsoid([0,.87,.02],[.24,.25,.22],'enamel',14,8);m.ellipsoid([0,.69,.15],[.24,.27,.16],'paper',12,8);
 for(const x of [-.065,.065]){m.ellipsoid([x,.90,.22],[.035,.028,.022],'ink',8,5);m.beam([x-.057,.953,.213],[x+.052,.936,.233],.027,'paper');}
 m.ellipsoid([0,.84,.29],[.085,.07,.085],'wood',10,6);
 m.lathe([0,1.04,0],[0,1,0],[[0,.275],[.16,.23],[.38,.12],[.59,.004]],'oxide',16);
 m.ellipsoid([-.31,.58,.035],[.10,.17,.11],'sage',10,5);m.ellipsoid([.31,.64,.05],[.11,.19,.11],'sage',10,5);
 m.ellipsoid([.33,.80,.10],[.07,.09,.065],'enamel',10,6);
 if(variant==='watering'){m.lathe([.43,.25,.25],[0,1,0],[[0,.12],[.20,.15],[.23,.15]],'steel',10);m.beam([.52,.38,.26],[.75,.57,.26],.042,'steel');m.ring([.38,.49,.25],.13,.025,'steel',12);}
 else if(variant==='ordnung'){m.beam([-.39,.04,.14],[-.39,1.16,.14],.025,'wood');m.panel('RUHE',[-.43,1.02,.17],[.56,.27],'paper','ink');}
 else{m.beam([.33,.84,.1],[.33,1.02,.1],.031,'enamel');}
}
function kiosk(m,sausage=false){
 const paint=sausage?'oxide':'wood';
 m.box([0,.12,0],[2.5,.24,1.72],'ink',.04);m.box([0,.69,-.10],[2.3,1.13,1.48],paint,.05);
 m.box([0,1.34,.69],[2.52,.14,.62],'enamel',.035);m.box([0,1.83,-.72],[2.25,1.25,.08],'sage',.02);
 for(const x of [-1.08,1.08])m.box([x,1.87,.58],[.13,1.14,.12],'wood',.025);
 m.box([0,2.49,0],[2.70,.18,1.95],'ink',.04);
 for(let i=0;i<9;i++){m.box([-1.2+i*.3,2.48,.73],[.29,.12,.86],i%2?'paper':'oxide',.02);m.box([-1.2+i*.3,2.32,1.10],[.29,.30,.075],i%2?'paper':'oxide',.02);}
 m.panel(sausage?'EXTRAWURST':'BREZEL',[0,2.75,.20],[2.12,.38],'paper','oxide');
 if(sausage){m.ellipsoid([0,3.27,0],[.82,.20,.20],'oxide',18,7);m.path([[-.74,3.26,0],[-.85,3.33,0],[-.94,3.31,0]],.09,'wood');m.path([[.73,3.26,0],[.85,3.19,0],[.94,3.21,0]],.09,'wood');for(let i=0;i<5;i++)m.box([-.43+i*.22,3.42,.12],[.08,.025,.11],'ochre');}
 else m.at([0,3.37,0],.82,pretzel);
 for(let i=0;i<3;i++){m.lathe([-.76+i*.20,1.43,.80],[0,1,0],[[0,.067],[.26,.067],[.32,.023]],i%2?'ochre':'oxide',8);}
 m.box([.55,1.46,.68],[.67,.055,.38],'paper',.02);
 if(!sausage)for(let i=0;i<3;i++)m.at([-.60+i*.60,1.84,-.53],.23,pretzel);
 else for(let i=0;i<3;i++)m.ellipsoid([.36+i*.16,1.54,.68],[.065,.055,.15],'oxide',10,5);
}
function shed(m,station=false){
 const w=station?5.8:2.3,d=station?2.4:1.9,h=station?2.50:1.8,wall=station?'enamel':'sage';
 m.box([0,.10,0],[w+.28,.2,d+.25],'steel',.025);m.box([0,h/2+.2,0],[w,h,d],wall,.04);
 const y=h+.25,rise=station?.9:.7,front=d/2+.2,back=-front;
 m.face([[-w/2-.2,y,front],[w/2+.2,y,front],[0,y+rise,front]],wall,[0,0,1]);m.face([[-w/2-.2,y,back],[w/2+.2,y,back],[0,y+rise,back]],wall,[0,0,-1]);
 for(const side of [-1,1]){const a=[side*(w/2+.25),y,front],b=[0,y+rise,front],c=[0,y+rise,back],e=[side*(w/2+.25),y,back];m.face([a,b,c,e],'ink',[side,1,0]);m.face([a,e,c,b].map(p=>[p[0],p[1]-.08,p[2]]),'ink',[0,-1,0]);}
 m.beam([0,y+rise,back],[0,y+rise,front],.07,'steel',8);
 m.box([0,1.03,d/2+.03],[.82,1.67,.09],'wood',.025);for(const x of [-.41,.41])m.box([x,1.04,d/2+.09],[.07,1.70,.06],'ink');m.box([.23,1.0,d/2+.12],[.13,.035,.045],'ochre');
 for(const x of station?[-2.13,-1.12,1.12,2.13]:[-.76,.76]){
  m.box([x,1.44,d/2+.046],[station?.67:.48,.88,.07],'blue',.025);
  for(const dx of [-.5,0,.5])m.box([x+dx*(station?.70:.5),1.44,d/2+.091],[.045,.94,.03],'wood');m.box([x,1.44,d/2+.097],[station?.70:.5,.05,.025],'wood');
  if(station){for(let i=0;i<10;i++){const a=i*Math.PI/10,b=(i+1)*Math.PI/10;m.beam([x+Math.cos(a)*.37,1.91+Math.sin(a)*.34,d/2+.07],[x+Math.cos(b)*.37,1.91+Math.sin(b)*.34,d/2+.07],.055,'wood',5);}}
 }
 m.panel(station?'BAHNHOF':'RUHE',[0,station?2.45:2.09,d/2+.14],[station?2.1:1.03,.30],'paper','ink');
 if(station){m.at([0,0,d/2+.06],1,k=>clockFace(k,3.11,.28,.08));m.box([1.94,3.18,-.48],[.30,.73,.35],'wood',.025);}
 else{for(let x=-.96;x<1;x+=.24)m.box([x,1.03,d/2+.046],[.02,1.64,.012],'ink');m.at([1.10,.2,.95],.65,k=>{k.lathe([0,0,0],[0,1,0],[[0,.20],[.4,.27]],'wood',10);k.ellipsoid([0,.64,0],[.29,.32,.24],'sage',10,5);});}
}
function lounger(m){
 for(const x of [-.42,.42]){m.path([[x,.07,-.59],[x,.44,.33],[x,.95,-.53]],.045,'wood');m.path([[x,.07,.61],[x,.48,-.23],[x,1.14,-.68]],.045,'wood');}
 m.face([[-.4,.48,.37],[.4,.48,.37],[.4,1.10,-.66],[-.4,1.10,-.66]],'blue',[0,1,1]);
 m.face([[-.4,.475,.37],[-.4,1.095,-.66],[.4,1.095,-.66],[.4,.475,.37]],'blue',[0,-1,-1]);
 for(let i=0;i<5;i++){const x=-.35+i*.16;m.face([[x,.49,.37],[x+.07,.49,.37],[x+.07,1.11,-.66],[x,1.11,-.66]],'paper',[0,1,1]);}
 m.panel('RESERVIERT',[0,.70,.21],[1.07,.26],'paper','oxide');m.at([0,1.14,-.64],.7,pigeon);
}
function forms(m){
 m.box([0,.65,0],[.86,1.3,.67],'enamel',.05);m.box([0,1.33,0],[1.03,.13,.85],'steel',.025);
 for(let i=0;i<7;i++)m.box([i%2*.025,1.44+i*.045,0],[.52,.035,.62],'paper',.012);
 m.panel('ANTRAG',[0,.87,.352],[.71,.28],'paper','ink');m.panel('AUF ANTRAG',[0,.54,.352],[.74,.25],'paper','ink');
 m.at([-.32,1.43,.17],.55,stamp);m.box([.21,1.94,-.16],[.49,.68,.05],'wood',.025);m.box([.21,1.94,-.121],[.42,.60,.013],'paper');m.box([.21,2.26,-.115],[.17,.08,.06],'steel',.015);
}
const makers={
 'departure-board':m=>{
  boardPosts(m,2.8,2.56);m.box([0,2.50,0],[2.95,1.45,.25],'steel',.06);m.box([0,2.50,.138],[2.78,1.28,.035],'ink',.015);
  m.text('ABFAHRT',[0,2.95,.167],.17,2.25,'ochre');
  for(const [i,left,right] of [[0,'08:15','+99'],[1,'SPAETER','--'],[2,'MORGEN','?']]){const y=2.65-i*.30;m.text(left,[-.54,y,.172],.14,1.43,'ochre');m.text(right,[.94,y,.172],.14,.55,'ochre');m.box([0,y-.13,.166],[2.55,.012,.01],'steel');}
  m.at([1.02,3.245,0],.80,pigeon);
 },
 'station-clock':m=>{m.box([0,.08,0],[.43,.16,.40],'steel',.03);m.lathe([0,.12,0],[0,1,0],[[0,.075],[2.38,.055]],'steel',10);clockFace(m);},
 'platform-sign':m=>{boardPosts(m,1.82,2.55);m.panel('GLEIS 3',[0,2.42,.01],[2.10,.53]);m.panel('HIER',[.44,1.75,.01],[1.06,.33]);m.at([-.8,2.72,0],.75,pigeon);},
 'platform-shelter':m=>{
  m.box([0,.07,0],[3.5,.14,2.02],'steel',.025);for(const x of [-1.51,1.51])for(const z of [-.78,.78])m.box([x,1.23,z],[.13,2.46,.13],'steel',.025);
  m.box([0,2.54,0],[3.65,.23,2.3],'enamel',.06);for(const x of [-1.4,0,1.4])m.box([x,2.40,0],[.08,.08,2.03],'ink');
  m.box([0,.61,-.82],[3.03,.97,.055],'blue',.015);for(const x of [-.74,.74])m.box([x,1.42,-.82],[.055,1.95,.055],'steel');m.box([0,1.63,-.82],[3.0,.045,.06],'steel');
  m.at([0,.14,-.29],.91,k=>bench(k,true));m.panel('WARTEN',[0,2.28,.86],[1.35,.29],'paper','ink');
 },
 'ticket-machine':m=>{
  m.box([0,.09,0],[.95,.18,.76],'ink',.035);m.box([0,1.05,0],[.87,1.93,.67],'oxide',.055);m.box([0,2.07,0],[1.02,.20,.77],'blue',.045);m.text('TICKET',[0,2.074,.40],.115,.83);
  m.box([-.12,1.45,.35],[.53,.64,.045],'ink',.025);m.box([-.12,1.48,.382],[.43,.46,.02],'screen',.014);m.text('NEIN',[-.12,1.49,.399],.10,.34,'ink');
  for(let x=0;x<3;x++)for(let y=0;y<3;y++)m.box([-.27+x*.085,1.04-y*.08,.355],[.055,.05,.035],'paper',.008);
  m.box([.31,1.5,.36],[.16,.045,.035],'ink');m.box([.31,1.17,.36],[.16,.24,.035],'steel',.012);m.box([0,.57,.36],[.58,.12,.045],'ink');
  m.box([.06,.40,.42],[.35,.32,.026],'paper');m.text('A38',[.06,.40,.44],.10,.30,'ink');
 },
 'ticket-validator':m=>{m.lathe([0,0,0],[0,1,0],[[0,.08],[1.14,.07]],'steel',10);m.box([0,1.37,0],[.40,.72,.37],'ochre',.04);m.box([0,1.32,.197],[.27,.065,.025],'ink');m.text('GILT?',[0,1.56,.198],.08,.33,'ink');m.box([0,1.35,.30],[.19,.017,.26],'paper');},
 'station-bench':m=>{bench(m,true);m.at([.65,1.14,-.22],.78,pigeon);},
 'station-bin':m=>{wasteBin(m,'steel');m.panel('REST',[0,.43,.282],[.43,.26],'paper','ink');},
 'luggage-lockers':m=>{
  m.box([0,.10,0],[2.60,.20,.80],'ink',.03);m.box([0,1.04,0],[2.52,1.72,.73],'steel',.04);
  for(let x=0;x<3;x++)for(let y=0;y<2;y++){const xx=-.82+x*.82,yy=.61+y*.83;m.box([xx,yy,.389],[.77,.77,.04],(x+y)%2?'blue':'enamel',.016);m.text(String(1+x+y*3),[xx-.22,yy+.21,.423],.105,.15,'paper');m.box([xx+.20,yy,.43],[.045,.18,.045],'ink',.01);m.lathe([xx+.20,yy+.15,.416],[0,0,1],[[0,.043],[.03,.043]],'ochre',8);}
  m.panel('GEPAECK',[0,2.02,0],[2.6,.26]);
 },
 'underpass-entrance':m=>{
  for(let i=0;i<8;i++)m.box([0,.10+i*.105,.95-i*.27],[1.54,.20+i*.21,.27],'enamel');
  for(const x of [-.87,.87]){m.box([x,1.04,0],[.19,2.08,2.75],'steel',.025);m.path([[x,1.1,1.2],[x,2.2,-1.2]],.045,'ink');m.box([x,2.31,-1.20],[.09,.66,.09],'steel');}
  m.panel('ZU DEN ZUEGEN',[0,2.54,-1.18],[1.89,.34]);
 },
 'regional-station':m=>shed(m,true),
 'catenary-mast':m=>{
  m.box([0,.16,0],[.63,.32,.63],'enamel',.035);
  for(const x of [-.16,.16])m.box([x,2.24,0],[.09,4.16,.19],'sage',.012);
  for(let i=0;i<10;i++)m.beam([-.16,.39+i*.38,0],[.16,.69+i*.38,0],.035,'steel',5);
  m.beam([0,3.54,0],[1.95,4.13,0],.045,'steel');m.beam([0,4.12,0],[2.08,4.12,0],.045,'steel');
  for(const x of [.77,1.77]){m.beam([x,4.12,0],[x,3.78,0],.026,'ink');for(let i=0;i<4;i++)m.lathe([x,3.85+i*.055,0],[0,1,0],[[0,.065],[.027,.065]],'wood',8);}
  m.panel('!',[-.01,1.27,.14],[.23,.32],'ochre','ink');
 },
 'platform-barrier':stripedBarrier,
 'pretzel-kiosk':m=>kiosk(m,false),
 'info-column':m=>{m.box([0,1.10,0],[.40,2.2,.29],'paper',.035);m.box([0,2.02,0],[.44,.39,.34],'oxide',.028);m.text('I',[0,2.02,.182],.25,.24);m.panel('PLAN',[0,1.55,.16],[.33,.22],'paper','ink');for(let i=0;i<4;i++){m.box([-.10+i*.066,.78+i*.11,.164],[.012,.57,.012],i%2?'blue':'oxide');m.box([-.10+i*.066,.76+i*.11,.173],[.044,.027,.012],'ink');}},
 'platform-edge':m=>{m.box([0,.1,0],[4,.20,.9],'enamel');m.box([0,.208,.33],[4,.016,.15],'ochre');for(let i=0;i<24;i++)for(let j=0;j<2;j++)m.box([-1.9+i*.165,.216,-.12-j*.18],[.075,.027,.10],'paper');},
 'platform-lamp':m=>{m.box([0,.10,0],[.38,.20,.38],'enamel',.025);m.lathe([0,.15,0],[0,1,0],[[0,.065],[3.1,.045]],'steel',10);m.beam([-.64,3.14,0],[.64,3.14,0],.045,'steel');for(const x of [-.57,.57]){m.box([x,3.13,0],[.46,.13,.26],'ink',.028);m.box([x,3.055,0],[.36,.025,.19],'paper',.01);}},
 'judgmental-fax':m=>{m.append(buildDetailMesh('fax-kiosk'));m.eyes(1.36,.355,.70);m.panel('NUR FAX',[0,2.26,.45],[.91,.26],'paper','ink');m.at([.37,1.11,.09],.45,stamp);},
 'pfand-machine':m=>{
  m.box([0,.09,0],[.97,.18,.80],'ink',.035);m.box([0,1.02,0],[.9,1.90,.72],'sage',.045);m.box([0,1.78,.383],[.83,.35,.055],'enamel',.025);m.text('PFAND',[0,1.83,.421],.12,.70,'ink');
  m.lathe([0,1.1,.366],[0,0,1],[[0,.29],[.13,.29]],'steel',20);m.lathe([0,1.1,.505],[0,0,1],[[0,.225],[.008,.225]],'ink',20);
  m.eyes(1.58,.411,.59);m.panel('0.25',[.21,.54,.38],[.37,.20],'screen','ink');m.box([-.17,.53,.39],[.23,.046,.036],'ink');m.box([-.17,.43,.42],[.16,.14,.02],'paper');
 },
 'beer-crate':m=>{m.append(buildDetailMesh('beer-crate'));m.panel('PFAND',[0,.21,.282],[.42,.15],'paper','oxide');},
 'kehrwoche-set':m=>{
  boardPosts(m,.84,1.77);m.box([0,1.29,0],[.83,1.19,.075],'wood',.025);m.box([0,1.29,.047],[.74,1.10,.02],'paper');m.text('KEHRWOCHE',[0,1.69,.066],.10,.69,'ink');m.box([0,1.89,.018],[.22,.12,.10],'steel',.015);
  for(let i=0;i<3;i++){const y=1.44-i*.27;m.text(['MO','MI','SA'][i],[-.22,y,.067],.09,.21,'ink');m.box([.17,y,.068],[.14,.13,.012],'ink');m.box([.17,y,.079],[.102,.095,.01],'paper');if(i===0)m.path([[.12,y,.095],[.16,y-.04,.095],[.23,y+.065,.095]],.014,'oxide',4);}
  m.beam([.60,.18,.07],[.91,1.94,.07],.031,'wood');m.box([.57,.18,.07],[.50,.18,.24],'wood',.025);for(let i=0;i<10;i++)m.beam([.34+i*.05,.15,.07],[.31+i*.055,0,.07],.026,'ochre',5);
  m.lathe([-.62,0,.10],[0,1,0],[[0,.18],[.43,.25],[.46,.25]],'sage',12);m.ring([-.62,.47,.10],.23,.024,'steel',12);
 },
 'recycling-judges':m=>{m.append(buildDetailMesh('recycling-containers'));for(const x of [-.63,0,.63])m.at([x,0,0],1,k=>k.eyes(.94,.323,.44));},
 'garden-wheelbarrow':m=>{m.append(buildDetailMesh('allotment-wheelbarrow'));m.beam([-.15,.49,0],[-.15,1.02,0],.021,'wood');m.panel('MEINS',[-.15,.94,.03],[.49,.22],'paper','ink');},
 'garden-gnome':m=>gnome(m,'finger'),'watering-gnome':m=>gnome(m,'watering'),'ordnung-gnome':m=>gnome(m,'ordnung'),
 'garden-shed':m=>shed(m,false),'forms-pedestal':forms,
 'socks-sandals':m=>{
  m.box([0,.3,0],[1.34,.6,.95],'enamel',.05);m.box([0,.65,0],[1.47,.10,1.08],'steel',.025);m.panel('KULTURGUT',[0,.32,.50],[1.15,.24],'paper','ink');
  for(const x of [-.32,.32]){m.ellipsoid([x,.77,.09],[.235,.09,.39],'rubber',14,6);m.ellipsoid([x,.83,.08],[.205,.06,.35],'wood',12,5);m.lathe([x,.89,-.10],[0,1,0],[[0,.133],[.67,.14]],'paper',12);for(const [i,c] of ['ochre','oxide','ink'].entries())m.lathe([x,1.35+i*.061,-.10],[0,1,0],[[0,.143],[.06,.143]],c,12);for(const z of [.22,-.02]){m.box([x,.96,z],[.40,.08,.13],'wood',.02);m.box([x+.15,1.01,z],[.085,.03,.11],'ochre',.01);}}
 },
 'city-bench':m=>{bench(m);m.panel('SITZORDNUNG',[0,.88,-.19],[1.77,.25],'paper','ink');m.at([.76,1.105,-.26],.70,pigeon);m.at([-.70,0,.42],.70,bottle);},
 'reserved-lounger':lounger,'currywurst-kiosk':m=>kiosk(m,true),
 'passive-bin':m=>{wasteBin(m,'sage');m.beam([.49,0,0],[.49,1.80,0],.028,'steel');m.panel('HIER REIN',[.50,1.55,.02],[.87,.31],'paper','ink');m.text('!', [0,.43,.286],.22,.15,'paper');},
 'notice-board':m=>{boardPosts(m,1.48,1.65);m.box([0,1.34,0],[1.62,1.07,.12],'wood',.035);m.box([0,1.34,.067],[1.49,.95,.02],'enamel');for(const [x,y] of [[-.43,1.40],[.07,1.21],[.45,1.50]]){m.box([x,y,.088],[.36,.43,.023],'paper');m.ellipsoid([x,y+.16,.11],[.018,.018,.013],'oxide',6,4);for(let j=0;j<3;j++)m.box([x,y+.045-j*.07,.105],[.25,.012,.014],'ink');}m.panel('AUSHANG',[0,1.99,.02],[1.45,.25]);},
 'utility-box':m=>{m.box([0,.1,0],[.80,.20,.55],'ink',.025);m.box([0,.84,0],[.72,1.48,.49],'enamel',.04);m.box([0,1.62,0],[.88,.10,.65],'steel',.025);for(let i=0;i<5;i++)m.box([-.16,.45+i*.055,.255],[.28,.02,.02],'ink');m.box([.23,.86,.26],[.035,.21,.03],'ink');m.panel('OFFLINE',[0,1.27,.265],[.60,.22],'paper','ink');},
 'queue-barrier':m=>{for(const x of [-.72,.72]){m.lathe([x,0,0],[0,1,0],[[0,.19],[.055,.19],[.10,.055],[.95,.038],[1,.10]],'steel',12);}m.box([0,.88,0],[1.44,.07,.03],'oxide');m.panel('WARTEN',[0,1.20,.02],[.78,.25],'paper','ink');},
 'suitcase':m=>{m.box([0,.51,0],[.66,.85,.37],'wood',.075);for(const x of [-.21,.21]){m.box([x,.51,.201],[.06,.73,.02],'ink');m.lathe([x,.065,0],[1,0,0],[[-.035,.062],[.035,.062]],'rubber',10);}m.path([[-.16,.94,0],[-.16,1.15,0],[.16,1.15,0],[.16,.94,0]],.027,'steel');m.panel('A38',[0,.59,.22],[.24,.15],'paper','ink');},
 'bottle-cluster':m=>{for(const [x,z,s] of [[-.15,0,1],[.12,.09,.88],[.06,-.17,.94]])m.at([x,0,z],s,bottle);},
 'snack-litter':m=>{m.box([0,.035,0],[.42,.07,.31],'paper',.02);for(let i=0;i<6;i++)m.box([-.12+i*.05,.105,.03+(i%2)*.07],[.025,.12,.025],'ochre');m.lathe([.31,0,0],[0,1,0],[[0,.10],[.25,.075]],'paper',10);m.lathe([.31,.25,0],[0,1,0],[[0,.079],[.02,.079]],'ink',10);m.ellipsoid([-.31,.07,.06],[.13,.075,.10],'paper',8,4);},
 'planter':m=>{m.lathe([0,0,0],[0,1,0],[[0,.27],[.06,.28],[.49,.36],[.53,.38]],'wood',12);m.lathe([0,.535,0],[0,1,0],[[0,.33],[.015,.33]],'soil',12);for(const [x,y,z] of [[-.17,.78,0],[.13,.87,.03],[0,1.06,-.03]]){m.beam([0,.52,0],[x,y,z],.026,'wood');m.ellipsoid([x,y,z],[.23,.25,.20],'sage',10,6);}},
 'traffic-cone':m=>{m.box([0,.045,0],[.48,.09,.48],'ink',.025);m.lathe([0,.09,0],[0,1,0],[[0,.20],[.28,.12],[.55,.042]],'oxide',12);m.lathe([0,.09,0],[0,1,0],[[.21,.141],[.32,.109]],'paper',12);},
 'bollard':m=>{m.lathe([0,0,0],[0,1,0],[[0,.13],[.07,.13],[.1,.077],[.75,.077],[.80,.095],[.86,.04]],'steel',12);m.lathe([0,.61,0],[0,1,0],[[0,.079],[.09,.079]],'paper',12);},
 'garden-fence':m=>{for(const x of [-.95,.95])m.box([x,.55,0],[.12,1.1,.12],'wood',.015);for(const y of [.29,.73])m.box([0,y,0],[2.02,.10,.085],'sage',.012);for(let i=0;i<9;i++){const x=-.8+i*.2;m.box([x,.55,.06],[.10,.90,.065],'sage',.01);m.lathe([x,1.0,.06],[0,1,0],[[0,.071],[.12,.001]],'sage',4);}},
 'rubber-stamp':stamp,
 'form-stack':m=>{for(let i=0;i<10;i++)m.box([i%3*.009,.02+i*.032,0],[.43,.028,.60],'paper',.006);m.box([-.16,.34,0],[.047,.015,.64],'oxide');m.text('A38',[.06,.275,.311],.075,.23,'ink');m.at([.08,.34,0],.46,stamp);}
};
export function buildSatireMesh(id){
 if(!Object.hasOwn(makers,id))throw new RangeError(`Unknown satire-kit model: ${id}`);
 const m=new KitMesh(id),entry=SATIRE_CATALOG.find(item=>item.id===id);m.feature(entry.title);m.feature(`Original ${entry.family} mesh; static caricature`);makers[id](m);
 const model=m.finish();model.version=KIT_VERSION;return model;
}
export function createSatireGLB(id){return encodePropGLB(buildSatireMesh(id));}
