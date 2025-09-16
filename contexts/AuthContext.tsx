import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthService } from '../services/authService';
import { AuthContextType, AuthState, LoginCredentials, RegisterCredentials } from '../types/auth';
import { supabase } from '../services/supabase';

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

  useEffect(() => {
    // Verificar sessão atual ao inicializar
    const checkSession = async () => {
      try {
        const { user, session } = await AuthService.getCurrentSession();
        setAuthState({ user, session, loading: false });
      } catch (error) {
        console.error('Erro ao verificar sessão:', error);
        setAuthState({ user: null, session: null, loading: false });
      }
    };

    checkSession();

    // Escutar mudanças no estado de autenticação
    const { data: { subscription } } = AuthService.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const user = {
            id: session.user.id,
            email: session.user.email!,
            created_at: session.user.created_at,
          };
          setAuthState({ user, session, loading: false });
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
      setAuthState({ user, session, loading: false });
    } catch (error) {
      setAuthState(prev => ({ ...prev, loading: false }));
      throw error;
    }
  };

  const signUp = async (credentials: RegisterCredentials & {
    type: 'user' | 'ong';
    ong?: { name: string; description?: string; cnpj: string };
  }) => {
    setAuthState(prev => ({ ...prev, loading: true }));
    try {
      // 1 - Cria usuário no Supabase Auth
      const { user, session } = await AuthService.signUp(credentials);

      if (!user) throw new Error('Erro ao criar usuário');

      // 2 - Insere no profile
      const { error: profileError } = await supabase.from('profiles').insert([
        {
          id: user.id,
          email: user.email,
          type: credentials.type,
        },
      ]);

      if (profileError) throw profileError;

      // 3 - Se for ONG, insere também em ongs
      if (credentials.type === 'ong' && credentials.ong) {
        const { error: ongError } = await supabase.from('ongs').insert([
          {
            user_id: user.id,
            name: credentials.ong.name,
            description: credentials.ong.description || null,
            cnpj: credentials.ong.cnpj,
          },
        ]);

        if (ongError) throw ongError;
      }

      setAuthState({ user, session, loading: false });
    } catch (error) {
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