import { queueCloudBackup } from './cloud.js';
import { askAssistant } from './ai-client.js';

export function createAssistant({icon,text,escape,content}) {
  const chats=new Map();
  let floatingId='',returnFocus=null;
  function chatFor(id='') {
    if(chats.has(id))return chats.get(id);
    const chat={turns:[],draft:'',busy:false,error:'',contextualId:''};
    try{chat.turns=JSON.parse(sessionStorage.getItem(id?`guanzhi:chat:${id}`:'guanzhi:chat')||localStorage.getItem(id?`guanzhi:chat:${id}`:'guanzhi:chat')||'[]').filter(t=>['user','assistant'].includes(t.role)&&typeof t.content==='string').slice(-12);}catch{}
    chats.set(id,chat);return chat;
  }
  const questionFor=id=>content.questions.find(q=>q.id===id);
  function conversation(chat,compact=false) {
    return `${chat.turns.length ? chat.turns.map(t=>`<article class="chat-turn ${t.role}"><span class="content-label">${t.role==='user'?'你':'观知 · 云助手'}</span><div class="reading-text">${text(t.content)}</div>${t.sources?.length?`<div class="chat-sources"><span>参考题目</span>${t.sources.map(s=>`<a href="#/${s.source}?question=${encodeURIComponent(s.id)}">${escape(s.title)}${icon('arrow')}</a>`).join('')}</div>`:''}</article>`).join('') : compact ? '<div class="assistant-float-welcome"><p>围绕这道题，聊聊你的疑问。</p><span>可以问概念辨析、答题思路或遗漏要点。</span></div>' : `<div class="assistant-intro"><div class="assistant-emblem">${icon('book')}<span>✦</span></div><h2>从一个疑问，读懂一个知识点。</h2><p>围绕已接入的教材、章节与题目提问</p><p>回答优先依据本站已收录资料，并保留内容出处。</p></div>`}${chat.busy?'<p class="chat-progress" role="status">正在查阅相关资料…</p>':''}${chat.error?`<p class="chat-error" role="alert">${escape(chat.error)}</p>`:''}`;
  }
  function composer(chat,id='') {
    const inputId=id?'assistant-float-message':'assistant-message';
    return `<div class="assistant-composer"><label for="${inputId}" class="content-label">${id?'问问本题':'学习提问'}</label><textarea id="${inputId}" maxlength="1500" placeholder="${id?'关于这道题，你想理解什么？':'例如：请解释这个知识点的核心概念。'}" rows="${id?2:3}" ${chat.busy?'readonly':''}>${escape(chat.draft)}</textarea><div class="assistant-composer-actions"><span>${id?'依据本站资料解答':'发送后由已配置的 AI 服务解答'}</span><button class="button primary" data-ai-send ${id?'data-ai-floating':''} ${chat.busy?'disabled':''}>${chat.busy?'正在回答…':'发送问题'}${icon('arrow')}</button></div></div>`;
  }
  function render() {
    const chat=chatFor();
    const id=new URLSearchParams(location.hash.split('?')[1]).get('question');
    const q=questionFor(id);
    if(q && id!==chat.contextualId){chat.draft=`请讲解这道题的核心要点与答题思路：${q.title}`;chat.contextualId=id;}
    return `<div class="page assistant-page"><div class="page-heading"><div><div class="eyebrow">STUDY ASSISTANT</div><h1>云助手</h1><p>围绕本站教材、章节和题目，理解概念，梳理答题思路。</p></div><span class="page-badge">可配置</span></div><div class="assistant-panel"><div class="assistant-conversation" aria-live="polite">${conversation(chat)}</div>${composer(chat)}</div></div>`;
  }
  function floatRoot() { return document.getElementById('assistant-float-root'); }
  function renderFloat() {
    const root=floatRoot();if(!root||!floatingId)return;
    const question=questionFor(floatingId),chat=chatFor(floatingId);
    root.innerHTML=`<section class="assistant-float" role="dialog" aria-modal="false" aria-labelledby="assistant-float-title"><header class="assistant-float-header"><div>${icon('assistant')}<h2 id="assistant-float-title">本题云助手</h2><span>已配置</span></div><button class="assistant-float-close" data-ai-close aria-label="关闭云助手">${icon('close')}</button></header><div class="assistant-float-context"><span class="content-label">正在讨论</span><p>${text(question.title)}</p></div><div class="assistant-float-messages" aria-live="polite" aria-label="本题对话记录">${conversation(chat,true)}</div>${composer(chat,floatingId)}</section>`;
    const messages=root.querySelector('.assistant-float-messages');messages.scrollTop=messages.scrollHeight;
  }
  function open(id,trigger) {
    if(!questionFor(id))return;
    returnFocus=trigger;floatingId=id;
    if(!floatRoot()){const root=document.createElement('div');root.id='assistant-float-root';document.getElementById('app').append(root);}
    const chat=chatFor(id);
    if(!chat.turns.length&&!chat.draft)chat.draft='请讲解这道题的核心要点与答题思路。';
    renderFloat();document.getElementById('assistant-float-message')?.focus({preventScroll:true});
  }
  function close(restoreFocus=true) {
    const id=floatingId;floatingId='';floatRoot()?.remove();
    if(restoreFocus){const trigger=returnFocus?.isConnected?returnFocus:document.querySelector(`[data-ai-open="${id}"]`);trigger?.focus({preventScroll:true});}
    returnFocus=null;
  }
  function refresh(id) {
    if(id){if(floatingId===id)renderFloat();}
    else if(location.hash.startsWith('#/assistant'))document.getElementById('main-content').innerHTML=render();
  }
  async function send(floating=false) {
    const id=floating?floatingId:'';if(floating&&!id)return;
    const chat=chatFor(id);if(chat.busy)return;
    const input=document.getElementById(floating?'assistant-float-message':'assistant-message');if(!input)return;
    const message=input.value.trim();if(!message){input.focus();return;}
    const history=chat.turns.slice(-4).map(t=>({role:t.role,content:t.content}));
    chat.busy=true;chat.error='';chat.draft=message;refresh(id);
    try {
      const result=await askAssistant(message,history,id||chat.contextualId||undefined);
      chat.turns.push({role:'user',content:message},{role:'assistant',content:result.answer,sources:result.sources});chat.turns=chat.turns.slice(-12);chat.draft='';
      try{const key=id?`guanzhi:chat:${id}`:'guanzhi:chat';sessionStorage.setItem(key,JSON.stringify(chat.turns));localStorage.setItem(key,JSON.stringify(chat.turns));queueCloudBackup();}catch{}
    } catch(e){chat.error=e.message;} finally{chat.busy=false;refresh(id);}
  }
  return {render,send,open,close,isBusy:()=>[...chats.values()].some(chat=>chat.busy),refreshFromStorage:()=>{for(const [id,chat] of chats){if(chat.busy)continue;try{const key=id?`guanzhi:chat:${id}`:'guanzhi:chat';chat.turns=JSON.parse(sessionStorage.getItem(key)||localStorage.getItem(key)||'[]');}catch{}}},isOpen:()=>Boolean(floatingId),input:(value,floating=false)=>{chatFor(floating?floatingId:'').draft=value;}};
}
