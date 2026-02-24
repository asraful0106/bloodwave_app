import { ThemeColors } from "@/constants/themeCollorConstant";
import { useTheme } from "@/hooks/theme/ThemeContext";
import AntDesign from "@expo/vector-icons/AntDesign";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { TouchableOpacity, View } from "react-native";
import { moderateScale, ScaledSheet } from "react-native-size-matters";
import { StyledText } from "./StyledText";

// interface titleBarPaylod {
//   title: string;
// }

// export default function CustomTitleBar({ title }: titleBarPaylod) {
export default function CustomTitleBar() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <StyledText style={styles.title}>BloodWave</StyledText>
      <View
        style={{ display: "flex", flexDirection: "row", alignItems: "center" }}
      >
        {/* <TouchableOpacity
          onPress={() => router.push("/(other_page)/(history)/user")}
        >
          <View style={{ marginRight: moderateScale(10) }}>
            <Avatar size={moderateScale(30)} />
          </View>
        </TouchableOpacity> */}
        <TouchableOpacity onPress={() => router.push("/setting")}>
          <AntDesign
            name="align-right"
            size={moderateScale(24)}
            color={colors.textColor}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  ScaledSheet.create({
    container: {
      paddingTop: "1@ms",
    //   height: "40@ms",
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: "15@ms",
      backgroundColor: colors.bodyBackground, // or colors.bodyBackground
    },
    title: {
      color: colors.textColor,
      fontSize: "20@ms0.3",
      fontWeight: "bold",
    },
  });
