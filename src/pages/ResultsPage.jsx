import { useLocation, useNavigate } from "react-router-dom";
import ResultsCard from "../components/ResultsCard";
import { useAppState } from "../lib/AppStateContext";

function ResultsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { settings, resetInterview, lastSessionId } = useAppState();

  const timeSpentSeconds = location.state?.timeSpentSeconds ?? 0;
  const codeLength = location.state?.codeLength ?? 0;
  const testResults = location.state?.testResults;
  const review = location.state?.review;

  const handleDashboard = () => {
    resetInterview();
    navigate("/interview/setup");
  };

  const handleViewReport = () => {
    navigate("/report", {
      state: { sessionId: lastSessionId, timeSpentSeconds, codeLength, testResults, review },
    });
  };

  return (
    <section className="page narrow results-enter">
      <ResultsCard
        settings={settings}
        timeSpentSeconds={timeSpentSeconds}
        codeLength={codeLength}
        testResults={testResults}
      />

      <div className="results-actions">
        <button type="button" className="ci-btn" onClick={handleDashboard}>
          Back to Dashboard
        </button>
        <button
          type="button"
          className="ci-btn ci-btn--primary"
          onClick={handleViewReport}
        >
          View Full Report
        </button>
      </div>
    </section>
  );
}

export default ResultsPage;
