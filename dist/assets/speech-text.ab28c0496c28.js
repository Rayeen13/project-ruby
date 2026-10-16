// Keep every spoken character in order, with a small first phrase for lower startup latency.
export function speechChunks(text,{first=100,rest=220}={}){
 text=String(text).replace(/\[\d+\]/g,'').replace(/[\r\n]/g,' ').trim();const chunks=[];
 while(text){
  const limit=chunks.length?rest:first;if(text.length<=limit){chunks.push(text);break;}
  const prefix=text.slice(0,limit);let end=0;
  for(const match of prefix.matchAll(/[.!?]["'”’]?(?=\s|$)/g)){const n=match.index+match[0].length;if(n>=24){end=n;break;}}
  if(!end){end=prefix.lastIndexOf(' ')+1;if(end<limit/2)end=limit;}
  // Do not split a UTF-16 surrogate pair at a hard boundary.
  if(/[\uD800-\uDBFF]/.test(text[end-1]))end--;
  chunks.push(text.slice(0,end));text=text.slice(end);
 }
 return chunks;
}
