import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock } from '@fortawesome/free-solid-svg-icons';
import { cardHead, cardBody } from './constants';

function truncateTitle(title, wordLimit = 5) {
  const words = title.split(' ');
  return words.length > wordLimit
    ? `${words.slice(0, wordLimit).join(' ')}...`
    : title;
}

export default function AddedQuestionsPanel({
  mcqQuestions,
  codingQuestions,
  sectionTimers,
  bulkMcqScore,
  bulkCodingScore,
  setBulkMcqScore,
  setBulkCodingScore,
  onSetAllSectionScore,
  onSetAllCodingScore,
  onScoreChangeMcq,
  onScoreChangeCoding,
  onReturnQuestion,
  onRemoveSection,
  onTimerChange,
  onDragOver,
  onDrop,
  isOverallTimedTest,
  windowWidth,
}) {
  return (
    <div className="flex flex-col gap-6 pt-4 pb-6 sm:pb-8">
      <h2 className="text-xl font-semibold text-white shrink-0">Added questions</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-w-0">
        {/* MCQ */}
        <div className="rounded-xl border border-[#5a5a5a] bg-[#353535] overflow-hidden flex flex-col min-h-0">
          <div className={cardHead}>
            <h3 className="text-base font-semibold text-white">MCQ</h3>
          </div>
          <div className={`${cardBody} space-y-2`}>
            {[...new Set(mcqQuestions.map((q) => q.group_id))].map((groupId) => {
              const sectionQs = mcqQuestions.filter((q) => q.group_id === groupId);
              const sectionName = sectionQs[0]?.title || 'Unnamed Section';
              const isSectionPlaceholder = sectionQs[0]?.is_section_placeholder;
              return (
                <details
                  key={groupId}
                  className="w-full rounded-lg border border-[#5a5a5a] bg-[#434343] overflow-hidden group"
                >
                  <summary className="w-full flex flex-col gap-4 px-4 py-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden text-sm text-white">
                    <div className="flex items-center justify-between gap-4 w-full">
                      <span className="font-medium text-base">{`${sectionName} — ${sectionQs.length} questions`}</span>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-4 w-full">
                      <label className="flex items-center gap-2 text-gray-400 shrink-0">
                        <span className="text-xs whitespace-nowrap">Timer (min)</span>
                        {isOverallTimedTest && (
                          <FontAwesomeIcon icon={faLock} className="h-3.5 w-4 text-gray-500" title="Section timer disabled (exam is overall timed)" />
                        )}
                        <input
                          type="number"
                          placeholder="—"
                          value={sectionTimers[groupId] || ''}
                          onChange={(e) => onTimerChange(groupId, e.target.value)}
                          disabled={isOverallTimedTest}
                          onClick={(e) => e.stopPropagation()}
                          className="w-20 rounded border border-[#5a5a5a] bg-[#404040] px-2 py-2 text-sm text-white placeholder:text-gray-500 disabled:opacity-60 disabled:cursor-not-allowed"
                        />
                      </label>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-gray-400 whitespace-nowrap">
                          Set all score
                        </span>
                        <input
                          type="number"
                          min={0}
                          max={10}
                          placeholder="0–10"
                          value={bulkMcqScore[groupId] ?? ''}
                          onChange={(e) =>
                            setBulkMcqScore((prev) => ({ ...prev, [groupId]: e.target.value }))
                          }
                          onClick={(e) => e.stopPropagation()}
                          className="w-14 rounded border border-[#5a5a5a] bg-[#404040] px-2 py-2 text-sm text-white text-center placeholder:text-gray-500"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onSetAllSectionScore(groupId, bulkMcqScore[groupId]);
                          }}
                          className="rounded-lg bg-[#A294F9] hover:bg-[#826fff] px-3 py-2 text-xs font-medium text-white cursor-pointer"
                        >
                          Apply
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onRemoveSection(groupId);
                        }}
                        className="rounded-lg bg-red-600 hover:bg-red-700 px-3 py-2 text-xs font-medium text-white shrink-0 cursor-pointer"
                      >
                        Remove section
                      </button>
                    </div>
                  </summary>
                  <div className="px-4 pb-4 pt-3 flex flex-col gap-3 border-t border-[#5a5a5a]">
                    {sectionQs.map((question, index) => (
                      <div
                        key={question.id}
                        className="rounded-lg border border-[#5a5a5a]/60 bg-[#3d3d3d] p-4 text-sm text-gray-300 flex flex-col gap-3"
                      >
                        <p className="text-gray-200 line-clamp-2">
                          {index + 1}. {question.content || 'No content'}
                        </p>
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                          <label className="flex items-center gap-2 text-xs text-gray-400">
                            Score
                            <input
                              type="number"
                              min={0}
                              max={10}
                              value={question.score ?? 0}
                              onChange={(e) =>
                                onScoreChangeMcq(question.id, e.target.value)
                              }
                              className="w-12 rounded border border-[#5a5a5a] bg-[#404040] px-2 py-1.5 text-sm text-white text-center"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() =>
                              onReturnQuestion({ ...question, type: 'mcq' })
                            }
                            className="rounded-lg bg-red-600/80 hover:bg-red-600 px-3 py-1.5 text-xs text-white cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                        {isSectionPlaceholder && (
                          <p className="text-xs text-blue-400">Section placeholder</p>
                        )}
                      </div>
                    ))}
                  </div>
                </details>
              );
            })}
            {mcqQuestions.length === 0 && (
              <div className="text-center text-gray-400 py-8">
                <p>No MCQ sections added yet.</p>
                <p className="text-sm mt-1">Add from Question Bank to get started.</p>
              </div>
            )}
          </div>
        </div>

        {/* Coding */}
        <div className="rounded-xl border border-[#5a5a5a] bg-[#353535] overflow-hidden flex flex-col min-h-0">
          <div className={cardHead}>
            <h3 className="text-base font-semibold text-white">Coding</h3>
          </div>
          <div
            className={`${cardBody} space-y-2`}
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, 'coding')}
          >
            {codingQuestions.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-4 w-full border-b border-[#5a5a5a]/50 pb-3 mb-2">
                <span className="text-xs text-gray-400">Set all score</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={10}
                    placeholder="0–10"
                    value={bulkCodingScore}
                    onChange={(e) => setBulkCodingScore(e.target.value)}
                    className="w-14 rounded border border-[#5a5a5a] bg-[#404040] px-2 py-2 text-sm text-white text-center placeholder:text-gray-500"
                  />
                  <button
                    type="button"
                    onClick={() => onSetAllCodingScore(bulkCodingScore)}
                    className="rounded-lg bg-[#A294F9] hover:bg-[#8E5DAF] px-3 py-2 text-xs font-medium text-white cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
            {codingQuestions.map((question) => (
              <details
                key={question.id}
                className="w-full rounded-lg border border-[#5a5a5a] bg-[#434343] overflow-hidden group"
              >
                <summary className="w-full flex flex-col gap-4 px-4 py-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden text-sm text-white">
                  <div className="flex items-center justify-between gap-4 w-full">
                    <span className="font-medium text-base truncate">
                      {windowWidth <= 1024
                        ? truncateTitle(question.title, 3)
                        : question.title}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-4 w-full">
                    <label className="flex items-center gap-2 text-gray-400 shrink-0">
                      <span className="text-xs whitespace-nowrap">Score</span>
                      <input
                        type="number"
                        min={0}
                        max={10}
                        value={question.score ?? 0}
                        onChange={(e) =>
                          onScoreChangeCoding(question.id, e.target.value)
                        }
                        onClick={(e) => e.stopPropagation()}
                        className="w-12 rounded border border-[#5a5a5a] bg-[#404040] px-2 py-2 text-sm text-white text-center"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onReturnQuestion({ ...question, type: 'coding' });
                      }}
                      className="rounded-lg bg-red-600 hover:bg-red-700 px-3 py-2 text-xs font-medium text-white shrink-0 cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </summary>
                <div className="px-4 pb-4 pt-3 border-t border-[#5a5a5a]">
                  <div className="rounded-lg border border-[#5a5a5a]/60 bg-[#3d3d3d] p-4 text-xs text-gray-400">
                    {question.content}
                  </div>
                </div>
              </details>
            ))}
            {codingQuestions.length === 0 && (
              <p className="text-center text-gray-400 py-6 text-sm">
                No coding questions added. Add from bank or drag here.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
