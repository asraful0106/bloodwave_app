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
} from "react-native";
import { moderateScale, ScaledSheet } from "react-native-size-matters";
import { WebView } from "react-native-webview";
import * as Clipboard from "expo-clipboard";

interface BloodRequest {
  lat: number;
  lan: number;
  created_at: string;
  description: string;
}

interface BloodRequestCardProps {
  request: BloodRequest;
  avatarUrl?: string;
}

const BloodRequestCard = ({
  request,
  avatarUrl = "https://i.pravatar.cc/150?u=default",
}: BloodRequestCardProps) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [showFullDesc, setShowFullDesc] = useState(false);

  const lat = request.lat;
  const lng = request.lan;

  const date = new Date(request.created_at).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });

  // ── Opens the phone's native maps app ──────────────────────────────────────
  const openInMaps = () => {
    const label = "Blood Request Location";

    // iOS → Apple Maps, Android → Google Maps / any installed maps app
    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${lat},${lng}`,
      android: `geo:${lat},${lng}?q=${lat},${lng}(${label})`,
    });

    // Fallback: open in browser if no maps app found
    const browserUrl = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}&zoom=16`;

    Linking.canOpenURL(url!)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url!);
        } else {
          Linking.openURL(browserUrl);
        }
      })
      .catch(() => {
        Alert.alert("Error", "Could not open maps application.");
      });
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
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      touchZoom: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false
    }).setView([${lat}, ${lng}], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    L.circleMarker([${lat}, ${lng}], {
      radius: 18,
      color: '#e53935',
      fillColor: '#e53935',
      fillOpacity: 0.15,
      weight: 2
    }).addTo(map);

    L.circleMarker([${lat}, ${lng}], {
      radius: 9,
      color: '#ffffff',
      fillColor: '#e53935',
      fillOpacity: 1,
      weight: 3
    }).addTo(map);

    setTimeout(function() { map.invalidateSize(); }, 300);
    setTimeout(function() { map.invalidateSize(); }, 1000);
  </script>
</body>
</html>
  `;
  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(request.description);
  };

  return (
    <View style={styles.card}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Avatar imageUrl={avatarUrl} />
        <View style={styles.userInfo}>
          <StyledText style={styles.userName}>User Name</StyledText>
          <StyledText style={styles.date}>{date}</StyledText>
        </View>
      </View>

      {/* ── Description ── */}
      <TouchableOpacity
        onPress={() => {
          // if (showFullDesc) {
          //   setShowFullDesc((p) => !p);
          // }
          setShowFullDesc((p) => !p);
        }}
        onLongPress={() => {
          if(showFullDesc){
            copyToClipboard();
          }
        }}
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
              {showFullDesc ? "" : "more"}
            </StyledText>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {/* ── Map ── */}
      <View style={styles.mapContainer}>
        <WebView
          source={{ html: mapHtml }}
          style={{ flex: 1 }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          originWhitelist={["*"]}
          mixedContentMode="always"
          onError={(e) => console.warn("WebView error:", e.nativeEvent)}
        />

        {/* ── Open in Maps button overlaid on the map ── */}
        <TouchableOpacity
          style={styles.openMapsButton}
          onPress={openInMaps}
          activeOpacity={0.85}
        >
          <StyledText style={styles.openMapsText}>📍 Open in Maps</StyledText>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  ScaledSheet.create({
    card: {
      backgroundColor: "#ffffff",
      borderRadius: moderateScale(12),
      borderWidth: moderateScale(0.5),
      borderColor: colors.cardBorderColor,
      marginVertical: moderateScale(12),
      padding: moderateScale(16),
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
    },
    userInfo: {
      marginLeft: 12,
      flex: 1,
    },
    userName: {
      fontSize: 16,
      fontWeight: "600",
      color: "#1a1a1a",
    },
    date: {
      fontSize: 13,
      color: "#757575",
      marginTop: 2,
    },
    descriptionContainer: {
      flexDirection: "row",
      alignItems: "flex-end",
      marginBottom: 16,
    },
    description: {
      flex: 1,
      fontSize: 15,
      lineHeight: 22,
      color: "#333",
      marginRight: 8,
    },
    moreLess: {
      color: "#1976d2",
      fontWeight: "600",
      fontSize: 14,
    },
    mapContainer: {
      borderRadius: 8,
      overflow: "hidden",
      height: 220,
      position: "relative",
    },
    openMapsButton: {
      position: "absolute",
      bottom: 10,
      right: 10,
      backgroundColor: "rgba(0, 0, 0, 0.65)",
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 20,
      // subtle shadow so it pops over the map
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
