import DashboardChartsGrid from "../components/Dashboard/DashboardChartsGrid";

import EmployeesByCategoryWidget from "../components/Dashboard/EmployeesByCategoryWidget";
import WorkforceBySystemWidget from "../components/Dashboard/WorkforceBySystemWidget";
import BudgetBySystemWidget from "../components/Dashboard/BudgetBySystemWidget";
import SystemsStatusWidget from "../components/Dashboard/SystemsStatusWidget";
import "./DashboardPage.css";

// עמוד הדשבורד הראשי: ווידג'טים גרפיים מרכזיים.
// אזור הפעולות וכרטיסי ה-KPI מוצגים כעת מתוך AppLayout המשותף.
export default function DashboardPage() {
  return (
    <main className="dashboard-page">
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