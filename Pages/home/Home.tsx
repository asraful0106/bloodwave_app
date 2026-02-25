import { View, Text } from "react-native";
import React, { useMemo } from "react";
import { moderateScale, ScaledSheet } from "react-native-size-matters";
import Avatar from "@/components/Avatar";
import { StyledText } from "@/components/StyledText";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/theme/ThemeContext";
import { useTranslation } from "react-i18next";
import { ThemeColors } from "@/constants/themeCollorConstant";

export default function Home() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={{ paddingHorizontal: moderateScale(13) }}>
      <View
        style={{
          marginTop: moderateScale(20),
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: moderateScale(10),
          }}
        >
          <Avatar size={moderateScale(35)} />
          <StyledText
            style={{
              fontWeight: "medium",
              fontSize: moderateScale(16, 0.3),
              color: colors.thirdTextColor,
            }}
          >
            Community Blood Request...
          </StyledText>
        </View>
        <MaterialCommunityIcons
          name="heart-plus"
          size={moderateScale(24)}
          color={colors.secondaryColor}
        />
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => ScaledSheet.create({});
