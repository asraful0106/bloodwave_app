// @/Pages/home/Home.tsx
import Avatar from "@/components/Avatar";
import { StyledText } from "@/components/StyledText";
import { ThemeColors } from "@/constants/themeCollorConstant";
import { useTheme } from "@/hooks/theme/ThemeContext";
import { withOpacity } from "@/helpers/withOpacity";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import { moderateScale, ScaledSheet } from "react-native-size-matters";
import BloodRequestCard from "./components/BloodRequestCard";
import { useRouter } from "expo-router";
import { PlatformPressable } from "@react-navigation/elements";
import { useState } from "react";
import { BloodRequest, useBloodRequest } from "@/context/BloodReqContext";
import { useAuth } from "@/context/AuthContext";
import { User } from "../profile/Profile";
import apiClient from "@/config/client";
import { envVars } from "@/config/envVars";

// ─── Skeleton card ────────────────────────────────────────────────────────────

function SkeletonCard() {
  const { colors } = useTheme();
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [shimmer]);

  const opacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0.7],
  });

  const bg = colors.thirdBackgroundColor ?? "#2a2a3a";

  return (
    <Animated.View
      style={{
        opacity,
        backgroundColor: bg,
        borderRadius: moderateScale(12),
        padding: moderateScale(14),
        marginBottom: moderateScale(10),
        gap: moderateScale(10),
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: moderateScale(10),
        }}
      >
        <View
          style={{
            width: moderateScale(36),
            height: moderateScale(36),
            borderRadius: moderateScale(18),
            backgroundColor: colors.secondaryTextColor + "44",
          }}
        />
        <View style={{ gap: moderateScale(6), flex: 1 }}>
          <View
            style={{
              height: moderateScale(11),
              width: "55%",
              borderRadius: 4,
              backgroundColor: colors.secondaryTextColor + "44",
            }}
          />
          <View
            style={{
              height: moderateScale(10),
              width: "35%",
              borderRadius: 4,
              backgroundColor: colors.secondaryTextColor + "33",
            }}
          />
        </View>
        <View
          style={{
            width: moderateScale(36),
            height: moderateScale(36),
            borderRadius: moderateScale(8),
            backgroundColor: colors.secondaryTextColor + "33",
          }}
        />
      </View>
      {[80, 60, 45].map((w, i) => (
        <View
          key={i}
          style={{
            height: moderateScale(10),
            width: `${w}%`,
            borderRadius: 4,
            backgroundColor: colors.secondaryTextColor + "33",
          }}
        />
      ))}
    </Animated.View>
  );
}

// ─── Error state ──────────────────────────────────────────────────────────────

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  const { colors } = useTheme();
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.15,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [pulse]);

  return (
    <View
      style={{
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: moderateScale(60),
        gap: moderateScale(14),
      }}
    >
      <Animated.View style={{ transform: [{ scale: pulse }] }}>
        <MaterialCommunityIcons
          name="heart-broken"
          size={moderateScale(52)}
          color="#e53935"
        />
      </Animated.View>
      <StyledText
        style={{
          color: colors.textColor,
          fontSize: moderateScale(14),
          fontWeight: "600",
        }}
      >
        Oops! Something went wrong
      </StyledText>
      <StyledText
        style={{
          color: colors.secondaryTextColor,
          fontSize: moderateScale(12),
          textAlign: "center",
          paddingHorizontal: moderateScale(30),
        }}
      >
        {message}
      </StyledText>
      <TouchableOpacity
        onPress={onRetry}
        activeOpacity={0.8}
        style={{
          backgroundColor: "#e53935",
          paddingHorizontal: moderateScale(28),
          paddingVertical: moderateScale(10),
          borderRadius: moderateScale(20),
          marginTop: moderateScale(4),
        }}
      >
        <StyledText
          style={{
            color: "#fff",
            fontSize: moderateScale(13),
            fontWeight: "700",
          }}
        >
          Try Again
        </StyledText>
      </TouchableOpacity>
    </View>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ filter }: { filter: string }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        alignItems: "center",
        paddingVertical: moderateScale(50),
        gap: moderateScale(10),
      }}
    >
      <MaterialCommunityIcons
        name="blood-bag"
        size={moderateScale(48)}
        color={colors.secondaryTextColor}
      />
      <StyledText
        style={{
          color: colors.secondaryTextColor,
          fontSize: moderateScale(13),
          textAlign: "center",
        }}
      >
        {filter === "All"
          ? "No blood requests at the moment."
          : `No requests found for blood group ${filter}.`}
      </StyledText>
    </View>
  );
}

// ─── Home ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  // ── Load profile ────────────────────────────────────────────────────────────
  const { userData } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [userLoading, setUserLoading] = useState<boolean>(false);
  const loadProfile = useCallback(async () => {
    try {
      setUserLoading(true);
      const { data } = await apiClient.get("/users/me", {
        headers: {
          accessToken: userData.accessToken,
        },
      });
      setUser(data.data);
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Could not load your profile.";
      console.log("loadProfile: ", err);
    } finally {
      setUserLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // console.log("User: ", user);

  const { requests, loading, error, fetchAllRequests } = useBloodRequest();

  const pendingRequests = requests.filter(
    (item) => item.blood_request_status === "pending",
  );

  const [selectedFilter, setSelectedFilter] = useState("All");

  // Initial fetch on mount
  useEffect(() => {
    fetchAllRequests();
  }, [fetchAllRequests]);

  // Client-side filter keyed on blood_group_name from the actual model
  const filteredRequests = useMemo<BloodRequest[]>(() => {
    if (selectedFilter === "All") return pendingRequests;
    return pendingRequests.filter((r) => r.blood_group_name === selectedFilter);
  }, [pendingRequests, selectedFilter]);

  const isLoading = loading.fetchAll;
  const serverError = error.server;

  const renderItem = useCallback(
    ({ item }: { item: BloodRequest }) => <BloodRequestCard request={item} />,
    [],
  );

  const keyExtractor = useCallback((item: BloodRequest) => item._id, []);

  // ── Body content ───────────────────────────────────────────────────────────
  const renderBody = () => {
    if (isLoading) {
      return (
        <View style={{ marginTop: moderateScale(10) }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </View>
      );
    }

    if (serverError) {
      return <ErrorState message={serverError} onRetry={fetchAllRequests} />;
    }

    return (
      <FlatList
        data={filteredRequests}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        style={{ marginBottom: moderateScale(20) }}
        scrollEnabled={false} // outer ScrollView handles scrolling
        ListEmptyComponent={<EmptyState filter={selectedFilter} />}
      />
    );
  };

return (
  <ScrollView
    style={{ paddingHorizontal: moderateScale(13) }}
    showsVerticalScrollIndicator={false}
    keyboardShouldPersistTaps="handled"
  >
    {userLoading ? (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.bodyBackground,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator size="large" color="#E53935" />

        <StyledText
          style={{
            color: colors.thirdTextColor,
            marginTop: moderateScale(12),
            fontSize: moderateScale(13, 0.3),
          }}
        >
          Loading your profile…
        </StyledText>
      </View>
    ) : (
      <>
        <HeadPart
          selectedFilter={selectedFilter}
          onFilterChange={setSelectedFilter}
          disabled={isLoading || !!serverError}
          user={user}
        />

        {renderBody()}
      </>
    )}
  </ScrollView>
);
}

const createStyles = (colors: ThemeColors) =>
  ScaledSheet.create({
    listContent: {
      paddingBottom: moderateScale(80),
    },
  });

// ─── HeadPart ─────────────────────────────────────────────────────────────────

interface HeadPartProps {
  selectedFilter: string;
  onFilterChange: (filter: string) => void;
  disabled?: boolean;
  user: User | null;
}

const HeadPart = ({
  selectedFilter,
  onFilterChange,
  disabled,
  user,
}: HeadPartProps) => {
  const router = useRouter();
  const { colors } = useTheme();
  const filters = ["All", "O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];

  return (
    <>
      {/* Header row */}
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
          <Avatar
            size={moderateScale(35)}
            imageUrl={`${user?.user_image ? `${envVars.BASE_URL}/image${user.user_image.link}` : ""}`}
          />
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
            router.push({ pathname: "/(othersPage)/requestBlood" })
          }
        >
          <MaterialCommunityIcons
            name="heart-plus"
            size={moderateScale(24)}
            color={colors.secondaryColor}
          />
        </PlatformPressable>
      </View>

      {/* Filter chips */}
      <View style={{ marginTop: moderateScale(10) }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: moderateScale(5),
            }}
          >
            {filters.map((filter) => {
              const isSelected = filter === selectedFilter;
              return (
                <TouchableOpacity
                  key={filter}
                  activeOpacity={0.7}
                  disabled={disabled}
                  onPress={() => onFilterChange(filter)}
                  style={{
                    paddingVertical: moderateScale(4),
                    paddingHorizontal: moderateScale(12),
                    backgroundColor: isSelected
                      ? withOpacity("#e53935", 0.15)
                      : "transparent",
                    borderWidth: isSelected ? 0 : moderateScale(1),
                    borderColor: colors.cardBorderColor,
                    borderRadius: moderateScale(16),
                    opacity: disabled ? 0.5 : 1,
                  }}
                >
                  <StyledText
                    style={{
                      color: isSelected ? "#e53935" : colors.secondaryTextColor,
                      fontWeight: isSelected ? "700" : "400",
                      fontSize: moderateScale(12),
                    }}
                  >
                    {filter}
                  </StyledText>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* Spacer */}
      <View style={{ marginTop: moderateScale(10) }} />
    </>
  );
};
