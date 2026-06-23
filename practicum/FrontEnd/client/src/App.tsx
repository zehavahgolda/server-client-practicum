import { BrowserRouter as Router, Routes, Route, NavLink } from "react-router-dom";
import "./App.css";
import DashboardPage from "./pages/DashboardPage";
import EmployeesPage from "./pages/EmployeesPage";
import SystemsPage from "./pages/SystemsPage";
import ChangesPage from "./pages/ChangesPage";
import CategoriesPage from "./pages/CategoriesPage";

function App() {
  return (
    <Router>
      <div className="app-wrapper">
        <nav className="app-nav" dir="rtl">
          <NavLink to="/" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
            📊 דשבורד
          </NavLink>
          <NavLink
            to="/employees"
            className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
          >
            👥 עובדים
          </NavLink>
          <NavLink to="/systems" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
            🏗️ מערכות
          </NavLink>
          <NavLink
            to="/categories"
            className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
          >
            📂 קטגוריות
          </NavLink>
          <NavLink
            to="/changes"
            className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
          >
            📜 שינויים
          </NavLink>
        </nav>

        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/employees" element={<EmployeesPage />} />
          <Route path="/systems" element={<SystemsPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/changes" element={<ChangesPage />} />
        </Routes>
      </div>

      <style>{`
        .app-wrapper {
          min-height: 100vh;
          background: #f3f4f6;
        }

        .app-nav {
          background: #ffffff;
          border-bottom: 2px solid #e5e7eb;
          display: flex;
          justify-content: flex-end;
          gap: 24px;
          padding: 10px 20px;
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .nav-link {
          text-decoration: none;
          color: #4b5563;
          font-weight: 600;
          padding: 8px 12px;
          border-radius: 8px;
          transition: all 0.2s;
          cursor: pointer;
          font-size: 15px;
        }

        .nav-link:hover {
          background: #f3f4f6;
          color: #1f2937;
        }

        .nav-link.active {
          background: #2864a6;
          color: #ffffff;
        }
      `}</style>
    </Router>
  );
}

export default App;
