import { supabase } from './supabase';

export const UserDataService = {

    // Obter dados do usuário autenticado
  async getCurrentUserData(): Promise<{ name: string; is_ong: boolean; avatar_url: string } | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('users')
        .select('name, is_ong, avatar_url')
        .eq('id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Nenhum registro encontrado
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro ao obter dados do usuário:', error);
      throw error;
    }
  },

  // Obter dados de um usuário específico
  async getUserDataById(userId: string): Promise<{ name: string; is_ong: boolean; avatar_url: string } | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('name, is_ong, avatar_url')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Não encontrado
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro ao obter dados de usuário por ID:', error);
      throw error;
    }
  }

}