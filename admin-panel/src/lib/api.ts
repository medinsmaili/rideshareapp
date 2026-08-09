const API_BASE = "https://api.nisu.app";

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem("nisu_token");
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem("nisu_token", token);
    } else {
      localStorage.removeItem("nisu_token");
    }
  }

  getToken() {
    return this.token;
  }

  isAuthenticated() {
    return !!this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (res.status === 401) {
      this.setToken(null);
      window.location.href = "/login";
      throw new Error("Unauthorized");
    }

    if (!res.ok) {
      const errorBody = await res.text();
      throw new Error(`API error ${res.status}: ${errorBody}`);
    }

    // Handle empty responses
    const text = await res.text();
    if (!text) return {} as T;
    return JSON.parse(text);
  }

  get<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: "GET" });
  }

  post<T>(endpoint: string, body?: unknown) {
    return this.request<T>(endpoint, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  put<T>(endpoint: string, body?: unknown) {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  patch<T>(endpoint: string, body?: unknown) {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  delete<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: "DELETE" });
  }

  // Auth
  async login(email: string, password: string) {
    const data = await this.post<{ access_token: string; user: any }>("/auth/login", { email, password });
    this.setToken(data.access_token);
    return data;
  }

  logout() {
    this.setToken(null);
  }

  // Users
  getProfile() {
    return this.get<any>("/users/profile");
  }

  updateProfile(data: any) {
    return this.put<any>("/users/profile", data);
  }

  getUsers(params?: { start?: number; end?: number; sort?: string; order?: 'ASC' | 'DESC'; q?: string; driver_verification_status?: string; student_verification_status?: string }) {
    const qs = new URLSearchParams();
    if (params?.start != null) qs.set('_start', String(params.start));
    if (params?.end != null) qs.set('_end', String(params.end));
    if (params?.sort) qs.set('_sort', params.sort);
    if (params?.order) qs.set('_order', params.order);
    if (params?.q) qs.set('q', params.q);
    if (params?.driver_verification_status) qs.set('driver_verification_status', params.driver_verification_status);
    if (params?.student_verification_status) qs.set('student_verification_status', params.student_verification_status);
    return this.get<any[]>(`/users${qs.toString() ? `?${qs}` : ''}`);
  }

  createUser(data: any) {
    return this.post<any>("/users", data);
  }

  updateUser(id: string, data: any) {
    return this.put<any>(`/users/${id}`, data);
  }

  deleteUser(id: string) {
    return this.delete<any>(`/users/${id}`);
  }

  // Rides
  getRides() {
    return this.get<any[]>("/rides");
  }

  getRide(id: string) {
    return this.get<any>(`/rides/${id}`);
  }

  deleteRide(id: string) {
    return this.delete<any>(`/rides/${id}`);
  }

  updateRideStatus(id: string, status: string) {
    return this.put<any>(`/rides/${id}`, { status });
  }

  // Bookings
  getBookings(params?: { start?: number; end?: number; sort?: string; order?: 'ASC' | 'DESC' }) {
    const qs = new URLSearchParams();
    if (params?.start != null) qs.set('_start', String(params.start));
    if (params?.end != null) qs.set('_end', String(params.end));
    if (params?.sort) qs.set('_sort', params.sort);
    if (params?.order) qs.set('_order', params.order);
    return this.get<any[]>(`/bookings${qs.toString() ? `?${qs}` : ''}`);
  }

  // NOTE: No PUT /bookings/:id endpoint exists. Only POST (create) and DELETE (cancel).
  cancelBooking(id: string) {
    return this.delete<any>(`/bookings/${id}`);
  }

  // Vehicles
  getVehicles() {
    return this.get<any[]>("/vehicles");
  }

  deleteVehicle(id: string) {
    return this.delete<any>(`/vehicles/${id}`);
  }

  // Cities — admin endpoints at /cities (also available at /locations/cities)
  getCities() {
    return this.get<any[]>("/cities");
  }

  getCity(id: string) {
    return this.get<any>(`/cities/${id}`);
  }

  createCity(data: any) {
    return this.post<any>("/cities", data);
  }

  updateCity(id: string, data: any) {
    return this.put<any>(`/cities/${id}`, data);
  }

  deleteCity(id: string) {
    return this.delete<any>(`/cities/${id}`);
  }

  // Meeting Points (admin CRUD)
  getMeetingPoints() {
    return this.get<any[]>("/meeting-points");
  }

  getMeetingPointsByCity(cityId: string) {
    return this.get<any[]>(`/locations/cities/${cityId}/meeting-points`);
  }

  getMeetingPoint(id: string) {
    return this.get<any>(`/meeting-points/${id}`);
  }

  createMeetingPoint(data: any) {
    return this.post<any>("/meeting-points", data);
  }

  updateMeetingPoint(id: string, data: any) {
    return this.put<any>(`/meeting-points/${id}`, data);
  }

  deleteMeetingPoint(id: string) {
    return this.delete<any>(`/meeting-points/${id}`);
  }

  // Languages
  getLanguages() {
    return this.get<any[]>("/languages");
  }

  createLanguage(data: any) {
    return this.post<any>("/languages", data);
  }

  updateLanguage(id: number, data: any) {
    return this.put<any>(`/languages/${id}`, data);
  }

  deleteLanguage(id: number) {
    return this.delete<any>(`/languages/${id}`);
  }

  // Translations (read-only app translations by lang)
  getTranslations(lang?: string) {
    const qs = lang ? `?lang=${lang}` : "";
    return this.get<any>(`/translations${qs}`);
  }

  // App Translations (CRUD for admin) — backend controller is at /app_translations (underscore)
  getAppTranslations() {
    return this.get<any[] | { data: any[] }>("/app_translations?_start=0&_end=10000");
  }

  createTranslation(data: any) {
    return this.post<any>("/app_translations", data);
  }

  updateTranslation(id: number, data: any) {
    return this.put<any>(`/app_translations/${id}`, data);
  }

  deleteTranslation(id: number) {
    return this.delete<any>(`/app_translations/${id}`);
  }

  // Reports
  getReports() {
    return this.get<any[]>("/reports");
  }

  getReport(id: string) {
    return this.get<any>(`/reports/${id}`);
  }

  updateReport(id: string, data: any) {
    return this.put<any>(`/reports/${id}`, data);
  }

  deleteReport(id: string) {
    return this.delete<any>(`/reports/${id}`);
  }

  // Settings — update by key, not id
  getSettings() {
    return this.get<any[]>("/settings");
  }

  getSetting(key: string) {
    return this.get<any>(`/settings/${key}`);
  }

  updateSetting(key: string, data: any) {
    return this.put<any>(`/settings/${key}`, data);
  }

  // Chat — under rides/:id/messages
  getChatMessages(rideId: string) {
    return this.get<any[]>(`/rides/${rideId}/messages`);
  }

  sendChatMessage(rideId: string, content: string) {
    return this.post<any>(`/rides/${rideId}/messages`, { content });
  }

  // Notifications
  sendTestNotification() {
    return this.post<any>("/notifications/test");
  }

  broadcastNotification(data: { title: string; message: string; audience: 'all' | 'drivers' | 'specific'; user_id?: string }) {
    return this.post<any>("/notifications/broadcast", data);
  }

  // Admin Logs
  getLogs(lines: number = 500) {
    return this.get<{ source: string | null; lines: number; content: string }>(`/admin/logs?lines=${lines}`);
  }

  // Mail test
  sendTestEmail(to?: string) {
    return this.post<any>("/mail/test", to ? { to } : {});
  }
}

export const api = new ApiClient();
