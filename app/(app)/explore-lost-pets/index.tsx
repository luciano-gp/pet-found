import { useFocusEffect, router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LostPetCard } from '../../../components/cards/LostPetCard';
import { FilterBar } from '../../../components/ui/FilterBar';
import { useLocation } from '../../../hooks/useLocation';
import { LostPetsService } from '../../../services/lostPetsService';
import { LostPet } from '../../../types/pet';
import { ChatService } from '../../../services/chatService';
import { useAuth } from '../../../contexts/AuthContext';

export default function ExploreLostPetsScreen() {
  const [lostPets, setLostPets] = useState<LostPet[]>([]);
  const [filteredLostPets, setFilteredLostPets] = useState<LostPet[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSpecies, setSelectedSpecies] = useState('');
  const [sortBy, setSortBy] = useState<'nearest' | 'farthest'>('nearest');
  const { location, getCurrentLocation } = useLocation();
  const { user } = useAuth();

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
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * (Math.PI / 180)) *
          Math.cos(lat2 * (Math.PI / 180)) *
          Math.sin(dLon / 2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    },
    []
  );

  useFocusEffect(
    useCallback(() => {
      loadLostPets();
    }, [loadLostPets])
  );

  useEffect(() => {
    loadLostPets();
    getCurrentLocation();
  }, []);

  useEffect(() => {
    let filtered = [...lostPets];

    if (selectedSpecies) {
      filtered = filtered.filter(
        (lostPet) => lostPet.species === selectedSpecies
      );
    }

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

  const handleStartChat = async (lostPet: LostPet) => {
    try {
      if (!user) {
        Alert.alert('Erro', 'Você precisa estar logado para iniciar um chat.');
        return;
      }

      if (user.id === lostPet.user_id) {
        Alert.alert('Aviso', 'Você não pode conversar consigo mesmo.');
        return;
      }

      const chat = await ChatService.getOrCreateThread(user.id, lostPet.user_id);
      if (!chat || !chat.id) {
        throw new Error('Erro ao criar ou obter o chat.');
      }

      router.push({
        pathname: '/chat/chatScreen',
        params: { id: chat.id },
      });
    } catch (error) {
      console.error('Erro ao iniciar chat:', error);
      Alert.alert('Erro', 'Não foi possível iniciar a conversa.');
    }
  };

  // 🔹 Renderização do card
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
          onEdit={() => {}}
          onDelete={() => {}}
          showActions={false}
          showContactButton={true}
          onContactPress={() => handleStartChat(item)} // 🔹 integração do botão de chat
        />
      );
    },
    [location, calculateDistance, handleStartChat]
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

// 🎨 Estilos
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
