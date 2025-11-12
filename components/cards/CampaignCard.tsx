import { CampaignsService } from '@/services/campaignsService';
import { UserContactService } from '@/services/userContactService';
import { UserContact } from '@/types/auth';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Campaign } from '../../types/campaign';
import { ContactModal } from '../ui/ContactModal';

interface Props {
  campaign: Campaign;
  showContactButton?: boolean;
  showActions?: boolean;
  onEdit?: (campaign: Campaign) => void;
  onDelete?: (id: string) => void;
  onValueChange?: () => void; // callback opcional para recarregar lista
}

export function CampaignCard({
  campaign,
  showContactButton,
  showActions,
  onEdit,
  onDelete,
  onValueChange,
}: Props) {
  const [contactModalVisible, setContactModalVisible] = useState(false);
  const [contact, setContact] = useState<UserContact | null>(null);
  const [loadingContact, setLoadingContact] = useState(false);
  const [valueModalVisible, setValueModalVisible] = useState(false);
  const [valueType, setValueType] = useState<'add' | 'remove'>('add');
  const [amount, setAmount] = useState('');

  const handleContact = async () => {
    try {
      setLoadingContact(true);
      const userContact = await UserContactService.getUserContactByOngId(
        campaign.ong_id
      );
      setContact(userContact);
      setContactModalVisible(true);
    } catch {
      Alert.alert('Erro', 'Erro ao carregar informações de contato da ONG');
    } finally {
      setLoadingContact(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Confirmar exclusão',
      'Tem certeza que deseja excluir esta campanha?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => onDelete?.(campaign.id.toString()),
        },
      ]
    );
  };

  const handleValueChange = async () => {
    const value = parseFloat(amount.replace(',', '.'));
    if (isNaN(value) || value <= 0) {
      Alert.alert('Valor inválido', 'Informe um valor válido.');
      return;
    }

    try {
      const newValue =
        valueType === 'add'
          ? campaign.raised_amount + value
          : Math.max(0, campaign.raised_amount - value);

          await CampaignsService.updateRaisedAmount(
            campaign.id.toString(),
            value,
            valueType
          );

      Alert.alert(
        'Sucesso',
        valueType === 'add'
          ? 'Valor adicionado com sucesso!'
          : 'Valor removido com sucesso!'
      );

      setValueModalVisible(false);
      setAmount('');
      onValueChange?.(); // recarrega a lista se necessário
    } catch {
      Alert.alert('Erro', 'Erro ao atualizar valor arrecadado.');
    }
  };

  const progress =
    campaign.goal_amount > 0
      ? (campaign.raised_amount / campaign.goal_amount) * 100
      : 0;

  return (
    <View style={styles.card}>
      <View style={styles.info}>
        <Text style={styles.name}>{campaign.title}</Text>
        <Text style={styles.description}>{campaign.description}</Text>

        <View style={styles.progressContainer}>
          <View style={styles.progressBarBackground}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${Math.min(progress, 100)}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            R$ {campaign.raised_amount?.toLocaleString('pt-BR') ?? '0'} / R${' '}
            {campaign.goal_amount?.toLocaleString('pt-BR')}
          </Text>
        </View>

        {showContactButton && (
          <TouchableOpacity
            style={styles.contactButton}
            onPress={handleContact}
            disabled={loadingContact}
          >
            <Ionicons name="call" size={16} color="#007AFF" />
            <Text style={styles.contactButtonText}>
              {loadingContact ? 'Carregando...' : 'Entrar em contato'}
            </Text>
          </TouchableOpacity>
        )}

        {showActions && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.addMoneyButton]}
              onPress={() => {
                setValueType('add');
                setValueModalVisible(true);
              }}
            >
              <Ionicons name="add-circle" size={22} color="#28a745" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.removeMoneyButton]}
              onPress={() => {
                setValueType('remove');
                setValueModalVisible(true);
              }}
            >
              <Ionicons name="remove-circle" size={22} color="#ff9500" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.editButton]}
              onPress={() => onEdit?.(campaign)}
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

      {/* Modal de valor */}
      <Modal
        visible={valueModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setValueModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              {valueType === 'add'
                ? 'Adicionar Valor'
                : 'Remover Valor da Campanha'}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Digite o valor (R$)"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setValueModalVisible(false)}
              >
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleValueChange}
              >
                <Text style={styles.confirmText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 2,
  },
  info: { padding: 12 },
  name: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 4 },
  description: { fontSize: 14, color: '#555', marginBottom: 12 },
  progressContainer: { marginBottom: 10 },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 8,
    backgroundColor: '#df99cc',
    borderRadius: 4,
  },
  progressText: {
    marginTop: 6,
    fontSize: 12,
    color: '#555',
    textAlign: 'right',
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
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  editButton: { backgroundColor: '#f0f8ff' },
  deleteButton: { backgroundColor: '#fff5f5' },
  addMoneyButton: { backgroundColor: '#e7f9ee' },
  removeMoneyButton: { backgroundColor: '#fff7e6' },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '100%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f1f1f1',
    marginRight: 8,
  },
  confirmButton: {
    backgroundColor: '#df99cc',
    marginLeft: 8,
  },
  cancelText: { color: '#333', fontWeight: '600' },
  confirmText: { color: '#fff', fontWeight: '600' },
});
