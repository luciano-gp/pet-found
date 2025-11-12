import { useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { AdoptionPetCard } from '../../../components/cards/AdoptionPetCard';
import { FilterBar } from '../../../components/ui/FilterBar';
import { useLocation } from '../../../hooks/useLocation';
import { AdoptionPetsService } from '../../../services/adoptionPetsService';
import { AdoptionPet } from '../../../types/adoptionPet';

export default function ExploreAdoptionPetsScreen() {
  const [adoptionPets, setAdoptionPets] = useState<AdoptionPet[]>([]);
  const [filteredPets, setFilteredPets] = useState<AdoptionPet[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSpecies, setSelectedSpecies] = useState('');
  const [sortBy, setSortBy] = useState<'nearest' | 'farthest'>('nearest');
  const { location, getCurrentLocation } = useLocation();

  const loadAdoptionPets = useCallback(async () => {
    try {
      setLoading(true);
      const allPets = await AdoptionPetsService.getAllAvailablePets();
      setAdoptionPets(allPets.filter(p => !p.adopted)); // mostrar apenas não adotados
    } catch {
      Alert.alert('Erro', 'Erro ao carregar pets para adoção');
    } finally {
      setLoading(false);
    }
  }, []);

  const calculateDistance = useCallback(
    (lat1: number, lon1: number, lat2: number, lon2: number): number => {
      const R = 6371; // Raio da Terra em km
      const dLat = (lat2 - lat1) * (Math.PI / 180);
      const dLon = (lon2 - lon1) * (Math.PI / 180);
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * (Math.PI / 180)) *
          Math.cos(lat2 * (Math.PI / 180)) *
          Math.sin(dLon / 2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    },
    []
  );

  // Recarrega quando a tela volta ao foco
  useFocusEffect(
    useCallback(() => {
      loadAdoptionPets();
    }, [loadAdoptionPets])
  );

  useEffect(() => {
    loadAdoptionPets();
    getCurrentLocation(); // captura localização uma vez
  }, []);

  // Filtrar e ordenar pets
  useEffect(() => {
    let filtered = [...adoptionPets];

    // Filtrar por espécie
    if (selectedSpecies) {
      filtered = filtered.filter(p => p.pet_specie === selectedSpecies);
    }

    // Ordenar por distância
    if (location && filtered.length > 0) {
      filtered.sort((a, b) => {
        if (!a.latitude || !a.longitude || !b.latitude || !b.longitude) return 0;

        const distanceA = calculateDistance(
          location.latitude,
          location.longitude,
          a.latitude,
          a.longitude
        );
        const distanceB = calculateDistance(
          location.latitude,
          location.longitude,
          b.latitude,
          b.longitude
        );

        return sortBy === 'nearest' ? distanceA - distanceB : distanceB - distanceA;
      });
    }

    setFilteredPets(filtered);
  }, [adoptionPets, selectedSpecies, sortBy, location, calculateDistance]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAdoptionPets();
    setRefreshing(false);
  };

  const renderPet = useCallback(
    ({ item }: { item: AdoptionPet }) => {
      let distance: number | undefined = undefined;
      if (location && item.latitude && item.longitude) {
        distance = calculateDistance(
          location.latitude,
          location.longitude,
          item.latitude,
          item.longitude
        );
      }

      return (
        <AdoptionPetCard
          pet={item}
          distance={distance}
          showContactButton={true}
          showActions={false}
        />
      );
    },
    [location, calculateDistance]
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text>Carregando pets disponíveis...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FilterBar
        selectedSpecies={selectedSpecies}
        onSpeciesChange={setSelectedSpecies}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />

      <FlatList
        data={filteredPets}
        renderItem={renderPet}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {selectedSpecies
                ? `Nenhum pet disponível para adoção da espécie ${selectedSpecies}`
                : 'Nenhum pet disponível para adoção'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
