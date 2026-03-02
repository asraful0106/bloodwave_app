/**
 * Profile.tsx  — Main profile page
 *
 * Orchestrates all sub-components:
 *   ProfileHeader        → avatar, name, blood group, donor toggle
 *   PersonalInfoSection  → edit personal details
 *   PrivacySection       → privacy toggles + contacts
 *   MyBloodRequestsSection → manage own blood requests
 *   AccountSection       → password, locations, danger zone
 *
 * Fake data: @/assets/fakeData/myProfile.json
 * To switch to real API: replace the loadData() body — shape is identical.
 *
 * Real-life cases handled at page level:
 *  ✅ Loading skeleton
 *  ✅ Error + retry
 *  ✅ Unverified email banner (action to resend verification)
 *  ✅ Suspended account banner
 *  ✅ Section tab navigation (scroll to section)
 *  ✅ Avatar update (placeholder — swap with image picker)
 */

import profileData from "@/assets/fakeData/myProfile.json";
import { StyledText } from "@/components/StyledText";
import { ThemeColors } from "@/constants/themeCollorConstant";
import { withOpacity } from "@/helpers/withOpacity";
import { useTheme } from "@/hooks/theme/ThemeContext";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useRef, useState } from "react";
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

// ─── Types (DB schema) ──────────────────────────────────────────────────────

interface UserImage { id: string; user_id: string; link: string; provider: string; is_primary: boolean; meta: any; }
interface DonorProfile { id: string; user_id: string; is_available: boolean; inactive_until: string | null; last_donation_date: string | null; next_eligible_date: string | null; total_donations: number; }
interface PrivacySettings { id: string; user_id: string; show_name: boolean; show_gender: boolean; show_age: boolean; show_phone: boolean; show_last_donation: boolean; emergency_only: boolean; allow_inapp_call: boolean; allow_chat: boolean; }
interface UserLocation { id: string; user_id: string; address_text: string; city: string | null; lat: number; lng: number; is_primary: boolean; }
interface UserContact { id: string; user_id: string; type: "phone" | "website" | "social"; title: string; value: string; is_public: boolean; }
interface BloodRequest { id: string; user_id: string; blood_group_name: string; description: string; units_required: number; units_fulfilled: number; urgency_level: "NORMAL" | "URGENT" | "EMERGENCY"; patient_type: string; needed_by: string; status: "OPEN" | "FULFILLED" | "CANCELLED" | "EXPIRED"; share_token: string | null; created_at: string; location_label: string; donors_count: number; }
interface User { id: string; f_name: string; l_name: string; phone: string; email: string; user_role: string; gender: "MALE" | "FEMALE" | "OTHER"; date_of_birth: string; blood_group_id: string; blood_group_name: string; is_verified: boolean; status: string; created_by: string; institution_id: string | null; created_at: string; updated_at: string; }

interface ProfileData {
  user: User;
  user_image: UserImage | null;
  donor_profile: DonorProfile;
  donor_privacy_settings: PrivacySettings;
  user_locations: UserLocation[];
  user_contacts: UserContact[];
  blood_requests: BloodRequest[];
}

// ─── Section tabs ────────────────────────────────────────────────────────────

const TABS = [
  { key: "info", label: "Info", icon: "account" },
  { key: "privacy", label: "Privacy", icon: "shield-account" },
  { key: "requests", label: "Requests", icon: "water" },
  { key: "account", label: "Account", icon: "cog" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

// ─── Main component ──────────────────────────────────────────────────────────

export default function Profile() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const scrollRef = useRef<ScrollView>(null);

  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("info");
  const sectionRefs = useRef<Record<TabKey, number>>({ info: 0, privacy: 0, requests: 0, account: 0 });

  // ── Load data (replace with real API) ──────────────────────────────────
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      await new Promise((r) => setTimeout(r, 1000)); // simulate network
      // ✅ Replace with: const res = await fetch('/api/profile'); const d = await res.json();
      setData(profileData as ProfileData);
    } catch {
      setError("Could not load your profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const scrollToSection = (key: TabKey) => {
    setActiveTab(key);
    const y = sectionRefs.current[key];
    scrollRef.current?.scrollTo({ y: y - moderateScale(60), animated: true });
  };

  // ── Handlers (in real app these call the API) ──────────────────────────

  const handleAvatarEdit = () => {
    Alert.alert("Change Photo", "Choose an option", [
      { text: "Take Photo", onPress: () => Alert.alert("Camera — integrate expo-image-picker") },
      { text: "Choose from Gallery", onPress: () => Alert.alert("Gallery — integrate expo-image-picker") },
      { text: "Remove Photo", style: "destructive", onPress: () => Alert.alert("Photo removed") },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleToggleAvailability = (next: boolean) => {
    if (!data) return;
    setData((p) => p ? { ...p, donor_profile: { ...p.donor_profile, is_available: next } } : p);
    // API: PATCH /donor-profile { is_available: next }
  };

  const handleSavePersonalInfo = (updated: Partial<User>) => {
    if (!data) return;
    setData((p) => p ? { ...p, user: { ...p.user, ...updated } } : p);
    // API: PATCH /users/:id { ...updated }
  };

  const handlePrivacyChange = (updated: PrivacySettings) => {
    if (!data) return;
    setData((p) => p ? { ...p, donor_privacy_settings: updated } : p);
    // API: PATCH /donor-privacy-settings/:id { ...updated }
  };

  const handleContactsChange = (updated: UserContact[]) => {
    if (!data) return;
    setData((p) => p ? { ...p, user_contacts: updated } : p);
    // API: PUT /user-contacts (full replacement or individual PATCH/DELETE)
  };

  const handleBloodRequestStatusChange = (id: string, status: BloodRequest["status"]) => {
    if (!data) return;
    setData((p) => p ? { ...p, blood_requests: p.blood_requests.map(r => r.id === id ? { ...r, status } : r) } : p);
    // API: PATCH /blood-requests/:id { status }
  };

  const handleLocationsChange = (updated: UserLocation[]) => {
    if (!data) return;
    setData((p) => p ? { ...p, user_locations: updated } : p);
  };

  const handleChangePassword = async (current: string, next: string): Promise<boolean> => {
    await new Promise((r) => setTimeout(r, 600));
    // API: POST /auth/change-password { current_password, new_password }
    return current.length > 0; // mock: always succeeds if current is non-empty
  };

  const handleDeactivate = () => {
    Alert.alert("Account deactivated. (Mock)");
    // API: POST /auth/deactivate
  };

  const handleDeleteAccount = () => {
    Alert.alert("Account deleted. (Mock)");
    // API: DELETE /users/:id
  };

  const handleLogout = () => {
    Alert.alert("Logged out. (Mock)");
    // Clear auth tokens, navigate to login
  };

  // ── Loading state ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={[styles.root, { alignItems: "center", justifyContent: "center" }]}>
        <ActivityIndicator size="large" color="#E53935" />
        <StyledText style={{ color: colors.thirdTextColor, marginTop: moderateScale(12), fontSize: moderateScale(13, 0.3) }}>
          Loading your profile…
        </StyledText>
      </View>
    );
  }

  // ── Error state ─────────────────────────────────────────────────────────
  if (error || !data) {
    return (
      <View style={[styles.root, { alignItems: "center", justifyContent: "center", gap: moderateScale(12), paddingHorizontal: moderateScale(30) }]}>
        <MaterialCommunityIcons name="wifi-off" size={moderateScale(42)} color={colors.thirdTextColor} />
        <StyledText style={{ color: colors.textColor, fontWeight: "700", fontSize: moderateScale(16, 0.3), textAlign: "center" }}>
          Profile unavailable
        </StyledText>
        <StyledText style={{ color: colors.thirdTextColor, fontSize: moderateScale(12, 0.3), textAlign: "center" }}>
          {error ?? "Something went wrong."}
        </StyledText>
        <TouchableOpacity
          onPress={loadData}
          style={{ backgroundColor: "#E53935", paddingHorizontal: moderateScale(28), paddingVertical: moderateScale(12), borderRadius: moderateScale(12) }}
        >
          <StyledText style={{ color: "white", fontWeight: "700", fontSize: moderateScale(13, 0.3) }}>Retry</StyledText>
        </TouchableOpacity>
      </View>
    );
  }

  const openBloodRequests = data.blood_requests.filter(r => r.status === "OPEN").length;

  return (
    <View style={styles.root}>
      {/* Sticky section tab bar */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const badge = tab.key === "requests" && openBloodRequests > 0 ? openBloodRequests : null;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => scrollToSection(tab.key)}
              activeOpacity={0.75}
              style={[styles.tabItem, isActive && styles.tabItemActive]}
            >
              <MaterialCommunityIcons
                name={tab.icon as any}
                size={moderateScale(15)}
                color={isActive ? "#E53935" : colors.thirdTextColor}
              />
              {badge ? (
                <View style={{ position: "absolute", top: -2, right: -4, backgroundColor: "#E53935", borderRadius: 8, minWidth: 14, height: 14, alignItems: "center", justifyContent: "center" }}>
                  <StyledText style={{ color: "white", fontSize: moderateScale(8, 0.3), fontWeight: "800" }}>{badge}</StyledText>
                </View>
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
        {/* Page title */}
        {/* <View style={styles.pageHeader}>
          <View style={{ width: moderateScale(4), height: moderateScale(46), borderRadius: 4, backgroundColor: "#E53935" }} />
          <View>
            <StyledText style={styles.pageTitle}>My Profile</StyledText>
            <StyledText style={styles.pageSub}>Manage your account & preferences</StyledText>
          </View>
        </View> */}

        {/* ── Unverified email banner ── */}
        {!data.user.is_verified && (
          <TouchableOpacity
            onPress={() => Alert.alert("Verification email sent! Check your inbox.")}
            activeOpacity={0.8}
            style={styles.verifyBanner}
          >
            <Feather name="mail" size={moderateScale(16)} color="#F9A825" />
            <View style={{ flex: 1 }}>
              <StyledText style={{ color: "#F9A825", fontWeight: "700", fontSize: moderateScale(12, 0.3) }}>
                Email not verified
              </StyledText>
              <StyledText style={{ color: colors.thirdTextColor, fontSize: moderateScale(10, 0.3) }}>
                Tap to resend verification email
              </StyledText>
            </View>
            <Feather name="chevron-right" size={moderateScale(14)} color="#F9A825" />
          </TouchableOpacity>
        )}

        {/* ── Suspended account banner ── */}
        {data.user.status === "SUSPENDED" && (
          <View style={styles.suspendedBanner}>
            <Feather name="alert-octagon" size={moderateScale(16)} color="#E53935" />
            <View style={{ flex: 1 }}>
              <StyledText style={{ color: "#E53935", fontWeight: "700", fontSize: moderateScale(12, 0.3) }}>
                Account Suspended
              </StyledText>
              <StyledText style={{ color: colors.thirdTextColor, fontSize: moderateScale(10, 0.3) }}>
                Contact support at support@bloodapp.com
              </StyledText>
            </View>
          </View>
        )}

        {/* ── Profile header ── */}
        <ProfileHeader
          user={data.user}
          userImage={data.user_image}
          donorProfile={data.donor_profile}
          onEditAvatar={handleAvatarEdit}
          onToggleAvailability={handleToggleAvailability}
          colors={colors}
        />

        {/* ── Personal info ── */}
        <View
          onLayout={(e) => { sectionRefs.current.info = e.nativeEvent.layout.y; }}
        >
          <PersonalInfoSection
            info={{
              f_name: data.user.f_name,
              l_name: data.user.l_name,
              email: data.user.email,
              phone: data.user.phone,
              gender: data.user.gender,
              date_of_birth: data.user.date_of_birth,
              blood_group_name: data.user.blood_group_name,
              is_verified: data.user.is_verified,
            }}
            onSave={handleSavePersonalInfo}
            colors={colors}
          />
        </View>

        {/* ── Privacy ── */}
        <View
          onLayout={(e) => { sectionRefs.current.privacy = e.nativeEvent.layout.y; }}
        >
          <PrivacySection
            privacy={data.donor_privacy_settings}
            contacts={data.user_contacts}
            onPrivacyChange={handlePrivacyChange}
            onContactsChange={handleContactsChange}
            colors={colors}
          />
        </View>

        {/* ── Blood requests ── */}
        <View
          onLayout={(e) => { sectionRefs.current.requests = e.nativeEvent.layout.y; }}
        >
          <MyBloodRequestsSection
            requests={data.blood_requests}
            onStatusChange={handleBloodRequestStatusChange}
            colors={colors}
          />
        </View>

        {/* ── Account ── */}
        <View
          onLayout={(e) => { sectionRefs.current.account = e.nativeEvent.layout.y; }}
        >
          <AccountSection
            locations={data.user_locations}
            onLocationsChange={handleLocationsChange}
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

// ─── Styles ─────────────────────────────────────────────────────────────────

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
    pageHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: "12@ms",
      marginTop: "16@ms",
      marginBottom: "16@ms",
    },
    pageTitle: {
      fontSize: "22@ms",
      fontWeight: "800",
      color: colors.textColor,
      letterSpacing: -0.3,
    },
    pageSub: {
      fontSize: "11@ms",
      color: colors.thirdTextColor,
      marginTop: "2@ms",
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
