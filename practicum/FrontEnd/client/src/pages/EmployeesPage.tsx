import { useEmployeesPage } from "../hooks/useEmployeesPage";
import EmployeeFilters from "../components/Employees/EmployeeFilters";
import EmployeeBoard from "../components/Employees/EmployeeBoard";
import EmployeeProfileSection from "../components/Employees/EmployeeProfileSection";
import EmployeeFormModal from "../components/Employees/EmployeeFormModal";
import AllocationModal from "../components/Employees/AllocationModal";
import AllocationUpdateModal from "../components/Employees/AllocationUpdateModal";
import PageTabs from "../components/PageTabs";
import "./EmployeesPage.css";

// עמוד עובדים: מציג רשימה, פרופיל, פילטרים ומודלים לפעולות ניהול.
export default function EmployeesPage() {
  // מרכז את כל הלוגיקה והמצבים של העמוד דרך hook ייעודי.
  const page = useEmployeesPage();

  return (
    
    <main className="employees-page-shell" dir="rtl">
      <PageTabs />
      <header className="app-header">
        <h1>ניהול עובדים</h1>
        <p>רשימת עובדים, פרטי עובד, קיבולת, שיבוצים ועדכוני הקצאה.</p>
      </header>

      <EmployeeFilters
        filters={page.filters}
        categories={page.categories}
        managers={page.managers}
        total={page.viewMeta.total}
        lowCapacity={page.viewMeta.lowCapacity}
        overloaded={page.viewMeta.overloaded}
        onChangeFilters={page.setFilters}
        onCreateEmployee={page.openCreateEmployeeModal}
        onClearFilters={page.clearFilters}
      />

      {page.error && <div className="error-box">{page.error}</div>}

      {/* פרופיל העובד הנבחר מוצג מעל הרשימה כאשר קיים selectedEmployee */}
      {page.selectedEmployee && (
        <EmployeeProfileSection
          employee={page.selectedEmployee}
          loading={page.loadingDetails}
          allocationOptionsCount={page.allocationOptions.length}
          onClose={() => page.setSelectedEmployee(null)}
          onEdit={page.openEditEmployeeModal}
          onAddAllocation={() => page.setAllocationModalOpen(true)}
          onUpdateAllocation={() => page.setAllocationUpdateModalOpen(true)}
        />
      )}

      <EmployeeBoard
        employees={page.filteredEmployees}
        selectedEmployee={page.selectedEmployee}
        loading={page.loadingList}
        lowCapacity={page.viewMeta.lowCapacity}
        onSelectEmployee={page.loadEmployeeDetails}
      />

      <AllocationModal
        open={page.allocationModalOpen}
        systems={page.systems}
        saving={page.savingAllocation}
        onClose={() => page.setAllocationModalOpen(false)}
        onSubmit={page.handleAddAllocation}
      />

      <EmployeeFormModal
        open={page.employeeModalOpen}
        mode={page.employeeModalMode}
        employee={page.selectedEmployee}
        saving={page.savingEmployee || page.loadingCreate}
        onClose={() => page.setEmployeeModalOpen(false)}
        onSubmit={page.handleEmployeeSubmit}
      />

      <AllocationUpdateModal
        open={page.allocationUpdateModalOpen}
        options={page.allocationOptions}
        saving={page.savingAllocationUpdate}
        onClose={() => page.setAllocationUpdateModalOpen(false)}
        onSubmit={page.handleUpdateAllocation}
      />
    </main>
  );
}