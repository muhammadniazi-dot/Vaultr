import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { useFonts } from 'expo-font';
import { colors } from '../constants/theme';
import { AuthProvider, useAuth } from '../hooks/useAuth';

function RootNavigator() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="chat" options={{ presentation: 'modal' }} />
      <Stack.Screen name="account/[id]" />
      <Stack.Screen name="transfer" options={{ presentation: 'modal' }} />
      <Stack.Screen name="change-password" options={{ presentation: 'modal' }} />
      <Stack.Screen name="verify-email" options={{ presentation: 'modal' }} />
    </Stack>
  );
}

export default function RootLayout() {
  // Loads Satoshi so it's available to any component that references
  // `typography.fontFamily` (see constants/theme.ts). There is no reliable
  // zero-edit way to apply a custom font to every <Text> in the app under
  // React 19 — it removed `defaultProps` support for function components,
  // which is what RN's Text/TextInput are, so the old "set Text.defaultProps"
  // trick is now a silent no-op. Loading still happens here; if it fails for
  // any reason, `typography.fontFamily` just falls back to `undefined` below
  // and the app quietly keeps the system font everywhere.
  useFonts({
    'Satoshi-Variable': require('../assets/fonts/Satoshi-Variable.ttf'),
  });

  return (
    <AuthProvider>
      <StatusBar style="light" backgroundColor={colors.background} />
      <RootNavigator />
    </AuthProvider>
  );
}
