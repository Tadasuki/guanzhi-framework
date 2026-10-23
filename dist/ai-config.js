export const aiProviders = [
  { id: 'openai', label: 'OpenAI', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
  { id: 'deepseek', label: 'DeepSeek', baseUrl: 'https://api.deepseek.com/v1', model: 'deepseek-chat' },
  { id: 'zhipu', label: '智谱 GLM', baseUrl: 'https://open.bigmodel.cn/api/paas/v4', model: 'glm-4-flash' },
  { id: 'minimax', label: 'MiniMax', baseUrl: 'https://api.minimax.chat/v1', model: 'MiniMax-Text-01' },
  { id: 'custom', label: '自定义服务', baseUrl: '', model: '' },
];

export function sanitizeAiConfig(value = {}) {
  const provider = aiProviders.some(item => item.id === value?.provider) ? value.provider : 'openai';
  const preset = aiProviders.find(item => item.id === provider) || aiProviders[0];
  return {
    provider,
    apiKey: typeof value?.apiKey === 'string' ? value.apiKey : '',
    baseUrl: typeof value?.baseUrl === 'string' ? value.baseUrl : preset.baseUrl,
    model: typeof value?.model === 'string' ? value.model : preset.model,
    enabled: value?.enabled === true,
  };
}

export function readAiConfig(storage = globalThis.localStorage) {
  try { return sanitizeAiConfig(JSON.parse(storage.getItem('guanzhi:ai-config') || '{}')); } catch { return sanitizeAiConfig(); }
}

export function writeAiConfig(config, storage = globalThis.localStorage) {
  const next = sanitizeAiConfig(config);
  try { storage.setItem('guanzhi:ai-config', JSON.stringify(next)); } catch {}
  return next;
}

export function aiRequestHeaders(config = readAiConfig()) {
  const headers = { 'X-Guanzhi-AI-Provider': config.provider, 'X-Guanzhi-AI-Model': config.model };
  if (config.baseUrl) headers['X-Guanzhi-AI-Base-URL'] = config.baseUrl;
  if (config.apiKey) headers.Authorization = `Bearer ${config.apiKey}`;
  return headers;
}

