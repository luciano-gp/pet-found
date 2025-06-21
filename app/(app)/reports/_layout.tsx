import { Stack } from 'expo-router';
import React from 'react';

export default function ReportsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Meus Relatos' }} />
      <Stack.Screen name="create" options={{ title: 'Novo Relato' }} />
      <Stack.Screen name="edit" options={{ title: 'Editar Relato' }} />
    </Stack>
  );
} 