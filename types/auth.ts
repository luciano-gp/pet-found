// types/auth.ts

export interface User {
  id: string;
  email: string;
  created_at: string;
  type?: 'user' | 'ong'; // <- Adicionado para diferenciar tipos de usuário (usuário normal e ONG)
}

export interface UserContact {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  created_at: string;
  updated_at: string;
}

export interface CreateUserContactData {
  name: string;
  phone: string;
}

export interface UpdateUserContactData {
  name?: string;
  phone?: string;
}

export interface AuthState {
  user: User | null;
  session: any | null;
  loading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

// Ajustado para suportar ONG também
export interface RegisterCredentials {
  email: string;
  password: string;
  fullname: string;
  type: 'user' | 'ong';
  normalUser?: {
    cpf: string;
    birth_date?: string;
  };
  ong?: {
    description?: string;
    cnpj: string;
  };
}

export interface AuthContextType {
  user: User | null;
  session: any | null;
  loading: boolean;
  signIn: (credentials: LoginCredentials) => Promise<void>;
  signUp: (credentials: RegisterCredentials) => Promise<void>;
  signOut: () => Promise<void>;
}