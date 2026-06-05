// @/Pages/auth/login/Login.tsx
import { View, Image } from "react-native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "@/hooks/theme/ThemeContext";
import { ThemeColors } from "@/constants/themeCollorConstant";
import { moderateScale, ScaledSheet } from "react-native-size-matters";
import { StyledText } from "@/components/StyledText";
import { TextInputField } from "@/components/TextInputField";
import { useTranslation } from "react-i18next";
import { GiftCheckbox } from "@/components/GiftCheckbox";
import { PlatformPressable } from "@react-navigation/elements";
import AppButton from "@/components/AppButton";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { AlertToast } from "@/components/AlertToast";

interface ILoginFromData {
  email: string;
  password: string;
}

export default function Login() {
  const router = useRouter();
  const { login, isLoading: loginLoading, error: loginError } = useAuth();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [loginFromData, setLoginFromData] = useState<ILoginFromData>({
    email: "",
    password: "",
  });
  const [isRemember, setIsRemember] = useState<boolean>(false);
  const [toastVisible, setToastVisible] = useState(false);

  // Show toast whenever a new error arrives from AuthContext
  const prevError = useRef<string | null>(null);
  useEffect(() => {
    if (loginError && loginError !== prevError.current) {
      prevError.current = loginError;
      setToastVisible(true);
    }
    if (!loginError) {
      prevError.current = null;
      setToastVisible(false);
    }
  }, [loginError]);

  // helpers
  const setEmail = (email: string) =>
    setLoginFromData((prev) => ({ ...prev, email }));

  const setPassword = (password: string) =>
    setLoginFromData((prev) => ({ ...prev, password }));

  const handleSignup = () => {
    router.push("/register");
  };

  const handleLogin = () => {
    // Dismiss any previous toast before attempting
    setToastVisible(false);
    login({ email: loginFromData.email, password: loginFromData.password });
  };

  return (
    <View
      style={[
        {
          flex: 1,
          backgroundColor: colors.bodyBackground,
          paddingHorizontal: moderateScale(10),
        },
      ]}
    >
      {/* ── Reusable components ───────────────────────────────────────── */}
      <LoadingOverlay visible={loginLoading} message={t("universal.loading")} />

      <AlertToast
        visible={toastVisible}
        type="error"
        title={t("login.error_title")}
        message={loginError ?? t("login.error_generic")}
        duration={4000}
        onDismiss={() => setToastVisible(false)}
      />
      {/* ─────────────────────────────────────────────────────────────── */}

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

      <View style={{ marginHorizontal: moderateScale(20) }}>
        <StyledText
          style={{
            fontWeight: "bold",
            fontSize: moderateScale(20),
            color: colors.primaryColor,
            marginTop: moderateScale(100),
          }}
        >
          {t("login.welcome_back")}
        </StyledText>

        {/* Login Form */}
        <View
          style={{
            marginTop: moderateScale(20),
            display: "flex",
            gap: moderateScale(10),
          }}
        >
          {/* Email */}
          <TextInputField
            value={loginFromData.email}
            setValue={(v) =>
              setLoginFromData((prev) => ({ ...prev, email: String(v) }))
            }
            mode="normal"
            keyboardType="email-address"
            autoCapitalize="none"
            backgroundColor={colors.thirdBackgroundColor}
            focusedBackgroundColor={colors.thirdBackgroundColor}
            borderColor={"transparent"}
            focusedBorderColor={colors.primaryColor}
            inputTextColor={colors.textColor}
            placeholderText={t("login.email")}
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
              onPress: () =>
                setLoginFromData((prev) => ({ ...prev, email: "" })),
            }}
            label={{
              text: t("login.email"),
              textColor: colors.secondaryTextColor,
            }}
          />

          {/* Password */}
          <TextInputField
            value={loginFromData.password}
            setValue={(v) =>
              setLoginFromData((prev) => ({ ...prev, password: String(v) }))
            }
            mode="password"
            autoCapitalize="none"
            backgroundColor={colors.thirdBackgroundColor}
            focusedBackgroundColor={colors.thirdBackgroundColor}
            borderColor={"transparent"}
            focusedBorderColor={colors.primaryColor}
            inputTextColor={colors.textColor}
            placeholderText={t("login.password")}
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
              text: t("login.password"),
              textColor: colors.secondaryTextColor,
            }}
          />

          {/* Remember me + Forgot password */}
          <View
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <GiftCheckbox
              onChange={() => setIsRemember(!isRemember)}
              value={isRemember}
              label={t("login.remember_me")}
            />
            <StyledText style={{ color: colors.primaryColor }}>
              {t("login.forget_password")}
            </StyledText>
          </View>

          {/* Login button — disabled while loading */}
          <AppButton
            title={t("login.login")}
            onPress={handleLogin}
            bgColor={colors.primaryColor}
            disabled={loginLoading}
            containerStyle={{
              marginTop: moderateScale(70),
              borderRadius: moderateScale(12),
              opacity: loginLoading ? 0.6 : 1,
            }}
            buttonStyle={{
              paddingVertical: moderateScale(15),
              borderRadius: moderateScale(12),
            }}
          />
        </View>

        {/* Register route */}
        <View
          style={{
            display: "flex",
            flexDirection: "row",
            gap: moderateScale(5),
            alignItems: "center",
            justifyContent: "center",
            marginTop: moderateScale(10),
          }}
        >
          <StyledText style={{ color: colors.textColor }}>
            Don't have an account?
          </StyledText>
          <PlatformPressable onPress={handleSignup}>
            <StyledText
              style={{ fontWeight: "bold", color: colors.primaryColor }}
            >
              Sign Up
            </StyledText>
          </PlatformPressable>
        </View>
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => ScaledSheet.create({});
