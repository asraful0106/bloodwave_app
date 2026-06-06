// @/components/SelectDropdown.tsx
import React, { useRef, useState } from "react";
import {
  View,
  Modal,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Animated,
  TouchableWithoutFeedback,
} from "react-native";
import { moderateScale } from "react-native-size-matters";
import { StyledText } from "@/components/StyledText";
import { useTheme } from "@/hooks/theme/ThemeContext";

export interface DropdownOption {
  label: string;
  value: string;
}

interface SelectDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  label?: string;
  leftIconName?: string; // kept for layout symmetry — renders a plain char or nothing
  height?: number;
  disabled?: boolean;
}

export function SelectDropdown({
  value,
  onChange,
  options,
  placeholder = "Select...",
  label,
  height = 44,
  disabled = false,
}: SelectDropdownProps) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const selectedLabel = options.find((o) => o.value === value)?.label ?? "";

  const openDropdown = () => {
    if (disabled) return;
    setOpen(true);
    setFocused(true);
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 120,
        friction: 8,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeDropdown = (cb?: () => void) => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setOpen(false);
      setFocused(false);
      cb?.();
    });
  };

  const handleSelect = (option: DropdownOption) => {
    closeDropdown(() => onChange(option.value));
  };

  const borderColor = focused
    ? colors.primaryColor
    : "transparent";

  return (
    <View>
      {/* Label */}
      {label && (
        <StyledText
          style={{
            fontSize: moderateScale(11),
            color: colors.secondaryTextColor,
            marginBottom: moderateScale(4),
          }}
        >
          {label}
        </StyledText>
      )}

      {/* Trigger */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={openDropdown}
        disabled={disabled}
        style={[
          styles.trigger,
          {
            height: moderateScale(height),
            backgroundColor: colors.thirdBackgroundColor,
            borderColor,
            opacity: disabled ? 0.5 : 1,
          },
        ]}
      >
        {/* Left icon slot — chevron-left placeholder using unicode */}
        <View style={styles.iconSlot}>
          <StyledText
            style={{ color: colors.secondaryTextColor, fontSize: moderateScale(14) }}
          >
            ≡
          </StyledText>
        </View>

        {/* Value / placeholder */}
        <StyledText
          style={[
            styles.valueText,
            {
              color: value ? colors.textColor : colors.secondaryTextColor,
              fontSize: moderateScale(14),
              flex: 1,
            },
          ]}
          numberOfLines={1}
        >
          {value ? selectedLabel : placeholder}
        </StyledText>

        {/* Right chevron */}
        <View style={styles.iconSlot}>
          <StyledText
            style={{
              color: colors.secondaryTextColor,
              fontSize: moderateScale(12),
              transform: [{ rotate: open ? "180deg" : "0deg" }],
            }}
          >
            ▾
          </StyledText>
        </View>
      </TouchableOpacity>

      {/* Modal sheet */}
      <Modal
        transparent
        visible={open}
        animationType="none"
        statusBarTranslucent
        onRequestClose={() => closeDropdown()}
      >
        <TouchableWithoutFeedback onPress={() => closeDropdown()}>
          <View style={styles.backdrop}>
            <TouchableWithoutFeedback>
              <Animated.View
                style={[
                  styles.sheet,
                  {
                    backgroundColor: colors.thirdBackgroundColor ?? "#1e1e2e",
                    transform: [{ scale: scaleAnim }],
                    opacity: opacityAnim,
                  },
                ]}
              >
                {/* Sheet header */}
                <View
                  style={[
                    styles.sheetHeader,
                    { borderBottomColor: colors.secondaryTextColor + "22" },
                  ]}
                >
                  <StyledText
                    style={{
                      color: colors.secondaryTextColor,
                      fontSize: moderateScale(11),
                      letterSpacing: 0.8,
                      textTransform: "uppercase",
                    }}
                  >
                    {label ?? placeholder}
                  </StyledText>
                  <TouchableOpacity onPress={() => closeDropdown()}>
                    <StyledText
                      style={{
                        color: colors.secondaryTextColor,
                        fontSize: moderateScale(16),
                      }}
                    >
                      ✕
                    </StyledText>
                  </TouchableOpacity>
                </View>

                {/* Options list */}
                <FlatList
                  data={options}
                  keyExtractor={(item) => item.value}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item }) => {
                    const isSelected = item.value === value;
                    return (
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => handleSelect(item)}
                        style={[
                          styles.option,
                          isSelected && {
                            backgroundColor: colors.primaryColor + "22",
                          },
                        ]}
                      >
                        <StyledText
                          style={{
                            color: isSelected
                              ? colors.primaryColor
                              : colors.textColor,
                            fontSize: moderateScale(14),
                            fontWeight: isSelected ? "700" : "400",
                          }}
                        >
                          {item.label}
                        </StyledText>
                        {isSelected && (
                          <StyledText
                            style={{
                              color: colors.primaryColor,
                              fontSize: moderateScale(14),
                            }}
                          >
                            ✓
                          </StyledText>
                        )}
                      </TouchableOpacity>
                    );
                  }}
                />
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: moderateScale(8),
    borderWidth: 1.5,
    paddingHorizontal: moderateScale(10),
  },
  iconSlot: {
    width: moderateScale(28),
    alignItems: "center",
    justifyContent: "center",
  },
  valueText: {
    marginHorizontal: moderateScale(4),
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: moderateScale(20),
    borderTopRightRadius: moderateScale(20),
    maxHeight: moderateScale(340),
    paddingBottom: moderateScale(32),
    // shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 12,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(14),
    borderBottomWidth: 1,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(14),
  },
});
