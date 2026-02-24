import { ThemeColors } from "@/constants/themeCollorConstant";
import { useTheme } from "@/hooks/theme/ThemeContext";
import Entypo from "@expo/vector-icons/Entypo";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { PlatformPressable } from "@react-navigation/elements";
import { useLinkBuilder } from "@react-navigation/native";
import { useMemo } from "react";
import { View } from "react-native";
import { moderateScale, ScaledSheet } from "react-native-size-matters";
import { StyledText } from "./StyledText";
// import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FontAwesome, MaterialCommunityIcons } from "@expo/vector-icons";

export function BottomNavigationTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  // To handle bottom Phone ui backbutton
  const insets = useSafeAreaInsets();
  const botomMargin = insets.bottom > 17 ? insets.bottom : 0;
  // console.log(botomMargin);
  const icons = {
    index: (props: any) => (
      <Entypo name="home" size={moderateScale(25, 0.3)} {...props} />
    ),
    donated: (props: any) => (
      <MaterialCommunityIcons
        name="blood-bag"
        size={moderateScale(25, 0.3)}
        {...props}
      />
    ),
    profile: (props: any) => (
      <FontAwesome
        name="user-circle-o"
        size={moderateScale(25, 0.3)}
        {...props}
      />
    ),
  };
  const { colors } = useTheme();
  const { buildHref } = useLinkBuilder();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View
      style={[
        styles.container,
        { flexDirection: "row", marginBottom: botomMargin },
      ]}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
              ? options.title
              : route.name;

        const isFocused = state.index === index;
        const Icon = icons[route.name as keyof typeof icons];

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          // ********
          // if (event.defaultPrevented) return;
          // // ✅ special behavior for Add
          // if (route.name === "addTab") {
          //   router.push("/add");
          //   return;
          // }
          // *************

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: "tabLongPress",
            target: route.key,
          });
        };

        return (
          <PlatformPressable
            key={route.name}
            href={
              route.name === "add"
                ? "/add"
                : buildHref(route.name, route.params)
            }
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarButtonTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={[styles.innerContainer, { flex: 1 }]}
          >
            <Icon
              color={
                isFocused
                  ? colors.bottomNavigationColor
                  : colors.bottomNavigationInActiveColor
              }
            />
            <StyledText
              style={[
                styles.label,
                {
                  color: isFocused
                    ? colors.bottomNavigationColor
                    : colors.bottomNavigationInActiveColor,
                },
              ]}
            >
              {typeof label === "function"
                ? label({
                    focused: isFocused,
                    color: isFocused
                      ? colors.bottomNavigationColor
                      : colors.textColor,
                    position: "below-icon",
                    children: route.name,
                  })
                : label}
            </StyledText>
          </PlatformPressable>
        );
      })}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  ScaledSheet.create({
    container: {
      height: "60@ms",
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: "5@ms",
      backgroundColor: colors.bodyBackground,
    },
    innerContainer: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      //   justifyContent: "center",
      gap: "2@ms",
    },
    label: {
      fontSize: "10@ms0.3",
    },
  });
