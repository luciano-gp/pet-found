export interface Report {
  id: string;
  user_id: string;
  species: string;
  description: string;
  image_url: string;
  location_name?: string;
  latitude?: number;
  longitude?: number;
  created_at: string;
}

export interface LostPet {
  id: string;
  user_id: string;
  name: string;
  species: string;
  description?: string;
  reward?: number;
  image_url: string;
  last_seen_name?: string;
  latitude?: number;
  longitude?: number;
  created_at: string;
}

export interface CreateReportData {
  species: string;
  description: string;
  image_url: string;
  location_name?: string;
  latitude?: number;
  longitude?: number;
}

export interface CreateLostPetData {
  name: string;
  species: string;
  description?: string;
  reward?: number;
  image_url: string;
  last_seen_name?: string;
  latitude?: number;
  longitude?: number;
}

export interface UpdateReportData {
  species?: string;
  description?: string;
  image_url?: string;
  location_name?: string;
  latitude?: number;
  longitude?: number;
}

export interface UpdateLostPetData {
  name?: string;
  species?: string;
  description?: string;
  reward?: number;
  image_url?: string;
  last_seen_name?: string;
  latitude?: number;
  longitude?: number;
}

export interface Location {
  latitude: number;
  longitude: number;
  locationName?: string;
} 