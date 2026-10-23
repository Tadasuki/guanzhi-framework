import {siteContent} from '../dist/content.js';
import {readFile,writeFile} from 'node:fs/promises';
const strings=[];
function visit(value){if(typeof value==='string')strings.push(value);else if(Array.isArray(value))value.forEach(visit);else if(value&&typeof value==='object')Object.values(value).forEach(visit);}
visit(siteContent);
for(const name of ['app','practice','assistant','cloud','learning','navigation'])strings.push(await readFile(`dist/${name}.js`,'utf8'));
await writeFile('.local/font-check/corpus.txt',strings.join('\n'));
