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
import { ReportCard } from '../../../components/cards/ReportCard';
import { FilterBar } from '../../../components/ui/FilterBar';
import { useLocation } from '../../../hooks/useLocation';
import { ReportsService } from '../../../services/reportsService';
import { Report } from '../../../types/pet';

export default function ExploreReportsScreen() {
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSpecies, setSelectedSpecies] = useState('');
  const [sortBy, setSortBy] = useState<'nearest' | 'farthest'>('nearest');
  const { location, getCurrentLocation } = useLocation();

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
      loadReports();
    }, [loadReports])
  );

  useEffect(() => {
    loadReports();
    // Capturar localização apenas uma vez ao carregar a tela
    getCurrentLocation();
  }, []); // Dependências vazias para executar apenas uma vez

  // Filtrar e ordenar relatos
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
  }, [reports, selectedSpecies, sortBy, location, calculateDistance]);

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
          onEdit={() => {}} // Não permitir edição em relatos de outros usuários
          onDelete={() => {}} // Não permitir exclusão em relatos de outros usuários
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
    color: '#007AFF',
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
  locationButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
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
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  list: {
    padding: 16,
  },
}); 