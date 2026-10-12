// Residence owns wear; the existing integrated scene clock owns each flicker.
// No random timers or additional light/shadow sources.
export const amtLampDeaths=Object.freeze([780,900,1020,1110,1200]);
const clamp=v=>Math.max(0,Math.min(1,v));
const smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
export function amtLampLevel(age,motion,index,reduced=false){
  const end=amtLampDeaths[index],wear=clamp(Math.max(0,age)/end);
  if(age>=end)return 0;
  const phase=motion*(.025+.11*wear*wear)+index*.381966;
  const wave=.5+.5*Math.sin(phase*Math.PI*2);
  const threshold=.998-.30*wear;
  const flicker=reduced?0:smooth((wave-threshold)/(1-threshold));
  return (1-.22*wear)*(1-.96*Math.pow(wear,1.4)*flicker)*(1-smooth((age-(end-50))/50));
}
export function createAmtLampWear({THREE:T,materials,floor}){
  const levels={value:new Float32Array(5).fill(1)},original=materials.map(material=>material.color.clone());
  const dim=new T.MeshBasicMaterial({color:0x000000,transparent:true,opacity:0,depthTest:false,depthWrite:false,toneMapped:false});
  const scene=new T.Scene(),camera=new T.OrthographicCamera(-1,1,1,-1,0,1),quad=new T.Mesh(new T.PlaneGeometry(2,2),dim);quad.frustumCulled=false;scene.add(quad);
  floor.setLights(levels);let age=0,motion=0,reduced=false;
  function update(state,reduce=false){
    if(globalThis.document?.hidden&&state)return;
    age=state?Math.max(0,Number.isFinite(state.time)?state.time:0):0;
    motion=state?Math.max(0,Number.isFinite(state.visualTime)?state.visualTime:0):0;reduced=reduce;
    let total=0;
    for(let i=0;i<5;i++){const level=state?amtLampLevel(age,motion,i,reduced):1;levels.value[i]=level;total+=level;materials[i].color.copy(original[i]).multiplyScalar(.012+.988*level);}
    // Uniform illumination includes native paint, Gaussian actors and emissive
    // signs. A tiny residual keeps the exhausted room almost, not fully, black.
    dim.opacity=.992*(1-total/5);
  }
  return{update,render(renderer){if(dim.opacity<=0)return;const auto=renderer.autoClear;renderer.autoClear=false;try{renderer.render(scene,camera);}finally{renderer.autoClear=auto;}},
    inspect:()=>({age,clock:motion,reducedMotion:reduced,levels:Array.from(levels.value),dead:Array.from(levels.value).filter(v=>v===0).length,illumination:1-dim.opacity}),
    dispose(){quad.geometry.dispose();dim.dispose();}};
}
