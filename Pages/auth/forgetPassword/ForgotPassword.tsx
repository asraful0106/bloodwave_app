import React, { useMemo, useState } from "react";
import { View, Image } from "react-native";
import { moderateScale, ScaledSheet } from "react-native-size-matters";
import { useTheme } from "@/hooks/theme/ThemeContext";
import { StyledText } from "@/components/StyledText";
import { TextInputField } from "@/components/TextInputField";
import AppButton from "@/components/AppButton";
import { useTranslation } from "react-i18next";
import { PlatformPressable } from "@react-navigation/elements";
import { ThemeColors } from "@/constants/themeCollorConstant";
// If you're using react-navigation, you can swap to: import { useNavigation } from "@react-navigation/native";

interface IForgotPasswordForm {
  email: string;
}

export default function ForgotPassword() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [form, setForm] = useState<IForgotPasswordForm>({ email: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string>("");

  const setEmail = (email: string) => setForm((p) => ({ ...p, email }));

  const isValidEmail = useMemo(() => {
    const email = form.email.trim();
    // simple email validation (good enough for client-side UX)
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }, [form.email]);

  const handleSendResetLink = async () => {
    setSuccessMsg("");
    if (!isValidEmail || isSubmitting) return;

    try {
      setIsSubmitting(true);

      // TODO: call your API (send reset email / OTP)
      // await authApi.requestPasswordReset({ email: form.email.trim() });

      // UX: show optimistic success
      setSuccessMsg(
        t(
          "forgot_password.success",
          "If an account exists for this email, we’ve sent a password reset link.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.screen}>
      {/* Brand */}
      <View style={[styles.brandWrap, { width: "100%" }]}>
        <Image
          source={require("@/assets/other_images/brandicon.png")}
          style={{ width: "100%", height: "100%" }}
          resizeMode="cover"
        />
      </View>

      <View style={styles.card}>
        <StyledText
          style={[
            styles.title,
            {
              fontWeight: "bold",
            },
          ]}
        >
          {t("forgot_password.title", "Forgot Password")}
        </StyledText>

        <StyledText style={styles.subtitle}>
          {t(
            "forgot_password.subtitle",
            "Enter your email and we’ll send you instructions to reset your password.",
          )}
        </StyledText>

        <View style={{ marginTop: moderateScale(18), gap: moderateScale(10) }}>
          <TextInputField
            value={form.email}
            setValue={(v) => setEmail(String(v))}
            mode="normal"
            keyboardType="email-address"
            autoCapitalize="none"
            backgroundColor={colors.thirdBackgroundColor}
            focusedBackgroundColor={colors.thirdBackgroundColor}
            borderColor={"transparent"}
            focusedBorderColor={colors.primaryColor}
            inputTextColor={colors.textColor}
            placeholderText={t("forgot_password.email", "Email")}
            placeholderColor={colors.secondaryTextColor}
            height={44}
            leftIcon={{
              name: "envelope",
              color: colors.secondaryTextColor,
              size: 16,
            }}
            rightIcon={{
              name: "xmark",
              color: colors.secondaryTextColor,
              size: 14,
              onPress: () => setEmail(""),
            }}
            label={{
              text: t("forgot_password.email", "Email"),
              textColor: colors.secondaryTextColor,
            }}
          />

          {/* Inline validation */}
          {form.email.length > 0 && !isValidEmail ? (
            <StyledText style={styles.errorText}>
              {t(
                "forgot_password.invalid_email",
                "Please enter a valid email.",
              )}
            </StyledText>
          ) : null}

          {successMsg ? (
            <View style={styles.successBox}>
              <StyledText style={styles.successText}>{successMsg}</StyledText>
            </View>
          ) : null}

          <AppButton
            title={
              isSubmitting
                ? t("forgot_password.sending", "Sending...")
                : t("forgot_password.send_link", "Send reset link")
            }
            // onPress={handleSendResetLink}
            bgColor={colors.primaryColor}
            containerStyle={{
              marginTop: moderateScale(18),
              borderRadius: moderateScale(12),
              opacity: isValidEmail && !isSubmitting ? 1 : 0.6,
            }}
            buttonStyle={{
              paddingVertical: moderateScale(15),
              borderRadius: moderateScale(12),
            }}
            // If AppButton supports disabled prop, uncomment:
            // disabled={!isValidEmail || isSubmitting}
            onPress={handleSendResetLink as any}
          />

          {/* Back to login */}
          <View style={styles.bottomRow}>
            <PlatformPressable
              onPress={() => {
                // TODO: navigation.goBack() OR navigation.navigate("Login")
              }}
              style={styles.linkBtn}
            >
              <StyledText style={styles.linkText}>
                {t("forgot_password.back_to_login", "Back to login")}
              </StyledText>
            </PlatformPressable>
          </View>
        </View>
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  ScaledSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.bodyBackground,
      paddingHorizontal: moderateScale(10),
    },
    brandWrap: {
      height: moderateScale(100),

      marginTop: moderateScale(30),
    },

    // Modern “card” container
    card: {
      marginHorizontal: moderateScale(20),
      marginTop: moderateScale(30),
      padding: moderateScale(16),
      borderRadius: moderateScale(16),
      backgroundColor:
        colors.secondBackgroundColor ?? colors.thirdBackgroundColor,
      borderWidth: 1,
      borderColor: "rgba(0,0,0,0.06)",
    },

    title: {
      fontSize: moderateScale(20),
      color: colors.primaryColor,
    },
    subtitle: {
      marginTop: moderateScale(6),
      color: colors.secondaryTextColor,
      fontSize: moderateScale(12),
      lineHeight: moderateScale(18),
    },

    errorText: {
      marginTop: moderateScale(2),
      color: "#EF4444",
      fontSize: moderateScale(11),
    },

    successBox: {
      marginTop: moderateScale(8),
      padding: moderateScale(10),
      borderRadius: moderateScale(12),
      backgroundColor: "rgba(34,197,94,0.10)",
      borderWidth: 1,
      borderColor: "rgba(34,197,94,0.22)",
    },
    successText: {
      color: colors.textColor,
      fontSize: moderateScale(12),
      lineHeight: moderateScale(18),
    },

    bottomRow: {
      marginTop: moderateScale(16),
      alignItems: "center",
      justifyContent: "center",
    },
    linkBtn: {
      paddingVertical: moderateScale(6),
      paddingHorizontal: moderateScale(8),
    },
    linkText: { color: colors.primaryColor, fontWeight: "600" },
  });
