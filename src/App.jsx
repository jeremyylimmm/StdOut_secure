import { useLocation, NavLink } from "react-router-dom";
import Navbar from "./components/Navbar";
import { useAppState } from "./lib/AppStateContext";
import AppRoutes from "./routes/AppRoutes";
import "./App.css";

function Sidebar() {
  return (
    <aside className="dashboard-sidebar">
      <p className="dashboard-sidebar-label">Menu</p>
      <nav className="dashboard-sidebar-nav">
        <NavLink to="/interview/setup" className={({ isActive }) => `dashboard-sidebar-link ${isActive ? "dashboard-sidebar-link--active" : ""}`}>
          Dashboard
        </NavLink>
        <NavLink to="/interviews/old" className={({ isActive }) => `dashboard-sidebar-link ${isActive ? "dashboard-sidebar-link--active" : ""}`}>
          Completed Interviews
        </NavLink>
      </nav>
    </aside>
  );
}

function App() {
  const location = useLocation();
  const { user } = useAppState();
  const hideNavbar = location.pathname === "/login" && !user;
  const isInterviewSession = location.pathname === "/interview/session";
  const isLogin = location.pathname === "/login" && !user;
  const showSidebar = !isLogin && !isInterviewSession && !!user;

  return (
    <div className="app-shell">
      {!hideNavbar && <Navbar />}
      <div className={`app-body ${showSidebar ? "app-body--with-sidebar" : ""}`}>
        {showSidebar && <Sidebar />}
        <div
          className={`app-scroll ${isInterviewSession ? "app-scroll--session" : ""} ${isLogin ? "app-scroll--login" : ""}`}
        >
          <main className={`app-main ${isInterviewSession ? "app-main--session" : ""} ${isLogin ? "app-main--login" : ""}`}>
            <AppRoutes />
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;
