import * as Location from 'expo-location';
import { useState } from 'react';
import { Location as LocationType } from '../types/pet';

export const useLocation = () => {
  const [location, setLocation] = useState<LocationType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestPermissions = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Permissão de localização negada');
        return false;
      }
      return true;
    } catch (err) {
      setError('Erro ao solicitar permissão de localização');
      return false;
    }
  };

  const getCurrentLocation = async () => {
    setLoading(true);
    setError(null);

    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        setLoading(false);
        return null;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });

      const { latitude, longitude } = currentLocation.coords;

      console.log('=== DEBUG GEOCODING ===');
      console.log('Coordenadas capturadas:', { 
        latitude: latitude.toFixed(8), 
        longitude: longitude.toFixed(8),
        accuracy: currentLocation.coords.accuracy,
        altitude: currentLocation.coords.altitude,
        heading: currentLocation.coords.heading,
        speed: currentLocation.coords.speed
      });

      // Obter nome do local
      const geocode = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      console.log('Resultado completo da geocodificação:', JSON.stringify(geocode, null, 2));
      
      if (geocode[0]) {
        console.log('Primeiro resultado:');
        console.log('- street:', geocode[0].street);
        console.log('- name:', geocode[0].name);
        console.log('- district:', geocode[0].district);
        console.log('- city:', geocode[0].city);
        console.log('- region:', geocode[0].region);
        console.log('- country:', geocode[0].country);
        console.log('- postalCode:', geocode[0].postalCode);
      }

      // Tentar uma abordagem mais robusta para o endereço
      let locationName = 'Localização desconhecida';
      
      if (geocode[0]) {
        const parts = [];
        
        // Adicionar rua e número
        if (geocode[0].street) {
          parts.push(geocode[0].street);
        }
        if (geocode[0].name) {
          parts.push(geocode[0].name);
        }
        
        // Adicionar bairro
        if (geocode[0].district) {
          parts.push(geocode[0].district);
        }
        
        // Adicionar cidade
        if (geocode[0].city) {
          parts.push(geocode[0].city);
        }
        
        // Adicionar estado
        if (geocode[0].region) {
          parts.push(geocode[0].region);
        }
        
        locationName = parts.join(', ');
      }

      console.log('Endereço final formatado:', locationName);
      console.log('=== FIM DEBUG ===');

      const locationData: LocationType = {
        latitude,
        longitude,
        locationName,
      };

      setLocation(locationData);
      setLoading(false);
      return locationData;
    } catch (err) {
      setError('Erro ao obter localização');
      setLoading(false);
      return null;
    }
  };

  const startLocationUpdates = () => {
    return Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 300000, // 5 minutos
        distanceInterval: 100, // 100 metros
      },
      async (currentLocation) => {
        const { latitude, longitude } = currentLocation.coords;
        
        const geocode = await Location.reverseGeocodeAsync({
          latitude,
          longitude,
        });

        const locationName = geocode[0] 
          ? `${geocode[0].street || ''} ${geocode[0].name || ''}`.trim()
          : 'Localização desconhecida';

        setLocation({
          latitude,
          longitude,
          locationName,
        });
      }
    );
  };

  const geocodeAddress = async (address: string) => {
    try {
      console.log('=== DEBUG GEOCODING DIRETO ===');
      console.log('Endereço para geocodificar:', address);
      
      const geocode = await Location.geocodeAsync(address);
      
      console.log('Resultado da geocodificação direta:', JSON.stringify(geocode, null, 2));
      
      if (geocode.length > 0) {
        const { latitude, longitude } = geocode[0];
        console.log('Coordenadas obtidas:', { 
          latitude: latitude.toFixed(8), 
          longitude: longitude.toFixed(8) 
        });
        
        const locationData: LocationType = {
          latitude,
          longitude,
          locationName: address,
        };
        
        setLocation(locationData);
        console.log('=== FIM DEBUG GEOCODING DIRETO ===');
        return locationData;
      } else {
        console.log('Nenhum resultado encontrado para o endereço');
        console.log('=== FIM DEBUG GEOCODING DIRETO ===');
        return null;
      }
    } catch (err) {
      console.error('Erro na geocodificação direta:', err);
      return null;
    }
  };

  return {
    location,
    loading,
    error,
    getCurrentLocation,
    geocodeAddress,
    startLocationUpdates,
  };
}; 