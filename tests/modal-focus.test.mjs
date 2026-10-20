import test from 'node:test';
import assert from 'node:assert/strict';
import {createModalFocus} from '../modal-focus.js';

function fixture(previousKind) {
  const document={defaultView:{getComputedStyle:()=>({visibility:'visible'})},addEventListener(){}};
  function element(focusable=true){
    const attributes=new Map();
    return {ownerDocument:document,isConnected:true,inert:false,disabled:false,tabIndex:focusable?0:-1,
      getClientRects:()=>[{}],closest:()=>null,contains:node=>node===modalControl,
      getAttribute:name=>attributes.get(name)??null,setAttribute:(name,value)=>attributes.set(name,value),removeAttribute:name=>attributes.delete(name),
      focus(){if(focusable)document.activeElement=this}};
  }
  const body=element(false),html=element(false),priorControl=element(),restore=element(),modalControl=element();
  document.body=body;document.documentElement=html;
  document.activeElement={body,html,control:priorControl}[previousKind];
  const modal=element(),root={ownerDocument:document,children:[modal,restore]};
  modal.parentElement=root;modal.querySelectorAll=()=>[modalControl];
  const focus=createModalFocus(root,{restoreTarget:()=>restore});
  return {document,priorControl,restore,modalControl,modal,focus};
}

for(const previous of ['body','html'])test(`modal release restores a game control when prior focus was ${previous}`,()=>{
  const f=fixture(previous);f.focus.sync(f.modal);
  assert.equal(f.document.activeElement,f.modalControl);
  assert.equal(f.restore.inert,true);
  f.focus.sync(null);
  assert.equal(f.restore.inert,false);
  assert.equal(f.document.activeElement,f.restore);
});

test('modal release retains a visible previous control',()=>{
  const f=fixture('control');f.focus.sync(f.modal);f.focus.sync(null);
  assert.equal(f.document.activeElement,f.priorControl);
});
