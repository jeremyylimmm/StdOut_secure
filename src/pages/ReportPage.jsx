import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { useAppState } from "../lib/AppStateContext";
import CodeViewer from "../components/CodeViewer";
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


function extractGot(value) {
  if (typeof value === "string") {
    const lines = value.split("\n").map((l) => l.trim()).filter(Boolean);
    // Detect runtime error (traceback or exception)
    if (lines.some((l) => l.startsWith("Traceback") || /^[\w.]*Error:/.test(l))) {
      return "__runtime_error__";
    }
    for (const line of lines) {
      const match = line.match(/^FAIL:\s*expected\s*.+,\s*got\s+(.+)$/i);
      if (match) return match[1].trim();
    }
  }
  return value;
}

function formatCompact(value) {
  let data = value;
  if (typeof value === "string") {
    try { data = JSON.parse(value); } catch { return value; }
  }
  try { return JSON.stringify(data); } catch { return String(data); }
}

function formatOutput(value) {
  let data = value;
  if (typeof value === "string") {
    try { data = JSON.parse(value); } catch { return value; }
  }
  if (Array.isArray(data)) {
    const isSimple = data.every((item) => typeof item !== "object" || item === null || Object.keys(item).length === 0);
    if (isSimple && data.length <= 10) return JSON.stringify(data);
    const isSimpleNested = data.every((item) => Array.isArray(item) && item.every((el) => typeof el === "number" || typeof el === "string"));
    if (isSimpleNested) return data.map((arr) => `[${arr.join(", ")}]`).join("\n");
  }
  try { return JSON.stringify(data, null, 2); } catch { return String(data); }
}

function ScoreBar({ label, score, feedback }) {
  const pct = (score / 10) * 100;
  const color = score >= 7 ? "var(--success)" : score >= 4 ? "var(--warning)" : "var(--error)";
  return (
    <div className="rp-score-row">
      <div className="rp-score-meta">
        <span className="rp-score-label">{label}</span>
        <span className="rp-score-value" style={{ color }}>{score}<span className="rp-score-denom">/10</span></span>
      </div>
      <div className="rp-score-track">
        <div className="rp-score-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      {feedback && <p className="rp-score-feedback">{feedback}</p>}
    </div>
  );
}

function Collapsible({ title, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rp-collapsible">
      <button type="button" className="rp-collapsible-header" onClick={() => setOpen(!open)}>
        <span className="rp-collapsible-arrow">{open ? "▼" : "▶"}</span>
        <span>{title}</span>
      </button>
      {open && <div className="rp-collapsible-body">{children}</div>}
    </div>
  );
}

function ReportPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAppState();
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTestCase, setSelectedTestCase] = useState(null);
  const [solution, setSolution] = useState(null);
  const [solutionLoading, setSolutionLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const sessionData = location.state?.sessionData;
  const sessionId = location.state?.sessionId;
  const stateTestResults = location.state?.testResults;
  const stateReview = location.state?.review;

  useEffect(() => {
    const loadInterview = async () => {
      try {
        if (sessionData) { setInterview(sessionData); setLoading(false); return; }
        if (sessionId) {
          const response = await fetch(`${API_BASE_URL}/api/interviews/${sessionId}`);
          if (!response.ok) throw new Error("Failed to fetch interview");
          const data = await response.json();
          if (stateTestResults) data.testResults = stateTestResults;
          if (stateReview) data.review = stateReview;
          setInterview(data);
        }
      } catch (err) {
        setError("Failed to load interview: " + err.message);
      } finally {
        setLoading(false);
      }
    };
    loadInterview();
  }, [sessionData, sessionId]);

  // Fetch solution when interview is loaded
  useEffect(() => {
    const loadSolution = async () => {
      console.log("Interview data:", interview);
      console.log("Question ID:", interview?.interview?.questionId);

      if (!interview?.interview?.questionId) {
        console.log("No questionId found");
        return;
      }
      try {
        setSolutionLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/questions/${interview.interview.questionId}`);
        console.log("Solution fetch response:", response.ok, response.status);

        if (response.ok) {
          const data = await response.json();
          console.log("Question data:", data);
          console.log("Solution:", data.solution);
          setSolution(data.solution);
        }
      } catch (err) {
        console.error("Failed to load solution:", err);
      } finally {
        setSolutionLoading(false);
      }
    };
    loadSolution();
  }, [interview?.interview?.questionId]);

  const handleDelete = () => setShowDeleteConfirm(true);

  const confirmDelete = async () => {
    setShowDeleteConfirm(false);
    try {
      const response = await fetch(`${API_BASE_URL}/api/interviews/${interview._id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete interview");
      navigate("/interviews/old");
    } catch (err) {
      alert("Failed to delete interview: " + err.message);
    }
  };

  if (loading) return <section className="page"><div className="card">Loading report...</div></section>;
  if (error) return <section className="page"><div className="card" style={{ color: "var(--error)" }}>{error}</div></section>;
  if (!interview) return <section className="page"><div className="card">Interview not found</div></section>;

  const timeSpent = interview.interview?.durationMinutes * 60 - interview.timeLeftSeconds;
  const tr = interview.testResults;
  const review = interview.review;
  const passed = tr?.passed;
  const hasStructuredReview = review && typeof review === "object" && review.logic;

  return (
    <section className="page rp-page">
      {/* Header */}
      <div className="rp-header">
        <div className="rp-header-main">
          <h1 className="rp-title">{interview.interview?.title}</h1>
          <div className="rp-chips">
            {interview.interview?.company && <span className="rp-chip">{interview.interview.company}</span>}
            {interview.interview?.difficulty && <span className={`rp-chip rp-chip--${interview.interview.difficulty.toLowerCase()}`}>{interview.interview.difficulty}</span>}
            <span className="rp-chip">{formatDate(interview.completedAt)}</span>
            {tr && (
              <span className="rp-chip" style={{ color: passed ? "var(--success)" : "var(--error)", borderColor: passed ? "var(--success)" : "var(--error)" }}>
                {passed ? "✓" : "✗"} {passed ? "Passed" : "Failed"} {tr.passedCount}/{tr.totalTests}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="rp-stats">
        <div className="rp-stat">
          <span className="rp-stat-label">Time Spent</span>
          <span className="rp-stat-value">{formatTime(timeSpent)}</span>
        </div>
        {tr && (
          <div className="rp-stat">
            <span className="rp-stat-label">Test Score</span>
            <span className="rp-stat-value">{tr.passPercentage}%</span>
          </div>
        )}
        {interview.code && (
          <div className="rp-stat">
            <span className="rp-stat-label">Code Length</span>
            <span className="rp-stat-value">{interview.code.length} chars</span>
          </div>
        )}
        {hasStructuredReview && review.overallScore != null && (
          <div className="rp-stat">
            <span className="rp-stat-label">Overall Score</span>
            <span className="rp-stat-value">{review.overallScore}/10</span>
          </div>
        )}
      </div>

      {/* Two-column: scores + test cases */}
      {(hasStructuredReview || (tr?.testCases?.length > 0)) && (
        <div className="rp-two-col">
          {hasStructuredReview && (
            <div className="card rp-scores-card">
              <h2 className="rp-section-title">Performance</h2>
              <div className="rp-scores">
                <ScoreBar label="Logic" score={review.logic.score} feedback={review.logic.feedback} />
                <ScoreBar label="Code Quality" score={review.codeQuality.score} feedback={review.codeQuality.feedback} />
                <ScoreBar label="Reasoning" score={review.reasoning.score} feedback={review.reasoning.feedback} />
              </div>
              {review.summary && (
                <div className="rp-summary">
                  <p>{review.summary}</p>
                </div>
              )}
            </div>
          )}

          {tr?.testCases?.length > 0 && (
            <div className="card rp-tests-card">
              <h2 className="rp-section-title">Test Cases</h2>
              <div className="rp-test-list">
                {tr.testCases.map((tc, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`rp-test-row ${tc.passed ? "rp-test-row--pass" : "rp-test-row--fail"}`}
                    onClick={() => setSelectedTestCase(tc)}
                  >
                    <span className="rp-test-row-icon">{tc.passed ? "✓" : "✗"}</span>
                    <span className="rp-test-row-label">Test {tc.testCaseId}</span>
                    <span className="rp-test-row-status">{tc.passed ? "passed" : "failed"}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Legacy string review */}
      {review && typeof review === "string" && (
        <div className="card">
          <h2 className="rp-section-title">AI Review</h2>
          {review.split("\n").map((line, i) => {
            const heading = line.match(/^\*\*(.+?)\*\*(.*)$/);
            if (heading) return <p key={i}><strong>{heading[1]}</strong>{heading[2]}</p>;
            if (line.trim() === "") return <br key={i} />;
            return <p key={i}>{line}</p>;
          })}
        </div>
      )}

      {/* Transcript */}
      {interview.transcript && (
        <Collapsible title="Transcript" defaultOpen>
          <pre className="rp-preblock">{interview.transcript.replace(/\n\s*$/, "")}</pre>
        </Collapsible>
      )}

      {/* Code */}
      {interview.code && (
        <Collapsible title="Code">
          <div className="rp-solution">
            <div className="rp-solution-section">
              <CodeViewer code={interview.code} />
            </div>
          </div>
        </Collapsible>
      )}

      {/* Solution */}
      {solution && (
        <Collapsible title="Solution">
          <div className="rp-solution">
            <div className="rp-solution-section">
              <CodeViewer code={solution.code} />
            </div>
            {solution.explanation && (
              <div className="rp-solution-section">
                <h3>Explanation</h3>
                <p>{solution.explanation}</p>
              </div>
            )}
            {solution.timeComplexity && (
              <div className="rp-solution-section">
                <h3>Time Complexity</h3>
                <p><strong>{solution.timeComplexity}</strong></p>
              </div>
            )}
            {solution.spaceComplexity && (
              <div className="rp-solution-section">
                <h3>Space Complexity</h3>
                <p><strong>{solution.spaceComplexity}</strong></p>
              </div>
            )}
          </div>
        </Collapsible>
      )}

      {/* Actions */}
      <div className="rp-actions">
        <button type="button" className="ci-btn ci-btn--delete" onClick={handleDelete}>Delete</button>
        <button type="button" className="ci-btn" onClick={() => navigate("/interviews/old")}>Back</button>
      </div>

      {/* Delete confirm dialog */}
      {showDeleteConfirm && createPortal(
        <div className="modal-backdrop" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Delete Interview</h2>
            <p className="modal-body">
              Are you sure you want to delete this interview? This cannot be undone.
            </p>
            <div className="modal-actions">
              <button type="button" className="ci-btn" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
              <button type="button" className="ci-btn ci-btn--delete-active" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Test case modal */}
      {selectedTestCase && createPortal(
        <div className="modal-backdrop" onClick={() => setSelectedTestCase(null)}>
          <div className="modal-box modal-box--wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                Test Case {selectedTestCase.testCaseId}
                {selectedTestCase.description && `: ${selectedTestCase.description}`}
              </h2>
              <button type="button" className="modal-close" onClick={() => setSelectedTestCase(null)}>✕</button>
            </div>
            <div style={{ padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <span className={`rp-modal-badge ${selectedTestCase.passed ? "pass" : "fail"}`}>
                  {selectedTestCase.passed ? "✓ PASSED" : "✗ FAILED"}
                </span>
              </div>
              <div>
                <p className="rp-modal-label">Input</p>
                <pre className="rp-modal-code">{formatCompact(selectedTestCase.input)}</pre>
              </div>
              {(() => {
                const got = selectedTestCase.actualOutput ? extractGot(selectedTestCase.actualOutput) : null;
                const isRuntimeError = got === "__runtime_error__";
                return (
                  <div className="rp-modal-comparison">
                    <div>
                      <p className="rp-modal-label">Expected</p>
                      <pre className="rp-modal-code">{formatCompact(selectedTestCase.expectedOutput)}</pre>
                    </div>
                    <div>
                      <p className="rp-modal-label" style={{ color: !selectedTestCase.passed ? "var(--error)" : undefined }}>Got</p>
                      <pre className={`rp-modal-code ${!selectedTestCase.passed ? "rp-modal-code--error" : ""}`}>
                        {isRuntimeError ? "Runtime error" : got ? formatCompact(got) : formatCompact(selectedTestCase.expectedOutput)}
                      </pre>
                    </div>
                  </div>
                );
              })()}
            </div>
            <div className="modal-footer">
              <button type="button" className="ci-btn ci-btn--primary" onClick={() => setSelectedTestCase(null)}>Close</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </section>
  );
}

export default ReportPage;
