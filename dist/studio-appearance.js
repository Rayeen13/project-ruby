export const APPEARANCE_KEY='project-ruby.studio-appearance.v1';
export const STUDIO_THEMES=Object.freeze([
 Object.freeze({id:'obsidian',name:'Obsidian',description:'A calm, matte workspace with ametrine accents.'}),
 Object.freeze({id:'sakura',name:'Sakura light',description:'A bright workspace with soft violet accents.'}),
 Object.freeze({id:'cyberpunk',name:'Cyberpunk',description:'A dark workspace with electric cyan accents.'})
]);
export const normalizeTheme=value=>STUDIO_THEMES.some(theme=>theme.id===value)?value:'obsidian';
export function readStudioTheme(storage){try{return normalizeTheme(JSON.parse(storage?.getItem(APPEARANCE_KEY)||'null')?.theme);}catch{return 'obsidian';}}
export function saveStudioTheme(storage,theme){try{if(!storage)return false;storage.setItem(APPEARANCE_KEY,JSON.stringify({version:1,theme:normalizeTheme(theme)}));return true;}catch{return false;}}
export function mountStudioAppearance({document,storage}){
 const select=document.querySelector('#studio-theme'),description=document.querySelector('#studio-theme-description');
 function apply(value,{save=false}={}){const id=normalizeTheme(value),theme=STUDIO_THEMES.find(t=>t.id===id);document.documentElement.dataset.studioTheme=id;select.value=id;description.textContent=theme.description;const saved=!save||saveStudioTheme(storage,id);document.querySelector('#studio-theme-status').textContent=saved?'Appearance stays on this device.':'Appearance changed for this session; device storage is unavailable.';return id;}
 for(const theme of STUDIO_THEMES){const option=document.createElement('option');option.value=theme.id;option.textContent=theme.name;select.append(option);}
 select.onchange=()=>apply(select.value,{save:true});apply(readStudioTheme(storage));return {apply};
}
