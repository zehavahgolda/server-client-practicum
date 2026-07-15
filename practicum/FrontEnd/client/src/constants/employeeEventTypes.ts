export const employeeEventTypeOptions = [
  { value: "ExtendedAbsence", label: "היעדרות ממושכת" },
  { value: "ParentalLeave", label: "חופשת לידה" },
  { value: "ReserveDuty", label: "מילואים" },
  { value: "AvailabilityChange", label: "שינוי זמינות" },
  { value: "SpecialLeave", label: "חופשה מיוחדת" },
  { value: "Other", label: "אחר" }
] as const;

export type EmployeeEventTypeValue =
  (typeof employeeEventTypeOptions)[number]["value"];