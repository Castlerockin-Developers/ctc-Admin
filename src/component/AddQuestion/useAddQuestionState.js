import { useEffect, useState } from 'react';
import { log } from '../../utils/logger';

const loadFromSession = (key, fallback) => {
  try {
    const v = sessionStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
};

/**
 * Persisted state for added MCQ/Coding questions and section timers.
 * Handles edit-exam population and session storage sync.
 */
export function useAddQuestionState(isEditing, editExamData) {
  const [mcqQuestions, setMcqQuestions] = useState(() =>
    loadFromSession('mcqQuestions', [])
  );
  const [codingQuestions, setCodingQuestions] = useState(() =>
    loadFromSession('codingQuestions', [])
  );
  const [sectionTimers, setSectionTimers] = useState(() =>
    loadFromSession('sectionTimers', {})
  );

  useEffect(() => {
    if (!isEditing || !editExamData) return;
    log('AddQuestion edit data:', { isEditing, editExamData });

    if (editExamData.alloted_sections?.length > 0) {
      const mcqFromExam = [];
      const timersFromExam = {};

      editExamData.alloted_sections.forEach((section) => {
        if (section.questions?.length > 0) {
          section.questions.forEach((q) => {
            mcqFromExam.push({
              id: q.id,
              title: q.title || q.content,
              content: q.content,
              type: q.type || 'mcq',
              dataset: q.dataset,
              group_id: section.section,
              score: q.score ?? 0,
            });
          });
        } else {
          mcqFromExam.push({
            id: `section_${section.id}`,
            title: section.section_name || `Section ${section.id}`,
            content: `Section with ${section.no_of_question || 0} questions`,
            type: 'mcq',
            dataset: 'exam_section',
            group_id: section.section,
            score: 0,
            is_section_placeholder: true,
          });
        }

        // Backfill per-section timers when exam is not using a single overall timer.
        // AllotedSectionExamSerializer exposes `section_time` and `is_timed` per section.
        if (!editExamData.is_timed && section.is_timed && section.section_time) {
          timersFromExam[section.section] = section.section_time;
        }
      });

      setMcqQuestions(mcqFromExam);

      // Merge with any existing timers from session storage, giving precedence to API data.
      if (Object.keys(timersFromExam).length > 0) {
        setSectionTimers((prev) => ({ ...prev, ...timersFromExam }));
      }
    }

    if (editExamData.selected_coding_questions?.length > 0) {
      const codingFromExam = editExamData.selected_coding_questions.map((c) => ({
        id: c.id,
        title: c.question_name,
        content: c.statement,
        type: 'coding',
        score: c.score ?? 0,
      }));
      setCodingQuestions(codingFromExam);
    }
  }, [isEditing, editExamData]);

  useEffect(() => {
    sessionStorage.setItem('mcqQuestions', JSON.stringify(mcqQuestions));
  }, [mcqQuestions]);

  useEffect(() => {
    sessionStorage.setItem('codingQuestions', JSON.stringify(codingQuestions));
  }, [codingQuestions]);

  useEffect(() => {
    sessionStorage.setItem('sectionTimers', JSON.stringify(sectionTimers));
  }, [sectionTimers]);

  return {
    mcqQuestions,
    setMcqQuestions,
    codingQuestions,
    setCodingQuestions,
    sectionTimers,
    setSectionTimers,
  };
}
