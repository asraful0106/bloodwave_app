/**
 * Profile.tsx  — Main profile page (API-connected)
 *
 * All real API calls wired up against the backend routes:
 *   GET    /users/me                          → load profile
 *   PATCH  /users/:id                         → update scalar fields + image upload
 *   PATCH  /users/:id/donor-profile           → toggle availability / donor info
 *   PATCH  /users/:id/donor-privacy           → privacy toggles
 *   POST   /users/:id/locations               → add location
 *   PATCH  /users/:id/locations/:locationId   → update location
 *   DELETE /users/:id/locations/:locationId   → delete location
 *   POST   /users/:id/contacts                → add contact
 *   PATCH  /users/:id/contacts/:contactId     → update contact
 *   DELETE /users/:id/contacts/:contactId     → delete contact
 *   DELETE /users/:id                         → delete account
 *
 * Image retrieval:  GET  BASE_URL/image/:image_id
 *
 * Endpoints with no backend yet are tagged: // NEED_API
 */

import { StyledText } from "@/components/StyledText";
import apiClient from "@/config/client";
import { ThemeColors } from "@/constants/themeCollorConstant";
import { useAuth } from "@/context/AuthContext";
import { withOpacity } from "@/helpers/withOpacity";
import { useTheme } from "@/hooks/theme/ThemeContext";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import { moderateScale, ScaledSheet } from "react-native-size-matters";

import { AccountSection } from "./components/AccountSection";
import { MyBloodRequestsSection } from "./components/MyBloodRequestsSection";
import { PersonalInfoSection } from "./components/PersonalInfoSection";
import { PrivacySection } from "./components/PrivacySection";
import { ProfileHeader } from "./components/ProfileHeader";

// ─── Types (mirrors DB schema) ───────────────────────────────────────────────

interface UserImage {
  link: string;
  provider: string;
  is_primary: boolean;
  meta: { width: number; height: number };
}

interface DonorProfile {
  is_available: boolean;
  inactive_until: string | null;
  last_donation_date: string | null;
  next_eligible_date: string | null;
  total_donations: number;
}

interface PrivacySettings {
  show_name: boolean;
  show_gender: boolean;
  show_age: boolean;
  show_phone: boolean;
  show_last_donation: boolean;
  emergency_only: boolean;
  allow_inapp_call: boolean;
  allow_chat: boolean;
}

interface UserLocation {
  _id: string;
  address_text: string;
  city: string;
  lat: number;
  lng: number;
  is_primary: boolean;
}

interface UserContact {
  _id: string;
  type: "phone" | "website" | "social";
  title: string;
  value: string;
  is_public: boolean;
}

export interface BloodRequest {
  id: string;
  _id?: string;
  blood_group_name: string;
  description: string;
  units_required: number;
  qty: number;
  urgency_level: "NORMAL" | "URGENT" | "EMERGENCY";
  patient_type: string;
  needed_by: string;
  status: "OPEN" | "FULFILLED" | "CANCELLED" | "EXPIRED";
  share_token: string | null;
  created_at: string;
  location_label: string;
  donors_count: number;
}

export interface User {
  _id: string;
  f_name: string;
  l_name: string;
  phone: string;
  email: string;
  role: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  date_of_birth: string;
  blood_group_name: string;
  is_verified: boolean;
  status: string;
  created_by: string;
  institution_id: string | null;
  created_at: string;
  updated_at: string;
  user_image: UserImage | null;
  donor_profile: DonorProfile;
  donor_privacy_settings: PrivacySettings;
  user_locations: UserLocation[];
  user_contacts: UserContact[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Map a backend UserContact (uses _id) → the shape PrivacySection expects (uses id).
 * This avoids touching PrivacySection's internal types.
 */
const toContactVM = (c: UserContact) => ({
  id: c._id,
  type: c.type,
  title: c.title,
  value: c.value,
  is_public: c.is_public,
});

const toLocationVM = (l: UserLocation) => ({
  id: l._id,
  address_text: l.address_text,
  city: l.city ?? null,
  lat: l.lat,
  lng: l.lng,
  is_primary: l.is_primary,
});

// ─── Section tabs ─────────────────────────────────────────────────────────────

const TABS = [
  { key: "info", label: "Info", icon: "account" },
  { key: "privacy", label: "Privacy", icon: "shield-account" },
  { key: "requests", label: "Requests", icon: "water" },
  { key: "account", label: "Account", icon: "cog" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

// ─── Main component ───────────────────────────────────────────────────────────

export default function Profile() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const scrollRef = useRef<ScrollView>(null);
  const { userData, logout, refreshUser, accessToken } = useAuth();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("info");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const sectionRefs = useRef<Record<TabKey, number>>({
    info: 0,
    privacy: 0,
    requests: 0,
    account: 0,
  });


  // ── Load profile ────────────────────────────────────────────────────────────

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data } = await apiClient.get("/users/me", {
        headers: {
          accessToken: accessToken,
        },
      });
      setUser(data.data);
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Could not load your profile.";
      console.log("loadProfile: ", err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // ── Load blood own blood req ────────────────────────────────────────────────────────────
  const [bloodReq, setBloodReq] = useState<BloodRequest[] | []>([]);

  const loadBloodReq = useCallback(async () => {
    try {
      const { data } = await apiClient.get(`/blood-req/user/${userData?._id}`, {
        headers: {
          accessToken: accessToken,
        },
      });
      // console.log("Blood req: ", data.data);
      setBloodReq(data.data);
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Could not load user blood req.";
    } finally {
    }
  }, []);

  useEffect(() => {
    loadBloodReq();
  }, [loadBloodReq, user]);

  const scrollToSection = (key: TabKey) => {
    setActiveTab(key);
    const y = sectionRefs.current[key];
    scrollRef.current?.scrollTo({ y: y - moderateScale(60), animated: true });
  };

  // ── Avatar / Image upload ───────────────────────────────────────────────────

  const handleAvatarEdit = () => {
    Alert.alert("Change Photo", "Choose an option", [
      {
        text: "Take Photo",
        onPress: async () => {
          const perm = await ImagePicker.requestCameraPermissionsAsync();
          if (!perm.granted) {
            Alert.alert(
              "Permission required",
              "Camera access is needed to take a photo.",
            );
            return;
          }
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          });
          if (!result.canceled) uploadAvatar(result.assets[0]);
        },
      },
      {
        text: "Choose from Gallery",
        onPress: async () => {
          const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (!perm.granted) {
            Alert.alert(
              "Permission required",
              "Photo library access is needed.",
            );
            return;
          }
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          });
          if (!result.canceled) uploadAvatar(result.assets[0]);
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const uploadAvatar = async (asset: ImagePicker.ImagePickerAsset) => {
    if (!user) return;
    try {
      setUploadingAvatar(true);

      const formData = new FormData();
      formData.append("image", {
        uri: asset.uri,
        type: asset.mimeType ?? "image/jpeg",
        name: asset.fileName ?? "avatar.jpg",
      } as any);

      const { data } = await apiClient.patch(`/users/${user._id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setUser(data.data);
      Alert.alert("✅ Photo updated successfully.");
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to update photo.";
      Alert.alert("Upload failed", message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  // ── Toggle donor availability ───────────────────────────────────────────────

  const handleToggleAvailability = async (next: boolean) => {
    if (!user) return;
    // Optimistic update
    setUser((prev) =>
      prev
        ? {
            ...prev,
            donor_profile: { ...prev.donor_profile, is_available: next },
          }
        : prev,
    );
    try {
      await apiClient.patch(`/users/${user._id}/donor-profile`, {
        is_available: next,
      });
    } catch (err: any) {
      // Rollback on error
      setUser((prev) =>
        prev
          ? {
              ...prev,
              donor_profile: { ...prev.donor_profile, is_available: !next },
            }
          : prev,
      );
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to update availability.";
      Alert.alert("Error", message);
    }
  };

  // ── Personal info save ──────────────────────────────────────────────────────

  const handleSavePersonalInfo = async (updated: Partial<User>) => {
    if (!user) return;
    const prev = { ...user };
    // Optimistic update
    setUser((p) => (p ? { ...p, ...updated } : p));
    try {
      const { data } = await apiClient.patch(`/users/${user._id}`, updated);
      setUser(data.data);
      // Sync AuthContext so userData stays fresh
      await refreshUser();
    } catch (err: any) {
      // Rollback
      setUser(prev);
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to save changes.";
      Alert.alert("Error", message);
    }
  };

  // ── Privacy settings ────────────────────────────────────────────────────────

  const handlePrivacyChange = async (updated: PrivacySettings) => {
    if (!user) return;
    const prev = user.donor_privacy_settings;
    setUser((p) => (p ? { ...p, donor_privacy_settings: updated } : p));
    try {
      await apiClient.patch(`/users/${user._id}/donor-privacy`, updated);
    } catch (err: any) {
      setUser((p) => (p ? { ...p, donor_privacy_settings: prev } : p));
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to update privacy settings.";
      Alert.alert("Error", message);
    }
  };

  // ── Contacts ────────────────────────────────────────────────────────────────
  // PrivacySection manages contacts locally and calls these when adding/removing.
  // We diff against the current list to figure out what API call to make.

  const handleContactAdd = async (contact: {
    type: "phone" | "website" | "social";
    title: string;
    value: string;
    is_public: boolean;
  }) => {
    if (!user) return;
    try {
      const { data } = await apiClient.post(
        `/users/${user._id}/contacts`,
        contact,
      );
      // data.data is the full updated contacts array
      setUser((p) => (p ? { ...p, user_contacts: data.data } : p));
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to add contact.";
      Alert.alert("Error", message);
      throw err; // bubble up so PrivacySection can rollback
    }
  };

  const handleContactDelete = async (contactId: string) => {
    if (!user) return;
    const prev = user.user_contacts;
    setUser((p) =>
      p
        ? {
            ...p,
            user_contacts: p.user_contacts.filter((c) => c._id !== contactId),
          }
        : p,
    );
    try {
      const { data } = await apiClient.delete(
        `/users/${user._id}/contacts/${contactId}`,
      );
      setUser((p) => (p ? { ...p, user_contacts: data.data } : p));
    } catch (err: any) {
      setUser((p) => (p ? { ...p, user_contacts: prev } : p));
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to delete contact.";
      Alert.alert("Error", message);
    }
  };

  const handleContactTogglePublic = async (
    contactId: string,
    is_public: boolean,
  ) => {
    if (!user) return;
    const prev = user.user_contacts;
    setUser((p) =>
      p
        ? {
            ...p,
            user_contacts: p.user_contacts.map((c) =>
              c._id === contactId ? { ...c, is_public } : c,
            ),
          }
        : p,
    );
    try {
      const { data } = await apiClient.patch(
        `/users/${user._id}/contacts/${contactId}`,
        { is_public },
      );
      setUser((p) => (p ? { ...p, user_contacts: data.data } : p));
    } catch (err: any) {
      setUser((p) => (p ? { ...p, user_contacts: prev } : p));
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to update contact.";
      Alert.alert("Error", message);
    }
  };

  // ── Locations ───────────────────────────────────────────────────────────────

  const handleLocationAdd = async (location: Omit<UserLocation, "_id">) => {
    if (!user) return;
    try {
      const { data } = await apiClient.post(
        `/users/${user._id}/locations`,
        location,
      );
      setUser((p) => (p ? { ...p, user_locations: data.data } : p));
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to add location.";
      Alert.alert("Error", message);
      throw err;
    }
  };

  const handleLocationSetPrimary = async (locationId: string) => {
    if (!user) return;
    const prev = user.user_locations;
    setUser((p) =>
      p
        ? {
            ...p,
            user_locations: p.user_locations.map((l) => ({
              ...l,
              is_primary: l._id === locationId,
            })),
          }
        : p,
    );
    try {
      const { data } = await apiClient.patch(
        `/users/${user._id}/locations/${locationId}`,
        { is_primary: true },
      );
      setUser((p) => (p ? { ...p, user_locations: data.data } : p));
    } catch (err: any) {
      setUser((p) => (p ? { ...p, user_locations: prev } : p));
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to update location.";
      Alert.alert("Error", message);
    }
  };

  const handleLocationDelete = async (locationId: string) => {
    if (!user) return;
    const prev = user.user_locations;
    setUser((p) =>
      p
        ? {
            ...p,
            user_locations: p.user_locations.filter(
              (l) => l._id !== locationId,
            ),
          }
        : p,
    );
    try {
      const { data } = await apiClient.delete(
        `/users/${user._id}/locations/${locationId}`,
      );
      setUser((p) => (p ? { ...p, user_locations: data.data } : p));
    } catch (err: any) {
      setUser((p) => (p ? { ...p, user_locations: prev } : p));
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to delete location.";
      Alert.alert("Error", message);
    }
  };

  // ── Blood request status change ─────────────────────────────────────────────
  // NEED_API: No blood_requests endpoint in user routes yet.
  // When available, wire: PATCH /blood-requests/:id  { status }
  const handleBloodRequestStatusChange = (
    id: string,
    status: BloodRequest["status"],
  ) => {
    // Local-only update until blood request API is connected
    // NEED_API: await apiClient.patch(`/blood-requests/${id}`, { status });
    console.warn("NEED_API: blood request status change not yet connected");
  };

  // ── Change password ─────────────────────────────────────────────────────────
  // NEED_API: POST /auth/change-password  { current_password, new_password }
  const handleChangePassword = async (
    current: string,
    next: string,
  ): Promise<boolean> => {
    try {
      // NEED_API: await apiClient.post("/auth/change-password", {
      //   current_password: current,
      //   new_password: next,
      // });
      console.warn("NEED_API: change-password endpoint not yet connected");
      // Mock: always succeed if current is non-empty
      return current.length > 0;
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to change password.";
      Alert.alert("Error", message);
      return false;
    }
  };

  // ── Deactivate account ──────────────────────────────────────────────────────
  // NEED_API: POST /auth/deactivate  OR  PATCH /users/:id  { status: "INACTIVE" }
  const handleDeactivate = async () => {
    if (!user) return;
    try {
      // NEED_API: await apiClient.post("/auth/deactivate");
      console.warn("NEED_API: deactivate endpoint not yet connected");
      Alert.alert("Account deactivated.");
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to deactivate account.";
      Alert.alert("Error", message);
    }
  };

  // ── Delete account ──────────────────────────────────────────────────────────

  const handleDeleteAccount = async () => {
    if (!user) return;
    try {
      await apiClient.delete(`/users/${user._id}`);
      await logout();
      router.replace("/(auth)/login");
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to delete account.";
      Alert.alert("Error", message);
    }
  };

  // ── Logout ──────────────────────────────────────────────────────────────────

  const handleLogout = () => {
    // AccountSection already calls useAuth().logout() and navigates — nothing extra needed here.
  };

  // ── Resend email verification ────────────────────────────────────────────────
  // NEED_API: POST /auth/resend-verification
  const handleResendVerification = () => {
    // NEED_API: await apiClient.post("/auth/resend-verification");
    console.warn("NEED_API: resend-verification endpoint not yet connected");
    Alert.alert("Verification email sent! Check your inbox.");
  };

  // ── Loading state ────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View
        style={[
          styles.root,
          { alignItems: "center", justifyContent: "center" },
        ]}
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
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────────

  if (error || !user) {
    return (
      <View
        style={[
          styles.root,
          {
            alignItems: "center",
            justifyContent: "center",
            gap: moderateScale(12),
            paddingHorizontal: moderateScale(30),
          },
        ]}
      >
        <MaterialCommunityIcons
          name="wifi-off"
          size={moderateScale(42)}
          color={colors.thirdTextColor}
        />
        <StyledText
          style={{
            color: colors.textColor,
            fontWeight: "700",
            fontSize: moderateScale(16, 0.3),
            textAlign: "center",
          }}
        >
          Profile unavailable
        </StyledText>
        <StyledText
          style={{
            color: colors.thirdTextColor,
            fontSize: moderateScale(12, 0.3),
            textAlign: "center",
          }}
        >
          {error ?? "Something went wrong."}
        </StyledText>
        <TouchableOpacity
          onPress={loadProfile}
          style={{
            backgroundColor: "#E53935",
            paddingHorizontal: moderateScale(28),
            paddingVertical: moderateScale(12),
            borderRadius: moderateScale(12),
          }}
        >
          <StyledText
            style={{
              color: "white",
              fontWeight: "700",
              fontSize: moderateScale(13, 0.3),
            }}
          >
            Retry
          </StyledText>
        </TouchableOpacity>
        {/* Logout */}
        <TouchableOpacity
          onPress={() => {
            logout();
          }}
          activeOpacity={0.8}
          style={{
            backgroundColor: "#E53935",
            paddingHorizontal: moderateScale(28),
            paddingVertical: moderateScale(12),
            borderRadius: moderateScale(12),
          }}
        >
          <StyledText
            style={{
              color: "white",
              fontWeight: "700",
              fontSize: moderateScale(13, 0.3),
            }}
          >
            Logout
          </StyledText>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Avatar overlay while uploading ───────────────────────────────────────────

  const avatarUploadingOverlay = uploadingAvatar ? (
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.35)",
        zIndex: 99,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <ActivityIndicator size="large" color="white" />
      <StyledText
        style={{
          color: "white",
          marginTop: moderateScale(8),
          fontSize: moderateScale(12, 0.3),
        }}
      >
        Updating photo…
      </StyledText>
    </View>
  ) : null;

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <View style={styles.root}>
      {avatarUploadingOverlay}

      {/* ── Tab bar ── */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => scrollToSection(tab.key)}
              style={[styles.tabItem, isActive && styles.tabItemActive]}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name={tab.icon as any}
                size={moderateScale(16)}
                color={isActive ? "#E53935" : colors.thirdTextColor}
              />
              {isActive ? (
                <StyledText
                  style={{
                    color: "#E53935",
                    fontSize: moderateScale(9, 0.3),
                    fontWeight: "700",
                    marginTop: 2,
                  }}
                >
                  {tab.label}
                </StyledText>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Unverified email banner ──
        {!user.is_verified && (
          <TouchableOpacity
            onPress={handleResendVerification}
            activeOpacity={0.8}
            style={styles.verifyBanner}
          >
            <Feather name="mail" size={moderateScale(16)} color="#F9A825" />
            <View style={{ flex: 1 }}>
              <StyledText
                style={{
                  color: "#F9A825",
                  fontWeight: "700",
                  fontSize: moderateScale(12, 0.3),
                }}
              >
                Email not verified
              </StyledText>
              <StyledText
                style={{
                  color: colors.thirdTextColor,
                  fontSize: moderateScale(10, 0.3),
                }}
              >
                Tap to resend verification email
              </StyledText>
            </View>
            <Feather
              name="chevron-right"
              size={moderateScale(14)}
              color="#F9A825"
            />
          </TouchableOpacity>
        )} */}

        {/* ── Suspended account banner ── */}
        {user.status === "SUSPENDED" && (
          <View style={styles.suspendedBanner}>
            <Feather
              name="alert-octagon"
              size={moderateScale(16)}
              color="#E53935"
            />
            <View style={{ flex: 1 }}>
              <StyledText
                style={{
                  color: "#E53935",
                  fontWeight: "700",
                  fontSize: moderateScale(12, 0.3),
                }}
              >
                Account Suspended
              </StyledText>
              <StyledText
                style={{
                  color: colors.thirdTextColor,
                  fontSize: moderateScale(10, 0.3),
                }}
              >
                Contact support at support@bloodapp.com
              </StyledText>
            </View>
          </View>
        )}

        {/* ── Profile header ── */}
        <ProfileHeader
          user={{
            f_name: user.f_name,
            l_name: user.l_name,
            blood_group_name: user.blood_group_name,
            is_verified: user.is_verified,
            status: user.status,
            created_at: user.created_at,
          }}
          userImage={user.user_image ? { link: user.user_image.link } : null}
          donorProfile={{
            is_available: user.donor_profile.is_available,
            inactive_until: user.donor_profile.inactive_until,
            total_donations: user.donor_profile.total_donations,
            last_donation_date: user.donor_profile.last_donation_date,
          }}
          onEditAvatar={handleAvatarEdit}
          onToggleAvailability={handleToggleAvailability}
          colors={colors}
        />

        {/* ── Personal info ── */}
        <View
          onLayout={(e) => {
            sectionRefs.current.info = e.nativeEvent.layout.y;
          }}
        >
          <PersonalInfoSection
            info={{
              f_name: user.f_name,
              l_name: user.l_name,
              email: user.email,
              phone: user.phone,
              gender: user.gender,
              date_of_birth: user.date_of_birth,
              blood_group_name: user.blood_group_name,
              is_verified: user.is_verified,
            }}
            onSave={handleSavePersonalInfo}
            colors={colors}
          />
        </View>

        {/* ── Privacy ── */}
        <View
          onLayout={(e) => {
            sectionRefs.current.privacy = e.nativeEvent.layout.y;
          }}
        >
          <PrivacySection
            privacy={user.donor_privacy_settings}
            contacts={user.user_contacts.map(toContactVM)}
            onPrivacyChange={handlePrivacyChange}
            /**
             * PrivacySection calls onContactsChange with the full local array whenever
             * anything changes (add / delete / toggle). We intercept by passing granular
             * callbacks via a bridging wrapper below.
             *
             * Because PrivacySection doesn't expose separate add/delete/togglePublic
             * callbacks, we compare the incoming array with the current state to detect
             * what changed and fire the right API call.
             */
            onContactsChange={async (updated) => {
              const current = user.user_contacts.map(toContactVM);

              // Detect addition (new item has a temp id starting with "con-")
              const added = updated.find(
                (u) => !current.some((c) => c.id === u.id),
              );
              if (added) {
                try {
                  await handleContactAdd({
                    type: added.type,
                    title: added.title,
                    value: added.value,
                    is_public: added.is_public,
                  });
                } catch {
                  /* handleContactAdd already shows an alert */
                }
                return;
              }

              // Detect deletion
              const removed = current.find(
                (c) => !updated.some((u) => u.id === c.id),
              );
              if (removed) {
                await handleContactDelete(removed.id);
                return;
              }

              // Detect is_public toggle
              const toggled = updated.find((u) => {
                const orig = current.find((c) => c.id === u.id);
                return orig && orig.is_public !== u.is_public;
              });
              if (toggled) {
                await handleContactTogglePublic(toggled.id, toggled.is_public);
              }
            }}
            colors={colors}
          />
        </View>

        {/* ── Blood requests ── */}
        {/* NEED_API: Replace static blood_requests with GET /blood-requests?user_id=:id */}
        <View
          onLayout={(e) => {
            sectionRefs.current.requests = e.nativeEvent.layout.y;
          }}
        >
          <MyBloodRequestsSection
            requests={
              bloodReq /* NEED_API: populate from /blood-requests endpoint */
            }
            onStatusChange={handleBloodRequestStatusChange}
            colors={colors}
            onRefreah={() => {
              loadBloodReq();
            }}
            onDelete={() => {
              loadBloodReq();
            }}
          />
        </View>

        {/* ── Account ── */}
        <View
          onLayout={(e) => {
            sectionRefs.current.account = e.nativeEvent.layout.y;
          }}
        >
          <AccountSection
            locations={user.user_locations.map(toLocationVM)}
            onLocationsChange={async (updated) => {
              const current = user.user_locations.map(toLocationVM);

              // Detect primary change
              const newPrimary = updated.find((u) => {
                const orig = current.find((c) => c.id === u.id);
                return orig && !orig.is_primary && u.is_primary;
              });
              if (newPrimary) {
                await handleLocationSetPrimary(newPrimary.id);
                return;
              }

              // Detect deletion
              const removed = current.find(
                (c) => !updated.some((u) => u.id === c.id),
              );
              if (removed) {
                await handleLocationDelete(removed.id);
              }
            }}
            onChangePassword={handleChangePassword}
            onDeactivate={handleDeactivate}
            onDeleteAccount={handleDeleteAccount}
            onLogout={handleLogout}
            colors={colors}
          />
        </View>

        <View style={{ height: moderateScale(60) }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const createStyles = (colors: ThemeColors) =>
  ScaledSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.bodyBackground,
    },
    tabBar: {
      flexDirection: "row",
      backgroundColor: colors.secondBackgroundColor,
      borderBottomWidth: 1,
      borderBottomColor: colors.cardBorderColor,
      paddingVertical: "6@ms",
      paddingHorizontal: "8@ms",
      gap: "4@ms",
    },
    tabItem: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: "8@ms",
      borderRadius: "10@ms",
    },
    tabItemActive: {
      backgroundColor: withOpacity("#E53935", 0.1),
    },
    scroll: { flex: 1 },
    scrollContent: {
      paddingHorizontal: "13@ms",
      paddingTop: "8@ms",
    },
    verifyBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: "10@ms",
      backgroundColor: withOpacity("#F9A825", 0.1),
      borderRadius: "12@ms",
      borderWidth: 1,
      borderColor: withOpacity("#F9A825", 0.25),
      padding: "12@ms",
      marginBottom: "12@ms",
    },
    suspendedBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: "10@ms",
      backgroundColor: withOpacity("#E53935", 0.08),
      borderRadius: "12@ms",
      borderWidth: 1,
      borderColor: withOpacity("#E53935", 0.2),
      padding: "12@ms",
      marginBottom: "12@ms",
    },
  });
