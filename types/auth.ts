export interface User {
  id: string;
  email: string;
  created_at: string;
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

export interface RegisterCredentials {
  email: string;
  password: string;
}

export interface AuthContextType {
  user: User | null;
  session: any | null;
  loading: boolean;
  signIn: (credentials: LoginCredentials) => Promise<void>;
  signUp: (credentials: RegisterCredentials) => Promise<void>;
  signOut: () => Promise<void>;
} 