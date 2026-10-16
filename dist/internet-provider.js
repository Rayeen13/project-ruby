export function explicitSearch(text){return /^(?:please\s+)?(?:search|look up|browse|find\b.*\bonline\b)|\b(?:search the (?:web|internet)|look (?:it|that) up)\b/i.test(text);}
export function shouldSearch(text,{enabled=false}={}){
 if(explicitSearch(text))return true;
 if(!enabled||/^(?:hi\b|hey\b|hello\b|assalamu|wa.?alaikum|who are you|what(?: is|\'s) your name|kimi wa dare|anata wa dare|tomodachi desu ka|how are you|are (?:you|u) (?:a |my )?friend|say\b|repeat\b|remember\b)|\b(?:romaji|nihongo|practice Japanese|speak (?:in )?(?:Japanese|English))\b/i.test(text))return false;
 return /^(?:what|who|where|when|why|how|tell me|explain|talk|converse|discuss)|\b(?:latest|news|today|current|weather|price)\b/i.test(text);
}
// Search receives the explicit query only; never the owner memory or chat history.
export function googleAiUrl(query){return 'https://www.google.com/search?udm=50&q='+encodeURIComponent(query.slice(0,600));}
export function searchQuery(text,history=[]){let query=text.replace(/^(?:please\s+)?(?:search(?: the)?(?: internet| web)?(?: for)?|look up)\s*[: ,]*/i,'').trim();if(!query||/^(?:what i (?:just )?asked(?: you| u)?|that|it|tell me more|more(?: about (?:it|that))?|why\??)$/i.test(query))query=[...history].reverse().find(m=>m.role==='user'&&!/^(?:search|look up)/i.test(m.content))?.content||query;return query.slice(0,600);}
export async function searchInternet(query,{signal,tauri=globalThis.__TAURI__,fetcher=fetch}={}){
 if(tauri){const result=await tauri.core.invoke('internet_search',{query});if(signal?.aborted)throw new DOMException('Stopped','AbortError');return result;}
 const params=new URLSearchParams({action:'query',format:'json',origin:'*',generator:'search',gsrsearch:query,gsrlimit:'3',prop:'extracts',exintro:'1',explaintext:'1',exchars:'550'});
 const response=await fetcher('https://en.wikipedia.org/w/api.php?'+params,{signal});if(!response.ok)throw new Error('Internet lookup is unavailable. Try again.');
 const data=await response.json();return Object.values(data.query?.pages||{}).sort((a,b)=>a.index-b.index).slice(0,3).map(page=>({title:page.title,url:'https://en.wikipedia.org/?curid='+page.pageid,snippet:page.extract?.slice(0,550)||''}));
}
