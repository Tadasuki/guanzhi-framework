import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { siteContent, questionTypes } from '../dist/content.js';
const bookIds = new Set();
const chapterBook = new Map();
for (const book of siteContent.textbooks) {
  assert(!bookIds.has(book.id), `教材 ID 重复：${book.id}`); bookIds.add(book.id);
  for (const chapter of book.chapters) {
    assert(!chapterBook.has(chapter.id), `章节 ID 重复：${chapter.id}`); chapterBook.set(chapter.id, book.id);
  }
}
const questionIds = new Set();
for (const question of siteContent.questions) {
  assert(!questionIds.has(question.id), `题目 ID 重复：${question.id}`); questionIds.add(question.id);
  assert(['past', 'mock'].includes(question.source), `题目来源无效：${question.id}`);
  assert(questionTypes.some(type => type.id === question.type), `题型无效：${question.id}`);
  if (question.score !== undefined) assert(Number.isFinite(question.score) && question.score > 0, `题目分值无效：${question.id}`);
  if (question.grading?.points?.length) {
    const points = question.grading.points;
    assert(points.every(point => Number.isFinite(point.score) && point.score > 0 && Array.isArray(point.keywords) && point.keywords.some(word => typeof word === 'string' && word.trim())), `评分要点不完整：${question.id}`);
    assert(Math.round(points.reduce((sum, point) => sum + point.score, 0) * 100) === Math.round(question.score * 100), `评分要点与满分不一致：${question.id}`);
  }
  if (question.demo) assert(question.source === 'mock', `示范题不得进入真题：${question.id}`);
  if (!question.demo && (question.textbookId || question.chapterId)) assert(chapterBook.get(question.chapterId) === question.textbookId, `题目教材与章节不匹配：${question.id}`);
  if (question.source === 'past') assert(siteContent.papers.some(paper => paper.id === question.paperId && paper.year === question.year && paper.examCode === question.examCode), `真题试卷关联不匹配：${question.id}`);
}
for (const file of ['navigation.js', 'cloud.js', 'ai-config.js', 'ai-client.js', 'assistant.js', 'index.html', 'app.js', 'content.js', 'illustrations.js', 'learning.js', 'practice.js', 'judgment.js', 'scoring.js', 'chapter-index.js', 'chapter-links.js', 'styles.css', 'fonts.css', 'fonts-web.css', 'refinements.css', 'themes.css', 'practice-layout.css', 'assets/favicon.svg']) {
  await access(new URL(`../dist/${file}`, import.meta.url));
}
assert((await readFile(new URL('../dist/index.html', import.meta.url), 'utf8')).includes('lang="zh-CN"'));
assert.equal(siteContent.textbooks.length, 0, '框架不能内置教材');
assert.equal(siteContent.questions.length, 0, '框架不能内置题目');
assert.equal(siteContent.papers.length, 0, '框架不能内置试卷');
assert.deepEqual(questionTypes.map(type => type.id), ['term', 'short', 'case', 'essay', 'single', 'multiple', 'judge', 'choice']);
console.log('内容关联与静态入口检查通过。');
