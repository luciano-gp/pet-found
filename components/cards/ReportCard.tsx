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
import { Report } from '../../types/pet';
import { ContactModal } from '../ui/ContactModal';

interface ReportCardProps {
  report: Report;
  onEdit: (report: Report) => void;
  onDelete: (id: string) => void;
  showActions?: boolean;
  distance?: number;
  showContactButton?: boolean;
  onContactPress?: () => void;
}

export const ReportCard: React.FC<ReportCardProps> = ({
  report,
  onEdit,
  onDelete,
  showActions = true,
  distance,
  showContactButton = false,
  onContactPress,
}) => {
  const [contactModalVisible, setContactModalVisible] = useState(false);
  const [contact, setContact] = useState<UserContact | null>(null);
  const [loadingContact, setLoadingContact] = useState(false);

  const handleDelete = () => {
    Alert.alert(
      'Confirmar exclusão',
      'Tem certeza que deseja excluir este relato?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => onDelete(report.id),
        },
      ]
    );
  };

  const handleShowContact = async () => {
    try {
      setLoadingContact(true);
      const userContact = await UserContactService.getUserContactById(report.user_id);
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

  return (
    <View style={styles.card}>
      <Image source={{ uri: report.image_url }} style={styles.image} />
      
      <View style={styles.content}>
        <Text style={styles.description} numberOfLines={3}>
          {report.description}
        </Text>
        
        {report.location_name && (
          <View style={styles.locationContainer}>
            <Ionicons name="location" size={16} color="#666" />
            <Text style={styles.locationText}>{report.location_name}</Text>
          </View>
        )}
        
        <View style={styles.footer}>
          <Text style={styles.dateText}>
            {formatDate(report.created_at)}
          </Text>
          {distance !== undefined && (
            <View style={styles.distanceContainer}>
              <Ionicons name="location" size={16} color="#007AFF" />
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

        {onContactPress && (
              <TouchableOpacity
                style={styles.chatButton}
                onPress={onContactPress}
              >
                <Ionicons name="chatbubble-ellipses-outline" size={18} color="#fff" />
                <Text style={styles.chatButtonText}>Conversar</Text>
              </TouchableOpacity>
        )}
      </View>

      {showActions && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => onEdit(report)}
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
  description: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
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
  dateText: {
    fontSize: 12,
    color: '#999',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  distanceText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
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
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
    marginTop: 12,
  },
  contactButtonText: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 4,
  },
}); 