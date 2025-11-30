'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface AuthContextType {
  studentId: string | null;
  login: (id: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [studentId, setStudentId] = useState<string | null>(null);

  const login = (id: string) => setStudentId(id);
  const logout = () => setStudentId(null);

  return (
    <AuthContext.Provider value={{ studentId, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
