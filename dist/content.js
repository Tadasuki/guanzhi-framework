/**
 * 观知框架的内容契约。
 *
 * 框架不内置科目、教材、原题或示范题。站点作者只需替换这里的数据，
 * UI、主题、答题、收藏、错题和云助手都会沿用同一套结构。
 */
export const siteContent = {
  name: '观知',
  subtitle: '让知识有迹可循',
  subject: '',
  textbooks: [],
  questions: [],
  papers: [],
  materials: [],
  examTracks: [],
};

export const questionTypes = [
  { id: 'term', label: '名词解释' },
  { id: 'short', label: '简答题' },
  { id: 'case', label: '案例分析' },
  { id: 'essay', label: '论述题' },
  { id: 'single', label: '单选题' },
  { id: 'multiple', label: '多选题' },
  { id: 'judge', label: '判断题' },
  { id: 'choice', label: '选择题' },
];

