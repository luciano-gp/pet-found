import { Stack } from 'expo-router';
import React from 'react';
import { StatusBar } from 'react-native';

export default function AppLayout() {
  return (
    <>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor="#f8f9fa" 
        translucent={false}
      />
      <Stack>
        <Stack.Screen name="index" options={{ title: 'PetGuard', headerShown: false }} />
        <Stack.Screen name="menu" options={{ title: 'Menu', headerShown: false }} />
        <Stack.Screen name="reports" options={{ headerShown: false }} />
        <Stack.Screen name="lost-pets" options={{ headerShown: false }} />
        <Stack.Screen name="explore-reports" options={{ headerShown: false }} />
        <Stack.Screen name="explore-lost-pets" options={{ headerShown: false }} />
        <Stack.Screen name="map" options={{ headerShown: false }} />
        <Stack.Screen 
          name="contact-info" 
          options={{ 
            title: 'Meus Dados de Contato',
            headerStyle: {
              backgroundColor: '#f8f9fa',
            },
            headerTintColor: '#333',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }} 
        />
      </Stack>
    </>
  );
} 