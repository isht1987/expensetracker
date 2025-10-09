import { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/axios';

interface User {
  id: number;
  username: string;
  email: string;
  company_name?: string;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  password_confirm: string;
  first_name?: string;
  last_name?: string;
  company_name?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (err) {
        console.error('Error parsing saved user:', err);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login/', {
        email,
        password,
      });
      // If backend returns an error envelope (status: 'error') or missing token, treat as failure
      if (!response?.data || response.data.status === 'error' || !response.data?.data?.token) {
        throw { response };
      }

      const { token, user_id, email: userEmail, username, company_name } = response.data.data;
      
      localStorage.setItem('auth_token', token);
      
      const userData = {
        id: user_id,
        username,
        email: userEmail,
        company_name,
      };
      
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    } catch (error: any) {
      // Rethrow original error so callers (UI) can inspect response.data for field errors
      throw error;
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const response = await api.post('/auth/register/', data);
      if (!response?.data || response.data.status === 'error' || !response.data?.data?.token) {
        throw { response };
      }
      const { token, user_id, email: userEmail, username: userName, company_name } = response.data.data;
      localStorage.setItem('auth_token', token);
      const userData = {
        id: user_id,
        username: userName,
        email: userEmail,
        company_name,
      };
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    } catch (error: any) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
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