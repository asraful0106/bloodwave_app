// app/(tab)/_layout.tsx
import { BottomNavigationTabBar } from "@/components/BottomNavigationTabBar";
import { Tabs } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";

export default function ScreenLayout() {
  const { t } = useTranslation();
  return (
    <>
      {/* Optional: if you want per-tab override, otherwise root StatusBar is enough */}
      {/* <StatusBar style={config.style} backgroundColor={config.bg} /> */}
      <Tabs tabBar={(props) => <BottomNavigationTabBar {...props} />}>
        <Tabs.Screen
          name="index"
          options={{
            headerShown: false,
            title: t("home.home"),
          }}
        />
        <Tabs.Screen
          name="donated"
          options={{
            headerShown: false,
            title: t("donated.donated"),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            headerShown: false,
            title: t("profile.profile"),
          }}
        />
      </Tabs>
    </>
  );
}
