import {mouthPaintGlsl,validateMouthProfile,mouthProfileValues} from './buergeramt-mouth-paint.js?v=20261018-mouth-single-exit';

const attachedMaterials=new WeakMap();
function finiteArray(values,size){
 if(!Array.isArray(values)||values.length!==size)return false;
 for(let index=0;index<size;index++)if(!Number.isFinite(values[index]))return false;
 return true;
}

function validateFrame(registration,label){
 const rect=registration?.rect,axes=registration?.axes;
 if(!finiteArray(rect,4)||rect[0]<0||rect[0]>1||rect[1]<0||rect[1]>1||rect[2]<=0||rect[2]>1||rect[3]<=0||rect[3]>1)throw new TypeError('Invalid street mouth rectangle: '+label);
 if(!finiteArray(axes,4)||axes.some(value=>Math.abs(value)>16384))throw new TypeError('Invalid street mouth axes: '+label);
 const determinant=axes[0]*axes[3]-axes[1]*axes[2],area=Math.hypot(axes[0],axes[1])*Math.hypot(axes[2],axes[3]);
 if(area<.0001||Math.abs(determinant)/area<.01)throw new RangeError('Singular street mouth axes: '+label);
}

export function validateStreetMouthRegistration(registration,label='street source'){
 if(registration===null)return null;
 validateFrame(registration,label);
 validateMouthProfile(registration.profile,label);
 return registration;
}

const declarations=`uniform float streetSpeaking;
uniform vec4 streetLipRect,streetLipAxes,streetLipShape,streetLipLower,streetLipEnds;
uniform vec3 streetLipTail,streetLipStyle;
uniform mat4 streetLipCurves;\n`;
const paintSample='amtMouthPaintFrame(map,vMapUv,streetLipRect,streetLipShape,streetLipAxes,streetLipCurves,streetLipLower,streetLipEnds,streetLipTail,streetLipStyle,streetSpeaking)';

/** Registration axes use current-texture pixels (+Y down); profiles are immutable source records. */
export function attachStreetCharacterMouth(T,material){
 if(attachedMaterials.has(material))throw new Error('Street mouth material already owned');
 const sourceChunk=T.ShaderChunk?.map_fragment;
 if(typeof sourceChunk!=='string')throw new Error('Unsupported street mouth map shader');
 const paintedChunk=sourceChunk.replace(/texture2D\(\s*map\s*,\s*vMapUv\s*\)/,paintSample);
 if(paintedChunk===sourceChunk)throw new Error('Unsupported street mouth map shader');
 const previousCompile=material.onBeforeCompile,previousKey=material.customProgramCacheKey;
 const uniforms={streetSpeaking:{value:0},streetLipRect:{value:new T.Vector4()},streetLipAxes:{value:new T.Vector4()},streetLipShape:{value:new T.Vector4()},streetLipCurves:{value:new T.Matrix4()},streetLipLower:{value:new T.Vector4()},streetLipEnds:{value:new T.Vector4()},streetLipTail:{value:new T.Vector3()},streetLipStyle:{value:new T.Vector3()}};
 const packedProfiles=new WeakMap();
 let disposed=false,texture=null,registration=null,currentProfile=null;
 function compile(shader,renderer){
  previousCompile?.call(this,shader,renderer);
  if(!shader.fragmentShader.includes('#include <map_fragment>'))throw new Error('Street mouth requires the material map fragment');
  Object.assign(shader.uniforms,uniforms);
  shader.fragmentShader=declarations+mouthPaintGlsl+shader.fragmentShader.replace('#include <map_fragment>',paintedChunk);
 }
 function programKey(){return (previousKey?.call(this)??'')+':street-mouth-v1:'+String(previousCompile)}
 function applyProfile(profile){
  let packed=packedProfiles.get(profile);
  if(!packed){packed=mouthProfileValues(validateMouthProfile(profile,'street source'));packedProfiles.set(profile,packed)}
  if(currentProfile===profile)return;
  for(const [suffix,values] of Object.entries(packed))uniforms['streetLip'+suffix[0].toUpperCase()+suffix.slice(1)].value.fromArray(values);
  currentProfile=profile;
 }
 function applyCue(opening){
  if(typeof opening==='number'&&Number.isFinite(opening))uniforms.streetLipShape.value.set(Math.max(0,Math.min(1,opening)),0,0,0);
  else if(finiteArray(opening,4))uniforms.streetLipShape.value.set(...opening.map(value=>Math.max(0,Math.min(1,value))));
  else throw new TypeError('Invalid street mouth cue');
 }
 function sync(state={}){
  if(disposed)return false;
  uniforms.streetSpeaking.value=0;uniforms.streetLipShape.value.set(0,0,0,0);
  texture=state.texture??null;registration=state.registration??null;
  if(registration){validateFrame(registration,'street source');applyProfile(registration.profile)}
  if(state.opening!==undefined&&state.opening!==null)applyCue(state.opening);
  const active=!!(texture&&material.map===texture&&registration&&state.speaking&&!state.paused&&state.opening!==undefined&&state.opening!==null);
  if(!active){uniforms.streetLipShape.value.set(0,0,0,0);return false}
  uniforms.streetLipRect.value.fromArray(registration.rect);uniforms.streetLipAxes.value.fromArray(registration.axes);uniforms.streetSpeaking.value=1;
  return true;
 }
 function dispose(){
  if(disposed)return;
  disposed=true;uniforms.streetSpeaking.value=0;uniforms.streetLipShape.value.set(0,0,0,0);
  texture=null;registration=null;currentProfile=null;
  if(material.onBeforeCompile===compile){material.onBeforeCompile=previousCompile;material.needsUpdate=true}
  if(material.customProgramCacheKey===programKey)material.customProgramCacheKey=previousKey;
  attachedMaterials.delete(material);
 }
 function inspect(){
  const shape=uniforms.streetLipShape.value;
  return{active:uniforms.streetSpeaking.value===1,disposed,texture,registration,rect:registration?.rect??null,axes:registration?.axes??null,opening:[shape.x,shape.y,shape.z,shape.w]};
 }
 const mouth={sync,dispose,inspect};
 material.onBeforeCompile=compile;material.customProgramCacheKey=programKey;material.needsUpdate=true;
 attachedMaterials.set(material,mouth);
 return mouth;
}
