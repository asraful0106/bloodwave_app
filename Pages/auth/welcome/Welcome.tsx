import React, { useMemo } from "react";
import {
  View,
  Image,
  Pressable,
  StyleSheet,
  Platform,
  Dimensions,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { moderateScale, ScaledSheet } from "react-native-size-matters";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/hooks/theme/ThemeContext";
import { StyledText } from "@/components/StyledText";
import { ThemeColors } from "@/constants/themeCollorConstant";

const { height: SCREEN_H } = Dimensions.get("window");

export default function Welcome() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[{ backgroundColor: colors.bodyBackground }]}>
      <StatusBar hidden />

      <View style={{ height: moderateScale(390), width: "100%" }}>
        <Image
          source={require("@/assets/other_images/welcome.webp")}
          style={{ width: "100%", height: "100%" }}
          resizeMode="cover"
        />
      </View>

      {/* Hero */}
      <View>
        {/* Top spacer / brand row */}
        <View
          style={[
            styles.topRow,
            { paddingTop: insets.top + moderateScale(10) },
          ]}
        >
          <View style={styles.brandPill}>
            <StyledText style={styles.brandText}>BloodWave</StyledText>
          </View>
        </View>

        {/* Bottom content */}
        <View
          style={[
            styles.bottom,
            { paddingBottom: insets.bottom + moderateScale(18) },
          ]}
        >
          <StyledText style={styles.title}>
            Donate blood,
            {"\n"}save lives.
          </StyledText>

          <StyledText style={styles.subtitle}>
            Find donors fast, request help, and keep your community connected—
            in one place.
          </StyledText>

          {/* Actions */}
          <View style={styles.actions}>
            <Pressable
              // onPress={() => router.push("/login")}
              style={({ pressed }) => [
                styles.primaryBtn,
                { backgroundColor: colors.primaryColor ?? "#E53935" },
                pressed && styles.pressed,
              ]}
            >
              <StyledText style={styles.primaryText}>Log in</StyledText>
            </Pressable>

            <Pressable
              // onPress={() => router.push("/register")}
              style={({ pressed }) => [
                styles.secondaryBtn,
                { borderColor: colors.primaryColor ?? "#E53935" },
                pressed && styles.pressed,
              ]}
            >
              <StyledText
                style={[
                  styles.secondaryText,
                  { color: colors.primaryColor ?? "#E53935" },
                ]}
              >
                Create account
              </StyledText>
            </Pressable>

            {/* Optional: small helper link */}
            <Pressable
              // onPress={() => router.push("/(tab)")}
              style={styles.linkBtn}
            >
              <StyledText
                style={[styles.linkText, { color: colors.textColor }]}
              >
                About Developer
              </StyledText>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

const HERO_H = Math.min(moderateScale(520), SCREEN_H * 0.72);

const createStyles = (colors: ThemeColors) =>
  ScaledSheet.create({
    heroImage: {
      width: "100%",
      height: HERO_H,
    },

    overlay: {
      top: 0,
      left: 0,
      right: 0,
      height: HERO_H,
    },

    topRow: {
      top: 0,
      left: 0,
      right: 0,
      paddingHorizontal: moderateScale(14),
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
    },

    brandPill: {
      alignSelf: "flex-start",
      paddingVertical: moderateScale(6),
      paddingHorizontal: moderateScale(10),
      borderRadius: moderateScale(999),
      backgroundColor: "#e5383556",
    },

    brandText: {
      color: colors.textColor,
      fontSize: moderateScale(12),
      letterSpacing: 0.4,
      fontWeight: "bold",
    },

    bottom: {
      left: 0,
      right: 0,
      bottom: 0,
      paddingHorizontal: moderateScale(16),
    },

    title: {
      color: colors.textColor,
      fontSize: moderateScale(28),
      lineHeight: moderateScale(34),
      fontWeight: Platform.select({ ios: "800", android: "700" }) as any,
      marginBottom: moderateScale(8),
      textAlign: "center",
    },

    subtitle: {
      color: colors.textColor,
      fontSize: moderateScale(14),
      lineHeight: moderateScale(20),
      marginBottom: moderateScale(16),
      maxWidth: moderateScale(320),
      textAlign: "center",
    },

    actions: {
      gap: moderateScale(10),
    },

    primaryBtn: {
      height: moderateScale(48),
      borderRadius: moderateScale(14),
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOpacity: 0.18,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 2,
    },

    primaryText: {
      color: "white",
      fontSize: moderateScale(15),
      fontWeight: "700",
    },

    secondaryBtn: {
      height: moderateScale(48),
      borderRadius: moderateScale(14),
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1.5,
      backgroundColor: "rgba(255,255,255,0.92)",
    },

    secondaryText: {
      fontSize: moderateScale(15),
      fontWeight: "700",
    },

    linkBtn: {
      paddingVertical: moderateScale(6),
      alignItems: "center",
      justifyContent: "center",
    },

    linkText: {
      fontSize: moderateScale(13),
      opacity: 0.9,
      textDecorationLine: "underline",
    },

    pressed: {
      opacity: 0.85,
      transform: [{ scale: 0.99 }],
    },
  });
