export const ANIME_VOICES=Object.freeze([
 {id:'anime_f_warm',name:'Ruby · warm',gender:'female',style:'Bright anime companion'},
 {id:'anime_f_witty',name:'Opal · dry wit',gender:'female',style:'18-year-old anime maid · gentle teasing'},
 {id:'anime_f_calm',name:'Emme · calm',gender:'female',style:'Composed anime companion'},
 {id:'anime_f_bright',name:'Amy · curious',gender:'female',style:'Lively anime companion'},
 {id:'anime_m_calm',name:'Saph · calm',gender:'male',style:'Steady anime companion'},
 {id:'anime_m_playful',name:'Jasper · playful',gender:'male',style:'Energetic anime companion'},
 {id:'anime_m_focused',name:'Jet · focused',gender:'male',style:'Confident anime companion'},
 {id:'anime_m_gentle',name:'Gentle · male',gender:'male',style:'Soft anime companion'}
].map(v=>Object.freeze({...v,pack:'irodori',language:'ja',accent:'Japanese · original voice design'})));
export function defaultAnimeVoice(identity){
 const male=identity.gender==='male',personality=identity.personality?.id;
 if(['sarcastic','tsundere','yandere'].includes(personality))return male?'anime_m_focused':'anime_f_witty';
 if(['calm','focused','kuudere','dandere','shundere'].includes(personality))return male?'anime_m_calm':'anime_f_calm';
 return ({opal:'anime_f_witty',ruby:'anime_f_warm',emme:'anime_f_calm',amy:'anime_f_bright',saph:'anime_m_calm',jasper:'anime_m_playful',jet:'anime_m_focused'})[identity.profile]||(male?'anime_m_playful':'anime_f_warm');
}
