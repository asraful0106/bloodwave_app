import { View, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import React, { useState } from "react";
import { Donation, DonationStatus, UrgencyLevel } from "../MyDonations";
import { ThemeColors } from "@/constants/themeCollorConstant";
import { moderateScale } from "react-native-size-matters";
import Avatar from "@/components/Avatar";
import { StyledText } from "@/components/StyledText";
import { withOpacity } from "@/helpers/withOpacity";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import apiClient from "@/config/client";

const STATUS_CONFIG: Record<
  DonationStatus,
  { label: string; color: string; bgOpacity: number; icon: string }
> = {
  FULFILLED: {
    label: "Donated",
    color: "#2eb97b",
    bgOpacity: 0.12,
    icon: "check-circle",
  },
  CANCELLED: {
    label: "Cancelled",
    color: "#E53935",
    bgOpacity: 0.1,
    icon: "x-circle",
  },
  PROCESSING: {
    label: "Pending",
    color: "#F9A825",
    bgOpacity: 0.12,
    icon: "clock",
  },
};

const URGENCY_CONFIG: Record<UrgencyLevel, { label: string; color: string }> = {
  NORMAL: { label: "Normal", color: "#2eb97b" },
  URGENT: { label: "Urgent", color: "#F9A825" },
  EMERGENCY: { label: "Emergency", color: "#E53935" },
};

interface Props {
  donation: Donation;
  colors: ThemeColors;
  /** Called after a successful status mutation so the parent can update its list. */
  onStatusUpdate: (id: string, patch: Partial<Donation>) => void;
}

export default function DonationCard({
  donation,
  colors,
  onStatusUpdate,
}: Props) {
  function daysSince(dateStr: string): number {
    const now = new Date();
    const past = new Date(dateStr);
    return Math.floor((now.getTime() - past.getTime()) / (1000 * 60 * 60 * 24));
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

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  const [expanded, setExpanded] = useState(false);
  const [actionLoading, setActionLoading] = useState<
    "fulfil" | "cancel" | null
  >(null);

  const cfg = STATUS_CONFIG[donation.status];
  const urgency = URGENCY_CONFIG[donation.blood_request.urgency_level];
  const expired = isRequestExpired(donation);

  const dateToShow =
    donation.status === "FULFILLED" && donation.donated_at
      ? donation.donated_at
      : donation.created_at;

  // ── Mark as Donated ──────────────────────────────────────────────────────
  const handleMarkDonated = () => {
    Alert.alert(
      "Mark as Donated",
      "Confirm you have completed this donation?",
      [
        { text: "Not yet", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            try {
              setActionLoading("fulfil");
              const donatedAt = new Date().toISOString();

              await apiClient.patch(`/donations/${donation.id}`, {
                status: "FULFILLED",
                donated_at: donatedAt,
              });

              // Optimistic update — reflect in parent list immediately
              onStatusUpdate(donation.id, {
                status: "FULFILLED",
                donated_at: donatedAt,
              });
            } catch (err: any) {
              const message =
                err?.response?.data?.message ??
                "Could not mark donation as fulfilled. Please try again.";
              Alert.alert("Error", message);
            } finally {
              setActionLoading(null);
            }
          },
        },
      ],
    );
  };

  // ── Cancel commitment ────────────────────────────────────────────────────
  const handleCancel = () => {
    Alert.alert(
      "Cancel Commitment",
      "Are you sure you want to cancel? The requester will be notified.",
      [
        { text: "Keep", style: "cancel" },
        {
          text: "Cancel",
          style: "destructive",
          onPress: async () => {
            try {
              setActionLoading("cancel");

              // DELETE performs a soft-cancel on the backend
              await apiClient.delete(`/donations/${donation.id}`);

              // Optimistic update
              onStatusUpdate(donation.id, { status: "CANCELLED" });
            } catch (err: any) {
              const message =
                err?.response?.data?.message ??
                "Could not cancel the commitment. Please try again.";
              Alert.alert("Error", message);
            } finally {
              setActionLoading(null);
            }
          },
        },
      ],
    );
  };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => setExpanded((p) => !p)}
      style={{
        backgroundColor: colors.secondBackgroundColor,
        borderRadius: moderateScale(12),
        borderWidth: 1,
        borderColor: colors.cardBorderColor,
        marginBottom: moderateScale(10),
        overflow: "hidden",
      }}
    >
      {/* Status accent strip */}
      <View
        style={{
          height: moderateScale(3),
          backgroundColor: cfg.color,
          opacity: 0.7,
        }}
      />

      <View style={{ padding: moderateScale(14) }}>
        {/* Header row */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: moderateScale(10),
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
              imageUrl={donation.requester.avatar_url}
              size={moderateScale(36)}
            />
            <View>
              <StyledText
                style={{
                  color: colors.textColor,
                  fontWeight: "600",
                  fontSize: moderateScale(13, 0.3),
                }}
              >
                {donation.requester.f_name} {donation.requester.l_name}
              </StyledText>
              <StyledText
                style={{
                  color: colors.thirdTextColor,
                  fontSize: moderateScale(10, 0.3),
                  marginTop: 1,
                }}
              >
                {formatRelativeDate(dateToShow)}
              </StyledText>
            </View>
          </View>

          {/* Right: blood type + status badge */}
          <View
            style={{
              alignItems: "flex-end",
              gap: moderateScale(4),
            }}
          >
            <View
              style={{
                backgroundColor: withOpacity("#E53935", 0.12),
                borderRadius: moderateScale(10),
                paddingHorizontal: moderateScale(9),
                paddingVertical: moderateScale(2),
              }}
            >
              <StyledText
                style={{
                  color: "#E53935",
                  fontWeight: "800",
                  fontSize: moderateScale(12, 0.3),
                }}
              >
                {donation.blood_request.blood_group_name}
              </StyledText>
            </View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: moderateScale(4),
                backgroundColor: withOpacity(cfg.color, cfg.bgOpacity),
                borderRadius: moderateScale(10),
                paddingHorizontal: moderateScale(7),
                paddingVertical: moderateScale(2),
              }}
            >
              <Feather
                name={cfg.icon as any}
                size={moderateScale(10)}
                color={cfg.color}
              />
              <StyledText
                style={{
                  color: cfg.color,
                  fontSize: moderateScale(10, 0.3),
                  fontWeight: "600",
                }}
              >
                {cfg.label}
              </StyledText>
            </View>
          </View>
        </View>

        {/* ⚠️ Expired-but-pending warning */}
        {expired && (
          <View
            style={{
              backgroundColor: withOpacity("#F9A825", 0.12),
              borderRadius: moderateScale(8),
              padding: moderateScale(8),
              flexDirection: "row",
              alignItems: "center",
              gap: moderateScale(6),
              marginBottom: moderateScale(8),
              borderWidth: 1,
              borderColor: withOpacity("#F9A825", 0.3),
            }}
          >
            <Feather
              name="alert-triangle"
              size={moderateScale(12)}
              color="#F9A825"
            />
            <StyledText
              style={{
                color: "#F9A825",
                fontSize: moderateScale(10, 0.3),
                flex: 1,
              }}
            >
              The request deadline has passed. Please confirm or cancel this
              commitment.
            </StyledText>
          </View>
        )}

        {/* Description */}
        <StyledText
          style={{
            color: colors.descriptionTextColor,
            fontSize: moderateScale(12, 0.3),
            lineHeight: moderateScale(18),
            marginBottom: moderateScale(10),
          }}
          numberOfLines={expanded ? undefined : 2}
          ellipsizeMode="tail"
        >
          {donation.blood_request.description}
        </StyledText>

        {/* Meta row */}
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: moderateScale(6),
          }}
        >
          {/* Location */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: moderateScale(3),
              backgroundColor: colors.thirdBackgroundColor,
              borderRadius: moderateScale(8),
              paddingHorizontal: moderateScale(7),
              paddingVertical: moderateScale(3),
            }}
          >
            <Feather
              name="map-pin"
              size={moderateScale(10)}
              color={colors.thirdTextColor}
            />
            <StyledText
              style={{
                color: colors.thirdTextColor,
                fontSize: moderateScale(10, 0.3),
              }}
              numberOfLines={1}
            >
              {donation.blood_request.location_label}
            </StyledText>
          </View>

          {/* Urgency */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: moderateScale(3),
              backgroundColor: withOpacity(urgency.color, 0.1),
              borderRadius: moderateScale(8),
              paddingHorizontal: moderateScale(7),
              paddingVertical: moderateScale(3),
            }}
          >
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={moderateScale(10)}
              color={urgency.color}
            />
            <StyledText
              style={{
                color: urgency.color,
                fontSize: moderateScale(10, 0.3),
              }}
            >
              {urgency.label}
            </StyledText>
          </View>

          {/* Units */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: moderateScale(3),
              backgroundColor: colors.thirdBackgroundColor,
              borderRadius: moderateScale(8),
              paddingHorizontal: moderateScale(7),
              paddingVertical: moderateScale(3),
            }}
          >
            <MaterialCommunityIcons
              name="water"
              size={moderateScale(10)}
              color={colors.thirdTextColor}
            />
            <StyledText
              style={{
                color: colors.thirdTextColor,
                fontSize: moderateScale(10, 0.3),
              }}
            >
              {donation.units} unit{donation.units !== 1 ? "s" : ""}
            </StyledText>
          </View>
        </View>

        {/* Expanded: notes + exact date + actions */}
        {expanded && (
          <View
            style={{
              marginTop: moderateScale(10),
              paddingTop: moderateScale(10),
              borderTopWidth: 1,
              borderTopColor: colors.cardBorderColor,
              gap: moderateScale(6),
            }}
          >
            {donation.notes && (
              <View
                style={{
                  flexDirection: "row",
                  gap: moderateScale(6),
                  alignItems: "flex-start",
                }}
              >
                <Feather
                  name="message-square"
                  size={moderateScale(12)}
                  color={colors.thirdTextColor}
                />
                <StyledText
                  style={{
                    color: colors.thirdTextColor,
                    fontSize: moderateScale(11, 0.3),
                    flex: 1,
                    fontStyle: "italic",
                  }}
                >
                  {donation.notes}
                </StyledText>
              </View>
            )}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <StyledText
                style={{
                  color: colors.thirdTextColor,
                  fontSize: moderateScale(10, 0.3),
                }}
              >
                Committed: {formatDate(donation.created_at)}
              </StyledText>
              {donation.donated_at && (
                <StyledText
                  style={{
                    color: "#2eb97b",
                    fontSize: moderateScale(10, 0.3),
                    fontWeight: "600",
                  }}
                >
                  Donated: {formatDate(donation.donated_at)}
                </StyledText>
              )}
            </View>

            {/* PROCESSING actions */}
            {donation.status === "PROCESSING" && (
              <View
                style={{
                  flexDirection: "row",
                  gap: moderateScale(8),
                  marginTop: moderateScale(4),
                }}
              >
                {/* Mark Donated */}
                <TouchableOpacity
                  onPress={handleMarkDonated}
                  disabled={actionLoading !== null}
                  style={{
                    flex: 1,
                    backgroundColor: "#2eb97b",
                    borderRadius: moderateScale(8),
                    paddingVertical: moderateScale(7),
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: actionLoading !== null ? 0.6 : 1,
                  }}
                >
                  {actionLoading === "fulfil" ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <StyledText
                      style={{
                        color: "white",
                        fontWeight: "700",
                        fontSize: moderateScale(11, 0.3),
                      }}
                    >
                      Mark Donated
                    </StyledText>
                  )}
                </TouchableOpacity>

                {/* Cancel */}
                <TouchableOpacity
                  onPress={handleCancel}
                  disabled={actionLoading !== null}
                  style={{
                    flex: 1,
                    backgroundColor: withOpacity("#E53935", 0.1),
                    borderRadius: moderateScale(8),
                    paddingVertical: moderateScale(7),
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1,
                    borderColor: withOpacity("#E53935", 0.3),
                    opacity: actionLoading !== null ? 0.6 : 1,
                  }}
                >
                  {actionLoading === "cancel" ? (
                    <ActivityIndicator size="small" color="#E53935" />
                  ) : (
                    <StyledText
                      style={{
                        color: "#E53935",
                        fontWeight: "700",
                        fontSize: moderateScale(11, 0.3),
                      }}
                    >
                      Cancel
                    </StyledText>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Expand toggle hint */}
        <View
          style={{
            alignItems: "center",
            marginTop: moderateScale(6),
          }}
        >
          <Feather
            name={expanded ? "chevron-up" : "chevron-down"}
            size={moderateScale(14)}
            color={colors.thirdTextColor}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
}
