// @/src/pages/setting/components/LanguagePillToggle.tsx

import React, { useRef } from "react";
import { Animated, Image, TouchableOpacity, View } from "react-native";
import { moderateScale } from "react-native-size-matters";
import { StyledText } from "@/components/StyledText";
import { LanguageCode, LanguageCodes } from "@/constants/languages";
import { ThemeColors } from "@/constants/themeCollorConstant";

// ── Supported languages (extend here if more are added) ──────────────────────
const SUPPORTED_LANGUAGES: Array<{
  code: LanguageCode;
  label: string;
  shortLabel: string;
  flag: any;
}> = [
  {
    code: LanguageCodes.en,
    label: "English",
    shortLabel: "EN",
    flag: require("@/assets/languageLogo/english.png"),
  },
  {
    code: LanguageCodes.bn,
    label: "বাংলা",
    shortLabel: "BN",
    flag: require("@/assets/languageLogo/bangla.png"),
  },
];

type Props = {
  value: LanguageCode;
  onChange: (v: LanguageCode) => void;
  colors: ThemeColors;
};

export function LanguagePillToggle({ value, onChange, colors }: Props) {
  const activeIndex = SUPPORTED_LANGUAGES.findIndex((l) => l.code === value);
  const safeIndex = activeIndex === -1 ? 0 : activeIndex;

  const pillTranslate = useRef(
    new Animated.Value(safeIndex * moderateScale(80)),
  ).current;

  const handleSelect = (index: number) => {
    Animated.spring(pillTranslate, {
      toValue: index * moderateScale(80),
      useNativeDriver: true,
      tension: 90,
      friction: 9,
    }).start();
    onChange(SUPPORTED_LANGUAGES[index].code);
  };

  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: colors.bodyBackground,
        borderRadius: moderateScale(10),
        padding: moderateScale(3),
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Sliding active pill */}
      <Animated.View
        style={{
          position: "absolute",
          top: moderateScale(3),
          left: moderateScale(3),
          width: moderateScale(77),
          height: moderateScale(34),
          borderRadius: moderateScale(8),
          backgroundColor: colors.activeButton.primary.bg,
          shadowColor: colors.activeButton.primary.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.18,
          shadowRadius: 4,
          elevation: 3,
          transform: [{ translateX: pillTranslate }],
        }}
      />

      {/* Language options */}
      {SUPPORTED_LANGUAGES.map((lang, index) => {
        const isActive =
          activeIndex === index || (activeIndex === -1 && index === 0);
        return (
          <TouchableOpacity
            key={lang.code}
            onPress={() => handleSelect(index)}
            activeOpacity={0.7}
            style={{
              width: moderateScale(77),
              height: moderateScale(34),
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: moderateScale(5),
              zIndex: 1,
            }}
          >
            <Image
              source={lang.flag}
              style={{
                width: moderateScale(18),
                height: moderateScale(13),
                borderRadius: moderateScale(2),
              }}
              resizeMode="cover"
            />
            <StyledText
              style={{
                fontSize: moderateScale(12, 0.3),
                fontWeight: isActive ? "700" : "500",
                color: isActive ? colors.activeButton.primary.text : colors.textColor,
              }}
            >
              {lang.shortLabel}
            </StyledText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
