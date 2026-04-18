import SafeScreen from "@/components/SafeScreen";
import { StyledText } from "@/components/StyledText";
import { ThemeColors } from "@/constants/themeCollorConstant";
import { useTheme } from "@/hooks/theme/ThemeContext";
import Settings from "@/Pages/settings/Setting";
import Entypo from "@expo/vector-icons/Entypo";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, TouchableOpacity, View } from "react-native";
import { moderateScale, ScaledSheet } from "react-native-size-matters";

export default function setting() {
  const router = useRouter();
  const { colors, config } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { t } = useTranslation();
  const close = () => {
    if (router.canGoBack()) router.dismiss();
    else router.replace("/(tab)");
  };
  return (
    //add.tsx as route
    <>
      <SafeScreen>
        <View style={styles.container}>
          {/* Title Bar */}
          <View style={styles.titleBarLeftContainer}>
            <TouchableOpacity onPress={close}>
              <Entypo
                name="cross"
                size={moderateScale(24)}
                color={colors.textColor}
              />
            </TouchableOpacity>
            {/* <StyledText style={styles.title}>{t("new_title")}</StyledText> */}
          </View>
          {/* Other Item */}
        </View>
        <ScrollView>
          <Settings />
        </ScrollView>
      </SafeScreen>
    </>
  );
}

const createStyles = (colors: ThemeColors) =>
  ScaledSheet.create({
    container: {
      paddingTop: "1@ms",
      height: "40@ms",
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: "10@ms",
      backgroundColor: colors.bodyBackground,
    },
    title: {
      color: colors.textColor,
      fontSize: "16@ms0.3",
      fontWeight: "bold",
    },
    titleBarLeftContainer: {
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      gap: "2@ms",
    },
  });
