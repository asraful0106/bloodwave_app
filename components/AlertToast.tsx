// @/components/AlertToast.tsx
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View, TouchableOpacity } from "react-native";
import { moderateScale } from "react-native-size-matters";
import { StyledText } from "@/components/StyledText";
import { useTheme } from "@/hooks/theme/ThemeContext";

export type AlertType = "error" | "success" | "warning" | "info";

interface AlertToastProps {
  visible: boolean;
  type?: AlertType;
  title?: string;
  message: string;
  duration?: number; // ms — 0 means manual dismiss only
  onDismiss: () => void;
}

const ICONS: Record<AlertType, string> = {
  error: "✕",
  success: "✓",
  warning: "⚠",
  info: "ℹ",
};

const COLORS: Record<AlertType, { bg: string; border: string; icon: string }> = {
  error:   { bg: "#2d1414", border: "#e53e3e", icon: "#fc8181" },
  success: { bg: "#0f2d1a", border: "#38a169", icon: "#68d391" },
  warning: { bg: "#2d2000", border: "#d69e2e", icon: "#f6e05e" },
  info:    { bg: "#0f1f2d", border: "#3182ce", icon: "#63b3ed" },
};

export function AlertToast({
  visible,
  type = "error",
  title,
  message,
  duration = 4000,
  onDismiss,
}: AlertToastProps) {
  const { colors } = useTheme();
  const translateY = useRef(new Animated.Value(-80)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const palette = COLORS[type];

  const slideIn = () => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const slideOut = (cb?: () => void) => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -80,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => cb?.());
  };

  useEffect(() => {
    if (visible) {
      slideIn();
      if (duration > 0) {
        timerRef.current = setTimeout(() => {
          slideOut(onDismiss);
        }, duration);
      }
    } else {
      slideOut();
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [visible, message]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: palette.bg,
          borderLeftColor: palette.border,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      {/* Icon badge */}
      <View style={[styles.iconBadge, { backgroundColor: palette.border + "33" }]}>
        <StyledText style={[styles.iconText, { color: palette.icon }]}>
          {ICONS[type]}
        </StyledText>
      </View>

      {/* Text */}
      <View style={styles.textBlock}>
        {title && (
          <StyledText style={[styles.title, { color: palette.icon }]}>
            {title}
          </StyledText>
        )}
        <StyledText style={[styles.message, { color: colors.textColor ?? "#e2e8f0" }]}>
          {message}
        </StyledText>
      </View>

      {/* Dismiss */}
      <TouchableOpacity onPress={() => slideOut(onDismiss)} style={styles.closeBtn} hitSlop={8}>
        <StyledText style={{ color: colors.secondaryTextColor ?? "#718096", fontSize: moderateScale(14) }}>
          ✕
        </StyledText>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: moderateScale(52),
    left: moderateScale(16),
    right: moderateScale(16),
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(12),
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(14),
    borderRadius: moderateScale(12),
    borderLeftWidth: 4,
    zIndex: 9999,
    // shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconBadge: {
    width: moderateScale(30),
    height: moderateScale(30),
    borderRadius: moderateScale(8),
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  iconText: {
    fontSize: moderateScale(13),
    fontWeight: "700",
  },
  textBlock: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: moderateScale(13),
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  message: {
    fontSize: moderateScale(12),
    lineHeight: moderateScale(17),
  },
  closeBtn: {
    flexShrink: 0,
    padding: moderateScale(2),
  },
});
