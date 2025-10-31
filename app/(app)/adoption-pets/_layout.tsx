import { Stack } from 'expo-router';
import React from 'react';

export default function AdoptionPetsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Meus Pets para Adoção' }} />
      <Stack.Screen name="create" options={{ title: 'Novo Pet para Adoção' }} />
      <Stack.Screen name="edit" options={{ title: 'Editar Pet para Adoção' }} />
    </Stack>
  );
} 