import { useTheme } from "@/hooks/theme/ThemeContext";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { StyleProp, ViewStyle } from "react-native";
import { moderateScale } from "react-native-size-matters";

interface SafeScreenProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export default function SafeScreen({ children, style }: SafeScreenProps) {
  const { colors } = useTheme();
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.bodyBackground }}
      edges={["top", "left", "right"]}
    >
      {children}
    </SafeAreaView>
  );
}
