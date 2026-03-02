import { View, Text } from 'react-native'
import React from 'react'
import { moderateScale } from 'react-native-size-matters'
import { useTheme } from '@/hooks/theme/ThemeContext';
import { useTranslation } from 'react-i18next';

export default function DonationSkeleton() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  return (
    <View
    style={{
      backgroundColor: colors.secondBackgroundColor,
      borderRadius: moderateScale(12),
      borderWidth: 1,
      borderColor: colors.cardBorderColor,
      marginBottom: moderateScale(10),
      padding: moderateScale(14),
      gap: moderateScale(10),
    }}
  >
    <View style={{ flexDirection: "row", gap: moderateScale(10) }}>
      <View
        style={{
          width: moderateScale(36),
          height: moderateScale(36),
          borderRadius: moderateScale(18),
          backgroundColor: colors.thirdBackgroundColor,
        }}
      />
      <View style={{ gap: moderateScale(6), flex: 1 }}>
        <View
          style={{
            height: moderateScale(12),
            width: "55%",
            backgroundColor: colors.thirdBackgroundColor,
            borderRadius: 4,
          }}
        />
        <View
          style={{
            height: moderateScale(10),
            width: "35%",
            backgroundColor: colors.thirdBackgroundColor,
            borderRadius: 4,
          }}
        />
      </View>
    </View>
    <View
      style={{
        height: moderateScale(10),
        backgroundColor: colors.thirdBackgroundColor,
        borderRadius: 4,
        width: "90%",
      }}
    />
    <View
      style={{
        height: moderateScale(10),
        backgroundColor: colors.thirdBackgroundColor,
        borderRadius: 4,
        width: "70%",
      }}
    />
  </View>
  )
}