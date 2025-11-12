import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../../components/ui/Button';
import { ImagePickerComponent } from '../../../components/ui/ImagePicker';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { useDebounce } from '../../../hooks/useDebounce';
import { useLocation } from '../../../hooks/useLocation';
import { LostPetsService } from '../../../services/lostPetsService';
import { StorageService } from '../../../services/storageService';
import { speciesOptions } from '../../../types/species';

export default function CreateLostPetScreen() {
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
  
  const { getCurrentLocation, location, loading: locationLoading, geocodeAddress } = useLocation();

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

  const handleGetLocation = async () => {
    await getCurrentLocation();
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setUploading(true);

      console.log('Iniciando upload da imagem...');
      // Upload da imagem
      const imageUrl = await StorageService.uploadImage(imageUri!, 'pet-image');
      console.log('Imagem enviada com sucesso:', imageUrl);

      console.log('Criando anúncio...');
      // Criar anúncio
      await LostPetsService.createLostPet({
        name: name.trim(),
        species: species.trim(),
        description: description.trim() || undefined,
        reward: reward ? Number(reward) : undefined,
        image_url: imageUrl,
        last_seen_name: address.trim() || location?.locationName,
        latitude: location?.latitude,
        longitude: location?.longitude,
      });

      console.log('Anúncio criado com sucesso!');
      Alert.alert(
        'Sucesso',
        'Anúncio criado com sucesso!',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Erro ao criar anúncio:', error);
      console.error('Detalhes do erro:', {
        message: error instanceof Error ? error.message : 'Erro desconhecido',
        stack: error instanceof Error ? error.stack : undefined,
        imageUri,
        name: name.trim(),
        species: species.trim(),
        description: description.trim(),
        reward,
        location
      });
      Alert.alert('Erro', 'Erro ao criar anúncio');
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
            <Text style={styles.title}>Anunciar Pet Perdido</Text>
            <Text style={styles.subtitle}>
              Ajude a encontrar seu pet criando um anúncio detalhado
            </Text>

            <View style={styles.form}>
              <ImagePickerComponent
                onImageSelected={setImageUri}
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
                placeholder="Descreva características do pet (cor, tamanho, marcações, etc.)"
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

              <View style={styles.locationSection}>
                <Text style={styles.locationTitle}>Localização</Text>
                
                {location ? (
                  <View style={styles.locationInfo}>
                    <Text style={styles.locationText}>{location.locationName}</Text>
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
                />

                <Button
                  title={locationLoading ? 'Obtendo localização...' : 'Capturar Localização'}
                  onPress={handleGetLocation}
                  variant="secondary"
                  loading={locationLoading}
                  disabled={uploading}
                />
              </View>

              <Button
                title="Criar Anúncio"
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
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  locationSection: {
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