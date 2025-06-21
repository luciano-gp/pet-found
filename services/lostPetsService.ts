import { CreateLostPetData, LostPet, UpdateLostPetData } from '../types/pet';
import { supabase } from './supabase';

export class LostPetsService {
  static async createLostPet(data: CreateLostPetData): Promise<LostPet> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    const { data: lostPet, error } = await supabase
      .from('lost_pets')
      .insert({
        user_id: user.id,
        name: data.name,
        species: data.species,
        description: data.description,
        reward: data.reward,
        image_url: data.image_url,
        last_seen_name: data.last_seen_name,
        latitude: data.latitude,
        longitude: data.longitude,
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return lostPet;
  }

  static async getUserLostPets(): Promise<LostPet[]> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    const { data: lostPets, error } = await supabase
      .from('lost_pets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return lostPets || [];
  }

  static async getAllLostPets(): Promise<LostPet[]> {
    const { data: lostPets, error } = await supabase
      .from('lost_pets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return lostPets || [];
  }

  static async updateLostPet(id: string, data: UpdateLostPetData): Promise<LostPet> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    const { data: lostPet, error } = await supabase
      .from('lost_pets')
      .update(data)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return lostPet;
  }

  static async deleteLostPet(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    const { error } = await supabase
      .from('lost_pets')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      throw new Error(error.message);
    }
  }

  static async getLostPetById(id: string): Promise<LostPet | null> {
    const { data: lostPet, error } = await supabase
      .from('lost_pets')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Lost pet not found
      }
      throw new Error(error.message);
    }

    return lostPet;
  }

  static async getNearbyLostPets(latitude: number, longitude: number, radiusKm: number = 0.5): Promise<LostPet[]> {
    // Busca pets perdidos dentro do raio especificado (500m por padrão)
    const { data: lostPets, error } = await supabase
      .from('lost_pets')
      .select('*')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);

    if (error) {
      throw new Error(error.message);
    }

    if (!lostPets) return [];

    // Filtra pets dentro do raio especificado
    return lostPets.filter(pet => {
      if (!pet.latitude || !pet.longitude) return false;
      
      const distance = this.calculateDistance(
        latitude,
        longitude,
        pet.latitude,
        pet.longitude
      );
      
      return distance <= radiusKm;
    });
  }

  private static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Raio da Terra em km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private static deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
} 