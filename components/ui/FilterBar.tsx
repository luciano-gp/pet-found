import React from 'react';
import { StyleSheet, View } from 'react-native';
import { speciesOptions } from '../../types/species';
import { Select } from './Select';

interface FilterBarProps {
  selectedSpecies: string;
  onSpeciesChange: (species: string) => void;
  sortBy: 'nearest' | 'farthest';
  onSortChange: (sort: 'nearest' | 'farthest') => void;
  showSort?: boolean;
}

export function FilterBar({
  selectedSpecies,
  onSpeciesChange,
  sortBy,
  onSortChange,
  showSort = true,
}: FilterBarProps) {
  const allSpeciesOptions = [
    { label: 'Todas', value: '' },
    ...speciesOptions,
  ];

  const sortOptions = [
    { label: 'Mais próximos', value: 'nearest' },
    { label: 'Mais distantes', value: 'farthest' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        <View style={[styles.filterItem, !showSort && styles.fullWidth]}>
          <Select
            label="Espécie"
            value={selectedSpecies}
            onValueChange={onSpeciesChange}
            options={allSpeciesOptions}
            placeholder="Filtrar por espécie"
          />
        </View>
        {showSort && (
          <View style={styles.filterItem}>
            <Select
              label="Ordenar por"
              value={sortBy}
              onValueChange={(value) => onSortChange(value as 'nearest' | 'farthest')}
              options={sortOptions}
              placeholder="Ordenar por distância"
            />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 12,
  },
  filterItem: {
    flex: 1,
  },
  fullWidth: {
    flex: 1,
  },
}); 