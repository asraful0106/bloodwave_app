// @/src/pages/setting/Setting.tsx

import React, { useMemo, useState } from "react";
import { TouchableOpacity, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { moderateScale, ScaledSheet } from "react-native-size-matters";
import { StyledText } from "@/components/StyledText";
import { ThemeColors } from "@/constants/themeCollorConstant";
import { useLanguage } from "@/hooks/language/LanguageContext";
import { useTheme } from "@/hooks/theme/ThemeContext";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTranslation } from "react-i18next";
import { ThemeToggle } from "./components/ThemeToggle";
import { LanguagePillToggle } from "./components/LanguagePillToggle";

export default function Settings() {
  const { colors, changeTheme, themeName } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { t } = useTranslation();
  const { changeLanguage, lang } = useLanguage()

  return (
    <>
      <KeyboardAwareScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        enableOnAndroid={true}
        extraScrollHeight={20}
        enableAutomaticScroll={true}
      >
        <View
          style={{
            paddingLeft: moderateScale(13),
            paddingRight: moderateScale(13),
          }}
        >
          {/* General Settings */}
          <View style={styles.settingContainer}>
            <View
              style={{ flexDirection: "column", gap: moderateScale(4, 0.01) }}
            >
              <StyledText style={styles.heading}>
                {t("setting.generalSetting")}
              </StyledText>
              <View
                style={{
                  width: moderateScale(95, 0.01),
                  height: moderateScale(1, 0.01),
                  backgroundColor: colors.divider,
                }}
              />
            </View>

            <View
              style={{
                marginTop: moderateScale(14, 0.01),
                flexDirection: "column",
                gap: moderateScale(16, 0.01),
              }}
            >
              {/* Theme */}
              <View style={styles.settingRow}>
                <View style={styles.settingLabelRow}>
                  <Ionicons
                    name={
                      themeName === "dark" ? "moon-outline" : "sunny-outline"
                    }
                    size={moderateScale(15)}
                    color={colors.secondaryTextColor}
                    style={{ marginRight: moderateScale(6) }}
                  />
                  <StyledText style={styles.settingLabel}>
                    {t("setting.theme")}
                  </StyledText>
                </View>
                <ThemeToggle
                  value={themeName}
                  onChange={(v) => changeTheme(v)}
                  colors={colors}
                />
              </View>

              <View style={styles.divider} />

              {/* Language */}
              <View style={styles.settingRow}>
                <View style={styles.settingLabelRow}>
                  <Ionicons
                    name="language-outline"
                    size={moderateScale(15)}
                    color={colors.secondaryTextColor}
                    style={{ marginRight: moderateScale(6, 0.01) }}
                  />
                  <StyledText style={styles.settingLabel}>
                    {t("setting.language")}
                  </StyledText>
                </View>
                <LanguagePillToggle
                  value={lang}
                  onChange={(v) => changeLanguage(v)}
                  colors={colors}
                />
              </View>

              <View style={styles.divider} />
            </View>
          </View>

          <View style={{ marginVertical: 15 }} />
        </View>
      </KeyboardAwareScrollView>
    </>
  );
}

const createStyles = (colors: ThemeColors) =>
  ScaledSheet.create({
    settingContainer: {
      flexDirection: "column",
      backgroundColor: colors.secondBackgroundColor,
      borderRadius: "12@ms0.01",
      marginTop: "20@ms0.01",
      padding: "16@ms0.01",
    },
    heading: {
      color: colors.textColor,
      fontSize: "15@ms0.01",
      fontWeight: "600",
    },
    settingRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    settingLabelRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    settingLabel: {
      color: colors.secondaryTextColor,
      fontSize: "13@ms0.01",
      fontWeight: "600",
    },
    divider: {
      height: "1@ms0.01",
      backgroundColor: colors.cardBorderColor,
      opacity: 0.6,
    },
  });
