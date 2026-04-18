// @/src/pages/setting/components/ThemeToggle.tsx
import React, { useRef } from "react";
import { Animated, Pressable, View } from "react-native";
import { moderateScale } from "react-native-size-matters";
import { ThemeColors, ThemeName } from "@/constants/themeCollorConstant";
import Ionicons from "@expo/vector-icons/Ionicons";

type Props = {
  value: ThemeName;
  onChange: (v: ThemeName) => void;
  colors: ThemeColors;
};

export function ThemeToggle({ value, onChange, colors }: Props) {
  const isDark = value === "dark";

  const translateX = useRef(
    new Animated.Value(isDark ? moderateScale(28) : 0),
  ).current;
  const sunOpacity = useRef(new Animated.Value(isDark ? 0.4 : 1)).current;
  const moonOpacity = useRef(new Animated.Value(isDark ? 1 : 0.4)).current;

  const toggle = () => {
    const next: ThemeName = isDark ? "light" : "dark";
    Animated.parallel([
      Animated.spring(translateX, {
        toValue: next === "dark" ? moderateScale(28) : 0,
        useNativeDriver: true,
        tension: 80,
        friction: 8,
      }),
      Animated.timing(sunOpacity, {
        toValue: next === "dark" ? 0.4 : 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(moonOpacity, {
        toValue: next === "dark" ? 1 : 0.4,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
    onChange(next);
  };

  const trackColor = colors.toggleTrack;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: moderateScale(8),
      }}
    >
      {/* Sun icon */}
      <Animated.View style={{ opacity: sunOpacity }}>
        <Ionicons
          name="sunny"
          size={moderateScale(16)}
          color={colors.primaryColor}
        />
      </Animated.View>

      {/* Track */}
      <Pressable onPress={toggle}>
        <View
          style={{
            width: moderateScale(56),
            height: moderateScale(28),
            borderRadius: moderateScale(14),
            backgroundColor: trackColor,
            justifyContent: "center",
            paddingHorizontal: moderateScale(2),
          }}
        >
          {/* Thumb */}
          <Animated.View
            style={{
              width: moderateScale(24),
              height: moderateScale(24),
              borderRadius: moderateScale(12),
              backgroundColor: colors.toggoleThumb,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.2,
              shadowRadius: 2,
              elevation: 3,
              transform: [{ translateX }],
            }}
          />
        </View>
      </Pressable>

      {/* Moon icon */}
      <Animated.View style={{ opacity: moonOpacity }}>
        <Ionicons
          name="moon"
          size={moderateScale(15)}
          color={colors.primaryColor}
        />
      </Animated.View>
    </View>
  );
}
