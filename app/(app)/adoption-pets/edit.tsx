import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { Button } from '../../../components/ui/Button';
import { ImagePickerComponent } from '../../../components/ui/ImagePicker';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { useDebounce } from '../../../hooks/useDebounce';
import { useLocation } from '../../../hooks/useLocation';
import { AdoptionPetsService } from '../../../services/adoptionPetsService';
import { StorageService } from '../../../services/storageService';
import { AdoptionPet } from '../../../types/adoptionPet';
import { speciesOptions } from '../../../types/species';

export default function EditAdoptionPetScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [adoptionPet, setAdoptionPet] = useState<AdoptionPet | null>(null);
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; species?: string }>({});
  const [address, setAddress] = useState('');
  const [adopted, setAdopted] = useState(true);
  const [isUserTyping, setIsUserTyping] = useState(false);

  const { location, geocodeAddress } = useLocation();
  const debouncedAddress = useDebounce(address, 1000);

  useEffect(() => {
    if (id) loadAdoptionPet(id);
  }, [id]);

  useEffect(() => {
    if (location?.locationName && !isUserTyping) {
      setAddress(location.locationName);
    }
  }, [location, isUserTyping]);

  useEffect(() => {
    if (debouncedAddress.trim().length > 10 && isUserTyping) {
      geocodeAddress(debouncedAddress.trim());
    }
  }, [debouncedAddress, isUserTyping]);

  const loadAdoptionPet = async (adoptionPetId: string) => {
    try {
      const data = await AdoptionPetsService.getAdoptionPetById(adoptionPetId);
      if (data) {
        setAdoptionPet(data);
        setName(data.pet_name);
        setSpecies(data.pet_specie || '');
        setDescription(data.pet_description || '');
        setImageUri(data.pet_image || '');
        setAddress(data.address || '');
        setAdopted(data.adopted ?? true);
      }
    } catch {
      Alert.alert('Erro', 'Erro ao carregar pet para adoção');
      router.back();
    }
  };

  const validateForm = () => {
    const newErrors: { name?: string; species?: string } = {};
    if (!name.trim()) newErrors.name = 'Nome é obrigatório';
    if (!species.trim()) newErrors.species = 'Espécie é obrigatória';
    if (!imageUri && !description) {
      Alert.alert('Erro', 'É necessário adicionar uma foto ou descrição');
      return false;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !adoptionPet) return;

    try {
      setUploading(true);
      let imageUrl = imageUri;

      if (imageUri && imageUri !== adoptionPet.pet_image && !imageUri.startsWith('http')) {
        imageUrl = await StorageService.uploadImage(imageUri, 'adoption-pet');
      }

      await AdoptionPetsService.updateAdoptionPet(adoptionPet.id, {
        pet_name: name.trim(),
        pet_specie: species.trim(),
        pet_description: description.trim() || undefined,
        pet_image: imageUrl || undefined,
        address: address.trim() || location?.locationName,
        latitude: location?.latitude,
        longitude: location?.longitude,
        adopted: adopted,
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

  if (!adoptionPet) {
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
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <Text style={styles.title}>Editar Pet para Adoção</Text>
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
                label="Endereço completo (edite se necessário)"
                value={address}
                onChangeText={handleAddressChange}
                placeholder="Ex: Rua das Flores, 3778, Centro, São Paulo, SP"
                multiline
                numberOfLines={3}
              />

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Adotado</Text>
                <Switch
                  value={adopted}
                  onValueChange={setAdopted}
                  trackColor={{ false: '#ccc', true: '#4CAF50' }}
                  thumbColor={adopted ? '#fff' : '#f4f3f4'}
                />
              </View>

              <Button
                title="Salvar Alterações"
                onPress={handleSubmit}
                loading={uploading}
                disabled={!name.trim() || !species.trim() || uploading}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  keyboardContainer: { flex: 1 },
  scrollContainer: { flexGrow: 1, paddingBottom: 20 },
  content: { paddingHorizontal: 24, paddingVertical: 20 },
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
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 16,
  },
  switchLabel: {
    fontSize: 16,
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: { fontSize: 16, color: '#666' },
});
