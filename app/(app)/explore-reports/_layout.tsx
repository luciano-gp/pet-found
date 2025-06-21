import { Stack } from 'expo-router';
import React from 'react';

export default function ExploreReportsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Relatos Próximos' }} />
    </Stack>
  );
} 