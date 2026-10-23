// Optional default scoring rules. A site can replace these with its own rules.
export const practiceScoring = {
  term: { score: 5, standardCount: 0 },
  judge: { score: 5, standardCount: 0 },
  single: { score: 5, standardCount: 0 },
  multiple: { score: 5, standardCount: 0 },
  short: { score: 10, standardCount: 0 },
  case: { score: 20, standardCount: 0 },
  essay: { score: 20, standardCount: 0 },
};
export const standardPaperScore = 0;
export function withPracticeScore(question) {
  const rule = practiceScoring[question?.type];
  return question?.score === undefined && rule?.standardCount ? { ...question, score: rule.score, scoreSource: '框架默认练习分值' } : question;
}

