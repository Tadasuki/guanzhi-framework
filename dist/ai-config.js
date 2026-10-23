export const aiProviders = [
  { id: 'openai', label: 'OpenAI', baseUrl: 'https://api.openai.com/v1', models: ['gpt-4o-mini', 'gpt-4o'] },
  { id: 'deepseek', label: 'DeepSeek', baseUrl: 'https://api.deepseek.com', models: ['deepseek-chat', 'deepseek-reasoner'] },
  { id: 'zhipu', label: '智谱 GLM', baseUrl: 'https://open.bigmodel.cn/api/paas/v4', models: ['glm-4-flash', 'glm-4-plus'] },
  { id: 'minimax', label: 'MiniMax', baseUrl: 'https://api.minimax.chat/v1', models: ['MiniMax-Text-01', 'abab6.5s-chat'] },
  { id: 'custom', label: '自定义服务', baseUrl: '', models: [] },
];

export function providerFor(id) { return aiProviders.find(item => item.id === id) || aiProviders[0]; }

export function sanitizeAiConfig(value = {}) {
  const provider = aiProviders.some(item => item.id === value?.provider) ? value.provider : 'openai';
  const preset = providerFor(provider);
  const apiKey = typeof value?.apiKey === 'string' ? value.apiKey : '';
  const savedModels = apiKey.trim() && Array.isArray(value?.models) ? value.models.filter(model => typeof model === 'string' && model.trim()).slice(0, 100) : [];
  return {
    provider,
    apiKey,
    baseUrl: provider === 'custom' && typeof value?.baseUrl === 'string' ? value.baseUrl : preset.baseUrl,
    model: apiKey.trim() ? (typeof value?.model === 'string' ? value.model : (savedModels[0] || '')) : '',
    models: savedModels,
    enabled: value?.enabled !== false,
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

function modelsEndpoint(config) {
  const base = String(config.baseUrl || '').replace(/\/$/, '');
  return base ? `${base}/models` : '';
}

function normalizeModels(payload) {
  const list = Array.isArray(payload) ? payload : payload?.data || payload?.models || payload?.results || [];
  return [...new Set(list.map(item => typeof item === 'string' ? item : item?.id || item?.name).filter(model => typeof model === 'string' && model.trim()))].sort();
}

export async function fetchAvailableModels(config = readAiConfig()) {
  const endpoint = modelsEndpoint(config);
  if (!endpoint) throw new Error('请先填写自定义服务接口地址。');
  if (!config.apiKey) throw new Error('请先填写 API Key。');
  const response = await fetch(endpoint, { headers: { Accept: 'application/json', Authorization: `Bearer ${config.apiKey}` }, signal: AbortSignal.timeout(12000) });
  if (!response.ok) throw new Error(`模型列表请求失败（${response.status}）。`);
  const models = normalizeModels(await response.json());
  if (!models.length) throw new Error('服务未返回可用模型。');
  return models;
}

export async function testAiConnection(config = readAiConfig()) {
  const started = performance.now();
  const models = await fetchAvailableModels(config);
  return { models, latency: Math.max(0, Math.round(performance.now() - started)) };
}

