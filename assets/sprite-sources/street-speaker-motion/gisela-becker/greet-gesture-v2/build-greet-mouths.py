"""Fit one mouth/cell to the actual accepted paired-source greeting paint."""
from pathlib import Path
import hashlib, importlib.util, json, sys
import numpy as np
from PIL import Image
from scipy.ndimage import map_coordinates
from scipy.optimize import root as solve_root

OWN=Path(__file__).resolve().parent
ROOT=OWN.parents[4]
BODY=ROOT/'output/ambient-city-animation/gisela-greet-full16'
OUT=ROOT/'output/ambient-city-animation/gisela-greet-full16-mouths'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()


def load_module(name,path):
 spec=importlib.util.spec_from_file_location(name,path)
 module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module);return module


def main():
 OUT.mkdir(parents=True,exist_ok=True)
 capture_path=BODY/'actual-field-capture.json';capture=json.loads(capture_path.read_text())
 assert sha(ROOT/capture['driver']['path'])==capture['driver']['sha256']
 for name,pin in capture['inputs'].items():assert sha(ROOT/name)==pin['sha256'],name
 for v in capture['variants'].values():assert sha(ROOT/v['file'])==v['sha256']
 controls=json.loads((OWN/'controls.json').read_text())
 native=json.loads((OWN/'native-face-sources.json').read_text())
 registration=json.loads((OWN/'source-registration.json').read_text())['registrations']
 compiler=load_module('greet_mouth_compiler',ROOT/'tools/build-street-mouths.py')
 family=load_module('greet_family',ROOT/'tools/build-street-speaker-family.py')
 builder,cfg=family.configure(ROOT/'assets/sprite-sources/street-speaker-motion/gisela-becker/motion-spec.json')
 sys.path.insert(0,str(ROOT/'.agents/skills/animate-2d-characters/scripts'))
 import morph_frames
 scale=cfg['figureHeight']/cfg['working']['figureHeight']
 origin=np.array(cfg['pivot'])-np.array([256,cfg['working']['baseline']])*scale
 entries={};registered={};heads={};open_heads={};native_checks=[]
 for name,prefix in [('down','neutral'),('greet','raised')]:
  source=OWN/(prefix+'-head.png');image=Image.open(source).convert('RGBA')
  affine=lambda points:np.asarray(points)*registration[name]['scale']+registration[name]['origin']
  entry={'input':{'file':source.relative_to(ROOT).as_posix(),'sha256':sha(source),'dimensions':list(image.size)},
   'centerPx':affine(native[name]['centerPx']).tolist(),
   'axesPx':(np.array(native[name]['axesPx'])*registration[name]['scale']).tolist(),
   'contoursPx':{k:affine(v).tolist()for k,v in native[name]['contoursPx'].items()},
   'width':native[name]['width'],'teeth':native[name]['teeth'],'nativeSource':native[name]['input']}
  reg=compiler.compile_registration(entry)
  closed=compiler.preview(entry,reg,0);opened=compiler.preview(entry,reg,1)
  assert closed.tobytes()==image.tobytes(),('Native closed source changed',name)
  assert np.array_equal(np.array(opened)[:,:,3],np.array(image)[:,:,3])
  assert reg['profile']['source_upper']==reg['profile']['crease']==reg['profile']['source_lower']
  heads[name]=image;open_heads[name]=opened;entries[name]=entry
  registered[name]={'center':np.array(entry['centerPx']),'axes':np.array(entry['axesPx']).reshape(2,2).T,
    'contours':{k:np.array(v)for k,v in entry['contoursPx'].items()}}
  closed.save(OUT/(name+'-native-zero.png'));opened.save(OUT/(name+'-native-open.png'))
  compiler.review_board('quiz-gisela-becker',name+'-native',entry,reg,OUT)
  native_checks.append({'source':name,'closedSource':True,'ownedZeroExact':True,'alphaPreserved':True,'teeth':reg['profile']['teeth']})

 def runtime(reg):return {k:reg[k]for k in ['rect','axes','profile']}
 def entry_on(path,image_size,cell,offset,fit,s=1,translate=np.zeros(2)):
  offset=np.array(offset);return {'input':{'file':path.relative_to(ROOT).as_posix(),'sha256':sha(path),'dimensions':list(image_size)},
   'cell':cell,'cellOriginPx':offset.tolist(),'centerPx':(fit['center']*s+translate+offset).tolist(),
   'axesPx':(fit['axes']*s).T.reshape(4).tolist(),
   'contoursPx':{k:(v*s+translate+offset).tolist()for k,v in fit['contours'].items()},
   'width':[0,0],'teeth':0,'nativeSource':{'down':native['down']['input'],'greet':native['greet']['input']}}

 all_records=[];fragment_variants={v:{'cell':record['cell'],'source':{'file':record['file'],'sha256':record['sha256']},'frames':[]}for v,record in capture['variants'].items()}
 cache={};max_inverse=0.;minimum_det=float('inf');fit_residuals=[]
 for record in capture['samples']:
  frame_index=record['frame'];phase=record['phase'];field=record['headField']
  for key in ['pointsSource','pointsTarget','triangles']:assert field[key]==controls['head'][key]
  assert field['phase']==phase
  if phase not in cache:
   a=np.array(field['pointsSource']);b=np.array(field['pointsTarget']);tri=np.array(field['triangles'])
   morph_frames.validate_mesh(a,b,tri)
   maps=morph_frames.coordinate_maps(a,b,tri,phase,(512,512))
   endpoint_results={};diagnostics={}
   for endpoint,grid in zip(['down','greet'],maps):
    reg=registered[endpoint];residuals=[]
    def inverse(point):
     return np.array([map_coordinates(grid[:,:,axis],[[point[1]],[point[0]]],order=1,mode='nearest',prefilter=False)[0]for axis in [0,1]])
    def inverse_jacobian(point):
     epsilon=.001;return np.stack([(inverse(point+axis*epsilon)-inverse(point-axis*epsilon))/(2*epsilon)for axis in np.eye(2)],axis=1)
    def forward(points):
     output=[]
     for point in points:
      solved=solve_root(lambda target:inverse(target)-point,point,jac=inverse_jacobian,tol=1e-10)
      residual=float(np.max(np.abs(inverse(solved.x)-point)));residuals.append(residual)
      if not np.isfinite(residual)or residual>1e-7:raise ValueError('Actual inverse float map did not converge')
      output.append(solved.x)
     return np.array(output)
    center=forward(reg['center'][None,:])[0]
    jacobian=np.linalg.inv(inverse_jacobian(center));det=float(np.linalg.det(jacobian))
    assert np.isfinite(det)and det>0,'Folded mouth-bearing float field'
    endpoint_results[endpoint]={'center':center,'axes':jacobian@reg['axes'],'contours':{k:forward(v)for k,v in reg['contours'].items()}}
    diagnostics[endpoint]={'floatInverseGrid':{'sha256':hashlib.sha256(grid.tobytes()).hexdigest(),'dtype':str(grid.dtype),'shape':list(grid.shape)},
      'sourceRegistration':entries[endpoint],'centerWorkingPx':center.tolist(),'forwardJacobian':jacobian.tolist(),
      'forwardJacobianDeterminant':det,'axesWorkingPx':endpoint_results[endpoint]['axes'].T.reshape(4).tolist(),
      'contoursWorkingPx':{k:v.tolist()for k,v in endpoint_results[endpoint]['contours'].items()},'maxInverseResidualWorkingPx':max(residuals)}
    max_inverse=max(max_inverse,max(residuals));minimum_det=min(minimum_det,det)
   fit={key:(endpoint_results['down'][key]*(1-phase)+endpoint_results['greet'][key]*phase)for key in ['center','axes']}
   fit['contours']={k:endpoint_results['down']['contours'][k]*(1-phase)+endpoint_results['greet']['contours'][k]*phase for k in compiler.NAMES}
   # Reference only: articulate each own endpoint BEFORE its actual source
   # blend, reusing the actual morph implementation and its exact cached maps.
   # This is never a second runtime mouth or mesh.
   original_maps=morph_frames.coordinate_maps
   def cached_maps(aa,bb,tt,t,size):
    assert np.array_equal(aa,a)and np.array_equal(bb,b)and np.array_equal(tt,tri)and t==phase and tuple(size)==(512,512)
    return maps
   morph_frames.coordinate_maps=cached_maps
   try:
    source_head=morph_frames.morph(heads['down'],heads['greet'],a,b,tri,phase)
    articulated_head=morph_frames.morph(open_heads['down'],open_heads['greet'],a,b,tri,phase)
   finally:morph_frames.coordinate_maps=original_maps
   cache[phase]={'fit':fit,'endpoints':diagnostics,'sourceHead':source_head,'openHead':articulated_head,
    'creaseEndpointSeparationWorkingPx':np.linalg.norm(endpoint_results['down']['contours']['crease']-endpoint_results['greet']['contours']['crease'],axis=1).tolist(),
    'centerEndpointSeparationWorkingPx':float(np.linalg.norm(endpoint_results['down']['center']-endpoint_results['greet']['center']))}
  current=cache[phase];fit=current['fit'];path=BODY/f'working-{frame_index:02}.png';working=Image.open(path).convert('RGBA')
  working_entry=entry_on(path,working.size,[512,512],[0,0],fit)
  working_reg=compiler.compile_registration(working_entry)
  # Quantify the single-profile curve fit instead of asserting that the two
  # distinct source creases magically coincide in the inbetween paint.
  inverse_axes=np.linalg.inv(fit['axes']);local=(fit['contours']['crease']-fit['center'])@inverse_axes.T
  modeled=compiler.curve(local[:,0],working_reg['profile']['crease'],working_reg['profile']['corners'])
  curve_residual=float(np.max(np.abs(modeled-local[:,1]))*np.linalg.norm(fit['axes'][:,1]));fit_residuals.append(curve_residual)
  source_head=np.array(current['sourceHead']);open_head=np.array(current['openHead']);pixels=np.array(working)
  head_changes=np.any(source_head!=open_head,axis=2)
  assert np.array_equal(source_head[:,:,3],open_head[:,:,3])
  # Own mouth paint is not under the paper/book/arm. The complete base recipe
  # must match the actual blended head over every affected reference pixel.
  assert np.array_equal(pixels[head_changes],source_head[head_changes]),('Paired reference overlaps a different layer',frame_index)
  paired_pixels=pixels.copy();paired_pixels[head_changes]=open_head[head_changes];paired=Image.fromarray(paired_pixels)
  paired.save(OUT/f'paired-source-open-working-{frame_index:02}.png')
  single_working=compiler.preview(working_entry,working_reg,1);single_working.save(OUT/f'single-profile-open-working-{frame_index:02}.png')
  assert compiler.preview(working_entry,working_reg,0).tobytes()==working.tobytes()
  frame_result={'frame':frame_index,'phase':phase,'blendWeights':[1-phase,phase],
   'actualHeadField':field,'endpointTransport':current['endpoints'],
   'creaseEndpointSeparationWorkingPx':current['creaseEndpointSeparationWorkingPx'],
   'centerEndpointSeparationWorkingPx':current['centerEndpointSeparationWorkingPx'],
   'singleProfileFitCurveResidualWorkingPx':curve_residual,'workingRegistration':working_entry,
   'sourceClosedZeroExact':True,'pairedSourceReferenceUsesActualMorph':True,'variants':{}}
  for variant,variant_record in capture['variants'].items():
   w,h=variant_record['cell'];compact=variant=='mobile';factor=scale*(.5 if compact else 1);translation=origin*(.5 if compact else 1)
   atlas_path=ROOT/variant_record['file'];atlas_size=variant_record['size']
   entry=entry_on(atlas_path,atlas_size,[w,h],[frame_index*w,0],fit,factor,translation)
   compiled=compiler.compile_registration(entry);fragment_variants[variant]['frames'].append(runtime(compiled))
   native_cell=Image.open(atlas_path).convert('RGBA').crop((frame_index*w,0,(frame_index+1)*w,h))
   closed=compiler.preview(entry,compiled,0).crop((frame_index*w,0,(frame_index+1)*w,h))
   opened=compiler.preview(entry,compiled,1).crop((frame_index*w,0,(frame_index+1)*w,h))
   assert closed.tobytes()==native_cell.tobytes(),('Owned zero not exact closed source',variant,frame_index)
   assert np.array_equal(np.array(opened)[:,:,3],np.array(native_cell)[:,:,3]),'Changed source alpha'
   native_cell.save(OUT/f'{variant}-source-{frame_index:02}.png');closed.save(OUT/f'{variant}-zero-{frame_index:02}.png');opened.save(OUT/f'{variant}-open-{frame_index:02}.png')
   reference=builder.street.export_cell(paired,cfg,compact=compact);reference.save(OUT/f'{variant}-paired-source-open-{frame_index:02}.png')
   difference=np.abs(np.array(opened).astype(float)-np.array(reference).astype(float))
   changed=np.any(np.array(opened)!=np.array(native_cell),axis=2);yy,xx=np.where(changed)
   compiler.review_board('quiz-gisela-becker',f'{variant}-{frame_index:02}',entry,compiled,OUT)
   frame_result['variants'][variant]={'registration':entry,'ownedZeroExact':True,'alphaExact':True,
    'singleVsPairedReferenceMaxChannelDifference':float(difference.max()),
    'singleVsPairedReferenceMeanChannelDifference':float(difference.mean()),
    'changedPixelBounds':None if not len(xx)else[int(xx.min()),int(yy.min()),int(xx.max()+1),int(yy.max()+1)]}
  all_records.append(frame_result)
  print('mouth cell',frame_index,'phase',phase,flush=True)
 canonical=json.loads((ROOT/'assets/characters/street/manifest.json').read_text())['characters']['quiz-gisela-becker']['id'];assert canonical=='quiz-gisela-becker'
 fragment={'schemaVersion':1,'kind':'street-mouth-clip-fragment','id':canonical,'clip':'greet-gesture-v2','frameCount':16,
  'policy':'One physical registration per cell, fitted to actual blended paint; closed native sources remain exact at owned zero. No independent body or speech clock.',
  'bodyCapture':{'file':capture_path.relative_to(ROOT).as_posix(),'sha256':sha(capture_path)},'variants':fragment_variants}
 target=OUT/'greet16-mouth-fragment.json';target.write_text(json.dumps(fragment,separators=(',',':'))+'\n')
 proof={'status':'candidate; root visual review required before GPU or merge','mouthCompiler':{'path':'tools/build-street-mouths.py','sha256':sha(ROOT/'tools/build-street-mouths.py')},
  'driver':{'path':Path(__file__).relative_to(ROOT).as_posix(),'sha256':sha(Path(__file__))},
  'bodyCapture':fragment['bodyCapture'],'frozenInputs':capture['inputs'],'nativeChecks':native_checks,
  'maxInverseResidualWorkingPx':max_inverse,'minimumForwardJacobianDeterminant':minimum_det,
  'maxSingleProfileCurveFitResidualWorkingPx':max(fit_residuals),
  'note':'Only source corners+center are actual mesh controls. Interior creases differ subpixel; actual float-grid maps also differ minutely from continuous control-vertex maps. Each endpoint retains its own registration and Jacobian before one fitted cell registration is compiled.',
  'frames':all_records}
 (OUT/'mouth-field-proof.json').write_text(json.dumps(proof,indent=2)+'\n')
 for name,pin in capture['inputs'].items():assert sha(ROOT/name)==pin['sha256'],name
 print(json.dumps({'fragment':target.relative_to(ROOT).as_posix(),'sha256':sha(target),'bytes':target.stat().st_size,
  'maxInverseResidualWorkingPx':max_inverse,'minimumForwardJacobianDeterminant':minimum_det,
  'maxFitResidualWorkingPx':max(fit_residuals)}),flush=True)


if __name__=='__main__':main()
