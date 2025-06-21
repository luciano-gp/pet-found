import { Stack } from 'expo-router';
import React from 'react';

export default function ExploreLostPetsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Pets Perdidos Próximos' }} />
    </Stack>
  );
} 