import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { Home, HeartPulse, Users, Sparkles, Settings as SettingsIcon } from 'lucide-react-native';
import { colors, fontFamily } from '@/theme';

/**
 * Tab bar sits as translucent glass over the sky rather than an opaque bar. The sky is
 * the progress signal; covering the bottom of it with a solid slab would clip the exact
 * region where the horizon warmth lives.
 *
 * Labels are plain nouns ("Today", "Body") rather than feature names ("Home", "Health").
 * People navigate by what they are looking for, not by what the section is called.
 */
export default function AppTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'rgba(10, 12, 24, 0.82)',
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.border,
          elevation: 0,
        },
        tabBarLabelStyle: {
          fontFamily: fontFamily.bodyMedium,
          fontSize: 11,
          letterSpacing: 0.2,
        },
        tabBarItemStyle: { paddingVertical: 4 },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{ title: 'Today', tabBarIcon: ({ color, size }) => <Home color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="health"
        options={{ title: 'Body', tabBarIcon: ({ color, size }) => <HeartPulse color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="community"
        options={{ title: 'Others', tabBarIcon: ({ color, size }) => <Users color={color} size={size} /> }}
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
