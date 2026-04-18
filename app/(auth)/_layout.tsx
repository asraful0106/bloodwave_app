// /@/app/(othersPage)/_layout.tsx
import { Redirect, Stack } from "expo-router";
import { useAuth } from "@/context/AuthContext";

export default function OthersLayout() {
  // If somehow an authenticated user lands here, send them home
  const { tempIsLoggedIn } = useAuth();
  if (tempIsLoggedIn) return <Redirect href="/(tab)" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
