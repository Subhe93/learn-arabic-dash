import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import api from '../lib/axios';
import { API_ENDPOINTS } from '../config/api';

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('admin_token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const response = await api.post(API_ENDPOINTS.auth.info);
          setUser(response.data.user || response.data);
        } catch (error) {
          localStorage.removeItem('admin_token');
          setToken(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, [token]);

  const login = async (email: string, password: string) => {
    const params = new URLSearchParams();
    params.append('email', email);
    params.append('password', password);

    const response = await api.post(API_ENDPOINTS.auth.login, params);
    
    // الـ API يُرجع accessToken وليس token
    const newToken = response.data.accessToken || response.data.token;
    
    if (!newToken) {
      throw new Error('لم يتم استلام التوكن');
    }
    
    localStorage.setItem('admin_token', newToken);
    setToken(newToken);
    
    // جلب معلومات المستخدم بعد تسجيل الدخول
    try {
      const userResponse = await api.post(API_ENDPOINTS.auth.info, null, {
        headers: { Authorization: `Bearer ${newToken}` }
      });
      setUser(userResponse.data.user || userResponse.data);
    } catch {
      // إذا فشل جلب المعلومات، نستخدم بيانات افتراضية
      setUser({
        id: 0,
        email: email,
        firstName: 'مشرف',
        lastName: '',
        role: 'admin'
      });
    }
  };

  const logout = async () => {
    try {
      await api.post(API_ENDPOINTS.auth.logout);
    } catch (error) {
      // تجاهل الخطأ
    }
    localStorage.removeItem('admin_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        isAuthenticated: !!token,
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
