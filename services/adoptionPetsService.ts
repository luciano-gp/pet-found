import { AdoptionPet } from '@/types/adoptionPet';
import { supabase } from './supabase';

export const AdoptionPetsService = {
  async getAllAdoptionPets(): Promise<AdoptionPet[]> {
    const { data, error } = await supabase
      .from('adoption_pets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getAllAvailablePets(): Promise<AdoptionPet[]> {
    const { data, error } = await supabase
      .from('adoption_pets')
      .select('*')
      .eq('adopted', 'FALSE')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },


  
  /**
   * Retorna pets para adoção próximos à localização atual do usuário.
   */
  async getNearbyAdoptionPets(
    userLat?: number,
    userLng?: number,
    radiusKm = 40
  ): Promise<AdoptionPet[]> {
    const { data, error } = await supabase
      .from('adoption_pets')
      .select('*')
      .eq('adopted', false);

    if (error) throw error;
    if (!data) return [];

    // Se tiver localização do usuário, filtra por distância
    if (userLat && userLng) {
      return data.filter((pet) => {
        if (!pet.latitude || !pet.longitude) return false;
        const dist = this.calculateDistance(userLat, userLng, pet.latitude, pet.longitude);
        return dist <= radiusKm;
      });
    }

    // Se não tiver localização, retorna todos
    return data;
  },

  /**
   * Busca um pet de adoção pelo ID.
   */
  async getAdoptionPetById(id: string): Promise<AdoptionPet | null> {
    const { data, error } = await supabase
      .from('adoption_pets')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Retorna os pets de adoção cadastrados pelo usuário atual.
   */
  async getUserAdoptionPets(): Promise<AdoptionPet[]> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('adoption_pets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Raio da Terra em km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },

  deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  },

  /**
   * Cria um novo anúncio de pet para adoção.
   */
  async createAdoptionPet(pet: Omit<AdoptionPet, 'id' | 'created_at' | 'user_id'>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('adoption_pets')
      .insert([{ ...pet, user_id: user.id, }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Atualiza informações de um pet para adoção.
   */
  async updateAdoptionPet(id: string, updates: Partial<AdoptionPet>) {
    const { data, error } = await supabase
      .from('adoption_pets')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Marca o pet como adotado (disponibilidade = false).
   */
  async markAsAdopted(id: string) {
    const { error } = await supabase
      .from('adoption_pets')
      .update({ available: false })
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Exclui um anúncio de adoção.
   */
  async deleteAdoptionPet(id: string) {
    const { error } = await supabase
      .from('adoption_pets')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

