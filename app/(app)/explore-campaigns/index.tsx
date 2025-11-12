import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CampaignCard } from '../../../components/cards/CampaignCard';
import { useAuth } from '../../../contexts/AuthContext';
import { CampaignsService } from '../../../services/campaignsService';
import { ChatService } from '../../../services/chatService';
import { Campaign } from '../../../types/campaign';

export default function ExploreCampaignsScreen() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState<'highest' | 'lowest'>('highest');

  const { user } = useAuth(); // ✅ acesso ao usuário logado

  // 🔁 Carrega campanhas
  const loadCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      const allCampaigns = await CampaignsService.getAllCampaigns();
      setCampaigns(allCampaigns);
    } catch (error) {
      console.log(error);
      Alert.alert('Erro', 'Erro ao carregar campanhas');
    } finally {
      setLoading(false);
    }
  }, []);

  // Recarrega quando volta ao foco
  useFocusEffect(
    useCallback(() => {
      loadCampaigns();
    }, [loadCampaigns])
  );

  // Carrega uma vez ao montar
  useEffect(() => {
    loadCampaigns();
  }, []);

  // Ordenar campanhas conforme filtro
  useEffect(() => {
    let sorted = [...campaigns];

    if (sortBy === 'highest') {
      sorted.sort(
        (a, b) =>
          (b.raised_amount ?? 0) / (b.goal_amount ?? 1) -
          (a.raised_amount ?? 0) / (a.goal_amount ?? 1)
      );
    } else {
      sorted.sort(
        (a, b) =>
          (a.raised_amount ?? 0) / (a.goal_amount ?? 1) -
          (b.raised_amount ?? 0) / (b.goal_amount ?? 1)
      );
    }

    setFilteredCampaigns(sorted);
  }, [campaigns, sortBy]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCampaigns();
    setRefreshing(false);
  };

  const toggleSort = () => {
    setSortBy((prev) => (prev === 'highest' ? 'lowest' : 'highest'));
  };

  // 🗨️ Iniciar ou abrir chat
  const handleStartChat = async (campaign: Campaign) => {
    try {
      if (!user) {
        Alert.alert('Erro', 'Você precisa estar logado para iniciar um chat.');
        return;
      }

      if (user.id === campaign.ong_id) {
        Alert.alert('Aviso', 'Você não pode conversar consigo mesmo.');
        return;
      }

      const chat = await ChatService.createThread({
        participant_ids: [user.id, campaign.ong_id],
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

  const renderCampaign = useCallback(
    ({ item }: { item: Campaign }) => (
      <CampaignCard
        campaign={item}
        showContactButton={true}
        showActions={false}
        onContactPress={() => handleStartChat(item)}
      />
    ),
    [user]
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text>Carregando campanhas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header com botão de ordenação */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Campanhas Disponíveis</Text>
        <TouchableOpacity style={styles.sortButton} onPress={toggleSort}>
          <Ionicons name="swap-vertical" size={18} color="#fff" />
          <Text style={styles.sortButtonText}>
            {sortBy === 'highest' ? 'Mais arrecadadas' : 'Menos arrecadadas'}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredCampaigns}
        renderItem={renderCampaign}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nenhuma campanha encontrada.</Text>
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
  header: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#df99cc',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  sortButtonText: {
    color: '#fff',
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
  },
  list: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
