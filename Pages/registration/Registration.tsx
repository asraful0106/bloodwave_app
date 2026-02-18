import React, { useMemo, useRef, useState } from "react";
import { View, Image, findNodeHandle } from "react-native";
import { moderateScale, ScaledSheet } from "react-native-size-matters";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

import { useTheme } from "@/hooks/theme/ThemeContext";
import { ThemeColors } from "@/constants/themeCollorConstant";
import { StyledText } from "@/components/StyledText";
import { TextInputField } from "@/components/TextInputField";
import { useTranslation } from "react-i18next";
import { GiftCheckbox } from "@/components/GiftCheckbox";
import AppButton from "@/components/AppButton";

interface IRegisterFormData {
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  password: string;
  confirm_password: string;
  gender: string;
  date_of_birth: string;
  blood_group: string;
}

export default function Register() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const scrollRef = useRef<KeyboardAwareScrollView>(null);

  const scrollToInput = (input: any) => {
    const node = findNodeHandle(input);
    if (!node) return;

    requestAnimationFrame(() => {
      scrollRef.current?.scrollToFocusedInput(node, moderateScale(24));
    });
  };

  const [registerFormData, setRegisterFormData] = useState<IRegisterFormData>({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    password: "",
    confirm_password: "",
    gender: "",
    date_of_birth: "",
    blood_group: "",
  });

  const [acceptTerms, setAcceptTerms] = useState(false);

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

  return (
    <View
      style={{
        backgroundColor: colors.bodyBackground,
        paddingHorizontal: moderateScale(10),
        flex: 1,
      }}
    >
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

      {/* ✅ ONLY scroll container */}
      <KeyboardAwareScrollView
        ref={scrollRef}
        enableOnAndroid
        enableAutomaticScroll
        keyboardOpeningTime={0}
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={moderateScale(24)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: moderateScale(80),
        }}
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
            <TextInputField
              onNativeFocusRef={scrollToInput}
              value={registerFormData.first_name}
              setValue={setField("first_name")}
              autoCapitalize="words"
              backgroundColor={colors.thirdBackgroundColor}
              focusedBackgroundColor={colors.thirdBackgroundColor}
              borderColor="transparent"
              focusedBorderColor={colors.primaryColor}
              inputTextColor={colors.textColor}
              placeholderText={t("register.first_name", "First name")}
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
                onPress: () => clearField("first_name"),
              }}
              label={{
                text: t("register.first_name", "First name"),
                textColor: colors.secondaryTextColor,
              }}
            />

            <TextInputField
              onNativeFocusRef={scrollToInput}
              value={registerFormData.last_name}
              setValue={setField("last_name")}
              autoCapitalize="words"
              backgroundColor={colors.thirdBackgroundColor}
              focusedBackgroundColor={colors.thirdBackgroundColor}
              borderColor="transparent"
              focusedBorderColor={colors.primaryColor}
              inputTextColor={colors.textColor}
              placeholderText={t("register.last_name", "Last name")}
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
                onPress: () => clearField("last_name"),
              }}
              label={{
                text: t("register.last_name", "Last name"),
                textColor: colors.secondaryTextColor,
              }}
            />

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

            <TextInputField
              onNativeFocusRef={scrollToInput}
              value={registerFormData.gender}
              setValue={setField("gender")}
              autoCapitalize="words"
              backgroundColor={colors.thirdBackgroundColor}
              focusedBackgroundColor={colors.thirdBackgroundColor}
              borderColor="transparent"
              focusedBorderColor={colors.primaryColor}
              inputTextColor={colors.textColor}
              placeholderText={t("register.gender", "Gender")}
              placeholderColor={colors.secondaryTextColor}
              height={44}
              leftIcon={{
                name: "venus-mars",
                color: colors.secondaryTextColor,
                size: 16,
              }}
              rightIcon={{
                name: "xmark",
                color: colors.secondaryTextColor,
                size: 14,
                onPress: () => clearField("gender"),
              }}
              label={{
                text: t("register.gender", "Gender"),
                textColor: colors.secondaryTextColor,
              }}
            />

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

            <TextInputField
              onNativeFocusRef={scrollToInput}
              value={registerFormData.blood_group}
              setValue={setField("blood_group")}
              autoCapitalize="characters"
              backgroundColor={colors.thirdBackgroundColor}
              focusedBackgroundColor={colors.thirdBackgroundColor}
              borderColor="transparent"
              focusedBorderColor={colors.primaryColor}
              inputTextColor={colors.textColor}
              placeholderText={t(
                "register.blood_group",
                "Blood group (e.g. A+)",
              )}
              placeholderColor={colors.secondaryTextColor}
              height={44}
              leftIcon={{
                name: "droplet",
                color: colors.secondaryTextColor,
                size: 16,
              }}
              rightIcon={{
                name: "xmark",
                color: colors.secondaryTextColor,
                size: 14,
                onPress: () => clearField("blood_group"),
              }}
              label={{
                text: t("register.blood_group", "Blood group"),
                textColor: colors.secondaryTextColor,
              }}
            />

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

            <TextInputField
              onNativeFocusRef={scrollToInput}
              value={registerFormData.confirm_password}
              setValue={setField("confirm_password")}
              mode="password"
              autoCapitalize="none"
              backgroundColor={colors.thirdBackgroundColor}
              focusedBackgroundColor={colors.thirdBackgroundColor}
              borderColor="transparent"
              focusedBorderColor={colors.primaryColor}
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

            {registerFormData.confirm_password.length > 0 && (
              <StyledText
                style={{
                  color: passwordsMatch ? colors.primaryColor : "tomato",
                  marginTop: moderateScale(2),
                }}
              >
                {passwordsMatch
                  ? t("register.password_match", "Passwords match")
                  : t("register.password_not_match", "Passwords do not match")}
              </StyledText>
            )}

            <GiftCheckbox
              onChange={() => setAcceptTerms(!acceptTerms)}
              value={acceptTerms}
              label={t(
                "register.accept_terms",
                "I agree to the terms & conditions",
              )}
            />

            <AppButton
              title={t("register.register", "Register")}
              bgColor={colors.primaryColor}
              containerStyle={{
                marginTop: moderateScale(30),
                borderRadius: moderateScale(12),
                opacity: acceptTerms ? 1 : 0.7,
              }}
              buttonStyle={{
                paddingVertical: moderateScale(15),
                borderRadius: moderateScale(12),
              }}
            />

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
              <StyledText
                style={{ fontWeight: "bold", color: colors.primaryColor }}
              >
                {t("register.login", "Login")}
              </StyledText>
            </View>
          </View>
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => ScaledSheet.create({});
