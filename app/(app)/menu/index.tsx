import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../../contexts/AuthContext';

const MenuItem: React.FC<{
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  color: string;
}> = ({ title, subtitle, icon, onPress, color }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <View style={[styles.iconContainer, { backgroundColor: color }]}>
      <Ionicons name={icon} size={32} color="#fff" />
    </View>
    <View style={styles.menuItemContent}>
      <Text style={styles.menuItemTitle}>{title}</Text>
      <Text style={styles.menuItemSubtitle}>{subtitle}</Text>
    </View>
    <Ionicons name="chevron-forward" size={24} color="#ccc" />
  </TouchableOpacity>
);

export default function MenuScreen() {
  const { user, signOut } = useAuth();

  useEffect(() => {
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor('#f8f9fa');
      StatusBar.setBarStyle('dark-content');
    }
  }, []);

  const handleSignOut = () => {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch {
              Alert.alert('Erro', 'Erro ao fazer logout');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor="#f8f9fa" 
        translucent={false}
      />
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>PetGuard</Text>
          <Text style={styles.subtitle}>
            Ajude a encontrar pets perdidos e reporte pets avistados
          </Text>
          <Text style={styles.userInfo}>Olá, {user?.email}</Text>
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Ações Principais</Text>
          
          <MenuItem
            title="Relatar Pet Avistado"
            subtitle="Reporte um pet que você viu na rua"
            icon="eye"
            color="#007AFF"
            onPress={() => router.push('/reports/create' as any)}
          />
          
          <MenuItem
            title="Anunciar Pet Perdido"
            subtitle="Crie um anúncio para encontrar seu pet"
            icon="search"
            color="#28a745"
            onPress={() => router.push('/lost-pets/create' as any)}
          />
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Explorar</Text>
          
          <MenuItem
            title="Relatos Próximos"
            subtitle="Veja pets avistados por outros usuários"
            icon="newspaper"
            color="#ff6b6b"
            onPress={() => router.push('/explore-reports' as any)}
          />
          
          <MenuItem
            title="Explorar Pets Perdidos"
            subtitle="Veja anúncios de pets perdidos próximos"
            icon="paw"
            color="#007AFF"
            onPress={() => router.push('/explore-lost-pets' as any)}
          />

          <MenuItem
            title="Mapa Interativo"
            subtitle="Visualize pets no mapa"
            icon="map"
            color="#4ecdc4"
            onPress={() => router.push('/map' as any)}
          />

          <MenuItem
            title="Explorar Pets para Adoção"
            subtitle="Veja os pets próximos para a adoção"
            icon="paw"
            color="#df99cc"
            onPress={() => router.push('/explore-adoption-pets' as any)}
          />
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Meus Registros</Text>
          
          <MenuItem
            title="Ver Meus Relatos"
            subtitle="Visualize e gerencie seus relatos"
            icon="document-text"
            color="#ff9500"
            onPress={() => router.push('/reports' as any)}
          />
          
          <MenuItem
            title="Ver Meus Anúncios"
            subtitle="Visualize e gerencie seus anúncios"
            icon="list"
            color="#5856d6"
            onPress={() => router.push('/lost-pets' as any)}
          />

          <MenuItem
            title="Ver Meus Pets para Adoção"
            subtitle="Visualize e gerencie seus pets para adoção"
            icon="list"
            color="#df99cc"
            onPress={() => router.push('/adoption-pets' as any)}
          />
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Configurações</Text>
          
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/contact-info' as any)}
          >
            <Ionicons name="person-outline" size={24} color="#007AFF" />
            <Text style={styles.menuText}>Meus Dados de Contato</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleSignOut}
          >
            <Ionicons name="log-out-outline" size={24} color="#ff3b30" />
            <Text style={[styles.menuText, styles.logoutText]}>Sair</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            PetGuard - Projeto Acadêmico
          </Text>
          <Text style={styles.footerSubtext}>
            Ajude a encontrar pets perdidos e reporte pets avistados
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 40,
    paddingBottom: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  userInfo: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  menuSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  menuItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  menuItemSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  logoutButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ff3b30',
    marginLeft: 12,
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  footerSubtext: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 4,
  },
  menuText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 12,
  },
}); 