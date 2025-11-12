import { CreateUserContactData, UpdateUserContactData, UserContact } from '../types/auth';
import { supabase } from './supabase';

export const UserContactService = {
  // Obter contato do usuário atual
  async getUserContact(): Promise<UserContact | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');


      const { data, error } = await supabase
        .from('user_contacts')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Nenhum contato encontrado
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro ao obter contato do usuário:', error);
      throw error;
    }
  },

  // Obter contato de um usuário específico
  async getUserContactById(userId: string): Promise<UserContact | null> {

    
  console.log('Usuario utilizado para buscar o contato 2:', userId)

    try {
      const { data, error } = await supabase
        .from('user_contacts')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Nenhum contato encontrado
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro ao obter contato do usuário:', error);
      throw error;
    }
  },

  // Criar contato do usuário
  async createUserContact(contactData: CreateUserContactData): Promise<UserContact> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('user_contacts')
        .insert({
          user_id: user.id,
          ...contactData,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao criar contato do usuário:', error);
      throw error;
    }
  },

  // Atualizar contato do usuário
  async updateUserContact(contactData: UpdateUserContactData): Promise<UserContact> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('user_contacts')
        .update(contactData)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao atualizar contato do usuário:', error);
      throw error;
    }
  },

  // Deletar contato do usuário
  async deleteUserContact(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('user_contacts')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao deletar contato do usuário:', error);
      throw error;
    }
  },

  // Obter contato de um usuário específico pelo id da ONG
  async getUserContactByOngId(ongId: string) {

      console.log('Usuario utilizado para buscar o contato:', ongId)

    const { data: ong } = await supabase
      .from('ongs')
      .select('user_id')
      .eq('id', ongId)
      .single();
  
    if (!ong) throw new Error('ONG não encontrada');
  
    return await this.getUserContactById(ong.user_id);
  },
}; 