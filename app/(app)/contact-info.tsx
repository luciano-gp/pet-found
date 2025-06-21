import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { UserContactService } from '../../services/userContactService';
import { CreateUserContactData, UserContact } from '../../types/auth';

export default function ContactInfoScreen() {
  const [contact, setContact] = useState<UserContact | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadContact();
  }, []);

  const loadContact = async () => {
    try {
      setLoading(true);
      const userContact = await UserContactService.getUserContact();
      if (userContact) {
        setContact(userContact);
        setName(userContact.name);
        setPhone(userContact.phone);
      }
    } catch (error) {
      console.error('Erro ao carregar contato:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos');
      return;
    }

    try {
      setSaving(true);
      const contactData: CreateUserContactData = {
        name: name.trim(),
        phone: phone.trim(),
      };

      if (contact) {
        // Atualizar contato existente
        await UserContactService.updateUserContact(contactData);
        Alert.alert('Sucesso', 'Dados de contato atualizados com sucesso!');
      } else {
        // Criar novo contato
        await UserContactService.createUserContact(contactData);
        Alert.alert('Sucesso', 'Dados de contato salvos com sucesso!');
      }

      // Recarregar dados
      await loadContact();
    } catch (error) {
      console.error('Erro ao salvar contato:', error);
      Alert.alert('Erro', 'Erro ao salvar dados de contato');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!contact) return;

    Alert.alert(
      'Confirmar exclusão',
      'Tem certeza que deseja excluir seus dados de contato?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await UserContactService.deleteUserContact();
              setContact(null);
              setName('');
              setPhone('');
              Alert.alert('Sucesso', 'Dados de contato excluídos com sucesso!');
            } catch (error) {
              console.error('Erro ao excluir contato:', error);
              Alert.alert('Erro', 'Erro ao excluir dados de contato');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text>Carregando...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.infoCard}>
        <View style={styles.infoHeader}>
          <Ionicons name="information-circle" size={24} color="#333" />
          <Text style={styles.infoTitle}>Informações</Text>
        </View>
        <Text style={styles.infoText}>
          Estes dados serão exibidos para outros usuários quando eles clicarem em &quot;Exibir contato&quot; 
          nos seus relatos e anúncios. Mantenha-os sempre atualizados.
        </Text>
      </View>

      <View style={styles.form}>
        <Input
          label="Nome completo"
          value={name}
          onChangeText={setName}
          placeholder="Digite seu nome completo"
        />

        <Input
          label="Telefone"
          value={phone}
          onChangeText={setPhone}
          placeholder="(11) 99999-9999"
          keyboardType="phone-pad"
        />

        <View style={styles.saveButton}>
          <Button
            title={contact ? 'Atualizar dados' : 'Salvar dados'}
            onPress={handleSave}
            loading={saving}
          />
        </View>

        {contact && (
          <View style={styles.deleteButton}>
            <Button
              title="Excluir dados de contato"
              onPress={handleDelete}
              variant="secondary"
            />
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#333',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  saveButton: {
    marginTop: 16,
  },
  deleteButton: {
    marginTop: 12,
  },
}); 