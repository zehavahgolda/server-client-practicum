import { Outlet } from "react-router-dom";
import PageTabs from "../PageTabs";
import DashboardActions from "../Dashboard/DashboardActions";
import DashboardKpiGrid from "../Dashboard/DashboardKpiGrid";
import "./AppLayout.css";

export default function AppLayout() {
  return (
    <div className="app-layout" dir="rtl">
      <header className="app-layout-header">
        <PageTabs />

        <DashboardActions />

        <DashboardKpiGrid />
      </header>

      <Outlet />
    </div>
  );
}