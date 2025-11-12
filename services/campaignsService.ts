import { Campaign } from '../types/campaign';
import { supabase } from './supabase';

export const CampaignsService = {
  async getUserCampaigns(): Promise<Campaign[]> {
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error('Usuário não autenticado');
    
    // Busca a ONG vinculada ao usuário logado
    const { data: ong } = await supabase
      .from('ongs')
      .select('id')
      .eq('user_id', user?.id)
      .single();

    if (!ong) return [];

    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('ong_id', ong.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },
  async getCampaignById(id: string) {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as Campaign;
  },

  async updateCampaign(id: string, updates: Partial<Campaign>) {
    const { error } = await supabase
      .from('campaigns')
      .update(updates)
      .eq('id', id);
    if (error) throw error;
  },

  async deleteCampaign(id: string) {
    const { error } = await supabase.from('campaigns').delete().eq('id', id);
    if (error) throw error;
  },

  async createCampaign(campaign: Partial<Campaign>) {

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error('Usuário não autenticado');

    // 1️⃣ Busca a ONG vinculada ao usuário autenticado
    const {
      data: ong,
      error: ongError,
    } = await supabase
      .from('ongs')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (ongError || !ong) {
      console.error('Erro ao buscar ONG:', ongError);
      throw new Error('Não foi possível identificar a ONG vinculada ao usuário.');
    }

    // 2️⃣ Faz o insert da campanha usando o id da ONG encontrada
    const { error } = await supabase.from('campaigns').insert({
      title: campaign.title,
      description: campaign.description,
      goal_amount: campaign.goal_amount,
      ong_id: ong.id,
    });

    if (error) {
      console.error('Erro ao criar campanha:', error);
      throw error;
    }
  },

  async updateRaisedAmount(id: string, amount: number, operation: 'add' | 'remove') {
    //  Buscar o valor atual
    const { data, error: selectError } = await supabase
      .from('campaigns')
      .select('raised_amount')
      .eq('id', id)
      .single();
  
    if (selectError) throw selectError;
  
    const currentValue = data?.raised_amount ?? 0;
  
    // Calcular novo valor com base na operação
    let newValue =
      operation === 'add'
        ? currentValue + amount
        : Math.max(0, currentValue - amount);
  
    // Atualizar o valor no banco
    const { error: updateError } = await supabase
      .from('campaigns')
      .update({ raised_amount: newValue })
      .eq('id', id);
  
    if (updateError) throw updateError;
  },  

  async getAllCampaigns(): Promise<Campaign[]> {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar campanhas:', error.message);
      throw error;
    }

    return data || [];
  },

};
