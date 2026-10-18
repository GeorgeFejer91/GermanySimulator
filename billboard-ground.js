export function createBillboardGroundProjector(T){
  const point=new T.Vector3(),eye=new T.Vector3(),inverse=new T.Matrix4(),sources=new WeakMap();
  return function projectBillboardFeet(mesh,camera,groundHeight){
    const geometry=mesh.geometry,positions=geometry.attributes.position;
    let source=sources.get(geometry);
    if(!source){source=Float32Array.from(positions.array);sources.set(geometry,source)}
    mesh.updateWorldMatrix(true,false);camera.getWorldPosition(eye);inverse.copy(mesh.matrixWorld).invert();
    for(let i=0;i<positions.count;i++){
      point.fromArray(source,i*3).applyMatrix4(mesh.matrixWorld);
      if(point.y<groundHeight&&eye.y>groundHeight){
        const fraction=(groundHeight-eye.y)/(point.y-eye.y);
        point.sub(eye).multiplyScalar(fraction).add(eye).applyMatrix4(inverse);
        positions.setXYZ(i,point.x,point.y,point.z);
      }else positions.setXYZ(i,source[i*3],source[i*3+1],source[i*3+2]);
    }
    positions.needsUpdate=true;geometry.computeBoundingSphere();
  };
}
