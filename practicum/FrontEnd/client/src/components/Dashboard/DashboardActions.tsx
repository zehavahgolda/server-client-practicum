import { systemService } from "../../services/systemService";
import "./DashboardActions.css";

export default function DashboardActions() {
  async function exportExcel() {
    const file = await systemService.exportToExcel();

    const url = window.URL.createObjectURL(file);
    const link = document.createElement("a");

    link.href = url;
    link.download = "HR_Report.xlsx";
    link.click();

    window.URL.revokeObjectURL(url);
  }

  return (
    <section className="dashboard-actions">
      <span className="dashboard-actions-title">פעולות</span>

      <button type="button" className="dashboard-actions-button">
        איפוס תצוגה
      </button>

      <button type="button" className="dashboard-actions-button primary" onClick={exportExcel}>
        ייצוא לאקסל
      </button>
    </section>
  );
}