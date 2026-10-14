let sequence=0;
// Desktop requests stay behind the native boundary; websites use the browser adapter.
export class NativeChatProvider {
 constructor(tauri){this.tauri=tauri;}
 async models(){try{return await this.tauri.core.invoke('local_ai_models');}catch(error){throw new Error(String(error));}}
 async *stream({messages,model,signal}){
  if(signal.aborted)throw new DOMException('Stopped','AbortError');
  const requestId=++sequence,queue=[];let done=false,failure=null,wake=()=>{};
  const unlisten=await this.tauri.event.listen('ruby-chat-chunk',event=>{if(event.payload?.requestId===requestId&&!signal.aborted){if(event.payload.done)done=true;else if(typeof event.payload.text==='string')queue.push(event.payload.text);wake();}});
  const cancel=()=>this.tauri.core.invoke('local_ai_cancel',{requestId}).catch(()=>{});
  const abort=()=>{done=true;wake();void cancel();};signal.addEventListener('abort',abort,{once:true});
  try{
   if(signal.aborted)throw new DOMException('Stopped','AbortError');
   void this.tauri.core.invoke('local_ai_chat',{requestId,messages,model}).then(()=>{},error=>{failure=new Error(String(error));done=true;wake();});
   while(!done||queue.length){
    if(signal.aborted)throw new DOMException('Stopped','AbortError');
    if(queue.length){yield queue.shift();continue;}
    await new Promise(resolve=>{wake=resolve;});
   }
   if(signal.aborted)throw new DOMException('Stopped','AbortError');
   if(failure)throw failure;
  }finally{signal.removeEventListener('abort',abort);await cancel();unlisten();}
 }
}
