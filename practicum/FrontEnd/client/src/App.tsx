import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";

import DashboardPage from "./pages/DashboardPage/DashboardPage";
import EmployeesPage from "./pages/EmployeesPage/EmployeesPage";
import SystemsPage from "./pages/SystemsPage/SystemsPage";
import ChangesPage from "./pages/ChangesPage/ChangesPage";
import CategoriesPage from "./pages/CategoriesPage/CategoriesPage";

import AppLayout from "./components/shared/layout/AppLayout";

function App() {
  return (
    <Router>
      <div className="app-wrapper">
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/employees" element={<EmployeesPage />} />
            <Route path="/systems" element={<SystemsPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/changes" element={<ChangesPage />} />
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;