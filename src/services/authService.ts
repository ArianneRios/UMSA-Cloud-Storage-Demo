import type { AuthUser, LoginCredentials } from '../types';
import { apiClient } from '../api/client';

const AUTH_STORAGE_KEY = 'umsa_cloud_auth_user';

interface LoginResult {
  success: boolean;
  user?: AuthUser;
  error?: string;
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<LoginResult> {
    try {
      if (!credentials.email || !credentials.password) {
        return { success: false, error: 'Email and password are required' };
      }

      const response = await apiClient.authLogin(credentials.email, credentials.password);
      
      if (response.accessToken) {
        apiClient.setToken(response.accessToken);
        
        const backendUser = response.usuario;
        const authUser: AuthUser = {
          id: String(backendUser.idUsuario),
          name: backendUser.nombre,
          email: backendUser.correo,
          career: 'Cloud Computing',
          role: backendUser.rol === 'ESTUDIANTE' ? 'STUDENT' : (backendUser.rol === 'ADMIN' ? 'ADMIN' : 'TECHNICAL'),
          status: 'ACTIVE',
          storage_used: 0,
          max_storage: 5368709120, // 5 GB default
        };
        
        this.storeUser(authUser);
        return { success: true, user: authUser };
      }
      
      return { success: false, error: 'Credenciales inválidas' };
    } catch (error: any) {
      return { success: false, error: error.message || 'Error al iniciar sesión' };
    }
  }

  logout(): void {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    apiClient.clearToken();
  }

  getStoredUser(): AuthUser | null {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) as AuthUser;
      }
    } catch {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
    return null;
  }

  private storeUser(user: AuthUser): void {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  }

  updateStoredUser(user: AuthUser): void {
    this.storeUser(user);
  }

  getCurrentUserStorage(userId: string): { used: number; max: number } {
    const user = this.getStoredUser();
    if (user && user.id === userId) {
      return {
        used: user.storage_used || 0,
        max: user.max_storage || 5368709120,
      };
    }
    return { used: 0, max: 5368709120 };
  }
}

export const authService = new AuthService();
