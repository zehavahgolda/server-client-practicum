import { NavLink } from "react-router-dom";
import "./PageTabs.css";

export default function PageTabs() {
  return (
    <nav className="page-tabs" dir="rtl">
      <NavLink to="/" className={({ isActive }) => isActive ? "page-tab-link active" : "page-tab-link"}>
        דשבורד ניהולי
      </NavLink>

      <NavLink to="/systems" className={({ isActive }) => isActive ? "page-tab-link active" : "page-tab-link"}>
        מערכות
      </NavLink>

      <NavLink to="/employees" className={({ isActive }) => isActive ? "page-tab-link active" : "page-tab-link"}>
        עובדים
      </NavLink>

      <NavLink to="/categories" className={({ isActive }) => isActive ? "page-tab-link active" : "page-tab-link"}>
        קטגוריות
      </NavLink> 

      {/* <NavLink to="/changes" className={({ isActive }) => isActive ? "page-tab-link active" : "page-tab-link"}>
        שינויים
      </NavLink> */}
    </nav>
  );
}