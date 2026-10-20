export function createModalFocus(root,{onChange=()=>{},restoreTarget=()=>null}={}){
  const document=root.ownerDocument,isolated=new Map();
  let active=null,previous=null,attributes=null;
  const visible=element=>element?.isConnected&&element.getClientRects().length&&document.defaultView.getComputedStyle(element).visibility!=='hidden';
  const controls=()=>[...active.querySelectorAll('button,input,select,textarea,a[href],[tabindex]')].filter(element=>
    !element.disabled&&element.tabIndex>=0&&!element.closest('[inert]')&&visible(element));
  function focusFirst(){
    const first=controls()[0];
    if(!first)active.setAttribute('tabindex','-1');
    (first||active).focus({preventScroll:true});
  }
  function release(){
    for(const [element,inert] of isolated)element.inert=inert;
    isolated.clear();
    if(active)for(const [name,value] of Object.entries(attributes)){
      if(value===null)active.removeAttribute(name);else active.setAttribute(name,value);
    }
  }
  function sync(next){
    if(next===active){if(active&&!active.contains(document.activeElement))focusFirst();return}
    const wasActive=!!active;
    if(!wasActive&&next){previous=document.activeElement;if(previous===document.body||previous===document.documentElement)previous=null}
    release();active=next;onChange();
    if(!active){
      const target=visible(previous)&&!previous.closest('[inert]')?previous:restoreTarget();
      previous=null;target?.focus({preventScroll:true});return;
    }
    attributes=Object.fromEntries(['role','aria-modal','tabindex'].map(name=>[name,active.getAttribute(name)]));
    active.setAttribute('role','dialog');active.setAttribute('aria-modal','true');
    for(let path=active;path&&path!==root;path=path.parentElement){
      for(const sibling of path.parentElement.children)if(sibling!==path){
        isolated.set(sibling,sibling.inert);sibling.inert=true;
      }
    }
    focusFirst();
  }
  document.addEventListener('focusin',event=>{if(active&&!active.contains(event.target))focusFirst()},true);
  document.addEventListener('keydown',event=>{
    if(!active||event.key!=='Tab')return;
    const candidates=controls(),index=candidates.indexOf(document.activeElement);
    if(!candidates.length){event.preventDefault();focusFirst();return}
    if(index<0||event.shiftKey&&index===0||!event.shiftKey&&index===candidates.length-1){
      event.preventDefault();candidates[event.shiftKey?candidates.length-1:0].focus();
    }
  },true);
  return {sync};
}
