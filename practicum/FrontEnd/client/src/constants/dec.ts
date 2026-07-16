// נתיבי API מרכזיים
export const API_ENDPOINT_ROOTS = {
  EMPLOYEES: "/Employees",
  SYSTEMS: "/System",
  CATEGORIES: "/Category",
  CHANGES: "/Change"
} as const;

// נתיבי ניווט מרכזיים
export const ROUTE_PATHS = {
  DASHBOARD: "/",
  EMPLOYEES: "/employees",
  SYSTEMS: "/systems",
  CATEGORIES: "/categories",
  CHANGES: "/changes"
} as const;

// סטטוסים של עובדים
export const EMPLOYEE_STATUS = {
  AVAILABLE: {
    value: "available",
    label: "זמין"
  },
  BALANCED: {
    value: "balanced",
    label: "מלא"
  },
  OVERLOADED: {
    value: "overloaded",
    label: "עומס יתר"
  }
} as const;

// סטטוסים של מערכות
export const SYSTEM_UI_STATUS = {
  ALL: {
    value: "all",
    label: "כל המערכות"
  },
  SHORTAGE: {
    value: "shortage",
    label: "מחסור"
  },
  BALANCED: {
    value: "balanced",
    label: "מאוזן"
  },
  EXCESS: {
    value: "excess",
    label: "עודף"
  }
} as const;

// תווית ברירת מחדל לשדה חסר
export const DEFAULT_UNDEFINED_LABEL = "לא מוגדר";