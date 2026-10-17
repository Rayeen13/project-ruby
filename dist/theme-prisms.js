// V1 user Prisms are data-only workspace themes: no scripts, URLs or OS access.
export const PRISM_STORAGE_KEY='project-ruby.prisms.themes.v1';
export const MAX_PRISM_BYTES=24576,MAX_THEME_PRISMS=12;
export const THEME_TOKEN_KEYS=Object.freeze(['bg','surface','raised','active','line','text','muted','subtle','accent','primary','primaryText']);
const text=(value,max)=>typeof value==='string'&&value.trim().length>0&&value.length<=max;
const luminance=hex=>{const rgb=hex.match(/[a-f\d]{2}/gi).map(v=>parseInt(v,16)/255).map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4);return .2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2];};
const contrast=(a,b)=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
export function validateThemePrism(value){
 const allowed=['apiVersion','id','name','version','author','license','kind','permissions','tokens'];
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(k=>!allowed.includes(k)))throw Error('Choose a supported Prism manifest.');
 if(value.apiVersion!==1||value.kind!=='workspace-theme')throw Error('This version installs data-only workspace theme Prisms.');
 if(typeof value.id!=='string'||value.id.length>80||!/^user\.[a-z0-9]+(?:[.-][a-z0-9]+)*$/.test(value.id))throw Error('A user Prism needs an ID such as user.my-theme.');
 if(!text(value.name,60)||!text(value.author,100)||!text(value.license,2000)||!text(value.version,32))throw Error('Prism name, author, version and licence are required.');
 if(!Array.isArray(value.permissions)||value.permissions.length)throw Error('Theme Prisms cannot request system or network permissions.');
 const tokens=value.tokens;
 if(!tokens||typeof tokens!=='object'||Array.isArray(tokens)||Object.keys(tokens).length!==THEME_TOKEN_KEYS.length||THEME_TOKEN_KEYS.some(k=>!/^#[a-f\d]{6}$/i.test(tokens[k]||'')))throw Error('Theme colours must be the supported six-digit hex tokens.');
 for(const background of ['bg','surface','raised','active'])for(const foreground of ['text','muted','subtle','accent'])if(contrast(tokens[foreground],tokens[background])<4.5)throw Error('This theme needs more readable text contrast.');
 if(contrast(tokens.primary,tokens.primaryText)<4.5)throw Error('This theme needs more readable button contrast.');
 return Object.freeze({...value,id:value.id,name:value.name.trim(),author:value.author.trim(),license:value.license.trim(),version:value.version.trim(),permissions:Object.freeze([]),tokens:Object.freeze({...tokens})});
}
export function parseThemePrism(source){if(typeof source!=='string'||new TextEncoder().encode(source).length>MAX_PRISM_BYTES)throw Error('Choose a Prism file under 24 KB.');let value;try{value=JSON.parse(source);}catch{throw Error('This Prism file is not valid JSON.');}return validateThemePrism(value);}
export class ThemePrismStore{
 constructor(storage){this.storage=storage;this.items=[];this.loadError='';try{const value=JSON.parse(storage?.getItem(PRISM_STORAGE_KEY)||'null');if(value===null)return;if(value.version!==1||!Array.isArray(value.items)||value.items.length>MAX_THEME_PRISMS)throw Error('Unsupported saved Prisms.');const ids=new Set();this.items=value.items.map(item=>{const prism=validateThemePrism(item);if(ids.has(prism.id))throw Error('Duplicate saved Prism.');ids.add(prism.id);return prism;});}catch{this.items=[];this.loadError='Saved Prisms could not be read. Your original saved data has not been overwritten.';}}
 list(){return [...this.items];}
 write(items){try{if(!this.storage)throw Error('unavailable');this.storage.setItem(PRISM_STORAGE_KEY,JSON.stringify({version:1,items}));}catch{throw Error('Could not save this change. Check device storage and retry.');}this.items=items;this.loadError='';}
 install(value){const prism=validateThemePrism(value);if(this.items.some(item=>item.id===prism.id))throw Error('This Prism is already installed. Remove it before installing another version.');if(this.items.length>=MAX_THEME_PRISMS)throw Error('Remove a theme Prism before installing another.');this.write([...this.items,prism]);return prism;}
 remove(id){if(!this.items.some(item=>item.id===id))return false;this.write(this.items.filter(item=>item.id!==id));return true;}
}
export const themeIdForPrism=id=>'prism:'+id;
export function applyPrismTokens(root,prism){for(const key of THEME_TOKEN_KEYS)root.style.removeProperty('--ui-'+key.replace(/[A-Z]/g,c=>'-'+c.toLowerCase()));root.style.removeProperty('--ui-stage');root.style.removeProperty('color-scheme');if(!prism)return;const checked=validateThemePrism(prism);root.style.setProperty('color-scheme',luminance(checked.tokens.bg)>.4?'light':'dark');for(const [key,value] of Object.entries(checked.tokens))root.style.setProperty('--ui-'+key.replace(/[A-Z]/g,c=>'-'+c.toLowerCase()),value);root.style.setProperty('--ui-stage','radial-gradient(ellipse at 48% 45%, '+checked.tokens.raised+' 0%, '+checked.tokens.bg+' 100%)');}
