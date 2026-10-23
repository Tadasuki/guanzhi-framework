// Keep a separate view for every browser-history entry, even when URLs repeat.
export function createNavigation({read}) {
  const storageKey='guanzhi:navigation:v1';
  let cache={entries:{},latest:{}},active=null,activeHash='',rendered=false,restoring=false,generation=0,intent=0,timer;
  try{const saved=JSON.parse(sessionStorage.getItem(storageKey)||'null');if(saved?.entries&&saved.latest)cache=saved;}catch{}
  history.scrollRestoration='manual';
  const route=hash=>hash.replace(/^#\//,'').split('?')[0]||'home';
  const keyFor=(element,index)=>element.dataset.questionId?`question:${element.dataset.questionId}`:element.dataset.paperId?`paper:${element.dataset.paperId}`:element.dataset.bookId?`book:${element.dataset.bookId}`:element.id?`id:${element.id}`:element.dataset.year?`year:${element.dataset.year}`:`detail:${index}`;
  const details=()=>[...document.querySelectorAll('#main-content details')];
  const anchors=()=>[...document.querySelectorAll('#main-content [data-question-id],#main-content .chapter,#main-content .page-heading')];
  const anchorKey=element=>element.dataset.questionId?`question:${element.dataset.questionId}`:element.id?`id:${element.id}`:'heading';
  function persist(){try{const ids=Object.keys(cache.entries);for(const id of ids.slice(0,Math.max(0,ids.length-80)))delete cache.entries[id];sessionStorage.setItem(storageKey,JSON.stringify(cache));}catch{}}
  function capture() {
    if(!active||!rendered||restoring)return;
    const top=Math.max(0,document.querySelector('.topbar')?.getBoundingClientRect().bottom||0);
    const candidates=anchors().filter(element=>{const rect=element.getBoundingClientRect();return rect.bottom>top&&rect.top<innerHeight;});
    const anchor=candidates.find(element=>element.hasAttribute('data-question-id'))||candidates[0];
    cache.entries[active]={...cache.entries[active],...read(),hash:activeHash,scrollY:window.scrollY,anchor:anchor?{key:anchorKey(anchor),top:anchor.getBoundingClientRect().top}:null,details:details().map((element,index)=>[keyFor(element,index),element.open])};
    cache.latest[route(activeHash)]=active;persist();
  }
  function enter() {
    capture();
    const previous=cache.entries[active],hash=location.hash||'#/home';
    let id=history.state?.guanzhiView;
    const fresh=!id||id===active&&hash!==activeHash;
    if(fresh){id=crypto.randomUUID();history.replaceState({...history.state,guanzhiView:id},'');}
    let saved=cache.entries[id];
    if(!saved&&fresh&&!hash.includes('?')){
      const last=cache.entries[cache.latest[route(hash)]];
      if(last)saved={...last,hash,returnTarget:null};
    }
    if(fresh){
      const from=previous&&['mock','past','favorites','mistakes'].includes(route(previous.hash));
      const returnTarget=route(hash)==='outline'?(from?{steps:1,label:route(previous.hash)==='mock'?'返回模拟库':route(previous.hash)==='past'?'返回真题库':route(previous.hash)==='favorites'?'返回题收藏':'返回错题集'}:route(activeHash)==='outline'&&previous?.returnTarget?{...previous.returnTarget,steps:previous.returnTarget.steps+1}:null):null;
      cache.entries[id]={...saved,hash,returnTarget};
      if(saved)saved=cache.entries[id];
    }
    active=id;activeHash=hash;rendered=false;generation++;
    return saved;
  }
  function restore(saved) {
    rendered=true;if(!saved){restoring=false;capture();return;}
    restoring=true;
    const open=new Map(saved.details||[]);details().forEach((element,index)=>{if(open.has(keyFor(element,index)))element.open=open.get(keyFor(element,index));});
    const current=generation,userIntent=intent;
    function place(){
      if(current!==generation||userIntent!==intent)return;
      const anchor=saved.anchor&&anchors().find(element=>anchorKey(element)===saved.anchor.key);
      const y=anchor?window.scrollY+anchor.getBoundingClientRect().top-saved.anchor.top:saved.scrollY;
      window.scrollTo({top:Math.max(0,Number(y)||0),behavior:'instant'});
    }
    requestAnimationFrame(()=>{place();requestAnimationFrame(()=>{place();restoring=false;capture();});});
    document.fonts?.ready.then(()=>{if(current===generation&&userIntent===intent){place();capture();}});
  }
  function schedule(){clearTimeout(timer);timer=setTimeout(capture,120);}
  window.addEventListener('scroll',schedule,{passive:true});
  for(const event of ['wheel','touchstart','pointerdown','keydown'])window.addEventListener(event,()=>{intent++;},{passive:true});
  document.addEventListener('toggle',schedule,true);
  document.addEventListener('change',schedule,true);
  document.addEventListener('input',schedule,true);
  document.addEventListener('click',event=>{if(event.target.closest('a[href^="#/"],[data-chapter],[data-open-book]'))capture();},true);
  window.addEventListener('pagehide',capture);
  return {enter,restore,capture,isCurrent:()=>activeHash===(location.hash||'#/home')&&active===history.state?.guanzhiView,returnTarget:()=>cache.entries[active]?.returnTarget,back:()=>{const steps=cache.entries[active]?.returnTarget?.steps;if(steps)history.go(-steps);}};
}
