import { useNavigate } from "react-router-dom";
import { useAppState } from "../lib/AppStateContext";

function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAppState();

  return (
    <section className="page">
      <div className="card">
        <h1>Dashboard</h1>
        <p>Welcome back, {user?.name}.</p>
        <p>Choose what you want to do next.</p>
        <div className="dashboard-actions">
          <button type="button" onClick={() => navigate("/interview/setup")}>
            Start New Interview
          </button>
          <button
            type="button"
            className="ghost-btn"
            onClick={() => navigate("/interviews/old")}
          >
            View Old Interviews
          </button>
        </div>
      </div>
    </section>
  );
}

export default DashboardPage;
