import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { CampaignsService } from '../../../services/campaignsService';
import { Campaign } from '../../../types/campaign';

export default function EditCampaignScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadCampaign = async () => {
    try {
      setLoading(true);
      const data = await CampaignsService.getCampaignById(id);
      if (!data) {
        Alert.alert('Erro', 'Campanha não encontrada');
        router.back();
        return;
      }
      setCampaign(data);
    } catch (e) {
      console.log(e);
      Alert.alert('Erro', 'Erro ao carregar campanha');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCampaign();
  }, [id]);

  const handleSave = async () => {
    if (!campaign) return;
    try {
      setSaving(true);
      await CampaignsService.updateCampaign(campaign.id.toString(), {
        title: campaign.title,
        description: campaign.description,
        goal_amount: campaign.goal_amount,
      });
      Alert.alert('Sucesso', 'Campanha atualizada com sucesso');
      router.back();
    } catch (e) {
      console.log(e);
      Alert.alert('Erro', 'Erro ao atualizar campanha');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#df99cc" />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  if (!campaign) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Campanha não encontrada.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Editar Campanha</Text>

      <Text style={styles.label}>Título</Text>
      <TextInput
        style={styles.input}
        value={campaign.title}
        onChangeText={(text) => setCampaign({ ...campaign, title: text })}
      />

      <Text style={styles.label}>Descrição</Text>
      <TextInput
        style={[styles.input, styles.textarea]}
        multiline
        value={campaign.description}
        onChangeText={(text) => setCampaign({ ...campaign, description: text })}
      />

      <Text style={styles.label}>Meta (R$)</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={String(campaign.goal_amount || '')}
        onChangeText={(text) =>
          setCampaign({ ...campaign, goal_amount: parseFloat(text) || 0 })
        }
      />

      <TouchableOpacity
        style={styles.saveButton}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="save-outline" size={20} color="#fff" />
            <Text style={styles.saveButtonText}>Salvar Alterações</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  header: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#555',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  textarea: {
    height: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#df99cc',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#666',
  },
});
