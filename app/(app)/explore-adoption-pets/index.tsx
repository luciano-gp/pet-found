import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { AdoptionPetCard } from '../../../components/cards/AdoptionPetCard';
import { FilterBar } from '../../../components/ui/FilterBar';
import { useAuth } from '../../../contexts/AuthContext'; // 🔹 necessário para obter o user logado
import { useLocation } from '../../../hooks/useLocation';
import { AdoptionPetsService } from '../../../services/adoptionPetsService';
import { ChatService } from '../../../services/chatService';
import { AdoptionPet } from '../../../types/adoptionPet';

export default function ExploreAdoptionPetsScreen() {
  const [adoptionPets, setAdoptionPets] = useState<AdoptionPet[]>([]);
  const [filteredPets, setFilteredPets] = useState<AdoptionPet[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSpecies, setSelectedSpecies] = useState('');
  const [sortBy, setSortBy] = useState<'nearest' | 'farthest'>('nearest');
  const { location, getCurrentLocation } = useLocation();
  const { user } = useAuth();
  const router = useRouter();

  // 📍 Carregar pets disponíveis
  const loadAdoptionPets = useCallback(async () => {
    try {
      setLoading(true);
      const allPets = await AdoptionPetsService.getAllAvailablePets();
      setAdoptionPets(allPets.filter((p) => !p.adopted)); // mostra apenas não adotados
    } catch {
      Alert.alert('Erro', 'Erro ao carregar pets para adoção');
    } finally {
      setLoading(false);
    }
  }, []);

  // 📏 Cálculo de distância
  const calculateDistance = useCallback(
    (lat1: number, lon1: number, lat2: number, lon2: number): number => {
      const R = 6371; // km
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

  // 🔁 Recarrega quando a tela volta ao foco
  useFocusEffect(
    useCallback(() => {
      loadAdoptionPets();
    }, [loadAdoptionPets])
  );

  // 🧭 Carrega pets e localização ao montar
  useEffect(() => {
    loadAdoptionPets();
    getCurrentLocation();
  }, []);

  // 🔹 Filtro e ordenação
  useEffect(() => {
    let filtered = [...adoptionPets];

    if (selectedSpecies) {
      filtered = filtered.filter((p) => p.pet_specie === selectedSpecies);
    }

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

  // 💬 Função de iniciar conversa
  const handleStartChat = async (pet: AdoptionPet) => {
    try {
      if (!user) {
        Alert.alert('Erro', 'Você precisa estar logado para iniciar um chat.');
        return;
      }

      if (user.id === pet.user_id) {
        Alert.alert('Aviso', 'Você não pode conversar consigo mesmo.');
        return;
      }

      const chat = await ChatService.createThread({
        participant_ids: [user.id, pet.user_id],
      });

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

  // 🐾 Renderização dos cards
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
          onContactPress={() => handleStartChat(item)} // ✅ botão "Conversar"
        />
      );
    },
    [location, calculateDistance, user]
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
