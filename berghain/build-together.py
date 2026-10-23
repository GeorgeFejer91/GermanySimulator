from pathlib import Path
import hashlib, json
import base64,sys,urllib.request
import numpy as np

workspace=Path(__file__).resolve().parents[1]
asset=workspace/'assets/models/berghain'
root=workspace/'berghain/references/downloads/makehuman'
provenance=json.loads((asset/'anatomy-provenance.json').read_text())
root.mkdir(parents=True,exist_ok=True)
for record in provenance['files']:
    target=root/Path(record['path']).name
    if not target.exists() and '--download' in sys.argv:
        target.write_bytes(urllib.request.urlopen(record['url'],timeout=30).read())
    if not target.exists():raise FileNotFoundError(str(target)+'; rerun with --download')
    if hashlib.sha256(target.read_bytes()).hexdigest()!=record['sha256']:
        raise ValueError('Anatomy input hash mismatch: '+str(target))
vertices=[]; faces=[]; group=''
for line in (root/'base.obj').read_text().splitlines():
    row=line.split()
    if not row: continue
    if row[0]=='v': vertices.append([float(x) for x in row[1:]])
    if row[0]=='g': group=row[1]
    if row[0]=='f' and group=='body': faces.append([int(x.split('/')[0])-1 for x in row[1:]])
vertices=np.array(vertices)
for name,amount in [('caucasian-male-young.target',1),('universal-male-young-maxmuscle-averageweight.target',.35)]:
    for line in (root/name).read_text().splitlines():
        if not line or line.startswith('#'): continue
        row=line.split();vertices[int(row[0])]+=np.array([float(x) for x in row[1:]])*amount
rig=json.loads((root/'default.mhskel').read_text());weights=json.loads((root/'default_weights.mhw').read_text())['weights']
joints={name:vertices[index].mean(axis=0) for name,index in rig['joints'].items()}

def align(a,b):
    a=a/np.linalg.norm(a);b=b/np.linalg.norm(b);v=np.cross(a,b);c=np.dot(a,b)
    if c<-.999999: return np.diag([-1.,-1.,1.])
    skew=np.array([[0,-v[2],v[1]],[v[2],0,-v[0]],[-v[1],v[0],0]])
    return np.eye(3)+skew+skew@skew/(1+c)

def around(axis,angle):
    axis=axis/np.linalg.norm(axis);x,y,z=axis
    skew=np.array([[0,-z,y],[z,0,-x],[-y,x,0]])
    return np.eye(3)+np.sin(angle)*skew+(1-np.cos(angle))*(skew@skew)

def repose(variant):
    matrices={}
    def matrix(name):
        if name in matrices:return matrices[name]
        bone=rig['bones'][name];head=joints[bone['head']];tail=joints[bone['tail']]
        parent=matrix(bone['parent']) if bone['parent'] else np.eye(4)
        rotation=parent[:3,:3].copy();posed_head=(parent@np.r_[head,1])[:3]
        side=1 if name.endswith('.L') else -1
        direction=None
        if name.startswith('upperarm'): direction=np.array([side*.50,-.82,.13])
        if name.startswith('lowerarm'): direction=np.array([-side*.36,.93,.25 if variant==0 else .15])
        if name.startswith('wrist'): direction=np.array([-side*.24,.98,.08])
        if name=='head': direction=np.array([0,.98,-.12]) if variant==0 else np.array([.12,.97,-.22])
        if direction is not None: rotation=align(rotation@(tail-head),direction)@rotation
        if name=='head': rotation=around(rotation@(tail-head),.38 if variant==0 else -.65)@rotation
        if name.startswith('finger'):
            axis=parent[:3,:3]@np.cross(tail-head,[0,0,1])
            rotation=around(axis,.18 if '-1.' in name else .38)@rotation
        result=np.eye(4);result[:3,:3]=rotation;result[:3,3]=posed_head-rotation@head
        matrices[name]=result;return result
    result=np.zeros_like(vertices);totals=np.zeros(len(vertices))
    hom=np.column_stack([vertices,np.ones(len(vertices))])
    for name,weighted in weights.items():
        weighted=np.array(weighted);indices=weighted[:,0].astype(int);amount=weighted[:,1]
        result[indices]+=(hom[indices]@matrix(name).T)[:,:3]*amount[:,None];totals[indices]+=amount
    selected=totals>0;result[selected]/=totals[selected,None];result[~selected]=vertices[~selected]
    # Anatomical source uses about17units for full adult height. This authored
    # scale and relief compression are not dimensions measured from Together.
    sign=1 if variant==0 else -1
    result=np.column_stack([result[:,1],sign*result[:,2],sign*result[:,0]])*.10
    result[:,1]*=.68;result[:,2]*=.80
    return result

poses=[]
for variant in range(2):
    posed=repose(variant);kept=[]
    for face in faces:
        # Torso study only: unpublished until the full sculptural transitions
        # and actual reference relationships are resolved.
        if min(vertices[face,1])<-.8:continue
        for k in range(1,len(face)-1):kept.append([face[0],face[k],face[k+1]])
    used=sorted(set(np.array(kept).flatten()));remap={old:new for new,old in enumerate(used)}
    posed=posed[used];kept=[[remap[x] for x in face] for face in kept]
    # Close every open anatomical boundary; the hidden torso cut sinks into the
    # poured base, while eye/mouth rims become small closed cast surfaces.
    edge_counts={}
    for face in kept:
        for a,b in zip(face,face[1:]+face[:1]):
            edge_counts[tuple(sorted([a,b]))]=edge_counts.get(tuple(sorted([a,b])),0)+1
    edges=[]
    for face in kept:
        edges.extend((a,b) for a,b in zip(face,face[1:]+face[:1]) if edge_counts[tuple(sorted([a,b]))]==1)
    while edges:
        first,last=edges.pop();loop=[first,last]
        while loop[-1]!=loop[0]:
            match=next((i for i,(a,b) in enumerate(edges) if a==loop[-1]),None)
            if match is None:raise ValueError('Non-oriented boundary')
            a,b=edges.pop(match);loop.append(b)
        center=posed[loop[:-1]].mean(axis=0)
        if center[0]<-.03:center[1]=min(posed[loop[:-1],1])-.015
        index=len(posed);posed=np.vstack([posed,center])
        kept.extend([b,a,index] for a,b in zip(loop[:-1],loop[1:]))
    posed[:,0]-=(posed[:,0].max()+posed[:,0].min())/2
    posed[:,1]-=posed[:,1].min();posed[:,1]+=.008
    poses.append(dict(positions=np.round(posed,6).flatten().tolist(),indices=[x for face in kept for x in face],bounds=[posed.min(axis=0).tolist(),posed.max(axis=0).tolist()]))
output=workspace/'output/marr-anatomy-study.json';output.parent.mkdir(parents=True,exist_ok=True);output.write_text(json.dumps(dict(license='CC0-1.0 anatomical base; original poses',poses=poses),separators=(',',':')))
print(json.dumps(dict(output=str(output),bytes=output.stat().st_size,sha256=hashlib.sha256(output.read_bytes()).hexdigest(),poses=[dict(vertices=len(x['positions'])//3,triangles=len(x['indices'])//3,bounds=x['bounds']) for x in poses]),indent=2))
if '--asset' in sys.argv:
    encoded=[base64.b64encode(np.rint(np.array(p['positions'])*50000).astype('<i2').tobytes()).decode() for p in poses]
    encoded_indices=base64.b64encode(np.array(poses[0]['indices'],dtype='<u2').tobytes()).decode()
    assert poses[0]['indices']==poses[1]['indices']
    module="// CC0 MakeHuman core data, original offline poses. See PROVENANCE.md and licenses/.\n"
    module+="const bytes=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0)).buffer;\n"
    module+="export const anatomyIndices=new Uint16Array(bytes('"+encoded_indices+"'));\n"
    module+="export const anatomyPoses=[\n"+',\n'.join("Float32Array.from(new Int16Array(bytes('"+s+"')),v=>v/50000)" for s in encoded)+"\n];\n"
    target=asset/'together-anatomy.mjs';target.write_text(module)
    print(json.dumps(dict(runtime=str(target),bytes=target.stat().st_size,license='CC0-1.0 anatomical base; original reconstruction poses')))
