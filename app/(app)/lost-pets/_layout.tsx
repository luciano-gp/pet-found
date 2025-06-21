import { Stack } from 'expo-router';
import React from 'react';

export default function LostPetsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Meus Anúncios' }} />
      <Stack.Screen name="create" options={{ title: 'Novo Anúncio' }} />
      <Stack.Screen name="edit" options={{ title: 'Editar Anúncio' }} />
    </Stack>
  );
} 