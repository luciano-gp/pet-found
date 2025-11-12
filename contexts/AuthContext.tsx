import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthService } from '../services/authService';
import { supabase } from '../services/supabase';
import { AuthContextType, AuthState, LoginCredentials, RegisterCredentials } from '../types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
  });

  const fetchUserProfile = async (userId: string) => {
    const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();
    if (error) {
      console.warn('Erro ao buscar perfil do usuário:', error);
      return null;
    }
    return data;
  };

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { user, session } = await AuthService.getCurrentSession();
        if (user) {
          const profile = await fetchUserProfile(user.id);
          setAuthState({
            user: { ...user, ...profile },
            session,
            loading: false,
          });
        } else {
          setAuthState({ user: null, session: null, loading: false });
        }
      } catch (error) {
        console.error('Erro ao verificar sessão:', error);
        setAuthState({ user: null, session: null, loading: false });
      }
    };

    checkSession();

    const { data: { subscription } } = AuthService.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const profile = await fetchUserProfile(session.user.id);
          const userData = {
            id: session.user.id,
            email: session.user.email!,
            created_at: session.user.created_at,
            ...profile,
          };
          setAuthState({ user: userData, session, loading: false });
        } else {
          setAuthState({ user: null, session: null, loading: false });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (credentials: LoginCredentials) => {
    setAuthState(prev => ({ ...prev, loading: true }));
    try {
      const { user, session } = await AuthService.signIn(credentials);
      if (!user) throw new Error('Usuário não encontrado');
      const profile = await fetchUserProfile(user.id);
      setAuthState({ user: { ...user, ...profile }, session, loading: false });
    } catch (error) {
      console.error('Erro no login:', error);
      setAuthState(prev => ({ ...prev, loading: false }));
      throw error;
    }
  };

  const signUp = async (credentials: RegisterCredentials & {
    type: 'user' | 'ong';
    ong?: { description?: string; cnpj: string };
    user?: { name: string; cpf: string; birth_date: string };
  }) => {
    setAuthState(prev => ({ ...prev, loading: true }));
    try {
      const { user, session } = await AuthService.signUp(credentials);
      if (!user) throw new Error('Erro ao registrar usuário');
      const profile = await fetchUserProfile(user.id);
      setAuthState({ user: { ...user, ...profile }, session, loading: false });
    } catch (error) {
      console.error('Erro no cadastro:', error);
      setAuthState(prev => ({ ...prev, loading: false }));
      throw error;
    }
  };

  const signOut = async () => {
    setAuthState(prev => ({ ...prev, loading: true }));
    try {
      await AuthService.signOut();
      setAuthState({ user: null, session: null, loading: false });
    } catch (error) {
      setAuthState(prev => ({ ...prev, loading: false }));
      throw error;
    }
  };

  const value: AuthContextType = {
    user: authState.user,
    session: authState.session,
    loading: authState.loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
