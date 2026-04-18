// /@/app/_layout.tsx
import { ThemeProvider, useTheme } from "@/hooks/theme/ThemeContext";
import { Redirect, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { LanguageProvider } from "@/hooks/language/LanguageContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";

function AppShell() {
  const { colors, config } = useTheme();
  const { tempIsLoggedIn } = useAuth();

  const [fontsLoaded, fontError] = useFonts({
    SansFlex: require("../assets/fonts/SansFlex.ttf"),
    NotoSerifBengali: require("../assets/fonts/NotoSerifBengali.ttf"),
    Noto: require("../assets/fonts/Noto.ttf"),
  });

  if (!fontsLoaded || fontError) return null;

  return (
    <>
      {/* Single Stack — all screens declared here, always */}
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bodyBackground },
        }}
      >
        <Stack.Screen name="(tab)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(othersPage)" />
      </Stack>

      {/* Redirect based on auth state */}
      {tempIsLoggedIn ? (
        <Redirect href="/(tab)" />
      ) : (
        <Redirect href="/login" />
      )}

      <StatusBar style={config.style} backgroundColor={colors.bodyBackground} />
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <LanguageProvider>
          <AppShell />
        </LanguageProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
