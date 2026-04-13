import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import DashboardPage from "../pages/DashboardPage";
import InterviewSessionPage from "../pages/InterviewSessionPage";
import InterviewSetupPage from "../pages/InterviewSetupPage";
import LoginPage from "../pages/LoginPage";
import OldInterviewsPage from "../pages/OldInterviewsPage";
import ReportPage from "../pages/ReportPage";
import { useAppState } from "../lib/AppStateContext";

function ProtectedRoute({ children }) {
  const { user } = useAppState();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function AppRoutes() {
  const { user } = useAppState();
  const location = useLocation();

  return (
    <div key={location.pathname} className="page-enter">
    <Routes>
      <Route
        path="/"
        element={<Navigate to={user ? "/interview/setup" : "/login"} replace />}
      />
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/interview/setup"
        element={
          <ProtectedRoute>
            <InterviewSetupPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/interview/session"
        element={
          <ProtectedRoute>
            <InterviewSessionPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/report"
        element={
          <ProtectedRoute>
            <ReportPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/interviews/old"
        element={
          <ProtectedRoute>
            <OldInterviewsPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </div>
  );
}

export default AppRoutes;
