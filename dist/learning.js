import { isJudgment, booleanChoice, judgmentReference } from './judgment.js';

// Pure scoring and collection rules. Content and grading criteria come from content.js.
export const themes = [
  { id: 'sage', name: '护眼绿', color: '#245d50', tint: '#e5eddf' },
  { id: 'mist', name: '雾蓝', color: '#466f8b', tint: '#e2ebf1' },
  { id: 'lilac', name: '丁香紫', color: '#78658e', tint: '#ede7f2' },
  { id: 'apricot', name: '暖杏', color: '#8b6743', tint: '#f2e9db' },
  { id: 'rose', name: '浅玫瑰', color: '#8e6271', tint: '#f2e5e9' },
  { id: 'slate', name: '岩灰', color: '#616d78', tint: '#e7eaed' },
];
export function sanitizePreferences(value = {}) {
  return {
    fontSize: ['standard', 'comfort', 'large'].includes(value?.fontSize) ? value.fontSize : 'standard',
    expandChapters: value?.expandChapters === true,
    theme: themes.some(theme => theme.id === value?.theme) ? value.theme : 'sage',
    appearance: ['light', 'dark', 'system'].includes(value?.appearance) ? value.appearance : 'light',
  };
}
export function sanitizeLearning(value = {}) {
  return {
    favorites: Array.isArray(value?.favorites) ? [...new Set(value.favorites.filter(id => typeof id === 'string'))] : [],
    mistakes: Array.isArray(value?.mistakes) ? value.mistakes.filter(item => item && typeof item.questionId === 'string' && ((Number.isFinite(item.score) && Number.isFinite(item.maxScore) && item.maxScore > 0 && item.score >= 0 && item.score <= item.maxScore) || (item.status === 'evaluated' && typeof item.correct === 'boolean'))) : [],
  };
}
export function toggleFavorite(state, id) {
  return { ...state, favorites: state.favorites.includes(id) ? state.favorites.filter(item => item !== id) : [...state.favorites, id] };
}
export function recordOutcome(state, questionId, answer, grade) {
  const evaluated = grade.status === 'evaluated' && typeof grade.correct === 'boolean';
  if (!evaluated && (grade.status !== 'graded' || !Number.isFinite(grade.score))) return state;
  const previous = state.mistakes.find(item => item.questionId === questionId);
  const resolved = evaluated ? grade.correct : grade.score === grade.maxScore;
  if (resolved && !previous) return state;
  const entry = { questionId, answer, score: grade.score, maxScore: grade.maxScore, method: grade.method, resolved, ...(evaluated ? {status:'evaluated',correct:grade.correct} : {}) };
  return { ...state, mistakes: [...state.mistakes.filter(item => item.questionId !== questionId), entry] };
}
const normalize = value => String(value ?? '').normalize('NFKC').toLowerCase().replace(/[\s\p{P}\p{S}]/gu, '');
const rounded = value => Math.round(value * 100) / 100;
export function hasScore(question) { return typeof question.score === 'number' && Number.isFinite(question.score) && question.score > 0; }
export function isAnswered(answer) { return Array.isArray(answer) ? answer.length > 0 : Boolean(String(answer ?? '').trim()); }
export function gradeQuestion(question, answer) {
  const judgment = isJudgment(question);
  const objective = judgment || Boolean(question.options?.length) || (question.correctAnswer !== undefined && question.correctAnswer !== null);
  if (objective) {
    const reference = judgment ? judgmentReference(question) : question.correctAnswer !== undefined && question.correctAnswer !== null ? {value:question.correctAnswer,method:'标准答案核对'} : null;
    if (!reference) return {status:'needs-review',score:null,maxScore:hasScore(question) ? question.score : null,method:'答案待核对',points:[],reason:'参考答案没有明确、可靠的对错结论，请核对后再批改。'};
    const answered = isAnswered(answer);
    const expected = Array.isArray(reference.value) ? [...reference.value].map(String).sort() : [String(reference.value)];
    const actual = judgment ? [booleanChoice(answer)] : Array.isArray(answer) ? [...answer].map(String).sort() : [String(answer ?? '').trim()];
    const correct = answered && expected.length === actual.length && expected.every((item,index) => actual[index] !== null && normalize(item) === normalize(actual[index]));
    return { status:hasScore(question) ? 'graded' : 'evaluated',score:hasScore(question) ? correct ? question.score : 0 : null,maxScore:hasScore(question) ? question.score : null,correct,expectedAnswer:reference.value,evidence:reference.evidence || '',unanswered:!answered,method:reference.method,points:[] };
  }
  if (!hasScore(question)) return { status: 'unconfigured', score: null, maxScore: null, method: '分值待补充', points: [] };
  const maxScore = question.score;
  if (!isAnswered(answer)) return { status: 'graded', score: 0, maxScore, method: '未作答', points: [] };
  const rubric = question.grading?.points;
  if (Array.isArray(rubric) && rubric.length && rubric.every(point => Number.isFinite(point.score) && point.score > 0 && Array.isArray(point.keywords) && point.keywords.some(word => normalize(word)))) {
    const sum = rounded(rubric.reduce((total, point) => total + point.score, 0));
    if (sum !== maxScore) return { status: 'needs-review', score: null, maxScore, method: '对照答案自评', points: [], reason: '评分要点分值与满分不一致，请对照教材自评。' };
    const response = normalize(Array.isArray(answer) ? answer.join(' ') : answer);
    const points = rubric.map(point => {
      const keywords = point.keywords.map(normalize).filter(Boolean);
      const matched = point.requireAll ? keywords.every(word => response.includes(word)) : keywords.some(word => response.includes(word));
      return { text: point.text || point.keywords[0], score: matched ? point.score : 0, maxScore: point.score, matched };
    });
    return { status: 'graded', score: rounded(points.reduce((sum, point) => sum + point.score, 0)), maxScore, method: '要点匹配参考评分', points };
  }
  return { status: 'needs-review', score: null, maxScore, method: '对照答案自评', points: [], reason: '本题尚未录入评分要点，请依据教材答案填写自评分数。' };
}
export function selfGrade(grade, value) {
  if (!Number.isFinite(grade?.maxScore) || grade.maxScore <= 0 || value === '' || value === null || value === undefined || !Number.isFinite(Number(value)) || Number(value) < 0 || Number(value) > grade.maxScore) return null;
  return { ...grade, status: 'graded', score: rounded(Number(value)), method: '对照答案自评' };
}
export function summarize(questions, responses) {
  const grades = questions.map(question => responses[question.id]?.grade);
  return {
    total: rounded(grades.reduce((sum, grade) => sum + (grade?.status === 'graded' ? grade.score : 0), 0)),
    maxScore: rounded(questions.reduce((sum, question) => sum + (hasScore(question) ? question.score : 0), 0)),
    pending: grades.filter((grade, index) => hasScore(questions[index]) && grade?.status !== 'graded').length,
    answered: questions.filter(question => isAnswered(responses[question.id]?.answer)).length,
    count: questions.length,
  };
}
