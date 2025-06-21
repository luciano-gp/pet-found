import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import MapView, { Region } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CardOverlay } from '../../../components/map/CardOverlay';
import { CustomMarker } from '../../../components/map/CustomMarker';
import { FilterBar } from '../../../components/ui/FilterBar';
import { useLocation } from '../../../hooks/useLocation';
import { LostPetsService } from '../../../services/lostPetsService';
import { ReportsService } from '../../../services/reportsService';
import { LostPet, Report } from '../../../types/pet';

export default function MapScreen() {
  const [reports, setReports] = useState<Report[]>([]);
  const [lostPets, setLostPets] = useState<LostPet[]>([]);
  const [selectedSpecies, setSelectedSpecies] = useState('');
  const [sortBy, setSortBy] = useState<'nearest' | 'farthest'>('nearest');
  const [selectedData, setSelectedData] = useState<Report | LostPet | null>(null);
  const [selectedType, setSelectedType] = useState<'lost' | 'found'>('found');
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [region, setRegion] = useState<Region>({
    latitude: -29.4305273,
    longitude: -51.9582231,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [hasCentered, setHasCentered] = useState(false);

  const { location, getCurrentLocation } = useLocation();

  const loadData = useCallback(async () => {
    try {
      const [allReports, allLostPets] = await Promise.all([
        ReportsService.getAllReports(),
        LostPetsService.getAllLostPets(),
      ]);
      setReports(allReports);
      setLostPets(allLostPets);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      Alert.alert('Erro', 'Erro ao carregar dados do mapa');
    }
  }, []);

  // Recarregar dados quando a tela receber foco
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // Carregar dados e localização apenas uma vez
  useEffect(() => {
    loadData();
    getCurrentLocation();
  }, []);

  // Centralizar só na primeira vez
  useEffect(() => {
    if (location && !hasCentered) {
      setRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
      setHasCentered(true);
    }
  }, [location, hasCentered]);

  const handleMarkerPress = (data: Report | LostPet, type: 'lost' | 'found') => {
    setSelectedData(data);
    setSelectedType(type);
    setOverlayVisible(true);
  };

  const handleCloseOverlay = () => {
    setOverlayVisible(false);
    setSelectedData(null);
  };

  const handleMyLocation = async () => {
    const currentLocation = await getCurrentLocation();
    if (currentLocation) {
      setRegion({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  };

  // Função para deslocar marcadores próximos
  const getOffsetCoordinate = (baseLat: number, baseLng: number, index: number, total: number) => {
    if (total <= 1) return { latitude: baseLat, longitude: baseLng };
    
    // Deslocamento em círculo
    const angle = (index / total) * 2 * Math.PI;
    const radius = 0.0001; // Aproximadamente 10 metros
    const offsetLat = baseLat + radius * Math.cos(angle);
    const offsetLng = baseLng + radius * Math.sin(angle);
    
    return { latitude: offsetLat, longitude: offsetLng };
  };

  // Filtrar dados por espécie
  const filteredReports = selectedSpecies
    ? reports.filter(report => report.species === selectedSpecies)
    : reports;

  const filteredLostPets = selectedSpecies
    ? lostPets.filter(lostPet => lostPet.species === selectedSpecies)
    : lostPets;

  // Filtrar pets perdidos com coordenadas
  const lostPetsWithCoords = filteredLostPets.filter(lostPet => lostPet.latitude != null && lostPet.longitude != null);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Mapa de Pets</Text>
        <TouchableOpacity onPress={handleMyLocation} style={styles.locationButton}>
          <Ionicons name="locate" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <FilterBar
        selectedSpecies={selectedSpecies}
        onSpeciesChange={setSelectedSpecies}
        sortBy={sortBy}
        onSortChange={setSortBy}
        showSort={false}
      />

      <MapView
        style={styles.map}
        region={region}
        showsUserLocation={true}
        showsMyLocationButton={false}
      >
        {/* Marcadores de pets perdidos */}
        {lostPetsWithCoords.map((lostPet, index) => {
          const offsetCoord = getOffsetCoordinate(
            lostPet.latitude!,
            lostPet.longitude!,
            index,
            lostPetsWithCoords.length
          );
          
          return (
            <CustomMarker
              key={`lost-${lostPet.id}`}
              coordinate={offsetCoord}
              type="lost"
              onPress={() => handleMarkerPress(lostPet, 'lost')}
            />
          );
        })}

        {/* Marcadores de pets avistados */}
        {filteredReports
          .filter(report => report.latitude != null && report.longitude != null)
          .map((report, index) => {
            const offsetCoord = getOffsetCoordinate(
              report.latitude!,
              report.longitude!,
              index,
              filteredReports.filter(r => r.latitude != null && r.longitude != null).length
            );
            
            return (
              <CustomMarker
                key={`found-${report.id}`}
                coordinate={offsetCoord}
                type="found"
                onPress={() => handleMarkerPress(report, 'found')}
              />
            );
          })}
      </MapView>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendMarker, { backgroundColor: '#ff3b30' }]}>
            <Ionicons name="paw" size={12} color="#fff" />
          </View>
          <Text style={styles.legendText}>Pets Perdidos</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendMarker, { backgroundColor: '#28a745' }]}>
            <Ionicons name="eye" size={12} color="#fff" />
          </View>
          <Text style={styles.legendText}>Pets Avistados</Text>
        </View>
      </View>

      <CardOverlay
        visible={overlayVisible}
        data={selectedData}
        type={selectedType}
        onClose={handleCloseOverlay}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  locationButton: {
    padding: 4,
  },
  map: {
    flex: 1,
  },
  legend: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: '#333',
  },
}); 