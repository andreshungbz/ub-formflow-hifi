'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  studentId: string | null;
  role: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          let detectedRole: string | null = null;
          
          // 1. Try to fetch role from user_profiles first (most authoritative)
          const { data: profileData } = await supabase
            .from('user_profiles')
            .select('role')
            .eq('id', user.id)
            .single();
          
          if (profileData?.role) {
            detectedRole = profileData.role;
          }
          
          // 2. If no user_profiles entry, check if user exists in staff table
          if (!detectedRole) {
            const { data: staffData } = await supabase
              .from('staff')
              .select('role')
              .eq('id', user.id)
              .single();
            
            if (staffData?.role) {
              // Use the staff role directly (e.g., 'teacher', 'dean', etc.)
              detectedRole = staffData.role.toLowerCase();
            }
          }

          // 3. Check if user exists in students table
          const { data: studentData } = await supabase
            .from('students')
            .select('student_id')
            .eq('id', user.id)
            .single();
            
          if (studentData) {
            setStudentId(studentData.student_id);
            // If role wasn't detected yet, they're a student
            if (!detectedRole) {
              detectedRole = 'student';
            }
          }
          
          setRole(detectedRole);
        } catch (error) {
          console.error('Error fetching user data:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setStudentId(null);
        setRole(null);
      }
    };

    fetchUserData();
  }, [user, supabase]);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { error };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setStudentId(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, studentId, role, loading, login, signUp, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
