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
import { AdoptionPetCard } from '../../../components/cards/AdoptionPetCard';
import { AdoptionPetsService } from '../../../services/adoptionPetsService';
import { AdoptionPet } from '../../../types/adoptionPet';

export default function ExploreAdoptionPetsScreen() {
  const [adoptionPets, setAdoptionPets] = useState<AdoptionPet[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAdoptionPets = useCallback(async () => {
    try {
      setLoading(true);
      const pets = await AdoptionPetsService.getUserAdoptionPets();
      console.log(pets);
      
      setAdoptionPets(pets);
    } catch {
      Alert.alert('Erro', 'Erro ao carregar pets para adoção');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAdoptionPets();
    }, [loadAdoptionPets])
  );

  useEffect(() => {
    loadAdoptionPets();
  }, [loadAdoptionPets]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAdoptionPets();
    setRefreshing(false);
  };

  const handleEdit = (pet: AdoptionPet) => {
    router.push({
      pathname: '/adoption-pets/edit',
      params: { id: pet.id },
    } as any);
  };

  const handleDelete = async (id: string) =>{
    try {
      await AdoptionPetsService.deleteAdoptionPet(id);
      setAdoptionPets(adoptionPets.filter(pet => pet.id !== id))
      // setLostPets(lostPets.filter(pet => pet.id !== id));
      Alert.alert('Sucesso', 'Adoção de pet excluída com sucesso');
    } catch {
      Alert.alert('Erro', 'Erro ao excluir adoção de pet');
    }
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="search-outline" size={64} color="#ccc" />
      <Text style={styles.emptyStateTitle}>Nenhum anúncio encontrado</Text>
      <Text style={styles.emptyStateSubtitle}>
        Você ainda não criou nenhum anúncio de pet para adoção
      </Text>
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => router.push('/adoption-pets/create' as any)}
      >
        <Ionicons name="add" size={20} color="#fff" />
        <Text style={styles.createButtonText}>Criar Primeiro Anúncio</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Carregando pets para adoção...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Adicionar anúncio</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/adoption-pets/create' as any)}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={adoptionPets}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <AdoptionPetCard pet={item} 
          onDelete={handleDelete} 
          onEdit={handleEdit}
          showActions={true}
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
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#df99cc',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
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
