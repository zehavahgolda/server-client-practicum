import { useEmployeesPage } from "../hooks/useEmployeesPage";
import EmployeeFilters from "../components/Employees/EmployeeFilters";
import EmployeeBoard from "../components/Employees/EmployeeBoard";
import EmployeeProfileSection from "../components/Employees/EmployeeProfileSection";
import EmployeeFormModal from "../components/Employees/EmployeeFormModal";
import AllocationModal from "../components/Employees/AllocationModal";
import AllocationUpdateModal from "../components/Employees/AllocationUpdateModal";

export default function EmployeesPage() {
  const page = useEmployeesPage();

  return (
    <main className="app-shell" dir="rtl">
      <header className="app-header">
        <h1>ניהול עובדים - חיבור לשרת</h1>
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

      {page.selectedEmployee && (
        <div ref={page.profileRef}>
          <EmployeeProfileSection
            employee={page.selectedEmployee}
            loading={page.loadingDetails}
            allocationOptionsCount={page.allocationOptions.length}
            onClose={() => page.setSelectedEmployee(null)}
            onEdit={page.openEditEmployeeModal}
            onAddAllocation={() => page.setAllocationModalOpen(true)}
            onUpdateAllocation={() => page.setAllocationUpdateModalOpen(true)}
          />
        </div>
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