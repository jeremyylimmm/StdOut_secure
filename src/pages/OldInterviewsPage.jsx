import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useAppState } from "../lib/AppStateContext";
import API_BASE_URL from "../config/api";

function formatDate(isoDate) {
  return new Date(isoDate).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatTime(seconds) {
  const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");
  return `${mins}:${secs}`;
}

function OldInterviewsPage() {
  const navigate = useNavigate();
  const { user } = useAppState();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    if (!user?.id) {
      setError("Please log in to view previous interviews.");
      setLoading(false);
      return;
    }

    const fetchInterviews = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/interviews/user/${user.id}`,
        );

        if (!response.ok) {
          throw new Error("Failed to fetch interviews");
        }

        const data = await response.json();
        setInterviews(data);
      } catch (err) {
        setError(
          "Could not load previous interviews. Make sure the server is running.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchInterviews();
  }, [user?.id]);

  const handleDelete = (sessionId) => {
    setDeleteTarget(sessionId);
  };

  const confirmDelete = async () => {
    const sessionId = deleteTarget;
    setDeleteTarget(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/interviews/${sessionId}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to delete interview");
      }

      setInterviews(interviews.filter((i) => i._id !== sessionId));
    } catch (err) {
      alert("Failed to delete interview");
    }
  };

  const handleViewReport = (interview) => {
    navigate("/report", {
      state: { sessionId: interview._id, sessionData: interview },
    });
  };

  return (
    <section className="page">

      <div>
        <h1>Completed Interviews</h1>
        <p>Review your past interview sessions and code.</p>
      </div>

      {error && (
        <div className="card" style={{ color: "#ff6b6b" }}>
          {error}
        </div>
      )}

      {loading && <div className="card">Loading interviews...</div>}

      {!loading && !error && interviews.length === 0 && (
        <div className="card">
          <p>
            No interviews yet. Complete an interview session to see it here!
          </p>
        </div>
      )}

      <div className="ci-list">
        {interviews.map((interview) => (
          <article className="ci-row" key={interview._id}>
            <div className="ci-info">
              <span className="ci-title">{interview.interview.title}</span>
              <span className="ci-meta">
                {interview.interview.company}
                {interview.interview.difficulty
                  ? ` · ${interview.interview.difficulty}`
                  : ""}
                {interview.timeLeftSeconds !== undefined &&
                  ` · ${formatTime(interview.interview.durationMinutes * 60 - interview.timeLeftSeconds)} spent`}
              </span>
              <span className="ci-date">
                {formatDate(interview.completedAt)}
              </span>
            </div>
            {interview.testResults && (
              <span
                className={`ci-score ${
                  interview.testResults.passed
                    ? "ci-score--pass"
                    : interview.testResults.passedCount >= 8
                      ? "ci-score--partial"
                      : "ci-score--fail"
                }`}
              >
                {interview.testResults.passedCount}/
                {interview.testResults.totalTests} passing
              </span>
            )}
            {interview.review?.overallScore !== undefined && (
              <span className="ci-score ci-score--review">
                Score: {interview.review.overallScore}/10
              </span>
            )}
            <div className="ci-actions">
              {interview.code && (
                <button
                  type="button"
                  className="ci-btn"
                  onClick={() => handleViewReport(interview)}
                >
                  View Report
                </button>
              )}
              <button
                type="button"
                className="ci-btn ci-btn--delete"
                onClick={() => handleDelete(interview._id)}
              >
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>

      {/* Delete Confirm Dialog */}
      {deleteTarget &&
        createPortal(
          <div className="modal-backdrop" onClick={() => setDeleteTarget(null)}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
              <h2 className="modal-title">Delete Interview</h2>
              <p className="modal-body">
                Are you sure you want to delete this interview? This cannot be
                undone.
              </p>
              <div className="modal-actions">
                <button
                  type="button"
                  className="ci-btn"
                  onClick={() => setDeleteTarget(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="ci-btn ci-btn--delete-active"
                  onClick={confirmDelete}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </section>
  );
}

export default OldInterviewsPage;
