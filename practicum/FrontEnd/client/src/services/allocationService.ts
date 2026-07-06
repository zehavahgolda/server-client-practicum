import httpClient from "./api/httpClient";

export interface AllocationUpsertPayload {
  systemId: string;
  roleInSystem: string;
  plannedMonths: number;
  actualMonths: number;
}

export const allocationService = {
  // מוסיפה הקצאה חדשה לעובד במערכת מסוימת.
  // הפונקציה שולחת את כל נתוני ההקצאה לשרת ונשענת על ה-API לשמירה בפועל.
  async addAllocation(employeeId: string, payload: AllocationUpsertPayload): Promise<void> {
    await httpClient.post(`/Employees/${employeeId}/allocations`, payload);
  },

  // מעדכנת את חודשי הביצוע (actualMonths) של הקצאה קיימת לעובד.
  // העדכון נשלח כ-query params לפי החוזה של ה-API, ולכן גוף הבקשה נשאר ריק (null).
  async updateAllocationMonths(payload: {
    employeeId: string;
    systemId: string;
    roleInSystem: string;
    actualMonths: number;
  }): Promise<void> {
    const { employeeId, systemId, roleInSystem, actualMonths } = payload;

    await httpClient.put(`/Employees/${employeeId}/allocation-months`, null, {
      params: { systemId, roleInSystem, actualMonths }
    });
  }
};