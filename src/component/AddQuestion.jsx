import { useEffect, useRef, useState, useCallback } from 'react';
import { log, error as logError } from '../utils/logger';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRotateLeft } from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2';

import { useAddQuestionState } from './AddQuestion/useAddQuestionState';
import { useQuestionBank } from './AddQuestion/useQuestionBank';
import { useImportQuestions } from './AddQuestion/useImportQuestions';
import { btnPrimary, btnSecondary, SWAL_THEME } from './AddQuestion/constants';
import ImportQuestionsModal from './AddQuestion/ImportQuestionsModal';
import QuestionBankPanel from './AddQuestion/QuestionBankPanel';
import AddedQuestionsPanel from './AddQuestion/AddedQuestionsPanel';

const AddQuestion = ({
  onBack,
  onNexts,
  onCreateMCQ,
  onCreateCoding,
  isEditing = false,
  editExamData = null,
  createExamRequest = null,
}) => {
  const isOverallTimedTest = createExamRequest?.exam?.timedTest || false;

  const {
    mcqQuestions,
    setMcqQuestions,
    codingQuestions,
    setCodingQuestions,
    sectionTimers,
    setSectionTimers,
  } = useAddQuestionState(isEditing, editExamData);

  const [isQuestionBankVisible, setIsQuestionBankVisible] = useState(true);
  const [bulkMcqScore, setBulkMcqScore] = useState({});
  const [bulkCodingScore, setBulkCodingScore] = useState('');
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const firstMcqBankRef = useRef(null);
  const codingBankRef = useRef(null);

  const bank = useQuestionBank(mcqQuestions, codingQuestions);
  const {
    fetchQuestions,
    setSourceQuestions,
    getBanksList,
    questionsInBank,
    paginatedQuestions,
    totalPages,
    addedIdsSet,
    addSelectedQuestions: bankAddSelectedQuestions,
    addRandomFromBank: bankAddRandomFromBank,
  } = bank;

  const importQuestions = useImportQuestions(fetchQuestions);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (bank.highlightBankFilter === 'mcq' && firstMcqBankRef.current) {
      firstMcqBankRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else if (bank.highlightBankFilter === 'coding' && codingBankRef.current) {
      codingBankRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [bank.highlightBankFilter]);

  const addSingleQuestion = useCallback(
    (q, type) => {
      if (!('score' in q)) q.score = 0;
      const exists = [...mcqQuestions, ...codingQuestions].some((x) => x.id === q.id);
      if (exists) return;
      if (type === 'mcq') {
        setMcqQuestions((prev) => [...prev, q]);
      } else {
        setCodingQuestions((prev) => [...prev, q]);
      }
      setSourceQuestions((prev) => {
        const next = prev.filter((x) => x.id !== q.id);
        if (next.length === 0) setIsQuestionBankVisible(false);
        return next;
      });
    },
    [mcqQuestions, codingQuestions, setMcqQuestions, setCodingQuestions, setSourceQuestions]
  );

  const addSelectedQuestions = useCallback(() => {
    const type = bank.activeBank === 'coding' ? 'coding' : 'mcq';
    const toAdd = questionsInBank.filter((q) => bank.selectedIds.has(q.id));
    toAdd.forEach((q) => addSingleQuestion(q, type));
    bank.clearSelection();
  }, [bank.activeBank, bank.selectedIds, questionsInBank, addSingleQuestion, bank.clearSelection]);

  const addRandomFromBank = useCallback(
    (count) => {
      if (bank.activeBank === null || count < 1) return;
      const type = bank.activeBank === 'coding' ? 'coding' : 'mcq';
      const n = Math.min(count, questionsInBank.length);
      if (n === 0) {
        Swal.fire({
          title: 'No questions',
          text: 'No questions available in this bank.',
          icon: 'info',
          ...SWAL_THEME,
        });
        return;
      }
      const shuffled = [...questionsInBank].sort(() => Math.random() - 0.5);
      shuffled.slice(0, n).forEach((q) => addSingleQuestion(q, type));
      bank.clearSelection();
      bank.setRandomCustomCount('');
    },
    [
      bank.activeBank,
      questionsInBank,
      addSingleQuestion,
      bank.clearSelection,
      bank.setRandomCustomCount,
    ]
  );

  const handleReturnQuestion = useCallback(
    (questionToReturn) => {
      if (questionToReturn.type === 'mcq') {
        setMcqQuestions((prev) => prev.filter((q) => q.id !== questionToReturn.id));
      } else if (questionToReturn.type === 'coding') {
        setCodingQuestions((prev) => prev.filter((q) => q.id !== questionToReturn.id));
      }
      setSourceQuestions((prev) => [...prev, questionToReturn]);
      setIsQuestionBankVisible(true);
    },
    [setMcqQuestions, setCodingQuestions, setSourceQuestions]
  );

  const handleRemoveSection = useCallback(
    (groupId) => {
      const toReturn = mcqQuestions.filter((q) => q.group_id === groupId);
      setMcqQuestions((prev) => prev.filter((q) => q.group_id !== groupId));
      setSourceQuestions((prev) => [...prev, ...toReturn]);
      setIsQuestionBankVisible(true);
    },
    [mcqQuestions, setMcqQuestions, setSourceQuestions]
  );

  const handleSetAllSectionScore = useCallback(
    (groupId, value) => {
      const num = parseInt(value, 10);
      if (Number.isNaN(num) || num < 0 || num > 10) return;
      setMcqQuestions((prev) =>
        prev.map((q) => (q.group_id === groupId ? { ...q, score: num } : q))
      );
    },
    [setMcqQuestions]
  );

  const handleSetAllCodingScore = useCallback(
    (value) => {
      const num = parseInt(value, 10);
      if (Number.isNaN(num) || num < 0 || num > 10) return;
      setCodingQuestions((prev) => prev.map((q) => ({ ...q, score: num })));
    },
    [setCodingQuestions]
  );

  const handleScoreChangeMcq = useCallback(
    (questionId, value) => {
      const num = parseInt(value, 10);
      const limited = Number.isNaN(num) ? 0 : Math.min(10, Math.max(0, num));
      setMcqQuestions((prev) =>
        prev.map((q) => (q.id === questionId ? { ...q, score: limited } : q))
      );
    },
    [setMcqQuestions]
  );

  const handleScoreChangeCoding = useCallback(
    (questionId, newScore) => {
      const limited = Math.min(10, Math.max(0, newScore));
      setCodingQuestions((prev) =>
        prev.map((q) => (q.id === questionId ? { ...q, score: limited } : q))
      );
    },
    [setCodingQuestions]
  );

  const handleTimerChange = useCallback((groupId, value) => {
    setSectionTimers((prev) => ({ ...prev, [groupId]: value }));
  }, [setSectionTimers]);

  const handleDragOver = useCallback((e) => e.preventDefault(), []);
  const handleDrop = useCallback(
    (e, type) => {
      e.preventDefault();
      try {
        const data = e.dataTransfer.getData('question');
        if (!data) return;
        const questionData = JSON.parse(data);
        if (questionData.type === type) addSingleQuestion(questionData, type);
      } catch (err) {
        logError('Drop parse error', err);
      }
    },
    [addSingleQuestion]
  );

  const handleNextButtonClick = useCallback(() => {
    onNexts();
  }, [onNexts]);

  const isNextDisabled = (() => {
    const hasNoQuestions = mcqQuestions.length === 0 && codingQuestions.length === 0;
    if (hasNoQuestions) return true;

    const allQs = [...mcqQuestions, ...codingQuestions];
    const hasZeroScore = allQs.some((q) => q.score === 0 || q.score == null);
    if (hasZeroScore) return true;

    if (!isOverallTimedTest) {
      const mcqSectionIds = [...new Set(mcqQuestions.map((q) => q.group_id))];
      const withoutTimer = mcqSectionIds.filter(
        (groupId) => !sectionTimers[groupId] || sectionTimers[groupId] === ''
      );
      if (withoutTimer.length > 0) return true;
    }

    return false;
  })();

  const disabledHint = (() => {
    if (!isNextDisabled) return '';

    const hasNoQuestions = mcqQuestions.length === 0 && codingQuestions.length === 0;
    if (hasNoQuestions) {
      return 'Add at least one MCQ or Coding question from the Question Bank.';
    }

    const allQs = [...mcqQuestions, ...codingQuestions];
    const firstZeroScore = allQs.find((q) => q.score === 0 || q.score == null);
    if (firstZeroScore) {
      const isMcq = mcqQuestions.some((q) => q.id === firstZeroScore.id);
      const typeLabel = isMcq ? 'MCQ' : 'Coding';
      const label = firstZeroScore.title || firstZeroScore.content || firstZeroScore.id;
      return `Set a non-zero score for ${typeLabel} question “${label}”.`;
    }

    if (!isOverallTimedTest) {
      const mcqSectionIds = [...new Set(mcqQuestions.map((q) => q.group_id))];
      const withoutTimer = mcqSectionIds.filter(
        (groupId) => !sectionTimers[groupId] || sectionTimers[groupId] === ''
      );
      if (withoutTimer.length > 0) {
        const firstGroupId = withoutTimer[0];
        const sectionName =
          mcqQuestions.find((q) => q.group_id === firstGroupId)?.title || 'this MCQ section';
        return `Set a timer for “${sectionName}” or enable overall timed test.`;
      }
    }

    return '';
  })();

  const [isNextHovered, setIsNextHovered] = useState(false);

  return (
    <div className="flex min-h-0 w-full flex-col overflow-x-hidden bg-[#282828] px-4 py-5 sm:px-6 md:pt-6 md:pb-8 md:px-8">
      <div className="flex w-full justify-center">
        <div className="w-full max-w-6xl min-w-0">
          <div className="pb-4 flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-xl font-semibold text-white sm:text-2xl">
              Add Questions
            </h2>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onCreateMCQ}
                className={btnPrimary}
              >
                Create MCQ
              </button>
              <button
                type="button"
                onClick={onCreateCoding}
                className={btnPrimary}
              >
                Create Coding
              </button>
              <button
                type="button"
                onClick={importQuestions.openImportPopup}
                className={btnSecondary}
              >
                Import MCQ / Coding
              </button>
              <span className="shrink-0 rounded-full bg-[#404040] px-3 py-1 text-sm text-gray-300">
                Step 2 of 3
              </span>
            </div>
          </div>

          {importQuestions.showImportPopup && (
            <ImportQuestionsModal
              onClose={importQuestions.closeImportPopup}
              onFileSelect={importQuestions.handleFileSelect}
              onFileSelection={importQuestions.handleFileSelection}
              downloadTemplate={importQuestions.downloadTemplate}
              importPendingFile={importQuestions.importPendingFile}
              importPendingType={importQuestions.importPendingType}
              onConfirmUpload={importQuestions.doImportUpload}
              onClearPending={() => {
                importQuestions.setImportPendingFile(null);
                importQuestions.setImportPendingType(null);
              }}
            />
          )}

          <QuestionBankPanel
            isLoading={bank.isLoading}
            isRefreshing={bank.isRefreshing}
            fetchQuestions={bank.fetchQuestions}
            isQuestionBankVisible={isQuestionBankVisible}
            activeBank={bank.activeBank}
            setActiveBank={bank.setActiveBank}
            bankSearchQuery={bank.bankSearchQuery}
            setBankSearchQuery={bank.setBankSearchQuery}
            bankPage={bank.bankPage}
            setBankPage={bank.setBankPage}
            selectedIds={bank.selectedIds}
            highlightBankFilter={bank.highlightBankFilter}
            setHighlightBankFilter={bank.setHighlightBankFilter}
            clearSelection={bank.clearSelection}
            getBanksList={bank.getBanksList}
            questionsInBank={questionsInBank}
            paginatedQuestions={paginatedQuestions}
            totalPages={totalPages}
            addedIdsSet={addedIdsSet}
            toggleQuestionSelection={bank.toggleQuestionSelection}
            selectAllOnPage={bank.selectAllOnPage}
            addSelectedQuestions={addSelectedQuestions}
            addRandomFromBank={addRandomFromBank}
            randomCustomCount={bank.randomCustomCount}
            setRandomCustomCount={bank.setRandomCustomCount}
            openBank={bank.openBank}
            firstMcqBankRef={firstMcqBankRef}
            codingBankRef={codingBankRef}
          />

          <AddedQuestionsPanel
            mcqQuestions={mcqQuestions}
            codingQuestions={codingQuestions}
            sectionTimers={sectionTimers}
            bulkMcqScore={bulkMcqScore}
            bulkCodingScore={bulkCodingScore}
            setBulkMcqScore={setBulkMcqScore}
            setBulkCodingScore={setBulkCodingScore}
            onSetAllSectionScore={handleSetAllSectionScore}
            onSetAllCodingScore={handleSetAllCodingScore}
            onScoreChangeMcq={handleScoreChangeMcq}
            onScoreChangeCoding={handleScoreChangeCoding}
            onReturnQuestion={handleReturnQuestion}
            onRemoveSection={handleRemoveSection}
            onTimerChange={handleTimerChange}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            isOverallTimedTest={isOverallTimedTest}
            windowWidth={windowWidth}
          />

          <div className="mt-8 flex items-center justify-between gap-4 border-t border-[#5a5a5a] pt-6">
            <button type="button" onClick={onBack} className={btnSecondary}>
              <FontAwesomeIcon icon={faRotateLeft} className="mr-2" /> Back
            </button>
            <span className="text-sm text-gray-400">Step 2 of 3</span>
            <div
              className="relative flex flex-col items-end"
              onMouseEnter={() => isNextDisabled && setIsNextHovered(true)}
              onMouseLeave={() => setIsNextHovered(false)}
            >
              {isNextDisabled && disabledHint && isNextHovered && (
                <div className="pointer-events-none absolute bottom-full right-0 z-20 mb-2 w-64 rounded-lg border border-amber-400/70 bg-black/95 px-3 py-2 text-xs leading-relaxed text-amber-100 shadow-xl">
                  <div className="absolute -bottom-1 right-6 h-2 w-2 rotate-45 border-b border-r border-amber-400/70 bg-black/95" />
                  {disabledHint}
                </div>
              )}
              <button
                type="button"
                onClick={handleNextButtonClick}
                disabled={isNextDisabled}
                className={`${btnPrimary} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

AddQuestion.propTypes = {
  onBack: PropTypes.func.isRequired,
  onNexts: PropTypes.func.isRequired,
  onCreateMCQ: PropTypes.func.isRequired,
  onCreateCoding: PropTypes.func.isRequired,
  isEditing: PropTypes.bool,
  editExamData: PropTypes.object,
  createExamRequest: PropTypes.object,
};

export default AddQuestion;
