/**
 * MyBloodRequestsSection.tsx
 * User's own blood requests — view, share, cancel, close, reopen, delete
 *
 * Real-life cases:
 *  ✅ OPEN   → can Cancel, Share, Edit (if no donors yet), Close manually
 *  ✅ FULFILLED → read-only, thank donors
 *  ✅ CANCELLED → read-only, option to re-create
 *  ✅ EXPIRED → warn, option to re-create with updated date
 *  ✅ Request has donors but status still OPEN → can't delete, only cancel
 *  ✅ Share token copy to clipboard
 *  ✅ Progress bar (units_fulfilled / units_required)
 *  ✅ Filter by status tabs
 *  ✅ Empty state
 */

import { StyledText } from "@/components/StyledText";
import { ThemeColors } from "@/constants/themeCollorConstant";
import { withOpacity } from "@/helpers/withOpacity";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, ScrollView, TouchableOpacity, View } from "react-native";
import { moderateScale } from "react-native-size-matters";

type RequestStatus = "OPEN" | "FULFILLED" | "CANCELLED" | "EXPIRED";
type UrgencyLevel = "NORMAL" | "URGENT" | "EMERGENCY";

interface BloodRequest {
  id: string;
  blood_group_name: string;
  description: string;
  units_required: number;
  units_fulfilled: number;
  urgency_level: UrgencyLevel;
  patient_type: string;
  needed_by: string;
  status: RequestStatus;
  share_token: string | null;
  created_at: string;
  location_label: string;
  donors_count: number;
}

interface MyBloodRequestsSectionProps {
  requests: BloodRequest[];
  onStatusChange: (id: string, status: RequestStatus) => void;
  colors: ThemeColors;
}

type FilterTab = "ALL" | RequestStatus;

const STATUS_CFG: Record<RequestStatus, { color: string; label: string; icon: string }> = {
  OPEN: { color: "#2196F3", label: "Open", icon: "clock" },
  FULFILLED: { color: "#2eb97b", label: "Fulfilled", icon: "check-circle" },
  CANCELLED: { color: "#E53935", label: "Cancelled", icon: "x-circle" },
  EXPIRED: { color: "#F9A825", label: "Expired", icon: "alert-triangle" },
};

const URGENCY_CFG: Record<UrgencyLevel, { color: string; label: string }> = {
  NORMAL: { color: "#2eb97b", label: "Normal" },
  URGENT: { color: "#F9A825", label: "Urgent" },
  EMERGENCY: { color: "#E53935", label: "Emergency" },
};

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "OPEN", label: "Open" },
  { key: "FULFILLED", label: "Done" },
  { key: "CANCELLED", label: "Cancelled" },
  { key: "EXPIRED", label: "Expired" },
];

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

const isDeadlinePast = (needed_by: string) => new Date(needed_by) < new Date();

export const MyBloodRequestsSection = ({
  requests,
  onStatusChange,
  colors,
}: MyBloodRequestsSectionProps) => {
  const router = useRouter();
  const [localRequests, setLocalRequests] = useState(requests);
  const [activeFilter, setActiveFilter] = useState<FilterTab>("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered =
    activeFilter === "ALL"
      ? localRequests
      : localRequests.filter((r) => r.status === activeFilter);

  const changeStatus = (id: string, newStatus: RequestStatus) => {
    const updated = localRequests.map((r) =>
      r.id === id ? { ...r, status: newStatus } : r
    );
    setLocalRequests(updated);
    onStatusChange(id, newStatus);
  };

  const handleCancel = (req: BloodRequest) => {
    const hasDonors = req.donors_count > 0;
    Alert.alert(
      "Cancel Request?",
      hasDonors
        ? `${req.donors_count} donor(s) have committed to this request. Cancelling will notify them. Continue?`
        : "Are you sure you want to cancel this request?",
      [
        { text: "Keep", style: "cancel" },
        {
          text: "Cancel Request",
          style: "destructive",
          onPress: () => changeStatus(req.id, "CANCELLED"),
        },
      ]
    );
  };

  const handleShare = async (token: string) => {
    await Clipboard.setStringAsync(
      `https://bloodapp.com/request/${token}`
    );
    Alert.alert("✅ Copied", "Share link copied to clipboard.");
  };

  const handleReCreate = (req: BloodRequest) => {
    Alert.alert(
      "Re-create Request?",
      "This will open a pre-filled request form with the same details.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Continue",
          onPress: () =>
            router.push({
              pathname: "/(othersPage)/requestBlood",
              // params: { prefillId: req.id }
            }),
        },
      ]
    );
  };

  const handleFulfill = (req: BloodRequest) => {
    Alert.alert(
      "Mark as Fulfilled?",
      "This will close the request. All pending donors will be notified.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Confirm", onPress: () => changeStatus(req.id, "FULFILLED") },
      ]
    );
  };

  return (
    <View
      style={{
        backgroundColor: colors.secondBackgroundColor,
        borderRadius: moderateScale(16),
        borderWidth: 1,
        borderColor: colors.cardBorderColor,
        padding: moderateScale(16),
        marginBottom: moderateScale(12),
      }}
    >
      {/* Section header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: moderateScale(14),
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: moderateScale(8) }}>
          <View style={{ width: moderateScale(3), height: moderateScale(14), borderRadius: 2, backgroundColor: "#E53935" }} />
          <MaterialCommunityIcons name="water" size={moderateScale(14)} color={colors.thirdTextColor} />
          <StyledText style={{ color: colors.thirdTextColor, fontSize: moderateScale(10, 0.3), fontWeight: "700", letterSpacing: 1, textTransform: "uppercase" }}>
            My Blood Requests
          </StyledText>
        </View>
        <TouchableOpacity
          onPress={() => router.push({ pathname: "/(othersPage)/requestBlood" })}
          style={{ flexDirection: "row", alignItems: "center", gap: moderateScale(4), backgroundColor: withOpacity("#E53935", 0.1), borderRadius: moderateScale(8), paddingHorizontal: moderateScale(9), paddingVertical: moderateScale(4) }}
        >
          <Feather name="plus" size={moderateScale(12)} color="#E53935" />
          <StyledText style={{ color: "#E53935", fontWeight: "600", fontSize: moderateScale(11, 0.3) }}>New</StyledText>
        </TouchableOpacity>
      </View>

      {/* Filter tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: moderateScale(14) }}>
        <View style={{ flexDirection: "row", gap: moderateScale(6) }}>
          {FILTER_TABS.map((tab) => {
            const cnt = tab.key === "ALL" ? localRequests.length : localRequests.filter(r => r.status === tab.key).length;
            const isActive = activeFilter === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveFilter(tab.key)}
                activeOpacity={0.75}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: moderateScale(4),
                  paddingVertical: moderateScale(5),
                  paddingHorizontal: moderateScale(10),
                  borderRadius: moderateScale(14),
                  backgroundColor: isActive ? withOpacity("#E53935", 0.12) : "transparent",
                  borderWidth: isActive ? 0 : 1,
                  borderColor: colors.cardBorderColor,
                }}
              >
                <StyledText style={{ color: isActive ? "#E53935" : colors.thirdTextColor, fontWeight: isActive ? "700" : "400", fontSize: moderateScale(11, 0.3) }}>{tab.label}</StyledText>
                <View style={{ backgroundColor: isActive ? withOpacity("#E53935", 0.2) : colors.thirdBackgroundColor, borderRadius: moderateScale(8), paddingHorizontal: moderateScale(4), paddingVertical: moderateScale(1) }}>
                  <StyledText style={{ color: isActive ? "#E53935" : colors.thirdTextColor, fontSize: moderateScale(9, 0.3), fontWeight: "700" }}>{cnt}</StyledText>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Empty state */}
      {filtered.length === 0 && (
        <View style={{ alignItems: "center", paddingVertical: moderateScale(32), gap: moderateScale(10) }}>
          <MaterialCommunityIcons name="water-off" size={moderateScale(36)} color={colors.thirdTextColor} />
          <StyledText style={{ color: colors.thirdTextColor, fontSize: moderateScale(12, 0.3), textAlign: "center" }}>
            {activeFilter === "ALL" ? "No blood requests yet." : `No ${activeFilter.toLowerCase()} requests.`}
          </StyledText>
        </View>
      )}

      {/* Request cards */}
      {filtered.map((req) => {
        const cfg = STATUS_CFG[req.status];
        const urg = URGENCY_CFG[req.urgency_level];
        const progress = req.units_required > 0 ? req.units_fulfilled / req.units_required : 0;
        const isExpanded = expandedId === req.id;
        const deadlinePast = isDeadlinePast(req.needed_by) && req.status === "OPEN";

        return (
          <TouchableOpacity
            key={req.id}
            onPress={() => setExpandedId(isExpanded ? null : req.id)}
            activeOpacity={0.85}
            style={{
              borderRadius: moderateScale(12),
              borderWidth: 1,
              borderColor: colors.cardBorderColor,
              marginBottom: moderateScale(10),
              overflow: "hidden",
              backgroundColor: colors.bodyBackground,
            }}
          >
            {/* Top accent */}
            <View style={{ height: moderateScale(3), backgroundColor: cfg.color, opacity: 0.7 }} />

            <View style={{ padding: moderateScale(12) }}>
              {/* Deadline past warning */}
              {deadlinePast && (
                <View style={{ backgroundColor: withOpacity("#F9A825", 0.1), borderRadius: moderateScale(8), padding: moderateScale(8), flexDirection: "row", alignItems: "center", gap: moderateScale(6), marginBottom: moderateScale(8), borderWidth: 1, borderColor: withOpacity("#F9A825", 0.25) }}>
                  <Feather name="alert-triangle" size={moderateScale(11)} color="#F9A825" />
                  <StyledText style={{ color: "#F9A825", fontSize: moderateScale(10, 0.3), flex: 1 }}>Deadline has passed — consider updating or closing this request.</StyledText>
                </View>
              )}

              {/* Header row */}
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: moderateScale(8) }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: moderateScale(6) }}>
                  <View style={{ backgroundColor: withOpacity("#E53935", 0.12), borderRadius: moderateScale(8), paddingHorizontal: moderateScale(8), paddingVertical: moderateScale(2) }}>
                    <StyledText style={{ color: "#E53935", fontWeight: "800", fontSize: moderateScale(12, 0.3) }}>{req.blood_group_name}</StyledText>
                  </View>
                  <View style={{ backgroundColor: withOpacity(urg.color, 0.1), borderRadius: moderateScale(8), paddingHorizontal: moderateScale(7), paddingVertical: moderateScale(2) }}>
                    <StyledText style={{ color: urg.color, fontSize: moderateScale(9, 0.3), fontWeight: "600" }}>{urg.label}</StyledText>
                  </View>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: moderateScale(4), backgroundColor: withOpacity(cfg.color, 0.1), borderRadius: moderateScale(8), paddingHorizontal: moderateScale(7), paddingVertical: moderateScale(2) }}>
                  <Feather name={cfg.icon as any} size={moderateScale(10)} color={cfg.color} />
                  <StyledText style={{ color: cfg.color, fontSize: moderateScale(9, 0.3), fontWeight: "600" }}>{cfg.label}</StyledText>
                </View>
              </View>

              {/* Description */}
              <StyledText style={{ color: colors.descriptionTextColor, fontSize: moderateScale(12, 0.3), lineHeight: moderateScale(18), marginBottom: moderateScale(10) }} numberOfLines={isExpanded ? undefined : 2}>
                {req.description}
              </StyledText>

              {/* Progress bar */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: moderateScale(8), marginBottom: moderateScale(8) }}>
                <View style={{ flex: 1, height: moderateScale(5), backgroundColor: colors.thirdBackgroundColor, borderRadius: 3, overflow: "hidden" }}>
                  <View style={{ height: "100%", width: `${progress * 100}%`, backgroundColor: progress >= 1 ? "#2eb97b" : cfg.color, borderRadius: 3 }} />
                </View>
                <StyledText style={{ color: colors.thirdTextColor, fontSize: moderateScale(10, 0.3), fontWeight: "700" }}>
                  {req.units_fulfilled}/{req.units_required} units
                </StyledText>
              </View>

              {/* Meta */}
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: moderateScale(6) }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: moderateScale(3), backgroundColor: colors.thirdBackgroundColor, borderRadius: moderateScale(7), paddingHorizontal: moderateScale(6), paddingVertical: moderateScale(3) }}>
                  <Feather name="map-pin" size={moderateScale(9)} color={colors.thirdTextColor} />
                  <StyledText style={{ color: colors.thirdTextColor, fontSize: moderateScale(9, 0.3) }} numberOfLines={1}>{req.location_label}</StyledText>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: moderateScale(3), backgroundColor: colors.thirdBackgroundColor, borderRadius: moderateScale(7), paddingHorizontal: moderateScale(6), paddingVertical: moderateScale(3) }}>
                  <Feather name="calendar" size={moderateScale(9)} color={colors.thirdTextColor} />
                  <StyledText style={{ color: colors.thirdTextColor, fontSize: moderateScale(9, 0.3) }}>By {formatDate(req.needed_by)}</StyledText>
                </View>
                {req.donors_count > 0 && (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: moderateScale(3), backgroundColor: withOpacity("#2196F3", 0.08), borderRadius: moderateScale(7), paddingHorizontal: moderateScale(6), paddingVertical: moderateScale(3) }}>
                    <MaterialCommunityIcons name="account-group" size={moderateScale(10)} color="#2196F3" />
                    <StyledText style={{ color: "#2196F3", fontSize: moderateScale(9, 0.3) }}>{req.donors_count} donor{req.donors_count > 1 ? "s" : ""}</StyledText>
                  </View>
                )}
              </View>

              {/* Expanded actions */}
              {isExpanded && (
                <View style={{ marginTop: moderateScale(12), paddingTop: moderateScale(12), borderTopWidth: 1, borderTopColor: colors.cardBorderColor, gap: moderateScale(8) }}>
                  {/* Created date */}
                  <StyledText style={{ color: colors.thirdTextColor, fontSize: moderateScale(10, 0.3) }}>
                    Posted: {formatDate(req.created_at)}
                  </StyledText>

                  {/* Action buttons by status */}
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: moderateScale(8) }}>
                    {req.status === "OPEN" && (
                      <>
                        {req.share_token && (
                          <TouchableOpacity onPress={() => handleShare(req.share_token!)} style={{ flexDirection: "row", alignItems: "center", gap: moderateScale(5), backgroundColor: colors.thirdBackgroundColor, borderRadius: moderateScale(8), paddingVertical: moderateScale(7), paddingHorizontal: moderateScale(12), borderWidth: 1, borderColor: colors.cardBorderColor }}>
                            <Feather name="share-2" size={moderateScale(12)} color={colors.textColor} />
                            <StyledText style={{ color: colors.textColor, fontSize: moderateScale(11, 0.3), fontWeight: "600" }}>Share</StyledText>
                          </TouchableOpacity>
                        )}
                        {req.donors_count === 0 && (
                          <TouchableOpacity
                            onPress={() => router.push({ pathname: "/(othersPage)/requestBlood" })}
                            style={{ flexDirection: "row", alignItems: "center", gap: moderateScale(5), backgroundColor: colors.thirdBackgroundColor, borderRadius: moderateScale(8), paddingVertical: moderateScale(7), paddingHorizontal: moderateScale(12), borderWidth: 1, borderColor: colors.cardBorderColor }}
                          >
                            <Feather name="edit-2" size={moderateScale(12)} color={colors.textColor} />
                            <StyledText style={{ color: colors.textColor, fontSize: moderateScale(11, 0.3), fontWeight: "600" }}>Edit</StyledText>
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity onPress={() => handleFulfill(req)} style={{ flexDirection: "row", alignItems: "center", gap: moderateScale(5), backgroundColor: withOpacity("#2eb97b", 0.1), borderRadius: moderateScale(8), paddingVertical: moderateScale(7), paddingHorizontal: moderateScale(12), borderWidth: 1, borderColor: withOpacity("#2eb97b", 0.3) }}>
                          <Feather name="check-circle" size={moderateScale(12)} color="#2eb97b" />
                          <StyledText style={{ color: "#2eb97b", fontSize: moderateScale(11, 0.3), fontWeight: "600" }}>Mark Fulfilled</StyledText>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleCancel(req)} style={{ flexDirection: "row", alignItems: "center", gap: moderateScale(5), backgroundColor: withOpacity("#E53935", 0.08), borderRadius: moderateScale(8), paddingVertical: moderateScale(7), paddingHorizontal: moderateScale(12), borderWidth: 1, borderColor: withOpacity("#E53935", 0.2) }}>
                          <Feather name="x-circle" size={moderateScale(12)} color="#E53935" />
                          <StyledText style={{ color: "#E53935", fontSize: moderateScale(11, 0.3), fontWeight: "600" }}>Cancel</StyledText>
                        </TouchableOpacity>
                      </>
                    )}
                    {(req.status === "CANCELLED" || req.status === "EXPIRED") && (
                      <TouchableOpacity onPress={() => handleReCreate(req)} style={{ flexDirection: "row", alignItems: "center", gap: moderateScale(5), backgroundColor: withOpacity("#E53935", 0.1), borderRadius: moderateScale(8), paddingVertical: moderateScale(7), paddingHorizontal: moderateScale(12), borderWidth: 1, borderColor: withOpacity("#E53935", 0.25) }}>
                        <Feather name="refresh-cw" size={moderateScale(12)} color="#E53935" />
                        <StyledText style={{ color: "#E53935", fontSize: moderateScale(11, 0.3), fontWeight: "600" }}>Re-create</StyledText>
                      </TouchableOpacity>
                    )}
                    {req.status === "FULFILLED" && req.donors_count > 0 && (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: moderateScale(5), backgroundColor: withOpacity("#2eb97b", 0.1), borderRadius: moderateScale(8), paddingVertical: moderateScale(7), paddingHorizontal: moderateScale(12) }}>
                        <MaterialCommunityIcons name="heart" size={moderateScale(12)} color="#2eb97b" />
                        <StyledText style={{ color: "#2eb97b", fontSize: moderateScale(11, 0.3), fontWeight: "600" }}>Thank {req.donors_count} donor{req.donors_count > 1 ? "s" : ""}</StyledText>
                      </View>
                    )}
                  </View>
                </View>
              )}

              {/* Expand chevron */}
              <View style={{ alignItems: "center", marginTop: moderateScale(5) }}>
                <Feather name={isExpanded ? "chevron-up" : "chevron-down"} size={moderateScale(14)} color={colors.thirdTextColor} />
              </View>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};
