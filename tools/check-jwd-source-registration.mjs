// Authoring metadata check; source design and encoded animation use the visual gate.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {validateMouthProfile} from '../buergeramt-mouth-paint.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const registration=JSON.parse(fs.readFileSync(path.join(root,'assets/sprite-sources/jwd-neighbors/source-registration.json'),'utf8'));
assert.equal(registration.schema_version,1);
const actors={'inga-maaslos':'jwd-watcher','heiko-maaslos':'jwd-parent',fink:'jwd-swabian'};
assert.deepEqual(Object.keys(registration.families).sort(),Object.keys(actors).sort());
const signatures=new Set();
let views=0,visible=0,rear=0,supported=0;
for(const [name,family] of Object.entries(registration.families)){
 assert.equal(family.actor_id,actors[name]);
 assert.deepEqual(Object.keys(family.views).sort(),['front','left','rear','right']);
 const source=fs.readFileSync(path.join(root,family.source.file));
 assert.equal(crypto.createHash('sha256').update(source).digest('hex'),family.source.sha256,name+' source changed');
 assert.equal(source.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 assert.equal(source.readUInt32BE(16),1536);assert.equal(source.readUInt32BE(20),1024);
 const scale=family.optional_working512.uniform_scale;
 for(const [view,entry] of Object.entries(family.views)){
  views++;
  const [x0,y0,x1,y1]=entry.crop_xyxy,[bx0,by0,bx1,by1]=entry.painted_alpha16_bounds_xyxy;
  assert(x0<=bx0&&y0<=by0&&x1>=bx1&&y1>=by1,name+'/'+view+' crop cuts paint');
  const translation=entry.working512_from_sheet.translation_xy,pivot=entry.measured_body_ground_pivot_xy;
  assert.equal(entry.working512_from_sheet.scale,scale,name+'/'+view+' family scale changed');
  assert(Math.abs(scale*pivot[0]+translation[0]-256)<1e-9&&Math.abs(scale*pivot[1]+translation[1]-480)<1e-9,name+'/'+view+' pivot drift');
  assert(bx0*scale+translation[0]>0&&bx1*scale+translation[0]<512&&by0*scale+translation[1]>0&&by1*scale+translation[1]<512,name+'/'+view+' working canvas clips paint');
  const support=entry.body.helper_support_nodes_sheet_pixels;
  if(support){
   for(let i=0;i<2;i++)assert(support.waist<support.hip&&support.hip<support.hem[i]&&support.hem[i]<support.knee[i]&&support.knee[i]<support.ankle[i],name+'/'+view+' invalid walking nodes');
   supported++;
  }
  if(view==='rear'){assert.equal(entry.mouth,null,name+' rear mouth must be null');rear++;continue;}
  visible++;
  const mouth=entry.mouth,profile=validateMouthProfile(mouth.profile,name+'/'+view);
  assert.deepEqual(profile.crease,profile.source_upper,name+'/'+view+' source is not closed');
  assert.deepEqual(profile.crease,profile.source_lower,name+'/'+view+' source is not closed');
  assert.equal(profile.teeth,0,name+'/'+view+' unpainted tooth bar');
  const [tx,ty,nx,ny]=mouth.axes_pixels;
  assert(tx*ny-ty*nx>0&&Math.abs(tx*nx+ty*ny)<1e-9,name+'/'+view+' invalid basis');
  assert(Math.abs(Math.hypot(tx,ty)-mouth.rect_cxcy_extentxy[2])<1e-9&&Math.abs(Math.hypot(nx,ny)-mouth.rect_cxcy_extentxy[3])<1e-9,name+'/'+view+' wrong extent scaling');
  signatures.add(JSON.stringify(profile));
 }
}
assert.equal(views,12);assert.equal(visible,9);assert.equal(rear,3);assert.equal(signatures.size,9,'Do not clone another source profile');
console.log(JSON.stringify({status:'PASS candidate metadata only',views,distinctMouthProfiles:visible,rearNulls:rear,helperSupportViews:supported,missingKeyViews:views-supported,sourceDesign:'NOT ACCEPTED',encodedMotion:'NOT RUN',audio:'NOT RUN',listening:'NOT RUN',physicalDevice:'NOT RUN'}));
