import {MAX_PRISM_BYTES,parseThemePrism,themeIdForPrism} from './theme-prisms.js';
export function mountPrismManager({document,themePrisms},appearance){
 const el=id=>document.getElementById(id),file=el('prism-file'),status=el('prism-status'),review=el('prism-review');let pending=null,request=0,disposed=false;
 const say=text=>{status.textContent=text;};
 function reset(){pending=null;review.hidden=true;file.value='';}
 function render(){const list=el('prism-list');list.replaceChildren();for(const prism of themePrisms.list()){
  const card=document.createElement('article');card.className='prism-card';const name=document.createElement('strong'),detail=document.createElement('small'),actions=document.createElement('div'),use=document.createElement('button'),remove=document.createElement('button');
  name.textContent=prism.name;detail.textContent=prism.author+' · '+prism.version+' · Theme';use.textContent='Use theme';remove.textContent='Remove';remove.setAttribute('aria-label','Remove '+prism.name);
  use.onclick=()=>{appearance.apply(themeIdForPrism(prism.id),{save:true});render();say('Using '+prism.name+'.');};
  remove.onclick=()=>{try{themePrisms.remove(prism.id);const old=appearance.current();appearance.refresh(old);if(old===themeIdForPrism(prism.id))appearance.apply('ametrine',{save:true});render();say(prism.name+' removed. Companion data is unchanged.');}catch(error){say(error.message);}};
  actions.append(use,remove);card.append(name,detail,actions);list.append(card);
 }el('prism-empty').hidden=themePrisms.list().length>0;}
 const choose=()=>file.click();el('prism-choose').onclick=choose;
 file.onchange=async()=>{const token=++request;pending=null;review.hidden=true;const selected=file.files?.[0];if(!selected)return;try{if(selected.size>MAX_PRISM_BYTES)throw Error('Choose a Prism file under 24 KB.');const prism=parseThemePrism(await selected.text());if(disposed||token!==request)return;pending=prism;el('prism-review-name').textContent=prism.name;el('prism-review-info').textContent=prism.author+' · '+prism.version+' · '+selected.size.toLocaleString()+' bytes';el('prism-review-license').textContent=prism.license;review.hidden=false;say('Review this Prism. It is not installed until you choose Install.');}catch(error){if(!disposed&&token===request)say(error.message);}};
 el('prism-install').onclick=()=>{if(!pending)return;try{const prism=themePrisms.install(pending);appearance.refresh();reset();render();say(prism.name+' installed. Choose Use theme to activate it.');}catch(error){say(error.message);}};
 el('prism-cancel').onclick=()=>{request++;reset();say('Installation cancelled. Nothing was installed.');};
 render();if(themePrisms.loadError)say(themePrisms.loadError);
 return {refresh:render,dispose(){disposed=true;request++;file.onchange=null;el('prism-choose').onclick=null;el('prism-install').onclick=null;el('prism-cancel').onclick=null;el('prism-list').replaceChildren();reset();}};
}
