import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  TextInput,
  View,
} from "react-native";
import { moderateScale } from "react-native-size-matters";
import { StyledText } from "@/components/StyledText";
import AppButton from "@/components/AppButton";
import { useTheme } from "@/hooks/theme/ThemeContext";

type Props = {
  length?: number; // default 6
  title?: string;
  subtitle?: string; // e.g. "We sent a code to"
  destination?: string; // e.g. "+8801******90"
  onVerify: (code: string) => Promise<void> | void;
  onResend?: () => Promise<void> | void;
  resendSeconds?: number; // default 60
};

function onlyDigits(s: string) {
  return s.replace(/[^\d]/g, "");
}

function formatSeconds(total: number) {
  const m = Math.floor(total / 60);
  const s = total % 60;
  if (m <= 0) return `${s}s`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function OtpVerificationView({
  length = 6,
  title = "OTP Verification",
  subtitle = "We sent a code to",
  destination = "",
  onVerify,
  onResend,
  resendSeconds = 60,
}: Props) {
  const { colors } = useTheme();

  const [otp, setOtp] = useState<string[]>(Array.from({ length }, () => ""));
  const [focusedIndex, setFocusedIndex] = useState<number>(0);

  const [error, setError] = useState<string>("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);

  const [timer, setTimer] = useState(resendSeconds);

  const inputsRef = useRef<Array<TextInput | null>>([]);

  const code = useMemo(() => otp.join(""), [otp]);
  const isComplete = useMemo(() => otp.every((c) => c.length === 1), [otp]);

  useEffect(() => {
    const id = setTimeout(() => inputsRef.current[0]?.focus?.(), 250);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (timer <= 0) return;
    const id = setInterval(() => setTimer((t) => (t > 0 ? t - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [timer]);

  const focus = (index: number) => {
    if (index < 0 || index >= length) return;
    inputsRef.current[index]?.focus?.();
  };

  const setAt = (index: number, value: string) => {
    setOtp((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleChange = (index: number, text: string) => {
    setError("");
    let t = onlyDigits(text || "");

    // Paste support
    if (t.length > 1) {
      t = t.slice(0, length);
      const chars = t.split("");
      setOtp(Array.from({ length }, (_, i) => chars[i] ?? ""));
      const nextIndex = Math.min(t.length, length - 1);
      setFocusedIndex(nextIndex);
      focus(nextIndex);
      if (t.length >= length) Keyboard.dismiss();
      return;
    }

    const ch = t.slice(-1);
    setAt(index, ch);

    if (ch) {
      if (index < length - 1) {
        setFocusedIndex(index + 1);
        focus(index + 1);
      } else {
        Keyboard.dismiss();
      }
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key !== "Backspace") return;

    if (otp[index]) {
      setAt(index, "");
      return;
    }
    if (index > 0) {
      setAt(index - 1, "");
      setFocusedIndex(index - 1);
      focus(index - 1);
    }
  };

  const handleVerify = async () => {
    setError("");
    if (!isComplete) {
      setError("Please enter the full code.");
      return;
    }
    try {
      setVerifying(true);
      await onVerify(code);
    } catch (e) {
      setError("Invalid code. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!onResend || timer > 0) return;
    try {
      setResending(true);
      await onResend();
      setOtp(Array.from({ length }, () => ""));
      setFocusedIndex(0);
      focus(0);
      setTimer(resendSeconds);
      setError("");
    } catch (e) {
      setError("Could not resend right now. Please try again.");
    } finally {
      setResending(false);
    }
  };

  // Styling helpers
  const cardBg = colors.thirdBackgroundColor ?? "#fff";
  const border = colors.secondaryTextColor ?? "#CBD5E1";
  const primary = colors.primaryColor ?? "#2563EB";
  const text = colors.textColor ?? "#0F172A";
  const muted = colors.secondaryTextColor ?? "#64748B";
  const errorColor = "tomato";

  const heroCircleBg = "rgba(37,99,235,0.12)"; // subtle blue tint
  const heroCircleBorder = "rgba(37,99,235,0.25)";

  return (
    <KeyboardAvoidingView
      style={{ height:"70%", display:"flex", flexDirection:"column" , backgroundColor: colors.bodyBackground }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View
        style={{
          flex: 1,
          paddingHorizontal: moderateScale(16),
          justifyContent: "center",
        }}
      >
        {/* Centered block */}
        <View style={{ alignItems: "center" }}>
          {/* HERO / TOP UI */}
          <View
            style={{ alignItems: "center", marginBottom: moderateScale(14) }}
          >
            {/* Big headline */}
            <StyledText
              style={{
                marginTop: moderateScale(12),
                fontSize: moderateScale(22),
                fontWeight: "900",
                color: text,
                textAlign: "center",
              }}
            >
              Verify your number
            </StyledText>

            {/* Support text */}
            <StyledText
              style={{
                marginTop: moderateScale(6),
                color: muted,
                textAlign: "center",
                lineHeight: moderateScale(18),
              }}
            >
              Enter the {length}-digit code we just sent to{" "}
              <StyledText style={{ color: text, fontWeight: "800" }}>
                {destination}
              </StyledText>
              .
            </StyledText>
          </View>

          {/* CARD */}
          <View
            style={{
              width: "100%",
              backgroundColor: cardBg,
              borderRadius: moderateScale(18),
              padding: moderateScale(16),
              borderWidth: 1,
              borderColor: "rgba(0,0,0,0.06)",
              shadowColor: "#000",
              shadowOpacity: 0.06,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 8 },
              elevation: 2,
            }}
          >
            <StyledText
              style={{
                fontSize: moderateScale(18),
                fontWeight: "900",
                color: text,
              }}
            >
              {title}
            </StyledText>

            <StyledText
              style={{
                marginTop: moderateScale(6),
                color: muted,
                lineHeight: moderateScale(18),
              }}
            >
              {subtitle}{" "}
              <StyledText style={{ color: text, fontWeight: "800" }}>
                {destination}
              </StyledText>
            </StyledText>

            {/* OTP boxes */}
            <View
              style={{
                marginTop: moderateScale(18),
                flexDirection: "row",
                justifyContent: "space-between",
                gap: moderateScale(10),
              }}
            >
              {Array.from({ length }).map((_, i) => {
                const isFocused = focusedIndex === i;
                const filled = !!otp[i];
                const showError = !!error;

                const borderColor = showError
                  ? errorColor
                  : isFocused
                    ? primary
                    : filled
                      ? "rgba(37,99,235,0.45)"
                      : border;

                return (
                  <Pressable
                    key={i}
                    onPress={() => focus(i)}
                    style={{ flex: 1 }}
                  >
                    <View
                      style={{
                        height: moderateScale(54),
                        borderRadius: moderateScale(14),
                        borderWidth: 1.6,
                        borderColor,
                        backgroundColor: colors.bodyBackground,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <TextInput
                        ref={(r) => {
                          inputsRef.current[i] = r;
                        }}
                        value={otp[i]}
                        onFocus={() => setFocusedIndex(i)}
                        onChangeText={(t) => handleChange(i, t)}
                        onKeyPress={({ nativeEvent }) =>
                          handleKeyPress(i, nativeEvent.key)
                        }
                        keyboardType="number-pad"
                        returnKeyType="done"
                        textContentType="oneTimeCode"
                        autoComplete="sms-otp"
                        importantForAutofill="yes"
                        maxLength={length}
                        style={{
                          width: "100%",
                          height: "100%",
                          textAlign: "center",
                          fontSize: moderateScale(18),
                          fontWeight: "800",
                          color: text,
                        }}
                        selectionColor={primary}
                      />
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {/* Error line */}
            {error ? (
              <StyledText
                style={{
                  marginTop: moderateScale(10),
                  color: errorColor,
                  fontWeight: "700",
                }}
              >
                {error}
              </StyledText>
            ) : (
              <View style={{ height: moderateScale(18) }} />
            )}

            {/* Verify button */}
            <AppButton
              title={verifying ? "Verifying..." : "Verify"}
              onPress={handleVerify}
              bgColor={primary}
              containerStyle={{
                marginTop: moderateScale(4),
                borderRadius: moderateScale(14),
                opacity: verifying ? 0.7 : 1,
              }}
              buttonStyle={{
                paddingVertical: moderateScale(14),
                borderRadius: moderateScale(14),
              }}
            />

            {/* Resend row */}
            <View
              style={{
                marginTop: moderateScale(12),
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                gap: moderateScale(8),
              }}
            >
              {timer > 0 ? (
                <StyledText style={{ color: muted, fontWeight: "700" }}>
                  Resend in {formatSeconds(timer)}
                </StyledText>
              ) : (
                <Pressable
                  onPress={handleResend}
                  disabled={!onResend || resending}
                  style={{ paddingVertical: moderateScale(6) }}
                >
                  <StyledText
                    style={{
                      color: primary,
                      fontWeight: "900",
                      opacity: resending ? 0.6 : 1,
                    }}
                  >
                    {resending ? "Resending..." : "Resend code"}
                  </StyledText>
                </Pressable>
              )}
            </View>
          </View>

          {/* Bottom hint */}
          <View
            style={{
              marginTop: moderateScale(14),
              alignItems: "center",
            }}
          >
            <StyledText style={{ color: muted }}>
              Didn’t get the code? Check SMS inbox/spam.
            </StyledText>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
