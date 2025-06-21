import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LostPet, Report } from '../../types/pet';
import { LostPetCard } from '../cards/LostPetCard';
import { ReportCard } from '../cards/ReportCard';

interface CardOverlayProps {
  visible: boolean;
  data: Report | LostPet | null;
  type: 'lost' | 'found';
  onClose: () => void;
}

export const CardOverlay: React.FC<CardOverlayProps> = ({
  visible,
  data,
  type,
  onClose,
}) => {
  if (!data) return null;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {type === 'lost' ? 'Pet Perdido' : 'Pet Avistado'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.cardContainer}>
            {type === 'lost' ? (
              <LostPetCard
                lostPet={data as LostPet}
                onEdit={() => {}}
                onDelete={() => {}}
                showActions={false}
                showContactButton={true}
              />
            ) : (
              <ReportCard
                report={data as Report}
                onEdit={() => {}}
                onDelete={() => {}}
                showActions={false}
                showContactButton={true}
              />
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  cardContainer: {
    padding: 16,
  },
}); 