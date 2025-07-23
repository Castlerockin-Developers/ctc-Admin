import { useState, useRef } from "react";
import AvatarEditor from "react-avatar-editor";
import "./ViewCourse.css";


const ViewCourse = ({ onUnassign, onEdit, onDelete, onBack }) => {
  // Dummy profile data
  const dummyCourse = {
    name: "Jane Doe",
    designation: "Enter designation",
    createdAt: "2024-01-20T14:30:00Z",
    profilePic: null,
  };

  // Dummy chapters data
  const dummyChapters = [
    {
      id: 1,
      name: "Introduction to React",
      questions: [
        {
          id: "1-1",
          text: "What is JSX?",
          expectedOutput: "JavaScript XML syntax",
        },
        {
          id: "1-2",
          text: "How do you create a React component?",
          expectedOutput: "Function or Class",
        },
      ],
    },
    {
      id: 2,
      name: "State and Props",
      questions: [
        {
          id: "2-1",
          text: "Explain state vs props.",
          expectedOutput: "State is local; props are external",
        },
        {
          id: "2-2",
          text: "How to update state in functional components?",
          expectedOutput: "useState hook",
        },
      ],
    },
  ];

  // Dummy students data
  const dummyStudents = [
    { id: 1, name: "Alice Smith", completed: true },
    { id: 2, name: "Bob Johnson", completed: false },
    { id: 3, name: "Charlie Brown", completed: true },
  ];

  const [image, setImage] = useState(dummyCourse.profilePic);
  const [designation, setDesignation] = useState(dummyCourse.designation);
  const editorRef = useRef(null);
  const [expandedChapter, setExpandedChapter] = useState(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) setImage(file);
  };

  const saveEditedImage = () => {
    if (editorRef.current) {
      const canvas = editorRef.current.getImageScaledToCanvas().toDataURL();
      console.log("Cropped image base64:", canvas);
      alert("Avatar saved! Check console for base64 string.");
    }
  };

  const toggleChapter = (id) => {
    setExpandedChapter(expandedChapter === id ? null : id);
  };

  const filteredStudents = showCompleted
    ? dummyStudents.filter((s) => s.completed)
    : dummyStudents;

  return (
    <div className="Custom-container">
      <div className="new-c-top new-c-top1 flex items-center gap-4">
        <button
          onClick={onBack}
          className="back-btn text-2xl font-bold"
          aria-label="Go back"
        >
          &lt;
        </button>
        <h1>View Course</h1>
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
              <h2>{dummyCourse.name}</h2>
              <input
                type="text"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="Designation"
                className="designation-input"
              />
              <div className="created-at-date">
                Created At:{" "}
                {new Date(dummyCourse.createdAt).toLocaleDateString()}
              </div>
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
              onClick={() => onEdit && onEdit({ designation, image })}
              className="btn-edit"
            >
              Edit
            </button>
            <button
              onClick={() => onDelete && onDelete()}
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
                <button onClick={() => { setMobileMenuOpen(false); onEdit && onEdit({ designation, image }); }}>Edit</button>
                <button onClick={() => { setMobileMenuOpen(false); onDelete && onDelete(); }}>Delete</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Your requested columns */}
      <div className="course-columns-container">
        {/* Left column: Chapters */}
        <div className="chapters-column">
          <h2>Chapters</h2>
          {dummyChapters.map((chapter) => (
            <div key={chapter.id} className="chapter-item">
              <div
                className="chapter-name"
                onClick={() => toggleChapter(chapter.id)}
                role="button"
                tabIndex={0}
                onKeyPress={() => toggleChapter(chapter.id)}
              >
                {chapter.name}
                <span className="expand-icon">
                  {expandedChapter === chapter.id ? "▲" : "▼"}
                </span>
              </div>
              {expandedChapter === chapter.id && (
                <div className="chapter-content">
                  {chapter.questions.map((q) => (
                    <div key={q.id} className="question-item">
                      <p>
                        <strong>Q:</strong> {q.text}
                      </p>
                      <p>
                        <strong>Expected Output:</strong> {q.expectedOutput}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Right column: Students */}
        <div className="students-column">
          <h2>Assigned Students</h2>
          <div className="student-filters">
            <button
              type="button"
              className={`filter-btn ${!showCompleted ? "active" : ""}`}
              onClick={() => setShowCompleted(false)}
            >
              All ({dummyStudents.length})
            </button>
            <button
              type="button"
              className={`filter-btn ${showCompleted ? "active" : ""}`}
              onClick={() => setShowCompleted(true)}
            >
              Completed ({dummyStudents.filter((s) => s.completed).length})
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
        </div>
      </div>
    </div>
  );
};

export default ViewCourse;
