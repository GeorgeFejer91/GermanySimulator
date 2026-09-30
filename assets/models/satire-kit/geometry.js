// Shared low-poly authoring helpers. Coordinates are metres, Y-up, +Z-front.
import {MeshBuilder} from '../prop-details/models.js';
const GLYPHS={
 A:['010','101','111','101','101'],B:['110','101','110','101','110'],C:['011','100','100','100','011'],D:['110','101','101','101','110'],E:['111','100','110','100','111'],F:['111','100','110','100','100'],G:['011','100','101','101','011'],H:['101','101','111','101','101'],I:['111','010','010','010','111'],J:['001','001','001','101','010'],K:['101','101','110','101','101'],L:['100','100','100','100','111'],M:['101','111','111','101','101'],N:['101','111','111','111','101'],O:['010','101','101','101','010'],P:['110','101','110','100','100'],Q:['010','101','101','111','011'],R:['110','101','110','101','101'],S:['011','100','010','001','110'],T:['111','010','010','010','010'],U:['101','101','101','101','111'],V:['101','101','101','101','010'],W:['101','101','111','111','101'],X:['101','101','010','101','101'],Y:['101','101','010','010','010'],Z:['111','001','010','100','111'],
 '0':['111','101','101','101','111'],'1':['010','110','010','010','111'],'2':['110','001','010','100','111'],'3':['110','001','010','001','110'],'4':['101','101','111','001','001'],'5':['111','100','110','001','110'],'6':['011','100','111','101','111'],'7':['111','001','010','010','010'],'8':['111','101','111','101','111'],'9':['111','101','111','001','110'],
 '+':['000','010','111','010','000'],'-':['000','000','111','000','000'],':':['000','010','000','010','000'],'?':['110','001','010','000','010'],'!':['010','010','010','000','010'],'.':['000','000','000','000','010'],'/':['001','001','010','100','100'],' ':['000','000','000','000','000']
};
export class KitMesh extends MeshBuilder {
 constructor(id){super(id);this.transforms=[];}
 tri(a,b,c,material){
  const transform=p=>{let q=[...p];for(let i=this.transforms.length-1;i>=0;i--){const t=this.transforms[i],co=Math.cos(t.turn),si=Math.sin(t.turn);q=q.map(v=>v*t.scale);q=[q[0]*co+q[2]*si,q[1],-q[0]*si+q[2]*co];q=q.map((v,k)=>v+t.at[k]);}return q;};
  super.tri(transform(a),transform(b),transform(c),material);
 }
 at(offset,scale,fn,turn=0){if(!(scale>0))throw new RangeError('Positive scale required');this.transforms.push({at:offset,scale,turn});try{fn(this);}finally{this.transforms.pop();}}
 append(model){for(const part of model.parts)for(let i=0;i<part.positions.length;i+=9)this.tri(part.positions.slice(i,i+3),part.positions.slice(i+3,i+6),part.positions.slice(i+6,i+9),part.material);}
 text(value,center,height,maxWidth,material='paper'){
  const text=String(value).toUpperCase(),step=Math.min(height/5,maxWidth/Math.max(1,text.length*4-1));
  for(let j=0;j<text.length;j++){const glyph=GLYPHS[text[j]];if(!glyph)throw new RangeError(`Unsupported glyph: ${text[j]}`);
   glyph.forEach((row,y)=>{for(let x=0;x<3;){if(row[x]==='0'){x++;continue;}let end=x+1;while(end<3&&row[end]==='1')end++;
    this.box([center[0]+(j*4+(x+end-1)/2-(text.length*4-2)/2)*step,center[1]+(2-y)*step,center[2]],[(end-x)*step*.90,step*.88,.009],material);x=end;}});
  }
 }
 panel(text,at,size,color='blue',ink='paper'){this.box(at,[size[0],size[1],.075],color,.018);this.text(text,[at[0],at[1],at[2]+.045],size[1]*.56,size[0]*.88,ink);}
 path(points,r,material='steel',segments=8){for(let i=1;i<points.length;i++)this.beam(points[i-1],points[i],r,material,segments);}
 ring(center,radius,tube,material='steel',segments=20){const p=Array.from({length:segments+1},(_,i)=>[center[0]+Math.cos(i*2*Math.PI/segments)*radius,center[1]+Math.sin(i*2*Math.PI/segments)*radius,center[2]]);this.path(p,tube,material,6);}
 eyes(y,z,width=.52){for(const side of [-1,1]){const x=side*width*.28;this.ellipsoid([x,y,z],[width*.23,.105,.045],'paper',10,5);this.ellipsoid([x-side*.025,y-.018,z+.04],[.032,.046,.017],'ink',8,5);this.beam([x-width*.25,y+.085-side*.033,z+.033],[x+width*.25,y+.085+side*.033,z+.033],.035,'ink');}}
}
export function pigeon(m){
 m.ellipsoid([0,.18,0],[.16,.20,.23],'steel',10,6);m.ellipsoid([0,.37,.13],[.115,.12,.115],'ink',10,5);
 m.lathe([0,.37,.22],[0,0,1],[[0,.043],[.12,.001]],'ochre',6);
 for(const x of [-.06,.06]){m.beam([x,.08,.02],[x,0,.02],.012,'oxide',6);m.beam([x,0,-.02],[x,0,.11],.013,'oxide',6);m.ellipsoid([x*1.48,.39,.18],[.016,.02,.013],'paper',6,4);}
 m.ellipsoid([0,.13,-.19],[.10,.055,.23],'ink',8,4);
}
export function bottle(m){m.lathe([0,0,0],[0,1,0],[[0,.09],[.03,.105],[.34,.105],[.41,.055],[.55,.043],[.56,.048]],'amber',10);m.lathe([0,0,0],[0,1,0],[[.14,.107],[.29,.107]],'paper',10);m.lathe([0,0,0],[0,1,0],[[.54,.05],[.575,.05]],'steel',10);}
export function stamp(m){m.box([0,.08,0],[.57,.16,.36],'ink',.04);m.box([0,.18,0],[.51,.08,.31],'steel',.02);m.lathe([0,.22,0],[0,1,0],[[0,.075],[.16,.065],[.20,.15],[.30,.16],[.35,.09]],'wood',12);}
export function pretzel(m){
 const p=[[-.45,-.32,0],[-.68,-.10,0],[-.63,.25,0],[-.38,.43,0],[-.10,.31,0],[.40,-.31,.045],[.57,-.40,.045]];
 m.path(p,.095,'wood',8);m.path(p.map(([x,y,z])=>[-x,y,-z]),.095,'wood',8);m.path([[-.47,-.31,0],[0,-.48,.02],[.47,-.31,0]],.095,'wood',8);
 for(const [x,y] of [[-.54,.15],[-.37,.34],[.53,.15],[.32,.36],[-.29,-.39],[.29,-.39]])m.box([x,y,.093],[.04,.03,.019],'paper');
}
export function bench(m,station=false){
 for(const x of [-.80,.80]){m.box([x,.25,0],[.13,.5,.50],'steel',.02);m.box([x,.065,0],[.36,.13,.62],'ink',.025);}
 if(station){for(const x of [-.68,0,.68]){m.box([x,.51,0],[.60,.10,.51],'steel',.035);m.box([x,.84,-.22],[.60,.58,.09],'steel',.035);for(let j=0;j<3;j++)m.box([x-.15+j*.15,.84,-.165],[.045,.35,.012],'ink');}}
 else{for(let z=0;z<3;z++)m.box([0,.51,-.19+z*.19],[2.1,.095,.16],'sage',.014);for(let y=0;y<3;y++)m.box([0,.72+y*.16,-.26],[2.1,.13,.085],'sage',.012);}
 for(const x of [-1.03,1.03])m.path([[x,.50,-.22],[x,.85,-.22],[x,.85,.19],[x,.50,.19]],.035,'ink');
}
