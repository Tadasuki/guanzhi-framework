// Per-record clocks preserve independent answers when a device reconnects.
let token='',device='',cursor=0,clock=0,records=new Map(),base='',ready=null,inflight=null,timer=null;
const state={available:false,ready:false,lastSynced:0,error:'',pending:0};
const read=(storage,key,fallback=null)=>{try{return JSON.parse(storage.getItem(key)||'null')??fallback;}catch{return fallback;}};
const write=(storage,key,value)=>{try{storage.setItem(key,JSON.stringify(value));}catch{}};
const initialPresence=typeof window!=='undefined'&&typeof window.addEventListener==='function'?{learning:localStorage.getItem('guanzhi:learning')!==null,reading:localStorage.getItem('guanzhi:reading')!==null}:{learning:false,reading:false};
const validToken=value=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
let database,wired=false;
async function idb() {
  if(database)return database;
  database=await new Promise((resolve,reject)=>{const request=indexedDB.open('guanzhi-backup',1);request.onupgradeneeded=()=>request.result.createObjectStore('kv');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});return database;
}
async function stored(key,value) {
  try{const db=await idb();return await new Promise((resolve,reject)=>{const transaction=db.transaction('kv',value===undefined?'readonly':'readwrite'),store=transaction.objectStore('kv'),request=value===undefined?store.get(key):store.put(value,key);let result;request.onsuccess=()=>{result=request.result;};transaction.oncomplete=()=>resolve(result);transaction.onerror=()=>reject(transaction.error);});}catch{return undefined;}
}
function status() {
  state.pending=[...records.values()].filter(r=>r.pending).length;
  const label=!state.available?'云端暂未连接，记录保存在本机':state.error?'连接中断，记录已保留，联网后自动重试':state.pending||state.dirty?'正在备份最新作答…':state.lastSynced?`已备份 · ${new Date(state.lastSynced).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'})}`:'正在连接云端…';
  document.querySelectorAll('[data-cloud-status]').forEach(node=>{node.textContent=label;});
}
async function persist() {
  const value={token,device,cursor,clock,records:[...records.values()]};
  write(localStorage,'guanzhi:cloud-snapshot',value);await stored('snapshot',value);
}
const nextClock=()=>clock=Math.max(Date.now(),clock+1);
export function mergeRecord(a,b) {
  if(!a)return b;
  return b.clock>a.clock||b.clock===a.clock&&b.device>a.device?b:a;
}
function put(key,value) {
  const old=records.get(key);if(old&&JSON.stringify(old.value)===JSON.stringify(value))return;
  records.set(key,{key,value,clock:nextClock(),device,pending:true});
}
function currentSnapshot() {
  const snapshot=new Map();
  const learning=read(localStorage,'guanzhi:learning',{});
  for(const id of learning.favorites||[])snapshot.set(`favorite:${id}`,true);
  for(const item of learning.mistakes||[])snapshot.set(`mistake:${item.questionId}`,item);
  for(const [key,value] of Object.entries(read(localStorage,'guanzhi:reading',{})))snapshot.set(`preference:${key}`,value);
  const session=read(sessionStorage,'guanzhi:practice')||read(localStorage,'guanzhi:practice');
  if(session?.id&&Array.isArray(session.ids)&&session.responses){
    snapshot.set('practice-current',session.id);
    const {responses,...meta}=session;snapshot.set(`session:${session.id}`,meta);
    for(const [id,response] of Object.entries(responses))snapshot.set(`response:${session.id}:${id}`,response);
  }
  for(const storage of [localStorage,sessionStorage])for(let i=0;i<storage.length;i++){
    const key=storage.key(i);if(key==='guanzhi:chat'||key?.startsWith('guanzhi:chat:'))snapshot.set(`chat:${key.slice('guanzhi:chat'.length)||'main'}`,read(storage,key,[]));
  }
  return snapshot;
}
function capture(initial=false) {
  if(!state.ready)return;
  const local=currentSnapshot();
  for(const [key,value] of local)if(!initial||!key.startsWith('preference:')||initialPresence.reading)put(key,value);
  for(const [key,record] of records)if((!initial||initialPresence.learning)&&localStorage.getItem('guanzhi:learning')!==null&&(key.startsWith('favorite:')||key.startsWith('mistake:'))&&!local.has(key)&&record.value!==null&&record.value!==false)put(key,key.startsWith('favorite:')?false:null);
  status();void persist();
}
function sessionFor(id) {
  const meta=records.get(`session:${id}`)?.value;if(!meta)return null;
  const responses={};for(const [key,r] of records)if(key.startsWith(`response:${id}:`)&&r.value)responses[key.slice(`response:${id}:`.length)]=r.value;
  return {...meta,responses};
}
function apply() {
  const favorites=[],mistakes=[],preferences={...read(localStorage,'guanzhi:reading',{})};
  for(const [key,r] of records){
    if(key.startsWith('favorite:')&&r.value===true)favorites.push(key.slice(9));
    if(key.startsWith('mistake:')&&r.value)mistakes.push(r.value);
    if(key.startsWith('preference:'))preferences[key.slice(11)]=r.value;
    if(key.startsWith('chat:')){const name=key==='chat:main'?'guanzhi:chat':`guanzhi:chat${key.slice(5)}`;write(localStorage,name,r.value);write(sessionStorage,name,r.value);}
  }
  write(localStorage,'guanzhi:learning',{favorites,mistakes});write(localStorage,'guanzhi:reading',preferences);
  const current=sessionFor(records.get('practice-current')?.value);
  if(current){write(localStorage,'guanzhi:practice',current);write(sessionStorage,'guanzhi:practice',current);}
  window.dispatchEvent(new CustomEvent('guanzhi:cloud-update'));
}
async function request(path,body,options={}) {
  const response=await fetch(`${base}/api/${path}`,{method:body===undefined?'GET':'POST',headers:{...(body!==undefined?{'Content-Type':'application/json'}:{}),...(token?{Authorization:`Bearer ${token}`}:{})},body:body===undefined?undefined:JSON.stringify(body),credentials:base?'omit':'same-origin',signal:AbortSignal.timeout(20000),...options});
  let data;try{data=await response.json();}catch{throw Error('云端连接暂时不可用。');}
  if(!response.ok)throw Error(data.error||'云端连接失败。');return data;
}
function fingerprint() {
  return {agent:navigator.userAgent,platform:navigator.userAgentData?.platform||navigator.platform,model:navigator.userAgentData?.model||'',languages:navigator.languages,timeZone:Intl.DateTimeFormat().resolvedOptions().timeZone,touch:navigator.maxTouchPoints,cores:navigator.hardwareConcurrency,memory:navigator.deviceMemory||null,screen:[screen.width,screen.height,screen.colorDepth]};
}
function mergeLocalChanges(before) {
  const after=currentSnapshot();let changed=false;
  for(const key of new Set([...before.keys(),...after.keys()]))if(JSON.stringify(before.get(key))!==JSON.stringify(after.get(key))){
    if(after.has(key))put(key,after.get(key));
    else if(key.startsWith('favorite:')||key.startsWith('mistake:'))put(key,key.startsWith('favorite:')?false:null);
    changed=true;
  }
  return changed;
}
async function exchange(publish=true) {
  const baseline=publish?currentSnapshot():null;
  let more=true,rounds=0,changed=false;
  do {
    const pending=[...records.values()].filter(r=>r.pending),batch=[];let size=0;
    for(const item of pending){const length=new TextEncoder().encode(JSON.stringify(item)).length;if(batch.length>=15||size+length>700000)break;batch.push(item);size+=length;}
    const result=await request('sync',{records:batch.map(({pending,...r})=>r),cursor});
    for(const sent of batch){const current=records.get(sent.key);if(current?.clock===sent.clock&&current.device===sent.device)current.pending=false;}
    for(const remote of result.records||[]){
      clock=Math.max(clock,remote.clock);
      const old=records.get(remote.key),winner=mergeRecord(old,remote);
      if(winner!==old){records.set(remote.key,{...remote,pending:false});if(!old||JSON.stringify(old.value)!==JSON.stringify(remote.value))changed=true;}
    }
    cursor=result.cursor;state.lastSynced=result.savedAt;more=result.more||[...records.values()].some(r=>r.pending);
    await persist();
  }while(more&&++rounds<100);
  if(publish){const edited=mergeLocalChanges(baseline);if(changed||edited)apply();await persist();if(edited)queueCloudBackup();}
}
async function initialize() {
  const transfer=new URLSearchParams(location.hash.split('?')[1]).get('device-transfer')==='1';
  const baseline=currentSnapshot(),legacy=transfer?new Map():new Map(baseline);
  if(!initialPresence.reading)for(const key of legacy.keys())if(key.startsWith('preference:'))legacy.delete(key);
  try {
    const localStatus=await fetch('/api/status').then(r=>r.json());
    if(!localStatus.cloud){const config=await fetch('/api/cloud-config').then(r=>r.json());if(!config.url)return;const url=new URL(config.url);if(url.protocol!=='https:')return;base=url.origin;}
    state.available=true;status();
    const disk=await stored('snapshot');
    token=transfer?'':read(localStorage,'guanzhi:device-token')||disk?.token||'';if(!validToken(token))token='';
    const identity=await request('identity',{fingerprint:fingerprint()});token=identity.token;
    if(transfer){clearUserState();}
    write(localStorage,'guanzhi:device-token',token);
    const saved=transfer?null:read(localStorage,'guanzhi:cloud-snapshot')||disk;
    if(saved?.token===token&&Array.isArray(saved.records)) {records=new Map(saved.records.map(r=>[r.key,r]));cursor=saved.cursor||0;clock=saved.clock||0;device=saved.device||crypto.randomUUID();}
    else {records=new Map();cursor=0;device=crypto.randomUUID();}
    state.ready=true;
    if(saved?.token===token)capture(true);
    await exchange(false);
    for(const [key,value] of legacy)if(!records.has(key))put(key,value);
    if(!transfer)mergeLocalChanges(baseline);apply();await persist();await exchange();
    if(transfer)history.replaceState(null,'',location.pathname+'#/home');
    state.error='';
  }catch(error){state.error=error.message;}finally{status();}
}
export function startCloudSync() {
  if(!wired){wired=true;window.addEventListener('online',()=>void syncCloud());window.addEventListener('focus',()=>void syncCloud());document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')void syncCloud();});window.addEventListener('pagehide',()=>{if(!state.ready)return;capture();const batch=[...records.values()].filter(r=>r.pending).slice(0,5);const body=JSON.stringify({records:batch.map(({pending,...r})=>r),cursor});if(new TextEncoder().encode(body).length<60000)void fetch(`${base}/api/sync`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body,keepalive:true,credentials:base?'omit':'same-origin'}).catch(()=>{});});setInterval(()=>{if(document.visibilityState==='visible')void syncCloud();},30000);}
  if(!ready)ready=initialize();
  return ready;
}
export function queueCloudBackup() {
  if(typeof window==='undefined'||typeof window.addEventListener!=='function')return;
  state.dirty=true;status();
  clearTimeout(timer);timer=setTimeout(()=>void syncCloud(),1500);
}
export async function syncCloud() {
  await startCloudSync();if(!state.ready){ready=null;await startCloudSync();if(!state.ready)return false;}
  if(inflight)return inflight;capture();
  inflight=(async()=>{try{await exchange();state.error='';state.dirty=false;return true;}catch(error){state.error=error.message;return false;}finally{inflight=null;status();}})();return inflight;
}
export async function cloudHeaders() {await startCloudSync();return token&&!base?{Authorization:`Bearer ${token}`}:{ };}
export const cloudInfo=()=>({...state,remote:Boolean(base),history:[...records.values()].filter(r=>r.key.startsWith('session:')&&r.value).sort((a,b)=>b.clock-a.clock).slice(0,15).map(r=>({id:r.value.id,title:r.value.title,submitted:r.value.submitted}))});
export async function copyRecovery() {await startCloudSync();if(!token)throw Error('连接云端后即可生成恢复码。');await navigator.clipboard.writeText(`ZY-${token}`);}
function clearUserState() {
  for(const storage of [localStorage,sessionStorage])for(const key of Object.keys(storage))if(key==='guanzhi:practice'||key==='guanzhi:learning'||key==='guanzhi:reading'||key==='guanzhi:chat'||key.startsWith('guanzhi:chat:'))storage.removeItem(key);
}
export async function restoreRecovery(code) {
  await startCloudSync();const next=String(code).trim().replace(/^ZY-/i,'').toLowerCase();if(!validToken(next))throw Error('请输入完整的 ZY- 恢复码。');
  if(!await syncCloud())throw Error('请先完成本机数据备份，再切换恢复码。');
  const previous={token,records,cursor,clock,device};token=next;
  try{
    await request('identity',{recover:true,fingerprint:fingerprint()});
    records=new Map();cursor=0;clock=0;device=crypto.randomUUID();
    await exchange(false);
  }catch(error){({token,records,cursor,clock,device}=previous);await persist();throw error;}
  write(localStorage,'guanzhi:device-token',token);
  clearUserState();
  apply();await persist();status();
}
export async function resumeCloudSession(id) {
  const session=sessionFor(id);if(!session)throw Error('这份答卷暂不可用。');
  write(localStorage,'guanzhi:practice',session);write(sessionStorage,'guanzhi:practice',session);put('practice-current',id);apply();await persist();queueCloudBackup();
}
export async function openPublishedSite() {
  if(!base)throw Error('当前已在线上网站。');
  if(!await syncCloud())throw Error('请等待备份完成后重试。');
  const form=document.createElement('form');form.method='POST';form.action=`${base}/api/transfer`;
  const input=document.createElement('input');input.type='hidden';input.name='deviceToken';input.value=token;form.append(input);document.body.append(form);form.submit();
}
