import httpClient from "./api/httpClient";
import type { System, SystemDetails, SystemFilters, SystemCreateDto, SystemUpdateDto } from "../types";

// מנרמלת אובייקט מערכת בסיסי כדי להבטיח ערכי ברירת מחדל עקביים ב-UI.
// הפונקציה מטפלת במיוחד בשדות טקסט ותקציב שעלולים להגיע ריקים או חסרים מהשרת.
function normalizeSystem(item: System): System {
  return {
    ...item,
    name: item.name?.trim() || "ללא שם",
    capacityStatus: item.capacityStatus?.trim() || "לא מוגדר",
    allocatedBudget: item.allocatedBudget || 0,
    usedBudget: item.usedBudget || 0,
    budgetGap: item.budgetGap || 0
  };
}

// מנרמלת פרטי מערכת מורחבים (כולל רשימות ושדות תקציב/ביצועים נוספים).
// כך הקליינט תמיד מקבל מבנה צפוי למסך הפירוט גם אם חלק מהשדות חסרים בתגובה.
function normalizeSystemDetails(item: SystemDetails): SystemDetails {
  return {
    ...normalizeSystem(item),
    assignedEmployees: item.assignedEmployees || [],
    changes: item.changes || [],

    allocatedBudget: item.allocatedBudget || 0,
    usedBudget: item.usedBudget || 0,
    budgetGap: item.budgetGap || 0,

    totalBudget: item.totalBudget || 0,
    totalPlannedMonths: item.totalPlannedMonths || 0,
    totalActualMonths: item.totalActualMonths || 0,
    variancePercent: item.variancePercent || 0
  };
}

export const systemService = {
  // מחזירה רשימת מערכות לפי פילטרים אופציונליים (שנה, סטטוס וכדומה).
  // כל מערכת עוברת נרמול לפני החזרה כדי לשמור על יציבות בהצגה ובחישובים.
  async getSystems(filters: SystemFilters = {}): Promise<System[]> {
    const response = await httpClient.get<System[]>("/System", {
      params: filters
    });
    return (response.data || []).map(normalizeSystem);
  },

  // מחזירה רק מערכות שנמצאות בחוסר (shortage) לפי הלוגיקה בצד השרת.
  // התוצאה מנורמלת כדי לשמור על אותו חוזה נתונים כמו שאר קריאות המערכות.
  async getSystemsWithShortage(): Promise<System[]> {
    const response = await httpClient.get<System[]>("/System/shortage");
    return (response.data || []).map(normalizeSystem);
  },

 // מחזירה פרטי מערכת מלאה לפי מזהה מערכת.
 // לאחר השליפה מתבצע נרמול מורחב כדי לוודא שכל השדות הנדרשים למסך זמינים.
 async getSystemById(id: string): Promise<SystemDetails> {
  const response = await httpClient.get<SystemDetails>(`/System/${id}`);

  return normalizeSystemDetails(response.data);
},
  // מייצאת נתוני מערכות לקובץ Excel לפי שנה וסטטוס אופציונליים.
  // מחזירה Blob לצורך הורדה ושמירה בצד הלקוח.
  async exportToExcel(year?: number, status?: string): Promise<Blob> {
    const response = await httpClient.get("/System/export", {
      params: { year, status },
      responseType: "blob"
    });
    return response.data;
  },
  // יוצרת מערכת חדשה בשרת ומחזירה את המזהה שנוצר.
  // הקלט נשלח כ-DTO לפי החוזה של ה-API.
  async createSystem(dto: SystemCreateDto): Promise<string> {
  const response = await httpClient.post<string>("/System", dto);
  return response.data;
},
  // מעדכנת מערכת קיימת לפי מזהה ומחזירה את הנתון המעודכן לאחר נרמול.
  // מתאים לזרימות עריכה שבהן צריך להמשיך לעבוד עם פרטי מערכת מלאים.
  async updateSystem(id: string, dto: SystemUpdateDto): Promise<SystemDetails> {
    const response = await httpClient.put<SystemDetails>(`/System/${id}`, dto);
    return normalizeSystemDetails(response.data);
}
};
