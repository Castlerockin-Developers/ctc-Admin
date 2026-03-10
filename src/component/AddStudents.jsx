import React, { useEffect, useMemo, useState } from 'react';
import { log, error as logError } from '../utils/logger';
import Swal from 'sweetalert2';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRotateLeft, faSearch, faPlus, faUserPlus, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import { authFetch } from '../scripts/AuthProvider';

const STORAGE_KEYS = {
  allBranch: 'addStudents_allBranch',
  addedBranch: 'addStudents_addedBranch',
  addedList: 'addStudents_list',
};

const STUDENTS_PER_PAGE = 20;

/** Read added students from session (for initial state and when returning to step 3). */
function loadAddedStudentsFromSession() {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEYS.addedList);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    return (Array.isArray(parsed) ? parsed : []).map((item) => ({
      studentId: item.studentId ?? item.id,
      id: item.id,
      name: item.name,
      degree: item.degree || '',
      year: item.year || '',
      branch: item.branch,
    }));
  } catch {
    return [];
  }
}

function clearStep3Session() {
  Object.values(STORAGE_KEYS).forEach((key) => sessionStorage.removeItem(key));
  log('AddStudents - Step 3 session cleared (after submit or explicit clear)');
}
const SWAL_THEME = { background: '#181817', color: '#fff' };

const cardClass = 'rounded-xl border border-[#5a5a5a] bg-[#353535] overflow-hidden flex flex-col';
const cardHead = 'flex items-center justify-between gap-2 px-4 py-3 bg-[#313131] border-b border-[#5a5a5a]';
const inputClass = 'w-full rounded-lg border border-[#5a5a5a] bg-[#404040] px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#A294F9] focus:border-transparent';
const selectClass = 'rounded-lg border border-[#5a5a5a] bg-[#404040] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#A294F9] cursor-pointer';
const btnPrimary = 'rounded-lg bg-[#A294F9] hover:bg-[#8E7AE6] text-white px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';
const btnSecondary = 'rounded-lg border border-[#5a5a5a] bg-[#404040] text-gray-200 hover:bg-[#4a4a4a] px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer';
const btnSuccess = 'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer';
const btnDanger = 'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer';

const AddStudents = ({
  onBack,
  onSubmit,
  createExamRequest,
  isEditing = false,
  editExamData = null,
}) => {
  const [allStudents, setAllStudents] = useState([]);
  const [addedStudents, setAddedStudents] = useState(loadAddedStudentsFromSession);
  const [allBranchFilter, setAllBranchFilter] = useState(() =>
    typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(STORAGE_KEYS.allBranch) || '' : ''
  );
  const [addedBranchFilter, setAddedBranchFilter] = useState(() =>
    typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(STORAGE_KEYS.addedBranch) || '' : ''
  );
  const [allSearchQuery, setAllSearchQuery] = useState('');
  const [addedSearchQuery, setAddedSearchQuery] = useState('');
  const [allPage, setAllPage] = useState(1);
  const [addedPage, setAddedPage] = useState(1);
  const [isCreating, setIsCreating] = useState(false);

  const branches = useMemo(
    () => Array.from(new Set(allStudents.map((s) => s.branch))).filter(Boolean).sort(),
    [allStudents]
  );

  // Re-hydrate from session when returning to step 3 (non-edit) and fetch students list
  useEffect(() => {
    if (!isEditing) {
      setAddedStudents(loadAddedStudentsFromSession());
      setAllBranchFilter(sessionStorage.getItem(STORAGE_KEYS.allBranch) || '');
      setAddedBranchFilter(sessionStorage.getItem(STORAGE_KEYS.addedBranch) || '');
    }

    let cancelled = false;

    const mapStudent = (s, branchFallback = '') => ({
      studentId: s.id,
      id: s.usn || s.slNo || s.id,
      name: s.name || `${s.first_name || ''} ${s.last_name || ''}`.trim() || s.email || 'Unknown',
      degree: s.degree || '',
      year: s.year || '',
      branch: s.branch || s.group_name || branchFallback || '',
    });

    const loadStudents = async () => {
      try {
        // Try new paginated format first
        const baseParams = new URLSearchParams();
        baseParams.set('page', '1');
        baseParams.set('page_size', '200');
        const firstRes = await authFetch(`/admin/students/?${baseParams.toString()}`, { method: 'GET' });
        const firstData = await firstRes.json();

        let list = [];

        if (Array.isArray(firstData.results)) {
          const pageSize = firstData.results.length || 200;
          const totalCount = typeof firstData.count === 'number' ? firstData.count : firstData.results.length;
          const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

          firstData.results
            .filter((s) => s.usn || s.slNo || s.id)
            .forEach((s) => list.push(mapStudent(s)));

          // Fetch remaining pages if any
          for (let page = 2; page <= totalPages; page += 1) {
            const params = new URLSearchParams();
            params.set('page', String(page));
            params.set('page_size', String(pageSize));
            const res = await authFetch(`/admin/students/?${params.toString()}`, { method: 'GET' });
            const data = await res.json();
            if (Array.isArray(data.results)) {
              data.results
                .filter((s) => s.usn || s.slNo || s.id)
                .forEach((s) => list.push(mapStudent(s)));
            } else {
              break;
            }
          }
        } else if (firstData.data && typeof firstData.data === 'object') {
          // Fallback to legacy grouped response shape
          list = Object.keys(firstData.data).flatMap((branch) =>
            (firstData.data[branch] || [])
              .filter((s) => s.usn || s.slNo || s.id)
              .map((s) => mapStudent(s, branch))
          );
        }

        if (!cancelled) setAllStudents(list);
      } catch (e) {
        logError(e);
      }
    };

    loadStudents();

    return () => { cancelled = true; };
  }, [isEditing]);

  useEffect(() => {
    if (isEditing && editExamData) {
      const studentsData = editExamData.students || editExamData.user || [];
      if (studentsData?.length > 0) {
        const mapped = studentsData
          .map((s) => ({
            studentId: s.id,
            id: s.usn || s.slNo || s.id,
            name: s.name || `${s.first_name || ''} ${s.last_name || ''}`.trim() || 'Unknown',
            degree: s.degree || '',
            year: s.year || '',
            branch: s.branch || '',
          }))
          .filter((s) => s.name !== 'Unknown');
        setAddedStudents(mapped);
      } else {
        setAddedStudents([]);
      }
    }
  }, [isEditing, editExamData]);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEYS.addedList, JSON.stringify(addedStudents));
  }, [addedStudents]);
  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEYS.allBranch, allBranchFilter);
  }, [allBranchFilter]);
  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEYS.addedBranch, addedBranchFilter);
  }, [addedBranchFilter]);

  const filteredAll = useMemo(
    () =>
      allStudents.filter(
        (s) =>
          (!allBranchFilter || s.branch === allBranchFilter) &&
          !addedStudents.some((a) => a.studentId === s.studentId) &&
          (String(s.id ?? '').toLowerCase().includes(allSearchQuery.toLowerCase()) ||
            s.name?.toLowerCase().includes(allSearchQuery.toLowerCase()))
      ),
    [allStudents, addedStudents, allBranchFilter, allSearchQuery]
  );

  const filteredAdded = useMemo(
    () =>
      addedStudents.filter(
        (s) =>
          (!addedBranchFilter || s.branch === addedBranchFilter) &&
          (String(s.id ?? '').toLowerCase().includes(addedSearchQuery.toLowerCase()) ||
            s.name?.toLowerCase().includes(addedSearchQuery.toLowerCase()))
      ),
    [addedStudents, addedBranchFilter, addedSearchQuery]
  );

  const paginate = (data, page) => {
    const start = (page - 1) * STUDENTS_PER_PAGE;
    return data.slice(start, start + STUDENTS_PER_PAGE);
  };

  const totalAllPages = Math.max(1, Math.ceil(filteredAll.length / STUDENTS_PER_PAGE));
  const totalAddedPages = Math.max(1, Math.ceil(filteredAdded.length / STUDENTS_PER_PAGE));

  const addAll = () => {
    setAddedStudents((prev) => [...prev, ...filteredAll]);
    setAddedBranchFilter('');
    setAddedSearchQuery('');
    setAddedPage(1);
  };

  const addOne = (s) => {
    setAddedStudents((prev) =>
      prev.some((a) => a.studentId === s.studentId) ? prev : [...prev, s]
    );
  };

  const removeOne = (s) => {
    setAddedStudents((prev) => prev.filter((a) => a.studentId !== s.studentId));
  };

  const removeAll = () => {
    Swal.fire({
      title: 'Remove all students?',
      text: 'This will clear the added students list.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, remove all',
      cancelButtonText: 'Cancel',
      ...SWAL_THEME,
    }).then((result) => {
      if (result.isConfirmed) setAddedStudents([]);
    });
  };

  const createExam = async () => {
    if (!addedStudents.length) {
      return Swal.fire({
        title: 'No Students',
        text: 'Please add at least one student to proceed.',
        icon: 'error',
        ...SWAL_THEME,
      });
    }

    setIsCreating(true);
    const mcqQuestions = JSON.parse(sessionStorage.getItem('mcqQuestions') || '[]');
    const section_ids = [...new Set(mcqQuestions.map((q) => q.group_id))];
    const section_question_counts = {};
    section_ids.forEach((id) => {
      section_question_counts[id] = mcqQuestions.filter((q) => q.group_id === id).length;
    });
    const codingQuestions = JSON.parse(sessionStorage.getItem('codingQuestions') || '[]');
    const coding_question_ids = codingQuestions.map((q) => q.id);

    const payload = {
      ...createExamRequest,
      students: addedStudents.map((s) => s.studentId),
      section_ids,
      section_question_counts,
      coding_question_ids,
    };

    try {
      const url =
        isEditing && editExamData
          ? `/admin/exams/${editExamData.id}/`
          : '/admin/exams/create-exam/';
      const method = isEditing && editExamData ? 'PUT' : 'POST';
      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to save exam');
      }

      const actionText = isEditing ? 'Updated' : 'Created';
      await Swal.fire({
        title: `Test ${actionText}`,
        text: `Test has been ${actionText.toLowerCase()}.`,
        icon: 'success',
        confirmButtonText: 'OK',
        ...SWAL_THEME,
      });
      clearStep3Session();
      onSubmit();
    } catch (err) {
      logError('AddStudents - Error:', err);
      Swal.fire({
        title: 'Error',
        text: err.message,
        icon: 'error',
        confirmButtonText: 'OK',
        ...SWAL_THEME,
      });
    } finally {
      setIsCreating(false);
    }
  };

  const paginatedAll = paginate(filteredAll, allPage);
  const paginatedAdded = paginate(filteredAdded, addedPage);

  return (
    <div className="flex min-h-0 w-full flex-col overflow-x-hidden bg-[#282828] px-4 py-5 sm:px-6 md:py-6 md:px-8">
      <div className="flex w-full justify-center">
        <div className="w-full max-w-6xl min-w-0">
          {/* Header */}
          <div className="pb-4 flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-xl font-semibold text-white sm:text-2xl">Add Students</h2>
            <span className="shrink-0 rounded-full bg-[#404040] px-3 py-1 text-sm text-gray-300">
              Step 3 of 3
            </span>
          </div>

          {/* Two panels */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* All Students */}
            <div className={cardClass}>
              <div className={cardHead}>
                <h3 className="text-base font-semibold text-white">All Students</h3>
                <div className="flex items-center gap-2">
                  <select
                    value={allBranchFilter}
                    onChange={(e) => { setAllBranchFilter(e.target.value); setAllPage(1); }}
                    className={`${selectClass} max-w-[140px]`}
                  >
                    <option value="">All branches</option>
                    {branches.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                  <div className="relative min-w-[160px]">
                    <FontAwesomeIcon
                      icon={faSearch}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4 pointer-events-none"
                    />
                    <input
                      type="text"
                      placeholder="Search by USN or name..."
                      value={allSearchQuery}
                      onChange={(e) => { setAllSearchQuery(e.target.value); setAllPage(1); }}
                      className={`${inputClass} pl-9`}
                    />
                  </div>
                </div>
              </div>
              <div className="flex-1 min-h-0 flex flex-col p-4">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-sm text-gray-400">
                    {filteredAll.length} available
                  </span>
                  <button
                    type="button"
                    onClick={addAll}
                    disabled={filteredAll.length === 0}
                    className="flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-2 text-sm font-medium cursor-pointer"
                  >
                    <FontAwesomeIcon icon={faUserPlus} /> Add all
                  </button>
                </div>
                <div className="rounded-lg border border-[#5a5a5a] bg-[#404040] overflow-hidden flex-1 min-h-[200px] max-h-[40vh] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-[#313131] text-left text-gray-300 border-b border-[#5a5a5a]">
                      <tr>
                        <th className="px-3 py-2 font-medium">USN</th>
                        <th className="px-3 py-2 font-medium">Name</th>
                        <th className="px-3 py-2 font-medium">Branch</th>
                        <th className="px-3 py-2 w-24 min-w-[6rem]"></th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-200">
                      {paginatedAll.length ? (
                        paginatedAll.map((s) => (
                          <tr
                            key={s.studentId}
                            className="border-b border-[#5a5a5a]/50 hover:bg-[#4a4a4a]"
                          >
                            <td className="px-3 py-2 font-mono text-xs">{s.id}</td>
                            <td className="px-3 py-2 truncate max-w-[120px]" title={s.name}>{s.name}</td>
                            <td className="px-3 py-2 text-gray-400">{s.branch}</td>
                            <td className="px-3 py-2">
                              <button
                                type="button"
                                onClick={() => addOne(s)}
                                className={btnSuccess}
                              >
                                <FontAwesomeIcon icon={faPlus} className="shrink-0" /> Add
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-3 py-8 text-center text-gray-500">
                            No students found. Adjust filters or search.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {totalAllPages > 1 && (
                  <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-[#5a5a5a]">
                    <button
                      type="button"
                      disabled={allPage === 1}
                      onClick={() => setAllPage((p) => Math.max(1, p - 1))}
                      className="rounded-lg border border-[#5a5a5a] bg-[#404040] px-3 py-1.5 text-sm text-gray-300 disabled:opacity-50 cursor-pointer"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-gray-400">
                      Page {allPage} of {totalAllPages}
                    </span>
                    <button
                      type="button"
                      disabled={allPage >= totalAllPages}
                      onClick={() => setAllPage((p) => Math.min(totalAllPages, p + 1))}
                      className="rounded-lg border border-[#5a5a5a] bg-[#404040] px-3 py-1.5 text-sm text-gray-300 disabled:opacity-50 cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Added Students */}
            <div className={cardClass}>
              <div className={cardHead}>
                <h3 className="text-base font-semibold text-white">Added Students</h3>
                <div className="flex items-center gap-2">
                  <select
                    value={addedBranchFilter}
                    onChange={(e) => { setAddedBranchFilter(e.target.value); setAddedPage(1); }}
                    className={`${selectClass} max-w-[140px]`}
                  >
                    <option value="">All branches</option>
                    {branches.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                  <div className="relative min-w-[160px]">
                    <FontAwesomeIcon
                      icon={faSearch}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4 pointer-events-none"
                    />
                    <input
                      type="text"
                      placeholder="Search added..."
                      value={addedSearchQuery}
                      onChange={(e) => { setAddedSearchQuery(e.target.value); setAddedPage(1); }}
                      className={`${inputClass} pl-9`}
                    />
                  </div>
                </div>
              </div>
              <div className="flex-1 min-h-0 flex flex-col p-4">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-sm text-gray-400">
                    {addedStudents.length} added
                  </span>
                  <button
                    type="button"
                    onClick={removeAll}
                    disabled={addedStudents.length === 0}
                    className="flex items-center gap-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-2 text-sm font-medium cursor-pointer"
                  >
                    <FontAwesomeIcon icon={faTrashAlt} /> Remove all
                  </button>
                </div>
                <div className="rounded-lg border border-[#5a5a5a] bg-[#404040] overflow-hidden flex-1 min-h-[200px] max-h-[40vh] overflow-y-auto">
                  {filteredAdded.length ? (
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-[#313131] text-left text-gray-300 border-b border-[#5a5a5a]">
                        <tr>
                          <th className="px-3 py-2 font-medium">USN</th>
                          <th className="px-3 py-2 font-medium">Name</th>
                          <th className="px-3 py-2 font-medium">Branch</th>
                          <th className="px-3 py-2 w-24 min-w-[6rem]"></th>
                        </tr>
                      </thead>
                      <tbody className="text-gray-200">
                        {paginatedAdded.map((s) => (
                          <tr
                            key={s.studentId}
                            className="border-b border-[#5a5a5a]/50 hover:bg-[#4a4a4a]"
                          >
                            <td className="px-3 py-2 font-mono text-xs">{s.id}</td>
                            <td className="px-3 py-2 truncate max-w-[120px]" title={s.name}>{s.name}</td>
                            <td className="px-3 py-2 text-gray-400">{s.branch}</td>
                            <td className="px-3 py-2">
                              <button
                                type="button"
                                onClick={() => removeOne(s)}
                                className={btnDanger}
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="flex flex-col items-center justify-center min-h-[200px] text-gray-500 text-sm px-4 text-center">
                      <p>No students added yet.</p>
                      <p className="mt-1">Add students from the left panel to include them in the exam.</p>
                    </div>
                  )}
                </div>
                {filteredAdded.length > 0 && totalAddedPages > 1 && (
                  <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-[#5a5a5a]">
                    <button
                      type="button"
                      disabled={addedPage === 1}
                      onClick={() => setAddedPage((p) => Math.max(1, p - 1))}
                      className="rounded-lg border border-[#5a5a5a] bg-[#404040] px-3 py-1.5 text-sm text-gray-300 disabled:opacity-50 cursor-pointer"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-gray-400">
                      Page {addedPage} of {totalAddedPages}
                    </span>
                    <button
                      type="button"
                      disabled={addedPage >= totalAddedPages}
                      onClick={() => setAddedPage((p) => Math.min(totalAddedPages, p + 1))}
                      className="rounded-lg border border-[#5a5a5a] bg-[#404040] px-3 py-1.5 text-sm text-gray-300 disabled:opacity-50 cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 flex items-center justify-between gap-4 border-t border-[#5a5a5a] pt-6">
            <button type="button" onClick={onBack} className={btnSecondary}>
              <FontAwesomeIcon icon={faRotateLeft} className="mr-2" /> Back
            </button>
            <span className="text-sm text-gray-400">Step 3 of 3</span>
            <button
              type="button"
              onClick={createExam}
              disabled={isCreating}
              className={`${btnPrimary} flex items-center gap-2`}
            >
              {isCreating ? (
                <>
                  <span className="inline-block h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  {isEditing ? 'Updating…' : 'Creating…'}
                </>
              ) : isEditing ? (
                'Update exam'
              ) : (
                'Create exam'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddStudents;
