// @/Pages/auth/registration/Registration.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Image, findNodeHandle } from "react-native";
import { moderateScale, ScaledSheet } from "react-native-size-matters";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useRouter } from "expo-router";
import { PlatformPressable } from "@react-navigation/elements";

import { useTheme } from "@/hooks/theme/ThemeContext";
import { ThemeColors } from "@/constants/themeCollorConstant";
import { StyledText } from "@/components/StyledText";
import { TextInputField } from "@/components/TextInputField";
import { useTranslation } from "react-i18next";
import { GiftCheckbox } from "@/components/GiftCheckbox";
import AppButton from "@/components/AppButton";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { AlertToast } from "@/components/AlertToast";
import { SelectDropdown } from "@/components/SelectDropdown";
import { useRegister } from "@/context/RegistrationContext";

// ─── Dropdown options ─────────────────────────────────────────────────────────

const GENDER_OPTIONS = [
  { label: "Male", value: "MALE" },
  { label: "Female", value: "FEMALE" },
  { label: "Other", value: "OTHER" },
];

const BLOOD_GROUP_OPTIONS = [
  { label: "A+", value: "A+" },
  { label: "A−", value: "A-" },
  { label: "B+", value: "B+" },
  { label: "B−", value: "B-" },
  { label: "AB+", value: "AB+" },
  { label: "AB−", value: "AB-" },
  { label: "O+", value: "O+" },
  { label: "O−", value: "O-" },
];

interface IRegisterFormData {
  f_name: string;
  l_name: string;
  phone: string;
  email: string;
  password: string;
  confirm_password: string;
  gender: string;
  date_of_birth: string;
  blood_group_name: string;
}

export default function Register() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { register, isLoading, error, clearError } = useRegister();

  const scrollRef = useRef<KeyboardAwareScrollView>(null);

  const scrollToInput = (input: any) => {
    const node = findNodeHandle(input);
    if (!node) return;
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToFocusedInput(node, moderateScale(24));
    });
  };

  const [registerFormData, setRegisterFormData] = useState<IRegisterFormData>({
    f_name: "",
    l_name: "",
    phone: "",
    email: "",
    password: "",
    confirm_password: "",
    gender: "",
    date_of_birth: "",
    blood_group_name: "",
  });

  const [acceptTerms, setAcceptTerms] = useState(false);

  // ── Toast state ────────────────────────────────────────────────────────────
  const [toast, setToast] = useState<{
    visible: boolean;
    type: "error" | "warning";
    title: string;
    message: string;
  }>({ visible: false, type: "error", title: "", message: "" });

  const showToast = (
    type: "error" | "warning",
    title: string,
    message: string,
  ) => setToast({ visible: true, type, title, message });

  const dismissToast = () => {
    setToast((prev) => ({ ...prev, visible: false }));
    clearError();
  };

  // Show server error via toast whenever it changes
  const prevError = useRef<string | null>(null);
  useEffect(() => {
    if (error && error !== prevError.current) {
      prevError.current = error;
      showToast(
        "error",
        t("register.error_title", "Registration Failed"),
        error,
      );
    }
    if (!error) prevError.current = null;
  }, [error]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const setField =
    <K extends keyof IRegisterFormData>(key: K) =>
    (value: unknown) =>
      setRegisterFormData((prev) => ({ ...prev, [key]: String(value) }));

  const clearField = (key: keyof IRegisterFormData) =>
    setRegisterFormData((prev) => ({ ...prev, [key]: "" }));

  const passwordsMatch =
    registerFormData.password.length > 0 &&
    registerFormData.confirm_password.length > 0 &&
    registerFormData.password === registerFormData.confirm_password;

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleRegister = async () => {
    dismissToast();

    // 1. Terms check
    if (!acceptTerms) {
      showToast(
        "warning",
        t("register.terms_title", "Terms Required"),
        t(
          "register.terms_message",
          "Please accept the terms & conditions to continue.",
        ),
      );
      return;
    }

    // 2. Client-side password match
    if (!passwordsMatch) {
      showToast(
        "warning",
        t("register.password_mismatch_title", "Password Mismatch"),
        t("register.password_not_match", "Passwords do not match."),
      );
      return;
    }

    // 3. Call the API (confirm_password is excluded from the payload)
    const { confirm_password, ...payload } = registerFormData;
    const success = await register(payload);

    // 4. On success → redirect to login
    if (success) {
      router.replace("/(auth)/login");
    }
  };

  // ── Button disabled logic ──────────────────────────────────────────────────
  const isSubmitDisabled = isLoading || !acceptTerms;

  return (
    <View
      style={{
        backgroundColor: colors.bodyBackground,
        paddingHorizontal: moderateScale(10),
        flex: 1,
      }}
    >
      {/* ── Reusable overlays ──────────────────────────────────────────────── */}
      <LoadingOverlay
        visible={isLoading}
        message={t("register.loading", "Creating your account...")}
      />

      <AlertToast
        visible={toast.visible}
        type={toast.type}
        title={toast.title}
        message={toast.message}
        duration={5000}
        onDismiss={dismissToast}
      />
      {/* ───────────────────────────────────────────────────────────────────── */}

      {/* Brand */}
      <View
        style={{
          height: moderateScale(100),
          width: "100%",
          marginTop: moderateScale(30),
        }}
      >
        <Image
          source={require("@/assets/other_images/brandicon.png")}
          style={{ width: "100%", height: "100%" }}
          resizeMode="cover"
        />
      </View>

      <KeyboardAwareScrollView
        ref={scrollRef}
        enableOnAndroid
        enableAutomaticScroll
        keyboardOpeningTime={0}
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={moderateScale(24)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: moderateScale(80) }}
      >
        <View
          style={{
            marginHorizontal: moderateScale(20),
            marginBottom: moderateScale(40),
          }}
        >
          <StyledText
            style={{
              fontWeight: "bold",
              fontSize: moderateScale(20),
              color: colors.primaryColor,
              marginTop: moderateScale(40),
            }}
          >
            {t("register.create_account", "Create Account")}
          </StyledText>

          <View
            style={{ marginTop: moderateScale(20), gap: moderateScale(10) }}
          >
            {/* First name */}
            <TextInputField
              onNativeFocusRef={scrollToInput}
              value={registerFormData.f_name}
              setValue={setField("f_name")}
              autoCapitalize="words"
              backgroundColor={colors.thirdBackgroundColor}
              focusedBackgroundColor={colors.thirdBackgroundColor}
              borderColor="transparent"
              focusedBorderColor={colors.primaryColor}
              inputTextColor={colors.textColor}
              placeholderText={t("register.f_name", "First name")}
              placeholderColor={colors.secondaryTextColor}
              height={44}
              leftIcon={{
                name: "user",
                color: colors.secondaryTextColor,
                size: 16,
              }}
              rightIcon={{
                name: "xmark",
                color: colors.secondaryTextColor,
                size: 14,
                onPress: () => clearField("f_name"),
              }}
              label={{
                text: t("register.f_name", "First name"),
                textColor: colors.secondaryTextColor,
              }}
            />

            {/* Last name */}
            <TextInputField
              onNativeFocusRef={scrollToInput}
              value={registerFormData.l_name}
              setValue={setField("l_name")}
              autoCapitalize="words"
              backgroundColor={colors.thirdBackgroundColor}
              focusedBackgroundColor={colors.thirdBackgroundColor}
              borderColor="transparent"
              focusedBorderColor={colors.primaryColor}
              inputTextColor={colors.textColor}
              placeholderText={t("register.l_name", "Last name")}
              placeholderColor={colors.secondaryTextColor}
              height={44}
              leftIcon={{
                name: "user",
                color: colors.secondaryTextColor,
                size: 16,
              }}
              rightIcon={{
                name: "xmark",
                color: colors.secondaryTextColor,
                size: 14,
                onPress: () => clearField("l_name"),
              }}
              label={{
                text: t("register.l_name", "Last name"),
                textColor: colors.secondaryTextColor,
              }}
            />

            {/* Phone */}
            <TextInputField
              onNativeFocusRef={scrollToInput}
              value={registerFormData.phone}
              setValue={setField("phone")}
              keyboardType="phone-pad"
              autoCapitalize="none"
              backgroundColor={colors.thirdBackgroundColor}
              focusedBackgroundColor={colors.thirdBackgroundColor}
              borderColor="transparent"
              focusedBorderColor={colors.primaryColor}
              inputTextColor={colors.textColor}
              placeholderText={t("register.phone", "Phone")}
              placeholderColor={colors.secondaryTextColor}
              height={44}
              leftIcon={{
                name: "phone",
                color: colors.secondaryTextColor,
                size: 16,
              }}
              rightIcon={{
                name: "xmark",
                color: colors.secondaryTextColor,
                size: 14,
                onPress: () => clearField("phone"),
              }}
              label={{
                text: t("register.phone", "Phone"),
                textColor: colors.secondaryTextColor,
              }}
            />

            {/* Email */}
            <TextInputField
              onNativeFocusRef={scrollToInput}
              value={registerFormData.email}
              setValue={setField("email")}
              keyboardType="email-address"
              autoCapitalize="none"
              backgroundColor={colors.thirdBackgroundColor}
              focusedBackgroundColor={colors.thirdBackgroundColor}
              borderColor="transparent"
              focusedBorderColor={colors.primaryColor}
              inputTextColor={colors.textColor}
              placeholderText={t("register.email", "Email")}
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
                onPress: () => clearField("email"),
              }}
              label={{
                text: t("register.email", "Email"),
                textColor: colors.secondaryTextColor,
              }}
            />

            {/* Gender */}
            <SelectDropdown
              value={registerFormData.gender}
              onChange={(v) =>
                setRegisterFormData((prev) => ({ ...prev, gender: v }))
              }
              options={GENDER_OPTIONS}
              placeholder={t("register.gender", "Gender")}
              label={t("register.gender", "Gender")}
            />

            {/* Date of birth */}
            <TextInputField
              onNativeFocusRef={scrollToInput}
              value={registerFormData.date_of_birth}
              setValue={setField("date_of_birth")}
              autoCapitalize="none"
              backgroundColor={colors.thirdBackgroundColor}
              focusedBackgroundColor={colors.thirdBackgroundColor}
              borderColor="transparent"
              focusedBorderColor={colors.primaryColor}
              inputTextColor={colors.textColor}
              placeholderText={t(
                "register.date_of_birth",
                "Date of birth (YYYY-MM-DD)",
              )}
              placeholderColor={colors.secondaryTextColor}
              height={44}
              leftIcon={{
                name: "calendar",
                color: colors.secondaryTextColor,
                size: 16,
              }}
              rightIcon={{
                name: "xmark",
                color: colors.secondaryTextColor,
                size: 14,
                onPress: () => clearField("date_of_birth"),
              }}
              label={{
                text: t("register.date_of_birth", "Date of birth"),
                textColor: colors.secondaryTextColor,
              }}
            />

            {/* Blood group */}
            <SelectDropdown
              value={registerFormData.blood_group_name}
              onChange={(v) =>
                setRegisterFormData((prev) => ({
                  ...prev,
                  blood_group_name: v,
                }))
              }
              options={BLOOD_GROUP_OPTIONS}
              placeholder={t("register.blood_group_name", "Blood group")}
              label={t("register.blood_group_name", "Blood group")}
            />

            {/* Password */}
            <TextInputField
              onNativeFocusRef={scrollToInput}
              value={registerFormData.password}
              setValue={setField("password")}
              mode="password"
              autoCapitalize="none"
              backgroundColor={colors.thirdBackgroundColor}
              focusedBackgroundColor={colors.thirdBackgroundColor}
              borderColor="transparent"
              focusedBorderColor={colors.primaryColor}
              inputTextColor={colors.textColor}
              placeholderText={t("register.password", "Password")}
              placeholderColor={colors.secondaryTextColor}
              height={44}
              leftIcon={{
                name: "lock",
                color: colors.secondaryTextColor,
                size: 16,
              }}
              label={{
                text: t("register.password", "Password"),
                textColor: colors.secondaryTextColor,
              }}
            />

            {/* Confirm password */}
            <TextInputField
              onNativeFocusRef={scrollToInput}
              value={registerFormData.confirm_password}
              setValue={setField("confirm_password")}
              mode="password"
              autoCapitalize="none"
              backgroundColor={colors.thirdBackgroundColor}
              focusedBackgroundColor={colors.thirdBackgroundColor}
              // Live border feedback: red when typed & mismatch, green when match
              borderColor={
                registerFormData.confirm_password.length > 0
                  ? passwordsMatch
                    ? colors.primaryColor
                    : "tomato"
                  : "transparent"
              }
              focusedBorderColor={
                registerFormData.confirm_password.length > 0 && !passwordsMatch
                  ? "tomato"
                  : colors.primaryColor
              }
              inputTextColor={colors.textColor}
              placeholderText={t(
                "register.confirm_password",
                "Confirm password",
              )}
              placeholderColor={colors.secondaryTextColor}
              height={44}
              leftIcon={{
                name: "lock",
                color: colors.secondaryTextColor,
                size: 16,
              }}
              label={{
                text: t("register.confirm_password", "Confirm password"),
                textColor: colors.secondaryTextColor,
              }}
            />

            {/* Inline password match hint */}
            {registerFormData.confirm_password.length > 0 && (
              <StyledText
                style={{
                  color: passwordsMatch ? colors.primaryColor : "tomato",
                  marginTop: moderateScale(2),
                  fontSize: moderateScale(12),
                }}
              >
                {passwordsMatch
                  ? t("register.password_match", "✓ Passwords match")
                  : t(
                      "register.password_not_match",
                      "✕ Passwords do not match",
                    )}
              </StyledText>
            )}

            {/* Terms */}
            <GiftCheckbox
              onChange={() => setAcceptTerms(!acceptTerms)}
              value={acceptTerms}
              label={t(
                "register.accept_terms",
                "I agree to the terms & conditions",
              )}
            />

            {/* Submit */}
            <AppButton
              title={t("register.register", "Register")}
              onPress={handleRegister}
              bgColor={colors.primaryColor}
              disabled={isSubmitDisabled}
              containerStyle={{
                marginTop: moderateScale(30),
                borderRadius: moderateScale(12),
                opacity: isSubmitDisabled ? 0.6 : 1,
              }}
              buttonStyle={{
                paddingVertical: moderateScale(15),
                borderRadius: moderateScale(12),
              }}
            />

            {/* Login link */}
            <View
              style={{
                flexDirection: "row",
                gap: moderateScale(5),
                alignItems: "center",
                justifyContent: "center",
                marginTop: moderateScale(10),
              }}
            >
              <StyledText style={{ color: colors.textColor }}>
                {t("register.have_account", "Already have an account?")}
              </StyledText>
              <PlatformPressable
                onPress={() => router.replace("/(auth)/login")}
              >
                <StyledText
                  style={{ fontWeight: "bold", color: colors.primaryColor }}
                >
                  {t("register.login", "Login")}
                </StyledText>
              </PlatformPressable>
            </View>
          </View>
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => ScaledSheet.create({});
