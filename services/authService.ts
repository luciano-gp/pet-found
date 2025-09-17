import { LoginCredentials, RegisterCredentials, User } from '../types/auth';
import { supabase } from './supabase';

export class AuthService {
  static async signIn(credentials: LoginCredentials): Promise<{ user: User; session: any }> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user || !data.session) {
      throw new Error('Falha na autenticação');
    }

    return {
      user: {
        id: data.user.id,
        email: data.user.email!,
        created_at: data.user.created_at,
      },
      session: data.session,
    };
  }

static async signUp(credentials: RegisterCredentials & {
  type: 'user' | 'ong';
  user?: { name: string; avatar_url?: string; address?: string }; // dados comuns
  normalUser?: { cpf?: string; birth_date?: string }; // apenas usuário normal
  ong?: { name: string; description?: string; cnpj: string }; // apenas ONG
}): Promise<{ user: User; session: any }> {
  // 1 - Cria usuário no Supabase Auth
  const { data, error } = await supabase.auth.signUp({
    email: credentials.email,
    password: credentials.password,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.user || !data.session) {
    throw new Error('Falha no cadastro');
  }

  const user = {
    id: data.user.id,
    email: data.user.email!,
    created_at: data.user.created_at,
  };

  // 2 - Insere na tabela users (dados comuns)
  const { error: userError } = await supabase.from('users').insert([{
    id: user.id, // PK = auth.users.id
    name: credentials.user?.name || '',
    avatar_url: credentials.user?.avatar_url || null,
    address: credentials.user?.address || null,
  }]);

  if (userError) {
    throw new Error(`Erro ao salvar na tabela users: ${userError.message}`);
  }

  // 3 - Se for usuário normal, insere na tabela normal_users
  if (credentials.type === 'user' && credentials.normalUser) {
    const { error: normalUserError } = await supabase.from('normal_users').insert([{
      user_id: user.id,
      cpf: credentials.normalUser.cpf || null,
      birth_date: credentials.normalUser.birth_date || null,
    }]);

    if (normalUserError) {
      throw new Error(`Erro ao salvar usuário normal: ${normalUserError.message}`);
    }
  }

  // 4 - Se for ONG, insere na tabela ongs
  if (credentials.type === 'ong' && credentials.ong) {
    const { error: ongError } = await supabase.from('ongs').insert([{
      user_id: user.id,
      name: credentials.ong.name,
      description: credentials.ong.description || null,
      cnpj: credentials.ong.cnpj,
      social_reason: credentials.ong.name, // opcional, pode ajustar
    }]);

    if (ongError) {
      throw new Error(`Erro ao salvar ONG: ${ongError.message}`);
    }
  }

  return { user, session: data.session };
}

  static async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }
  }

  static async getCurrentSession(): Promise<{ user: User | null; session: any | null }> {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      throw new Error(error.message);
    }

    if (!session?.user) {
      return { user: null, session: null };
    }

    return {
      user: {
        id: session.user.id,
        email: session.user.email!,
        created_at: session.user.created_at,
      },
      session,
    };
  }

  static onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }
}