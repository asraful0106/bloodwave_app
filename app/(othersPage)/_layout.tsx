import { Stack } from "expo-router";

export default function OthersPageLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      {/* Register your screens here */}

      <Stack.Screen
        name="requestBlood"
        options={{
          title: "Request Blood",
        }}
      />
    </Stack>
  );
}
