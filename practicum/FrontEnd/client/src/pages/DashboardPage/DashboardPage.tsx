import DashboardChartsGrid from "../../components/Dashboard/charts/DashboardChartsGrid";

import EmployeesByCategoryWidget from "../../components/Dashboard/widgets/EmployeesByCategoryWidget";
import WorkforceBySystemWidget from "../../components/Dashboard/widgets/WorkforceBySystemWidget";
import BudgetBySystemWidget from "../../components/Dashboard/widgets/BudgetBySystemWidget";
import SystemsStatusWidget from "../../components/Dashboard/widgets/SystemsStatusWidget";

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