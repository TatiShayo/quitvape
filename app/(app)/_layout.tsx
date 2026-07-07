import { Tabs } from 'expo-router';
import { Home, HeartPulse, Users, Sparkles, Settings as SettingsIcon } from 'lucide-react-native';
import { colors, fontFamily } from '@/theme';

export default function AppTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: { fontFamily: fontFamily.bodyMedium, fontSize: 11 },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{ title: 'Home', tabBarIcon: ({ color, size }) => <Home color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="health"
        options={{ title: 'Health', tabBarIcon: ({ color, size }) => <HeartPulse color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="community"
        options={{ title: 'Community', tabBarIcon: ({ color, size }) => <Users color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="coach"
        options={{ title: 'Coach', tabBarIcon: ({ color, size }) => <Sparkles color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: 'Settings', tabBarIcon: ({ color, size }) => <SettingsIcon color={color} size={size} /> }}
      />
    </Tabs>
  );
}
