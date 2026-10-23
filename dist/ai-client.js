import { cloudHeaders } from './cloud.js';
import { aiRequestHeaders, readAiConfig } from './ai-config.js';
async function request(path,body) {
  const auth=await cloudHeaders();
  const configured=readAiConfig();
  let response;
  try {response=await fetch(`/api/${path}`,{method:'POST',headers:{'Content-Type':'application/json',...auth,...aiRequestHeaders(configured)},body:JSON.stringify({...body,aiProvider:configured.provider,aiModel:configured.model}),signal:AbortSignal.timeout(90000)});} catch {throw Error('连接超时，作答已保留，请重试。');}
  let data;
  try {data=await response.json();} catch {throw Error('请通过本站 Node 服务启动，智能批改需要后台连接。');}
  if(!response.ok)throw Error(data.error||'服务暂时不可用，请重试。');
  return data;
}
export const gradeSubjective = (questionId,answer,sessionId)=>request('grade',{questionId,answer,sessionId});
export const askAssistant = (message,history,questionId)=>request('chat',{message,history,questionId});
