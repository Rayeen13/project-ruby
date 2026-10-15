export const CHAT_KEY='project-ruby.conversation.v1';
const MAX_HISTORY=200,MAX_TEXT=8000;
export function restoreConversation(storage){
 try{
  const data=JSON.parse(storage?.getItem(CHAT_KEY)||'null');
  if(data?.version!==1||!Array.isArray(data.messages))return [];
  return data.messages.slice(-MAX_HISTORY).filter(m=>m&&['user','assistant'].includes(m.role)&&typeof m.content==='string').map(m=>({role:m.role,content:m.content.slice(0,MAX_TEXT),status:['complete','cancelled','error'].includes(m.status)?m.status:'cancelled',name:typeof m.name==='string'?m.name.slice(0,30):undefined}));
 }catch{return [];}
}
export function systemMessage(identity){
 return `You are ${identity.name}, a friendly gem robot companion from Project Ruby. Your body is ${identity.body}. ${identity.personality.prompt} Reply briefly, in the user's language when possible. Use facts from this conversation accurately. You cannot access live internet, see other apps, or control the computer in this chat. Never claim you performed those actions. Be honest when unsure.`;
}
export function contextMessages(history,identity){
 // Keep complete user/reply pairs only. Interrupted replies never become asserted facts.
 const pairs=[];let budget=1000;
 for(let i=history.length-2;i>=0;i--){
  const user=history[i],reply=history[i+1];
  if(user.role!=='user'||reply?.role!=='assistant'||reply.status!=='complete')continue;
  const cost=user.content.length+reply.content.length;
  if(cost>budget)break;
  pairs.unshift({role:'user',content:user.content},{role:'assistant',content:reply.content});budget-=cost;
 }
 return [{role:'system',content:systemMessage(identity)},...pairs];
}
export class Conversation {
 constructor({provider,storage,identity,onChange=()=>{},timeoutMs=120000}){Object.assign(this,{provider,storage,identity,onChange,timeoutMs});this.messages=restoreConversation(storage);this.state='idle';this.error='';this.saved=true;this.active=null;}
 emit(){try{this.storage.setItem(CHAT_KEY,JSON.stringify({version:1,messages:this.messages.slice(-MAX_HISTORY)}));this.saved=true;}catch{this.saved=false;}this.onChange(this);}
 stop(){if(!this.active)return;const active=this.active;this.active=null;active.controller.abort();active.reply.status='cancelled';this.state='idle';this.error='';this.emit();}
 clear(){this.stop();this.messages=[];this.error='';this.state='idle';this.emit();}
 async send(text,model,{retry=false}={}){
  text=text.trim();if(this.active||!text)return false;
  if(text.length>600){this.error='Keep this message under 600 characters for the compact model.';this.emit();return false;}
  if(!model){this.error='Connect a local model before sending.';this.emit();return false;}
  if(retry){const last=this.messages.at(-1);if(last?.role!=='assistant'||last.status==='complete')return false;this.messages.splice(-2);}
  const identity=this.identity(),context=contextMessages(this.messages,identity),reply={role:'assistant',content:'',status:'pending',name:identity.name};
  this.messages.push({role:'user',content:text,status:'complete'},reply);this.messages=this.messages.slice(-MAX_HISTORY);
  const active={controller:new AbortController(),reply};this.active=active;this.state='thinking';this.error='';this.emit();
  let timedOut=false;const timer=setTimeout(()=>{timedOut=true;active.controller.abort();},this.timeoutMs);
  try{
   for await(const chunk of this.provider.stream({messages:[...context,{role:'user',content:text}],model,signal:active.controller.signal})){
    if(this.active!==active)return false;
    if(reply.content.length+chunk.length>MAX_TEXT)throw new Error('Reply exceeded the compact chat limit.');
    reply.content+=chunk;this.state='replying';this.emit();
   }
   if(this.active!==active)return false;
   if(!reply.content.trim())throw new Error('The model returned an empty reply. Try again.');
   reply.status='complete';this.state='idle';return true;
  }catch(error){
   if(this.active!==active)return false;
   reply.status='error';this.state='error';this.error=timedOut?'The local model took too long. Retry or check the server.':error.message||'Could not reach the local model.';return false;
  }finally{clearTimeout(timer);if(this.active===active){this.active=null;this.emit();}}
 }
 retry(model){const user=this.messages.at(-2);return user?.role==='user'?this.send(user.content,model,{retry:true}):Promise.resolve(false);}
}
