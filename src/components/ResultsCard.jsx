function ResultsCard({
  settings,
  timeSpentSeconds,
  codeLength,
  testResults,
}) {
  // Format time spent as MM:SS
  const minutes = String(Math.floor(timeSpentSeconds / 60)).padStart(2, "0");
  const seconds = String(timeSpentSeconds % 60).padStart(2, "0");
  const formattedTime = `${minutes}:${seconds}`;

  // Calculate score based on test results if available
  let score;
  let scoreBreakdown = null;

  if (testResults) {
    score = testResults.passPercentage;
    scoreBreakdown = testResults;
  } else {
    score = 0;
  }

  return (
    <div className="card">
      <h2>Interview Summary</h2>
      <p>Interview Name: {settings.interviewName}</p>
      <p>Company: {settings.company}</p>
      <p>Difficulty: {settings.difficulty}</p>
      <p>Time Spent: {formattedTime}</p>
      <p>Code Length: {codeLength} characters</p>

      {scoreBreakdown ? (
        <div className="test-results">
          <p className="score">
            Score: {score}% ({scoreBreakdown.passedCount}/
            {scoreBreakdown.totalTests} tests passed)
          </p>
          {scoreBreakdown.passed ? (
            <p className="test-status passed">✓ All test cases passed!</p>
          ) : (
            <p className="test-status failed">
              ✗ {scoreBreakdown.totalTests - scoreBreakdown.passedCount} test
              case(s) failed
            </p>
          )}
        </div>
      ) : (
        <p className="score">No test results available</p>
      )}
    </div>
  );
}

export default ResultsCard;
