import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { UserContactService } from '../../services/userContactService';
import { UserContact } from '../../types/auth';
import { LostPet } from '../../types/pet';
import { ContactModal } from '../ui/ContactModal';

interface LostPetCardProps {
  lostPet: LostPet;
  onEdit: (lostPet: LostPet) => void;
  onDelete: (id: string) => void;
  showActions?: boolean;
  distance?: number;
  showContactButton?: boolean;
}

export const LostPetCard: React.FC<LostPetCardProps> = ({
  lostPet,
  onEdit,
  onDelete,
  showActions = true,
  distance,
  showContactButton = false,
}) => {
  const [contactModalVisible, setContactModalVisible] = useState(false);
  const [contact, setContact] = useState<UserContact | null>(null);
  const [loadingContact, setLoadingContact] = useState(false);

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
          onPress: () => onDelete(lostPet.id),
        },
      ]
    );
  };

  const handleShowContact = async () => {
    try {
      setLoadingContact(true);
      const userContact = await UserContactService.getUserContactById(lostPet.user_id);
      setContact(userContact);
      setContactModalVisible(true);
    } catch {
      Alert.alert('Erro', 'Erro ao carregar informações de contato');
    } finally {
      setLoadingContact(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatReward = (reward?: number) => {
    if (!reward) return null;
    return `R$ ${reward.toFixed(2).replace('.', ',')}`;
  };

  return (
    <View style={styles.card}>
      <Image source={{ uri: lostPet.image_url }} style={styles.image} />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name}>{lostPet.name}</Text>
          <Text style={styles.species}>{lostPet.species}</Text>
        </View>
        
        {lostPet.description && (
          <Text style={styles.description} numberOfLines={2}>
            {lostPet.description}
          </Text>
        )}
        
        {lostPet.last_seen_name && (
          <View style={styles.locationContainer}>
            <Ionicons name="location" size={16} color="#666" />
            <Text style={styles.locationText}>{lostPet.last_seen_name}</Text>
          </View>
        )}
        
        <View style={styles.footer}>
          <Text style={styles.dateText}>
            {formatDate(lostPet.created_at)}
          </Text>
          
          {lostPet.reward && (
            <View style={styles.rewardContainer}>
              <Ionicons name="cash" size={16} color="#28a745" />
              <Text style={styles.rewardText}>{formatReward(lostPet.reward)}</Text>
            </View>
          )}
          
          {distance !== undefined && (
            <View style={styles.distanceContainer}>
              <Ionicons name="location" size={16} color="#28a745" />
              <Text style={styles.distanceText}>
                {distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`}
              </Text>
            </View>
          )}
        </View>

        {showContactButton && (
          <TouchableOpacity
            style={styles.contactButton}
            onPress={handleShowContact}
            disabled={loadingContact}
          >
            <Ionicons name="call" size={16} color="#007AFF" />
            <Text style={styles.contactButtonText}>
              {loadingContact ? 'Carregando...' : 'Exibir contato'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {showActions && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => onEdit(lostPet)}
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

      <ContactModal
        visible={contactModalVisible}
        contact={contact}
        onClose={() => setContactModalVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  species: {
    fontSize: 14,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  dateText: {
    fontSize: 12,
    color: '#999',
  },
  rewardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fff8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rewardText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#28a745',
    marginLeft: 4,
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
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  distanceText: {
    fontSize: 14,
    color: '#28a745',
    fontWeight: '500',
    marginLeft: 4,
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
}); 