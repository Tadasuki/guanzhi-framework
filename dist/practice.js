import { queueCloudBackup } from './cloud.js';
import { isJudgment, objectiveSummary } from './judgment.js';
import { practiceScoring } from './scoring.js';
import { hasScore, isAnswered, gradeQuestion, selfGrade, summarize } from './learning.js';

export function createPractice({ content, icon, escape, text, reference, referenceMarkup, favoriteButton, record, navigate, notify, gradeSubjective }) {
  let session = null;
  const gradingVersion = 4;
  const pending = new Set();
  let submitting = false;
  const find = id => content.questions.find(question => question.id === id);
  const questions = () => session?.ids.map(find).filter(Boolean) || [];
  const save = () => { if(session)session.updatedAt=Date.now();try { sessionStorage.setItem('guanzhi:practice', JSON.stringify(session)); } catch {} try { if(typeof globalThis.window?.addEventListener==='function')localStorage.setItem('guanzhi:practice',JSON.stringify(session)); } catch {} queueCloudBackup(); };
  try {
    const saved = JSON.parse(sessionStorage.getItem('guanzhi:practice') || (typeof globalThis.window?.addEventListener==='function'?localStorage.getItem('guanzhi:practice'):null) || 'null');
    if (saved?.version === 1 && Array.isArray(saved.ids) && saved.ids.length && saved.ids.every(id => find(id)) && saved.responses && typeof saved.responses === 'object') {
      session = saved; session.id ||= crypto.randomUUID(); session.index = Math.min(Math.max(0, Number(session.index) || 0), session.ids.length - 1);
      session.immediate = session.immediate === true;
      session.submitted = session.submitted === true;
      if (session.gradingVersion !== gradingVersion) {
        for (const id of session.ids) {
          const question = find(id), response = session.responses[id];
          if (!response || (!response.confirmed && !session.submitted)) continue;
          const retainSelfGrade = ['对照答案自评','AI 智能批改'].includes(response.grade?.method) && response.grade.status === 'graded' && response.grade.maxScore === question.score;
          if (!retainSelfGrade) response.grade = gradeQuestion(question,response.answer);
          record(id,response.answer,response.grade);
        }
        session.gradingVersion = gradingVersion; save();
      }
      if (!session.submitted && session.immediateOverride !== false) {
        for (const id of session.ids) {
          const question = find(id), response = session.responses[id];
          if (!isJudgment(question) || !response?.confirmed || response.grade) continue;
          response.grade = gradeQuestion(question,response.answer);
          record(id,response.answer,response.grade);
          save();
        }
      }
    }
  } catch {}
  const immediateFor = question => typeof session?.immediateOverride === 'boolean' ? session.immediateOverride : Boolean(session?.immediate || isJudgment(question));
  const responseFor = question => session.responses[question.id] || { answer: '', confirmed: false };
  const rerender = () => { if(!globalThis.location || location.hash.startsWith('#/practice')) document.getElementById('main-content').innerHTML = render(); };
  const scoreText = grade => grade?.status === 'graded' ? `${grade.score} / ${grade.maxScore}` : `待自评 / ${grade?.maxScore ?? '—'}`;
  function start(ids, title, source, immediate = false) {
    const selected = [...new Set(ids)].map(find).filter(Boolean);
    if (!selected.length) { notify('题目待补充后即可开始答题。'); return; }
    session = { id: crypto.randomUUID(), version: 1, gradingVersion, ids: selected.map(question => question.id), title, source, immediate, submitted: false, index: 0, responses: {} };
    save(); navigate('practice');
  }
  function answerText(question, answer) {
    if (!isAnswered(answer)) return '<span class="muted">未作答</span>';
    if (question.options?.length) {
      const ids = Array.isArray(answer) ? answer : [answer];
      return ids.map(id => { const choice = question.options.find(option => String(option.id) === String(id)); return text(choice ? `${choice.id}. ${choice.text}` : id); }).join('<br>');
    }
    return text(answer);
  }
  function inputArea(question, response) {
    if (Array.isArray(question.options) && question.options.length) {
      return `<div class="answer-options ${question.format === 'boolean' ? 'judgement-options' : ''}">${question.options.map(option => {
        const multiple = question.format === 'multiple';
        const selected = multiple ? Array.isArray(response.answer) && response.answer.includes(String(option.id)) : String(response.answer) === String(option.id);
        const verdict = isJudgment(question) && selected && response.confirmed && immediateFor(question) && typeof response.grade?.correct === 'boolean' ? response.grade.correct ? 'verdict-correct' : 'verdict-incorrect' : '';
        return `<label class="answer-option ${question.format === 'boolean' ? 'judgement-option' : ''} ${selected ? 'selected' : ''} ${verdict}"><input type="${multiple ? 'checkbox' : 'radio'}" name="practice-answer" value="${escape(option.id)}" ${selected ? 'checked' : ''} ${isJudgment(question) && (response.selectionLocked || response.confirmed) ? 'disabled' : ''}>${question.format === 'boolean' ? `<span class="judgement-symbol">${icon(option.id === 'T' ? 'check' : 'close')}</span>` : `<span class="choice-letter">${escape(option.id)}</span>`}<span>${text(option.text)}</span></label>`;
      }).join('')}</div>`;
    }
    return `<label class="answer-input-label" for="practice-answer">你的作答</label><textarea id="practice-answer" class="answer-textarea reading-text" data-practice-answer placeholder="写下你的理解，按教材中的要点组织答案。" ${response.confirmed || response.submissionLocked || pending.has(question.id) ? 'readonly' : ''} maxlength="12000" rows="8">${escape(response.answer)}</textarea>`;
  }
  function referenceContent(question) {
    return `<div class="reading-text">${question.answer ? text(question.answer) : question.correctAnswer !== undefined ? text(Array.isArray(question.correctAnswer) ? question.correctAnswer.join('、') : question.correctAnswer) : '<span class="muted">资料未提供参考答案</span>'}</div>${question.notes ? `<p class="source-note reading-text">${text(question.notes)}</p>` : ''}${question.explanation ? `<span class="content-label explanation-label">解析</span><p class="reading-text">${text(question.explanation)}</p>` : ''}${question.scoringGuide ? `<div class="scoring-guide"><span class="content-label">评分要点</span><p class="reading-text">${text(question.scoringGuide)}</p></div>` : ''}${referenceMarkup ? referenceMarkup(question) : `<div class="source-reference">${escape(reference(question))}</div>`}`;
  }
  function answerPreview(question, response) {
    const revealed = response.answerRevealed === true;
    const id = `reference-answer-${question.id}`;
    return `<section class="answer-preview ${revealed ? 'revealed' : ''}" aria-label="参考答案"><div class="answer-preview-heading"><h3>参考答案</h3><button class="button small subtle" data-practice-action="reveal-answer" aria-expanded="${revealed}" aria-controls="${escape(id)}">${revealed ? '隐藏答案' : '显示答案'}</button></div><div class="answer-preview-body" id="${escape(id)}" aria-hidden="${!revealed}" ${revealed ? '' : 'inert'}>${referenceContent(question)}</div>${revealed ? '' : '<p class="answer-preview-hint">先独立作答，再对照参考答案</p>'}</section>`;
  }
  function objectiveFeedback(question, response) {
    const grade = response.grade;
    if (typeof grade?.correct !== 'boolean') return `<div class="practice-feedback needs-review"><div class="feedback-heading"><strong>答案待核对</strong></div><p class="grading-method">${escape(grade?.reason || '参考答案的判断结论尚不明确。')}</p>${referenceContent(question)}</div>`;
    const expected = isJudgment(question) ? grade.expectedAnswer === 'T' ? '正确（√）' : '错误（×）' : answerText(question,grade.expectedAnswer);
    const verdict = grade.unanswered ? '未作答' : grade.correct ? '答对了' : '答错了';
    return `<div class="practice-feedback ${grade.correct ? 'correct' : 'incorrect'}"><div class="feedback-heading"><span>${icon(grade.correct ? 'check' : 'close')}<strong>${verdict}</strong></span>${hasScore(question) ? `<span class="feedback-score">${scoreText(grade)}</span>` : '<span class="grading-method">已判对错 · 不计分</span>'}</div><p class="objective-verdict">参考判定：<strong>${expected}</strong></p><p class="grading-method">${escape(grade.method)}${grade.method === '参考解析判定' ? ' · 根据所供资料解析整理' : ''}</p>${grade.evidence && grade.method === '参考解析判定' ? `<p class="grading-evidence">依据：${escape(grade.evidence)}</p>` : ''}${referenceContent(question)}</div>`;
  }
  function feedback(question, response, full = false) {
    const grade = response.grade;
    if (!grade) return '';
    if (isJudgment(question) || question.options?.length || grade.expectedAnswer !== undefined) return objectiveFeedback(question,response);
    if (!hasScore(question)) return `<div class="practice-feedback"><div class="feedback-heading"><strong>参考答案</strong><span class="grading-method">资料未提供分值 · 不计分练习</span></div>${referenceContent(question)}</div>`;
    return `<div class="practice-feedback ${grade.status === 'graded' && grade.score === grade.maxScore ? 'correct' : ''}"><div class="feedback-heading"><span>${icon(grade.status === 'graded' && grade.score === grade.maxScore ? 'check' : 'paper')}<strong>${grade.status === 'graded' ? '本题反馈' : '对照教材，自评本题'}</strong></span><span class="feedback-score">${scoreText(grade)}</span></div><p class="grading-method">${escape(grade.method)}${grade.method === '要点匹配参考评分' ? ' · 根据已录入的关键词匹配，不代替教师评阅。' : ''}</p>${grade.summary ? `<p class="reading-text">${text(grade.summary)}</p>${[['已掌握',grade.matchedPoints],['待补充与纠正',grade.missingPoints],['答题建议',grade.advice]].filter(([,items])=>items?.length).map(([label,items])=>`<div class="ai-feedback-section"><h4>${label}</h4><ul>${items.map(item=>`<li>${text(item)}</li>`).join('')}</ul></div>`).join('')}<p class="grading-method">AI 参考评分${grade.recordId ? ' · 已保存到后台' : ''}</p>` : ''}${grade.points?.length ? `<ul class="rubric-points">${grade.points.map(point => `<li class="${point.matched ? 'matched' : ''}">${icon(point.matched ? 'check' : 'line')}<span>${text(point.text)}</span><small>${point.score} / ${point.maxScore}</small></li>`).join('')}</ul>` : ''}<div class="answer-reference"><span class="content-label">${question.demo ? '示范参考答案' : '参考答案'}</span>${referenceContent(question)}</div>${grade.status !== 'graded' ? `<div class="self-grade"><p>${escape(grade.reason || '请对照教材填写本题得分。')}</p>${scoreInput(question, grade)}</div>` : full && !question.options?.length && grade.method !== 'AI 智能批改' ? `<details class="score-adjustment"><summary>对照教材调整分数${icon('down')}</summary><p>主观题可依据教材要点，自行调整参考评分。</p>${scoreInput(question, grade)}</details>` : ''}</div>`;
  }
  function scoreInput(question, grade) {
    return `<div class="self-grade-controls"><label for="self-score-${escape(question.id)}">本题得分<input id="self-score-${escape(question.id)}" type="number" min="0" max="${question.score}" step="0.01" inputmode="decimal" value="${grade.status === 'graded' ? grade.score : ''}" placeholder="0—${question.score}"></label><span>/ ${question.score} 分</span><button class="button small subtle" data-practice-action="self-grade" data-question-id="${escape(question.id)}">确认评分</button></div>`;
  }
  function questionKind(question) {
    if (question.format === 'boolean') return 'judge';
    if (question.options?.length) return question.format === 'multiple' ? 'multiple' : 'single';
    return question.type;
  }
  const kindNames = { term: '名词解释', short: '简答题', case: '案例分析', essay: '论述题', single: '单选题', multiple: '多选题', judge: '判断题', choice: '选择题' };
  function groupedQuestions(list) {
    return [...new Set(list.map(questionKind))].map(kind => ({
      kind, label: kindNames[kind], entries: list.map((question,index) => ({question,index})).filter(entry => questionKind(entry.question) === kind),
    })).filter(group => group.entries.length);
  }
  function renderAnswerCard(list, summary) {
    return `<aside class="practice-side" aria-label="答题卡与翻题">
      <div class="answer-card">
        <header class="answer-card-header"><h2>${icon('outline')}答题卡</h2><span>已答 <strong data-answer-count>${summary.answered} / ${list.length}</strong></span></header>
        <div class="answer-card-groups">${groupedQuestions(list).map(group => `<section class="answer-card-group" aria-label="${group.label}题目导航"><h3>${group.label}<small>${group.entries.length} 题</small></h3><div class="answer-card-grid">${group.entries.map(({question,index},localIndex) => {
          const response = responseFor(question);
          const label = `${group.label}第 ${localIndex + 1} 题`;
          return `<button class="answer-card-question ${index === session.index ? 'current' : ''} ${isAnswered(response.answer) ? 'answered' : ''} ${response.confirmed ? 'confirmed' : ''} ${immediateFor(question) && typeof response.grade?.correct === 'boolean' ? response.grade.correct ? 'graded-correct' : 'graded-incorrect' : ''}" data-practice-action="goto" data-index="${index}" data-base-label="${label}" aria-label="${label}${isAnswered(response.answer) ? '，已作答' : ''}" ${index === session.index ? 'aria-current="step"' : ''}>${localIndex + 1}</button>`;
        }).join('')}</div></section>`).join('')}</div>
        <div class="answer-card-legend"><span><i></i>未答</span><span><i class="answered"></i>已答</span><span><i class="current"></i>当前</span>${list.some(isJudgment) ? '<span><i class="graded-correct"></i>答对</span><span><i class="graded-incorrect"></i>答错</span>' : ''}</div>
        <div class="answer-card-submit"><button class="button primary" data-practice-action="submit" ${submitting ? 'disabled' : ''}>${list.some(hasScore) ? '交卷，查看分数' : '交卷，查看批改'}${icon('arrow')}</button><p>${list.some(hasScore) ? '交卷后汇总已提供分值题目的评分' : '客观题自动判对错，交卷后汇总反馈'}</p></div>
      </div>
      <nav class="answer-card-pagination" aria-label="上一题与下一题"><button class="button subtle small" data-practice-action="previous" ${session.index === 0 ? 'disabled' : ''}>${icon('chevron','previous-chevron')}上一题</button><span>${session.index + 1}<i>/ ${list.length}</i></span><button class="button subtle small" data-practice-action="next" ${session.index === list.length - 1 ? 'disabled' : ''}>下一题${icon('chevron')}</button></nav>
    </aside>`;
  }
  function renderQuestionPanel(list, current, response) {
    const kind = questionKind(current);
    const objective = Boolean(current.options?.length);
    const judgment = isJudgment(current);
    const immediate = immediateFor(current);
    const judged = response.confirmed;
    const busy = pending.has(current.id) || submitting;
    const verdict = judgment && judged && immediate && typeof response.grade?.correct === 'boolean' ? response.grade.correct ? 'verdict-correct' : 'verdict-incorrect' : '';
    const action = judged ? session.index === list.length - 1 ? 'submit' : 'next' : 'confirm';
    const actionLabel = judged ? session.index === list.length - 1 ? '交卷，查看结果' : '下一题' : busy ? '正在批改…' : judgment && !isAnswered(response.answer) ? '请选择答案' : response.error ? '重试批改' : '确认本题';
    const feedbackHtml = (immediate || !objective) && response.confirmed ? feedback(current,response) : '';
    const group = groupedQuestions(list).find(group => group.kind === kind);
    const localIndex = group.entries.findIndex(entry => entry.question.id === current.id) + 1;
    return `<section class="practice-question-panel" aria-labelledby="current-question-title">
      <div class="question-tool-row"><span class="question-nature">${icon(objective ? 'check' : 'pen')}${objective ? '客观题' : current.type === 'choice' ? '选择题 · 选项缺失' : '主观题'}</span>${favoriteButton(current,true)}<button class="text-link question-ask" data-ai-open="${escape(current.id)}" aria-haspopup="dialog">问问云助手</button><div class="question-review-tools"><label class="immediate-option"><input type="checkbox" data-practice-immediate ${immediate ? 'checked' : ''}><span>一题一改</span></label><span class="practice-marks">${hasScore(current) ? `本题 ${current.score} 分${current.scoreSource ? ' · 练习分值' : ''}` : objective ? '自动判对错' : '不计分练习'}</span></div></div>
      <div class="question-heading"><div class="question-category-label">${kindNames[kind] || '题目'}<span>第 ${localIndex} 题</span>${current.demo ? '<span class="demo-badge">自编示范</span>' : ''}${current.year ? `<span>${current.year} 年 · ${escape(current.examCode)}</span>` : ''}</div><h2 class="practice-question-title reading-text" id="current-question-title">${text(current.title)}</h2>${current.requirements ? `<p class="question-requirements">${text(current.requirements)}</p>` : ''}</div>
      <div class="practice-input ${objective ? 'objective-input' : ''}">${inputArea(current,response)}</div>
      ${current.type === 'choice' && !current.options?.length ? '<p class="source-note">资料未记录选项，可在答题框中记录思路。</p>' : ''}
      <div id="practice-inline-message" role="status">${response.error ? escape(response.error) : busy ? '正在对照本站参考答案批改，请稍候。' : ''}</div>
      ${judgment ? `<div id="question-feedback" role="status" aria-live="polite">${feedbackHtml}</div>` : ''}
      <div class="question-confirm-row"><span class="answer-confirmed" id="answer-confirmed">${response.confirmed ? icon('check')+'本题已确认' : judgment && response.selectionLocked ? '已选定，点击确认后判分' : ''}</span><button class="button primary ${verdict}" data-practice-action="${action}" ${busy || judgment && !isAnswered(response.answer) ? 'disabled' : ''}>${actionLabel}${icon(judged ? 'arrow' : 'check')}</button></div>
      ${!objective ? response.confirmed ? `<div id="question-feedback" aria-live="polite">${feedbackHtml}</div>` : `${answerPreview(current,response)}<div id="question-feedback"></div>` : ''}
      <div class="question-feedback-timing">${icon('leaf')}<span>${judgment ? '选择后锁定，点击“确认本题”后判分。'+(immediate ? '确认后显示答案与反馈。' : '交卷后统一显示答案与反馈。') : '确认后锁定作答，由 已配置的 AI 服务对照参考答案评分并给出建议。'}</span></div>
    </section>`;
  }
  function render() {
    if (!session || !questions().length) return `<div class="page practice-page"><div class="page-heading"><div><div class="eyebrow">FOCUS ON THE QUESTION</div><h1>开始一份练习</h1><p>从题库、收藏或错题集中选择题目，进入答题。</p></div></div><div class="bank-panel"><div class="empty-state"><span class="resource-icon">${icon('pen')}</span><h2>从一道题，开始理解。</h2><p>选择练习卷或专题卷，开始整卷练习。</p><a class="button primary" href="#/mock">前往模拟库${icon('arrow')}</a></div></div></div>`;
    const list = questions();
    const summary = summarize(list, session.responses);
    const current = list[session.index];
    const response = responseFor(current);
    const demo = list.every(question => question.demo);
    const scoringLabels = {term:'名词解释',judge:'判断题',short:'简答题',essay:'论述题',case:'案例分析题'};
    const scoringDetail = list.some(question => question.scoreSource) ? `<div class="practice-scoring-detail" aria-label="本卷计分明细">${Object.keys(practiceScoring).map(type => {
      const entries = list.filter(question => question.type === type && hasScore(question));
      const scores = [...new Set(entries.map(question => question.score))];
      const total = entries.reduce((sum,question) => sum + question.score,0);
      return entries.length ? `<span>${scoringLabels[type]} <strong>${scores.length === 1 ? `${entries.length} × ${scores[0]} = ${total} 分` : `${entries.length} 题 · 合计 ${total} 分`}</strong></span>` : '';
    }).join('')}</div>` : '';
    return `<div class="page practice-page"><div class="page-heading practice-heading"><div><div class="eyebrow">${session.submitted ? 'UNDERSTAND & REVIEW' : demo ? 'DEMO PRACTICE' : 'FOCUS ON THE QUESTION'}</div><h1>${session.submitted ? '答题结果' : escape(session.title)}</h1><p>${demo ? '自编示范 · ' : ''}${list.length} 道题目 · ${list.some(hasScore) ? `满分 ${summary.maxScore} 分` : '客观题自动判对错'}${list.some(hasScore) && list.some(q => !hasScore(q)) ? ' · 部分题目未配置分值' : ''}${demo ? ' · 仅用于体验答题界面' : list.some(q=>q.scoreSource) ? ' · 按实际题数计分（标准卷 300 分）' : ''}</p></div></div>${scoringDetail}${session.submitted ? resultPage(list,summary) : `<div class="practice-workspace">${renderQuestionPanel(list,current,response)}${renderAnswerCard(list,summary)}</div>`}</div>`;
  }
  function resultPage(list, summary) {
    const objective = objectiveSummary(list,session.responses);
    const objectiveReviewed = objective.correct + objective.incorrect + objective.unanswered;
    const objectiveTotal = objectiveReviewed ? `${objective.correct}<span>/ ${objectiveReviewed} 题答对</span>` : '—<span>待核对答案</span>';
    const objectiveStats = objective.count ? `<div class="objective-result-stats" aria-label="客观题批改统计"><span>答对<strong>${objective.correct}</strong></span><span>答错<strong>${objective.incorrect}</strong></span><span>未答<strong>${objective.unanswered}</strong></span><span>待核对<strong>${objective.pending}</strong></span><span>正确率<strong>${objective.accuracy === null ? '—' : objective.accuracy + '%'}</strong></span></div>` : '';
    return `<section class="result-summary" aria-live="polite"><div><span class="content-label">${!list.some(hasScore) ? '客观题批改结果' : summary.pending ? '已评题目得分' : '本次得分'}</span><div class="total-score">${list.some(hasScore) ? `${summary.total}<span>/ ${summary.maxScore}</span>` : objectiveTotal}</div><p>${!list.some(hasScore) ? objective.pending ? `有 ${objective.pending} 道题的参考结论待核对，未强行判对错。` : '客观题已根据参考答案批改；未配置分值的题目仅判对错，不计入分数。' : summary.pending ? `还有 ${summary.pending} 道题待评分或核对，完成后显示完整总分。` : `已完成 ${list.filter(hasScore).length} 道题的评分。${list.some(immediateFor) ? '逐题反馈' : '统一批改'}，结果如下。${list.some(q => !hasScore(q)) ? '未配置分值的题目不计入分数。' : ''}`}</p></div><div class="result-summary-actions"><button class="button primary" data-practice-action="restart">重新练习${icon('arrow')}</button><a class="text-link" href="#/mistakes">前往错题集${icon('chevron')}</a></div></section>${objectiveStats}<div class="result-list">${list.map((question,index) => { const response=responseFor(question); return `<article class="result-question"><div class="result-question-heading"><span class="result-question-number">${String(index+1).padStart(2,'0')}</span><h2>${text(question.title)}</h2>${favoriteButton(question)}</div><div class="your-answer"><span class="content-label">你的作答</span><div class="reading-text">${answerText(question,response.answer)}</div></div>${feedback(question,response,true)}</article>`; }).join('')}</div>`;
  }
  function gradeAndRecord(question, response) {
    response.grade = gradeQuestion(question, response.answer);
    response.confirmed = true;
    record(question.id, response.answer, response.grade);
  }
  async function evaluate(question, response, activeSession) {
    if (pending.has(question.id)) return false;
    if (response.confirmed && ['graded','evaluated'].includes(response.grade?.status)) return true;
    if (!question.options?.length && isAnswered(response.answer) && gradeSubjective && hasScore(question) && question.answer) {
      pending.add(question.id); response.submissionLocked=true; delete response.error; save(); rerender();
      try {
        const grade = await gradeSubjective(question.id, response.answer, activeSession.id);
        if(session !== activeSession) return false;
        response.grade = grade; response.confirmed = true;
        record(question.id,response.answer,grade);
      } catch(error) { if(session===activeSession)response.error=error.message; return false; }
      finally { pending.delete(question.id); if(session===activeSession){save();rerender();} }
    } else gradeAndRecord(question,response);
    return true;
  }
  async function confirm(question,response) {
    const activeSession=session;
    session.responses[question.id]=response;
    if(question.options?.length)gradeAndRecord(question,response);
    else await evaluate(question,response,activeSession);
    if(session===activeSession){save();rerender();}
  }
  async function submit(list) {
    if(submitting || pending.size) {notify('请等待当前题目批改完成。');return;}
    submitting=true; const activeSession=session; rerender();
    let complete=true;
    for(const question of list) {
      if(session!==activeSession)break;
      const response=responseFor(question);session.responses[question.id]=response;
      if(!await evaluate(question,response,activeSession))complete=false;
    }
    submitting=false;
    if(session!==activeSession)return;
    if(complete)session.submitted=true;
    else {session.index=list.findIndex(q=>session.responses[q.id]?.error);notify('部分题目批改未完成，作答已保存，请重试。');}
    save();rerender();window.scrollTo({top:0,behavior:'instant'});
  }
  function handleClick(button) {
    if (!session || !button?.dataset.practiceAction) return false;
    const action = button.dataset.practiceAction;
    const list = questions();
    const question = list[session.index];
    const response = responseFor(question);
    if (action === 'reveal-answer') {
      response.answerRevealed = !response.answerRevealed;
      session.responses[question.id] = response; save(); rerender();
      document.querySelector('[data-practice-action="reveal-answer"]')?.focus({preventScroll:true});
    } else if (action === 'goto' || action === 'previous' || action === 'next') {
      session.index = action === 'goto' ? Number(button.dataset.index) : Math.max(0, Math.min(list.length-1, session.index + (action === 'next' ? 1 : -1)));
      save(); rerender(); window.scrollTo({top:0,behavior:'instant'});
    } else if (action === 'confirm') {
      if (!isAnswered(response.answer)) { document.getElementById('practice-inline-message').textContent='先写下你的答案，再确认本题。'; return true; }
      if (!pending.has(question.id) && !submitting) void confirm(question,response);
    } else if (action === 'submit') {
      void submit(list);
    } else if (action === 'self-grade') {
      const question = find(button.dataset.questionId);
      const response = responseFor(question);
      const input = document.getElementById(`self-score-${question.id}`);
      const result = selfGrade(response.grade, input.value);
      if (!result) { input.setCustomValidity(`请输入 0 到 ${question.score} 之间的分数。`); input.reportValidity(); input.setCustomValidity(''); return true; }
      response.grade=result; session.responses[question.id]=response;
      record(question.id,response.answer,result); save(); rerender();
    } else if (action === 'restart') start(session.ids,session.title,session.source,false);
    return true;
  }
  function handleInput(target) {
    if (!session || session.submitted || !target.matches('[data-practice-answer], [name="practice-answer"]')) return false;
    const question=questions()[session.index];
    const response=responseFor(question);
    if(response.confirmed || response.selectionLocked || response.submissionLocked || pending.has(question.id) || submitting) return true;
    response.answer=question.format==='multiple' ? [...document.querySelectorAll('[name="practice-answer"]:checked')].map(input=>input.value) : target.value;
    response.confirmed=false; delete response.grade;
    if (isJudgment(question)) {
      response.selectionLocked=true;
      session.responses[question.id]=response; save(); rerender();
      const focusTarget = '.question-confirm-row button';
      document.querySelector(focusTarget)?.focus({preventScroll:true});
      return true;
    }
    session.responses[question.id]=response; save();
    document.getElementById('question-feedback').innerHTML='';
    document.getElementById('answer-confirmed').textContent='';
    document.getElementById('practice-inline-message').textContent='';
    document.querySelector('[data-practice-action="confirm"]').innerHTML='确认本题'+icon('check');
    document.querySelectorAll('.answer-option').forEach(label=>label.classList.toggle('selected',label.querySelector('input').checked));
    const currentButton=document.querySelector('.answer-card-question.current');
    if(currentButton) {currentButton.classList.remove('confirmed');currentButton.classList.toggle('answered',isAnswered(response.answer));currentButton.setAttribute('aria-label',currentButton.dataset.baseLabel+(isAnswered(response.answer)?'，已作答':''));}
    const total = summarize(questions(),session.responses);
    document.querySelectorAll('[data-answer-count]').forEach(element=>element.textContent=`${total.answered} / ${total.count}`);
    return true;
  }
  function setImmediate(value) {
    if (!session || session.submitted) return;
    session.immediate=value;
    session.immediateOverride=value;
    if(value) for(const question of questions()) {
      const response=responseFor(question);
      if(response.confirmed && question.options?.length && (!response.grade || response.grade.status === 'unconfigured')) { gradeAndRecord(question,response); session.responses[question.id]=response; }
    }
    save(); rerender();
  }
  function refreshFromStorage() {
    if(pending.size||submitting)return false;
    try {const saved=JSON.parse(sessionStorage.getItem('guanzhi:practice')||'null');if(saved?.version!==1||!Array.isArray(saved.ids)||!saved.ids.length||saved.ids.some(id=>!find(id))||!saved.responses)return false;session=saved;session.index=Math.max(0,Math.min(session.ids.length-1,Number(session.index)||0));return true;}catch{return false;}
  }
  return { isBusy:()=>pending.size>0||submitting, refreshFromStorage, start, render, handleClick, handleInput, setImmediate, source:()=>session?.source || 'mock' };
}
