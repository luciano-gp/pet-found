import { Stack } from 'expo-router';
import React from 'react';

export default function MenuLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Menu', headerShown: false }} />
    </Stack>
  );
} 