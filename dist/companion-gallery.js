export const matchesCompanion=(model,query)=>[model.name,model.category,model.description].join(' ').toLowerCase().includes(String(query).trim().toLowerCase());
import {PERSONALITIES,personalityFor} from './personalities.js';

function portrait(id){
 if(id==='opal')return '<svg viewBox="0 0 140 130" aria-hidden="true"><path d="M46 34Q40 3 71 5q29-1 27 32l4 70H41Z" fill="#242638"/><ellipse cx="70" cy="29" rx="18" ry="22" fill="#ffe3da"/><path d="M50 23Q49 3 71 7q22 0 20 24L80 16l-9 14-5-15-14 17Z" fill="#242638"/><path d="M49 15Q70-2 92 16" fill="none" stroke="#fff7f2" stroke-width="6" stroke-dasharray="4 1"/><g fill="#8980bd" stroke="#30253d" stroke-width="1.5"><ellipse cx="62" cy="31" rx="4" ry="6"/><ellipse cx="79" cy="31" rx="4" ry="6"/></g><path d="M66 43q5 3 9-1" stroke="#a25e78" fill="none"/><path d="M56 53h28l5 22 14 31H37l15-31Z" fill="#2c2c40"/><path d="M61 54h18l2 20H59Z" fill="#fff7f2"/><path d="m61 55 9 5 9-5" stroke="#242638" stroke-width="3" fill="none"/><path d="m59 76 22 0 14 25H45Z" fill="#fff7f2"/><path d="m43 104 54 0" stroke="#fff7f2" stroke-width="5" stroke-dasharray="5 1"/><path d="M54 58 42 79l-2 9m46-30 12 21 2 9" fill="none" stroke="#ffe3da" stroke-width="6" stroke-linecap="round"/><path d="M60 109v12m20-12v12" stroke="#fff7f2" stroke-width="7"/><path d="M55 123h10m10 0h10" stroke="#242638" stroke-width="6" stroke-linecap="round"/></svg>';
 const shell=id==='chibi'?'#e9edf4':id==='office'?'#c8d1df':'#344154';
 const head=id==='cyber'?'<path d="M25 22 40 13h60l15 9v51l-15 9H40L25 73Z"/>':'<rect x="25" y="18" width="90" height="64" rx="'+(id==='chibi'?25:16)+'"/>';
 return `<svg viewBox="0 0 140 130" aria-hidden="true"><g fill="${shell}" stroke="#8194a7" stroke-width="2">${head}<rect x="50" y="82" width="40" height="24" rx="9"/><rect x="41" y="107" width="25" height="10" rx="5"/><rect x="74" y="107" width="25" height="10" rx="5"/>${id==='classic'?'':'<rect x="28" y="85" width="15" height="22" rx="7"/><rect x="97" y="85" width="15" height="22" rx="7"/>'}</g><rect x="32" y="26" width="76" height="48" rx="15" fill="#07121b"/><g fill="#8cf4ea"><rect x="43" y="35" width="20" height="28" rx="8"/><rect x="77" y="35" width="20" height="28" rx="8"/></g>${id==='gamer'?'<path d="M22 45V29C22 0 118 0 118 29v16" fill="none" stroke="#97a9bf" stroke-width="6"/><rect x="17" y="39" width="13" height="27" rx="6" fill="#f582ac"/><rect x="110" y="39" width="13" height="27" rx="6" fill="#f582ac"/><rect x="93" y="99" width="29" height="14" rx="5" fill="#151e30" stroke="#82ded3"/>':''}</svg>`;
}
export function mountCompanionGallery({models,select,onModel,onPersonality,getPersonality}){
 const gallery=document.querySelector('#model-gallery'),filters=document.querySelector('#category-filter'),persona=document.querySelector('#personality-select');
 let filter='All',query='';const search=document.querySelector('#model-search'),clear=document.querySelector('#model-search-clear');if(search)search.oninput=()=>{query=search.value;update();};if(clear)clear.onclick=()=>{query='';search.value='';filter='All';update();search.focus();};
 for(const category of ['All',...new Set(models.map(m=>m.category))]){
  const button=document.createElement('button');button.textContent=category;button.dataset.category=category;
  button.addEventListener('click',()=>{filter=category;update();});filters.append(button);
 }
 for(const model of models){
  const card=document.createElement('button');card.className='model-card';card.dataset.model=model.id;card.setAttribute('aria-label','Select '+model.name);
  card.innerHTML=portrait(model.id);const name=document.createElement('strong');name.textContent=model.name;const tag=document.createElement('small');tag.textContent=model.category;card.append(name,tag);
  card.addEventListener('click',()=>onModel(model.id));gallery.append(card);
 }
 for(const item of PERSONALITIES){const option=document.createElement('option');option.value=item.id;option.textContent=item.name+' · '+item.tag;persona.append(option);}
 persona.addEventListener('change',()=>onPersonality(persona.value));
 function update(){
  for(const card of gallery.children){const model=models.find(m=>m.id===card.dataset.model);card.hidden=(filter!=='All'&&model.category!==filter)||!matchesCompanion(model,query);card.classList.toggle('selected',card.dataset.model===select.value);card.setAttribute('aria-pressed',String(card.dataset.model===select.value));}
  for(const button of filters.children){button.classList.toggle('active',button.dataset.category===filter);button.setAttribute('aria-pressed',String(button.dataset.category===filter));}
  const count=[...gallery.children].filter(c=>!c.hidden).length;const counter=document.querySelector('#model-count');if(counter)counter.textContent=count+' Companion'+(count===1?'':'s');const empty=document.querySelector('#model-empty');if(empty)empty.hidden=count>0;if(clear)clear.hidden=!query&&filter==='All';
  const p=personalityFor(getPersonality());persona.value=p.id;document.querySelector('#personality-tag').textContent=p.tag;
  document.querySelector('#personality-description').textContent=p.name+' reactions and idle rhythm. Saved for this Companion identity, across robot shells. Humanoid characters keep their own identity.';
 }
 update();return {update};
}
