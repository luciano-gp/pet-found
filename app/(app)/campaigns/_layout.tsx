import { Stack } from 'expo-router';
import React from 'react';

export default function CampaingsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Minhas campanhas' }} />
      <Stack.Screen name="create" options={{ title: 'Nova campanha' }} />
      <Stack.Screen name="edit" options={{ title: 'Editar campanha' }} />
    </Stack>
  );
} 