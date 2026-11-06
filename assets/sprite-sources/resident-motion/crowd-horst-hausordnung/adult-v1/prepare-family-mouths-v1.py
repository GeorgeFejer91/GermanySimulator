"""Own Horst mouth transport through the actual owning source field.

Candidate compiler is explicit; no shared validator fallback or ignored expected
image input. Rounded/bite colour is intentionally left to real production GLSL.
"""
from pathlib import Path
import copy,importlib.util,hashlib
import numpy as np
from scipy.interpolate import PchipInterpolator

HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[4]
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()

def load(name,path):
    spec=importlib.util.spec_from_file_location(name,path);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m

def rest_definitions(compiler,compiler_sha):
    assert sha(compiler)==compiler_sha,'Explicit compiler bytes changed'
    return load('horst_owned_rest_v3',HERE/'prepare-mouth-source-fits-v3.py').generate(compiler)

def transport(points,field=None):
    p=np.asarray(points,float)
    if field is None:return p.copy()
    x=PchipInterpolator(field['nodes_y'],field['dx']);y=PchipInterpolator(field['nodes_y'],field['dy'])
    return p+np.stack([x(p[...,1]),y(p[...,1])],axis=-1)

def jacobian(center,field=None):
    if field is None:return np.eye(2)
    x=PchipInterpolator(field['nodes_y'],field['dx']);y=PchipInterpolator(field['nodes_y'],field['dy'])
    return np.array([[1.,float(x.derivative()(center[1]))],[0.,1.+float(y.derivative()(center[1]))]])

def posed_entry(rest,body_path,field=None):
    entry=copy.deepcopy(rest['entry']);old_center=np.asarray(entry['centerPx']);old_axes=np.asarray(entry['axesPx']).reshape(2,2).T
    matrix=jacobian(old_center,field);assert np.linalg.det(matrix)>0
    if field is not None:
        entry['centerPx']=transport(old_center,field).tolist()
        entry['axesPx']=(matrix@old_axes).T.reshape(4).tolist()
        entry['contoursPx']={k:transport(v,field).tolist()for k,v in entry['contoursPx'].items()}
    entry['input']={'file':body_path.relative_to(ROOT).as_posix(),'sha256':sha(body_path),'dimensions':[512,512]}
    # Both original tangent and normal must be transported, not just a y bob.
    epsilon=.001
    finite=np.column_stack([(transport(old_center+np.eye(2)[i]*epsilon,field)-transport(old_center-np.eye(2)[i]*epsilon,field))/(2*epsilon)for i in range(2)])
    assert np.max(np.abs(finite-matrix))<1e-8
    assert np.max(np.abs(np.asarray(entry['axesPx']).reshape(2,2).T-matrix@old_axes))<1e-12
    return entry,{'centerSourcePx':old_center.tolist(),'centerPosedPx':entry['centerPx'],'fullForwardJacobian':matrix.tolist(),'determinant':float(np.linalg.det(matrix)),'bothAxesFromJacobian':True,'finiteDifferenceJacobianMaxError':float(np.max(np.abs(finite-matrix))),'contoursUseExactSameOwningForwardField':True}

def native_entry(entry,native_path,target,figure=400,pivot=(256,472)):
    result=copy.deepcopy(entry);scale=target['figurePixels']/figure;origin=np.asarray(target['pivot'])-np.asarray(pivot)*scale
    result['input']={'file':native_path.relative_to(ROOT).as_posix(),'sha256':sha(native_path),'dimensions':target['cell']}
    result['centerPx']=(np.asarray(entry['centerPx'])*scale+origin).tolist()
    result['axesPx']=(np.asarray(entry['axesPx'])*scale).tolist()
    result['contoursPx']={k:(np.asarray(v)*scale+origin).tolist()for k,v in entry['contoursPx'].items()}
    return result
