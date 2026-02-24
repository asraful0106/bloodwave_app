import { ThemeProvider } from "@/hooks/theme/ThemeContext";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { useTheme } from "@/hooks/theme/ThemeContext";
import { LanguageProvider } from "@/hooks/language/LanguageContext";

function AppShell() {
  const { colors, config } = useTheme();

  const [fontsLoaded, fontError] = useFonts({
    SansFlex: require("../assets/fonts/SansFlex.ttf"),
    NotoSerifBengali: require("../assets/fonts/NotoSerifBengali.ttf"),
    Noto: require("../assets/fonts/Noto.ttf"),
  });

  const isAppReady = Boolean(fontsLoaded && !fontError);

  // optional: don’t render UI until fonts are ready
  if (!isAppReady) return null;

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bodyBackground },
        }}
      >
        <Stack.Screen name="(tab)" />
        {/* <Stack.Screen
          name="add"
          options={{
            presentation: "modal",
            animation: "slide_from_bottom",
            gestureEnabled: true,
            headerShown: false,
          }}
        /> */}
      </Stack>

      <StatusBar style={config.style} backgroundColor={colors.bodyBackground} />
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AppShell />
      </LanguageProvider>
    </ThemeProvider>
  );
}
