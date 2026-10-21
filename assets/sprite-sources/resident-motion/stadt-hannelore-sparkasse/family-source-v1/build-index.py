"""Normalize exact own body images and actual head fields; never bake an atlas."""
from pathlib import Path
import argparse,collections,hashlib,json,math,sys
sys.dont_write_bytecode=True
from PIL import Image
ROOT=Path(__file__).resolve().parents[5]
BASE=ROOT/'output/ambient-city-animation'
FAMILY=Path(__file__).resolve().parent.parent
DIRS=['down','right','up','left']
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
def identity():return {'nodes_y':[0,511],'dx':[0,0],'dy':[0,0],'sourceSize':[512,512]}
def normalized(field):
 d={k:list(field[k]) for k in ['nodes_y','dx','dy']};d['sourceSize']=list(field.get('sourceSize',[512,512]))
 assert d['sourceSize']==[512,512] and len(d['nodes_y'])==len(d['dx'])==len(d['dy'])
 assert d['nodes_y'][0]==0 and d['nodes_y'][-1]==511 and all(b>a for a,b in zip(d['nodes_y'],d['nodes_y'][1:]))
 assert all(math.isfinite(v) for k in ['nodes_y','dx','dy'] for v in d[k])
 return d
def run(out,side_path,side_hash):
 out=out.resolve();assert out.is_relative_to(BASE/'hannelore-sparkasse-family-source-v2');out.mkdir(parents=True,exist_ok=True);assert not any(out.iterdir())
 pins={};cells={};proofs=[]
 def pin(p,expected=None):
  p=Path(p).resolve();assert p.is_relative_to(ROOT);h=sha(p);assert expected is None or h==expected,(str(p),h,expected)
  rel=p.relative_to(ROOT).as_posix();assert rel not in pins or pins[rel]==h;pins[rel]=h;return p
 def packet(p,expected):
  p=pin(p,expected);data=json.loads(p.read_text())
  for rel,h in data.get('inputPins',{}).items():pin(ROOT/rel,h)
  return p.parent,data
 def source(folder,data,name):
  p=pin(folder/name,data['files'][name])
  with Image.open(p) as im:assert im.size==(512,512) and im.mode=='RGBA'
  return {'file':p.relative_to(ROOT).as_posix(),'sha256':pins[p.relative_to(ROOT).as_posix()]}
 def add(row,col,kind,heading,src,upper,**extra):
  slot=row*16+col;assert 0<=row<32 and 0<=col<16 and slot not in cells
  cells[slot]={'row':row,'col':col,'kind':kind,'heading':heading,'source':src.copy(),'upper':normalized(upper),**extra}
  return slot
 def duplicate(row,col,kind,old,**extra):
  c=cells[old];slot=add(row,col,kind,c['heading'],c['source'],c['upper'],**extra)
  proofs.append({'slot':slot,'sameSourceSlot':old,'sameFileHashAndUpper':True});return slot
 frdir,fr=packet(BASE/'hannelore-sparkasse-front-rear-loop-v1/candidate-v3/receipt.json','8fe215a3c509ecf787a52b80e9bcf4ee622b4579b69c53711ced16ca515292e4')
 fsdir,fs=packet(BASE/'hannelore-sparkasse-front-rear-stops-full16-v1/candidate-v1/receipt.json','d4654813f0fb20203c67a5d1c8942f256e7b666d8c6bb12335f00c8d849dccc1')
 swdir,sw=packet(BASE/'hannelore-sparkasse-side-loop-v1/candidate-v1/source-loop.json','78daa5d6819241673b387bf8e8cb423d21506d7ae7868d880750d1880c976df4')
 gdir,g=packet(BASE/'hannelore-sparkasse-gesture-full16-v1/candidate-v1/gesture-source.json','9caa9d6214c259f071642c588d633023ab22b996986d2ddc8f28a7bc23a0b54d')
 ssdir,ss=packet(side_path,side_hash) # Supplied immutable hash required before any read.
 _,side_final=packet(ssdir/'final-receipt.json','8326a41fafac300a54bfcf660f2a9eb7408392ab9bc47b85c4246af4d2989d86')
 assert side_final['rawReceiptSha256']==side_hash
 tdir=FAMILY/'turn-source-v1';turns=json.loads(pin(tdir/'recipe.json','ffb044f0a670271cee570a7d2ca679a74b105adb06ab6f1228097a78de46e0b7').read_text())
 pin(BASE/'hannelore-sparkasse-turn-source-v1/final-receipt.json','372a120c4b8b434474505992220d859a079dd6a2de41a6f6873ab5ef8caba5c8')
 pin(BASE/'hannelore-sparkasse-front-rear-stops-full16-v1/review/final-receipt.json','6d8993c471a950832866ad4401fa1e4c5a8353c0e34f5b1b88b25d1683383de5')
 profiles=json.loads(pin(FAMILY/'mouth-source-v1/profiles.json').read_text());heading_keys=set(profiles['registrations'])-{'standing'};visible=set(profiles['mouthVisible'])
 assert set(turns['clockwiseOrder'])==heading_keys
 pin(Path(__file__))
 # Walk source images/fields: source field3 is index2, not a new fitted field.
 for i,d in enumerate(DIRS):
  for phase in range(16):
   if d in ['down','up']:
    src=source(frdir,fr,f'{d}/phase{phase:02}.png');upper=fr['views'][d]['frames'][phase]['fields'][2];owner={'packet':str((frdir/'receipt.json').relative_to(ROOT)).replace('\\','/'),'field':'views.'+d+f'.frames[{phase}].fields[2]'}
   else:
    src=source(swdir,sw,f'{d}-phase-{phase:02}.png');head=sw['sides'][d][phase]['headField'];upper={'nodes_y':head['nodesY'],'dx':head['dx'],'dy':head['dy'],'sourceSize':head['sourceSize']};assert normalized(upper)==identity()
    owner={'packet':str((swdir/'source-loop.json').relative_to(ROOT)).replace('\\','/'),'field':f'sides.{d}[{phase}].headField; nodesY normalized to nodes_y; protected head only'}
   add(i,phase,'walk',d,src,upper,phase=phase,producer=owner)
 # Own static turns/cardinal neutral identities.
 turn_refs=[];neutral={}
 for t in turns['turns']:
  p=pin(ROOT/t['file'],t['sha256']);src={'file':t['file'],'sha256':t['sha256']};s=add(8,t['index'],'turn',t['heading'],src,identity(),turnIndex=t['index'],producer={'packet':str((tdir/'recipe.json').relative_to(ROOT)).replace('\\','/'),'field':'own registered static head identity'})
  turn_refs.append({'turnIndex':t['index'],'heading':t['heading'],'row':8,'col':t['index'],'slot':s})
  if t['heading'] in DIRS:neutral[t['heading']]=s
 for item in g['fields']:
  k=item['index'];add(16,k,'gesture','down',source(gdir,g,item['working']),item['mouthField'],phase=k,producer={'packet':str((gdir/'gesture-source.json').relative_to(ROOT)).replace('\\','/'),'field':f'fields[{k}].mouthField'})
 # All stop source fields/images remain their exact own producer outputs.
 front_slots=[r*16+c for r in [*range(9,16),17] for c in range(16)]
 side_slots=[r*16+c for r in range(18,32) for c in range(16)]
 mapping=[];lookup={};omitted=[]
 front_paths={(v['direction'],v['phase']):v for v in fs['paths']}
 side_paths={(v['direction'],v['phase']):v for v in ss['paths']}
 for d,slots,n,offset in [('down',front_slots,4,0),('up',front_slots,4,64),('right',side_slots,7,0),('left',side_slots,7,112)]:
  for phase in range(16):
   path=(front_paths if n==4 else side_paths)[d,phase];assert len(path['stages'])==(4 if n==4 else 8)
   selected=[]
   for stage in range(n):
    rec=path['stages'][stage];assert rec['stage']==stage
    if n==4:src=source(fsdir,fs,f'{d}-{phase:02}-stage{stage}.png');upper=rec['fields'][2];pk=fsdir/'receipt.json';field=f'paths[{d},{phase}].stages[{stage}].fields[2]'
    else:src=source(ssdir,ss,f'{d}-{phase:02}-stage{stage}.png');upper=rec['upper'];assert normalized(upper)==identity();pk=ssdir/side_path.name;field=f'paths[{d},{phase}].stages[{stage}].upper; actual unchanged head field'
    s=slots[offset+phase*n+stage];add(s//16,s%16,'stop',d,src,upper,entryPhase=phase,stage=stage,producer={'packet':pk.relative_to(ROOT).as_posix(),'field':field});selected.append(s);lookup[d,phase,stage]=s
   mapping.append({'direction':d,'entryPhase':phase,'storedSlots':selected})
   if n==7:
    last=source(ssdir,ss,f'{d}-{phase:02}-stage7.png');ref=cells[neutral[d]]['source'];same_bytes=last['sha256']==ref['sha256']
    # Different lossless file containers may still carry the exact same RGBA.
    with Image.open(ROOT/last['file']) as a,Image.open(ROOT/ref['file']) as b:equal=a.convert('RGBA').tobytes()==b.convert('RGBA').tobytes()
    assert equal,(d,phase,'terminal stage7 is not exact revised neutral')
    omitted.append({'direction':d,'entryPhase':phase,'stage':7,'source':last,'sameRgbaAsTurnSlot':neutral[d],'pngBytesExact':same_bytes})
 # Bridges reuse existing files/fields. No raster duplication; columns0/1 are absent.
 bridge_refs={}
 for i,d in enumerate(DIRS):
  row=i+4;n=4 if d in ['down','up'] else 7
  neutral_slot=duplicate(row,2,'bridge-neutral',neutral[d],sourcePhase=0,sourceStage=None)
  starts=[]
  for col,stage in enumerate(range(n-1,-1,-1),3):starts.append(duplicate(row,col,'bridge-start',lookup[d,0,stage],sourcePhase=0,sourceStage=stage))
  starts.append(duplicate(row,n+3,'bridge-start',i*16,sourcePhase=0,sourceStage=None))
  bridge_refs[d]={'row':row,'neutralSlot':neutral_slot,'start_cols':list(range(3,n+4)),'stop_cols':[*range(n+2,2,-1),2],'startSlots':starts,'stopSlots':[row*16+c for c in [*range(n+2,2,-1),2]],'reservedTransparentCols':[0,1]}
 assert len(cells)==470 and len(mapping)==64 and len(omitted)==32 and len(proofs)==30
 assert all(c['heading'] in heading_keys for c in cells.values())
 assert all(sha(ROOT/p)==h for p,h in pins.items())
 counts=collections.Counter(c['heading'] for c in cells.values());kinds=collections.Counter(c['kind'] for c in cells.values())
 summary={'occupied':470,'logical':512,'empty':42,'sourceFilesReferenced':len({c['source']['file'] for c in cells.values()}),'distinctSourceHashes':len({c['source']['sha256'] for c in cells.values()}),'headingCounts':dict(counts),'kindCounts':dict(kinds),'potentialVisibleHeadingSlots':sum(counts[h] for h in visible),'explicitNullHeadingSlots':sum(counts[h] for h in heading_keys-visible),'visibilityQualification':'static profile visibility only; no moving mouth registration/cavity proof'}
 data={'identity':'stadt-hannelore-sparkasse','grid':[16,32],'status':'NOT_ADMITTED SOURCE index; SIDE full-stop independent review pending; no runtime/timing/stride/mouth approval','cells':[cells[k] for k in sorted(cells)],'inputPins':pins,'stopMapping':mapping,'bridgeRefs':bridge_refs,'turns':turn_refs,'neutralRefs':{d:bridge_refs[d]['neutralSlot'] for d in DIRS},'occupiedSlots':sorted(cells),'emptySlots':[i for i in range(512) if i not in cells],'exactSharedSourceProofs':proofs,'omittedExactTerminalSideStages':omitted,'summary':summary,'timing':'not chosen; integrator-owned','stride':'not chosen; exact encoded/native gate pending'}
 text=json.dumps(data,indent=2)+'\n';(out/'source-index.json').write_text(text,encoding='utf-8')
 receipt={'status':data['status'],'inputPinsBeforeAfterExact':True,'inputPins':pins,'files':{'source-index.json':sha(out/'source-index.json')},'summary':summary}
 (out/'receipt.json').write_text(json.dumps(receipt,indent=2)+'\n',encoding='utf-8');print(json.dumps({'indexSha256':sha(out/'source-index.json'),'receiptSha256':sha(out/'receipt.json'),**summary}))
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--outdir',required=True,type=Path);p.add_argument('--side-source',required=True,type=Path);p.add_argument('--side-sha',required=True);a=p.parse_args();run(a.outdir,a.side_source,a.side_sha)
