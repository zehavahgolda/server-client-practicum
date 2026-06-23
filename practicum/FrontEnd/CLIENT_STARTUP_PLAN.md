# תוכנית הפעלה לקוח (Client-Side Startup Plan)
## ניהול קיבולת והקצאת עובדים - React + .NET 9

---

## 📋 סיכום ההתחברות (Integration Overview)

### **Server-Side Status (.NET 9 WebAPI + MongoDB)**
✅ **Active API Endpoints:**
```
GET    /api/Employees                          - רשימת עובדים עם סינונים
POST   /api/Employees                          - יצירת עובד
GET    /api/Employees/{id}                     - פרטי עובד
PUT    /api/Employees/{id}                     - עדכון עובד
DELETE /api/Employees/{id}                     - מחיקת עובד
PUT    /api/Employees/{id}/allocation-months   - עדכון חודשי הקצאה
POST   /api/Employees/{id}/allocations         - הוספת הקצאה

GET    /api/System                             - רשימת מערכות
GET    /api/System/shortage                    - מערכות בחסור
GET    /api/System/{id}                        - פרטי מערכת
GET    /api/System/export                      - ייצוא אקסל
```

### **Database (MongoDB)**
📊 **Collections:**
- `employees` - עובדים עם allocations מוטמעות
- `systems` - מערכות עם metadata
- קישור: Allocation → SystemId (foreign key)

---

## 🏗️ Architecture Client-Side

```
┌─────────────────────────────────────────────────────────┐
│                   React App (Frontend)                   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │         Pages / Screens (UI Modules)             │  │
│  │  ├─ Dashboard Page                               │  │
│  │  ├─ Employees Page (list/detail)                 │  │
│  │  ├─ Systems Page (list/detail)                   │  │
│  │  ├─ Allocations Page                             │  │
│  │  └─ Categories Page                              │  │
│  └──────────────────────────────────────────────────┘  │
│                       ↓                                  │
│  ┌──────────────────────────────────────────────────┐  │
│  │       Custom Hooks & State Management            │  │
│  │  ├─ useEmployees() - hook לניהול עובדים        │  │
│  │  ├─ useSystems() - hook לניהול מערכות          │  │
│  │  ├─ useAllocations() - hook לניהול הקצאות       │  │
│  │  └─ useFilters() - hook לניהול סינונים          │  │
│  └──────────────────────────────────────────────────┘  │
│                       ↓                                  │
│  ┌──────────────────────────────────────────────────┐  │
│  │           Services / API Layer                    │  │
│  │  ├─ employeeService - API calls לעובדים        │  │
│  │  ├─ systemService - API calls למערכות          │  │
│  │  ├─ allocationService - API calls להקצאות       │  │
│  │  └─ httpClient - Axios instance                 │  │
│  └──────────────────────────────────────────────────┘  │
│                       ↓                                  │
│  ┌──────────────────────────────────────────────────┐  │
│  │    .NET 9 WebAPI Server (Backend)                │  │
│  │  ├─ EmployeesController                          │  │
│  │  └─ SystemController                             │  │
│  └──────────────────────────────────────────────────┘  │
│                       ↓                                  │
│  ┌──────────────────────────────────────────────────┐  │
│  │         MongoDB Database                          │  │
│  │  ├─ employees collection                         │  │
│  │  └─ systems collection                           │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 📁 Folder Structure (React Project)

```
front_enf_react/
├── public/
│   ├── index.html
│   └── favicon.ico
│
├── src/
│   ├── index.jsx                        # Entry point
│   ├── App.jsx                          # Root component
│   │
│   ├── services/                        # API Layer
│   │   ├── api/
│   │   │   ├── httpClient.ts            # Axios config
│   │   │   └── apiConfig.ts             # Base URLs
│   │   │
│   │   ├── employeeService.ts           # Employee API calls
│   │   ├── systemService.ts             # System API calls
│   │   └── allocationService.ts         # Allocation API calls
│   │
│   ├── hooks/                           # Custom React Hooks
│   │   ├── useEmployees.ts              # State & logic for employees
│   │   ├── useSystems.ts                # State & logic for systems
│   │   ├── useAllocations.ts            # State & logic for allocations
│   │   ├── useFilters.ts                # Centralized filter state
│   │   └── usePagination.ts             # Pagination logic
│   │
│   ├── components/                      # Reusable UI Components
│   │   ├── common/
│   │   │   ├── Header.jsx
│   │   │   ├── Navigation.jsx
│   │   │   ├── Toolbar.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   └── Select.jsx
│   │   │
│   │   ├── dashboard/
│   │   │   ├── KPICard.jsx              # Single KPI card
│   │   │   ├── KPIGrid.jsx              # Grid of KPIs
│   │   │   ├── AlertPanel.jsx           # Critical alerts
│   │   │   ├── SummaryPanel.jsx         # Summary info
│   │   │   ├── BarChart.jsx             # Simple bar chart
│   │   │   └── DonutChart.jsx           # Donut chart
│   │   │
│   │   ├── employees/
│   │   │   ├── EmployeeList.jsx         # Employee list
│   │   │   ├── EmployeeCard.jsx         # Employee card
│   │   │   ├── EmployeeDetail.jsx       # Employee profile
│   │   │   ├── EmployeeForm.jsx         # Create/Edit form
│   │   │   └── AllocationDrawer.jsx     # Assignment drawer
│   │   │
│   │   ├── systems/
│   │   │   ├── SystemList.jsx           # System list
│   │   │   ├── SystemCard.jsx           # System card
│   │   │   ├── SystemDetail.jsx         # System profile
│   │   │   ├── BudgetPanel.jsx          # Budget analysis
│   │   │   └── EmployeeAllocationList.jsx
│   │   │
│   │   └── shared/
│   │       ├── GroupPanel.jsx           # Collapsible group
│   │       ├── StatusBadge.jsx          # Status display
│   │       ├── MetricMini.jsx           # Small metric display
│   │       └── RiskBanner.jsx           # Risk warning banner
│   │
│   ├── pages/                           # Page Components
│   │   ├── DashboardPage.jsx            # Dashboard screen
│   │   ├── EmployeesPage.jsx            # Employees screen
│   │   ├── SystemsPage.jsx              # Systems screen
│   │   ├── CategoriesPage.jsx           # Categories management
│   │   └── NotFoundPage.jsx             # 404
│   │
│   ├── types/                           # TypeScript types/interfaces
│   │   ├── employee.ts                  # Employee types
│   │   ├── system.ts                    # System types
│   │   ├── allocation.ts                # Allocation types
│   │   ├── api.ts                       # API response types
│   │   └── index.ts                     # Export all types
│   │
│   ├── utils/                           # Utility functions
│   │   ├── calculations.ts              # KPI & capacity calculations
│   │   ├── formatters.ts                # Number/date formatting
│   │   ├── validators.ts                # Data validation
│   │   ├── constants.ts                 # App constants
│   │   └── localStorage.ts              # Local storage helpers
│   │
│   ├── context/                         # React Context
│   │   ├── AuthContext.jsx              # Auth state (if needed)
│   │   ├── FilterContext.jsx            # Global filter state
│   │   ├── ThemeContext.jsx             # Theme (Light/Dark)
│   │   └── NotificationContext.jsx      # Toast notifications
│   │
│   ├── styles/                          # CSS/Tailwind
│   │   ├── index.css                    # Global styles
│   │   ├── theme.css                    # Theme variables
│   │   ├── rtl.css                      # RTL support
│   │   └── components/                  # Component-specific styles
│   │
│   └── App.css                          # Root styles
│
├── package.json
├── tsconfig.json                        # TypeScript config
├── vite.config.js                       # Vite config (if using Vite)
└── .env.example                         # Environment variables template
```

---

## 🔗 Data Model Mapping

### **Backend DTOs → Frontend Types**

```typescript
// Backend: EmployeeListItemDto
// Frontend TypeScript Interface
interface Employee {
  id: string;                      // Id
  fullName: string;                // FullName
  professionalCategory: string;    // ProfessionalCategory
  professionalSubCategory?: string;// ProfessionalSubCategory
  managerName: string;             // ManagerName
  year: number;                    // Year
  yearlyCapacityMonths: number;    // YearlyCapacityMonths
  allocatedMonths: number;         // AllocatedMonths
  remainingMonths: number;         // RemainingMonths (calculated)
  availabilityStatus: string;      // AvailabilityStatus
  assignedSystemsCount: number;    // AssignedSystemsCount
  upcomingEvent?: string;          // UpcomingEvent
}

// Backend: EmployeeDetailsDto
interface EmployeeDetails extends Employee {
  notes?: string;                  // Notes
  managerReviewNote?: string;      // ManagerReviewNote
  relevantChanges: Change[];       // RelevantChanges
  allocations: Allocation[];       // Allocations
}

// Backend: Allocation (nested in Employee)
interface Allocation {
  systemId: string;                // SystemId
  systemName: string;              // Name (calculated from SystemId)
  roleInSystem: string;            // RoleInSystem
  plannedMonths: number;           // PlannedMonths
  actualMonths: number;            // ActualMonths
  capacityStatus?: string;         // Calculated status
}

// Backend: SystemListItemDto
interface System {
  id: string;                      // Id
  name: string;                    // Name
  requiredCapacityMonths: number;  // RequiredCapacityMonths
  allocatedMonths: number;         // AllocatedMonths (calculated)
  gap: number;                     // Gap (calculated)
  capacityStatus: string;          // CapacityStatus
  assignedEmployeesCount: number;  // AssignedEmployeesCount
}

// Backend: SystemDetailsDto
interface SystemDetails extends System {
  managementNote?: string;         // ManagementNote
  updatedAt?: string;              // UpdatedAt
  assignedEmployees: Employee[];   // AssignedEmployees
  changes: Change[];               // Changes
  totalBudget: number;             // TotalBudget
  totalPlannedMonths: number;      // TotalPlannedMonths
  totalActualMonths: number;       // TotalActualMonths
  variancePercent: number;         // VariancePercent
}

// Changes
interface Change {
  date: string;                    // DD/MM/YYYY
  type: 'info' | 'warn' | 'danger' | 'ok';
  title: string;
  impact: string;
}
```

---

## 🎯 Implementation Sequence (שלבי הפעלה)

### **שלב 1: Setup & Infrastructure (1-2 ימים)**

#### 1.1 Project Setup
```bash
# יצירת React project עם TypeScript
npm create vite@latest front_enf_react -- --template react-ts
cd front_enf_react
npm install

# התקנת dependencies
npm install axios react-router-dom zustand tailwindcss recharts
npm install -D typescript @types/react @types/node
```

#### 1.2 Configure Environment
```bash
# .env.example
VITE_API_BASE_URL=http://localhost:5000/api
VITE_API_TIMEOUT=10000
```

#### 1.3 Create Base API Client
```typescript
// src/services/api/httpClient.ts
import axios from 'axios';

const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '10000'),
  headers: {
    'Content-Type': 'application/json'
  }
});

// Error handling interceptor
httpClient.interceptors.response.use(
  response => response.data,
  error => {
    console.error('API Error:', error.response?.data);
    throw error;
  }
);

export default httpClient;
```

---

### **שלב 2: Type Definitions (1 יום)**

#### 2.1 Create TypeScript Interfaces
```typescript
// src/types/employee.ts
export interface Employee {
  id: string;
  fullName: string;
  professionalCategory: string;
  professionalSubCategory?: string;
  managerName: string;
  year: number;
  yearlyCapacityMonths: number;
  allocatedMonths: number;
  remainingMonths: number;
  availabilityStatus: string;
  assignedSystemsCount: number;
  upcomingEvent?: string;
}

export interface EmployeeDetails extends Employee {
  notes?: string;
  allocations: Allocation[];
}

export interface Allocation {
  systemId: string;
  systemName: string;
  roleInSystem: string;
  plannedMonths: number;
  actualMonths: number;
}

// src/types/system.ts
export interface System {
  id: string;
  name: string;
  requiredCapacityMonths: number;
  allocatedMonths: number;
  gap: number;
  capacityStatus: string;
  assignedEmployeesCount: number;
}

export interface SystemDetails extends System {
  assignedEmployees: Employee[];
  totalBudget: number;
  totalActualMonths: number;
}
```

---

### **שלב 3: API Service Layer (1-2 ימים)**

#### 3.1 Employee Service
```typescript
// src/services/employeeService.ts
import httpClient from './api/httpClient';
import { Employee, EmployeeDetails } from '../types';

export const employeeService = {
  // Get employees list with filters
  getEmployees: async (filters?: {
    year?: number;
    managerName?: string;
    professionalCategory?: string;
    systemId?: string;
    search?: string;
  }) => {
    return httpClient.get<Employee[]>('/employees', { params: filters });
  },

  // Get employee details
  getEmployeeById: async (id: string) => {
    return httpClient.get<EmployeeDetails>(`/employees/${id}`);
  },

  // Create employee
  createEmployee: async (data: Partial<Employee>) => {
    return httpClient.post<{ id: string }>('/employees', data);
  },

  // Update employee
  updateEmployee: async (id: string, data: Partial<Employee>) => {
    return httpClient.put(`/employees/${id}`, data);
  },

  // Delete employee
  deleteEmployee: async (id: string) => {
    return httpClient.delete(`/employees/${id}`);
  },

  // Add allocation
  addAllocation: async (employeeId: string, allocation: Partial<Allocation>) => {
    return httpClient.post(`/employees/${employeeId}/allocations`, allocation);
  },

  // Update allocation months
  updateAllocationMonths: async (
    employeeId: string,
    systemId: string,
    roleInSystem: string,
    actualMonths: number
  ) => {
    return httpClient.put(
      `/employees/${employeeId}/allocation-months`,
      null,
      {
        params: { systemId, roleInSystem, actualMonths }
      }
    );
  }
};
```

#### 3.2 System Service
```typescript
// src/services/systemService.ts
import httpClient from './api/httpClient';
import { System, SystemDetails } from '../types';

export const systemService = {
  // Get systems list
  getSystems: async (filters?: {
    year?: number;
    status?: string;
    search?: string;
  }) => {
    return httpClient.get<System[]>('/system', { params: filters });
  },

  // Get systems with shortage
  getSystemsWithShortage: async () => {
    return httpClient.get<System[]>('/system/shortage');
  },

  // Get system details
  getSystemById: async (id: string) => {
    return httpClient.get<SystemDetails>(`/system/${id}`);
  },

  // Export systems to Excel
  exportToExcel: async (year?: number, status?: string) => {
    return httpClient.get('/system/export', {
      params: { year, status },
      responseType: 'blob'
    });
  }
};
```

---

### **שלב 4: Custom Hooks (1-2 ימים)**

#### 4.1 useEmployees Hook
```typescript
// src/hooks/useEmployees.ts
import { useState, useEffect } from 'react';
import { employeeService } from '../services/employeeService';
import { Employee, EmployeeDetails } from '../types';

export const useEmployees = (filters?: any) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load employees list
  const loadEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await employeeService.getEmployees(filters);
      setEmployees(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading employees');
    } finally {
      setLoading(false);
    }
  };

  // Load specific employee
  const loadEmployee = async (id: string) => {
    try {
      setLoading(true);
      const data = await employeeService.getEmployeeById(id);
      setSelectedEmployee(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading employee');
    } finally {
      setLoading(false);
    }
  };

  // Create employee
  const createEmployee = async (data: Partial<Employee>) => {
    try {
      const result = await employeeService.createEmployee(data);
      await loadEmployees();
      return result.id;
    } catch (err) {
      throw err;
    }
  };

  // Update employee
  const updateEmployee = async (id: string, data: Partial<Employee>) => {
    try {
      await employeeService.updateEmployee(id, data);
      await loadEmployees();
      if (selectedEmployee?.id === id) {
        await loadEmployee(id);
      }
    } catch (err) {
      throw err;
    }
  };

  // Delete employee
  const deleteEmployee = async (id: string) => {
    try {
      await employeeService.deleteEmployee(id);
      await loadEmployees();
    } catch (err) {
      throw err;
    }
  };

  useEffect(() => {
    loadEmployees();
  }, [filters]);

  return {
    employees,
    selectedEmployee,
    loading,
    error,
    loadEmployees,
    loadEmployee,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    setSelectedEmployee
  };
};
```

#### 4.2 useSystems Hook
```typescript
// src/hooks/useSystems.ts
import { useState, useEffect } from 'react';
import { systemService } from '../services/systemService';
import { System, SystemDetails } from '../types';

export const useSystems = (filters?: any) => {
  const [systems, setSystems] = useState<System[]>([]);
  const [selectedSystem, setSelectedSystem] = useState<SystemDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSystems = async () => {
    try {
      setLoading(true);
      const data = await systemService.getSystems(filters);
      setSystems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading systems');
    } finally {
      setLoading(false);
    }
  };

  const loadSystem = async (id: string) => {
    try {
      setLoading(true);
      const data = await systemService.getSystemById(id);
      setSelectedSystem(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading system');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSystems();
  }, [filters]);

  return {
    systems,
    selectedSystem,
    loading,
    error,
    loadSystems,
    loadSystem,
    setSelectedSystem
  };
};
```

---

### **שלב 5: Core Components (2-3 ימים)**

#### 5.1 Dashboard Components
```typescript
// src/components/dashboard/KPICard.tsx
import React from 'react';

interface KPICardProps {
  label: string;
  value: number;
  status?: 'ok' | 'warn' | 'danger';
  onClick?: () => void;
}

export const KPICard: React.FC<KPICardProps> = ({ label, value, status, onClick }) => {
  const statusClasses = {
    ok: 'border-green-500 bg-green-50',
    warn: 'border-orange-500 bg-orange-50',
    danger: 'border-red-500 bg-red-50'
  };

  return (
    <div
      className={`p-4 border-2 rounded-lg cursor-pointer hover:shadow-lg ${
        status ? statusClasses[status] : 'border-gray-200 bg-white'
      }`}
      onClick={onClick}
    >
      <div className="text-sm text-gray-600 font-semibold mb-2">{label}</div>
      <div className="text-3xl font-bold">{value}</div>
    </div>
  );
};

// src/components/dashboard/KPIGrid.tsx
import React from 'react';
import { KPICard } from './KPICard';

interface KPIGridProps {
  systemsAtRisk: number;
  totalGap: number;
  utilizationRate: number;
  healthScore: number;
  onDrill?: (metric: string) => void;
}

export const KPIGrid: React.FC<KPIGridProps> = ({
  systemsAtRisk,
  totalGap,
  utilizationRate,
  healthScore,
  onDrill
}) => {
  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      <KPICard
        label="מערכות בסיכון"
        value={systemsAtRisk}
        status={systemsAtRisk > 0 ? 'danger' : 'ok'}
        onClick={() => onDrill?.('risk')}
      />
      <KPICard
        label="פער קיבולת"
        value={totalGap}
        status={totalGap > 0 ? 'danger' : 'ok'}
        onClick={() => onDrill?.('gap')}
      />
      <KPICard
        label="ניצול קיבולת"
        value={utilizationRate}
        status={utilizationRate > 90 ? 'danger' : utilizationRate > 75 ? 'warn' : 'ok'}
      />
      <KPICard
        label="ציון בריאות"
        value={healthScore}
        status={healthScore >= 75 ? 'ok' : healthScore >= 50 ? 'warn' : 'danger'}
      />
    </div>
  );
};
```

#### 5.2 Employee List Component
```typescript
// src/components/employees/EmployeeCard.tsx
import React from 'react';
import { Employee } from '../../types';

interface EmployeeCardProps {
  employee: Employee;
  onClick?: () => void;
}

export const EmployeeCard: React.FC<EmployeeCardProps> = ({ employee, onClick }) => {
  const statusColors = {
    'זמינות תקינה': 'text-green-600',
    'קיבולת נמוכה': 'text-orange-600',
    'עומס יתר': 'text-red-600'
  };

  return (
    <div
      className="p-4 border rounded-lg bg-white hover:shadow-lg cursor-pointer"
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-bold text-lg">{employee.fullName}</h3>
          <p className="text-sm text-gray-600">
            {employee.professionalSubCategory} · {employee.professionalCategory}
          </p>
          <p className="text-xs text-gray-500">מנהל: {employee.managerName}</p>
        </div>
        <span
          className={`text-xs font-bold px-2 py-1 rounded-full ${
            statusColors[employee.availabilityStatus as keyof typeof statusColors] || ''
          }`}
        >
          {employee.availabilityStatus}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2 pt-3 border-t text-center text-sm">
        <div>
          <div className="text-gray-600">קיבולת</div>
          <div className="font-bold">{employee.yearlyCapacityMonths}</div>
        </div>
        <div>
          <div className="text-gray-600">מנוצל</div>
          <div className="font-bold">{employee.allocatedMonths}</div>
        </div>
        <div>
          <div className="text-gray-600">יתרה</div>
          <div className={`font-bold ${employee.remainingMonths < 0 ? 'text-red-600' : 'text-green-600'}`}>
            {employee.remainingMonths}
          </div>
        </div>
        <div>
          <div className="text-gray-600">מערכות</div>
          <div className="font-bold">{employee.assignedSystemsCount}</div>
        </div>
      </div>
    </div>
  );
};

// src/components/employees/EmployeeList.tsx
import React, { useState } from 'react';
import { Employee } from '../../types';
import { EmployeeCard } from './EmployeeCard';

interface EmployeeListProps {
  employees: Employee[];
  onSelect?: (employee: Employee) => void;
  loading?: boolean;
}

export const EmployeeList: React.FC<EmployeeListProps> = ({ employees, onSelect, loading }) => {
  if (loading) return <div className="text-center py-8">טוען...</div>;

  return (
    <div className="grid grid-cols-3 gap-4">
      {employees.map(employee => (
        <EmployeeCard
          key={employee.id}
          employee={employee}
          onClick={() => onSelect?.(employee)}
        />
      ))}
    </div>
  );
};
```

---

### **שלב 6: Pages Assembly (2-3 ימים)**

#### 6.1 Dashboard Page
```typescript
// src/pages/DashboardPage.tsx
import React, { useMemo } from 'react';
import { useEmployees } from '../hooks/useEmployees';
import { useSystems } from '../hooks/useSystems';
import { KPIGrid } from '../components/dashboard/KPIGrid';
import { calculateKPIs } from '../utils/calculations';

export const DashboardPage: React.FC = () => {
  const { employees } = useEmployees();
  const { systems } = useSystems();

  const kpis = useMemo(() => {
    return calculateKPIs(employees, systems);
  }, [employees, systems]);

  const handleDrill = (metric: string) => {
    console.log('Drilling into:', metric);
    // Navigate to specific tab with filters
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">דשבורד ניהולי</h1>
      
      <KPIGrid
        systemsAtRisk={kpis.systemsAtRisk}
        totalGap={kpis.totalGap}
        utilizationRate={kpis.utilizationRate}
        healthScore={kpis.healthScore}
        onDrill={handleDrill}
      />

      {/* Additional dashboard panels */}
      <div className="grid grid-cols-2 gap-6 mt-6">
        {/* Critical Issues Panel */}
        {/* Summary Panel */}
      </div>
    </div>
  );
};
```

#### 6.2 Employees Page
```typescript
// src/pages/EmployeesPage.tsx
import React, { useState, useMemo } from 'react';
import { useEmployees } from '../hooks/useEmployees';
import { EmployeeList } from '../components/employees/EmployeeList';

export const EmployeesPage: React.FC = () => {
  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    manager: 'all'
  });

  const { employees, selectedEmployee, loading, loadEmployee } = useEmployees(filters);

  const categories = useMemo(() => {
    return [...new Set(employees.map(e => e.professionalCategory))];
  }, [employees]);

  const managers = useMemo(() => {
    return [...new Set(employees.map(e => e.managerName))];
  }, [employees]);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">ניהול עובדים</h1>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg mb-6 shadow">
        <div className="flex gap-4 flex-wrap">
          <input
            type="text"
            placeholder="חיפוש עובד..."
            value={filters.search}
            onChange={e => setFilters({ ...filters, search: e.target.value })}
            className="px-3 py-2 border rounded"
          />
          <select
            value={filters.category}
            onChange={e => setFilters({ ...filters, category: e.target.value })}
            className="px-3 py-2 border rounded"
          >
            <option value="all">כל הקטגוריות</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <select
            value={filters.manager}
            onChange={e => setFilters({ ...filters, manager: e.target.value })}
            className="px-3 py-2 border rounded"
          >
            <option value="all">כל המנהלים</option>
            {managers.map(mgr => (
              <option key={mgr} value={mgr}>
                {mgr}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Employees List */}
      <EmployeeList
        employees={employees}
        onSelect={emp => loadEmployee(emp.id)}
        loading={loading}
      />

      {/* Employee Detail Panel */}
      {selectedEmployee && (
        <div className="mt-8 p-6 bg-white rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-4">{selectedEmployee.fullName}</h2>
          {/* Detail content */}
        </div>
      )}
    </div>
  );
};
```

---

### **שלב 7: Utilities & Calculations (1 יום)**

#### 7.1 KPI Calculations
```typescript
// src/utils/calculations.ts
import { Employee, System } from '../types';

export interface KPIMetrics {
  systemsAtRisk: number;
  systemsInShortage: number;
  systemsBalanced: number;
  totalGap: number;
  surplus: number;
  utilizationRate: number;
  lowCapacityEmployees: number;
  overloadedEmployees: number;
  healthScore: number;
}

export const calculateKPIs = (
  employees: Employee[],
  systems: System[]
): KPIMetrics => {
  // Systems analysis
  const systemsAtRisk = systems.filter(s => s.gap > 4).length;
  const systemsInShortage = systems.filter(s => s.gap > 0 && s.gap <= 4).length;
  const systemsBalanced = systems.filter(s => s.gap === 0 || s.gap < 0).length;

  // Capacity analysis
  const totalGap = systems.reduce((sum, s) => sum + Math.max(0, s.gap), 0);
  const surplus = systems.reduce((sum, s) => sum + Math.abs(Math.min(0, s.gap)), 0);
  const totalCapacity = employees.reduce((sum, e) => sum + e.yearlyCapacityMonths, 0);
  const totalAllocated = employees.reduce((sum, e) => sum + e.allocatedMonths, 0);
  const utilizationRate = totalCapacity > 0 ? Math.round((totalAllocated / totalCapacity) * 100) : 0;

  // Employee stress
  const lowCapacityEmployees = employees.filter(e => e.remainingMonths <= 1).length;
  const overloadedEmployees = employees.filter(e => e.remainingMonths < 0).length;

  // Health score calculation
  const healthFactors = [
    systemsBalanced / (systems.length || 1),
    Math.max(0, 1 - (totalGap / (totalCapacity || 1))),
    Math.max(0, 1 - (lowCapacityEmployees / (employees.length || 1)))
  ];
  const healthScore = Math.round((healthFactors.reduce((a, b) => a + b, 0) / healthFactors.length) * 100);

  return {
    systemsAtRisk,
    systemsInShortage,
    systemsBalanced,
    totalGap,
    surplus,
    utilizationRate,
    lowCapacityEmployees,
    overloadedEmployees,
    healthScore
  };
};

// Status determination
export const getEmployeeStatus = (remainingMonths: number): string => {
  if (remainingMonths < 0) return 'עומס יתר';
  if (remainingMonths <= 1) return 'קיבולת נמוכה';
  return 'זמינות תקינה';
};

export const getSystemStatus = (gap: number): string => {
  if (gap > 4) return 'At Risk';
  if (gap > 0) return 'Shortage';
  if (gap < -2) return 'Excess';
  return 'OK';
};
```

---

### **שלב 8: Routing & Navigation (1 יום)**

#### 8.1 App Router Setup
```typescript
// src/App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { DashboardPage } from './pages/DashboardPage';
import { EmployeesPage } from './pages/EmployeesPage';
import { SystemsPage } from './pages/SystemsPage';
import { NotFoundPage } from './pages/NotFoundPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="flex h-screen bg-gray-50" dir="rtl">
        {/* Sidebar Navigation */}
        <nav className="w-64 bg-white shadow-lg p-4">
          <h1 className="text-xl font-bold mb-8">ניהול קיבולת</h1>
          <ul className="space-y-2">
            <li>
              <Link
                to="/"
                className="block p-2 rounded hover:bg-gray-100 font-semibold"
              >
                דשבורד ניהולי
              </Link>
            </li>
            <li>
              <Link
                to="/employees"
                className="block p-2 rounded hover:bg-gray-100"
              >
                עובדים
              </Link>
            </li>
            <li>
              <Link
                to="/systems"
                className="block p-2 rounded hover:bg-gray-100"
              >
                מערכות
              </Link>
            </li>
          </ul>
        </nav>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/employees" element={<EmployeesPage />} />
            <Route path="/systems" element={<SystemsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
};

export default App;
```

---

### **שלב 9: Testing & Integration (2-3 ימים)**

#### 9.1 Test API Connection
```typescript
// src/services/__tests__/employeeService.test.ts
import { employeeService } from '../employeeService';

describe('Employee Service', () => {
  it('should fetch employees', async () => {
    const employees = await employeeService.getEmployees();
    expect(Array.isArray(employees)).toBe(true);
  });

  it('should fetch employee by id', async () => {
    const employee = await employeeService.getEmployeeById('test-id');
    expect(employee).toBeDefined();
  });
});
```

#### 9.2 Test Calculations
```typescript
// src/utils/__tests__/calculations.test.ts
import { calculateKPIs } from '../calculations';

describe('KPI Calculations', () => {
  it('should calculate health score correctly', () => {
    const mockEmployees = [...];
    const mockSystems = [...];
    
    const kpis = calculateKPIs(mockEmployees, mockSystems);
    expect(kpis.healthScore).toBeGreaterThanOrEqual(0);
    expect(kpis.healthScore).toBeLessThanOrEqual(100);
  });
});
```

---

## 🚀 Implementation Roadmap (תוכנית הזמנים)

```
שבוע 1 - Setup & Infrastructure
├─ יום 1-2: Setup React, TypeScript, Dependencies
├─ יום 3: API Client & Error Handling
├─ יום 4-5: Type Definitions & DTOs
└─ יום 5: Environment & Config

שבוע 2 - API Integration
├─ יום 6-7: Employee Service API calls
├─ יום 8: System Service API calls
├─ יום 9: Error handling & Interceptors
└─ יום 10: Test all endpoints

שבוע 3 - Hooks & State Management
├─ יום 11: useEmployees Hook
├─ יום 12: useSystems Hook
├─ יום 13: useFilters Hook
└─ יום 14: useCalculations Hook

שבוע 4 - Components
├─ יום 15-16: Dashboard Components
├─ יום 17-18: Employee Components
├─ יום 19: System Components
└─ יום 20: Shared Components

שבוע 5 - Pages
├─ יום 21: Dashboard Page
├─ יום 22: Employees Page
├─ יום 23: Systems Page
└─ יום 24: Navigation & Routing

שבוע 6 - Utilities & Testing
├─ יום 25: Calculation Utilities
├─ יום 26: Formatter & Validators
├─ יום 27-28: Unit Tests
└─ יום 29-30: Integration Tests

שבוע 7 - Polish & Deploy
├─ יום 31: Performance Optimization
├─ יום 32: Responsive Design
├─ יום 33: Dark Mode Support
└─ יום 34-35: Deployment & Monitoring
```

---

## 🔗 API Integration Checklist

- [ ] HTTP Client configured with base URL
- [ ] Employee Service implemented
- [ ] System Service implemented
- [ ] Error handling & retry logic
- [ ] Request/Response interceptors
- [ ] Types aligned with backend DTOs
- [ ] Mock data for development
- [ ] Unit tests for services
- [ ] Integration tests with real API

---

## 📊 Performance Targets

| Metric | Target | Comments |
|--------|--------|----------|
| Dashboard Load | <500ms | Cached employee/system lists |
| API Response | <200ms | MongoDB + .NET 9 optimized |
| Search | <100ms | Client-side filtering |
| Allocation Update | <1s | Server + cache refresh |
| Page Transition | <300ms | React Router optimized |

---

## 🔐 Security Considerations

- [ ] HTTPS only in production
- [ ] CORS configured properly
- [ ] API rate limiting
- [ ] Input validation on client
- [ ] XSS protection (sanitize HTML)
- [ ] CSRF tokens if needed
- [ ] Authentication headers (Bearer token)
- [ ] Error messages don't leak sensitive data

---

## 📝 Notes

**Ready to Start?**
1. Create React project with Vite
2. Install dependencies
3. Create src/services/api/httpClient.ts
4. Test connection to backend
5. Build types from backend DTOs
6. Implement employee service
7. Create first hook (useEmployees)
8. Build dashboard component
9. Wire up routing
10. Deploy & monitor

**Backend Status:** ✅ Ready  
**Frontend Status:** ⏳ Waiting to Start  
**Integration Status:** ⏳ Ready When Frontend Components Complete

