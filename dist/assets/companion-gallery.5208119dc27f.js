import {PERSONALITIES,personalityFor} from './personalities.5208119dc27f.js';

function portrait(id){
 if(id==='opal')return '<svg viewBox="0 0 140 130" aria-hidden="true"><path d="M34 76V39C34-2 107-2 107 39v43l-20 8H43Z" fill="#34384f"/><ellipse cx="70" cy="48" rx="28" ry="33" fill="#e0e5ef"/><path d="M38 39Q37 6 72 10q30-3 31 34Q88 42 80 28Q74 44 61 41Q61 27 54 25Q49 40 38 44Z" fill="#34384f"/><path d="M39 23Q70-3 100 23" fill="none" stroke="#e5e7f0" stroke-width="9" stroke-dasharray="6 2"/><g fill="#b4b8ff" stroke="#343147" stroke-width="3"><ellipse cx="57" cy="52" rx="7" ry="10"/><ellipse cx="82" cy="52" rx="7" ry="10"/></g><path d="M46 63l5 7m38-7-5 7" stroke="#7885a8"/><path d="M64 69q6 5 13-2" stroke="#a05d73" fill="none"/><path d="m47 83 46 0 12 34H35Z" fill="#182030"/><path d="M56 85h28l6 29H50Z" fill="#e5e7f0"/><path d="m64 85 6 5 6-5" fill="none" stroke="#b4b8ff" stroke-width="4"/></svg>';
 const shell=id==='chibi'?'#e9edf4':id==='office'?'#c8d1df':'#344154';
 const head=id==='cyber'?'<path d="M25 22 40 13h60l15 9v51l-15 9H40L25 73Z"/>':'<rect x="25" y="18" width="90" height="64" rx="'+(id==='chibi'?25:16)+'"/>';
 return `<svg viewBox="0 0 140 130" aria-hidden="true"><g fill="${shell}" stroke="#8194a7" stroke-width="2">${head}<rect x="50" y="82" width="40" height="24" rx="9"/><rect x="41" y="107" width="25" height="10" rx="5"/><rect x="74" y="107" width="25" height="10" rx="5"/>${id==='classic'?'':'<rect x="28" y="85" width="15" height="22" rx="7"/><rect x="97" y="85" width="15" height="22" rx="7"/>'}</g><rect x="32" y="26" width="76" height="48" rx="15" fill="#07121b"/><g fill="#8cf4ea"><rect x="43" y="35" width="20" height="28" rx="8"/><rect x="77" y="35" width="20" height="28" rx="8"/></g>${id==='gamer'?'<path d="M22 45V29C22 0 118 0 118 29v16" fill="none" stroke="#97a9bf" stroke-width="6"/><rect x="17" y="39" width="13" height="27" rx="6" fill="#f582ac"/><rect x="110" y="39" width="13" height="27" rx="6" fill="#f582ac"/><rect x="93" y="99" width="29" height="14" rx="5" fill="#151e30" stroke="#82ded3"/>':''}</svg>`;
}
export function mountCompanionGallery({models,select,onModel,onPersonality,getPersonality}){
 const gallery=document.querySelector('#model-gallery'),filters=document.querySelector('#category-filter'),persona=document.querySelector('#personality-select');
 let filter='All';
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
  for(const card of gallery.children){const model=models.find(m=>m.id===card.dataset.model);card.hidden=filter!=='All'&&model.category!==filter;card.classList.toggle('selected',card.dataset.model===select.value);card.setAttribute('aria-pressed',String(card.dataset.model===select.value));}
  for(const button of filters.children){button.classList.toggle('active',button.dataset.category===filter);button.setAttribute('aria-pressed',String(button.dataset.category===filter));}
  const p=personalityFor(getPersonality());persona.value=p.id;document.querySelector('#personality-tag').textContent=p.tag;
  document.querySelector('#personality-description').textContent=p.name+' reactions and idle rhythm. Saved separately for each body.';
 }
 update();return {update};
}
