import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const dist=path.resolve(import.meta.dirname,'../dist');
const files=fs.readdirSync(dist).filter(n=>n.endsWith('.js')).sort();
const sources=new Map(files.map(n=>[n,fs.readFileSync(path.join(dist,n),'utf8')]));
const digest=crypto.createHash('sha256').update([...sources].map(([n,s])=>n+'\n'+s).join('\n')).update(fs.existsSync(path.join(dist,'lab.css'))?fs.readFileSync(path.join(dist,'lab.css')):'').digest('hex').slice(0,12);
const names=new Map(files.map(n=>[n,n.replace(/\.js$/,'.'+digest+'.js')]));
const out=path.join(dist,'assets');fs.mkdirSync(out,{recursive:true});
for(const [name,source] of sources){
 const rewritten=source.replace(/(['"])\.\/([^'"]+)\1/g,(match,quote,target)=>{
  if(names.has(target))return quote+'./'+names.get(target)+quote;
  if(target.startsWith('vendor/'))return quote+'../'+target+quote;
  return match;
 });fs.writeFileSync(path.join(out,names.get(name)),rewritten);
}
const index=path.join(dist,'index.html');let html=fs.readFileSync(index,'utf8');
html=html.replace(/src="\.\/(?:assets\/)?app(?:\.[a-f0-9]+)?\.js(?:\?[^\"]*)?"/,`src="./assets/${names.get('app.js')}"`);
html=html.replace(/href="\.\/lab\.css(?:\?[^"]*)?"/,`href="./lab.css?v=${digest}"`);
fs.writeFileSync(index,html);console.log('Built versioned browser assets:',digest);
