import axios from "axios";

type HttpClientError = Error & {
  status?: number;
};

// יוצר מופע Axios מרכזי לכל קריאות ה-API באפליקציה.
// כאן מוגדרים כתובת הבסיס, timeout וכותרות ברירת מחדל לכל בקשה.
const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: Number(import.meta.env.VITE_API_TIMEOUT || 10000),
  headers: {
    "Content-Type": "application/json"
  }
});

// אינטרספטור תגובות שמאחד טיפול בשגיאות רשת/שרת במקום אחד.
// במקרה שגיאה נשלפת הודעה קריאה מהתגובה ומוחזרת כשגיאת Error סטנדרטית.
httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const responseData = error?.response?.data;

    const message =
      (typeof responseData === "string" && responseData) ||
      responseData?.message ||
      responseData?.error ||
      error?.message ||
      "Unknown API error";

    const normalizedError: HttpClientError = new Error(String(message));
    normalizedError.status = error?.response?.status;

    return Promise.reject(normalizedError);
  }
);

export default httpClient;
