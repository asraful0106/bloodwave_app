/**
 * ProfileHeader.tsx
 * Avatar · Name · Blood group · Verified badge · Donor availability toggle
 */

import Avatar from "@/components/Avatar";
import { StyledText } from "@/components/StyledText";
import { envVars } from "@/config/envVars";
import { ThemeColors } from "@/constants/themeCollorConstant";
import { withOpacity } from "@/helpers/withOpacity";
import { MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import React from "react";
import { TouchableOpacity, View, Alert } from "react-native";
import { moderateScale } from "react-native-size-matters";

interface User {
  f_name: string;
  l_name: string;
  blood_group_name: string;
  is_verified: boolean;
  status: string;
  created_at: string;
}

interface DonorProfile {
  is_available: boolean;
  inactive_until: string | null;
  total_donations: number;
  last_donation_date: string | null;
}

interface UserImage {
  link: string;
}

interface ProfileHeaderProps {
  user: User;
  userImage: UserImage | null;
  donorProfile: DonorProfile;
  onEditAvatar: () => void;
  onToggleAvailability: (next: boolean) => void;
  colors: ThemeColors;
}

export const ProfileHeader = ({
  user,
  userImage,
  donorProfile,
  onEditAvatar,
  onToggleAvailability,
  colors,
}: ProfileHeaderProps) => {
  const memberSince = new Date(user.created_at).getFullYear();
  // console.log("User Image: ", userImage)
  // console.log(`${envVars.BASE_URL}/image${userImage?.link}`);

  const handleToggle = () => {
    const next = !donorProfile.is_available;
    Alert.alert(
      next ? "Mark as Available?" : "Mark as Unavailable?",
      next
        ? "You will appear in donor search results and may receive donation requests."
        : "You will be hidden from donor searches. You can re-enable this anytime.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: () => onToggleAvailability(next),
        },
      ],
    );
  };

  const isSuspended = user.status === "SUSPENDED";
  const isDeleted = user.status === "DELETED";

  return (
    <View
      style={{
        backgroundColor: colors.secondBackgroundColor,
        borderRadius: moderateScale(16),
        borderWidth: 1,
        borderColor: colors.cardBorderColor,
        padding: moderateScale(20),
        marginBottom: moderateScale(12),
      }}
    >
      {/* Suspended / Deleted banner */}
      {(isSuspended || isDeleted) && (
        <View
          style={{
            backgroundColor: withOpacity("#E53935", 0.1),
            borderRadius: moderateScale(8),
            padding: moderateScale(10),
            flexDirection: "row",
            alignItems: "center",
            gap: moderateScale(8),
            marginBottom: moderateScale(14),
            borderWidth: 1,
            borderColor: withOpacity("#E53935", 0.25),
          }}
        >
          <Feather
            name="alert-octagon"
            size={moderateScale(14)}
            color="#E53935"
          />
          <StyledText
            style={{
              color: "#E53935",
              fontSize: moderateScale(11, 0.3),
              flex: 1,
            }}
          >
            {isSuspended
              ? "Your account is suspended. Contact support to restore access."
              : "Your account is scheduled for deletion."}
          </StyledText>
        </View>
      )}

      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          gap: moderateScale(16),
        }}
      >
        {/* Avatar with edit button */}
        <View>
          <TouchableOpacity onPress={onEditAvatar} activeOpacity={0.8}>
            <View>
              <Avatar
                imageUrl={
                  userImage?.link
                    ? `${envVars.BASE_URL}/image${userImage?.link}`
                    : undefined
                }
                size={moderateScale(76)}
              />
              {/* Camera overlay */}
              <View
                style={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  backgroundColor: "#E53935",
                  borderRadius: moderateScale(10),
                  width: moderateScale(22),
                  height: moderateScale(22),
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 2,
                  borderColor: colors.secondBackgroundColor,
                }}
              >
                <Feather name="camera" size={moderateScale(10)} color="white" />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Name + meta */}
        <View style={{ flex: 1 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: moderateScale(6),
              flexWrap: "wrap",
            }}
          >
            <StyledText
              style={{
                fontSize: moderateScale(18, 0.3),
                fontWeight: "800",
                color: colors.textColor,
                letterSpacing: -0.3,
              }}
            >
              {user.f_name} {user.l_name}
            </StyledText>
            {user.is_verified && (
              <MaterialCommunityIcons
                name="check-decagram"
                size={moderateScale(16)}
                color="#2196F3"
              />
            )}
          </View>

          {/* Blood group chip */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: moderateScale(6),
              marginTop: moderateScale(5),
              flexWrap: "wrap",
            }}
          >
            <View
              style={{
                backgroundColor: withOpacity("#E53935", 0.12),
                borderRadius: moderateScale(10),
                paddingHorizontal: moderateScale(9),
                paddingVertical: moderateScale(3),
                flexDirection: "row",
                alignItems: "center",
                gap: moderateScale(4),
              }}
            >
              <MaterialCommunityIcons
                name="water"
                size={moderateScale(11)}
                color="#E53935"
              />
              <StyledText
                style={{
                  color: "#E53935",
                  fontWeight: "800",
                  fontSize: moderateScale(12, 0.3),
                }}
              >
                {user.blood_group_name}
              </StyledText>
            </View>

            <StyledText
              style={{
                color: colors.thirdTextColor,
                fontSize: moderateScale(10, 0.3),
              }}
            >
              Since {memberSince}
            </StyledText>
          </View>

          {/* Stats mini row */}
          <View
            style={{
              flexDirection: "row",
              gap: moderateScale(12),
              marginTop: moderateScale(10),
            }}
          >
            {[{ label: "Donations", value: donorProfile.total_donations }].map(
              (s) => (
                <View key={s.label}>
                  <StyledText
                    style={{
                      color: colors.textColor,
                      fontWeight: "800",
                      fontSize: moderateScale(15, 0.3),
                    }}
                  >
                    {s.value}
                  </StyledText>
                  <StyledText
                    style={{
                      color: colors.thirdTextColor,
                      fontSize: moderateScale(9, 0.3),
                    }}
                  >
                    {s.label}
                  </StyledText>
                </View>
              ),
            )}
          </View>
        </View>
      </View>

      {/* Donor availability toggle */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: moderateScale(16),
          paddingTop: moderateScale(14),
          borderTopWidth: 1,
          borderTopColor: colors.cardBorderColor,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: moderateScale(8),
          }}
        >
          <MaterialCommunityIcons
            name="heart-pulse"
            size={moderateScale(18)}
            color={
              donorProfile.is_available ? "#2eb97b" : colors.thirdTextColor
            }
          />
          <View>
            <StyledText
              style={{
                color: colors.textColor,
                fontWeight: "600",
                fontSize: moderateScale(13, 0.3),
              }}
            >
              Available to Donate
            </StyledText>
            <StyledText
              style={{
                color: colors.thirdTextColor,
                fontSize: moderateScale(10, 0.3),
              }}
            >
              {donorProfile.is_available
                ? "You appear in donor search results"
                : donorProfile.inactive_until
                  ? `Paused until ${new Date(donorProfile.inactive_until).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}`
                  : "Hidden from donor searches"}
            </StyledText>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleToggle}
          activeOpacity={0.8}
          style={{
            width: moderateScale(46),
            height: moderateScale(26),
            borderRadius: moderateScale(13),
            backgroundColor: donorProfile.is_available
              ? "#2eb97b"
              : colors.thirdBackgroundColor,
            justifyContent: "center",
            paddingHorizontal: moderateScale(3),
            borderWidth: 1,
            borderColor: donorProfile.is_available
              ? "#2eb97b"
              : colors.cardBorderColor,
          }}
        >
          <View
            style={{
              width: moderateScale(20),
              height: moderateScale(20),
              borderRadius: moderateScale(10),
              backgroundColor: "white",
              alignSelf: donorProfile.is_available ? "flex-end" : "flex-start",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.2,
              shadowRadius: 2,
              elevation: 2,
            }}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};
