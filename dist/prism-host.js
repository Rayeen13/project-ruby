// Trusted bundled modules only. Lifecycle orchestration is independent of DOM,
// Tauri, rendering and inference. This is not an untrusted-code sandbox.
const validId=value=>typeof value==='string'&&/^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$/.test(value);
export function createPrismHost(context={}){
 const definitions=new Map(),active=new Map(),environment=Object.freeze({...context});let pending=Promise.resolve();
 const serial=operation=>{const result=pending.then(operation);pending=result.catch(()=>{});return result;};
 function register(module){
  if(!module||!validId(module.id)||typeof module.mount!=='function'||typeof module.version!=='string'||!module.version)throw Error('Invalid Studio module descriptor');
  if(definitions.has(module.id))throw Error('Duplicate Studio module: '+module.id);
  if(module.requires!==undefined&&!Array.isArray(module.requires))throw Error('Invalid module dependencies: '+module.id);
  const requires=module.requires===undefined?[]:[...module.requires];
  if(requires.some(id=>!validId(id))||new Set(requires).size!==requires.length)throw Error('Invalid module dependencies: '+module.id);
  definitions.set(module.id,Object.freeze({...module,requires:Object.freeze(requires)}));return module.id;
 }
 function order(ids){
  const result=[],visiting=new Set(),visited=new Set();
  function visit(id){if(visited.has(id))return;if(visiting.has(id))throw Error('Cyclic Studio module dependency: '+id);const module=definitions.get(id);if(!module)throw Error('Missing Studio module: '+id);visiting.add(id);module.requires.forEach(visit);visiting.delete(id);visited.add(id);result.push(id);}
  ids.forEach(visit);return result;
 }
 const dispose=async id=>{const instance=active.get(id);try{await instance?.dispose?.();}finally{active.delete(id);}};
 function start(ids=[...definitions.keys()]){return serial(async()=>{
  const sorted=order(ids),added=[];
  try{for(const id of sorted){if(active.has(id))continue;const module=definitions.get(id),dependencies=Object.freeze(Object.fromEntries(module.requires.map(key=>[key,active.get(key)])));const instance=await module.mount(environment,dependencies);if(instance?.dispose!==undefined&&typeof instance.dispose!=='function')throw Error('Invalid disposer: '+id);active.set(id,instance||Object.freeze({}));added.push(id);}return [...active.keys()];}
  catch(error){const failures=[];for(const id of added.reverse())try{await dispose(id);}catch(e){failures.push(e);}if(failures.length)throw new AggregateError([error,...failures],'Module startup failed; cleanup also reported errors');throw error;}
 });}
 function stop(id){return serial(async()=>{if(!active.has(id))return;for(const key of active.keys())if(key!==id&&definitions.get(key).requires.includes(id))throw Error('Module '+id+' is required by '+key);await dispose(id);});}
 function stopAll(){return serial(async()=>{const failures=[];for(const id of [...active.keys()].reverse())try{await dispose(id);}catch(error){failures.push(error);}if(failures.length)throw new AggregateError(failures,'Module cleanup failed');});}
 return Object.freeze({register,start,stop,stopAll,get:id=>active.get(id),list:()=>[...definitions.values()].map(({id,version,requires})=>({id,version,requires:[...requires],active:active.has(id)}))});
}
