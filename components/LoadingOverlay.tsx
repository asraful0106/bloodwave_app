// @/components/LoadingOverlay.tsx
import React, { useEffect, useRef } from "react";
import { View, Modal, Animated, StyleSheet } from "react-native";
import { moderateScale } from "react-native-size-matters";
import { StyledText } from "@/components/StyledText";
import { useTheme } from "@/hooks/theme/ThemeContext";

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export function LoadingOverlay({ visible, message = "Please wait..." }: LoadingOverlayProps) {
  const { colors } = useTheme();
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;

    const animate = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.delay(800 - delay),
        ])
      );

    const a1 = animate(dot1, 0);
    const a2 = animate(dot2, 200);
    const a3 = animate(dot3, 400);

    a1.start();
    a2.start();
    a3.start();

    return () => {
      a1.stop();
      a2.stop();
      a3.stop();
      dot1.setValue(0);
      dot2.setValue(0);
      dot3.setValue(0);
    };
  }, [visible]);

  const dotStyle = (anim: Animated.Value) => ({
    transform: [
      {
        translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -8],
        }),
      },
    ],
    opacity: anim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.4, 1],
    }),
  });

  return (
    <Modal transparent animationType="fade" visible={visible} statusBarTranslucent>
      <View style={styles.backdrop}>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.thirdBackgroundColor ?? "#1e1e2e" },
          ]}
        >
          {/* Bouncing dots */}
          <View style={styles.dotsRow}>
            {[dot1, dot2, dot3].map((dot, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.dot,
                  { backgroundColor: colors.primaryColor },
                  dotStyle(dot),
                ]}
              />
            ))}
          </View>

          <StyledText
            style={[styles.message, { color: colors.secondaryTextColor ?? "#aaa" }]}
          >
            {message}
          </StyledText>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    borderRadius: moderateScale(16),
    paddingVertical: moderateScale(28),
    paddingHorizontal: moderateScale(36),
    alignItems: "center",
    gap: moderateScale(14),
    // subtle shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  dotsRow: {
    flexDirection: "row",
    gap: moderateScale(8),
    alignItems: "center",
    height: moderateScale(24),
  },
  dot: {
    width: moderateScale(10),
    height: moderateScale(10),
    borderRadius: moderateScale(5),
  },
  message: {
    fontSize: moderateScale(13),
    letterSpacing: 0.3,
  },
});
