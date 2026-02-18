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

interface IResetPasswordForm {
  newPassword: string;
  confirmPassword: string;
}

export default function ResetPassword() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [form, setForm] = useState<IResetPasswordForm>({
    newPassword: "",
    confirmPassword: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const passwordsMatch =
    form.newPassword.length > 0 &&
    form.confirmPassword.length > 0 &&
    form.newPassword === form.confirmPassword;

  const passwordStrongEnough = useMemo(() => {
    // modern UX: simple “good enough” rule (adapt to your backend policy)
    return form.newPassword.trim().length >= 8;
  }, [form.newPassword]);

  const canSubmit = passwordStrongEnough && passwordsMatch && !isSubmitting;

  const handleResetPassword = async () => {
    setSuccessMsg("");
    if (!canSubmit) return;

    try {
      setIsSubmitting(true);

      // TODO: call your API (use token from deep link / route params)
      // await authApi.resetPassword({ token, newPassword: form.newPassword });

      setSuccessMsg(
        t(
          "reset_password.success",
          "Password updated successfully. You can now log in.",
        ),
      );
      setForm({ newPassword: "", confirmPassword: "" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.screen}>
      {/* Brand */}
      <View style={styles.brandWrap}>
        <Image
          source={require("@/assets/other_images/brandicon.png")}
          style={styles.brandImg}
          resizeMode="cover"
        />
      </View>

      <View style={styles.card}>
        <StyledText style={styles.title}>
          {t("reset_password.title", "Reset Password")}
        </StyledText>

        <StyledText style={styles.subtitle}>
          {t(
            "reset_password.subtitle",
            "Choose a new password that you don’t use elsewhere.",
          )}
        </StyledText>

        <View style={{ marginTop: moderateScale(18), gap: moderateScale(10) }}>
          <TextInputField
            value={form.newPassword}
            setValue={(v) => setForm((p) => ({ ...p, newPassword: String(v) }))}
            mode="password"
            autoCapitalize="none"
            backgroundColor={colors.thirdBackgroundColor}
            focusedBackgroundColor={colors.thirdBackgroundColor}
            borderColor={"transparent"}
            focusedBorderColor={colors.primaryColor}
            inputTextColor={colors.textColor}
            placeholderText={t("reset_password.new_password", "New password")}
            placeholderColor={colors.secondaryTextColor}
            height={44}
            leftIcon={{
              name: "lock",
              color: colors.secondaryTextColor,
              size: 16,
            }}
            rightIcon={{
              name: "eye",
              color: colors.secondaryTextColor,
              size: 14,
            }}
            label={{
              text: t("reset_password.new_password", "New password"),
              textColor: colors.secondaryTextColor,
            }}
          />

          {/* Password hint */}
          {form.newPassword.length > 0 && !passwordStrongEnough ? (
            <StyledText style={styles.hintText}>
              {t("reset_password.hint", "Use at least 8 characters.")}
            </StyledText>
          ) : null}

          <TextInputField
            value={form.confirmPassword}
            setValue={(v) =>
              setForm((p) => ({ ...p, confirmPassword: String(v) }))
            }
            mode="password"
            autoCapitalize="none"
            backgroundColor={colors.thirdBackgroundColor}
            focusedBackgroundColor={colors.thirdBackgroundColor}
            borderColor={"transparent"}
            focusedBorderColor={colors.primaryColor}
            inputTextColor={colors.textColor}
            placeholderText={t(
              "reset_password.confirm_password",
              "Confirm password",
            )}
            placeholderColor={colors.secondaryTextColor}
            height={44}
            leftIcon={{
              name: "lock",
              color: colors.secondaryTextColor,
              size: 16,
            }}
            rightIcon={{
              name: "eye",
              color: colors.secondaryTextColor,
              size: 14,
            }}
            label={{
              text: t("reset_password.confirm_password", "Confirm password"),
              textColor: colors.secondaryTextColor,
            }}
          />

          {form.confirmPassword.length > 0 && !passwordsMatch ? (
            <StyledText style={styles.errorText}>
              {t("reset_password.no_match", "Passwords do not match.")}
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
                ? t("reset_password.updating", "Updating...")
                : t("reset_password.update", "Update password")
            }
            bgColor={colors.primaryColor}
            containerStyle={{
              marginTop: moderateScale(18),
              borderRadius: moderateScale(12),
              opacity: canSubmit ? 1 : 0.6,
            }}
            buttonStyle={{
              paddingVertical: moderateScale(15),
              borderRadius: moderateScale(12),
            }}
            onPress={handleResetPassword as any}
          />

          <View style={styles.bottomRow}>
            <PlatformPressable
              onPress={() => {
                // TODO: navigation.navigate("Login")
              }}
              style={styles.linkBtn}
            >
              <StyledText style={styles.linkText}>
                {t("reset_password.go_to_login", "Go to login")}
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
      width: "100%",
      marginTop: moderateScale(30),
    },
    brandImg: { width: "100%", height: "100%" },

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
      fontWeight: "bold",
      fontSize: moderateScale(20),
      color: colors.primaryColor,
    },
    subtitle: {
      marginTop: moderateScale(6),
      color: colors.secondaryTextColor,
      fontSize: moderateScale(12),
      lineHeight: moderateScale(18),
    },

    hintText: {
      marginTop: moderateScale(2),
      color: colors.secondaryTextColor,
      fontSize: moderateScale(11),
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
