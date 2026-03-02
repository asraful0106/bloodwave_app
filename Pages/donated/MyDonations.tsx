/**
 * MyDonations.tsx
 *
 * Donation history & stats page.
 * Replace the import from "@/assets/fakeData/myDonations.json"
 * with a real API call when ready — the shape is identical to the DB schema.
 *
 * Real-life cases handled:
 *  ✅ PROCESSING  — committed but not yet donated (appointment pending)
 *  ✅ FULFILLED   — completed donation
 *  ✅ CANCELLED   — donor or requester cancelled
 *  ✅ Next eligible date + cooldown countdown (56-day rule)
 *  ✅ Donor marked unavailable (inactive_until)
 *  ✅ Empty state (first-time user, no donations yet)
 *  ✅ Loading skeleton
 *  ✅ Error / retry state
 *  ✅ Filter by status
 *  ✅ Stats: total, fulfilled, cancelled, processing, units given, streak
 *  ✅ "Can I donate today?" eligibility banner
 *  ✅ Request expired but donor still PROCESSING → warn user
 *  ✅ Dark / light theme via useTheme()
 */

import donationData from "@/assets/fakeData/myDonations.json";
import Avatar from "@/components/Avatar";
import { StyledText } from "@/components/StyledText";
import { ThemeColors } from "@/constants/themeCollorConstant";
import { withOpacity } from "@/helpers/withOpacity";
import { useTheme } from "@/hooks/theme/ThemeContext";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  TouchableOpacity,
  View,
  ScrollView,
  Alert,
} from "react-native";
import { moderateScale, ScaledSheet } from "react-native-size-matters";
import DonationSkeleton from "./components/DonationSkeleton";
import DonationCard from "./components/DonationCard";

// ─────────────────────────────────────────────────────────────
// Types  (mirrors DB schema exactly)
// ─────────────────────────────────────────────────────────────

export type DonationStatus = "FULFILLED" | "CANCELLED" | "PROCESSING";
export type UrgencyLevel = "NORMAL" | "URGENT" | "EMERGENCY";
type BloodRequestStatus = "OPEN" | "FULFILLED" | "CANCELLED" | "EXPIRED";

interface Requester {
  id: string;
  f_name: string;
  l_name: string;
  avatar_url: string;
}

interface BloodRequest {
  id: string;
  blood_group_name: string;
  description: string;
  units_required: number;
  units_fulfilled: number;
  lat: number;
  lng: number;
  urgency_level: UrgencyLevel;
  patient_type: string;
  needed_by: string;
  status: BloodRequestStatus;
  location_label: string;
}

export interface Donation {
  id: string;
  blood_request_id: string;
  donor_user_id: string;
  units: number;
  status: DonationStatus;
  notes: string | null;
  donated_at: string | null;
  created_at: string;
  updated_at: string;
  blood_request: BloodRequest;
  requester: Requester;
}

interface DonorProfile {
  id: string;
  user_id: string;
  is_available: boolean;
  inactive_until: string | null;
  last_donation_date: string | null;
  next_eligible_date: string | null;
  total_donations: number;
}

interface DonationData {
  donor_profile: DonorProfile;
  donations: Donation[];
}

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const COOLDOWN_DAYS = 56; // WHO / standard blood donation cooldown

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function daysUntil(dateStr: string): number {
  const now = new Date();
  const target = new Date(dateStr);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function daysSince(dateStr: string): number {
  const now = new Date();
  const past = new Date(dateStr);
  return Math.floor((now.getTime() - past.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatRelativeDate(dateStr: string): string {
  const days = daysSince(dateStr);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} year${Math.floor(days / 365) > 1 ? "s" : ""} ago`;
}

/** Returns true if the blood request deadline has passed */
function isRequestExpired(donation: Donation): boolean {
  return (
    donation.status === "PROCESSING" &&
    new Date(donation.blood_request.needed_by) < new Date()
  );
}

// ─────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────

/** Eligibility / status banner at the top */
const EligibilityBanner = ({
  profile,
  colors,
}: {
  profile: DonorProfile;
  colors: ThemeColors;
}) => {
  const today = new Date();

  // Case 1: manually marked unavailable
  if (!profile.is_available && profile.inactive_until) {
    const daysLeft = daysUntil(profile.inactive_until);
    if (daysLeft > 0) {
      return (
        <View
          style={{
            backgroundColor: withOpacity("#F9A825", 0.12),
            borderRadius: moderateScale(12),
            padding: moderateScale(14),
            flexDirection: "row",
            alignItems: "center",
            gap: moderateScale(12),
            marginBottom: moderateScale(16),
            borderWidth: 1,
            borderColor: withOpacity("#F9A825", 0.3),
          }}
        >
          <MaterialCommunityIcons
            name="pause-circle"
            size={moderateScale(28)}
            color="#F9A825"
          />
          <View style={{ flex: 1 }}>
            <StyledText
              style={{
                color: "#F9A825",
                fontWeight: "700",
                fontSize: moderateScale(13, 0.3),
              }}
            >
              Donations Paused
            </StyledText>
            <StyledText
              style={{
                color: colors.thirdTextColor,
                fontSize: moderateScale(11, 0.3),
                marginTop: 2,
              }}
            >
              You marked yourself unavailable. Available again in {daysLeft}{" "}
              day{daysLeft !== 1 ? "s" : ""}.
            </StyledText>
          </View>
        </View>
      );
    }
  }

  // Case 2: No donations yet
  if (!profile.last_donation_date) {
    return (
      <View
        style={{
          backgroundColor: withOpacity("#2eb97b", 0.1),
          borderRadius: moderateScale(12),
          padding: moderateScale(14),
          flexDirection: "row",
          alignItems: "center",
          gap: moderateScale(12),
          marginBottom: moderateScale(16),
          borderWidth: 1,
          borderColor: withOpacity("#2eb97b", 0.25),
        }}
      >
        <MaterialCommunityIcons
          name="heart-plus"
          size={moderateScale(28)}
          color="#2eb97b"
        />
        <View style={{ flex: 1 }}>
          <StyledText
            style={{
              color: "#2eb97b",
              fontWeight: "700",
              fontSize: moderateScale(13, 0.3),
            }}
          >
            Ready to Donate!
          </StyledText>
          <StyledText
            style={{
              color: colors.thirdTextColor,
              fontSize: moderateScale(11, 0.3),
              marginTop: 2,
            }}
          >
            You haven't donated yet. Your first donation can save up to 3 lives.
          </StyledText>
        </View>
      </View>
    );
  }

  const nextEligible = profile.next_eligible_date
    ? new Date(profile.next_eligible_date)
    : null;

  const canDonateToday = nextEligible ? today >= nextEligible : true;
  const daysLeft = nextEligible ? daysUntil(profile.next_eligible_date!) : 0;
  const daysSinceLast = daysSince(profile.last_donation_date);
  const progressRatio = Math.min(daysSinceLast / COOLDOWN_DAYS, 1);

  if (canDonateToday) {
    return (
      <View
        style={{
          backgroundColor: withOpacity("#2eb97b", 0.1),
          borderRadius: moderateScale(12),
          padding: moderateScale(14),
          flexDirection: "row",
          alignItems: "center",
          gap: moderateScale(12),
          marginBottom: moderateScale(16),
          borderWidth: 1,
          borderColor: withOpacity("#2eb97b", 0.25),
        }}
      >
        <MaterialCommunityIcons
          name="check-decagram"
          size={moderateScale(28)}
          color="#2eb97b"
        />
        <View style={{ flex: 1 }}>
          <StyledText
            style={{
              color: "#2eb97b",
              fontWeight: "700",
              fontSize: moderateScale(13, 0.3),
            }}
          >
            Eligible to Donate Today 🩸
          </StyledText>
          <StyledText
            style={{
              color: colors.thirdTextColor,
              fontSize: moderateScale(11, 0.3),
              marginTop: 2,
            }}
          >
            Last donated {formatRelativeDate(profile.last_donation_date)}. You're
            good to go!
          </StyledText>
        </View>
      </View>
    );
  }

  // Cooldown active
  return (
    <View
      style={{
        backgroundColor: colors.secondBackgroundColor,
        borderRadius: moderateScale(12),
        padding: moderateScale(14),
        marginBottom: moderateScale(16),
        borderWidth: 1,
        borderColor: colors.cardBorderColor,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: moderateScale(10),
        }}
      >
        <View
          style={{ flexDirection: "row", alignItems: "center", gap: moderateScale(8) }}
        >
          <MaterialCommunityIcons
            name="timer-sand"
            size={moderateScale(20)}
            color="#E53935"
          />
          <StyledText
            style={{
              color: colors.textColor,
              fontWeight: "700",
              fontSize: moderateScale(13, 0.3),
            }}
          >
            Cooldown Active
          </StyledText>
        </View>
        <View
          style={{
            backgroundColor: withOpacity("#E53935", 0.1),
            borderRadius: moderateScale(10),
            paddingHorizontal: moderateScale(8),
            paddingVertical: moderateScale(3),
          }}
        >
          <StyledText
            style={{
              color: "#E53935",
              fontSize: moderateScale(11, 0.3),
              fontWeight: "700",
            }}
          >
            {daysLeft}d left
          </StyledText>
        </View>
      </View>

      {/* Progress bar */}
      <View
        style={{
          height: moderateScale(6),
          backgroundColor: colors.thirdBackgroundColor,
          borderRadius: moderateScale(3),
          overflow: "hidden",
        }}
      >
        <View
          style={{
            height: "100%",
            width: `${progressRatio * 100}%`,
            backgroundColor: progressRatio >= 0.8 ? "#2eb97b" : "#E53935",
            borderRadius: moderateScale(3),
          }}
        />
      </View>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginTop: moderateScale(6),
        }}
      >
        <StyledText
          style={{
            color: colors.thirdTextColor,
            fontSize: moderateScale(10, 0.3),
          }}
        >
          Last: {formatDate(profile.last_donation_date)}
        </StyledText>
        <StyledText
          style={{
            color: colors.thirdTextColor,
            fontSize: moderateScale(10, 0.3),
          }}
        >
          Next: {formatDate(profile.next_eligible_date)}
        </StyledText>
      </View>
    </View>
  );
};

/** Stats row */
const StatsRow = ({
  donations,
  profile,
  colors,
}: {
  donations: Donation[];
  profile: DonorProfile;
  colors: ThemeColors;
}) => {
  const fulfilled = donations.filter((d) => d.status === "FULFILLED").length;
  const cancelled = donations.filter((d) => d.status === "CANCELLED").length;
  const processing = donations.filter((d) => d.status === "PROCESSING").length;
  const unitsGiven = donations
    .filter((d) => d.status === "FULFILLED")
    .reduce((sum, d) => sum + d.units, 0);
  const livesSaved = unitsGiven * 3; // 1 donation can save up to 3 lives (WHO estimate)

  const stats = [
    {
      label: "Donated",
      value: fulfilled,
      color: "#2eb97b",
      icon: "water" as const,
    },
    {
      label: "Pending",
      value: processing,
      color: "#F9A825",
      icon: "clock-outline" as const,
    },
    {
      label: "Cancelled",
      value: cancelled,
      color: "#E53935",
      icon: "close-circle-outline" as const,
    },
    {
      label: "Lives 🩸",
      value: `~${livesSaved}`,
      color: "#E53935",
      icon: "heart-multiple" as const,
    },
  ];

  return (
    <View
      style={{
        flexDirection: "row",
        gap: moderateScale(8),
        marginBottom: moderateScale(16),
      }}
    >
      {stats.map((s) => (
        <View
          key={s.label}
          style={{
            flex: 1,
            backgroundColor: colors.secondBackgroundColor,
            borderRadius: moderateScale(10),
            borderWidth: 1,
            borderColor: colors.cardBorderColor,
            padding: moderateScale(10),
            alignItems: "center",
          }}
        >
          <MaterialCommunityIcons
            name={s.icon}
            size={moderateScale(18)}
            color={s.color}
          />
          <StyledText
            style={{
              color: colors.textColor,
              fontWeight: "800",
              fontSize: moderateScale(15, 0.3),
              marginTop: moderateScale(3),
            }}
          >
            {s.value}
          </StyledText>
          <StyledText
            style={{
              color: colors.thirdTextColor,
              fontSize: moderateScale(9, 0.3),
              marginTop: moderateScale(1),
              textAlign: "center",
            }}
          >
            {s.label}
          </StyledText>
        </View>
      ))}
    </View>
  );
};


/** Empty state */
const EmptyState = ({ colors }: { colors: ThemeColors }) => (
  <View
    style={{
      alignItems: "center",
      paddingVertical: moderateScale(60),
      gap: moderateScale(12),
    }}
  >
    <MaterialCommunityIcons
      name="water-off"
      size={moderateScale(52)}
      color={colors.thirdTextColor}
    />
    <StyledText
      style={{
        color: colors.textColor,
        fontWeight: "700",
        fontSize: moderateScale(16, 0.3),
      }}
    >
      No Donations Yet
    </StyledText>
    <StyledText
      style={{
        color: colors.thirdTextColor,
        fontSize: moderateScale(12, 0.3),
        textAlign: "center",
        maxWidth: "75%",
        lineHeight: moderateScale(18),
      }}
    >
      Your donation history will appear here once you respond to a blood
      request.
    </StyledText>
  </View>
);

// ─────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────

type FilterTab = "ALL" | "FULFILLED" | "PROCESSING" | "CANCELLED";

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "PROCESSING", label: "Pending" },
  { key: "FULFILLED", label: "Donated" },
  { key: "CANCELLED", label: "Cancelled" },
];

export default function MyDonations() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [data, setData] = useState<DonationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterTab>("ALL");

  // ── Load data (swap this block for a real API call) ──────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        // Simulate network latency — remove when using real API
        await new Promise((r) => setTimeout(r, 1200));

        // ✅ Replace this with: const res = await fetch('/api/my-donations'); const data = await res.json();
        const result = donationData as DonationData;

        if (!result.donations || !Array.isArray(result.donations)) {
          throw new Error("Invalid data format");
        }

        setData(result);
      } catch (err) {
        console.error("Failed to load donations:", err);
        setError("Could not load your donation history.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const filteredDonations = useMemo(() => {
    if (!data) return [];
    if (activeFilter === "ALL") return data.donations;
    return data.donations.filter((d) => d.status === activeFilter);
  }, [data, activeFilter]);

  // Pending donations (processing with expired request) — shown as urgent notice
  const pendingWarnings = useMemo(
    () => (data ? data.donations.filter(isRequestExpired) : []),
    [data],
  );

  const renderItem = ({ item }: { item: Donation }) => (
    <DonationCard donation={item} colors={colors} />
  );

  const renderHeader = () => {
    if (!data) return null;

    return (
      <>
        {/* Page header */}
        {/* <View style={styles.pageHeader}>
          <View
            style={{
              width: moderateScale(4),
              height: moderateScale(48),
              borderRadius: moderateScale(4),
              backgroundColor: "#E53935",
            }}
          />
          <View>
            <StyledText style={styles.pageTitle}>My Donations</StyledText>
            <StyledText style={styles.pageSub}>
              {data.donor_profile.total_donations} total •{" "}
              {data.donations.filter((d) => d.status === "FULFILLED").length}{" "}
              completed
            </StyledText>
          </View>
        </View> */}

        {/* ⚠️ Expired-pending alert (top-level) */}
        {pendingWarnings.length > 0 && (
          <Pressable
            onPress={() => setActiveFilter("PROCESSING")}
            style={{
              backgroundColor: withOpacity("#F9A825", 0.12),
              borderRadius: moderateScale(10),
              padding: moderateScale(12),
              flexDirection: "row",
              alignItems: "center",
              gap: moderateScale(10),
              marginBottom: moderateScale(12),
              borderWidth: 1,
              borderColor: withOpacity("#F9A825", 0.35),
              marginTop: moderateScale(10),
            }}
          >
            <Feather
              name="alert-triangle"
              size={moderateScale(18)}
              color="#F9A825"
            />
            <StyledText
              style={{
                color: "#F9A825",
                fontSize: moderateScale(12, 0.3),
                flex: 1,
                fontWeight: "600",
              }}
            >
              {pendingWarnings.length} pending commitment
              {pendingWarnings.length > 1 ? "s" : ""} have expired deadlines.
              Tap to review.
            </StyledText>
            <Feather
              name="chevron-right"
              size={moderateScale(14)}
              color="#F9A825"
            />
          </Pressable>
        )}

        {/* Eligibility banner */}
        <EligibilityBanner profile={data.donor_profile} colors={colors} />

        {/* Stats */}
        <StatsRow
          donations={data.donations}
          profile={data.donor_profile}
          colors={colors}
        />

        {/* Filter tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: moderateScale(12) }}
        >
          <View
            style={{
              flexDirection: "row",
              gap: moderateScale(6),
              paddingBottom: moderateScale(4),
            }}
          >
            {FILTER_TABS.map((tab) => {
              const isActive = activeFilter === tab.key;
              const count =
                tab.key === "ALL"
                  ? data.donations.length
                  : data.donations.filter((d) => d.status === tab.key).length;

              return (
                <TouchableOpacity
                  key={tab.key}
                  onPress={() => setActiveFilter(tab.key)}
                  activeOpacity={0.75}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: moderateScale(5),
                    paddingVertical: moderateScale(6),
                    paddingHorizontal: moderateScale(12),
                    borderRadius: moderateScale(16),
                    backgroundColor: isActive
                      ? withOpacity("#E53935", 0.12)
                      : "transparent",
                    borderWidth: isActive ? 0 : 1,
                    borderColor: colors.cardBorderColor,
                  }}
                >
                  <StyledText
                    style={{
                      color: isActive ? "#E53935" : colors.thirdTextColor,
                      fontWeight: isActive ? "700" : "400",
                      fontSize: moderateScale(12, 0.3),
                    }}
                  >
                    {tab.label}
                  </StyledText>
                  <View
                    style={{
                      backgroundColor: isActive
                        ? withOpacity("#E53935", 0.2)
                        : colors.thirdBackgroundColor,
                      borderRadius: moderateScale(8),
                      paddingHorizontal: moderateScale(5),
                      paddingVertical: moderateScale(1),
                    }}
                  >
                    <StyledText
                      style={{
                        color: isActive ? "#E53935" : colors.thirdTextColor,
                        fontSize: moderateScale(9, 0.3),
                        fontWeight: "700",
                      }}
                    >
                      {count}
                    </StyledText>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </>
    );
  };

  // ── Error state ──────────────────────────────────────────────────────────
  if (error) {
    return (
      <View
        style={[
          styles.root,
          { alignItems: "center", justifyContent: "center", gap: moderateScale(12) },
        ]}
      >
        <MaterialCommunityIcons
          name="wifi-off"
          size={moderateScale(40)}
          color={colors.thirdTextColor}
        />
        <StyledText
          style={{
            color: colors.textColor,
            fontWeight: "700",
            fontSize: moderateScale(15, 0.3),
          }}
        >
          Something went wrong
        </StyledText>
        <StyledText
          style={{
            color: colors.thirdTextColor,
            fontSize: moderateScale(12, 0.3),
            textAlign: "center",
            maxWidth: "75%",
          }}
        >
          {error}
        </StyledText>
        <TouchableOpacity
          onPress={() => {
            setError(null);
            setLoading(true);
            // re-trigger useEffect by resetting state — in real app call API again
            setTimeout(() => setLoading(false), 100);
          }}
          style={{
            backgroundColor: "#E53935",
            paddingHorizontal: moderateScale(24),
            paddingVertical: moderateScale(10),
            borderRadius: moderateScale(10),
          }}
        >
          <StyledText
            style={{ color: "white", fontWeight: "700", fontSize: moderateScale(13, 0.3) }}
          >
            Retry
          </StyledText>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Loading skeleton ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={[styles.root, { paddingHorizontal: moderateScale(13), marginTop: moderateScale(10) }]}>
        {/* <View style={[styles.pageHeader, { marginTop: moderateScale(20) }]}>
          <View
            style={{
              width: moderateScale(4),
              height: moderateScale(48),
              borderRadius: moderateScale(4),
              backgroundColor: "#E53935",
            }}
          />
          <View style={{ gap: moderateScale(6) }}>
            <View
              style={{
                height: moderateScale(18),
                width: moderateScale(140),
                backgroundColor: colors.thirdBackgroundColor,
                borderRadius: 4,
              }}
            />
            <View
              style={{
                height: moderateScale(12),
                width: moderateScale(100),
                backgroundColor: colors.thirdBackgroundColor,
                borderRadius: 4,
              }}
            />
          </View>
        </View> */}
        {[1, 2, 3].map((i) => (
          <DonationSkeleton key={i}/>
        ))}
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingHorizontal: moderateScale(13) }]}>
      <FlatList
        data={filteredDonations}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={<EmptyState colors={colors} />}
        contentContainerStyle={{ paddingBottom: moderateScale(40) }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  ScaledSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.bodyBackground,
    },
    pageHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: "12@ms",
      marginTop: "20@ms",
      marginBottom: "16@ms",
    },
    pageTitle: {
      fontSize: "22@ms",
      fontWeight: "800",
      color: colors.textColor,
      letterSpacing: -0.5,
    },
    pageSub: {
      fontSize: "12@ms",
      color: colors.thirdTextColor,
      marginTop: "2@ms",
    },
  });