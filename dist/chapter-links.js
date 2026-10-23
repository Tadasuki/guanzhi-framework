import { indexedTextbooks, questionIndex } from './chapter-index.js';

export function referencesFor(question) {
  return question?.chapterReferences || questionIndex[question?.id] || [];
}

export function chapterReferenceLabel(reference) {
  const book = indexedTextbooks.find(item => item.id === reference?.textbookId);
  const chapter = book?.chapters?.find(item => item.id === reference?.chapterId);
  if (!chapter) return reference?.label || '';
  return [book.title, chapter.number, chapter.title, ...(chapter.sections || []).filter(section => reference.sectionIds?.includes(section.id)).map(section => section.title)].filter(Boolean).join(' · ');
}

export function outlineHref(reference) {
  const target = reference?.sectionIds?.[0] || reference?.chapterId || '';
  return `#/outline?chapter=${encodeURIComponent(reference?.chapterId || '')}&target=${encodeURIComponent(target)}`;
}

export function pastQuestionHref(questionId) {
  return `#/past?question=${encodeURIComponent(questionId)}`;
}

