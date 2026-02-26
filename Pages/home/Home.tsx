import bloodRequestsData from "@/assets/fakeData/bloodRequest.json";
import Avatar from "@/components/Avatar";
import { StyledText } from "@/components/StyledText";
import { ThemeColors } from "@/constants/themeCollorConstant";
import { useTheme } from "@/hooks/theme/ThemeContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, FlatList, View } from "react-native";
import { moderateScale, ScaledSheet } from "react-native-size-matters";
import BloodRequestCard from "./components/BloodRequestCard";

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

        // Simulate network delay (remove this block when using real API)
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Load from local JSON asset
        // In real app → replace with fetch('/api/requests') or axios.get(...)
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

  const renderItem = ({ item }: { item: typeof bloodRequestsData[number] }) => (
    <BloodRequestCard
      request={item}
    />
  );
  return (
    <View style={{ paddingHorizontal: moderateScale(13) }}>
      {/* Request Blood */}
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
      {/* Blood Requests */}
      <View style={{ marginTop: moderateScale(10) }} />
      <FlatList
        data={requests}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        style={{ marginBottom: moderateScale(90) }}
        // ListEmptyComponent={
        //   <StyledText style={styles.emptyText}>
        //     No blood requests found
        //   </StyledText>
        // }
      />
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  ScaledSheet.create({
    listContent: {
    },
    emptyText: {
      textAlign: "center",
      fontSize: 16,
      color: "#777",
      marginTop: 40,
    },
  });
