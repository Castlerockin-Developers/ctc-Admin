import React from 'react';
import { modalBase } from './constants';

export default function ImportQuestionsModal({
  onClose,
  onFileSelect,
  onFileSelection,
  downloadTemplate,
  importPendingFile,
  importPendingType,
  onConfirmUpload,
  onClearPending,
}) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className={`${modalBase} max-h-[90vh] overflow-y-auto max-w-lg`}>
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-white p-1 cursor-pointer"
          aria-label="Close"
        >
          ✕
        </button>
        <h2 className="text-lg font-semibold text-white mb-1">
          Import questions from Excel
        </h2>
        <p className="text-sm text-gray-400 mb-5">
          Use the templates below, fill in your data, then upload.
        </p>

        <div className="space-y-5">
          <div>
            <h3 className="text-sm font-medium text-[#A294F9] mb-2">
              Step 1 — Download template
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => downloadTemplate('mcq')}
                className="rounded-lg border border-[#5a5a5a] bg-[#353535] px-4 py-2.5 text-sm text-white hover:bg-[#404040] hover:border-[#A294F9] transition-colors cursor-pointer"
              >
                MCQ template
              </button>
              <button
                type="button"
                onClick={() => downloadTemplate('coding')}
                className="rounded-lg border border-[#5a5a5a] bg-[#353535] px-4 py-2.5 text-sm text-white hover:bg-[#404040] hover:border-[#A294F9] transition-colors cursor-pointer"
              >
                Coding template
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-[#A294F9] mb-2">
              Step 2 — Fill your file
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Accepted: .xlsx, .xls, .csv (max 10MB). MCQ: kind, question,
              category, score, reason, answer_1…answer_4_is_correct. Coding:
              kind, coding_name, score, short_desc, statement, input,
              expected_output.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-[#A294F9] mb-2">
              Step 3 — Select file & upload
            </h3>
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onFileSelection('mcq')}
                  className="rounded-lg bg-[#3b82f6] hover:bg-[#2563eb] text-white px-4 py-2.5 text-sm font-medium cursor-pointer"
                >
                  Choose MCQ file
                </button>
                <button
                  type="button"
                  onClick={() => onFileSelection('coding')}
                  className="rounded-lg bg-[#22c55e] hover:bg-[#16a34a] text-white px-4 py-2.5 text-sm font-medium cursor-pointer"
                >
                  Choose Coding file
                </button>
              </div>
              {importPendingFile && importPendingType && (
                <div className="rounded-lg border border-[#5a5a5a] bg-[#404040] px-4 py-3 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm text-gray-300 truncate">
                    <span className="text-[#A294F9] font-medium">
                      {importPendingType.toUpperCase()}
                    </span>
                    {' — '}
                    {importPendingFile.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={onConfirmUpload}
                      className="rounded-lg bg-[#A294F9] hover:bg-[#8E7AE6] text-white px-4 py-2 text-sm font-medium cursor-pointer"
                    >
                      Confirm & upload
                    </button>
                    <button
                      type="button"
                      onClick={onClearPending}
                      className="text-sm text-gray-400 hover:text-white cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <input
          type="file"
          accept=".xlsx, .xls, .csv"
          onChange={onFileSelect}
          id="excelFileInput"
          className="hidden"
        />
      </div>
    </div>
  );
}
