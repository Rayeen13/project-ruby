export const AI_ENGINES=Object.freeze([
 {id:'ruby',name:'Ruby offline AI (llama.cpp)',base:'http://127.0.0.1:8081',note:'Download and run the verified compact AI inside Ruby.'},
 {id:'ollama',name:'Ollama · existing local server',base:'http://127.0.0.1:11434',note:'Run Ollama and install a model there, then Connect. Local port 11434.'},
 {id:'lmstudio',name:'LM Studio · existing local server',base:'http://127.0.0.1:1234',note:'Load a model and enable LM Studio’s local server, then Connect. Local port 1234.'},
 {id:'colibri',name:'Colibri · advanced local server',base:'http://127.0.0.1:8000',note:'Start your Colibri OpenAI-compatible server locally on port 8000. Large-model storage/hardware requirements still apply.'},
 {id:'vllm',name:'vLLM · advanced local server',base:'http://127.0.0.1:8000',note:'Start a compatible local server on port 8000. Ruby does not install vLLM, its GPU stack or its model.'},
 {id:'moeinfinity',name:'MoE-Infinity · advanced local server',base:'http://127.0.0.1:8000',note:'Start its OpenAI-compatible local server on port 8000. Requires your own compatible CUDA/model setup.'}
]);
export function engineFor(id){return AI_ENGINES.find(engine=>engine.id===id)||AI_ENGINES[0];}
