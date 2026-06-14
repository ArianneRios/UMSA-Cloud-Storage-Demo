const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class ApiClient {
  private getToken(): string | null {
    return localStorage.getItem('umsa_cloud_access_token');
  }

  setToken(token: string): void {
    localStorage.setItem('umsa_cloud_access_token', token);
  }

  clearToken(): void {
    localStorage.removeItem('umsa_cloud_access_token');
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const headers = new Headers(options?.headers);
    
    if (!headers.has('Content-Type') && !(options?.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    const token = this.getToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        // ignore
      }
      throw new Error((errorData && errorData.message) ? errorData.message : `API Error: ${response.statusText}`);
    }

    return response.json();
  }

  async authLogin(correo: string, password: string) {
    return this.request<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ correo, password }),
    });
  }

  async authMe() {
    return this.request<any>('/auth/me');
  }

  async uploadArchivo(file: File) {
    const formData = new FormData();
    formData.append('archivo', file);
    return this.request<any>('/archivos/subir', {
      method: 'POST',
      body: formData,
    });
  }

  async getMisArchivos() {
    return this.request<any[]>('/archivos/mis-archivos');
  }

  async getHistorial() {
    return this.request<any[]>('/archivos/historial');
  }

  async getEstadoArchivo(id: string | number) {
    return this.request<any>(`/archivos/${id}/estado`);
  }

  async getUrlDescarga(id: string | number) {
    return this.request<any>(`/archivos/${id}/descargar`);
  }

  async deleteArchivo(id: string | number) {
    return this.request<any>(`/archivos/${id}`, {
      method: 'DELETE',
    });
  }
}

export const apiClient = new ApiClient();
