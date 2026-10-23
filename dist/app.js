import { createNavigation } from './navigation.js';
import { startCloudSync,queueCloudBackup,syncCloud,cloudInfo,copyRecovery,restoreRecovery,resumeCloudSession,openPublishedSite } from './cloud.js';
import { gradeSubjective } from './ai-client.js';
import { createAssistant } from './assistant.js';
import { siteContent, questionTypes } from './content.js';
import { bookScene, outlineScene } from './illustrations.js';
import { themes, sanitizePreferences, sanitizeLearning, toggleFavorite, recordOutcome } from './learning.js';
import { createPractice } from './practice.js';
import { indexEntries } from './chapter-index.js';
import { referencesFor, chapterReferenceLabel, outlineHref, pastQuestionHref } from './chapter-links.js';
import { aiProviders, readAiConfig, writeAiConfig } from './ai-config.js';

const icons = {
  book: '<path d="M3 4c3-1 6 0 9 2 3-2 6-3 9-2v15c-3-1-6 0-9 2-3-2-6-3-9-2z"/><path d="M12 6v15"/>',
  favorite: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9z"/>',
  mistakes: '<path d="M6 3h9l4 4v14H6zM14 3v5h5m-9 4 5 5m0-5-5 5"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
  moon: '<path d="M20.5 14A9 9 0 0 1 10 3.5 9 9 0 1 0 20.5 14z"/>',
  system: '<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M12 17v4m-4 0h8"/>',
  home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><path d="M9 21v-8h6v8"/>',
  outline: '<circle cx="5" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="5" cy="12" r="2"/><path d="M5 7v3m0 4v3M11 5h9M11 12h6M11 19h9"/>',
  paper: '<path d="M6 3h9l4 4v14H6zM14 3v5h5M9 12h7M9 16h5"/>',
  pen: '<path d="m14 5 5 5M4 20l5-1L21 7a2 2 0 0 0-5-5L4 14zM4 20h15"/>',
  library: '<path d="M3 4h5v16H3zM10 4h4v16h-4zM16 5l4-1 3 15-4 1zM3 8h5M10 8h4"/>',
  assistant: '<rect x="4" y="5" width="16" height="14" rx="5"/><path d="M12 2v3M8 11h.01M16 11h.01M9 15h6M2 10v4M22 10v4"/>',
  settings: '<path d="M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1M5.6 18.4l2.1-2.1m8.6-8.6 2.1-2.1"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  sprout: '<path d="M12 21v-9C5 13 3 9 3 4c7 0 9 3 9 8 0-6 4-9 9-9 0 6-3 10-9 9"/>',
  line: '<path d="M5 5h14M5 12h14M5 19h9"/>',
  term: '<path d="M4 5h16M12 5v15M8 20h8M4 5v3M20 5v3"/>',
  case: '<rect x="3" y="6" width="18" height="15" rx="2"/><path d="M8 6V3h8v3M3 11h18M10 11v3h4v-3"/>',
  link: '<path d="m10 13 4-4M8 16l-1 1a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0m2 1 1-1a4 4 0 0 1 6 6l-4 4a4 4 0 0 1-6 0"/>',
  file: '<path d="M6 3h9l4 4v14H6zM14 3v5h5"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
  sidebar: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16m5-11-3 3 3 3"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  leaf: '<path d="M20 3C6 3 2 7 5 14s15 6 15-11ZM4 21 15 10"/>',
  expand: '<path d="m8 8-4-4m0 0v5m0-5h5m7 12 4 4m0 0v-5m0 5h-5"/>',
  collapse: '<path d="m4 4 5 5m0 0V4m0 5H4m16 11-5-5m0 0v5m0-5h5"/>',
};
const icon = (name, cls = '') => `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.book}</svg>`;
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const text = value => escape(value).replace(/\n/g, '<br>');
const safeUrl = value => {
  if (!value || typeof value !== 'string') return '';
  try { const url = new URL(value, location.href); return ['http:', 'https:'].includes(url.protocol) ? escape(url.href) : ''; } catch { return ''; }
};
const routes = [
  { id: 'home', label: '首页', icon: 'home', en: 'HOME' },
  { id: 'outline', label: '大纲', icon: 'outline', en: 'CHAPTER MAP' },
  { id: 'past', label: '真题库', icon: 'paper', en: 'PAST QUESTIONS' },
  { id: 'mock', label: '模拟库', icon: 'pen', en: 'PRACTICE COLLECTION' },
  { id: 'favorites', label: '题收藏', icon: 'favorite', en: 'SAVED QUESTIONS' },
  { id: 'mistakes', label: '错题集', icon: 'mistakes', en: 'LEARN FROM MISTAKES' },
  { id: 'library', label: '资料库', icon: 'library', en: 'RESOURCE LIBRARY' },
  { id: 'assistant', label: '云助手', icon: 'assistant', en: 'STUDY ASSISTANT' },
  { id: 'settings', label: '关于设置', icon: 'settings', en: 'ABOUT & PREFERENCES' },
  { id: 'demo', label: '模拟库', icon: 'pen', en: 'PRACTICE COLLECTION', hidden: true },
  { id: 'practice', label: '做题', icon: 'pen', en: 'FOCUS ON THE QUESTION', hidden: true },
];
let preferences = sanitizePreferences(readLocal('guanzhi:reading', {}));
let aiConfig = readAiConfig();
let sidebarCollapsed = readLocal('guanzhi:sidebar-collapsed', false) === true;
let learning = sanitizeLearning(readLocal('guanzhi:learning', {}));
let toastTimer;
function readLocal(key, fallback) { try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; } catch { return fallback; } }
function notify(message) {
  let toast = document.getElementById('site-toast');
  if (!toast) { toast = document.createElement('div'); toast.id = 'site-toast'; toast.className = 'site-toast'; toast.setAttribute('role','status'); document.body.append(toast); }
  toast.textContent = message; toast.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { toast.hidden = true; }, 4200);
}
function persistLearning() {
  queueCloudBackup();
  try { localStorage.setItem('guanzhi:learning', JSON.stringify(learning)); }
  catch { notify('当前浏览器无法保存记录，收藏与错题暂时仅在本次打开期间保留。'); }
}
function favoriteButton(question, withLabel = false) {
  const saved = learning.favorites.includes(question.id);
  return `<button class="question-favorite ${withLabel ? 'with-label' : ''} ${saved ? 'saved' : ''}" data-favorite="${escape(question.id)}" aria-pressed="${saved}" aria-label="${saved ? '取消收藏' : '收藏题目'}">${icon('favorite')}${withLabel ? `<span class="favorite-label">${saved ? '已收藏' : '收藏'}</span>` : ''}</button>`;
}
const assistant = createAssistant({icon,text,escape,content:siteContent});
const practice = createPractice({gradeSubjective,content:siteContent,icon,escape,text,reference:refLabel,referenceMarkup,favoriteButton,
  record:(id,answer,grade) => {learning=recordOutcome(learning,id,answer,grade);persistLearning();},
  navigate:route => {if(currentRoute===route) renderRoute();else location.hash=`/${route}`;},notify,
});
let filter = { type: 'all', query: '', book: 'all', year: 'all', exam: 'all', mockKind: 'all', paper: 'all', mode: 'questions' };
let libraryFilter = 'all';
let currentRoute = 'home';
let focusChapter = '';
const app = document.getElementById('app');
const navigation=createNavigation({read:()=>({filter:{...filter},libraryFilter})});

function savePreferences() {
  queueCloudBackup();
  document.documentElement.dataset.readingSize = preferences.fontSize;
  document.documentElement.dataset.theme = preferences.theme;
  document.documentElement.dataset.mode = preferences.appearance === 'system' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : preferences.appearance;
  const theme = themes.find(theme => theme.id === preferences.theme);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', document.documentElement.dataset.mode === 'dark' ? '#171d1a' : theme.color);
  try { localStorage.setItem('guanzhi:reading', JSON.stringify(preferences)); } catch {}
}
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>{if(preferences.appearance==='system')savePreferences();});
function syncSidebar() {
  const collapsed = sidebarCollapsed && window.matchMedia('(min-width: 761px)').matches;
  document.body.classList.toggle('sidebar-collapsed', collapsed);
  const toggle = document.querySelector('[data-sidebar-toggle]');
  if (toggle) {
    toggle.setAttribute('aria-expanded', String(!collapsed));
    toggle.setAttribute('aria-label', collapsed ? '展开侧边栏' : '收起侧边栏');
    toggle.title = collapsed ? '展开侧边栏' : '收起侧边栏';
  }
}
function shell() {
  app.innerHTML = `<div class="app-shell">
    <button class="sidebar-backdrop" aria-label="关闭导航" tabindex="-1"></button>
    <aside class="sidebar" id="site-navigation" aria-label="主导航">
      <button class="icon-button sidebar-close" aria-label="关闭导航">${icon('close')}</button>
      <a href="#/home" class="brand" aria-label="${escape(siteContent.name)}首页"><span class="brand-symbol">${icon('book')}</span><span><strong>${escape(siteContent.name)}</strong><small>STUDY SPACE</small></span></a>
      <div class="sidebar-label">学习空间</div>
      <nav>${routes.filter(route => !route.hidden).map(route => `${route.id === 'settings' ? '<div class="nav-divider"></div>' : ''}<a class="nav-item" href="#/${route.id}" data-nav="${route.id}" aria-label="${route.label}" title="${route.label}">${icon(route.icon)}<span>${route.label}</span></a>`).join('')}</nav>
      <div class="sidebar-bottom"><div class="quiet-leaf">${icon('sprout')}</div><p>让注意力，<br>回到知识本身。</p><span>LESS, BUT DEEPER.</span></div>
    </aside>
    <div class="workspace"><header class="topbar"><div class="breadcrumb"><button class="icon-button mobile-menu" aria-label="打开导航" aria-expanded="false" aria-controls="site-navigation">${icon('menu')}</button><button class="sidebar-toggle icon-button" data-sidebar-toggle aria-label="收起侧边栏" title="收起侧边栏" aria-controls="site-navigation" aria-expanded="true">${icon('sidebar')}</button><span class="breadcrumb-root">学习空间</span>${icon('chevron')}<span id="breadcrumb-current">首页</span></div><div class="topbar-note"><span></span>以教材为本</div></header>
      <main id="main-content" tabindex="-1"></main>
      <footer class="site-footer"><span>${escape(siteContent.name)} <span class="footer-dot">·</span> 纯粹的学习空间</span><span>循着章节，读懂知识。</span></footer>
    </div>
  </div>`;
  savePreferences();
  syncSidebar();
}
function pageHeading(route, title, description, controls = '') {
  return `<div class="page-heading"><div><div class="eyebrow">${route.en}</div><h1>${title}</h1><p>${description}</p></div>${controls}</div>`;
}
function homePage() {
  const guides = [
    { id: 'outline', number: '01', title: '大纲', desc: '沿着教材目录，串起章节与考题。', tag: '建立知识脉络', icon: 'outline', color: 'green' },
    { id: 'past', number: '02', title: '真题库', desc: '回到历年真题，看知识如何被提问。', tag: '读懂考查方式', icon: 'paper', color: 'sand' },
    { id: 'mock', number: '03', title: '模拟库', desc: '围绕教材练习，让理解更进一步。', tag: '巩固所学知识', icon: 'pen', color: 'blue' },
    { id: 'library', number: '04', title: '资料库', desc: '参考教材与学习资料，在这里归档。', tag: '找到学习依据', icon: 'library', color: 'rose' },
  ];
  return `<div class="page home-page"><section class="home-hero"><div class="hero-copy"><div class="eyebrow"><span class="eyebrow-line"></span>A PLACE FOR KNOWLEDGE</div><h1>从一页书，<br>到一张<span class="highlight">知识地图</span>。</h1><p>以教材为起点，以章节为脉络。<br>让零散的知识连接起来，让学习回归内容本身。</p><div class="hero-actions"><a class="button primary" href="#/outline">探索学习大纲${icon('arrow')}</a><a class="text-link" href="#/library">浏览资料${icon('chevron')}</a></div></div><div class="hero-art">${bookScene}<span class="hero-art-caption"><span></span>每一份理解，都有迹可循</span></div></section>
    <section class="guide-section" aria-labelledby="guide-title"><div class="section-title"><div><h2 id="guide-title">学习，从这里开始</h2><p>选择一条路径，进入你的学习空间。</p></div><span class="section-index">EXPLORE / 01—04</span></div><div class="guide-grid">${guides.map(g => `<a href="#/${g.id}" class="guide-card ${g.color}"><div class="guide-card-top"><span class="guide-icon">${icon(g.icon)}</span><span class="guide-number">${g.number}</span></div><h3>${g.title}</h3><p>${g.desc}</p><div class="guide-card-bottom"><span>${g.tag}</span>${icon('arrow')}</div></a>`).join('')}</div></section>
    <div class="home-note"><span class="note-icon">${icon('book')}</span><div><strong>不离开教材，也不止于翻页。</strong><p>目录是线索，章节是节点，题目在知识中找到自己的位置。</p></div><div class="note-visual">${outlineScene}</div></div></div>`;
}
function cover(book, large = false) {
  const url = safeUrl(book.cover);
  return url ? `<img class="book-cover ${large ? 'large' : ''}" src="${url}" alt="${escape(book.title)}封面" loading="lazy" decoding="async">` : `<div class="book-cover cover-placeholder ${large ? 'large' : ''}" aria-label="教材封面待补充"><span class="cover-top">REFERENCE<br>TEXTBOOK</span><span class="cover-title">参考<br>教材</span><span class="cover-bottom">封面待补充</span><span class="cover-ring"></span></div>`;
}
function typeLabel(type) { return questionTypes.find(item => item.id === type)?.label || '题目'; }
function refLabel(question) {
  if(question.demo) return '自编示范题 · 不对应参考教材';
  const indexed = referencesFor(question);
  if (indexed.length) return indexed.map(chapterReferenceLabel).join('；');
  if (question.sourceFile) return `${question.sourceFile} · ${question.year} 年 ${question.examCode} · ${question.section} · 原第 ${question.originalNumber} 题${question.subject ? ' · ' + question.subject : ''}`;
  const reference = question.reference || {};
  const book = siteContent.textbooks.find(book => book.id === reference.textbookId) || siteContent.textbooks.find(book => book.id === question.textbookId);
  const pieces = [book?.title, reference.edition, reference.section, reference.page ? `第 ${reference.page} 页` : ''];
  return pieces.filter(Boolean).join(' · ');
}
function referenceMarkup(question) {
  const references = referencesFor(question);
  if (references.length) return `<div class="source-reference chapter-references">${icon('book')}<div><span class="reference-prefix">教材章节：</span>${references.map(reference => `<a class="chapter-reference-link" href="${escape(outlineHref(reference))}">${escape(chapterReferenceLabel(reference))}${icon('arrow')}</a>${reference.note ? `<small class="reference-note">${escape(reference.note)}</small>` : ''}`).join('')}</div></div>`;
  return `<div class="source-reference">${icon('book')}<span>${question.demo ? escape(refLabel(question)) : '章节索引未收录此题'}</span></div>`;
}
function questionCard(question, compact = false, previous = null) {
  const chapter = siteContent.textbooks.flatMap(book => book.chapters).find(c => c.id === question.chapterId);
  const reference = refLabel(question);
  return `<details class="question-card ${compact ? 'compact' : ''}" data-question-id="${escape(question.id)}"><summary><div class="question-main"><div class="question-meta"><span>${typeLabel(question.type)}</span>${question.source === 'mock' ? `<span class="demo-badge">${escape(question.paperLabel)}</span>` : ''}${question.year ? `<span>${escape(question.year)} 年</span>` : ''}${question.examCode ? `<span>${escape(question.examCode)} ${escape(question.examName)}</span>` : ''}${question.subject ? `<span>${escape(question.subject)}</span>` : ''}${!compact && chapter ? `<span>${escape(chapter.title)}</span>` : ''}</div><h3>${text(question.title)}</h3></div>${favoriteButton(question)}${icon('down', 'question-chevron')}</summary><div class="question-answer">${previous ? `<div class="previous-answer"><span class="content-label">上次作答 · ${escape(previous.method || '参考评分')}</span><div class="reading-text">${previous.answer ? text(Array.isArray(previous.answer) ? previous.answer.join('、') : previous.answer) : '<span class="muted">未作答</span>'}</div></div>` : ''}<span class="content-label">参考答案</span><div class="reading-text">${question.answer ? text(question.answer) : '<span class="muted">参考答案待补充</span>'}</div>${question.notes ? `<p class="source-note reading-text">${text(question.notes)}</p>` : ''}${question.explanation ? `<div class="answer-explanation"><span class="content-label">解析</span><p class="reading-text">${text(question.explanation)}</p></div>` : ''}${question.scoringGuide ? `<div class="scoring-guide"><span class="content-label">评分要点</span><p class="reading-text">${text(question.scoringGuide)}</p></div>` : ''}${referenceMarkup(question)}<div class="question-actions"><button class="text-link" data-start-question="${escape(question.id)}">做这道题${icon('pen')}</button>${!compact && chapter ? `<button class="text-link question-chapter-link" data-chapter="${escape(chapter.id)}">定位到教材章节${icon('arrow')}</button>` : ''}</div></div></details>`;
}
function questionsInChapter(chapterId) {
  return siteContent.questions.filter(q => q.source === 'past' && referencesFor(q).some(reference => reference.chapterId === chapterId));
}
function questionGroups(book, chapter) {
  const entries = indexEntries.filter(entry => entry.chapterId === chapter.id);
  if (!entries.length) return '';
  const groups = [
    { label: '名词解释', types: ['term'], icon: 'term', cls: 'terms' },
    { label: '简答题', types: ['short'], icon: 'line', cls: 'shorts' },
    { label: '案例分析与论述', types: ['case', 'essay'], icon: 'case', cls: 'essays' },
  ];
  return `<div class="question-groups">${groups.map(group => {
    const list = entries.filter(entry => group.types.includes(entry.type));
    if (!list.length) return '';
    return `<section class="question-group ${group.cls}"><div class="question-group-title">${icon(group.icon)}<h4>${group.label}</h4><span>${list.length}</span></div><div class="question-group-body">${list.map(entry => `<article class="outline-question"><h4>${entry.questionIds.map(id => {
      const question = siteContent.questions.find(q => q.id === id);
      return `<a href="${escape(pastQuestionHref(id))}" class="outline-question-link">${escape(entry.title)}${entry.questionIds.length > 1 ? `<small>（原卷${escape(question.subject)}部分）</small>` : ''}${icon('arrow')}</a>`;
    }).join('')}</h4><div class="outline-question-meta">${entry.year} 年 · ${entry.examCode} · ${typeLabel(entry.type)}</div>${entry.note ? `<p>${escape(entry.note)}</p>` : ''}</article>`).join('')}</div></section>`;
  }).join('')}</div>`;
}
function chapterContent(book, chapter) {
  const groups = questionGroups(book, chapter);
  if (!groups && !chapter.sections?.length && !chapter.overview && !chapter.knowledge?.length) return '';
  return `<div class="chapter-content">${chapter.sections?.length ? `<div class="section-list">${chapter.sections.map(section => `<span id="${escape(section.id)}" tabindex="-1">${escape(section.title)}</span>`).join('')}</div>` : ''}${chapter.overview ? `<p class="chapter-overview reading-text">${text(chapter.overview)}</p>` : ''}${chapter.knowledge?.length ? `<div class="knowledge-list">${chapter.knowledge.map(point => `<details><summary>${escape(point.title)}${icon('down')}</summary><p class="reading-text">${text(point.body)}</p>${point.source ? `<small>教材依据：${text(point.source)}</small>` : ''}</details>`).join('')}</div>` : ''}${groups ? `<div class="chapter-questions-label">${icon('link')}本章考过什么<span>按题型归类</span></div>${groups}` : ''}</div>`;
}
function outlinePage() {
  const route = routes.find(r => r.id === 'outline');
  return `<div class="page outline-page">${pageHeading(route, '学习大纲', '以书为起点，沿着章节，把知识与考题连成一条线。', '<div class="expand-controls"><button class="button small subtle" data-expand="true">'+icon('expand')+'全部展开</button><button class="button small subtle" data-expand="false">'+icon('collapse')+'全部收起</button></div>')}
    <div class="outline-guide"><span>${icon('book')}参考教材</span><i></i><span>${icon('outline')}章节目录</span><i></i><span>${icon('paper')}章节真题</span><span class="outline-guide-note">知识有脉络，考题有出处</span></div>
    ${siteContent.textbooks.some(book => book.placeholder) ? '<div class="placeholder-notice"><span class="status-dot"></span>当前为目录结构示意，教材名称与真实章节待补充。</div>' : ''}
    <div class="textbook-list">${siteContent.textbooks.length ? siteContent.textbooks.map((book, i) => `<details class="textbook" data-book-id="${escape(book.id)}" ${i === 0 || preferences.expandChapters ? 'open' : ''}><summary class="textbook-heading">${cover(book)}<div class="textbook-info"><div class="book-kicker">${book.supplement ? '索引附录' : '参考教材'} <span>0${i + 1}</span></div><h2>${escape(book.title)}${book.badge ? `<span class="book-badge">${escape(book.badge)}</span>` : ''}</h2><p>${[book.author, book.publisher, book.edition].filter(Boolean).map(escape).join(' · ') || '教材章节未提供'}</p><span class="textbook-caption">${book.supplement ? '14 道题目 · 按索引单列' : book.placeholder ? '等待补充教材目录' : `${book.chapters.length} 个目录节点 · 按教材顺序排列`}</span></div><span class="textbook-toggle">${icon('down')}</span></summary><div class="chapter-timeline">${book.chapters.length ? book.chapters.map((chapter, index) => `<details class="chapter" id="${escape(chapter.id)}" ${preferences.expandChapters || (i === 0 && index === 0) ? 'open' : ''}><summary class="chapter-heading"><span class="chapter-node">${escape(chapter.number === '00' ? '序' : chapter.number.replace(/[第章]/g, ''))}</span><div class="chapter-heading-text"><h3>${escape(chapter.number !== '00' && chapter.number !== '附' ? chapter.number + '　' + chapter.title : chapter.title)}</h3><span>${book.placeholder ? '章节目录待补充' : `${questionsInChapter(chapter.id).length} 道历年真题`}</span></div>${icon('down', 'chapter-chevron')}</summary>${chapterContent(book, chapter)}</details>`).join('') : '<p class="inline-empty">教材目录待补充。</p>'}</div></details>`).join('') : emptyState('outline', '参考教材待补充', '补充参考教材后，目录会在这里按章节展开。')}</div>
    <p class="page-footnote">${icon('leaf')}目录与题目定位依据各站点提供的章节索引；点击章内题目可定位到题库。</p></div>`;
}
function emptyState(iconName, title, description, action = '') {
  return `<div class="empty-state"><div class="empty-illustration"><span class="empty-orbit"></span><span class="empty-paper">${icon(iconName)}</span><span class="empty-spark"></span></div><h2>${title}</h2><p>${description}</p>${action}</div>`;
}
function bankPage(source) {
  const route = routes.find(r => r.id === source);
  const isPast = source === 'past';
  const years = [...new Set([...siteContent.questions, ...siteContent.papers].filter(q => q.source === source && q.year).map(q => String(q.year)))].sort().reverse();
  const count = siteContent.questions.filter(q => q.source === source).length;
  const filteredCount = siteContent.questions.filter(q => q.source === source && matchesQuestion(q)).length;
  return `<div class="page bank-page">${pageHeading(route, isPast ? '真题库' : '模拟库', isPast ? '按年份、科目与题型整理已提供的历年题目。' : '按试卷与题型整理练习内容，配套参考答案和评分要点。', '')}
    <p class="past-bank-note">${count ? `已收录 ${count} 道题目。` : '题目与试卷待补充；页面结构和筛选逻辑已经准备好。'}</p>
    <div class="bank-toolbar"><div class="view-switch" aria-label="题库视图"><button data-bank-mode="questions" class="${filter.mode === 'questions' ? 'active' : ''}" aria-pressed="${filter.mode === 'questions'}">${isPast ? '按年份与题型' : '按题目'}</button><button data-bank-mode="papers" class="${filter.mode === 'papers' ? 'active' : ''}" aria-pressed="${filter.mode === 'papers'}">按试卷</button></div><div class="bank-filters"><label class="select-wrap"><span class="sr-only">选择教材</span><select id="book-filter"><option value="all">全部教材</option>${siteContent.textbooks.filter(b => !b.placeholder && (isPast || siteContent.questions.some(q=>q.source === source && referencesFor(q).some(ref=>ref.textbookId===b.id)))).map(b => `<option value="${escape(b.id)}">${escape(b.title)}</option>`).join('')}</select>${icon('down')}</label>${isPast ? `<label class="select-wrap"><span class="sr-only">选择科目</span><select id="exam-filter"><option value="all">全部科目</option>${(siteContent.examTracks || []).map(track => `<option value="${escape(track.id)}">${escape(track.label)}</option>`).join('')}</select>${icon('down')}</label><label class="select-wrap"><span class="sr-only">选择年份</span><select id="year-filter"><option value="all">全部年份</option>${years.map(year => `<option>${escape(year)}</option>`).join('')}</select>${icon('down')}</label>` : `<label class="select-wrap"><span class="sr-only">选择卷类</span><select id="mock-kind-filter"><option value="all">全部卷类</option><option value="simulation">练习卷</option><option value="prediction">专题卷</option></select>${icon('down')}</label><label class="select-wrap mock-paper-select"><span class="sr-only">选择试卷</span><select id="paper-filter">${mockPaperOptions()}</select>${icon('down')}</label>`}</div></div>
    <div class="bank-panel"><div class="bank-panel-header"><div class="type-tabs" aria-label="题型筛选"><button data-type="all" class="active" aria-pressed="true">全部题型</button>${questionTypes.filter(type => siteContent.questions.some(q => q.source === source && q.type === type.id) || !siteContent.questions.length).map(type => `<button data-type="${type.id}" aria-pressed="false">${type.label}</button>`).join('')}</div><label class="search-field">${icon('search')}<input type="search" id="question-search" placeholder="${filter.mode === 'papers' ? '搜索试卷或题目' : '搜索题目关键词'}" aria-label="${filter.mode === 'papers' ? '搜索试卷或题目' : '搜索题目关键词'}" autocomplete="off"></label></div><div class="bank-start-row"><span class="result-caption" id="filtered-question-count">共 ${filteredCount} 道题目</span>${bankActions(filteredCount)}</div><div id="bank-results" aria-live="polite">${bankResults(source)}</div></div><p class="page-footnote">${icon('book')}${isPast ? '题目与答案按所供资料保留，教材章节依据站点索引定位。' : '模拟题独立收录，主观题可配置评分要点或接入站点批改服务。'}</p></div>`;
}
function bankResults(source) {
  const isPast = source === 'past';
  const allQuestions = siteContent.questions.filter(q => q.source === source);
  const matches = matchesQuestion;
  if (filter.mode === 'papers') {
    const papers = siteContent.papers.filter(p => p.source === source && (filter.year === 'all' || String(p.year) === filter.year) && (filter.exam === 'all' || p.examCode === filter.exam)).sort((a,b) => b.year - a.year || String(a.examCode).localeCompare(String(b.examCode)));
    const entries = papers.map(paper => ({ paper, questions: allQuestions.filter(q => q.paperId === paper.id && matchesQuestion(q)) })).filter(entry => entry.questions.length);
    if (!entries.length) return emptyState('search', '没有找到匹配的试卷', '调整年份、科目、题型或搜索关键词。', '<button class="button subtle small" data-reset-filters>清除筛选</button>');
    if (source === 'mock') return `<div class="paper-list">${['simulation','prediction'].map(kind => {
      const selected=entries.filter(entry=>entry.paper.mockKind===kind);
      return selected.length ? `<section class="mock-paper-category"><h2>${kind === 'simulation' ? '练习卷' : '专题卷'}<span>${selected.length} 套</span></h2>${selected.map(renderPaperEntry).join('')}</section>` : '';
    }).join('')}</div>`;
    return `<div class="paper-list">${entries.map(renderPaperEntry).join('')}</div>`;
  }
  const questions = allQuestions.filter(matches);
  if (!questions.length) {
    return allQuestions.length ? emptyState('search', '没有找到匹配的题目', '换一个关键词，或调整题型、教材和年份。', '<button class="button subtle small" data-reset-filters>清除筛选</button>') : emptyState(isPast ? 'paper' : 'pen', isPast ? '真题，等你慢慢收录。' : '学过的知识，在这里练习。', isPast ? '历年真题将在这里按题型整理，<br>并与教材中的对应章节相连。' : '模拟题与参考答案待补充，<br>每一次练习，都以教材为依据。', '<a class="text-link" href="#/outline">先看看章节大纲'+icon('arrow')+'</a>');
  }
  if (isPast) {
    const years = [...new Set(questions.map(q => q.year))].sort((a,b) => b-a);
    return `<div class="question-list">${years.map((year,index) => {
      const list = questions.filter(q => q.year === year);
      return `<details class="past-year-group" data-year="${year}" ${index === 0 ? 'open' : ''}><summary><h2>${year} 年</h2><span>${list.length} 道题目</span>${icon('down')}</summary><div class="past-year-content">${groupByType(list)}</div></details>`;
    }).join('')}</div>`;
  }
  return `<div class="question-list mock-question-list">${siteContent.papers.filter(paper=>paper.source===source).map(paper=>{
    const entries=questions.filter(question=>question.paperId===paper.id);
    return entries.length ? `<section class="mock-question-paper"><div class="mock-question-paper-heading"><h2>${escape(paper.title)}<small>${entries.length} 题</small></h2><button class="text-link" data-start-paper="${escape(paper.id)}">练习本卷${icon('pen')}</button></div>${groupByType(entries,paper.sections?.map(section=>section.type))}</section>` : '';
  }).join('')}</div>`;
}
function mockPaperOptions() {
  return '<option value="all">全部试卷</option>' + siteContent.papers.filter(paper=>paper.source==='mock' && (filter.mockKind==='all' || paper.mockKind===filter.mockKind)).map(paper=>`<option value="${escape(paper.id)}" ${filter.paper===paper.id ? 'selected' : ''}>${escape(paper.paperLabel)}</option>`).join('');
}
function renderPaperEntry({paper,questions}) {
  const url=safeUrl(paper.fileUrl);
  const points=questions.reduce((sum,question)=>sum+(question.score||0),0);
  const fullCount=siteContent.questions.filter(question=>question.paperId===paper.id).length;
  const summary=paper.source==='mock' ? `${questions.length} 题 · ${points} 分${questions.length!==fullCount ? '（筛选后）' : ''} · ${paper.durationMinutes} 分钟` : `${questions.length} 道题目 · 按当前筛选范围`;
  return `<details class="paper-item" data-paper-id="${escape(paper.id)}"><summary><span class="resource-icon">${icon('paper')}</span><div><h3>${escape(paper.title)}</h3><p>${summary}</p></div>${icon('down')}</summary><div class="paper-content">${paper.description ? `<p>${text(paper.description)}</p>` : ''}${url ? `<a class="button small subtle" href="${url}" target="_blank" rel="noopener noreferrer">查看原卷${icon('arrow')}</a>` : ''}<button class="button primary small" data-start-paper="${escape(paper.id)}">${questions.length===fullCount ? '开始答卷' : '练习筛选题目'}${icon('pen')}</button>${paper.scoringInstructions ? `<p class="paper-scoring-note">${escape(paper.scoringInstructions)}</p>` : ''}${groupByType(questions,paper.sections?.map(section=>section.type))}</div></details>`;
}
function groupByType(questions, order = null) {
  const types = order ? order.map(id=>questionTypes.find(type=>type.id===id)).filter(Boolean) : questionTypes;
  return types.map(type => {
    const list = questions.filter(q => q.type === type.id);
    return list.length ? `<section class="past-type-group"><h3>${type.label}<span>${list.length} 题</span></h3>${list.map(q => questionCard(q)).join('')}</section>` : '';
  }).join('');
}
function matchesQuestion(q) {
  return (filter.mockKind === 'all' || q.mockKind === filter.mockKind) && (filter.paper === 'all' || q.paperId === filter.paper) && (filter.exam === 'all' || q.examCode === filter.exam) && (filter.type === 'all' || q.type === filter.type) && (filter.book === 'all' || q.textbookId === filter.book || referencesFor(q).some(reference => reference.textbookId === filter.book)) && (filter.year === 'all' || String(q.year) === filter.year) && (!filter.query || `${q.title} ${q.answer || ''} ${q.paperLabel || ''} ${q.sourceTopic || ''} ${filter.mode === 'papers' ? siteContent.papers.find(p => p.id === q.paperId)?.title || '' : ''}`.replace(/\s/g,'').toLowerCase().includes(filter.query.replace(/\s/g,'').toLowerCase()));
}
function collectionQuestions(kind) {
  const ids = kind === 'favorites' ? learning.favorites : learning.mistakes.map(item=>item.questionId);
  return siteContent.questions.filter(q=>ids.includes(q.id));
}
function currentQuestions() {
  return (['favorites','mistakes'].includes(currentRoute) ? collectionQuestions(currentRoute) : siteContent.questions.filter(q=>q.source===currentRoute)).filter(matchesQuestion);
}
function bankActions(count) {
  return `<div class="practice-entry-actions"><button class="button primary small" data-start-filtered ${count ? '' : 'disabled'}>开始答题${icon('pen')}</button></div>`;
}
function collectionPage(kind) {
  const favorites = kind === 'favorites';
  const route = routes.find(route=>route.id===kind);
  return `<div class="page bank-page collection-page">${pageHeading(route,route.label,favorites ? '留下值得再读的题目，把好的提问慢慢积累。' : '从做错的地方重新理解，把答案读回教材。',bankActions(collectionQuestions(kind).length))}<div class="bank-panel"><div class="bank-panel-header"><div class="type-tabs" aria-label="题型筛选"><button data-type="all" class="active" aria-pressed="true">全部题型</button>${questionTypes.map(type=>`<button data-type="${type.id}" aria-pressed="false">${type.label}</button>`).join('')}</div><label class="search-field">${icon('search')}<input type="search" id="question-search" placeholder="搜索题目关键词" aria-label="搜索题目关键词" autocomplete="off"></label></div><div id="bank-results" aria-live="polite">${collectionResults(kind)}</div></div><p class="page-footnote">${icon(favorites ? 'favorite' : 'mistakes')}${favorites ? '题库、大纲和答题结果中的星标，都会收录在这里。' : '客观题答错或评分未满分时自动收录，订正后可手动移出。'}</p></div>`;
}
function collectionResults(kind) {
  const all=collectionQuestions(kind), list=all.filter(matchesQuestion);
  if(!list.length) return all.length ? emptyState('search','没有找到匹配的题目','换一个关键词，或选择其他题型。','<button class="button subtle small" data-reset-filters>清除筛选</button>') : emptyState(kind==='favorites'?'favorite':'mistakes',kind==='favorites'?'把好题，留在手边。':'把每一次错误，变成理解。',kind==='favorites'?'点击题目旁的星标，即可在这里再次阅读与练习。':'答题批改后，未得满分的题目会自动归入这里。','<a class="text-link" href="#/mock">去题库看看'+icon('arrow')+'</a>');
  return `<div class="question-list"><div class="result-caption">共 ${list.length} 道题目</div>${list.map(question=>{const mistake=learning.mistakes.find(item=>item.questionId===question.id);return `<div class="collection-item">${kind==='mistakes'?`<div class="mistake-context"><span class="${mistake.resolved?'resolved':''}">${mistake.resolved?icon('check')+'已订正':mistake.status === 'evaluated' ? '客观题答错 · 待巩固' : `${mistake.score} / ${mistake.maxScore} 分 · 待巩固`}</span><button data-remove-mistake="${escape(question.id)}">移出错题集</button></div>`:''}${questionCard(question,false,kind==='mistakes'?mistake:null)}</div>`;}).join('')}</div>`;
}
function appearanceSettings() {
  return `<section class="settings-section appearance-section" aria-labelledby="appearance-heading"><h2 id="appearance-heading">外观与色调</h2><div class="settings-panel"><div class="appearance-description"><h3>淡雅一点，专注一些。</h3><p>选择喜欢的全局色调，每一种都适配浅色与深色模式。</p></div><div class="theme-options" aria-label="全局主题色">${themes.map(theme=>`<button class="theme-option ${preferences.theme===theme.id?'active':''}" data-theme-choice="${theme.id}" aria-pressed="${preferences.theme===theme.id}" style="--swatch:${theme.color};--swatch-tint:${theme.tint}"><span class="theme-swatch"><i></i><span>${icon('check')}</span></span><strong>${theme.name}</strong>${theme.id==='sage'?'<small>默认</small>':'<small>&nbsp;</small>'}</button>`).join('')}</div><div class="setting-row mode-setting"><div><h3>显示模式</h3><p>白天清透，夜晚柔和。</p></div><div class="mode-options" aria-label="显示模式">${[['light','sun','浅色'],['dark','moon','深色'],['system','system','跟随系统']].map(([id,glyph,label])=>`<button data-mode="${id}" class="${preferences.appearance===id?'active':''}" aria-pressed="${preferences.appearance===id}">${icon(glyph)}${label}</button>`).join('')}</div></div></div></section>`;
}
function libraryPage() {
  return `<div class="page library-page">${pageHeading(routes.find(r => r.id === 'library'), '资料库', '把教材与资料放在一起，让每一份知识都有来处。')}<div class="library-tabs type-tabs" aria-label="资料分类"><button data-library="all" class="active" aria-pressed="true">全部资料</button><button data-library="textbook" aria-pressed="false">参考教材</button><button data-library="note" aria-pressed="false">学习资料</button></div><div id="library-results">${libraryResults()}</div><div class="library-note">${icon('link')}教材目录与大纲相连，题目与教材出处相连。</div></div>`;
}
function bookFileUrl(book) {
  return safeUrl(book.fileUrl) || safeUrl(siteContent.materials.find(item => item.type === 'textbook' && item.textbookId === book.id && safeUrl(item.fileUrl))?.fileUrl);
}
function bookDownloadButton(book) {
  const url = safeUrl(book.downloadUrl) || bookFileUrl(book);
  return url ? `<a class="library-download" href="${url}" target="_blank" rel="noopener noreferrer" download>${icon('download')}下载教材</a>` : `<button class="library-download" disabled title="下载链接待提供" aria-label="下载${escape(book.title)}（链接待提供）">${icon('download')}下载教材</button>`;
}
function libraryResults() {
  const books = libraryFilter !== 'note' ? siteContent.textbooks : [];
  const resources = siteContent.materials.filter(item => libraryFilter === 'all' || (libraryFilter === 'textbook' ? item.type === 'textbook' : item.type !== 'textbook'));
  return `${books.length ? `<div class="library-section-label">参考教材<span>${books.length} 本</span></div><div class="library-book-grid">${books.map(book => `<article class="library-book-card"><div class="library-cover-area">${cover(book, true)}${book.placeholder ? '<span class="cover-state">待补充</span>' : ''}</div><div class="library-book-content"><span class="content-label">REFERENCE TEXTBOOK</span><h2>${escape(book.title)}${book.badge ? `<span class="book-badge">${escape(book.badge)}</span>` : ''}</h2><p>${[book.author, book.edition].filter(Boolean).map(escape).join(' · ') || '索引附录'}</p><div class="library-book-description">${escape(book.description || '按教材原始目录组织章节与知识。')}</div>${false ? '' : `<div class="library-book-actions"><a class="text-link" href="#/outline" data-open-book="${escape(book.id)}">查看章节大纲${icon('arrow')}</a>${bookDownloadButton(book)}</div>`}</div></article>`).join('')}</div>` : ''}${resources.length ? `<div class="library-section-label">学习资料<span>${resources.length} 份</span></div><div class="resource-list">${resources.map(item => { const url = safeUrl(item.fileUrl); return `<article class="resource-item"><span class="resource-icon">${icon('file')}</span><div><h3>${escape(item.title)}</h3><p>${escape(item.description || '学习资料')}</p></div>${url ? `<a class="button small subtle" href="${url}" target="_blank" rel="noopener noreferrer">查看资料${icon('arrow')}</a>` : '<span class="muted">文件待补充</span>'}</article>`; }).join('')}</div>` : libraryFilter === 'note' ? `<div class="bank-panel">${emptyState('library', '留一处安静的资料架。', '学习笔记、补充材料与原始文件，<br>将整理收录在这里。')}</div>` : ''}${!books.length && !resources.length && libraryFilter !== 'note' ? emptyState('library', '资料待补充', '参考教材与学习资料将收录在这里。') : ''}`;
}
function assistantPage() { return assistant.render(); }
function cloudSettings() {
  const cloud=cloudInfo();
  return `<section class="settings-section cloud-settings"><h2>云端备份</h2><div class="settings-panel"><div class="setting-row"><div><h3 data-cloud-status>${cloud.lastSynced?'已备份到云端':'正在连接云端…'}</h3><p>作答、成绩、收藏、错题和学习偏好自动保存；离线后联网补传。</p></div><button class="button subtle small" data-cloud-action="sync">立即备份</button></div><div class="cloud-recovery"><h3>换设备也能继续学习</h3><p>本设备自动识别。请保存恢复码，换手机、浏览器或清除全部网站数据后，用恢复码找回记录。IP 和设备特征仅辅助校验，不会单独作为恢复凭据。</p><button class="button subtle small" data-cloud-action="copy">复制我的恢复码</button><div class="cloud-restore"><label for="cloud-recovery-code">使用恢复码找回</label><input id="cloud-recovery-code" type="password" autocomplete="off" placeholder="粘贴 ZY- 开头的恢复码"><button class="button subtle small" data-cloud-action="restore">恢复并同步</button></div>${cloud.remote?'<button class="button primary" data-cloud-action="publish">打开线上网站，继续学习</button>':''}</div>${cloud.history.length?`<div class="cloud-history"><h3>最近答卷</h3>${cloud.history.map(item=>`<div><span>${escape(item.title)}<small>${item.submitted?'已交卷':'答题中'}</small></span><button class="button small subtle" data-cloud-resume="${escape(item.id)}">${item.submitted?'查看结果':'继续答题'}</button></div>`).join('')}</div>`:''}</div></section>`;
}
function aiSettings() {
  return `<section class="settings-section ai-settings" aria-labelledby="ai-heading"><h2 id="ai-heading">智能服务接入</h2><div class="settings-panel"><div class="appearance-description"><h3>接入你自己的 AI 服务</h3><p>框架不内置任何密钥。配置只保存在当前浏览器，并通过站点后台转发给批改或云助手接口。</p></div><div class="api-grid"><label><span>服务商</span><select id="ai-provider">${aiProviders.map(item => `<option value="${item.id}" ${item.id === aiConfig.provider ? 'selected' : ''}>${item.label}</option>`).join('')}</select></label><label><span>模型名称</span><input id="ai-model" value="${escape(aiConfig.model)}" placeholder="例如：gpt-4o-mini" autocomplete="off"></label><label class="api-wide"><span>API Key</span><input id="ai-api-key" type="password" value="${escape(aiConfig.apiKey)}" placeholder="粘贴当前服务商的 API Key" autocomplete="off"></label><label class="api-wide"><span>接口地址</span><input id="ai-base-url" value="${escape(aiConfig.baseUrl)}" placeholder="https://api.example.com/v1" autocomplete="url"></label></div><div class="api-actions"><label class="toggle api-toggle"><input id="ai-enabled" type="checkbox" ${aiConfig.enabled ? 'checked' : ''}><span></span></label><span>允许云助手和主观题批改使用此配置</span><button class="button primary small" data-save-ai>保存接入配置</button></div><p class="settings-hint">保存后只写入本机 guanzhi:ai-config。请不要把真实密钥提交到 GitHub。</p></div></section>`;
}
function settingsPage() {
  return `<div class="page settings-page">${pageHeading(routes.find(r => r.id === 'settings'), '关于与设置', '一个安静、清晰，以内容为中心的学习空间。')}<section class="about-card"><span class="about-brand">${icon('book')}</span><div><span class="eyebrow">ABOUT GUANZHI</span><h2>${escape(siteContent.name)}<span>观其脉络，知其所以。</span></h2><p>框架只负责结构、阅读与交互。教材、科目和题库由每个学习网站自行接入。</p></div></section>${cloudSettings()}${appearanceSettings()}<section class="settings-section" aria-labelledby="reading-heading"><h2 id="reading-heading">阅读设置</h2><div class="settings-panel"><div class="setting-row"><div><h3>正文大小</h3><p>调整教材内容、题目答案的阅读字号。</p></div><div class="font-options" aria-label="正文大小">${[['standard','标准'],['comfort','舒适'],['large','大号']].map(([id,label]) => `<button data-font="${id}" class="${preferences.fontSize === id ? 'active' : ''}" aria-pressed="${preferences.fontSize === id}">${label}</button>`).join('')}</div></div><div class="reading-preview reading-text">循着教材的脉络，让每一个知识点找到自己的位置。</div><div class="setting-row"><div><h3>展开所有章节</h3><p>进入大纲时，默认展开全部教材与章节。</p></div><label class="toggle"><input type="checkbox" id="expand-setting" ${preferences.expandChapters ? 'checked' : ''} aria-label="进入大纲时展开所有章节"><span></span></label></div></div><p class="settings-hint">阅读偏好保存在本机，并自动备份到云端。</p></section><section class="content-principles"><span class="content-label">内容原则</span><div><p>${icon('check')}目录遵循教材原有章节</p><p>${icon('check')}真题与模拟题分别收录</p><p>${icon('check')}内容与答案标注依据</p></div></section></div>`;
}
function getRoute() { const value = location.hash.replace(/^#\//, '').split('?')[0]; return routes.some(route => route.id === value) ? value : 'home'; }
function renderRoute(shouldFocus = true) {
  const savedView=navigation.enter();
  assistant.close(false);
  currentRoute = getRoute();
  if(currentRoute==='demo') {location.hash='/mock';return;}
  filter = { type: 'all', query: '', book: 'all', year: 'all', exam: 'all', mockKind: 'all', paper: 'all', mode: 'questions' };
  if (currentRoute === 'mock') filter.mode = 'papers';
  libraryFilter = 'all';
  if(savedView?.filter)filter={...filter,...savedView.filter};
  if(savedView?.libraryFilter)libraryFilter=savedView.libraryFilter;
  const params = new URLSearchParams(location.hash.split('?')[1] || '');
  const requestedQuestion = ['past','mock'].includes(currentRoute) ? siteContent.questions.find(q => q.id === params.get('question') && q.source === currentRoute) : null;
  if (requestedQuestion && !savedView) { filter.mode='questions'; if(currentRoute==='past'){filter.year=String(requestedQuestion.year);filter.exam=requestedQuestion.examCode;}else filter.paper=requestedQuestion.paperId; }
  const route = routes.find(route => route.id === currentRoute);
  document.querySelectorAll('[data-nav]').forEach(link => {
    const active = link.dataset.nav === (currentRoute==='practice' ? practice.source() : currentRoute);
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
  });
  document.getElementById('breadcrumb-current').textContent = route.label;
  document.title = `${route.label} · ${siteContent.name}`;
  const renderers = { home: homePage, outline: outlinePage, past: () => bankPage('past'), mock: () => bankPage('mock'), library: libraryPage, assistant: assistantPage, settings: settingsPage, favorites:()=>collectionPage('favorites'), mistakes:()=>collectionPage('mistakes'), practice:()=>practice.render() };
  const main = document.getElementById('main-content');
  main.innerHTML = renderers[currentRoute]();
  if (currentRoute === 'settings') main.querySelector('.appearance-section')?.insertAdjacentHTML('beforebegin', aiSettings());
  restoreFilterControls();
  const returnTarget=navigation.returnTarget();
  if(currentRoute==='outline'&&returnTarget){const button=document.createElement('button');button.className='button subtle small outline-return';button.dataset.historyReturn='';button.textContent='← '+returnTarget.label;main.querySelector('.page-heading')?.after(button);}
  setMenu(false);
  if(!savedView)window.scrollTo({ top: 0, behavior: 'instant' });
  if (shouldFocus) main.focus({ preventScroll: true });
  if(savedView){navigation.restore(savedView);focusChapter='';return;}
  navigation.restore(null);
  if (requestedQuestion) {
    if(document.getElementById('year-filter'))document.getElementById('year-filter').value=filter.year;
    if(document.getElementById('exam-filter'))document.getElementById('exam-filter').value=filter.exam;
    revealNavigationTarget([...main.querySelectorAll('[data-question-id]')].find(node => node.dataset.questionId === requestedQuestion.id));
  }
  if (currentRoute === 'outline') {
    const targetId = params.get('target') || params.get('chapter') || focusChapter;
    if (targetId) revealNavigationTarget(document.getElementById(targetId) || [...document.querySelectorAll('[data-book-id]')].find(book => book.dataset.bookId === targetId));
    focusChapter = '';
  }
}
function restoreFilterControls() {
  for(const [id,value] of [['book-filter',filter.book],['exam-filter',filter.exam],['year-filter',filter.year],['mock-kind-filter',filter.mockKind],['paper-filter',filter.paper]]){const control=document.getElementById(id);if(control)control.value=value;}
  const search=document.getElementById('question-search');if(search)search.value=filter.query;
  document.querySelectorAll('[data-type]').forEach(button=>{const active=button.dataset.type===filter.type;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});
  document.querySelectorAll('[data-library]').forEach(button=>{const active=button.dataset.library===libraryFilter;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});
}
function revealNavigationTarget(target) {
  if (!target) return;
  let ancestor = target;
  while (ancestor) {
    if (ancestor.matches('details')) ancestor.open = true;
    ancestor = ancestor.parentElement;
  }
  target.classList.add('navigation-target');
  requestAnimationFrame(() => {
    target.scrollIntoView({block:'start',behavior:'instant'});
    (target.matches('details') ? target.querySelector('summary') : target)?.focus({preventScroll:true});
  });
}
function setMenu(open) {
  document.body.classList.toggle('menu-open', open);
  const button = document.querySelector('.mobile-menu');
  button.setAttribute('aria-expanded', String(open));
  button.setAttribute('aria-label', open ? '关闭导航' : '打开导航');
  const sidebar = document.querySelector('.sidebar');
  const mobile = window.matchMedia('(max-width: 760px)').matches;
  sidebar.inert = mobile && !open;
  if (open) sidebar.querySelector('[aria-current="page"]')?.focus();
}
function updateBank() { const count = document.getElementById('filtered-question-count'); if(count) count.textContent = `共 ${currentQuestions().length} 道题目`;  document.getElementById('bank-results').innerHTML = ['favorites','mistakes'].includes(currentRoute) ? collectionResults(currentRoute) : bankResults(currentRoute); const start = document.querySelector('[data-start-filtered]'); if(start)start.disabled=!currentQuestions().length; }
app.addEventListener('click', event => {
  const button = event.target.closest('button');
  if(button?.hasAttribute('data-history-return')){navigation.back();return;}
  if(button?.hasAttribute('data-favorite')) {
    event.preventDefault();
    learning=toggleFavorite(learning,button.dataset.favorite);persistLearning();
    const saved=learning.favorites.includes(button.dataset.favorite);
    document.querySelectorAll('[data-favorite]').forEach(item=>{if(item.dataset.favorite===button.dataset.favorite){item.classList.toggle('saved',saved);item.setAttribute('aria-pressed',String(saved));item.setAttribute('aria-label',saved?'取消收藏':'收藏题目');const label=item.querySelector('.favorite-label');if(label)label.textContent=saved?'已收藏':'收藏';}});
    if(currentRoute==='favorites') updateBank();
    return;
  }
  if(button?.hasAttribute('data-remove-mistake')) {learning={...learning,mistakes:learning.mistakes.filter(item=>item.questionId!==button.dataset.removeMistake)};persistLearning();updateBank();return;}
  if(button?.hasAttribute('data-cloud-action')) {
    const action=button.dataset.cloudAction;
    button.disabled=true;
    void (async()=>{
      if(action==='sync'){if(!await syncCloud())throw Error('暂时无法备份，作答已保留在本机。');notify('最新记录已备份到云端。');}
      if(action==='copy'){await copyRecovery();notify('恢复码已复制，请私下保存。');}
      if(action==='restore'){if(practice.isBusy()||assistant.isBusy())throw Error('请等待当前批改或问答完成后再恢复记录。');await restoreRecovery(document.getElementById('cloud-recovery-code').value);notify('已恢复云端记录。');renderRoute(false);}
      if(action==='publish')await openPublishedSite();
    })().catch(error=>notify(error.message)).finally(()=>{if(button.isConnected)button.disabled=false;});return;
  }
  if(button?.hasAttribute('data-cloud-resume')){void resumeCloudSession(button.dataset.cloudResume).then(()=>{practice.refreshFromStorage();if(currentRoute==='practice')renderRoute();else location.hash='/practice';}).catch(error=>notify(error.message));return;}
  if(button?.hasAttribute('data-ai-open')){assistant.open(button.dataset.aiOpen,button);return;}
  if(button?.hasAttribute('data-ai-close')){assistant.close();return;}
  if(button?.hasAttribute('data-ai-send')){void assistant.send(button.hasAttribute('data-ai-floating'));return;}
  if(practice.handleClick(button)) return;
  if(button?.hasAttribute('data-start-filtered')) {practice.start(currentQuestions().map(q=>q.id),routes.find(r=>r.id===currentRoute).label+' · 筛选练习',currentRoute);return;}
  if(button?.hasAttribute('data-start-question')) {const q=siteContent.questions.find(q=>q.id===button.dataset.startQuestion);practice.start([q.id],'单题练习',q.source);return;}
  if(button?.hasAttribute('data-start-paper')) {const paper=siteContent.papers.find(p=>p.id===button.dataset.startPaper);practice.start(siteContent.questions.filter(q=>q.paperId===paper.id&&q.source===paper.source&&matchesQuestion(q)).map(q=>q.id),paper.title,paper.source);return;}
  if(button?.hasAttribute('data-theme-choice') || button?.hasAttribute('data-mode')) {
    if(button.dataset.themeChoice) preferences.theme=button.dataset.themeChoice;
    if(button.dataset.mode) preferences.appearance=button.dataset.mode;
    savePreferences();
    document.querySelectorAll('[data-theme-choice]').forEach(item=>{const active=item.dataset.themeChoice===preferences.theme;item.classList.toggle('active',active);item.setAttribute('aria-pressed',String(active));});
    document.querySelectorAll('[data-mode]').forEach(item=>{const active=item.dataset.mode===preferences.appearance;item.classList.toggle('active',active);item.setAttribute('aria-pressed',String(active));});
  }
  if(button?.hasAttribute('data-save-ai')) {
    aiConfig = writeAiConfig({
      provider: document.getElementById('ai-provider')?.value,
      apiKey: document.getElementById('ai-api-key')?.value,
      baseUrl: document.getElementById('ai-base-url')?.value,
      model: document.getElementById('ai-model')?.value,
      enabled: document.getElementById('ai-enabled')?.checked,
    });
    notify('智能服务接入配置已保存在本机。');
  }
  if (button?.hasAttribute('data-sidebar-toggle')) {
    sidebarCollapsed = !sidebarCollapsed; syncSidebar();
    try { localStorage.setItem('guanzhi:sidebar-collapsed', JSON.stringify(sidebarCollapsed)); } catch {}
  }
  if (button?.matches('.mobile-menu')) setMenu(!document.body.classList.contains('menu-open'));
  if (button?.matches('.sidebar-backdrop, .sidebar-close')) { setMenu(false); document.querySelector('.mobile-menu').focus(); }
  if (button?.hasAttribute('data-expand')) document.querySelectorAll('.textbook, .chapter').forEach(details => { details.open = button.dataset.expand === 'true'; });
  if (button?.hasAttribute('data-type')) {
    filter.type = button.dataset.type;
    document.querySelectorAll('[data-type]').forEach(tab => { const active = tab.dataset.type === filter.type; tab.classList.toggle('active', active); tab.setAttribute('aria-pressed', active); });
    updateBank();
  }
  if (button?.hasAttribute('data-bank-mode')) {
    filter.mode = button.dataset.bankMode;
    const search = document.getElementById('question-search'); search.placeholder = filter.mode === 'papers' ? '搜索试卷或题目' : '搜索题目关键词'; search.setAttribute('aria-label', search.placeholder);
    document.querySelectorAll('[data-bank-mode]').forEach(tab => { const active = tab.dataset.bankMode === filter.mode; tab.classList.toggle('active', active); tab.setAttribute('aria-pressed', active); });
    document.querySelectorAll('[data-type]').forEach(tab => { const active = tab.dataset.type === filter.type; tab.classList.toggle('active', active); tab.setAttribute('aria-pressed', active); });
    document.querySelector('.type-tabs').hidden = false;
    updateBank();
  }
  if (button?.hasAttribute('data-reset-filters')) {
    filter = { type: 'all', query: '', book: 'all', year: 'all', exam: 'all', mockKind: 'all', paper: 'all', mode: filter.mode };
    document.getElementById('question-search').value = '';
    if(document.getElementById('book-filter'))document.getElementById('book-filter').value = 'all';
    if (document.getElementById('mock-kind-filter')) document.getElementById('mock-kind-filter').value = 'all';
    if (document.getElementById('paper-filter')) document.getElementById('paper-filter').innerHTML = mockPaperOptions();
    if (document.getElementById('exam-filter')) document.getElementById('exam-filter').value = 'all';
    if (document.getElementById('year-filter')) document.getElementById('year-filter').value = 'all';
    document.querySelector('[data-type="all"]').click();
  }
  if (button?.hasAttribute('data-library')) {
    libraryFilter = button.dataset.library;
    document.querySelectorAll('[data-library]').forEach(tab => { const active = tab.dataset.library === libraryFilter; tab.classList.toggle('active', active); tab.setAttribute('aria-pressed', active); });
    document.getElementById('library-results').innerHTML = libraryResults();
  }
  if (button?.hasAttribute('data-font')) {
    preferences.fontSize = button.dataset.font; savePreferences();
    document.querySelectorAll('[data-font]').forEach(tab => { const active = tab.dataset.font === preferences.fontSize; tab.classList.toggle('active', active); tab.setAttribute('aria-pressed', active); });
  }
  if (event.target.closest('.sidebar a')) setMenu(false);
  const jump = event.target.closest('[data-chapter], [data-open-book]');
  if (jump) { focusChapter = jump.dataset.chapter || jump.dataset.openBook; const next = `/outline?target=${encodeURIComponent(focusChapter)}`; if (location.hash === '#' + next) renderRoute(); else location.hash = next; }
  if (event.target.closest('.skip-link')) { event.preventDefault(); document.getElementById('main-content').focus(); }
});
document.addEventListener('click', event => { if (event.target.closest('.skip-link')) { event.preventDefault(); document.getElementById('main-content').focus(); } });
app.addEventListener('input', event => { if(['assistant-message','assistant-float-message'].includes(event.target.id)){assistant.input(event.target.value,event.target.id==='assistant-float-message');return;} if(practice.handleInput(event.target))return; if (event.target.id === 'question-search') { filter.query = event.target.value.trim(); updateBank(); } });
app.addEventListener('change', event => {
  if(event.target.hasAttribute('data-practice-immediate'))practice.setImmediate(event.target.checked);
  if (event.target.id === 'mock-kind-filter') { filter.mockKind = event.target.value; filter.paper = 'all'; document.getElementById('paper-filter').innerHTML = mockPaperOptions(); updateBank(); }
  if (event.target.id === 'paper-filter') { filter.paper = event.target.value; updateBank(); }
  if (event.target.id === 'book-filter') { filter.book = event.target.value; updateBank(); }
  if (event.target.id === 'exam-filter') { filter.exam = event.target.value; updateBank(); }
  if (event.target.id === 'year-filter') { filter.year = event.target.value; updateBank(); }
  if (event.target.id === 'expand-setting') { preferences.expandChapters = event.target.checked; savePreferences(); }
});
document.addEventListener('keydown', event => {
  if(event.key==='Escape'&&assistant.isOpen()){event.preventDefault();assistant.close();return;}
  if (!document.body.classList.contains('menu-open')) return;
  if (event.key === 'Escape') { setMenu(false); document.querySelector('.mobile-menu').focus(); }
  if (event.key === 'Tab' && window.matchMedia('(max-width: 760px)').matches) {
    const links = [...document.querySelectorAll('.sidebar a, .sidebar button')];
    const first = links[0], last = links.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
});
window.matchMedia('(max-width: 760px)').addEventListener('change', () => { setMenu(false); syncSidebar(); });
const onHistoryChange=()=>{if(!navigation.isCurrent())renderRoute();};
window.addEventListener('popstate',onHistoryChange);
window.addEventListener('hashchange',onHistoryChange);
shell();
renderRoute(false);

window.addEventListener('guanzhi:cloud-update',()=>{
  assistant.refreshFromStorage();
  preferences=sanitizePreferences(readLocal('guanzhi:reading',{}));learning=sanitizeLearning(readLocal('guanzhi:learning',{}));
  document.documentElement.dataset.readingSize=preferences.fontSize;document.documentElement.dataset.theme=preferences.theme;
  document.documentElement.dataset.mode=preferences.appearance==='system'?(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):preferences.appearance;
  const editing=document.activeElement?.matches('textarea,input');
  if(editing)return;
  if(currentRoute==='practice'){if(practice.refreshFromStorage())renderRoute(false);}
  else if(['settings','home'].includes(currentRoute))renderRoute(false);
  else if(['favorites','mistakes'].includes(currentRoute))updateBank();
});
void startCloudSync();
