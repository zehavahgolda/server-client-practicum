import { systemService } from "../../../services/systemService";
import "./DashboardActions.css";

// קומפוננטת פעולות בדשבורד (למשל ייצוא דוח).
export default function DashboardActions() {
  // מייצאת את נתוני המערכות לקובץ Excel ומפעילה הורדה בדפדפן.
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
      {/* <span className="dashboard-actions-title">פעולות</span> */}

      {/* <button
        type="button"
        className="dashboard-actions-button"
        disabled
        title="הפעולה תהיה זמינה בהמשך"
        aria-disabled="true"
      >
        איפוס תצוגה
      </button> */}

      <button type="button" className="dashboard-actions-button primary" onClick={exportExcel}>
       ⬇️  ייצוא לאקסל   
      </button>
    </section>
  );
}