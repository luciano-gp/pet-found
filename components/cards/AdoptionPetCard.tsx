import { UserContactService } from '@/services/userContactService';
import { UserContact } from '@/types/auth';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AdoptionPet } from '../../types/adoptionPet';
import { ContactModal } from '../ui/ContactModal';

interface Props {
  pet: AdoptionPet;
  distance?: number;
  showContactButton?: boolean;
  showActions?: boolean;
  onButtonClick?: (pet: AdoptionPet) => void;
  onEdit?: (pet: AdoptionPet) => void;
  onDelete?: (id: string) => void;
  onContactPress?: () => void;
}

export function AdoptionPetCard({
  pet,
  distance,
  showContactButton,
  showActions,
  onEdit,
  onDelete,
  onContactPress,
}: Props) {
  const [contactModalVisible, setContactModalVisible] = useState(false);
  const [contact, setContact] = useState<UserContact | null>(null);
  const [loadingContact, setLoadingContact] = useState(false);

  const handleEntrarEmContato = async (pet: AdoptionPet) =>{
    try {
      setLoadingContact(true);
      const userContact = await UserContactService.getUserContactById(pet.user_id);
      setContact(userContact);
      setContactModalVisible(true);
    } catch {
      Alert.alert('Erro', 'Erro ao carregar informações de contato');
    } finally {
      setLoadingContact(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Confirmar exclusão',
      'Tem certeza que deseja excluir este anúncio?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => onDelete?.(pet.id),
        },
      ]
    );
  };

  return (
    <View style={styles.card}>
      {pet.pet_image && (
        <Image source={{ uri: pet.pet_image }} style={styles.image} />
      )}

      <View style={styles.info}>
        <Text style={styles.name}>{pet.pet_name}</Text>
        <Text style={styles.specie}>{pet.pet_specie}</Text>

        {pet.pet_description && <Text style={styles.detail}>Descrição: {pet.pet_description}</Text>}

        {pet.pet_age && <Text style={styles.detail}>Idade: {pet.pet_age} anos</Text>}

        <View style={styles.statusRow}>
          <Ionicons
            name={pet.pet_vaccinated ? 'checkmark-circle' : 'close-circle'}
            size={16}
            color={pet.pet_vaccinated ? '#28a745' : '#dc3545'}
          />
          <Text style={styles.detail}>Vacinado</Text>
        </View>

        <View style={styles.statusRow}>
          <Ionicons
            name={pet.pet_castrated ? 'checkmark-circle' : 'close-circle'}
            size={16}
            color={pet.pet_castrated ? '#28a745' : '#dc3545'}
          />
          <Text style={styles.detail}>Castrado</Text>
        </View>

        <View style={styles.statusRow}>
          <Ionicons
            name={pet.adopted ? 'checkmark-circle' : 'close-circle'}
            size={20}
            color={pet.adopted ? '#28a745' : '#dc3545'}
          />
          <Text style={styles.detailAdotado}>Adotado</Text>
        </View>

        {distance !== undefined && (
          <Text style={styles.distance}>{distance.toFixed(1)} km de distância</Text>
        )}

        {showContactButton && (
          <TouchableOpacity style={styles.contactButton} onPress={() => handleEntrarEmContato(pet)} disabled={loadingContact}>
            <Ionicons name="call" size={16} color="#007AFF" />
            <Text style={styles.contactButtonText}>{loadingContact ? 'Carregando...' : 'Exibir contato'}</Text>
          </TouchableOpacity>
        )}

        {onContactPress && (
              <TouchableOpacity
                style={styles.chatButton}
                onPress={onContactPress}
              >
                <Ionicons name="chatbubble-ellipses-outline" size={18} color="#fff" />
                <Text style={styles.chatButtonText}>Conversar</Text>
              </TouchableOpacity>
        )}

        {showActions && (
          <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => onEdit?.(pet)}
          >
            <Ionicons name="pencil" size={20} color="#007AFF" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={handleDelete}
          >
            <Ionicons name="trash" size={20} color="#ff3b30" />
          </TouchableOpacity>
        </View>
        )}
      </View>

      <ContactModal
        visible={contactModalVisible}
        contact={contact}
        onClose={() => setContactModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({

  chatButton: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#007AFF',
  paddingVertical: 8,
  paddingHorizontal: 12,
  borderRadius: 10,
  marginTop: 10,
},
chatButtonText: {
  color: '#fff',
  fontWeight: '600',
  fontSize: 14,
  marginLeft: 6,
},

  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 2,
  },
  image: {
    width: '100%',
    height: 180,
  },
  info: {
    padding: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  specie: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
  },
  detail: {
    fontSize: 13,
    color: '#555',
  },
  detailAdotado: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#555',
  },
  distance: {
    fontSize: 13,
    color: '#28a745',
    marginTop: 4,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 12,
    marginTop: 12,
  },
  contactButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginLeft: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  actionText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 6,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  editButton: {
    backgroundColor: '#f0f8ff',
  },
  deleteButton: {
    backgroundColor: '#fff5f5',
  },
});
