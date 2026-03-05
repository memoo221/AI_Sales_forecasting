const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
}

function setToken(token: string) {
  localStorage.setItem("accessToken", token);
}

function clearSession() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("user");
}

let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

async function refreshAccessToken(): Promise<string> {
  if (isRefreshing) {
    // Wait for the in-progress refresh to complete
    return new Promise((resolve, reject) => {
      refreshQueue.push((token) => (token ? resolve(token) : reject()));
    });
  }

  isRefreshing = true;
  try {
    const res = await fetch(`${API_BASE}/auth/refreshtoken`, {
      method: "POST",
      credentials: "include", // sends the httpOnly refresh cookie
    });

    if (!res.ok) {
      clearSession();
      window.location.href = "/login";
      throw new Error("Session expired");
    }

    const data = await res.json();
    setToken(data.accessToken);
    refreshQueue.forEach((cb) => cb(data.accessToken));
    return data.accessToken;
  } finally {
    isRefreshing = false;
    refreshQueue = [];
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  retry = true
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (res.status === 401 && retry) {
    const newToken = await refreshAccessToken();
    return request<T>(path, {
      ...options,
      headers: { ...options.headers, Authorization: `Bearer ${newToken}` },
    }, false);
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(err.message || err.error || `HTTP ${res.status}`);
  }

  return res.json();
}

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    request<{ accessToken: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  register: (data: { email: string; password: string; companyName: string }) =>
    request<{ accessToken: string; user: User }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  logout: () => request("/auth/logout", { method: "POST" }),
};

// Sales
export const salesApi = {
  upload: async (file: File): Promise<UploadResult> => {
    const token = getToken();
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${API_BASE}/sales/upload`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: "include",
      body: formData,
    });

    if (res.status === 401) {
      const newToken = await refreshAccessToken();
      const retryRes = await fetch(`${API_BASE}/sales/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${newToken}` },
        credentials: "include",
        body: formData,
      });
      if (!retryRes.ok) {
        const err = await retryRes.json().catch(() => ({ message: "Upload failed" }));
        throw new Error(err.message || `HTTP ${retryRes.status}`);
      }
      return retryRes.json();
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: "Upload failed" }));
      throw new Error(err.message || `HTTP ${res.status}`);
    }

    return res.json();
  },

  getAll: () => request<Sale[]>("/sales"),
};

// Products
export const productsApi = {
  getAll: () => request<Product[]>("/products"),
};

// Assistant
export const assistantApi = {
  chat: (messages: ChatMessage[]) =>
    request<{ reply: string }>("/assistant/chat", {
      method: "POST",
      body: JSON.stringify({ messages }),
    }),
};

// Types
export interface User {
  id: string;
  email: string;
  companyId: string;
  role: string;
}

export interface Sale {
  id: string;
  date: string;
  revenue: number | null;
  quantity: number | null;
  product: { name: string; category: string | null };
}

export interface Product {
  id: string;
  name: string;
  category: string | null;
  forecasts: Forecast[];
}

export interface Forecast {
  targetDate: string;
  predicted: number;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface UploadResult {
  message: string;
  inserted: number;
  forecast?: unknown;
}
