import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { AuthUser, LoginCredentials } from '../types';
import { authService } from '../services/authService';
import { logService } from '../services/logService';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUserStorage: (storageUsed: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    const storedUser = authService.getStoredUser();
    if (storedUser) {
      setUser(storedUser);
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await authService.login(credentials);
      
      if (result.success && result.user) {
        setUser(result.user);
        
        // Create login success log
        logService.createLog({
          student_id: result.user.id,
          student_name: result.user.name,
          file_id: null,
          file_name: null,
          action: 'LOGIN_SUCCESS',
          description: 'User logged in successfully',
          source: 'WEB_APP',
          status: 'SUCCESS',
        });

        return { success: true };
      }

      // Create login failed log
      logService.createLog({
        student_id: null,
        student_name: credentials.email,
        file_id: null,
        file_name: null,
        action: 'LOGIN_FAILED',
        description: `Failed login attempt for ${credentials.email}`,
        source: 'WEB_APP',
        status: 'WARNING',
      });

      return { success: false, error: result.error || 'Invalid credentials' };
    } catch (error) {
      return { success: false, error: 'An error occurred during login' };
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const updateUserStorage = (storageUsed: number) => {
    if (user) {
      const updatedUser = { ...user, storage_used: storageUsed };
      setUser(updatedUser);
      authService.updateStoredUser(updatedUser);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        updateUserStorage,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
