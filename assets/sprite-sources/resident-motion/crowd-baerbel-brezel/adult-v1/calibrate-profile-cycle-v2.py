"""Source-rigid physical cycle, with native quantization reported separately.

No final person/packet/registry mutation. The whole foot's measured continuous
motion is the physical authority; sparse low-density patch centroids do not
change the art or overfit its clock. Uses existing native speed assessment.
"""
from pathlib import Path
import hashlib,importlib.util,json
import numpy as np
from PIL import Image
HERE=Path(__file__).resolve().parent;ROOT=HERE.parents[4]
OUT=ROOT/'output/baerbel-height/profile-leg-repair-v2'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def load(name,p):
 s=importlib.util.spec_from_file_location(name,p);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
def run():
 dest=OUT/'source-cycle-and-native-quantization-v2.json';assert not dest.exists()
 pins={}
 def pin(p):pins[p.relative_to(ROOT).as_posix()]=sha(p)
 for p in [Path(__file__),HERE/'profile-motion-v2.py',HERE/'registration.json',HERE/'registered/down.png',ROOT/'world3d.js',ROOT/'street-character-sprites.js',ROOT/'tools/build-street-character-sprites.py',ROOT/'.agents/skills/animate-2d-characters/scripts/assess_walk_speed.py']:pin(p)
 assert 'const S=.02,H=.038' in (ROOT/'world3d.js').read_text()
 assert 'const scale=person.figureWorldHeight/person.figureHeight;' in (ROOT/'street-character-sprites.js').read_text()
 registration=json.loads((HERE/'registration.json').read_text())
 a=np.asarray(Image.open(HERE/'registered/down.png').convert('RGBA'));yy,xx=np.where(a[:,:,3]>=20)
 source_height=int(yy.max()+1-yy.min());baseline=int(yy.max()+1)
 assert source_height==400 and baseline==472
 stances=[]
 for heading,folder in [('right','right-strength1-01'),('left','left-strength1-02')]:
  p=OUT/folder/'report.json';pin(p);report=json.loads(p.read_text())
  for stance in report['sourceFivePositionStance']:
   assert abs(stance['slope']+40)<1e-9
   stances.append({'heading':heading,**stance})
  p=OUT/'actual-correspondence-v2'/heading/'report.json';pin(p)
  correspondence=json.loads(p.read_text());assert correspondence['framesChecked']==80 and correspondence['totalActualBodySupportedPixels']>0 and correspondence['maximumSupportedRgbaError']==0
 excursion=-sum(s['slope'] for s in stances)/len(stances)
 authored_height=2.33;map_scale=.02;cycle=excursion*authored_height/source_height/map_scale
 assert cycle==11.65
 method=load('baerbel_v2_source_calibration_assess',ROOT/'.agents/skills/animate-2d-characters/scripts/assess_walk_speed.py')
 assessments=[];observations=[];shoe_geometry={}
 for heading in ['right','left']:
  shoe_geometry[heading]={}
  for foot in ['near','far']:
   p=HERE/'profile-leg-repair-v2'/f'{heading}-{foot}-leg.png';pin(p)
   a=np.asarray(Image.open(p).convert('RGBA'));yy,xx=np.where((a[:,:,3]>=20)&(np.indices(a.shape[:2])[0]>=435))
   shoe_geometry[heading][foot]={'ownAlpha20FootRegionY435Plus':[int(xx.min()),int(yy.min()),int(xx.max()+1),int(yy.max()+1)],'lengthWorkingPixels':int(xx.max()+1-xx.min()),'regionQualification':'Measured own complete shoe/ankle paint below435; source includes real complete sole, no hidden endpoint inferred'}
  p=OUT/'native-contacts-v1'/heading/'report.json';pin(p);native=json.loads(p.read_text())
  for stance in native['fivePositionStances']:
   variant=stance['variant'];q=.75 if variant=='desktop' else .5
   assert stance['allSupportUnoccluded'] and min(stance['bodyUnoccludedSupportCounts'])>0
   samples=[{'frame':frame,'along_pixels':value} for frame,value in zip(stance['unwrappedFrames'],stance['alongNativePixels'])]
   data={'character':'crowd-baerbel-brezel','view':heading,'variant':variant,'frames_per_cycle':16,
    'atlas_sha256':native['inputPins'][f'output/street-redesign/baerbel-brezel-end-to-end/native-profile-repair-v2/{variant}/profile-all-phases-and-stops.webp'],
    'game_units_per_pixel':authored_height/(136*q*map_scale),'current_cycle_distance':cycle,
    'shoe_length_pixels':shoe_geometry[heading][stance['foot']]['lengthWorkingPixels']*136*q/source_height,
    'contacts':[{'foot':heading+' actual unoccluded '+stance['foot']+' '+stance['point'],'samples':samples}]}
   result=method.assess(data);result.update(variant=variant,foot=stance['foot'],point=stance['point'])
   for mode in ['current_slip','fitted_slip']:
    result[mode]['max_native_pixels']=result[mode]['max_game_units']/data['game_units_per_pixel']
    result[mode]['rms_native_pixels']=result[mode]['rms_game_units']/data['game_units_per_pixel']
   assessments.append(result);observations.append(data)
 report={'status':'OWN_CONTINUOUS_SOURCE_PHYSICAL_CALIBRATION; NATIVE_QUANTIZATION_RECORDED; world/fullfamily pending',
  'inputPins':pins,'sourceAuthority':{'registeredFrontAlpha20CrownY':int(np.where(np.asarray(Image.open(HERE/'registered/down.png'))[:,:,3]>=20)[0].min()),'soleYExclusive':baseline,'familyWorkingFigureHeight':source_height,
   'mappingAuthority':'world3d.js constS=.02 X/Z maps game units to world; street-character-sprites.js scale=figureWorldHeight/figureHeight; exporter136*q/400 maps working source to native cell',
   'sourceStances':stances,'continuousWholeFootSlopeWorkingPixelsPerCycle':-excursion,'authoredFigureWorldHeight':authored_height,
   'formula':'cycleDistance=40 *2.33 /400 /.02','authoredCycleDistance':cycle,
   'prospectiveSelectedHeight2_77CycleDistance':excursion*2.77/source_height/map_scale,
   'selectionQualification':'Root owns2.77 finalfit, canonical person and typed packet rebind. This does not install that selection.'},
  'ownShoeGeometry':shoe_geometry,'nativeObservations':observations,'nativeQuantizationAssessments':assessments,
  'maximumNativeResidualPixelsAtSourceCycle':max(a['current_slip']['max_native_pixels'] for a in assessments),
  'maximumNativeResidualShoeLengthsAtSourceCycle':max(a['current_slip']['max_shoe_lengths'] for a in assessments),
  'limits':['Real exposed nearHEEL/farTOE body supports, every marked native patch fully unoccluded, atlasSHA bound.','Sparse2–12nativepaintpixels quantize centroid positions; their separate bestfit distances are diagnostic, not an instruction to overfit art or clock.','Full412 encoded replay, independent Physics, sourcepromotion and actual-world cadence/floor review remain required.']}
 assert all(sha(ROOT/p)==v for p,v in pins.items())
 dest.write_text(json.dumps(report,indent=2)+'\n')
 print(json.dumps({'authoredCycle':cycle,'prospectiveSelectedCycle':report['sourceAuthority']['prospectiveSelectedHeight2_77CycleDistance'],'maxNativeResidualPixels':report['maximumNativeResidualPixelsAtSourceCycle'],'maxResidualShoeLengths':report['maximumNativeResidualShoeLengthsAtSourceCycle']}))
if __name__=='__main__':run()
