import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button } from '../../../components/ui/Button';
import { ImagePickerComponent } from '../../../components/ui/ImagePicker';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { useDebounce } from '../../../hooks/useDebounce';
import { useLocation } from '../../../hooks/useLocation';
import { LostPetsService } from '../../../services/lostPetsService';
import { StorageService } from '../../../services/storageService';
import { LostPet } from '../../../types/pet';
import { speciesOptions } from '../../../types/species';

export default function EditLostPetScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [lostPet, setLostPet] = useState<LostPet | null>(null);
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [description, setDescription] = useState('');
  const [reward, setReward] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    species?: string;
    reward?: string;
  }>({});
  const [address, setAddress] = useState('');
  const [isUserTyping, setIsUserTyping] = useState(false);
  
  const { location, geocodeAddress } = useLocation();

  // Debounce do endereço para evitar geocodificação excessiva
  const debouncedAddress = useDebounce(address, 1000); // 1 segundo de delay

  useEffect(() => {
    if (id) loadLostPet(id);
  }, [id]);

  useEffect(() => {
    if (location?.locationName && !isUserTyping) {
      setAddress(location.locationName);
    }
  }, [location, isUserTyping]);

  // Efeito para geocodificar o endereço com debounce
  useEffect(() => {
    if (debouncedAddress.trim().length > 10 && isUserTyping) {
      console.log('Endereço com debounce, fazendo geocodificação...');
      geocodeAddress(debouncedAddress.trim());
    }
  }, [debouncedAddress, isUserTyping]);

  const loadLostPet = async (lostPetId: string) => {
    try {
      const data = await LostPetsService.getLostPetById(lostPetId);
      if (data) {
        setLostPet(data);
        setName(data.name);
        setSpecies(data.species);
        setDescription(data.description || '');
        setReward(data.reward ? String(data.reward) : '');
        setImageUri(data.image_url);
        setAddress(data.last_seen_name || '');
      }
    } catch {
      Alert.alert('Erro', 'Erro ao carregar anúncio');
      router.back();
    }
  };

  const validateForm = () => {
    const newErrors: {
      name?: string;
      species?: string;
      reward?: string;
    } = {};
    if (!name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }
    if (!species.trim()) {
      newErrors.species = 'Espécie é obrigatória';
    }
    if (reward && isNaN(Number(reward))) {
      newErrors.reward = 'Recompensa deve ser um valor numérico';
    }
    if (!imageUri) {
      Alert.alert('Erro', 'É necessário adicionar uma foto');
      return false;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !lostPet) return;
    try {
      setUploading(true);
      let imageUrl = imageUri;
      if (imageUri && imageUri !== lostPet.image_url && !imageUri.startsWith('http')) {
        imageUrl = await StorageService.uploadImage(imageUri, 'lost-pet');
      }
      await LostPetsService.updateLostPet(lostPet.id, {
        name: name.trim(),
        species: species.trim(),
        description: description.trim() || undefined,
        reward: reward ? Number(reward) : undefined,
        image_url: imageUrl || undefined,
        last_seen_name: address.trim() || location?.locationName,
        latitude: location?.latitude,
        longitude: location?.longitude,
      });
      Alert.alert('Sucesso', 'Anúncio atualizado com sucesso!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert('Erro', 'Erro ao atualizar anúncio');
    } finally {
      setUploading(false);
    }
  };

  const handleAddressChange = (text: string) => {
    setIsUserTyping(true);
    setAddress(text);
  };

  if (!lostPet) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Carregando anúncio...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <Text style={styles.title}>Editar Anúncio</Text>
            <View style={styles.form}>
              <ImagePickerComponent
                onImageSelected={setImageUri}
                currentImage={imageUri || undefined}
                loading={uploading}
              />
              <Input
                label="Nome do Pet"
                value={name}
                onChangeText={setName}
                placeholder="Digite o nome do pet"
                error={errors.name}
              />
              <Select
                label="Espécie"
                value={species}
                onValueChange={setSpecies}
                placeholder="Selecione a espécie do pet"
                error={errors.species}
                options={speciesOptions}
              />
              <Input
                label="Descrição (opcional)"
                value={description}
                onChangeText={setDescription}
                placeholder="Descreva características do pet"
                multiline
                numberOfLines={3}
              />
              <Input
                label="Recompensa (opcional)"
                value={reward}
                onChangeText={setReward}
                placeholder="Valor da recompensa"
                keyboardType="numeric"
                error={errors.reward}
              />
              <Input
                label="Endereço completo (edite se necessário)"
                value={address}
                onChangeText={handleAddressChange}
                placeholder="Ex: Rua das Flores, 3778, Centro, São Paulo, SP"
                multiline
                numberOfLines={3}
              />
              <Button
                title="Salvar Alterações"
                onPress={handleSubmit}
                loading={uploading}
                disabled={!name.trim() || !species.trim() || !imageUri || uploading}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f8f9fa' 
  },
  keyboardContainer: { 
    flex: 1 
  },
  scrollContainer: { 
    flexGrow: 1,
    paddingBottom: 20,
  },
  content: { 
    paddingHorizontal: 24, 
    paddingVertical: 20 
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  form: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: { 
    fontSize: 16, 
    color: '#666' 
  },
}); 