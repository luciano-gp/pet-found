import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
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
import { Campaign } from '../../../types/campaign';

export default function ExploreCampaignsScreen() {
  const { user } = useAuth(); // ✅ hook chamado no componente
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadCampaigns = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const data = await CampaignsService.getUserCampaigns();
      setCampaigns(data);
    } catch (e) {
      console.log('erro', e);
      Alert.alert('Erro', 'Erro ao carregar campanhas');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadCampaigns();
    }, [loadCampaigns])
  );

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCampaigns();
    setRefreshing(false);
  };

  const handleEdit = (campaign: Campaign) => {
    router.push({
      pathname: '/campaigns/edit',
      params: { id: campaign.id },
    } as any);
  };

  const handleDelete = async (id: string) => {
    try {
      await CampaignsService.deleteCampaign(id);
      setCampaigns((prev) => prev.filter((c) => c.id.toString() !== id));
      Alert.alert('Sucesso', 'Campanha excluída com sucesso');
    } catch {
      Alert.alert('Erro', 'Erro ao excluir campanha');
    }
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="search-outline" size={64} color="#ccc" />
      <Text style={styles.emptyStateTitle}>Nenhuma campanha encontrada</Text>
      <Text style={styles.emptyStateSubtitle}>
        Você ainda não criou nenhuma campanha
      </Text>
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => router.push('/campaigns/create' as any)}
      >
        <Ionicons name="add" size={20} color="#fff" />
        <Text style={styles.createButtonText}>Criar Primeira Campanha</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Carregando campanhas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Campanhas</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/campaigns/create' as any)}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={campaigns}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <CampaignCard
            campaign={item}
            onDelete={handleDelete}
            onEdit={handleEdit}
            showActions={true}
            onValueChange={loadCampaigns}
          />
        )}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: { fontSize: 16, color: '#666' },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerText: { fontSize: 18, fontWeight: '600', color: '#333' },
  addButton: {
    backgroundColor: '#df99cc',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: { padding: 16 },
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
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: '#df99cc',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
