import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRefresh, faSearch, faPlus, faListCheck } from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2';
import { SWAL_THEME } from './constants';

export default function QuestionBankPanel({
  isLoading,
  isRefreshing,
  fetchQuestions,
  isQuestionBankVisible,
  activeBank,
  setActiveBank,
  bankSearchQuery,
  setBankSearchQuery,
  bankPage,
  setBankPage,
  selectedIds,
  highlightBankFilter,
  setHighlightBankFilter,
  clearSelection,
  getBanksList,
  questionsInBank,
  paginatedQuestions,
  totalPages,
  addedIdsSet,
  toggleQuestionSelection,
  selectAllOnPage,
  addSelectedQuestions,
  addRandomFromBank,
  randomCustomCount,
  setRandomCustomCount,
  openBank,
  firstMcqBankRef,
  codingBankRef,
}) {
  const banks = getBanksList();
  const isMcqBank = (b) => b.type === 'mcq';
  const isCodingBank = (b) => b.type === 'coding';
  const hasMcq = banks.some(isMcqBank);
  const hasCoding = banks.some(isCodingBank);

  const handleBackToBanks = () => {
    setActiveBank(null);
    setBankSearchQuery('');
    setBankPage(0);
    clearSelection();
  };

  const handleCustomRandom = () => {
    const num = parseInt(randomCustomCount, 10);
    if (!Number.isInteger(num) || num < 1) {
      Swal.fire({
        title: 'Invalid number',
        text: 'Enter a number (e.g. 40 or 50).',
        icon: 'warning',
        ...SWAL_THEME,
      });
      return;
    }
    addRandomFromBank(num);
  };

  return (
    <div className="rounded-xl border border-[#5a5a5a] bg-[#353535] overflow-hidden flex flex-col min-h-[50vh] max-h-[70vh]">
      <div className="flex shrink-0 items-center justify-between gap-2 px-4 py-3 bg-[#313131] border-b border-[#5a5a5a]">
        <h3 className="text-base font-semibold text-white">Question Bank</h3>
        <button
          type="button"
          onClick={fetchQuestions}
          disabled={isRefreshing}
          className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#3b82f6] hover:bg-[#2563eb] text-white disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors cursor-pointer"
          title="Refresh"
        >
          <FontAwesomeIcon icon={faRefresh} className={isRefreshing ? 'animate-spin' : ''} />
        </button>
      </div>
      <div className="bg-[#434343] rounded-b-xl flex-1 min-h-0 flex flex-col overflow-hidden p-4">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center min-h-[280px]">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full border-2 border-[#A294F9] border-t-transparent animate-spin" />
              <p className="text-sm text-gray-400">Loading question banks...</p>
            </div>
          </div>
        ) : !isQuestionBankVisible ? (
          <p className="text-gray-400 text-sm py-4">
            All questions have been added.
          </p>
        ) : activeBank === null ? (
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <p className="text-gray-400 text-sm mb-3 shrink-0">
              Choose a bank to search and add questions.
            </p>
            {banks.length === 0 ? (
              <p className="text-gray-500 text-sm py-4 shrink-0">
                No question banks yet. Use Create or Import to add questions, then refresh.
              </p>
            ) : (
              <>
                <div className="shrink-0 flex flex-wrap items-center gap-3 pb-6">
                  {hasMcq && (
                    <button
                      type="button"
                      onClick={() => setHighlightBankFilter((h) => (h === 'mcq' ? null : 'mcq'))}
                      className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${
                        highlightBankFilter === 'mcq'
                          ? 'bg-[#A294F9] text-white'
                          : 'border border-[#5a5a5a] bg-[#404040] text-gray-200 hover:bg-[#4a4a4a]'
                      }`}
                    >
                      MCQ
                    </button>
                  )}
                  {hasCoding && (
                    <button
                      type="button"
                      onClick={() =>
                        setHighlightBankFilter((h) => (h === 'coding' ? null : 'coding'))
                      }
                      className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${
                        highlightBankFilter === 'coding'
                          ? 'bg-[#3b82f6] text-white'
                          : 'border border-[#5a5a5a] bg-[#404040] text-gray-200 hover:bg-[#4a4a4a]'
                      }`}
                    >
                      Coding
                    </button>
                  )}
                </div>
                <div className="flex flex-col gap-3 overflow-y-auto min-h-0 flex-1 pr-1">
                  {banks.map((bank, index) => {
                    const mcqHighlight = isMcqBank(bank);
                    const codingHighlight = isCodingBank(bank);
                    const isHighlighted =
                      (highlightBankFilter === 'mcq' && mcqHighlight) ||
                      (highlightBankFilter === 'coding' && codingHighlight);
                    const isFirstMcq = mcqHighlight && banks.findIndex(isMcqBank) === index;
                    const isFirstCoding =
                      codingHighlight && banks.findIndex(isCodingBank) === index;
                    return (
                      <button
                        key={bank.id}
                        ref={
                          isFirstMcq ? firstMcqBankRef : isFirstCoding ? codingBankRef : undefined
                        }
                        type="button"
                        onClick={() => {
                          setHighlightBankFilter(null);
                          openBank(bank);
                        }}
                        className={`w-full text-left rounded-lg border px-4 py-3 flex items-center justify-between gap-2 transition-colors shrink-0 ${
                          isHighlighted
                            ? 'border-[#A294F9] bg-[#4a4a6a] ring-2 ring-[#A294F9]/50'
                            : 'border-[#5a5a5a] bg-[#404040] hover:bg-[#4a4a4a] hover:border-[#A294F9]/50'
                        }`}
                      >
                        <span className="font-medium text-white truncate flex-1 min-w-0">{bank.label}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-gray-400 text-sm tabular-nums text-center w-[7rem]">
                            {bank.count} questions
                          </span>
                          <FontAwesomeIcon icon={faPlus} className="text-[#A294F9] w-4 h-4 shrink-0" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="flex flex-col flex-1 min-h-0 overflow-x-auto">
            <div className="shrink-0 flex items-center gap-2 py-1">
              <button
                type="button"
                onClick={handleBackToBanks}
                className="text-white hover:text-white text-sm cursor-pointer"
              >
                ← Back to banks
              </button>
            </div>
            <div className="shrink-0 relative py-1">
              <FontAwesomeIcon
                icon={faSearch}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4"
              />
              <input
                type="text"
                placeholder="Search by title or content..."
                value={bankSearchQuery}
                onChange={(e) => {
                  setBankSearchQuery(e.target.value);
                  setBankPage(0);
                }}
                className="w-full rounded-lg border border-[#5a5a5a] bg-[#404040] pl-9 pr-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-[#A294F9] focus:ring-1 focus:ring-[#A294F9] outline-none"
              />
            </div>
            <div className="shrink-0 flex flex-wrap items-center gap-2 py-1">
              <button
                type="button"
                onClick={addSelectedQuestions}
                disabled={selectedIds.size === 0}
                className="flex items-center gap-1.5 rounded-lg bg-[#22c55e] hover:bg-[#16a34a] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-3 py-1.5 cursor-pointer"
              >
                <FontAwesomeIcon icon={faListCheck} /> Add selected ({selectedIds.size})
              </button>
              <button
                type="button"
                onClick={selectAllOnPage}
                className="rounded-lg border border-[#5a5a5a] bg-[#404040] text-gray-300 text-sm px-3 py-1.5 hover:bg-[#4a4a4a] cursor-pointer"
              >
                Select all on page
              </button>
              {selectedIds.size > 0 && (
                <button
                  type="button"
                  onClick={clearSelection}
                  className="text-red-400 hover:text-white text-sm cursor-pointer"
                >
                  Clear selection
                </button>
              )}
              <span className="text-gray-500 text-sm ml-auto">or add random:</span>
              {[5, 10, 20].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => addRandomFromBank(n)}
                  className="rounded-lg bg-[#A294F9] hover:bg-[#8E5DAF] text-white text-sm font-medium px-2.5 py-1 cursor-pointer"
                >
                  +{n}
                </button>
              ))}
              <span className="text-gray-500 text-sm">or</span>
              <input
                type="number"
                min={1}
                max={questionsInBank.length || 9999}
                placeholder="e.g. 40"
                value={randomCustomCount}
                onChange={(e) =>
                  setRandomCustomCount(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))
                }
                className="w-16 rounded-lg border border-[#5a5a5a] bg-[#404040] px-2 py-1 text-sm text-white placeholder:text-gray-500 focus:border-[#A294F9] focus:ring-1 focus:ring-[#A294F9] outline-none"
              />
              <button
                type="button"
                onClick={handleCustomRandom}
                className="rounded-lg bg-[#A294F9] hover:bg-[#8E5DAF] text-white text-sm font-medium px-2.5 py-1 cursor-pointer"
              >
                Add random
              </button>
            </div>
            <p className="shrink-0 text-xs text-gray-500 mb-2">
              Showing {questionsInBank.length} available (excluding already added). Page {bankPage + 1}{' '}
              of {totalPages}
            </p>
            <div className="flex flex-col gap-3 overflow-y-auto min-h-0 flex-1 pr-1">
              {paginatedQuestions.map((q) => {
                const isAdded = addedIdsSet.has(q.id);
                const isSelected = selectedIds.has(q.id);
                return (
                  <label
                    key={q.id}
                    className={`flex items-start gap-2 rounded-lg border p-2 cursor-pointer transition-colors shrink-0 ${
                      isAdded
                        ? 'border-[#5a5a5a] bg-[#3a3a3a] opacity-70'
                        : isSelected
                        ? 'border-[#A294F9] bg-[#404040]'
                        : 'border-[#5a5a5a] bg-[#404040] hover:bg-[#4a4a4a]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleQuestionSelection(q.id)}
                      disabled={isAdded}
                      className="mt-1 rounded border-gray-500 text-[#A294F9] focus:ring-[#A294F9]"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-200 line-clamp-2">{q.content || 'No content'}</p>
                    </div>
                    {isAdded && (
                      <span className="text-xs text-gray-500 shrink-0">Added</span>
                    )}
                  </label>
                );
              })}
            </div>
            {totalPages > 1 && (
              <div className="shrink-0 flex items-center justify-between gap-2 mt-3 pt-3 border-t border-[#5a5a5a]">
                <button
                  type="button"
                  onClick={() => setBankPage((p) => Math.max(0, p - 1))}
                  disabled={bankPage === 0}
                  className="rounded-lg border border-[#5a5a5a] bg-[#404040] px-3 py-1.5 text-sm text-gray-300 disabled:opacity-50 cursor-pointer"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-400">
                  {bankPage + 1} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setBankPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={bankPage >= totalPages - 1}
                  className="rounded-lg border border-[#5a5a5a] bg-[#404040] px-3 py-1.5 text-sm text-gray-300 disabled:opacity-50 cursor-pointer"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
