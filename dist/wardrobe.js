// Outfit choice belongs to presentation, never to DDNA or the LLM.
export const OPAL_OUTFITS=Object.freeze([
 {id:'classic',name:'Classic lace',description:'Black dress, white ruffled apron and ribbon collar.'},
 {id:'rose',name:'Rose café',description:'Rose puff sleeves, layered skirt and white stockings.'},
 {id:'evening',name:'Midnight satin',description:'Long dark skirt, pearl trim and flowing hair.'},
 {id:'work',name:'Studio professional',description:'Navy long sleeves, practical apron and glasses.'},
 {id:'victorian',name:'Victorian ivory',description:'Long charcoal cotton dress, gathered ivory hem and white collar trim.'},
 {id:'bluebell',name:'Bluebell café',description:'Blue bell skirt, soft puff sleeves and scalloped apron trim.'},
 {id:'pinstripe',name:'Pinstripe housemaid',description:'Muted striped work dress, practical apron and gathered hem.'}
].map(Object.freeze));
const valid=id=>OPAL_OUTFITS.some(o=>o.id===id);
export function normalizeWardrobe(value){return {outfit:valid(value?.outfit)?value.outfit:'classic',automatic:value?.automatic===true,work:value?.work===true,schedule:Object.fromEntries(['morning','afternoon','evening','night'].map((period,i)=>[period,valid(value?.schedule?.[period])?value.schedule[period]:['classic','rose','evening','evening'][i]]))};}
export function wardrobePeriod(date=new Date()){const h=date.getHours();return h>=6&&h<12?'morning':h>=12&&h<17?'afternoon':h>=17&&h<22?'evening':'night';}
export function selectedOutfit(value,date=new Date()){const state=normalizeWardrobe(value);return state.work?'work':state.automatic?state.schedule[wardrobePeriod(date)]:state.outfit;}
