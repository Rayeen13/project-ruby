import {THEME_TOKEN_KEYS,validateThemePrism} from './theme-prisms.js';
import {serializeThemePrism,prepareThemeListing} from './theme-sharing.js';

export function downloadThemeData(document,filename,source){
 const url=URL.createObjectURL(new Blob([source],{type:'application/json'})),link=document.createElement('a');
 link.href=url;link.download=filename;document.body.append(link);link.click();link.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export function mountThemeCreator({document,themePrisms},library){
 const el=id=>document.getElementById(id),form=el('theme-creator'),status=el('theme-creator-status'),fields=el('theme-colours');
 const defaults={bg:'#11101a',surface:'#191522',raised:'#211b30',active:'#2a2340',line:'#504361',text:'#f5efff',muted:'#c4b8d4',subtle:'#b5a7ca',accent:'#d7b7ff',primary:'#6842a6',primaryText:'#ffffff'};
 for(const key of THEME_TOKEN_KEYS){const label=document.createElement('label'),input=document.createElement('input');label.textContent=key.replace(/[A-Z]/g,c=>' '+c.toLowerCase());input.type='color';input.name=key;input.value=defaults[key];label.append(input);fields.append(label);}
 const read=()=>validateThemePrism({apiVersion:1,kind:'workspace-theme',permissions:[],id:el('theme-id').value,name:el('theme-name').value,author:el('theme-author').value,version:el('theme-version').value,license:el('theme-license').value,tokens:Object.fromEntries(THEME_TOKEN_KEYS.map(key=>[key,form.elements.namedItem(key).value]))});
 const run=action=>{try{action(read());}catch(error){status.textContent=error.message;}};
 form.onsubmit=event=>{event.preventDefault();run(theme=>{downloadThemeData(document,theme.id+'.prism.json',serializeThemePrism(theme));status.textContent='Theme exported. Import this file on the website or desktop app.';});};
 el('theme-install-created').onclick=()=>run(theme=>{themePrisms.install(theme);library.refresh();status.textContent='Theme installed. Choose Use theme in your Prisms list to apply it.';});
 el('theme-shop-draft').onclick=()=>run(theme=>{const draft=prepareThemeListing(theme,{description:el('theme-shop-description').value,price:el('theme-shop-price').value,currency:el('theme-shop-currency').value,rightsConfirmed:el('theme-shop-rights').checked});downloadThemeData(document,theme.id+'.shop-draft.json',JSON.stringify(draft,null,2)+'\n');status.textContent='Shop draft exported with its theme. It is not published or available for purchase.';});
 return {dispose(){form.onsubmit=null;el('theme-install-created').onclick=null;el('theme-shop-draft').onclick=null;fields.replaceChildren();}};
}
