import DashboardActions from "../components/Dashboard/DashboardActions";
import DashboardKpiGrid from "../components/Dashboard/DashboardKpiGrid";
import DashboardChartsGrid from "../components/Dashboard/DashboardChartsGrid";

import EmployeesByCategoryWidget from "../components/Dashboard/EmployeesByCategoryWidget";
import WorkforceBySystemWidget from "../components/Dashboard/WorkforceBySystemWidget";
import BudgetBySystemWidget from "../components/Dashboard/BudgetBySystemWidget";
import SystemsStatusWidget from "../components/Dashboard/SystemsStatusWidget";
import "./DashboardPage.css";
import PageTabs from "../components/PageTabs";

// עמוד הדשבורד הראשי: KPI + ווידג'טים גרפיים מרכזיים.
export default function DashboardPage() {
  return (
    <main className="dashboard-page">
      <PageTabs />
      <DashboardActions />

      <DashboardKpiGrid />

      <DashboardChartsGrid>
        <WorkforceBySystemWidget />
        <EmployeesByCategoryWidget />
      </DashboardChartsGrid>

      <DashboardChartsGrid>
        <SystemsStatusWidget />
        <BudgetBySystemWidget />
      </DashboardChartsGrid>
    </main>
  );
}