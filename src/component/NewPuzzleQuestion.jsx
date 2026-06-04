import React, { useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faPlus, faCheck, faTrash } from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2';
import { authFetch } from '../scripts/AuthProvider';
import BlockBuilder, {
  blocksToPayload,
  createImageBlock,
  createTextBlock,
} from './BlockBuilder';

const cardClass = 'rounded-xl border border-[#5a5a5a] bg-[#353535] overflow-hidden';
const inputClass =
  'w-full rounded-lg border border-[#5a5a5a] bg-[#404040] px-3 py-2.5 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#A294F9] focus:border-transparent';
const labelClass = 'block text-sm font-medium text-gray-300 mb-1.5';
const btnPrimary =
  'rounded-lg bg-[#A294F9] hover:bg-[#8E7AE6] text-white px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer';
const btnSecondary =
  'rounded-lg border border-[#5a5a5a] bg-[#404040] text-gray-200 hover:bg-[#4a4a4a] px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer';
const btnDanger =
  'rounded-lg bg-red-600/80 hover:bg-red-600 text-white px-3 py-1.5 text-xs font-medium cursor-pointer';

const SWAL_THEME = { background: '#181817', color: '#fff' };

const NewPuzzleQuestion = ({ onSave, onCancel }) => {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [questionBlocks, setQuestionBlocks] = useState([createTextBlock()]);
  const [previewMode, setPreviewMode] = useState('desktop');
  const [options, setOptions] = useState([
    {
      text: '',
      isCorrect: false,
      blocks: [createTextBlock()],
    },
  ]);

  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await authFetch('/admin/upload-image/', {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Image upload failed');
    }
    const data = await response.json();
    return data.image_url;
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await authFetch('/admin/sections/?type=puzzle', { method: 'GET' });
        if (response.ok) {
          const data = await response.json();
          setCategories(
            data.map((category) => ({
              id: category.id,
              name: category.name,
            })),
          );
        }
      } catch {
        // ignore
      }
    };
    fetchCategories();
  }, []);

  const addPuzzleSection = async () => {
    const { value: sectionName } = await Swal.fire({
      title: 'New puzzle section',
      input: 'text',
      inputPlaceholder: 'Section name',
      showCancelButton: true,
      confirmButtonText: 'Create',
      ...SWAL_THEME,
    });
    if (!sectionName?.trim()) return;
    try {
      const response = await authFetch('/admin/sections/', {
        method: 'POST',
        body: JSON.stringify({ title: sectionName.trim(), is_puzzle_section: true }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to create section');
      }
      const created = await response.json();
      const categoryObj = { id: created.id, name: created.name };
      setCategories((prev) => [...prev, categoryObj]);
      setSelectedCategory(String(categoryObj.id));
      Swal.fire({ icon: 'success', title: 'Puzzle section created', ...SWAL_THEME });
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Error', text: error.message, ...SWAL_THEME });
    }
  };

  const handleOptionChange = (index, field, value) => {
    setOptions((prev) =>
      prev.map((opt, i) => (i === index ? { ...opt, [field]: value } : opt)),
    );
  };

  const addOption = () => {
    setOptions((prev) => [...prev, { text: '', isCorrect: false, blocks: [createTextBlock()] }]);
  };

  const removeOption = (index) => {
    setOptions((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleCorrect = (index) => {
    setOptions((prev) =>
      prev.map((opt, i) => ({
        ...opt,
        isCorrect: i === index ? !opt.isCorrect : opt.isCorrect,
      })),
    );
  };

  const ensureBlockUrls = async (blocks) => {
    const next = [];
    for (const block of blocks) {
      if (block.type === 'image' && block.pendingFile && !block.url) {
        const url = await uploadImage(block.pendingFile);
        next.push({ ...block, url, pendingFile: null, preview: url });
      } else {
        next.push(block);
      }
    }
    return next;
  };

  const previewBlocks = useMemo(
    () => blocksToPayload(questionBlocks, { width_pct: 80, max_height_px: 220 }),
    [questionBlocks],
  );

  const handleSave = async () => {
    const resolvedQuestionBlocks = await ensureBlockUrls(questionBlocks);
    setQuestionBlocks(resolvedQuestionBlocks);

    const questionPayload = blocksToPayload(resolvedQuestionBlocks, {
      width_pct: 80,
      max_height_px: 220,
    });
    const fallbackQuestionText = resolvedQuestionBlocks
      .filter((b) => b.type === 'text')
      .map((b) => b.content)
      .join('\n')
      .trim();

    if (!selectedCategory) {
      Swal.fire({ icon: 'warning', title: 'Select a puzzle section', ...SWAL_THEME });
      return;
    }
    if (!questionPayload && !fallbackQuestionText) {
      Swal.fire({ icon: 'warning', title: 'Add question content', ...SWAL_THEME });
      return;
    }
    if (!options.some((o) => o.isCorrect)) {
      Swal.fire({ icon: 'warning', title: 'Mark one correct option', ...SWAL_THEME });
      return;
    }

    try {
      const resolvedOptions = [];
      for (const opt of options) {
        const resolvedBlocks = await ensureBlockUrls(opt.blocks || []);
        const payload = blocksToPayload(resolvedBlocks, { width_pct: 60, max_height_px: 120 });
        const textFallback = resolvedBlocks
          .filter((b) => b.type === 'text')
          .map((b) => b.content)
          .join('\n')
          .trim();
        if (!payload && !textFallback) {
          Swal.fire({ icon: 'warning', title: 'Each option needs text or an image', ...SWAL_THEME });
          return;
        }
        resolvedOptions.push({
          text: textFallback || opt.text || '',
          isCorrect: opt.isCorrect,
          content_blocks: payload,
        });
      }

      const response = await authFetch('/admin/puzzle-questions/', {
        method: 'POST',
        body: JSON.stringify({
          question: fallbackQuestionText,
          category: selectedCategory,
          score: 1,
          content_blocks: questionPayload,
          options: resolvedOptions,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Save failed');
      }

      Swal.fire({ icon: 'success', title: 'Puzzle question saved', iconColor: '#A294F9', ...SWAL_THEME }).then(
        () => onSave(),
      );
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Save failed', text: error.message, ...SWAL_THEME });
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-[#282828] rounded-lg overflow-hidden">
      <div className="shrink-0 flex items-center justify-between gap-4 px-4 py-3 border-b border-[#5a5a5a] bg-[#313131]">
        <button type="button" onClick={onCancel} className="flex items-center gap-2 text-gray-300 hover:text-white">
          <FontAwesomeIcon icon={faArrowLeft} /> Back
        </button>
        <h1 className="text-xl font-semibold text-white">Create Puzzle Question</h1>
        <div className="w-16" />
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className={cardClass}>
              <div className="px-4 py-3 border-b border-[#5a5a5a] bg-[#313131]">
                <h2 className="text-base font-semibold text-white">Puzzle section</h2>
              </div>
              <div className="p-4 flex flex-wrap items-center gap-3">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className={`${inputClass} max-w-xs`}
                >
                  <option value="">Select puzzle section</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <button type="button" onClick={addPuzzleSection} className={`${btnSecondary} flex items-center gap-2`}>
                  <FontAwesomeIcon icon={faPlus} /> New puzzle section
                </button>
              </div>
            </div>

            <div className={cardClass}>
              <div className="px-4 py-3 border-b border-[#5a5a5a] bg-[#313131]">
                <h2 className="text-base font-semibold text-white">Question blocks</h2>
              </div>
              <div className="p-4">
                <BlockBuilder
                  blocks={questionBlocks}
                  setBlocks={setQuestionBlocks}
                  defaultWidthPct={80}
                  defaultMaxHeightPx={220}
                  onUploadImage={uploadImage}
                />
              </div>
            </div>

            <div className={cardClass}>
              <div className="px-4 py-3 border-b border-[#5a5a5a] bg-[#313131] flex items-center justify-between">
                <h2 className="text-base font-semibold text-white">Options</h2>
                <button type="button" onClick={addOption} className={`${btnSecondary} flex items-center gap-2 text-sm`}>
                  <FontAwesomeIcon icon={faPlus} /> Add option
                </button>
              </div>
              <div className="p-4 space-y-4">
                {options.map((option, index) => (
                  <div key={index} className="rounded-lg border border-[#5a5a5a] bg-[#404040] p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-gray-300">Option {index + 1}</span>
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={option.isCorrect}
                            onChange={() => toggleCorrect(index)}
                            className="w-4 h-4 rounded border-2 border-[#A294F9]"
                          />
                          <FontAwesomeIcon icon={faCheck} className="text-green-500 w-3.5 h-3.5" />
                          Correct
                        </label>
                        {options.length > 1 && (
                          <button type="button" onClick={() => removeOption(index)} className={btnDanger}>
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        )}
                      </div>
                    </div>
                    <BlockBuilder
                      blocks={option.blocks}
                      setBlocks={(blocks) => handleOptionChange(index, 'blocks', blocks)}
                      defaultWidthPct={60}
                      defaultMaxHeightPx={120}
                      onUploadImage={uploadImage}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={handleSave} className={btnPrimary}>
                Save puzzle question
              </button>
              <button type="button" onClick={onCancel} className={btnSecondary}>
                Cancel
              </button>
            </div>
          </div>

          <div className={cardClass}>
            <div className="px-4 py-3 border-b border-[#5a5a5a] bg-[#313131] flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">Preview</h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  className={`${btnSecondary} ${previewMode === 'desktop' ? 'ring-2 ring-[#A294F9]' : ''}`}
                  onClick={() => setPreviewMode('desktop')}
                >
                  Desktop
                </button>
                <button
                  type="button"
                  className={`${btnSecondary} ${previewMode === 'mobile' ? 'ring-2 ring-[#A294F9]' : ''}`}
                  onClick={() => setPreviewMode('mobile')}
                >
                  Mobile
                </button>
              </div>
            </div>
            <div
              className={`p-4 mx-auto transition-all ${
                previewMode === 'mobile' ? 'max-w-[360px] border-x border-[#5a5a5a]' : 'max-w-full'
              }`}
            >
              <div className="space-y-3 text-white text-sm">
                {(previewBlocks?.blocks || []).map((block, idx) =>
                  block.type === 'text' ? (
                    <p key={idx} className="whitespace-pre-wrap">
                      {block.content}
                    </p>
                  ) : (
                    <img
                      key={idx}
                      src={block.url}
                      alt=""
                      style={{
                        width: `${block.width_pct || 80}%`,
                        maxHeight: `${block.max_height_px || 220}px`,
                        objectFit: 'contain',
                        display: 'block',
                        margin:
                          block.align === 'center'
                            ? '0 auto'
                            : block.align === 'right'
                              ? '0 0 0 auto'
                              : undefined,
                      }}
                    />
                  ),
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewPuzzleQuestion;
