import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowDown,
  faArrowUp,
  faImage,
  faPlus,
  faTrash,
} from '@fortawesome/free-solid-svg-icons';

const inputClass =
  'w-full rounded-lg border border-[#5a5a5a] bg-[#404040] px-3 py-2 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#A294F9] focus:border-transparent';
const labelClass = 'block text-sm font-medium text-gray-300 mb-1.5';
const btnSecondary =
  'rounded-lg border border-[#5a5a5a] bg-[#404040] text-gray-200 hover:bg-[#4a4a4a] px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer';

let blockIdCounter = 0;
export const newBlockId = () => {
  blockIdCounter += 1;
  return `block-${Date.now()}-${blockIdCounter}`;
};

export const createTextBlock = (content = '') => ({
  id: newBlockId(),
  type: 'text',
  content,
});

export const createImageBlock = (defaults = {}) => ({
  id: newBlockId(),
  type: 'image',
  url: defaults.url || '',
  preview: defaults.preview || '',
  pendingFile: defaults.pendingFile || null,
  width_pct: defaults.width_pct ?? 80,
  max_height_px: defaults.max_height_px ?? 220,
  align: defaults.align || 'center',
});

export function blocksToPayload(blocks, defaults = {}) {
  const normalized = (blocks || [])
    .map((block) => {
      if (block.type === 'text') {
        const content = (block.content || '').trim();
        if (!content) return null;
        return { type: 'text', content };
      }
      if (block.type === 'image' && block.url) {
        return {
          type: 'image',
          url: block.url,
          width_pct: Number(block.width_pct) || defaults.width_pct || 80,
          max_height_px: Number(block.max_height_px) || defaults.max_height_px || 220,
          align: block.align || 'center',
        };
      }
      return null;
    })
    .filter(Boolean);

  if (normalized.length === 0) return null;
  return { version: 1, blocks: normalized };
}

export default function BlockBuilder({
  blocks,
  setBlocks,
  defaultWidthPct = 80,
  defaultMaxHeightPx = 220,
  onUploadImage,
}) {
  const moveBlock = (index, direction) => {
    const next = [...blocks];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setBlocks(next);
  };

  const removeBlock = (index) => {
    setBlocks(blocks.filter((_, i) => i !== index));
  };

  const updateBlock = (index, patch) => {
    setBlocks(blocks.map((b, i) => (i === index ? { ...b, ...patch } : b)));
  };

  const handleImageFile = async (index, file) => {
    if (!file) return;
    const preview = URL.createObjectURL(file);
    updateBlock(index, { pendingFile: file, preview, url: '' });
    if (onUploadImage) {
      try {
        const url = await onUploadImage(file);
        updateBlock(index, { url, pendingFile: null, preview: url });
      } catch {
        updateBlock(index, { pendingFile: file, preview, url: '' });
      }
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={`${btnSecondary} flex items-center gap-1`}
          onClick={() => setBlocks([...blocks, createTextBlock()])}
        >
          <FontAwesomeIcon icon={faPlus} /> Text block
        </button>
        <button
          type="button"
          className={`${btnSecondary} flex items-center gap-1`}
          onClick={() =>
            setBlocks([
              ...blocks,
              createImageBlock({
                width_pct: defaultWidthPct,
                max_height_px: defaultMaxHeightPx,
              }),
            ])
          }
        >
          <FontAwesomeIcon icon={faImage} /> Image block
        </button>
      </div>

      {blocks.map((block, index) => (
        <div
          key={block.id}
          className="rounded-lg border border-[#5a5a5a] bg-[#404040] p-3 space-y-2"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-[#A294F9]">
              {block.type === 'text' ? 'Text' : 'Image'}
            </span>
            <div className="flex items-center gap-1">
              <button type="button" className={btnSecondary} onClick={() => moveBlock(index, -1)} aria-label="Move up">
                <FontAwesomeIcon icon={faArrowUp} />
              </button>
              <button type="button" className={btnSecondary} onClick={() => moveBlock(index, 1)} aria-label="Move down">
                <FontAwesomeIcon icon={faArrowDown} />
              </button>
              <button type="button" className={btnSecondary} onClick={() => removeBlock(index)} aria-label="Remove">
                <FontAwesomeIcon icon={faTrash} />
              </button>
            </div>
          </div>

          {block.type === 'text' ? (
            <textarea
              value={block.content}
              onChange={(e) => updateBlock(index, { content: e.target.value })}
              placeholder="Enter text…"
              className={`${inputClass} min-h-[72px] resize-y text-sm`}
            />
          ) : (
            <>
              <div>
                <label className={labelClass}>Upload image</label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={(e) => handleImageFile(index, e.target.files?.[0])}
                  className="text-xs text-gray-400 file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-[#5a5a5a] file:text-white file:cursor-pointer cursor-pointer"
                />
              </div>
              {(block.preview || block.url) && (
                <img
                  src={block.preview || block.url}
                  alt={`Block ${index + 1}`}
                  className="max-w-full max-h-40 rounded border border-[#5a5a5a] object-contain"
                />
              )}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className={labelClass}>Width %</label>
                  <input
                    type="number"
                    min={20}
                    max={100}
                    value={block.width_pct}
                    onChange={(e) => updateBlock(index, { width_pct: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Max height (px)</label>
                  <input
                    type="number"
                    min={80}
                    max={400}
                    value={block.max_height_px}
                    onChange={(e) => updateBlock(index, { max_height_px: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Align</label>
                  <select
                    value={block.align}
                    onChange={(e) => updateBlock(index, { align: e.target.value })}
                    className={inputClass}
                  >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                </div>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
