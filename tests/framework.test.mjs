import test from 'node:test';
import assert from 'node:assert/strict';
import { siteContent, questionTypes } from '../dist/content.js';
import { aiProviders, sanitizeAiConfig } from '../dist/ai-config.js';
import { sanitizePreferences, gradeQuestion } from '../dist/learning.js';

test('framework stays content-free and keeps the generic question contract', () => {
  assert.equal(siteContent.textbooks.length, 0);
  assert.equal(siteContent.questions.length, 0);
  assert.equal(siteContent.papers.length, 0);
  assert.deepEqual(questionTypes.map(item => item.id), ['term', 'short', 'case', 'essay', 'single', 'multiple', 'judge', 'choice']);
});

test('provider presets are generic and never contain a real key', () => {
  assert.deepEqual(aiProviders.map(item => item.id), ['openai', 'deepseek', 'zhipu', 'minimax', 'custom']);
  const config = sanitizeAiConfig({ provider: 'zhipu', apiKey: 'local-only', model: 'glm-test' });
  assert.equal(config.provider, 'zhipu');
  assert.equal(config.apiKey, 'local-only');
  assert.equal(sanitizeAiConfig({ provider: 'unknown' }).provider, 'openai');
});

test('framework defaults are quiet and objective scoring stays generic', () => {
  assert.deepEqual(sanitizePreferences({}), { fontSize: 'standard', expandChapters: false, theme: 'sage', appearance: 'light' });
  const question = { id: 'example', score: 5, correctAnswer: 'A' };
  assert.equal(gradeQuestion(question, 'A').score, 5);
  assert.equal(gradeQuestion(question, 'B').score, 0);
});

