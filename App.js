import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold, Nunito_800ExtraBold } from '@expo-google-fonts/nunito';

import HomeScreen from './src/screens/HomeScreen';
import CityRatingScreen from './src/screens/CityRatingScreen';
import RankingScreen from './src/screens/RankingScreen';
import FamilyRankingScreen from './src/screens/FamilyRankingScreen';
import CityDetailScreen from './src/screens/CityDetailScreen';
import CompareScreen from './src/screens/CompareScreen';
import { theme } from './src/theme';

const Stack = createNativeStackNavigator();

export default function App() {
  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: theme.colors.primaryDark },
            headerTintColor: '#fff',
            headerTitleStyle: { fontFamily: theme.fonts.bold, fontSize: 18 },
            contentStyle: { backgroundColor: theme.colors.background },
          }}
        >
          <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Citydex' }} />
          <Stack.Screen name="CityRating" component={CityRatingScreen} options={{ title: 'Valorar ciudad' }} />
          <Stack.Screen name="Ranking" component={RankingScreen} options={{ title: 'Ranking general' }} />
          <Stack.Screen name="FamilyRanking" component={FamilyRankingScreen} options={{ title: 'Rankings por familia' }} />
          <Stack.Screen name="CityDetail" component={CityDetailScreen} options={{ title: 'Ficha de ciudad' }} />
          <Stack.Screen name="Compare" component={CompareScreen} options={{ title: 'Comparador' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}