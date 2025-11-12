import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { ReportCard } from '../../../components/cards/ReportCard';
import { FilterBar } from '../../../components/ui/FilterBar';
import { useLocation } from '../../../hooks/useLocation';
import { ChatService } from '../../../services/chatService';
import { ReportsService } from '../../../services/reportsService';
import { supabase } from '../../../services/supabase';
import { Report } from '../../../types/pet';

export default function ExploreReportsScreen() {
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSpecies, setSelectedSpecies] = useState('');
  const [sortBy, setSortBy] = useState<'nearest' | 'farthest'>('nearest');
  const { location, getCurrentLocation } = useLocation();
  const [user, setUser] = useState<any>(null);

  // 🔹 Captura o usuário logado
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    })();
  }, []);

  const loadReports = useCallback(async () => {
    try {
      setLoading(true);
      const allReports = await ReportsService.getAllReports();
      setReports(allReports);
    } catch {
      Alert.alert('Erro', 'Erro ao carregar relatos');
    } finally {
      setLoading(false);
    }
  }, []);

  // 🔹 Função para iniciar chat
  const handleStartChat = async (report: Report) => {
    try {
      if (!user) {
        Alert.alert('Erro', 'Você precisa estar logado para iniciar um chat.');
        return;
      }

      if (user.id === report.user_id) {
        Alert.alert('Aviso', 'Você não pode conversar consigo mesmo.');
        return;
      }

      const chat = await ChatService.createThread({
        participant_ids: [user.id, report.user_id],
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

  // 🔹 Recarregar dados quando a tela receber foco
  useFocusEffect(
    useCallback(() => {
      loadReports();
    }, [loadReports])
  );

  useEffect(() => {
    loadReports();
    getCurrentLocation(); // Captura localização uma vez
  }, []);

  // 🔹 Filtrar e ordenar relatos
  useEffect(() => {
    let filtered = [...reports];

    // Filtrar por espécie
    if (selectedSpecies) {
      filtered = filtered.filter(report => report.species === selectedSpecies);
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

    setFilteredReports(filtered);
  }, [reports, selectedSpecies, sortBy, location]);

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

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadReports();
    setRefreshing(false);
  };

  const renderReport = useCallback(
    ({ item }: { item: Report }) => {
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
        <ReportCard
          report={item}
          distance={distance}
          onEdit={() => {}}
          onDelete={() => {}}
          showActions={false}
          showContactButton={true}
          onContactPress={() => handleStartChat(item)} // 🔹 botão de contato com chat
        />
      );
    },
    [location, calculateDistance, handleStartChat]
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text>Carregando relatos...</Text>
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
        data={filteredReports}
        renderItem={renderReport}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {selectedSpecies
                ? `Nenhum relato encontrado para ${selectedSpecies}`
                : 'Nenhum relato encontrado'}
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
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});