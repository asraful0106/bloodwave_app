import React from "react";
import { View, StyleSheet, ViewStyle, TextStyle } from "react-native";
import { StyledText } from "./StyledText";
import { PlatformPressable } from "@react-navigation/elements";

type AppButtonProps = Omit<
  React.ComponentProps<typeof PlatformPressable>,
  "children"
> & {
  title: React.ReactNode; // pass: t("login.login")
  containerStyle?: ViewStyle; // outer wrapper style
  buttonStyle?: ViewStyle; // inner button style
  textStyle?: TextStyle; // label style
  bgColor?: string; // optional background color
  disabled?: boolean;
};

export default function AppButton({
  title,
  containerStyle,
  buttonStyle,
  textStyle,
  bgColor,
  disabled,
  style, // style of PlatformPressable itself
  onPress,
  ...rest
}: AppButtonProps) {
  const [isPressed, setIsPressed] = React.useState(false);

  return (
    <PlatformPressable
      {...rest}
      onPress={onPress}
      disabled={disabled}
      onPressIn={(e: any) => {
        setIsPressed(true);
        rest.onPressIn?.(e);
      }}
      onPressOut={(e: any) => {
        setIsPressed(false);
        rest.onPressOut?.(e);
      }}
      style={[
        styles.pressable,
        style as any,
        containerStyle,
        disabled ? styles.disabled : null,
        { opacity: disabled ? 0.6 : isPressed ? 0.85 : 1 },
      ]}
    >
      <View
        style={[
          styles.button,
          bgColor ? { backgroundColor: bgColor } : null,
          buttonStyle,
        ]}
      >
        <StyledText style={[styles.text, textStyle]}>{title}</StyledText>
      </View>
    </PlatformPressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    borderRadius: 12,
    overflow: "hidden",
  },
  button: {
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  disabled: {},
});
