import { StyledText } from "@/components/StyledText";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import React, {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  KeyboardTypeOptions,
  Pressable,
  StyleProp,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";
import { moderateScale } from "react-native-size-matters";

type FA6Name = React.ComponentProps<typeof FontAwesome6>["name"];

type LabelProps = {
  show?: boolean;
  text?: string;
  iconName?: FA6Name;
  iconSize?: number;
  iconColor?: string;
  textColor?: string;
  textStyle?: StyleProp<TextStyle>;
};

type IconProps = {
  show?: boolean;
  name: FA6Name;
  size?: number;
  color?: string;
  onPress?: () => void; // mostly for right icon
};

type InputMode = "normal" | "password";

export interface TextInputFieldProps extends Omit<
  TextInputProps,
  "value" | "onChangeText" | "keyboardType"
> {
  value: string | number;
  onChangeText?: (text: string | number) => void;
  setValue?: (text: string | number) => void;

  height?: number;
  keyboardType?: KeyboardTypeOptions;

  mode?: InputMode;

  // colors
  backgroundColor: string;
  focusedBackgroundColor?: string;

  borderWidth?: number;
  focusedBorderWidth?: number;
  borderColor?: string;
  focusedBorderColor?: string;

  inputTextColor: string;
  inputTextSize?: number;

  placeholderText?: string;
  placeholderColor?: string;

  label?: LabelProps;
  leftIcon?: IconProps;
  rightIcon?: IconProps;

  containerStyle?: StyleProp<ViewStyle>;
  inputContainerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;

  /**
   * ✅ NEW: Helpful for KeyboardAwareScrollView to reliably scroll to focused input.
   * Pass a callback from the parent and we will provide the native TextInput ref on focus.
   */
  onNativeFocusRef?: (ref: TextInput | null) => void;
}

export type TextInputFieldRef = {
  focus: () => void;
  blur: () => void;
  getNativeRef: () => TextInput | null; // ✅ NEW (optional convenience)
};

export const TextInputField = forwardRef<
  TextInputFieldRef,
  TextInputFieldProps
>((props, ref) => {
  const {
    value,
    onChangeText,
    setValue,
    height = 40,
    keyboardType = "default",
    mode = "normal",
    backgroundColor,
    focusedBackgroundColor,
    borderWidth = 0,
    focusedBorderWidth = 1,
    borderColor = "transparent",
    focusedBorderColor,
    inputTextColor,
    inputTextSize,
    placeholderText = "Enter text…",
    placeholderColor = "#999",
    label,
    leftIcon,
    rightIcon,
    containerStyle,
    inputContainerStyle,
    inputStyle,
    onNativeFocusRef,
    ...textInputProps
  } = props;

  const [focused, setFocused] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
    blur: () => inputRef.current?.blur(),
    getNativeRef: () => inputRef.current,
  }));

  const handleChange = (text: string) => {
    onChangeText?.(text);
    setValue?.(text);
  };

  const isEmptyValue = (v: string | number | null | undefined) => {
    if (v == null) return true;
    if (typeof v === "string") return v.length === 0;
    return v === 0 || Number.isNaN(v);
  };

  const showPlaceholder = useMemo(
    () => !focused && isEmptyValue(value),
    [focused, value],
  );

  const bg = focused
    ? (focusedBackgroundColor ?? backgroundColor)
    : backgroundColor;

  const brColor = focused ? (focusedBorderColor ?? borderColor) : borderColor;
  const brWidth = focused ? focusedBorderWidth : borderWidth;

  const left = leftIcon?.show === false ? undefined : leftIcon;
  const rightBase = rightIcon?.show === false ? undefined : rightIcon;

  const right =
    mode === "password"
      ? {
          name: (passwordVisible ? "eye-slash" : "eye") as FA6Name,
          size: rightBase?.size ?? 16,
          color: rightBase?.color ?? placeholderColor,
          onPress: () => setPasswordVisible((p) => !p),
          show: rightBase?.show,
        }
      : rightBase;

  const handleRightPress =
    mode === "password"
      ? right?.onPress
      : (right?.onPress ??
        (() => {
          // old default: clear if right icon exists but no handler given
          handleChange("");
        }));

  const hasValue =
    typeof value === "number"
      ? Number.isFinite(value) && value !== 0
      : value !== "";

  return (
    <View style={[{ gap: moderateScale(8) }, containerStyle]}>
      {/* Label row */}
      {label?.show !== false && (label?.text || label?.iconName) ? (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: moderateScale(6),
          }}
        >
          {label?.iconName ? (
            <FontAwesome6
              name={label.iconName}
              size={moderateScale(label.iconSize ?? 16)}
              color={label.iconColor ?? label.textColor ?? "#666"}
            />
          ) : null}

          {label?.text ? (
            <StyledText
              style={[
                { color: label.textColor ?? "#666", fontWeight: "700" },
                label.textStyle,
              ]}
            >
              {label.text}
            </StyledText>
          ) : null}
        </View>
      ) : null}

      {/* Input container */}
      <Pressable
        onPress={() => inputRef.current?.focus()}
        style={[
          {
            backgroundColor: bg,
            borderRadius: moderateScale(6),
            height: moderateScale(height),
            paddingHorizontal: moderateScale(12),
            flexDirection: "row",
            alignItems: "center",
            gap: moderateScale(8),
            borderWidth: brWidth,
            borderColor: brColor,
          },
          inputContainerStyle,
        ]}
      >
        {/* Left icon */}
        {left?.name ? (
          <FontAwesome6
            name={left.name}
            size={moderateScale(left.size ?? 16)}
            color={left.color ?? placeholderColor}
          />
        ) : null}

        {/* TextInput + custom placeholder */}
        <View style={{ flex: 1, position: "relative" }}>
          {showPlaceholder ? (
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                justifyContent: "center",
              }}
            >
              <StyledText style={{ color: placeholderColor }}>
                {placeholderText}
              </StyledText>
            </View>
          ) : null}

          <TextInput
            ref={inputRef}
            value={
              typeof value === "number"
                ? Number.isFinite(value)
                  ? value === 0
                    ? ""
                    : String(value)
                  : ""
                : String(value)
            }
            onChangeText={handleChange}
            keyboardType={keyboardType}
            secureTextEntry={mode === "password" && !passwordVisible}
            onFocus={(e) => {
              setFocused(true);

              // ✅ NEW: parent can scroll reliably when this input focuses
              onNativeFocusRef?.(inputRef.current);

              textInputProps.onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              textInputProps.onBlur?.(e);
            }}
            style={[
              {
                height: moderateScale(height),
                color: inputTextColor,
                fontSize: inputTextSize
                  ? moderateScale(inputTextSize)
                  : undefined,
                padding: 0,
              },
              inputStyle,
            ]}
            placeholder="" // custom placeholder overlay
            // ✅ IMPORTANT: don't override user-provided autoCapitalize
            autoCapitalize={textInputProps.autoCapitalize ?? "none"}
            // ✅ IMPORTANT: don't override user-provided spellCheck
            spellCheck={textInputProps.spellCheck ?? false}
            {...textInputProps}
          />
        </View>

        {/* Right icon */}
        {right?.name && hasValue ? (
          <Pressable
            onPress={handleRightPress}
            hitSlop={10}
            disabled={!handleRightPress}
          >
            <FontAwesome6
              name={right.name}
              size={moderateScale(right.size ?? 16)}
              color={right.color ?? placeholderColor}
            />
          </Pressable>
        ) : null}
      </Pressable>
    </View>
  );
});

TextInputField.displayName = "TextInputField";
