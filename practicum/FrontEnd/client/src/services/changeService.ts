import httpClient from "./api/httpClient";
import type { Change, Timeline, ChangeFilters } from "../types";

export const changeService = {
  // מחזירה רשימת שינויים לפי פילטרים אופציונליים.
  // הפילטרים נשלחים לשרת כדי לצמצם את המידע שמתקבל כבר בשכבת ה-API.
  async getChanges(filters: ChangeFilters = {}): Promise<Change[]> {
    const response = await httpClient.get<Change[]>("/Change", {
      params: filters
    });
    return response.data || [];
  },

  // מחזירה נתוני ציר זמן של שינויים, עם אפשרות סינון לפי שנה.
  // התוצאה מיועדת להצגה כרצף אירועים לאורך זמן בדשבורד/מסך שינויים.
  async getTimeline(year?: number): Promise<Timeline[]> {
    const response = await httpClient.get<Timeline[]>("/Change/timeline", {
      params: { year }
    });
    return response.data || [];
  },

  // מחזירה את כל השינויים המשויכים לישות ספציפית לפי מזהה.
  // שימושי למסכי פירוט שבהם רוצים היסטוריית שינויים עבור עובד/מערכת/קטגוריה.
  async getChangesByEntity(entityId: string): Promise<Change[]> {
    const response = await httpClient.get<Change[]>(`/Change/entity/${entityId}`);
    return response.data || [];
  }
};
