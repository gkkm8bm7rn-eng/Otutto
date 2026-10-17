import { readFile, readdir, access } from 'node:fs/promises';
import { resolve, dirname, extname } from 'node:path';
const root=resolve(import.meta.dirname,'..','dist');
async function files(dir){const entries=await readdir(dir,{withFileTypes:true});return (await Promise.all(entries.map(e=>e.isDirectory()?files(resolve(dir,e.name)):[resolve(dir,e.name)]))).flat();}
const htmls=(await files(root)).filter(f=>extname(f)==='.html');
const errors=[];
for(const file of htmls){
 const html=await readFile(file,'utf8');
 const name=file.slice(root.length+1);
 if((html.match(/<h1[ >]/g)||[]).length!==1) errors.push(`${name}: expected one H1`);
 if(!/<html lang="ru"/.test(html)||!/<title>[^<]+<\/title>/.test(html)||!/<meta name="description" content="[^"]+"/.test(html)) errors.push(`${name}: missing SEO/language`);
 if(/tel:|\+7[\s(\d]|915.?268|980.?177|Кубатура|секция 3А/i.test(html)) errors.push(`${name}: excluded contact information`);
 for(const match of html.matchAll(/(?:href|src)="([^"#]+)(#[^"]*)?"/g)){
  const raw=match[1];if(/^(https?:|data:|mailto:)/.test(raw))continue;
  let target=resolve(dirname(file),decodeURIComponent(raw));
  if(raw.endsWith('/'))target=resolve(target,'index.html');
  try{await access(target);}catch{errors.push(`${name}: broken local path ${raw}`);}
 }
 for(const block of html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g))try{JSON.parse(block[1]);}catch{errors.push(`${name}: invalid structured data`);}
}
if(htmls.length!==23)errors.push(`Expected 22 pages and 404, found ${htmls.length}`);
if(errors.length){console.error(errors.join('\n'));process.exit(1);}
console.log(`PASS: ${htmls.length} HTML files; local links/assets, SEO, structured data and excluded contacts.`);
