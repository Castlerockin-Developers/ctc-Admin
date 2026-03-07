import { useState, useCallback } from 'react';
import { error as logError } from '../../utils/logger';
import Swal from 'sweetalert2';
import { authFetch } from '../../scripts/AuthProvider';
import { SWAL_THEME } from './constants';

/**
 * Import questions from Excel: modal state, file selection, upload, templates.
 */
export function useImportQuestions(fetchQuestions) {
  const [showImportPopup, setShowImportPopup] = useState(false);
  const [selectedQuestionType, setSelectedQuestionType] = useState(null);
  const [importPendingFile, setImportPendingFile] = useState(null);
  const [importPendingType, setImportPendingType] = useState(null);

  const closeImportPopup = useCallback(() => {
    setShowImportPopup(false);
    setImportPendingFile(null);
    setImportPendingType(null);
    const el = document.getElementById('excelFileInput');
    if (el) el.value = '';
  }, []);

  const getUserDetails = useCallback(async () => {
    try {
      const response = await authFetch('/getUserDetails/', { method: 'GET' });
      if (response.ok) return await response.json();
    } catch (e) {
      logError('Error fetching user details:', e);
    }
    return null;
  }, []);

  const downloadTemplate = useCallback(async (questionType) => {
    try {
      const response = await authFetch(
        `/download-question-template/?type=${questionType}`,
        { method: 'GET' }
      );
      if (!response.ok) throw new Error('Failed to download template');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${questionType}_question_template.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      logError('Error downloading template:', err);
      Swal.fire({
        title: 'Download Failed',
        text: 'Failed to download template. Please try again.',
        icon: 'error',
        ...SWAL_THEME,
      });
    }
  }, []);

  const handleFileSelect = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (!file) return;
      const ext = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      if (!['.xlsx', '.xls', '.csv'].includes(ext)) {
        Swal.fire({
          title: 'Invalid File Type',
          text: 'Please use an Excel (.xlsx, .xls) or CSV file.',
          icon: 'error',
          ...SWAL_THEME,
        });
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        Swal.fire({
          title: 'File Too Large',
          text: 'Please upload a file smaller than 10MB.',
          icon: 'error',
          ...SWAL_THEME,
        });
        return;
      }
      setImportPendingFile(file);
      setImportPendingType(selectedQuestionType);
    },
    [selectedQuestionType]
  );

  const doImportUpload = useCallback(async () => {
    if (!importPendingFile || !importPendingType) return;
    const file = importPendingFile;
    const questionType = importPendingType;
    try {
      Swal.fire({
        title: 'Uploading...',
        text: `Importing ${questionType.toUpperCase()} questions from ${file.name}`,
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => Swal.showLoading(),
        ...SWAL_THEME,
      });
      const formData = new FormData();
      formData.append('file', file);
      let orgId = '1';
      try {
        const userData = JSON.parse(localStorage.getItem('userdata') || '{}');
        if (userData.org_id || userData.org?.id) orgId = userData.org_id || userData.org.id;
        else {
          const details = await getUserDetails();
          if (details?.org) orgId = '1';
        }
      } catch (err) {
        logError('Error getting organization ID:', err);
      }
      formData.append('org_id', orgId);
      const response = await authFetch('/import-questions/', {
        method: 'POST',
        body: formData,
      });
      if (response.ok) {
        const result = await response.json();
        const msg = result.detail || 'Questions imported successfully!';
        Swal.fire({
          title: 'Success!',
          text: `${questionType.toUpperCase()} questions imported. ${msg}`,
          icon: 'success',
          ...SWAL_THEME,
          timer: 3000,
          showConfirmButton: false,
        });
        await fetchQuestions();
        closeImportPopup();
      } else {
        const errorData = await response.json();
        let errorMessage = errorData.detail || 'Upload failed';
        if (errorData.errors?.length) {
          errorMessage = `Import failed with ${errorData.errors.length} errors. Check your file format.`;
        }
        if (questionType === 'mcq')
          errorMessage +=
            '\n\nMCQ columns: kind, question, category, score, reason, answer_1…answer_4_is_correct';
        else if (questionType === 'coding')
          errorMessage +=
            '\n\nCoding columns: kind, coding_name, score, short_desc, statement, input, expected_output';
        throw new Error(errorMessage);
      }
    } catch (err) {
      logError('Error uploading file:', err);
      Swal.fire({
        title: 'Upload Failed',
        text: err.message || 'Check the file format and try again.',
        icon: 'error',
        ...SWAL_THEME,
      });
    } finally {
      setImportPendingFile(null);
      setImportPendingType(null);
    }
  }, [importPendingFile, importPendingType, getUserDetails, fetchQuestions, closeImportPopup]);

  const handleFileSelection = useCallback((questionType) => {
    setSelectedQuestionType(questionType);
    setImportPendingFile(null);
    setImportPendingType(null);
    document.getElementById('excelFileInput')?.click();
  }, []);

  const openImportPopup = useCallback(() => setShowImportPopup(true), []);

  return {
    showImportPopup,
    openImportPopup,
    closeImportPopup,
    selectedQuestionType,
    importPendingFile,
    importPendingType,
    setImportPendingFile,
    setImportPendingType,
    handleFileSelect,
    handleFileSelection,
    doImportUpload,
    downloadTemplate,
  };
}
