import Avatar from "@/components/Avatar";
import { StyledText } from "@/components/StyledText";
import { ThemeColors } from "@/constants/themeCollorConstant";
import { useTheme } from "@/hooks/theme/ThemeContext";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  TouchableOpacity,
  View,
  Platform,
  Linking,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { moderateScale, ScaledSheet } from "react-native-size-matters";
import { WebView } from "react-native-webview";
import * as Clipboard from "expo-clipboard";
import { Entypo, MaterialCommunityIcons } from "@expo/vector-icons";
import { withOpacity } from "@/helpers/withOpacity";
import * as Progress from "react-native-progress";
import { BloodRequest, BloodRequestRequester } from "@/context/BloodReqContext";
import { useAuth } from "@/context/AuthContext";
import { envVars } from "@/config/envVars";
import apiClient from "@/config/client";

interface BloodRequestCardProps {
  request: BloodRequest;
  avatarUrl?: string;
  onRefresh: VoidFunction;
}

// ─── Contact type → icon + label + action ────────────────────────────────────
type ContactType = "phone" | "email" | "website" | "social";

const CONTACT_META: Record<
  ContactType,
  {
    icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
    color: string;
    label: string;
    scheme: (value: string) => string;
  }
> = {
  phone: {
    icon: "phone",
    color: "#2eb97b",
    label: "Phone",
    scheme: (v) => `tel:${v}`,
  },
  email: {
    icon: "email-outline",
    color: "#1976d2",
    label: "Email",
    scheme: (v) => `mailto:${v}`,
  },
  website: {
    icon: "web",
    color: "#7c3aed",
    label: "Website",
    scheme: (v) => (v.startsWith("http") ? v : `https://${v}`),
  },
  social: {
    icon: "share-variant-outline",
    color: "#e53935",
    label: "Social",
    scheme: (v) => (v.startsWith("http") ? v : `https://${v}`),
  },
};

// ─── ContactModal ─────────────────────────────────────────────────────────────
interface ContactModalProps {
  visible: boolean;
  onClose: () => void;
  requester: BloodRequestRequester;
  colors: ThemeColors;
}

const ContactModal = ({
  visible,
  onClose,
  requester,
  colors,
}: ContactModalProps) => {
  // Only show contacts that are marked public
  const publicContacts =
    requester.user_contacts?.filter((c) => c.is_public) ?? [];
  const hasContacts = publicContacts.length > 0;

  const handleOpen = (type: ContactType, value: string) => {
    const url = CONTACT_META[type].scheme(value);
    Linking.canOpenURL(url)
      .then((ok) => {
        if (ok) Linking.openURL(url);
        else Alert.alert("Cannot open", `Unable to open: ${value}`);
      })
      .catch(() => Alert.alert("Error", "Something went wrong."));
  };

  const handleCopy = async (value: string) => {
    await Clipboard.setStringAsync(value);
    Alert.alert("Copied", "Contact info copied to clipboard.");
  };

  const fullName = [requester.f_name, requester.l_name]
    .filter(Boolean)
    .join(" ");

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <Pressable
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.55)",
          justifyContent: "flex-end",
        }}
        onPress={onClose}
      >
        {/* Sheet — Pressable inside prevents backdrop tap from bubbling up */}
        <Pressable
          style={{
            backgroundColor: colors.secondBackgroundColor,
            borderTopLeftRadius: moderateScale(24),
            borderTopRightRadius: moderateScale(24),
            borderWidth: 1,
            borderBottomWidth: 0,
            borderColor: colors.cardBorderColor,
            paddingBottom: moderateScale(36),
            maxHeight: "75%",
          }}
          onPress={() => {}} // swallow tap so sheet doesn't close on inner press
        >
          {/* Drag handle */}
          <View
            style={{
              alignSelf: "center",
              width: moderateScale(40),
              height: moderateScale(4),
              borderRadius: 2,
              backgroundColor: colors.cardBorderColor,
              marginTop: moderateScale(12),
              marginBottom: moderateScale(20),
            }}
          />

          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: moderateScale(20),
              marginBottom: moderateScale(20),
            }}
          >
            <View style={{ gap: moderateScale(2) }}>
              <StyledText
                style={{
                  fontSize: moderateScale(17),
                  fontWeight: "700",
                  color: colors.textColor,
                }}
              >
                Contact Info
              </StyledText>
              <StyledText
                style={{
                  fontSize: moderateScale(12),
                  color: colors.thirdTextColor,
                }}
              >
                {fullName}
                {requester.blood_group_name
                  ? `  ·  ${requester.blood_group_name}`
                  : ""}
              </StyledText>
            </View>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={10}
              style={{
                backgroundColor: colors.thirdBackgroundColor,
                borderRadius: moderateScale(20),
                padding: moderateScale(6),
              }}
            >
              <Entypo
                name="cross"
                size={moderateScale(18)}
                color={colors.textColor}
              />
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View
            style={{
              height: 1,
              backgroundColor: colors.cardBorderColor,
              marginHorizontal: moderateScale(20),
              marginBottom: moderateScale(16),
            }}
          />

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: moderateScale(20),
              gap: moderateScale(10),
            }}
          >
            {hasContacts ? (
              publicContacts.map((contact) => {
                const meta =
                  CONTACT_META[contact.type as ContactType] ??
                  CONTACT_META.social;
                return (
                  <View
                    key={contact._id}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: colors.thirdBackgroundColor,
                      borderRadius: moderateScale(14),
                      borderWidth: 1,
                      borderColor: colors.cardBorderColor,
                      padding: moderateScale(14),
                      gap: moderateScale(14),
                    }}
                  >
                    {/* Icon badge */}
                    <View
                      style={{
                        width: moderateScale(42),
                        height: moderateScale(42),
                        borderRadius: moderateScale(12),
                        backgroundColor: withOpacity(meta.color, 0.12),
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <MaterialCommunityIcons
                        name={meta.icon}
                        size={moderateScale(20)}
                        color={meta.color}
                      />
                    </View>

                    {/* Label + value */}
                    <View style={{ flex: 1 }}>
                      <StyledText
                        style={{
                          fontSize: moderateScale(10),
                          color: colors.thirdTextColor,
                          fontWeight: "600",
                          textTransform: "uppercase",
                          letterSpacing: 0.8,
                          marginBottom: moderateScale(2),
                        }}
                      >
                        {contact.title || meta.label}
                      </StyledText>
                      <StyledText
                        style={{
                          fontSize: moderateScale(13),
                          color: colors.textColor,
                          fontWeight: "500",
                        }}
                        numberOfLines={1}
                      >
                        {contact.value}
                      </StyledText>
                    </View>

                    {/* Action buttons */}
                    <View
                      style={{
                        flexDirection: "row",
                        gap: moderateScale(8),
                        alignItems: "center",
                      }}
                    >
                      {/* Copy */}
                      <TouchableOpacity
                        onPress={() => handleCopy(contact.value)}
                        hitSlop={6}
                        style={{
                          padding: moderateScale(6),
                          borderRadius: moderateScale(8),
                          backgroundColor: withOpacity(
                            colors.secondaryColor,
                            0.1,
                          ),
                        }}
                      >
                        <MaterialCommunityIcons
                          name="content-copy"
                          size={moderateScale(15)}
                          color={colors.secondaryColor}
                        />
                      </TouchableOpacity>

                      {/* Open / dial */}
                      <TouchableOpacity
                        onPress={() =>
                          handleOpen(contact.type as ContactType, contact.value)
                        }
                        hitSlop={6}
                        style={{
                          padding: moderateScale(6),
                          borderRadius: moderateScale(8),
                          backgroundColor: withOpacity(meta.color, 0.12),
                        }}
                      >
                        <MaterialCommunityIcons
                          name="arrow-top-right"
                          size={moderateScale(15)}
                          color={meta.color}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            ) : (
              // ── Empty state ────────────────────────────────────────────────
              <View
                style={{
                  alignItems: "center",
                  paddingVertical: moderateScale(40),
                  gap: moderateScale(12),
                }}
              >
                <View
                  style={{
                    width: moderateScale(64),
                    height: moderateScale(64),
                    borderRadius: moderateScale(32),
                    backgroundColor: withOpacity(colors.thirdTextColor, 0.1),
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <MaterialCommunityIcons
                    name="phone-off"
                    size={moderateScale(28)}
                    color={colors.thirdTextColor}
                  />
                </View>
                <StyledText
                  style={{
                    fontSize: moderateScale(14),
                    fontWeight: "600",
                    color: colors.textColor,
                  }}
                >
                  No contact info available
                </StyledText>
                <StyledText
                  style={{
                    fontSize: moderateScale(12),
                    color: colors.thirdTextColor,
                    textAlign: "center",
                    lineHeight: moderateScale(18),
                    paddingHorizontal: moderateScale(20),
                  }}
                >
                  This requester hasn't shared any public contact details yet.
                </StyledText>
              </View>
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

// ─── BloodRequestCard ─────────────────────────────────────────────────────────
const BloodRequestCard = ({
  request,
  avatarUrl = "https://i.pravatar.cc/150?u=default",
  onRefresh,
}: BloodRequestCardProps) => {
  const { userData } = useAuth();
  const postUserData = request.user_id as BloodRequestRequester;
  // console.log("# user: ", userData)
  // console.log("# post user: ", postUserData);
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [showFullDesc, setShowFullDesc] = useState(false);
  const [contactVisible, setContactVisible] = useState(false);

  const lat = request.lat;
  const lng = request.lng;

  const date = new Date(request.created_at).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });

  const openInMaps = () => {
    const label = "Blood Request Location";
    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${lat},${lng}`,
      android: `geo:${lat},${lng}?q=${lat},${lng}(${label})`,
    });
    const browserUrl = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}&zoom=16`;

    Linking.canOpenURL(url!)
      .then((supported) =>
        supported ? Linking.openURL(url!) : Linking.openURL(browserUrl),
      )
      .catch(() => Alert.alert("Error", "Could not open maps application."));
  };

  const mapHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100vh; }
  </style>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    var map = L.map('map', {
      zoomControl: false, attributionControl: false,
      dragging: false, touchZoom: false, scrollWheelZoom: false,
      doubleClickZoom: false, boxZoom: false, keyboard: false
    }).setView([${lat}, ${lng}], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
    L.circleMarker([${lat}, ${lng}], {
      radius: 18, color: '#e53935', fillColor: '#e53935', fillOpacity: 0.15, weight: 2
    }).addTo(map);
    L.circleMarker([${lat}, ${lng}], {
      radius: 9, color: '#ffffff', fillColor: '#e53935', fillOpacity: 1, weight: 3
    }).addTo(map);
    setTimeout(function() { map.invalidateSize(); }, 300);
    setTimeout(function() { map.invalidateSize(); }, 1000);
  </script>
</body>
</html>`;

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(request.description);
  };

  const isValidRequestToDonate =
    (userData._id != postUserData._id &&
      userData.blood_group_name === request.blood_group_name) ??
    false;

  // console.log(isValidRequestToDonate);
  // console.log("Id: ", userData._id, "  ", postUserData._id);
  // console.log(
  //   "Blood type: ",
  //   userData.blood_group_name,
  //   "  ",
  //   request.blood_group_name,
  // );
  // console.log(userData);
  // Donation
  const [donating, setDonating] = useState(false);
  const [donateModal, setDonateModal] = useState(false);
  const [units, setUnits] = useState("1");
  const [donateError, setDonateError] = useState<string | null>(null);
  const [donateSuccess, setDonateSuccess] = useState(false);

  const handleDonate = async () => {
    const parsedUnits = parseInt(units, 10);
    if (!parsedUnits || parsedUnits < 1) {
      setDonateError("Please enter a valid number of units.");
      return;
    }
    try {
      setDonating(true);
      setDonateError(null);
      await apiClient.post(
        "/donations",
        {
          blood_request_id: request._id,
          units: parsedUnits,
        },
        {
          headers: {
            userId: userData._id,
          },
        },
      );
      setDonateSuccess(true);
      onRefresh();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to register donation.";
      setDonateError(msg);
    } finally {
      setDonating(false);
    }
  };

  const closeDonateModal = () => {
    setDonateModal(false);
    setDonateError(null);
    setDonateSuccess(false);
    setUnits("1");
  };

  return (
    <>
      <View style={styles.card}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Avatar
              imageUrl={
                postUserData.user_image?.link
                  ? `${envVars.BASE_URL}/image${postUserData.user_image?.link}`
                  : avatarUrl
              }
            />
            <View style={styles.userInfo}>
              <StyledText style={styles.userName}>
                {[postUserData.f_name, postUserData.l_name]
                  .filter(Boolean)
                  .join(" ")}
              </StyledText>
              <StyledText style={styles.date}>{date}</StyledText>
            </View>
          </View>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: moderateScale(10),
            }}
          >
            <StyledText
              style={{
                paddingVertical: moderateScale(4),
                paddingHorizontal: moderateScale(12),
                backgroundColor: withOpacity("#e53935", 0.15),
                color: "red",
                borderRadius: moderateScale(16),
              }}
            >
              {request.blood_group_name}
            </StyledText>
            <Entypo
              name="dots-three-horizontal"
              size={moderateScale(14)}
              color={colors.textColor}
            />
          </View>
        </View>

        {/* ── Description ── */}
        <TouchableOpacity
          onPress={() => setShowFullDesc((p) => !p)}
          onLongPress={() => showFullDesc && copyToClipboard()}
        >
          <View style={styles.descriptionContainer}>
            <StyledText
              style={styles.description}
              numberOfLines={showFullDesc ? undefined : 3}
              ellipsizeMode="tail"
            >
              {request.description}
            </StyledText>
            <TouchableOpacity
              onPress={() => setShowFullDesc((p) => !p)}
              activeOpacity={0.7}
            >
              <StyledText style={styles.moreLess}>
                {showFullDesc
                  ? ""
                  : request.description.length > 20
                    ? "more"
                    : ""}
              </StyledText>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        {/* ── Map ── */}
        <View style={styles.mapContainer}>
          <WebView
            source={{ html: mapHtml }}
            style={{ flex: 1 }}
            javaScriptEnabled
            domStorageEnabled
            originWhitelist={["*"]}
            mixedContentMode="always"
            onError={(e) => console.warn("WebView error:", e.nativeEvent)}
          />
          <TouchableOpacity
            style={styles.openMapsButton}
            onPress={openInMaps}
            activeOpacity={0.85}
          >
            <StyledText style={styles.openMapsText}>📍 Open in Maps</StyledText>
          </TouchableOpacity>
        </View>

        {/* ── Footer actions ── */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: moderateScale(10),
          }}
        >
          {/* Progress */}
          <View
            style={{
              flexDirection: "row",
              gap: moderateScale(5),
              alignItems: "center",
            }}
          >
            <Progress.Bar
              progress={
                request.units_required > 0
                  ? request.qty / request.units_required
                  : 0
              }
              height={moderateScale(6.5)}
              width={moderateScale(120)}
              borderWidth={0.3}
              unfilledColor={colors.bodyBackground}
              color={colors.secondaryColor}
              borderColor={colors.secondaryColor}
            />
            <StyledText
              style={{
                fontSize: moderateScale(12, 0.3),
                fontWeight: "bold",
                color: colors.thirdTextColor,
              }}
            >
              {request.qty}/{request.units_required}
            </StyledText>
          </View>

          {/* Buttons */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: moderateScale(10),
            }}
          >
            {/* Donate */}
            <TouchableOpacity
              style={{
                backgroundColor: !isValidRequestToDonate
                  ? withOpacity("#e53935", 0.3)
                  : "#e53935",
                paddingVertical: moderateScale(4),
                paddingHorizontal: moderateScale(8),
                borderRadius: moderateScale(6),
              }}
              disabled={!isValidRequestToDonate}
              onPress={() => setDonateModal(true)}
            >
              <StyledText
                style={{
                  color: "white",
                  fontSize: moderateScale(10, 0.3),
                  fontWeight: "bold",
                }}
              >
                Donate
              </StyledText>
            </TouchableOpacity>

            {/* Contact */}
            <TouchableOpacity
              style={{
                backgroundColor: colors.secondaryColor,
                paddingVertical: moderateScale(4),
                paddingHorizontal: moderateScale(8),
                borderRadius: moderateScale(6),
              }}
              onPress={() => setContactVisible(true)}
            >
              <StyledText
                style={{
                  color: "white",
                  fontSize: moderateScale(10, 0.3),
                  fontWeight: "bold",
                }}
              >
                Contact
              </StyledText>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ── Contact bottom sheet ── */}
      <ContactModal
        visible={contactVisible}
        onClose={() => setContactVisible(false)}
        requester={postUserData}
        colors={colors}
      />
      {/* Donation Modal */}
      <Modal
        visible={donateModal}
        transparent
        animationType="slide"
        onRequestClose={closeDonateModal}
        statusBarTranslucent
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.55)",
            justifyContent: "flex-end",
          }}
          onPress={closeDonateModal}
        >
          <Pressable
            style={{
              backgroundColor: colors.secondBackgroundColor,
              borderTopLeftRadius: moderateScale(24),
              borderTopRightRadius: moderateScale(24),
              borderWidth: 1,
              borderBottomWidth: 0,
              borderColor: colors.cardBorderColor,
              padding: moderateScale(24),
              paddingBottom: moderateScale(40),
              gap: moderateScale(16),
            }}
            onPress={() => {}}
          >
            {/* Drag handle */}
            <View
              style={{
                alignSelf: "center",
                width: moderateScale(40),
                height: moderateScale(4),
                borderRadius: 2,
                backgroundColor: colors.cardBorderColor,
                marginBottom: moderateScale(4),
              }}
            />

            {donateSuccess ? (
              // ── Success state ──
              <View
                style={{
                  alignItems: "center",
                  gap: moderateScale(12),
                  paddingVertical: moderateScale(20),
                }}
              >
                <MaterialCommunityIcons
                  name="check-circle"
                  size={moderateScale(52)}
                  color="#2eb97b"
                />
                <StyledText
                  style={{
                    fontSize: moderateScale(16),
                    fontWeight: "700",
                    color: colors.textColor,
                  }}
                >
                  Donation Registered!
                </StyledText>
                <StyledText
                  style={{
                    fontSize: moderateScale(13),
                    color: colors.secondaryTextColor,
                    textAlign: "center",
                  }}
                >
                  Thank you for pledging to donate. The requester will be
                  notified.
                </StyledText>
                <TouchableOpacity
                  onPress={closeDonateModal}
                  style={{
                    marginTop: moderateScale(8),
                    backgroundColor: "#2eb97b",
                    paddingHorizontal: moderateScale(32),
                    paddingVertical: moderateScale(10),
                    borderRadius: moderateScale(20),
                  }}
                >
                  <StyledText
                    style={{
                      color: "#fff",
                      fontWeight: "700",
                      fontSize: moderateScale(13),
                    }}
                  >
                    Done
                  </StyledText>
                </TouchableOpacity>
              </View>
            ) : (
              // ── Form state ──
              <>
                <StyledText
                  style={{
                    fontSize: moderateScale(17),
                    fontWeight: "700",
                    color: colors.textColor,
                  }}
                >
                  Donate Blood
                </StyledText>
                <StyledText
                  style={{
                    fontSize: moderateScale(13),
                    color: colors.secondaryTextColor,
                  }}
                >
                  Request: {request.blood_group_name} · {request.units_required}{" "}
                  units needed
                </StyledText>

                {/* Units input */}
                <View style={{ gap: moderateScale(6) }}>
                  <StyledText
                    style={{
                      fontSize: moderateScale(12),
                      color: colors.thirdTextColor,
                      fontWeight: "600",
                    }}
                  >
                    UNITS YOU CAN DONATE
                  </StyledText>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      borderWidth: 1,
                      borderColor: donateError
                        ? "#e53935"
                        : colors.cardBorderColor,
                      borderRadius: moderateScale(10),
                      backgroundColor: colors.thirdBackgroundColor,
                      paddingHorizontal: moderateScale(14),
                    }}
                  >
                    <TextInput
                      value={units}
                      onChangeText={(v) => {
                        setUnits(v.replace(/[^0-9]/g, ""));
                        setDonateError(null);
                      }}
                      keyboardType="number-pad"
                      maxLength={2}
                      style={{
                        flex: 1,
                        fontSize: moderateScale(16),
                        color: colors.textColor,
                        paddingVertical: moderateScale(12),
                      }}
                      placeholderTextColor={colors.secondaryTextColor}
                      placeholder="e.g. 1"
                    />
                    <StyledText
                      style={{
                        color: colors.secondaryTextColor,
                        fontSize: moderateScale(13),
                      }}
                    >
                      unit{parseInt(units) !== 1 ? "s" : ""}
                    </StyledText>
                  </View>
                  {donateError && (
                    <StyledText
                      style={{ fontSize: moderateScale(11), color: "#e53935" }}
                    >
                      {donateError}
                    </StyledText>
                  )}
                </View>

                {/* Action buttons */}
                <View
                  style={{
                    flexDirection: "row",
                    gap: moderateScale(10),
                    marginTop: moderateScale(4),
                  }}
                >
                  <TouchableOpacity
                    onPress={closeDonateModal}
                    style={{
                      flex: 1,
                      paddingVertical: moderateScale(12),
                      borderRadius: moderateScale(10),
                      borderWidth: 1,
                      borderColor: colors.cardBorderColor,
                      alignItems: "center",
                    }}
                  >
                    <StyledText
                      style={{
                        color: colors.secondaryTextColor,
                        fontWeight: "600",
                      }}
                    >
                      Cancel
                    </StyledText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleDonate}
                    disabled={donating}
                    style={{
                      flex: 2,
                      paddingVertical: moderateScale(12),
                      borderRadius: moderateScale(10),
                      backgroundColor: donating
                        ? withOpacity("#e53935", 0.5)
                        : "#e53935",
                      alignItems: "center",
                      flexDirection: "row",
                      justifyContent: "center",
                      gap: moderateScale(8),
                    }}
                  >
                    {donating && (
                      <ActivityIndicator size="small" color="#fff" />
                    )}
                    <StyledText
                      style={{
                        color: "#fff",
                        fontWeight: "700",
                        fontSize: moderateScale(13),
                      }}
                    >
                      {donating ? "Submitting…" : "Confirm Donation"}
                    </StyledText>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const createStyles = (colors: ThemeColors) =>
  ScaledSheet.create({
    card: {
      backgroundColor: colors.bodyBackground,
      borderRadius: moderateScale(12),
      borderWidth: moderateScale(0.5),
      borderColor: colors.cardBorderColor,
      marginVertical: moderateScale(12),
      padding: moderateScale(16),
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: moderateScale(12),
    },
    userInfo: {
      marginLeft: moderateScale(12),
    },
    userName: {
      fontSize: moderateScale(16, 0.3),
      fontWeight: "600",
      color: colors.textColor,
    },
    date: {
      fontSize: moderateScale(10, 0.3),
      color: colors.thirdTextColor,
      marginTop: moderateScale(2),
    },
    descriptionContainer: {
      flexDirection: "row",
      alignItems: "flex-end",
      marginBottom: moderateScale(16),
    },
    description: {
      flex: 1,
      fontSize: moderateScale(15, 0.3),
      lineHeight: moderateScale(22),
      color: colors.descriptionTextColor,
      marginRight: moderateScale(8),
    },
    moreLess: {
      color: "#1976d2",
      fontWeight: "600",
      fontSize: moderateScale(14, 0.3),
    },
    mapContainer: {
      borderRadius: moderateScale(8),
      overflow: "hidden",
      height: moderateScale(220),
      position: "relative",
    },
    openMapsButton: {
      position: "absolute",
      bottom: moderateScale(10),
      right: moderateScale(10),
      backgroundColor: "rgba(0,0,0,0.65)",
      paddingHorizontal: moderateScale(12),
      paddingVertical: moderateScale(7),
      borderRadius: moderateScale(16),
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.4,
      shadowRadius: 3,
      elevation: 5,
    },
    openMapsText: {
      color: "#ffffff",
      fontSize: 13,
      fontWeight: "600",
    },
  });

export default BloodRequestCard;
