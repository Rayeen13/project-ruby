import {applyPrismTokens,themeIdForPrism} from './theme-prisms.js';
export const APPEARANCE_KEY='project-ruby.studio-appearance.v1';
export const STUDIO_THEMES=Object.freeze([
 Object.freeze({id:'obsidian',name:'Obsidian',description:'A calm, matte workspace with ametrine accents.'}),
 Object.freeze({id:'sakura',name:'Sakura light',description:'A bright workspace with soft violet accents.'}),
 Object.freeze({id:'cyberpunk',name:'Cyberpunk',description:'A dark workspace with electric cyan accents.'})
]);
export const normalizeTheme=(value,prisms=[])=>STUDIO_THEMES.some(theme=>theme.id===value)||prisms.some(prism=>themeIdForPrism(prism.id)===value)?value:'obsidian';
export function readStudioTheme(storage,prisms=[]){try{return normalizeTheme(JSON.parse(storage?.getItem(APPEARANCE_KEY)||'null')?.theme,prisms);}catch{return 'obsidian';}}
export function saveStudioTheme(storage,theme,prisms=[]){try{if(!storage)return false;storage.setItem(APPEARANCE_KEY,JSON.stringify({version:1,theme:normalizeTheme(theme,prisms)}));return true;}catch{return false;}}
export function mountStudioAppearance({document,storage,themePrisms={list:()=>[]}}){
 const select=document.querySelector('#studio-theme'),description=document.querySelector('#studio-theme-description');let current='obsidian';
 function apply(value,{save=false}={}){const prisms=themePrisms.list(),id=normalizeTheme(value,prisms),prism=prisms.find(p=>themeIdForPrism(p.id)===id),theme=STUDIO_THEMES.find(t=>t.id===id);current=id;document.documentElement.dataset.studioTheme=prism?'custom':id;applyPrismTokens(document.documentElement,prism);select.value=id;description.textContent=prism?'Installed Prism · '+prism.name+' by '+prism.author:theme.description;const saved=!save||saveStudioTheme(storage,id,prisms);document.querySelector('#studio-theme-status').textContent=saved?'Appearance stays on this device.':'Appearance changed for this session; device storage is unavailable.';return id;}
 function refresh(value=current){select.replaceChildren();for(const theme of [...STUDIO_THEMES,...themePrisms.list().map(p=>({id:themeIdForPrism(p.id),name:p.name+' · Prism'}))]){const option=document.createElement('option');option.value=theme.id;option.textContent=theme.name;select.append(option);}return apply(value);}
 const previous=select.onchange,handler=()=>apply(select.value,{save:true});select.onchange=handler;refresh(readStudioTheme(storage,themePrisms.list()));
 return {apply,refresh,current:()=>current,dispose(){if(select.onchange===handler)select.onchange=previous;select.replaceChildren();applyPrismTokens(document.documentElement,null);}};
}
