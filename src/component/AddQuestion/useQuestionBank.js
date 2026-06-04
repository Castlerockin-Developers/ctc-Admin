import { useEffect, useState, useCallback } from 'react';
import { log, error as logError } from '../../utils/logger';
import { authFetch } from '../../scripts/AuthProvider';
import { BANK_PAGE_SIZE } from './constants';

/**
 * Question bank data and UX: fetch, banks list, open bank, search, pagination, selection.
 */
export function useQuestionBank(mcqQuestions, codingQuestions) {
  const [sourceQuestions, setSourceQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeBank, setActiveBank] = useState(null);
  const [bankSearchQuery, setBankSearchQuery] = useState('');
  const [bankPage, setBankPage] = useState(0);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [highlightBankFilter, setHighlightBankFilter] = useState(null);
  const [randomCustomCount, setRandomCustomCount] = useState('');

  const fetchQuestions = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setIsLoading(true);
      log('Fetching questions...');
      const response = await authFetch('/admin/questions/', { method: 'GET' });
      if (response.ok) {
        const data = await response.json();
        const questions = (data || []).map((q) => ({
          id: q.id,
          title: q.title,
          content: q.content,
          type: q.type,
          dataset: q.dataset,
          group_id: q.group_id,
        }));
        setSourceQuestions(questions);
      } else {
        logError('Failed to fetch questions:', response.statusText);
      }
    } catch (err) {
      logError('Error fetching questions:', err);
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
      setActiveBank(null);
      setBankSearchQuery('');
      setBankPage(0);
      setSelectedIds(new Set());
    }
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const uniqueSections = [...new Set(sourceQuestions.map((q) => q.group_id))];

  const getBanksList = useCallback(() => {
    const banks = [];
    uniqueSections.forEach((sectionId) => {
      const sectionQs = sourceQuestions.filter((q) => q.group_id === sectionId);
      const mcqQs = sectionQs.filter((q) => q.type === 'mcq');
      const puzzleQs = sectionQs.filter((q) => q.type === 'puzzle');
      if (puzzleQs.length > 0) {
        banks.push({
          id: sectionId,
          type: 'puzzle',
          label: `${puzzleQs[0].title || `Section ${sectionId}`} (Puzzle)`,
          count: puzzleQs.length,
        });
      }
      if (mcqQs.length > 0) {
        banks.push({
          id: sectionId,
          type: 'mcq',
          label: mcqQs[0].title || `Section ${sectionId}`,
          count: mcqQs.length,
        });
      }
    });
    const codingQs = sourceQuestions.filter((q) => q.type === 'coding');
    if (codingQs.length > 0) {
      banks.push({ id: 'coding', type: 'coding', label: 'Coding', count: codingQs.length });
    }
    return banks;
  }, [sourceQuestions, uniqueSections]);

  const addedIdsSet = new Set([
    ...mcqQuestions.map((x) => x.id),
    ...codingQuestions.map((x) => x.id),
  ]);

  const getQuestionsInActiveBank = useCallback(() => {
    if (activeBank === null) return [];
    let q;
    if (activeBank === 'coding') {
      q = sourceQuestions.filter((x) => x.type === 'coding');
    } else {
      const bankMeta = getBanksList().find((b) => b.id === activeBank);
      const bankType = bankMeta?.type || 'mcq';
      q = sourceQuestions.filter(
        (x) => x.group_id === activeBank && x.type === bankType,
      );
    }
    const available = q.filter((x) => !addedIdsSet.has(x.id));
    if (!bankSearchQuery.trim()) return available;
    const lower = bankSearchQuery.trim().toLowerCase();
    return available.filter(
      (x) =>
        (x.title || '').toLowerCase().includes(lower) ||
        (x.content || '').toLowerCase().includes(lower)
    );
  }, [activeBank, sourceQuestions, bankSearchQuery, addedIdsSet, getBanksList]);

  const questionsInBank = getQuestionsInActiveBank();
  const totalPages = Math.max(1, Math.ceil(questionsInBank.length / BANK_PAGE_SIZE));
  const paginatedQuestions = questionsInBank.slice(
    bankPage * BANK_PAGE_SIZE,
    (bankPage + 1) * BANK_PAGE_SIZE
  );

  const toggleQuestionSelection = useCallback((id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAllOnPage = useCallback(() => {
    const ids = paginatedQuestions.map((q) => q.id).filter((id) => !addedIdsSet.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      return next;
    });
  }, [paginatedQuestions, addedIdsSet]);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const openBank = useCallback((bank) => {
    setActiveBank(bank.id);
    setBankSearchQuery('');
    setBankPage(0);
    setSelectedIds(new Set());
  }, []);

  return {
    sourceQuestions,
    setSourceQuestions,
    isLoading,
    isRefreshing,
    fetchQuestions,
    activeBank,
    setActiveBank,
    bankSearchQuery,
    setBankSearchQuery,
    bankPage,
    setBankPage,
    selectedIds,
    setSelectedIds,
    clearSelection,
    highlightBankFilter,
    setHighlightBankFilter,
    getBanksList,
    questionsInBank,
    paginatedQuestions,
    totalPages,
    addedIdsSet,
    toggleQuestionSelection,
    selectAllOnPage,
    openBank,
    randomCustomCount,
    setRandomCustomCount,
  };
}
