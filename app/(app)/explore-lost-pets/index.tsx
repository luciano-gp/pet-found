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
import { LostPetCard } from '../../../components/cards/LostPetCard';
import { FilterBar } from '../../../components/ui/FilterBar';
import { useLocation } from '../../../hooks/useLocation';
import { LostPetsService } from '../../../services/lostPetsService';
import { LostPet } from '../../../types/pet';

export default function ExploreLostPetsScreen() {
  const [lostPets, setLostPets] = useState<LostPet[]>([]);
  const [filteredLostPets, setFilteredLostPets] = useState<LostPet[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSpecies, setSelectedSpecies] = useState('');
  const [sortBy, setSortBy] = useState<'nearest' | 'farthest'>('nearest');
  const { location, getCurrentLocation } = useLocation();

  const loadLostPets = useCallback(async () => {
    try {
      setLoading(true);
      const allLostPets = await LostPetsService.getAllLostPets();
      setLostPets(allLostPets);
    } catch {
      Alert.alert('Erro', 'Erro ao carregar anúncios');
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
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) *
          Math.cos(lat2 * (Math.PI / 180)) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    },
    []
  );

  // Recarregar dados quando a tela receber foco
  useFocusEffect(
    useCallback(() => {
      loadLostPets();
    }, [loadLostPets])
  );

  useEffect(() => {
    loadLostPets();
    // Capturar localização apenas uma vez ao carregar a tela
    getCurrentLocation();
  }, []); // Dependências vazias para executar apenas uma vez

  // Filtrar e ordenar pets perdidos
  useEffect(() => {
    let filtered = [...lostPets];

    // Filtrar por espécie
    if (selectedSpecies) {
      filtered = filtered.filter(lostPet => lostPet.species === selectedSpecies);
    }

    // Ordenar por distância
    if (location && filtered.length > 0) {
      filtered.sort((a, b) => {
        if (!a.latitude || !a.longitude || !b.latitude || !b.longitude) {
          return 0;
        }
        
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

    setFilteredLostPets(filtered);
  }, [lostPets, selectedSpecies, sortBy, location, calculateDistance]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadLostPets();
    setRefreshing(false);
  };

  const renderLostPet = useCallback(
    ({ item }: { item: LostPet }) => {
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
        <LostPetCard 
          lostPet={item} 
          distance={distance}
          onEdit={() => {}} // Não permitir edição em anúncios de outros usuários
          onDelete={() => {}} // Não permitir exclusão em anúncios de outros usuários
          showActions={false} // Não mostrar ações
          showContactButton={true} // Mostrar botão de contato
        />
      );
    },
    [location, calculateDistance]
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text>Carregando anúncios...</Text>
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
        data={filteredLostPets}
        renderItem={renderLostPet}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {selectedSpecies
                ? `Nenhum anúncio encontrado para ${selectedSpecies}`
                : 'Nenhum anúncio encontrado'}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  listContainer: {
    padding: 16,
  },
  cardContainer: {
    marginBottom: 16,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  distanceText: {
    fontSize: 14,
    color: '#28a745',
    fontWeight: '500',
    marginLeft: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  locationInfo: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  list: {
    padding: 16,
  },
}); 