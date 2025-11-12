export interface AdoptionPet {
    id: string;
    created_at: string;
    user_id: string;
    pet_name: string;
    pet_age?: number;
    pet_description?: string;
    pet_specie?: string;
    adopted: boolean;
    pet_image?: string;
    pet_vaccinated?: boolean;
    pet_castrated?: boolean;
    latitude?: number;
    longitude?: number;
    address?: string;
  }
  