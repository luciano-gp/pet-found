import { useDebounce } from '@/hooks/useDebounce';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../../components/ui/Button';
import { ImagePickerComponent } from '../../../components/ui/ImagePicker';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { useLocation } from '../../../hooks/useLocation';
import { AdoptionPetsService } from '../../../services/adoptionPetsService';
import { StorageService } from '../../../services/storageService';
import { speciesOptions } from '../../../types/species';

export default function CreateAdoptionPetScreen() {
  const [petName, setPetName] = useState('');
  const [petSpecie, setPetSpecie] = useState('');
  const [petAge, setPetAge] = useState('');
  const [petDescription, setPetDescription] = useState('');
  const [petVaccinated, setPetVaccinated] = useState(false);
  const [petCastrated, setPetCastrated] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [address, setAddress] = useState('');
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; specie?: string; imagemDescription?: string; address?: string; petAge?: string;}>({});

  const { getCurrentLocation, location, loading: locationLoading, geocodeAddress } = useLocation();
  const [isUserTyping, setIsUserTyping] = useState(false);

  // Debounce do endereço para evitar geocodificação excessiva
  const debouncedAddress = useDebounce(address, 1000); // 1 segundo de delay

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

  const handleAddressChange = (text: string) => {
    setIsUserTyping(true);
    setAddress(text);
  };

  const validateForm = () => {
    const newErrors: { name?: string; specie?: string; imagemDescription?: string; address?: string; petAge?: string;} = {};
    if (!petName.trim()) newErrors.name = 'Nome é obrigatório';
    if (!petSpecie.trim()) newErrors.specie = 'Espécie é obrigatória';
    
    if(!imageUri && !petDescription){
      Alert.alert('Erro', 'Imagem ou descrição obrigatórios');
      newErrors.imagemDescription = 'Imagem ou descrição obrigatórios';
    }
    
    if(!address)
      newErrors.address = 'Endereço é obrigatório';
    
    if(petAge){
      if(isNaN(Number(petAge))){
        newErrors.petAge = 'Idade informada inválida';
      }
    }

    // if (!imageUri) {
    //   Alert.alert('Erro', 'É necessário adicionar uma foto do pet');
    //   return false;
    // }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setUploading(true);



      // Upload da imagem
      let imageUrl = '';
      if(imageUri){
        imageUrl = await StorageService.uploadImage(imageUri!, 'adoption-pets');
      }

      // Criação do pet para adoção
      await AdoptionPetsService.createAdoptionPet({
        pet_name: petName.trim(),
        pet_specie: petSpecie.trim(),
        pet_age: petAge ? Number(petAge) : undefined,
        pet_description: petDescription.trim() || undefined,
        pet_image: imageUrl,
        pet_vaccinated: petVaccinated,
        pet_castrated: petCastrated,
        latitude: location?.latitude,
        longitude: location?.longitude,
        adopted: false,
        address: address,
      });

      Alert.alert('Sucesso', 'Pet cadastrado para adoção!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Erro ao criar pet para adoção:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao cadastrar o pet.');
    } finally {
      setUploading(false);
    }
  };

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
            <Text style={styles.title}>Cadastrar Pet para Adoção</Text>
            <Text style={styles.subtitle}>
              Ajude um pet a encontrar um novo lar 💕
            </Text>

            <View style={styles.form}>
              <ImagePickerComponent
                onImageSelected={setImageUri}
                loading={uploading}
              />

              <Input
                label="Nome do Pet"
                value={petName}
                onChangeText={setPetName}
                placeholder="Digite o nome do pet"
                error={errors.name}
              />

              <Select
                label="Espécie"
                value={petSpecie}
                onValueChange={setPetSpecie}
                placeholder="Selecione a espécie"
                options={speciesOptions}
                error={errors.specie}
              />

              <Input
                label="Idade (em anos)"
                value={petAge}
                onChangeText={setPetAge}
                placeholder="Ex: 3"
                keyboardType="numeric"
                error={errors.petAge}
              />

              <Input
                label="Descrição"
                value={petDescription}
                onChangeText={setPetDescription}
                placeholder="Fale sobre o pet (personalidade, cuidados, etc.)"
                multiline
                numberOfLines={3}
                error={errors.imagemDescription}
              />

              <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>Vacinado</Text>
                <Switch value={petVaccinated} onValueChange={setPetVaccinated} />
              </View>

              <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>Castrado</Text>
                <Switch value={petCastrated} onValueChange={setPetCastrated} />
              </View>

              <View style={styles.locationSection}>
                <Text style={styles.locationTitle}>Localização</Text>

                {location ? (
                  <View style={styles.locationInfo}>
                    <Text style={styles.locationText}>
                      {location.locationName || 'Localização obtida'}
                    </Text>
                    <Text style={styles.coordinatesText}>
                      {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.noLocationText}>
                    Nenhuma localização capturada
                  </Text>
                )}

                <Input
                  label="Endereço completo (edite se necessário)"
                  value={address}
                  onChangeText={handleAddressChange}
                  placeholder="Ex: Rua das Flores, 3778, Centro, São Paulo, SP"
                  multiline
                  numberOfLines={3}
                  error={errors.address}
                />

                <Button
                  title={
                    locationLoading
                      ? 'Obtendo localização...'
                      : 'Capturar Localização'
                  }
                  onPress={getCurrentLocation}
                  variant="secondary"
                  loading={locationLoading}
                  disabled={uploading}
                />
              </View>

              <Button
                title="Cadastrar Pet"
                onPress={handleSubmit}
                loading={uploading}
                disabled={!petName.trim() || !petSpecie.trim() || uploading}
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
    backgroundColor: '#f8f9fa',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
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
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
  },
  switchLabel: {
    fontSize: 16,
    color: '#333',
  },
  locationSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 12,
  },
  locationInfo: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  locationText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    marginBottom: 4,
  },
  coordinatesText: {
    fontSize: 12,
    color: '#666',
  },
  noLocationText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    marginBottom: 12,
  },
});
