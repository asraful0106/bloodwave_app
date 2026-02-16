import { StyledText } from "@/components/StyledText";
import { useTheme } from "@/hooks/theme/ThemeContext";
import Feather from "@expo/vector-icons/Feather";
import React, { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, View } from "react-native";
import { moderateScale } from "react-native-size-matters";

type GiftCheckboxProps = {
  value: boolean;
  onChange: (value: boolean) => void;
  label?: string;
  color?: string;
};

export const GiftCheckbox: React.FC<GiftCheckboxProps> = ({
  value,
  onChange,
  label = "Gift",
  color = "#22C55E",
}) => {
  const { colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: value ? 1 : 0,
      useNativeDriver: true,
      friction: 5,
    }).start();
  }, [value]);

  return (
    <Pressable style={styles.container} onPress={() => onChange(!value)}>
      <View style={[styles.box, value && { borderColor: color }]}>
        {value && (
          <Animated.View
            style={[
              styles.iconWrapper,
              {
                backgroundColor: color,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <Feather
              name="check-square"
              size={moderateScale(14)}
              color="#fff"
            />
          </Animated.View>
        )}
      </View>
      {label && <StyledText style={[styles.label, {color:colors.textColor}]}>{label}</StyledText>}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(5),
    paddingVertical: 8,
  },
  box: {
    width: moderateScale(20),
    height: moderateScale(20),
    borderRadius: moderateScale(4),
    borderWidth: moderateScale(1),
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapper: {
    width: moderateScale(16),
    height: moderateScale(16),
    borderRadius: moderateScale(4),
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: moderateScale(14, 0.3),
    fontWeight: "500",
  },
});
