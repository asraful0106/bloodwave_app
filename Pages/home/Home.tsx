import bloodRequestsData from "@/assets/fakeData/bloodRequest.json";
import Avatar from "@/components/Avatar";
import { StyledText } from "@/components/StyledText";
import { ThemeColors } from "@/constants/themeCollorConstant";
import { useTheme } from "@/hooks/theme/ThemeContext";
import { withOpacity } from "@/helpers/withOpacity";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, FlatList, ScrollView, View } from "react-native";
import { moderateScale, ScaledSheet } from "react-native-size-matters";
import BloodRequestCard from "./components/BloodRequestCard";
import { useRouter } from "expo-router";
import { PlatformPressable } from "@react-navigation/elements";

export default function Home() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [requests, setRequests] = useState<typeof bloodRequestsData>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<null | string>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        await new Promise((resolve) => setTimeout(resolve, 2000));

        const data = bloodRequestsData;

        if (!Array.isArray(data)) {
          throw new Error("Invalid data format");
        }

        setRequests(data);
      } catch (err) {
        console.error("Failed to load blood requests:", err);
        setError("Failed to load blood requests. Please try again.");
        Alert.alert("Error", "Could not load blood requests");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const renderItem = ({
    item,
  }: {
    item: (typeof bloodRequestsData)[number];
  }) => <BloodRequestCard request={item} />;

  return (
    <View style={{ paddingHorizontal: moderateScale(13) }}>
      <FlatList
        data={requests}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        style={{ marginBottom: moderateScale(20) }}
        ListHeaderComponent={<HeadPart />}
      />
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  ScaledSheet.create({
    listContent: {},
    emptyText: {
      textAlign: "center",
      fontSize: 16,
      color: "#777",
      marginTop: 40,
    },
  });

const HeadPart = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const [selectedFilter, setSelectedFilter] = useState("All");

  const filters = ["All", "O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];

  // ✅ FIXED: added return statement
  return (
    <>
      {/* Request Blood */}
      <View
        style={{
          marginTop: moderateScale(20),
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: moderateScale(10),
          }}
        >
          <Avatar size={moderateScale(35)} />
          <StyledText
            style={{
              fontWeight: "500",
              fontSize: moderateScale(16, 0.3),
              color: colors.thirdTextColor,
            }}
          >
            Community Blood Request...
          </StyledText>
        </View>
        <PlatformPressable
          onPress={() =>
            router.push({
              pathname: "/(othersPage)/requestBlood",
              // params: {
              //   debtId: data.id,
              // },
            })
          }
        >
          <MaterialCommunityIcons
            name="heart-plus"
            size={moderateScale(24)}
            color={colors.secondaryColor}
          />
        </PlatformPressable>
      </View>

      {/* Filter */}
      <View style={{ marginTop: moderateScale(10) }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: moderateScale(5),
            }}
          >
            {filters.map((filter, index) => {
              const isSelected = filter === selectedFilter;
              return (
                // ✅ BONUS: filter selection now works with state
                <View
                  key={index}
                  style={{
                    paddingVertical: moderateScale(4),
                    paddingHorizontal: moderateScale(12),
                    backgroundColor: isSelected
                      ? withOpacity("#e53935", 0.15)
                      : "transparent",
                    borderWidth: isSelected ? 0 : moderateScale(1),
                    borderColor: colors.cardBorderColor,
                    borderRadius: moderateScale(16),
                  }}
                >
                  <StyledText
                    style={{ color: "red" }}
                    onPress={() => setSelectedFilter(filter)}
                  >
                    {filter}
                  </StyledText>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* Spacer before list */}
      <View style={{ marginTop: moderateScale(10) }} />
    </>
  );
};
