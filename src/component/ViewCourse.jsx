import { useState, useRef, useEffect } from "react";
import { log, error as logError } from "../utils/logger";
import AvatarEditor from "react-avatar-editor";
import "./ViewCourse.css";
import { authFetch } from '../scripts/AuthProvider';
import Swal from 'sweetalert2';

const ViewCourse = ({ onUnassign, onEdit, onDelete, onBack, selectedCourse }) => {
  const [courseData, setCourseData] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [assignedStudents, setAssignedStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [image, setImage] = useState(null);
  const [designation, setDesignation] = useState("");
  const editorRef = useRef(null);
  const [expandedChapter, setExpandedChapter] = useState(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    desc: ''
  });
  const [editingChapter, setEditingChapter] = useState(null);
  const [chapterEditData, setChapterEditData] = useState({
    name: '',
    desc: '',
    question: '',
    expected_output: ''
  });
  const [isEditingAssignments, setIsEditingAssignments] = useState(false);
  const [allStudents, setAllStudents] = useState([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);

  // Filter students based on completion status
  const filteredStudents = showCompleted 
    ? assignedStudents.filter(student => student.completed)
    : assignedStudents;

  // Load course data when component mounts
  useEffect(() => {
    if (selectedCourse && selectedCourse.id) {
      loadCourseData(selectedCourse.id);
      loadAllStudents();
    }
  }, [selectedCourse]);

  // Load students from the current organization only (admin/students filters by org)
  const loadAllStudents = async () => {
    try {
      const list = [];
      // Use paginated admin students API (org-filtered)
      const baseParams = new URLSearchParams();
      baseParams.set('page', '1');
      baseParams.set('page_size', '500');
      const firstRes = await authFetch(`/admin/students/?${baseParams.toString()}`, { method: 'GET' });
      if (!firstRes.ok) return;
      const firstData = await firstRes.json();

      const mapStudent = (s) => ({
        id: s.id,
        first_name: s.first_name ?? (s.name ? s.name.split(' ')[0] || '' : ''),
        last_name: s.last_name ?? (s.name ? s.name.split(' ').slice(1).join(' ').trim() || '' : ''),
        name: s.name || `${s.first_name || ''} ${s.last_name || ''}`.trim(),
        email: s.email,
      });

      if (Array.isArray(firstData.results)) {
        const pageSize = firstData.results.length || 500;
        const totalCount = typeof firstData.count === 'number' ? firstData.count : firstData.results.length;
        const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
        firstData.results.filter((s) => s.id).forEach((s) => list.push(mapStudent(s)));
        for (let page = 2; page <= totalPages; page += 1) {
          const params = new URLSearchParams();
          params.set('page', String(page));
          params.set('page_size', String(pageSize));
          const res = await authFetch(`/admin/students/?${params.toString()}`, { method: 'GET' });
          const data = await res.json();
          if (Array.isArray(data.results)) {
            data.results.filter((s) => s.id).forEach((s) => list.push(mapStudent(s)));
          } else break;
        }
      } else if (firstData.data && typeof firstData.data === 'object') {
        Object.values(firstData.data).flat().filter((s) => s.id).forEach((s) => list.push(mapStudent(s)));
      }
      setAllStudents(list);
    } catch (error) {
      logError('Error loading students:', error);
    }
  };

  // Load course details, chapters, and assigned students
  const loadCourseData = async (moduleId) => {
    try {
      setLoading(true);
      
      // Load module details with chapters
      const moduleResponse = await authFetch(`/learning/custom-modules/${moduleId}/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (moduleResponse.ok) {
        const moduleData = await moduleResponse.json();
        setCourseData(moduleData.module);
        setChapters(moduleData.chapters || []);
        setImage(moduleData.module.image);
        setDesignation(moduleData.module.author_designation || "Faculty");
        
        // Set edit form data
        setEditFormData({
          name: moduleData.module.name,
          desc: moduleData.module.desc
        });
      }

      // Load assigned students/assignments
      const assignmentsResponse = await authFetch('/learning/assignments/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (assignmentsResponse.ok) {
        const assignments = await assignmentsResponse.json();
        // Filter assignments for this module
        const moduleAssignments = assignments.filter(assignment => assignment.module === moduleId);
        
        // Get all students assigned to this module
        const allStudents = [];
        moduleAssignments.forEach(assignment => {
          assignment.students_names.forEach((name, index) => {
            allStudents.push({
              id: assignment.students[index],
              name: name,
              completed: false, // You might want to add completion tracking later
              assignment_date: assignment.date_assigned
            });
          });
        });
        setAssignedStudents(allStudents);
        // Set selected student IDs for editing
        setSelectedStudentIds(allStudents.map(student => student.id));
      }

    } catch (error) {
      logError('Error loading course data:', error);
      Swal.fire({
        title: 'Error!',
        text: 'Failed to load course data. Please try again.',
        icon: 'error',
        background: "#181817",
        color: "#fff"
      });
    } finally {
      setLoading(false);
    }
  };

  // Delete module
  const handleDelete = async () => {
    if (!courseData) return;

    Swal.fire({
      title: 'Are you sure?',
      text: 'This module will be deleted permanently along with all chapters!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
      background: "#181817",
      color: "#fff"
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await authFetch(`/learning/custom-modules/${courseData.id}/`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            Swal.fire({
              title: 'Deleted!',
              text: 'Module has been deleted.',
              icon: 'success',
        iconColor: "#A294F9", // Set the icon color to purple
              background: "#181817",
              color: "#fff"
            }).then(() => {
              onBack(); // Go back to course list
            });
          } else {
            throw new Error('Failed to delete module');
          }
        } catch (error) {
          logError('Error deleting module:', error);
          Swal.fire({
            title: 'Error!',
            text: 'Failed to delete module. Please try again.',
            icon: 'error',
            background: "#181817",
            color: "#fff"
          });
        }
      }
    });
  };

  // Handle edit form changes
  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Save edited module
  const handleSaveEdit = async () => {
    if (!courseData) return;

    if (!editFormData.name.trim() || !editFormData.desc.trim()) {
      Swal.fire({
        title: 'Error!',
        text: 'Please fill in all required fields.',
        icon: 'error',
        background: "#181817",
        color: "#fff"
      });
      return;
    }

    try {
      const response = await authFetch(`/learning/custom-modules/${courseData.id}/`, {
        method: 'PUT',
        body: JSON.stringify({
          name: editFormData.name,
          desc: editFormData.desc
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Update local state
        setCourseData(prev => ({
          ...prev,
          name: editFormData.name,
          desc: editFormData.desc
        }));
        
        setIsEditing(false);
        
        Swal.fire({
          title: 'Success!',
          text: 'Module updated successfully!',
        iconColor: "#A294F9", // Set the icon color to purple
          icon: 'success',
          background: "#181817",
          color: "#fff"
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update module');
      }
    } catch (error) {
      logError('Error updating module:', error);
      Swal.fire({
        title: 'Error!',
        text: error.message || 'Failed to update module. Please try again.',
        icon: 'error',
        background: "#181817",
        color: "#fff"
      });
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditFormData({
      name: courseData.name,
      desc: courseData.desc
    });
    setIsEditing(false);
  };

  // Start editing
  const handleStartEdit = () => {
    setIsEditing(true);
  };

  // Chapter editing functions
  const handleStartChapterEdit = (chapter) => {
    setEditingChapter(chapter.id);
    setChapterEditData({
      name: chapter.name || chapter.title,
      desc: chapter.desc,
      question: chapter.question || '',
      expected_output: chapter.expected_output || ''
    });
  };

  const handleChapterEditChange = (e) => {
    const { name, value } = e.target;
    setChapterEditData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveChapterEdit = async (chapterId) => {
    if (!chapterEditData.name.trim() || !chapterEditData.desc.trim()) {
      Swal.fire({
        title: 'Error!',
        text: 'Please fill in name and description fields.',
        icon: 'error',
        background: "#181817",
        color: "#fff"
      });
      return;
    }

    try {
      const response = await authFetch(`/learning/chapters/${chapterId}/`, {
        method: 'PUT',
        body: JSON.stringify({
          title: chapterEditData.name,
          desc: chapterEditData.desc,
          question: chapterEditData.question,
          expected_output: chapterEditData.expected_output
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Update local chapters state
        setChapters(prev => prev.map(chapter => 
          chapter.id === chapterId 
            ? {
                ...chapter,
                name: chapterEditData.name,
                title: chapterEditData.name,
                desc: chapterEditData.desc,
                question: chapterEditData.question,
                expected_output: chapterEditData.expected_output
              }
            : chapter
        ));

        setEditingChapter(null);
        setChapterEditData({
          name: '',
          desc: '',
          question: '',
          expected_output: ''
        });

        Swal.fire({
          title: 'Success!',
          text: 'Chapter updated successfully!',
        iconColor: "#A294F9", // Set the icon color to purple
          icon: 'success',
          background: "#181817",
          color: "#fff"
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update chapter');
      }
    } catch (error) {
      logError('Error updating chapter:', error);
      Swal.fire({
        title: 'Error!',
        text: error.message || 'Failed to update chapter. Please try again.',
        icon: 'error',
        background: "#181817",
        color: "#fff"
      });
    }
  };

  const handleCancelChapterEdit = () => {
    setEditingChapter(null);
    setChapterEditData({
      name: '',
      desc: '',
      question: '',
      expected_output: ''
    });
  };

  // Assignment editing functions
  const handleStartAssignmentEdit = () => {
    setIsEditingAssignments(true);
  };

  const handleStudentSelectionChange = (studentId) => {
    setSelectedStudentIds(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  const handleSaveAssignments = async () => {
    if (!courseData) return;

    try {
      const response = await authFetch('/learning/assignments/', {
        method: 'POST',
        body: JSON.stringify({
          module_id: courseData.id,
          student_ids: selectedStudentIds
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Reload assignments to get updated data
        await loadCourseData(courseData.id);
        
        setIsEditingAssignments(false);
        
        Swal.fire({
          title: 'Success!',
          text: 'Student assignments updated successfully!',
        iconColor: "#A294F9", // Set the icon color to purple
          icon: 'success',
          background: "#181817",
          color: "#fff"
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update assignments');
      }
    } catch (error) {
      logError('Error updating assignments:', error);
      Swal.fire({
        title: 'Error!',
        text: error.message || 'Failed to update assignments. Please try again.',
        icon: 'error',
        background: "#181817",
        color: "#fff"
      });
    }
  };

  const handleCancelAssignmentEdit = () => {
    // Reset to original assignments
    setSelectedStudentIds(assignedStudents.map(student => student.id));
    setIsEditingAssignments(false);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) setImage(file);
  };

  const saveEditedImage = () => {
    if (editorRef.current) {
      const canvas = editorRef.current.getImageScaledToCanvas().toDataURL();
      log("Cropped image base64:", canvas);
      alert("Avatar saved! Check console for base64 string.");
    }
  };

  const toggleChapter = (id) => {
    setExpandedChapter(expandedChapter === id ? null : id);
  };

  if (loading) {
    return (
      <div className="flex h-[87vh] min-h-[calc(100dvh-4.5rem)] w-full max-w-full flex-col overflow-hidden rounded-lg bg-[#282828] p-4 sm:p-5 md:h-[87vh] md:min-h-0 md:p-6 md:pb-8">
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overflow-x-hidden pb-6 sm:pb-8 sm:gap-6">
          <div className="flex flex-1 justify-center items-center py-8">
            <div className="text-white">Loading course details...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!courseData) {
    return (
      <div className="flex h-[87vh] min-h-[calc(100dvh-4.5rem)] w-full max-w-full flex-col overflow-hidden rounded-lg bg-[#282828] p-4 sm:p-5 md:h-[87vh] md:min-h-0 md:p-6 md:pb-8">
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overflow-x-hidden pb-6 sm:pb-8 sm:gap-6">
          <div className="flex flex-1 justify-center items-center py-8">
            <div className="text-white">Course not found.</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[87vh] min-h-[calc(100dvh-4.5rem)] w-full max-w-full flex-col overflow-hidden rounded-lg bg-[#282828] p-4 sm:p-5 md:h-[87vh] md:min-h-0 md:p-6 md:pb-8">
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overflow-x-hidden pb-6 sm:pb-8 sm:gap-6">
      <div className="new-c-top new-c-top1 flex items-center gap-4 shrink-0">
        <button
          onClick={onBack}
          className="view-back-btn back-btn  cursor-pointer text-1xl text-white rounded-lg border border-[#5a5a5a] bg-[#3d3d3d] px-2 py-0 hover:bg-[#4a4a4a]"
          aria-label="Go back"
        >
          &lt;
        </button>
        <h1 className="text-white text-3xl font-semibold">View Course</h1>
      </div>
      <div className="view-details-container">
        <div className="view-details">
          <div className="flex items-center md:gap-10 gap-2 profile-flex">
            {/* Left side: Avatar and info */}
            <div className="profile-avatar-section">
              <AvatarEditor
                ref={editorRef}
                image={image || "https://via.placeholder.com/150"}
                width={80}
                height={80}
                border={10}
                borderRadius={40}
                scale={1.2}
                className="avatar-editor-canvas"
              />
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="avatar-file-input"
              />
              <button onClick={saveEditedImage} className="save-avatar-btn">
                Save Avatar
              </button>
            </div>

            <div className="profile-info-text">
              {isEditing ? (
                <div className="edit-form">
                  <input
                    type="text"
                    name="name"
                    value={editFormData.name}
                    onChange={handleEditFormChange}
                    placeholder="Module Name"
                    style={{
                      width: '100%',
                      padding: '8px',
                      marginBottom: '8px',
                      borderRadius: '4px',
                      border: '1px solid #444',
                      backgroundColor: '#333',
                      color: '#fff',
                      fontSize: '18px',
                      fontWeight: 'bold'
                    }}
                  />
                  <textarea
                    name="desc"
                    value={editFormData.desc}
                    onChange={handleEditFormChange}
                    placeholder="Module Description"
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '8px',
                      marginBottom: '8px',
                      borderRadius: '4px',
                      border: '1px solid #444',
                      backgroundColor: '#333',
                      color: '#fff',
                      resize: 'vertical'
                    }}
                  />
                  <div className="edit-buttons" style={{display: 'flex', gap: '8px'}}>
                    <button
                      onClick={handleSaveEdit}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '4px',
                        border: 'none',
                        backgroundColor: '#28a745',
                        color: '#fff',
                        cursor: 'pointer'
                      }}
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '4px',
                        border: 'none',
                        backgroundColor: '#6c757d',
                        color: '#fff',
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h2>{courseData.name}</h2>
                  <div className="author-info">
                    <p style={{color: '#ccc', marginBottom: '4px'}}>
                      Author: {courseData.author_name} ({designation})
                    </p>
                  </div>
                  <div className="course-stats">
                    <p style={{color: '#888', fontSize: '14px'}}>
                      {chapters.length} chapters • {assignedStudents.length} students assigned
                    </p>
                  </div>
                  <div className="course-description" style={{marginTop: '8px'}}>
                    <p style={{color: '#ddd', fontSize: '14px'}}>{courseData.desc}</p>
                  </div>
                </>
              )}
            </div>
          </div>
          {/* Right side: Buttons */}
          <div className="profile-actions">
            <button
              onClick={() => onUnassign && onUnassign()}
              className="btn-unassign"
            >
              Unassign
            </button>
            <button
              onClick={handleStartEdit}
              className="btn-edit"
              disabled={isEditing}
            >
              {isEditing ? 'Editing...' : 'Edit'}
            </button>
            <button
              onClick={handleDelete}
              className="btn-delete"
            >
              Delete
            </button>
          </div>
          {/* Mobile Hamburger Menu */}
          <div className="mobile-action-menu">
            <button
              className="hamburger"
              aria-label="Show actions"
              onClick={() => setMobileMenuOpen((open) => !open)}
            >
              <span style={{ fontSize: '2rem', lineHeight: 1 }}>&#8942;</span>
            </button>
            {mobileMenuOpen && (
              <div className="mobile-action-dropdown">
                <button onClick={() => { setMobileMenuOpen(false); onUnassign && onUnassign(); }}>Unassign</button>
                <button onClick={() => { setMobileMenuOpen(false); handleStartEdit(); }}>Edit</button>
                <button onClick={() => { setMobileMenuOpen(false); handleDelete(); }}>Delete</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Your requested columns */}
      <div className="course-columns-container">
        {/* Left column: Chapters */}
        <div className="chapters-column">
          <h2>Chapters ({chapters.length})</h2>
          {chapters.length === 0 ? (
            <div className="no-chapters" style={{color: '#888', textAlign: 'center', padding: '20px'}}>
              No chapters found for this module.
            </div>
          ) : (
            chapters.map((chapter) => (
              <div key={chapter.id} className="chapter-item">
                <div className="chapter-header-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div
                    className="chapter-name"
                    onClick={() => toggleChapter(chapter.id)}
                    role="button"
                    tabIndex={0}
                    onKeyPress={() => toggleChapter(chapter.id)}
                    style={{ flex: 1, cursor: 'pointer' }}
                  >
                    {chapter.priority}. {chapter.name}
                    <span className="expand-icon">
                      {expandedChapter === chapter.id ? "▲" : "▼"}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartChapterEdit(chapter);
                    }}
                    style={{
                      padding: '4px 8px',
                      fontSize: '12px',
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      marginLeft: '8px',
                      marginRight: '8px'
                    }}
                  >
                    Edit
                  </button>
                </div>
                {expandedChapter === chapter.id && (
                  <div className="chapter-content">
                    {editingChapter === chapter.id ? (
                      <div className="chapter-edit-form" style={{ padding: '10px' }}>
                        <div style={{ marginBottom: '10px' }}>
                          <label style={{ display: 'block', marginBottom: '4px', color: '#fff' }}>Name:</label>
                          <input
                            type="text"
                            name="name"
                            value={chapterEditData.name}
                            onChange={handleChapterEditChange}
                            style={{
                              width: '100%',
                              padding: '8px',
                              borderRadius: '4px',
                              border: '1px solid #444',
                              backgroundColor: '#333',
                              color: '#fff'
                            }}
                          />
                        </div>
                        <div style={{ marginBottom: '10px' }}>
                          <label style={{ display: 'block', marginBottom: '4px', color: '#fff' }}>Description:</label>
                          <textarea
                            name="desc"
                            value={chapterEditData.desc}
                            onChange={handleChapterEditChange}
                            rows={3}
                            style={{
                              width: '100%',
                              padding: '8px',
                              borderRadius: '4px',
                              border: '1px solid #444',
                              backgroundColor: '#333',
                              color: '#fff',
                              resize: 'vertical'
                            }}
                          />
                        </div>
                        <div style={{ marginBottom: '10px' }}>
                          <label style={{ display: 'block', marginBottom: '4px', color: '#fff' }}>Question:</label>
                          <textarea
                            name="question"
                            value={chapterEditData.question}
                            onChange={handleChapterEditChange}
                            rows={2}
                            style={{
                              width: '100%',
                              padding: '8px',
                              borderRadius: '4px',
                              border: '1px solid #444',
                              backgroundColor: '#333',
                              color: '#fff',
                              resize: 'vertical'
                            }}
                          />
                        </div>
                        <div style={{ marginBottom: '10px' }}>
                          <label style={{ display: 'block', marginBottom: '4px', color: '#fff' }}>Expected Output:</label>
                          <textarea
                            name="expected_output"
                            value={chapterEditData.expected_output}
                            onChange={handleChapterEditChange}
                            rows={2}
                            style={{
                              width: '100%',
                              padding: '8px',
                              borderRadius: '4px',
                              border: '1px solid #444',
                              backgroundColor: '#333',
                              color: '#fff',
                              resize: 'vertical'
                            }}
                          />
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => handleSaveChapterEdit(chapter.id)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '4px',
                              border: 'none',
                              backgroundColor: '#28a745',
                              color: '#fff',
                              cursor: 'pointer'
                            }}
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancelChapterEdit}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '4px',
                              border: 'none',
                              backgroundColor: '#6c757d',
                              color: '#fff',
                              cursor: 'pointer'
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="question-item">
                        <p>
                          <strong>Description:</strong> {chapter.desc}
                        </p>
                        <p>
                          <strong>Question:</strong> {chapter.question}
                        </p>
                        <p>
                          <strong>Expected Output:</strong> {chapter.expected_output}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Right column: Students */}
        <div className="students-column">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h2>Assigned Students</h2>
            <button
              onClick={handleStartAssignmentEdit}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {isEditingAssignments ? 'Editing...' : 'Edit'}
            </button>
          </div>
          
          {isEditingAssignments ? (
            <div className="assignment-edit-form">
              <div style={{ marginBottom: '15px' }}>
                <h3 style={{ color: '#fff', marginBottom: '10px' }}>Select Students:</h3>
                <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #444', borderRadius: '4px', padding: '10px' }}>
                  {allStudents.length === 0 ? (
                    <p style={{ color: '#888', textAlign: 'center' }}>No students available.</p>
                  ) : (
                    allStudents.map((student) => (
                      <div key={student.id} style={{ marginBottom: '8px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', color: '#fff', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={selectedStudentIds.includes(student.id)}
                            onChange={() => handleStudentSelectionChange(student.id)}
                            style={{ marginRight: '8px' }}
                          />
                          {student.name || `${student.first_name || ''} ${student.last_name || ''}`.trim()} ({student.email})
                        </label>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleSaveAssignments}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '4px',
                    border: 'none',
                    backgroundColor: '#28a745',
                    color: '#fff',
                    cursor: 'pointer'
                  }}
                >
                  Save Assignments
                </button>
                <button
                  onClick={handleCancelAssignmentEdit}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '4px',
                    border: 'none',
                    backgroundColor: '#6c757d',
                    color: '#fff',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="student-filters">
                <button
                  type="button"
                  className={`filter-btn ${!showCompleted ? "active" : ""}`}
                  onClick={() => setShowCompleted(false)}
                >
                  All ({assignedStudents.length})
                </button>
                <button
                  type="button"
                  className={`filter-btn ${showCompleted ? "active" : ""}`}
                  onClick={() => setShowCompleted(true)}
                >
                  Completed ({assignedStudents.filter((s) => s.completed).length})
                </button>
              </div>
              <div className="student-list">
                {filteredStudents.length === 0 ? (
                  <p className="no-students">No students found.</p>
                ) : (
                  filteredStudents.map((student) => (
                    <div
                      key={student.id}
                      className={`student-item ${
                        student.completed ? "completed" : "not-completed"
                      }`}
                    >
                      <span>{student.name}</span>
                      <span className="completion-status">
                        {student.completed ? "Completed" : "Not Completed"}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>
      </div>
    </div>
  );
};

export default ViewCourse;
