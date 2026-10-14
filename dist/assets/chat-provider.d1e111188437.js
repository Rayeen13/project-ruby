// The first provider is deliberately local-only. Cloud credentials never enter the renderer.
export const LOCAL_AI_URL='http://127.0.0.1:8081';
export class LocalChatProvider {
 constructor({fetcher=globalThis.fetch,base=LOCAL_AI_URL}={}){this.fetcher=fetcher;this.base=base;}
 async models(signal){
  const response=await this.fetcher(this.base+'/v1/models',{signal,credentials:'omit',redirect:'error'});
  if(!response.ok)throw new Error('Local model server is not ready ('+response.status+').');
  const data=await response.json();
  const models=(data.data||[]).filter(item=>typeof item.id==='string'&&item.id.length<=300);
  if(!models.length)throw new Error('No model is loaded in the local server.');
  return models.map(item=>item.id);
 }
 async *stream({messages,model,signal}){
  const response=await this.fetcher(this.base+'/v1/chat/completions',{method:'POST',signal,credentials:'omit',redirect:'error',headers:{'Content-Type':'application/json'},body:JSON.stringify({model,messages,stream:true,max_tokens:192,temperature:.65})});
  if(!response.ok)throw new Error('Local AI request failed ('+response.status+').');
  if(!response.body||!response.headers.get('content-type')?.includes('text/event-stream'))throw new Error('The model server did not return a text stream.');
  const reader=response.body.getReader(),decoder=new TextDecoder();let buffer='',finished=false;
  try{
   while(true){
    const {value,done}=await reader.read();buffer+=decoder.decode(value,{stream:!done});
    // Normalize CRLF only after complete lines arrive; a network chunk can end in CR.
    let boundary;
    while((boundary=buffer.indexOf('\n'))!==-1){
     const line=buffer.slice(0,boundary).replace(/\r$/,'');buffer=buffer.slice(boundary+1);
     if(!line.startsWith('data:'))continue;
     const payload=line.slice(5).trim();if(!payload)continue;
     if(payload==='[DONE]'){finished=true;return;}
     let event;try{event=JSON.parse(payload);}catch{throw new Error('The model returned an unreadable stream.');}
     if(event.error)throw new Error('The local model reported an error.');
     const choice=event.choices?.[0],text=choice?.delta?.content;
     if(typeof text==='string'&&text)yield text;
     if(choice?.finish_reason)finished=true;
    }
    if(buffer.length>65536)throw new Error('The model stream exceeded its event limit.');
    if(done){if(!finished)throw new Error('Connection ended before the reply finished.');return;}
   }
  }finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
 }
}
