import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const dist=path.resolve(import.meta.dirname,'../dist');
const html=fs.readFileSync(path.join(dist,'index.html'),'utf8');
const entry=html.match(/src="\.\/(assets\/app\.[a-f0-9]+\.js)"/);
assert(entry,'index.html must reference a versioned app module');
const visited=new Set();
function check(file){
 if(visited.has(file))return;visited.add(file);
 assert(fs.existsSync(file),'Missing browser module: '+file);
 const source=fs.readFileSync(file,'utf8');
 for(const match of source.matchAll(/(?:from\s*|import\s*(?:\(\s*)?|new URL\(\s*)(['"])(\.[^'"]+)\1/g)){
  if(match[2].endsWith('.js'))check(path.resolve(path.dirname(file),match[2]));
 }
}
check(path.join(dist,entry[1]));
console.log(`PASS: ${visited.size} reachable browser modules exist.`);
