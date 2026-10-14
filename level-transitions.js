const clamp=value=>Math.max(0,Math.min(1,Number.isFinite(value)?value:0));
export function createLevelDoor(T,{width=1.4,height=2.3,color=0x343b3e}={}){
  const group=new T.Group(),hinges=[],geometries=[],materials=[];
  group.name='Level entrance door';group.userData.levelDoor=true;
  const panel=new T.MeshStandardMaterial({color,roughness:.58}),trim=new T.MeshStandardMaterial({color:0x9b9685,roughness:.45,emissive:0x2b2112,emissiveIntensity:.25});
  const black=new T.MeshBasicMaterial({color:0x010103,side:T.DoubleSide});materials.push(panel,trim,black);
  function part(w,h,d,material,x,y,z,parent=group){
    const geometry=new T.BoxGeometry(w,h,d),mesh=new T.Mesh(geometry,material);geometries.push(geometry);
    mesh.position.set(x,y,z);parent.add(mesh);return mesh;
  }
  const opening=part(width,height,.025,black,0,height/2,-.065);
  for(const side of [-1,1]){
    part(.065,height+.08,.10,trim,side*(width/2+.035),height/2,0);
    const hinge=new T.Group();hinge.position.x=side*width/2;group.add(hinge);hinges.push(hinge);
    part(width/2-.025,height-.04,.065,panel,-side*width/4,height/2,.008,hinge);
    part(.035,.25,.05,trim,-side*(width/2-.09),height*.48,.065,hinge);
  }
  part(width+.13,.075,.10,trim,0,height+.02,0);
  let open=0,disposed=false;
  return {group,opening,skin:panel,width,height,
    setOpen(value){open=clamp(value);hinges[0].rotation.y=open?-open*1.48:0;hinges[1].rotation.y=open*1.48;},
    center(){return group.localToWorld(new T.Vector3(0,height/2,0))},
    inspect(){return {open,width,height,leafAngles:hinges.map(hinge=>hinge.rotation.y),position:this.center().toArray()}},
    dispose(){if(disposed)return;disposed=true;group.removeFromParent();geometries.forEach(geometry=>geometry.dispose());materials.forEach(material=>material.dispose());}
  };
}
