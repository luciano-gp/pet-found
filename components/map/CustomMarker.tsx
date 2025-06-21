import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Marker } from 'react-native-maps';

interface CustomMarkerProps {
  coordinate: {
    latitude: number;
    longitude: number;
  };
  type: 'lost' | 'found';
  onPress: () => void;
}

export const CustomMarker: React.FC<CustomMarkerProps> = ({
  coordinate,
  type,
  onPress,
}) => {
  const getMarkerColor = () => {
    return type === 'lost' ? '#ff3b30' : '#28a745';
  };

  const getMarkerIcon = () => {
    return type === 'lost' ? 'paw' : 'eye';
  };

  return (
    <Marker coordinate={coordinate} onPress={onPress}>
      <View style={[styles.markerContainer, { backgroundColor: getMarkerColor() }]}>
        <Ionicons name={getMarkerIcon() as any} size={16} color="#fff" />
      </View>
    </Marker>
  );
};

const styles = StyleSheet.create({
  markerContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
}); 