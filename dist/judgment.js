// Generic objective-question helpers. Subject-specific answer keys belong in a site adapter.
export const isJudgment = question => question?.type === 'judge' || question?.format === 'boolean';
export function booleanChoice(value) {
  if (typeof value === 'boolean') return value ? 'T' : 'F';
  const token = String(value ?? '').normalize('NFKC').trim().toLowerCase();
  if (['t', 'true', '√', '✓', '正确', '对', '是', '1'].includes(token)) return 'T';
  if (['f', 'false', '×', '✗', '✕', 'x', '错误', '错', '否', '0'].includes(token)) return 'F';
  return null;
}
export function judgmentReference(question) {
  if (!isJudgment(question)) return null;
  const explicit = booleanChoice(question.correctAnswer);
  return explicit ? { value: explicit, method: '标准答案核对', evidence: '题目已录入的判断答案' } : null;
}
export function objectiveSummary(questions, responses) {
  const list = questions.filter(question => isJudgment(question) || question?.options?.length);
  const result = { count: list.length, correct: 0, incorrect: 0, unanswered: 0, pending: 0, accuracy: null };
  for (const question of list) {
    const response = responses[question.id];
    if (!response?.grade || typeof response.grade.correct !== 'boolean') result.pending++;
    else if (!response.answer || Array.isArray(response.answer) && !response.answer.length) result.unanswered++;
    else if (response.grade.correct) result.correct++;
    else result.incorrect++;
  }
  const reviewed = result.correct + result.incorrect + result.unanswered;
  if (reviewed) result.accuracy = Math.round(result.correct / reviewed * 100);
  return result;
}

