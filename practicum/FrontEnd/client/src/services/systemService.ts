
import httpClient from "./api/httpClient";
import type {
  System,
  SystemDetails,
  SystemFilters,
  SystemCreateDto,
  SystemUpdateDto
} from "../types";

// מנרמלת אובייקט מערכת בסיסי כדי להבטיח ערכי ברירת מחדל עקביים ב-UI.
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

// מנרמלת פרטי מערכת מורחבים כדי לשמור על מבנה צפוי במסך הפירוט.
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

// בונה אובייקט פרמטרים נקי ושולח רק פילטרים שבאמת הוגדרו.
// כך בחירה ב"כל השנים" לא שולחת year לשרת.
function buildSystemQueryParams(filters: SystemFilters) {
  const params: Record<string, string | number> = {};

  if (filters.year !== undefined) {
    params.year = filters.year;
  }

  if (filters.status?.trim()) {
    params.status = filters.status.trim();
  }

  if (filters.ownerManagerName?.trim()) {
    params.ownerManagerName = filters.ownerManagerName.trim();
  }

  if (filters.search?.trim()) {
    params.search = filters.search.trim();
  }

  return params;
}

export const systemService = {
  // מחזירה רשימת מערכות לפי פילטרים אופציונליים.
  async getSystems(filters: SystemFilters = {}): Promise<System[]> {
    const response = await httpClient.get<System[]>("/System", {
      params: buildSystemQueryParams(filters)
    });

    return (response.data || []).map(normalizeSystem);
  },

  // מחזירה רק מערכות שנמצאות בחוסר לפי הלוגיקה בצד השרת.
  async getSystemsWithShortage(): Promise<System[]> {
    const response = await httpClient.get<System[]>("/System/shortage");
    return (response.data || []).map(normalizeSystem);
  },

  // מחזירה פרטי מערכת מלאה לפי מזהה מערכת.
  async getSystemById(id: string): Promise<SystemDetails> {
    const response = await httpClient.get<SystemDetails>(`/System/${id}`);
    return normalizeSystemDetails(response.data);
  },

  // מייצאת נתוני מערכות לקובץ Excel לפי שנה וסטטוס אופציונליים.
  async exportToExcel(year?: number, status?: string): Promise<Blob> {
    const filters: SystemFilters = {
      year,
      status
    };

    const response = await httpClient.get("/System/export", {
      params: buildSystemQueryParams(filters),
      responseType: "blob"
    });

    return response.data;
  },

  // יוצרת מערכת חדשה בשרת.
  async createSystem(dto: SystemCreateDto): Promise<void> {
    await httpClient.post("/System", dto);
  },

  // מעדכנת מערכת קיימת לפי מזהה.
  // השרת מחזיר 204 ללא גוף, ולכן אין ניסיון לנרמל response.data.
  async updateSystem(id: string, dto: SystemUpdateDto): Promise<void> {
    await httpClient.put(`/System/${id}`, dto);
  }
};