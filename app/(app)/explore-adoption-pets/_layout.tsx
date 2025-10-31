import { Stack } from 'expo-router';
import React from 'react';

export default function ExploreAdoptionPetsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Pets para Adoção Próximos' }} />
    </Stack>
  );
} 