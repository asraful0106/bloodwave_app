/**
 * BloodRequestForm.tsx
 *
 * Map solution — 100% free, zero API cost:
 * - react-native-webview  →  Leaflet + OpenStreetMap (no key)
 * - Nominatim (OSM)       →  place search (no key)
 * - expo-location         →  device GPS
 *
 * Install:
 *   npx expo install expo-location react-native-webview
 *   npx expo install @react-native-community/datetimepicker
 */

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
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { moderateScale, ScaledSheet } from "react-native-size-matters";
import { WebView } from "react-native-webview";
import * as Location from "expo-location";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import {
  TextInputField,
  type TextInputFieldRef,
} from "@/components/TextInputField";
import { ThemeColors } from "@/constants/themeCollorConstant";
import { useTheme } from "@/hooks/theme/ThemeContext";
import { withOpacity } from "@/helpers/withOpacity";
import { Entypo, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  useBloodRequest,
  type CreateBloodRequestPayload,
} from "@/context/BloodReqContext";
import { getUserData, useAuth } from "@/context/AuthContext";

// ─── Urgency colors have no token in ThemeColors so they stay as constants ────
const URGENCY_COLORS = {
  stable: "#2eb97b",
  moderate: "#F9A825",
  critical: "#E53935",
} as const;

// ─── Leaflet HTML ─────────────────────────────────────────────────────────────
const buildLeafletHTML = (
  initLat: number,
  initLng: number,
  colors: ThemeColors,
) => `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body,#map{height:100%;width:100%;background:${colors.bodyBackground}}
  #search-box{position:absolute;top:10px;left:10px;right:10px;z-index:1000;display:flex;gap:6px}
  #search-input{
    flex:1;padding:9px 12px;border-radius:10px;
    border:1px solid ${colors.cardBorderColor};
    background:${colors.thirdBackgroundColor};color:${colors.textColor};
    font-size:13px;outline:none;box-shadow:0 2px 12px rgba(0,0,0,0.15)
  }
  #search-btn{
    padding:9px 14px;border-radius:10px;border:none;
    background:${colors.primaryColor};color:#fff;font-weight:700;cursor:pointer;font-size:13px
  }
  #results{
    position:absolute;top:52px;left:10px;right:10px;z-index:1001;
    background:${colors.secondBackgroundColor};border-radius:10px;overflow:hidden;
    box-shadow:0 4px 20px rgba(0,0,0,0.25);max-height:180px;overflow-y:auto;
    border:1px solid ${colors.cardBorderColor}
  }
  .result-item{
    padding:10px 14px;color:${colors.textColor};font-size:12px;
    cursor:pointer;border-bottom:1px solid ${colors.cardBorderColor}
  }
  .result-item:hover,.result-item:active{background:${colors.thirdBackgroundColor}}
  .leaflet-container{background:${colors.bodyBackground}}
</style>
</head>
<body>
<div id="search-box">
  <input id="search-input" type="text" placeholder="Search location…"/>
  <button id="search-btn" onclick="doSearch()">Go</button>
</div>
<div id="results"></div>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
var map=L.map('map',{zoomControl:true}).setView([${initLat},${initLng}],13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap',maxZoom:19}).addTo(map);
var redIcon=L.divIcon({
  html:'<div style="width:28px;height:28px;border-radius:50% 50% 50% 0;background:${colors.primaryColor};border:3px solid #fff;transform:rotate(-45deg);box-shadow:0 2px 8px rgba(0,0,0,0.4)"></div>',
  iconSize:[28,28],iconAnchor:[14,28],className:''
});
var marker=L.marker([${initLat},${initLng}],{icon:redIcon,draggable:true}).addTo(map);
function sendCoords(lat,lng){
  window.ReactNativeWebView&&window.ReactNativeWebView.postMessage(JSON.stringify({type:'coords',lat:lat,lng:lng}))
}
marker.on('dragend',function(){var p=marker.getLatLng();sendCoords(p.lat,p.lng)});
map.on('click',function(e){marker.setLatLng(e.latlng);sendCoords(e.latlng.lat,e.latlng.lng)});
sendCoords(${initLat},${initLng});
function doSearch(){
  var q=document.getElementById('search-input').value.trim();if(!q)return;
  fetch('https://nominatim.openstreetmap.org/search?format=json&limit=5&q='+encodeURIComponent(q),
    {headers:{'Accept-Language':'en'}})
  .then(r=>r.json()).then(data=>{
    var div=document.getElementById('results');div.innerHTML='';
    if(!data.length){div.innerHTML='<div class="result-item">No results</div>';return}
    data.forEach(function(item){
      var el=document.createElement('div');el.className='result-item';
      el.textContent=item.display_name;
      el.onclick=function(){
        var lat=parseFloat(item.lat),lng=parseFloat(item.lon);
        map.setView([lat,lng],15);marker.setLatLng([lat,lng]);sendCoords(lat,lng);
        div.innerHTML='';document.getElementById('search-input').value=''
      };
      div.appendChild(el)
    })
  }).catch(function(){
    document.getElementById('results').innerHTML='<div class="result-item">Search failed</div>'
  })
}
document.getElementById('search-input').addEventListener('keydown',function(e){if(e.key==='Enter')doSearch()});
document.addEventListener('message',handleRNMsg);window.addEventListener('message',handleRNMsg);
function handleRNMsg(e){
  try{
    var msg=JSON.parse(e.data);
    if(msg.type==='moveTo'){
      map.setView([msg.lat,msg.lng],15);
      marker.setLatLng([msg.lat,msg.lng]);
      sendCoords(msg.lat,msg.lng)
    }
  }catch(ex){}
}
</script>
</body>
</html>
`;

// ─── Types ────────────────────────────────────────────────────────────────────
type BloodType = "O+" | "O-" | "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-";
type UrgencyLevel = 1 | 2 | 3;
// Patient type aligned with backend enum: "adult" | "child"
type PatientType = "adult" | "child";

interface FormState {
  blood_type: BloodType | "";
  description: string;
  units_required: string;
  urgency_level: UrgencyLevel;
  patient_type: PatientType;
  needed_by_datetime: Date | null;
  lat: number | null;
  lng: number | null;
}

// Field-level validation errors shown inline under each input
interface FormErrors {
  blood_type?: string;
  units_required?: string;
  needed_by_datetime?: string;
  location?: string;
  description?: string;
  patient_type?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const makeInputTheme = (colors: ThemeColors) => ({
  backgroundColor: colors.thirdBackgroundColor,
  focusedBackgroundColor: colors.thirdBackgroundColor,
  borderWidth: 1 as const,
  focusedBorderWidth: 1 as const,
  borderColor: colors.cardBorderColor,
  focusedBorderColor: colors.primaryColor,
  inputTextColor: colors.textColor,
  inputTextSize: 14,
  placeholderColor: colors.thirdTextColor,
});

function validate(form: FormState): FormErrors {
  const errs: FormErrors = {};
  if (!form.blood_type) errs.blood_type = "Select a blood type.";
  const units = Number(form.units_required);
  if (!form.units_required || isNaN(units) || units < 1)
    errs.units_required = "Enter a valid number of units (min 1).";
  if (!form.needed_by_datetime)
    errs.needed_by_datetime = "Select a needed-by date and time.";
  else if (form.needed_by_datetime <= new Date())
    errs.needed_by_datetime = "Needed-by date must be in the future.";
  if (!form.lat || !form.lng) errs.location = "Pick a location on the map.";
  return errs;
}

// ─── SectionLabel ─────────────────────────────────────────────────────────────
const SectionLabel = ({
  children,
  colors,
}: {
  children: string;
  colors: ThemeColors;
}) => (
  <Text
    style={{
      fontSize: moderateScale(11),
      fontWeight: "700",
      color: colors.thirdTextColor,
      letterSpacing: 1.2,
      textTransform: "uppercase",
      marginBottom: moderateScale(12),
    }}
  >
    {children}
  </Text>
);

// ─── FieldError — inline error message under an input ─────────────────────────
const FieldError = ({
  message,
  colors,
}: {
  message?: string;
  colors: ThemeColors;
}) => {
  if (!message) return null;
  return (
    <Text
      style={{
        fontSize: moderateScale(11),
        color: URGENCY_COLORS.critical,
        marginTop: moderateScale(4),
        marginLeft: moderateScale(2),
      }}
    >
      {message}
    </Text>
  );
};

// ─── ServerErrorBanner — full-width banner for API errors ─────────────────────
const ServerErrorBanner = ({
  message,
  colors,
  onDismiss,
}: {
  message: string;
  colors: ThemeColors;
  onDismiss: () => void;
}) => (
  <View
    style={{
      backgroundColor: withOpacity(URGENCY_COLORS.critical, 0.1),
      borderWidth: 1,
      borderColor: withOpacity(URGENCY_COLORS.critical, 0.35),
      borderRadius: moderateScale(12),
      padding: moderateScale(12),
      marginBottom: moderateScale(12),
      flexDirection: "row",
      alignItems: "flex-start",
      gap: moderateScale(10),
    }}
  >
    <MaterialCommunityIcons
      name="alert-circle-outline"
      size={moderateScale(18)}
      color={URGENCY_COLORS.critical}
      style={{ marginTop: moderateScale(1) }}
    />
    <Text
      style={{
        flex: 1,
        fontSize: moderateScale(12),
        color: URGENCY_COLORS.critical,
        lineHeight: moderateScale(18),
      }}
    >
      {message}
    </Text>
    <TouchableOpacity onPress={onDismiss} hitSlop={8}>
      <Entypo
        name="cross"
        size={moderateScale(16)}
        color={URGENCY_COLORS.critical}
      />
    </TouchableOpacity>
  </View>
);

// ─── ChipRow ──────────────────────────────────────────────────────────────────
function ChipRow<T extends string>({
  options,
  selected,
  onSelect,
  colors,
  accentColor,
}: {
  options: readonly T[];
  selected: T | "";
  onSelect: (v: T) => void;
  colors: ThemeColors;
  accentColor?: string;
}) {
  const accent = accentColor ?? colors.primaryColor;
  return (
    <View
      style={{ flexDirection: "row", flexWrap: "wrap", gap: moderateScale(8) }}
    >
      {options.map((opt) => {
        const isActive = selected === opt;
        return (
          <TouchableOpacity
            key={opt}
            onPress={() => onSelect(opt)}
            activeOpacity={0.75}
            style={{
              paddingVertical: moderateScale(6),
              paddingHorizontal: moderateScale(14),
              borderRadius: moderateScale(20),
              borderWidth: 1,
              borderColor: isActive ? accent : colors.cardBorderColor,
              backgroundColor: isActive
                ? withOpacity(accent, 0.13)
                : "transparent",
            }}
          >
            <Text
              style={{
                fontSize: moderateScale(13),
                fontWeight: "600",
                color: isActive ? accent : colors.thirdTextColor,
              }}
            >
              {opt}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── UrgencyCard ──────────────────────────────────────────────────────────────
const UrgencyCard = ({
  level,
  selected,
  onSelect,
  colors,
}: {
  level: UrgencyLevel;
  selected: UrgencyLevel;
  onSelect: (v: UrgencyLevel) => void;
  colors: ThemeColors;
}) => {
  const meta = {
    1: {
      label: "Stable",
      sub: "Within a week",
      color: URGENCY_COLORS.stable,
      icon: "●",
    },
    2: {
      label: "Moderate",
      sub: "Within 48 hrs",
      color: URGENCY_COLORS.moderate,
      icon: "◆",
    },
    3: {
      label: "Critical",
      sub: "Immediately",
      color: URGENCY_COLORS.critical,
      icon: "▲",
    },
  }[level];
  const isActive = selected === level;
  return (
    <TouchableOpacity
      onPress={() => onSelect(level)}
      activeOpacity={0.75}
      style={{
        flex: 1,
        alignItems: "center",
        paddingVertical: moderateScale(12),
        borderRadius: moderateScale(12),
        borderWidth: 1,
        borderColor: isActive ? meta.color : colors.cardBorderColor,
        backgroundColor: isActive
          ? withOpacity(meta.color, 0.1)
          : colors.thirdBackgroundColor,
        gap: moderateScale(4),
      }}
    >
      <Text style={{ fontSize: moderateScale(16), color: meta.color }}>
        {meta.icon}
      </Text>
      <Text
        style={{
          fontSize: moderateScale(12),
          fontWeight: "700",
          color: isActive ? meta.color : colors.textColor,
        }}
      >
        {meta.label}
      </Text>
      <Text
        style={{
          fontSize: moderateScale(9),
          color: colors.thirdTextColor,
          textAlign: "center",
        }}
      >
        {meta.sub}
      </Text>
    </TouchableOpacity>
  );
};

// ─── DateTimeInput — native picker via @react-native-community/datetimepicker ─
/**
 * Two-step approach: first show a date picker, then a time picker.
 * Falls back gracefully on Android where they must appear sequentially.
 */
const DateTimeInput = ({
  value,
  onChange,
  colors,
}: {
  value: Date | null;
  onChange: (v: Date) => void;
  colors: ThemeColors;
}) => {
  const [pickerMode, setPickerMode] = useState<"date" | "time" | null>(null);
  // Temporary date to carry the chosen date into the time step on Android
  const pendingDate = useRef<Date | null>(null);

  const display = value
    ? value.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  const handleChange = (_event: DateTimePickerEvent, selected?: Date) => {
    if (!selected) {
      // User dismissed
      setPickerMode(null);
      pendingDate.current = null;
      return;
    }

    if (Platform.OS === "android") {
      if (pickerMode === "date") {
        pendingDate.current = selected;
        setPickerMode("time"); // chain to time picker on Android
      } else {
        // Merge the previously selected date with the chosen time
        const base = pendingDate.current ?? selected;
        const merged = new Date(base);
        merged.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
        onChange(merged);
        setPickerMode(null);
        pendingDate.current = null;
      }
    } else {
      // iOS inline — datetime mode gives a single combined value
      onChange(selected);
    }
  };

  return (
    <>
      <TouchableOpacity
        onPress={() => setPickerMode("date")}
        activeOpacity={0.85}
      >
        <View pointerEvents="none">
          <TextInputField
            {...makeInputTheme(colors)}
            value={display}
            placeholderText="Select date & time"
            leftIcon={{
              name: "calendar-days",
              size: 14,
              color: colors.thirdTextColor,
            }}
            inputContainerStyle={{ borderRadius: moderateScale(10) }}
            editable={false}
          />
        </View>
      </TouchableOpacity>

      {pickerMode !== null && (
        <DateTimePicker
          value={pendingDate.current ?? value ?? new Date()}
          mode={Platform.OS === "ios" ? "datetime" : pickerMode}
          display={Platform.OS === "ios" ? "inline" : "default"}
          minimumDate={new Date()}
          onChange={handleChange}
          // iOS renders inline inside a modal-less view, so we wrap in a
          // lightweight overlay to keep it visually contained
          {...(Platform.OS === "ios" && {
            style: {
              backgroundColor: colors.secondBackgroundColor,
              borderRadius: moderateScale(12),
              marginTop: moderateScale(8),
            },
          })}
        />
      )}
    </>
  );
};

// ─── MapPicker (bottom-sheet overlay) ────────────────────────────────────────
const MapPicker = ({
  lat,
  lng,
  onConfirm,
  onClose,
  colors,
}: {
  lat: number;
  lng: number;
  onConfirm: (lat: number, lng: number) => void;
  onClose: () => void;
  colors: ThemeColors;
}) => {
  const webref = useRef<WebView>(null);
  const [pending, setPending] = useState({ lat, lng });
  const [gpsLoading, setGpsLoading] = useState(false);

  const html = useMemo(() => buildLeafletHTML(lat, lng, colors), [colors]);

  const coordInputTheme = useMemo(
    () => ({
      ...makeInputTheme(colors),
      inputTextColor: colors.secondaryColor,
      inputTextSize: 11,
    }),
    [colors],
  );

  const goToGPS = async () => {
    setGpsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied", "Enable location in settings.");
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const msg = JSON.stringify({
        type: "moveTo",
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
      });
      webref.current?.injectJavaScript(
        `handleRNMsg({data:${JSON.stringify(msg)}});true;`,
      );
    } catch {
      Alert.alert("GPS Error", "Could not get current location.");
    } finally {
      setGpsLoading(false);
    }
  };

  return (
    <View style={StyleSheet.absoluteFill}>
      <Pressable
        style={[
          StyleSheet.absoluteFillObject,
          { backgroundColor: "rgba(0,0,0,0.65)" },
        ]}
        onPress={onClose}
      />
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "75%",
          backgroundColor: colors.secondBackgroundColor,
          borderTopLeftRadius: moderateScale(24),
          borderTopRightRadius: moderateScale(24),
          overflow: "hidden",
          borderWidth: 1,
          borderBottomWidth: 0,
          borderColor: colors.cardBorderColor,
        }}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: moderateScale(16),
            paddingVertical: moderateScale(14),
            borderBottomWidth: 1,
            borderBottomColor: colors.cardBorderColor,
          }}
        >
          <Text
            style={{
              fontSize: moderateScale(16),
              fontWeight: "700",
              color: colors.textColor,
            }}
          >
            Pick Location
          </Text>
          <TouchableOpacity
            onPress={goToGPS}
            disabled={gpsLoading}
            style={{
              backgroundColor: withOpacity(colors.secondaryColor, 0.12),
              paddingHorizontal: moderateScale(12),
              paddingVertical: moderateScale(6),
              borderRadius: moderateScale(20),
            }}
          >
            {gpsLoading ? (
              <ActivityIndicator color={colors.secondaryColor} size="small" />
            ) : (
              <Text
                style={{
                  fontSize: moderateScale(12),
                  color: colors.secondaryColor,
                  fontWeight: "600",
                }}
              >
                📍 My Location
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Leaflet map */}
        <WebView
          ref={webref}
          source={{ html }}
          style={{ flex: 1 }}
          javaScriptEnabled
          domStorageEnabled
          geolocationEnabled
          onMessage={(e) => {
            try {
              const msg = JSON.parse(e.nativeEvent.data);
              if (msg.type === "coords")
                setPending({ lat: msg.lat, lng: msg.lng });
            } catch {}
          }}
        />

        {/* Live coord preview */}
        <View
          style={{
            flexDirection: "row",
            gap: moderateScale(10),
            paddingHorizontal: moderateScale(12),
            paddingVertical: moderateScale(10),
            backgroundColor: colors.thirdBackgroundColor,
            borderTopWidth: 1,
            borderTopColor: colors.cardBorderColor,
          }}
        >
          <View style={{ flex: 1 }}>
            <TextInputField
              {...coordInputTheme}
              value={pending.lat.toFixed(6)}
              leftIcon={{
                name: "location-dot",
                size: 12,
                color: colors.secondaryColor,
              }}
              label={{
                show: true,
                text: "Latitude",
                textColor: colors.thirdTextColor,
                textStyle: { fontSize: moderateScale(10) },
              }}
              height={36}
              inputContainerStyle={{ borderRadius: moderateScale(8) }}
              editable={false}
            />
          </View>
          <View style={{ flex: 1 }}>
            <TextInputField
              {...coordInputTheme}
              value={pending.lng.toFixed(6)}
              leftIcon={{
                name: "location-dot",
                size: 12,
                color: colors.secondaryColor,
              }}
              label={{
                show: true,
                text: "Longitude",
                textColor: colors.thirdTextColor,
                textStyle: { fontSize: moderateScale(10) },
              }}
              height={36}
              inputContainerStyle={{ borderRadius: moderateScale(8) }}
              editable={false}
            />
          </View>
        </View>

        {/* Actions */}
        <View
          style={{
            flexDirection: "row",
            padding: moderateScale(12),
            gap: moderateScale(10),
            backgroundColor: colors.secondBackgroundColor,
          }}
        >
          <TouchableOpacity
            onPress={onClose}
            style={{
              flex: 1,
              paddingVertical: moderateScale(14),
              alignItems: "center",
              borderRadius: moderateScale(12),
              borderWidth: 1,
              borderColor: colors.cardBorderColor,
            }}
          >
            <Text
              style={{
                color: colors.thirdTextColor,
                fontWeight: "600",
                fontSize: moderateScale(14),
              }}
            >
              Cancel
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onConfirm(pending.lat, pending.lng)}
            style={{
              flex: 2,
              paddingVertical: moderateScale(14),
              alignItems: "center",
              borderRadius: moderateScale(12),
              backgroundColor: colors.primaryColor,
              shadowColor: colors.primaryColor,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.35,
              shadowRadius: 8,
              elevation: 6,
            }}
          >
            <Text
              style={{
                color: "#FFFFFF",
                fontWeight: "800",
                fontSize: moderateScale(14),
              }}
            >
              Confirm Location
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function BloodRequestForm() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const inputTheme = useMemo(() => makeInputTheme(colors), [colors]);
  const router = useRouter();

  // ── Context ───────────────────────────────────────────────────────────────
  const { createRequest, loading, error, clearErrors } = useBloodRequest();
  const isSubmitting = loading.create;
  const serverError = error.server;

  const {userData} = useAuth()
  // console.log("User data form req from: ", userData)

  // ── Local form state ──────────────────────────────────────────────────────
  const [form, setForm] = useState<FormState>({
    blood_type: "",
    description: "",
    units_required: "",
    urgency_level: 1,
    patient_type: "adult",
    needed_by_datetime: null,
    lat: null,
    lng: null,
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [showMap, setShowMap] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const unitsRef = useRef<TextInputFieldRef>(null);
  const descRef = useRef<TextInputFieldRef>(null);

  // ── Mount: fade in + silently grab GPS if already permitted ───────────────
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 450,
      useNativeDriver: true,
    }).start();

    (async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status === "granted") {
          const loc = await Location.getCurrentPositionAsync({});
          setForm((f) => ({
            ...f,
            lat: loc.coords.latitude,
            lng: loc.coords.longitude,
          }));
        }
      } catch {}
    })();
  }, []);

  // Clear server error from context when the user edits the form
  useEffect(() => {
    if (serverError) clearErrors();
  }, [form]);

  const update = useCallback(
    <K extends keyof FormState>(key: K, val: FormState[K]) => {
      setForm((f) => ({ ...f, [key]: val }));
      // Clear the field-level error for the changed field on edit
      setFormErrors((e) => ({
        ...e,
        [key === "lat" || key === "lng" ? "location" : key]: undefined,
      }));
    },
    [],
  );

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    // 1. Client-side validation
    const errs = validate(form);
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }
    setFormErrors({});

    // 2. Build payload
    // NOTE: user_id is intentionally omitted here.
    // TODO: inject the authenticated user's ObjectId once auth context is wired.
    const payload: Omit<CreateBloodRequestPayload, "user_id"> & {
      user_id?: string;
    } = {
      user_id: userData._id,
      blood_group_name: form.blood_type as string,
      description: form.description,
      units_required: Number(form.units_required),
      urgency_level: form.urgency_level,
      patient_type: form.patient_type,
      needed_by_datetime: form.needed_by_datetime!.toISOString(),
      lat: form.lat!,
      lng: form.lng!,
      blood_request_status: "pending",
      // user_id: currentUser._id,  ← TODO: uncomment when auth is wired
    };

    // 3. Call context → returns the created doc or null on failure
    const created = await createRequest(payload as CreateBloodRequestPayload);

    // 4. On success navigate to home; on failure the banner renders via context error state
    if (created) {
      if (router.canGoBack()) router.dismiss();
      else router.replace("/(tab)");
    }
  };

  const bloodTypes: BloodType[] = [
    "O+",
    "O-",
    "A+",
    "A-",
    "B+",
    "B-",
    "AB+",
    "AB-",
  ];
  const patientTypes: PatientType[] = ["adult", "child"];

  const close = () => {
    if (router.canGoBack()) router.dismiss();
    else router.replace("/(othersPage)/requestBlood");
  };

  return (
    <View style={styles.root}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* ── Header ── */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                justifyContent: "space-between",
              }}
            >
              <View style={styles.headerRow}>
                <View style={styles.headerAccent} />
                <View>
                  <Text style={styles.headerTitle}>Blood Request</Text>
                  <Text style={styles.headerSub}>
                    Fill details to notify donors nearby
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={close} disabled={isSubmitting}>
                <Entypo
                  name="cross"
                  size={moderateScale(24)}
                  color={colors.textColor}
                />
              </TouchableOpacity>
            </View>

            {/* ── Server error banner ── */}
            {serverError && (
              <ServerErrorBanner
                message={serverError}
                colors={colors}
                onDismiss={clearErrors}
              />
            )}

            {/* ── Blood Type ── */}
            <View
              style={[styles.card, formErrors.blood_type && styles.cardError]}
            >
              <SectionLabel colors={colors}>Blood Type</SectionLabel>
              <ChipRow
                options={bloodTypes}
                selected={form.blood_type}
                onSelect={(v) => update("blood_type", v)}
                colors={colors}
              />
              <FieldError message={formErrors.blood_type} colors={colors} />
            </View>

            {/* ── Urgency ── */}
            <View style={styles.card}>
              <SectionLabel colors={colors}>Urgency Level</SectionLabel>
              <View style={styles.urgencyRow}>
                {([1, 2, 3] as UrgencyLevel[]).map((l) => (
                  <UrgencyCard
                    key={l}
                    level={l}
                    selected={form.urgency_level}
                    onSelect={(v) => update("urgency_level", v)}
                    colors={colors}
                  />
                ))}
              </View>
            </View>

            {/* ── Units + Needed By ── */}
            <View style={styles.twoCol}>
              <View
                style={[
                  styles.card,
                  { flex: 1 },
                  formErrors.units_required && styles.cardError,
                ]}
              >
                <SectionLabel colors={colors}>Units Required</SectionLabel>
                <TextInputField
                  {...inputTheme}
                  ref={unitsRef}
                  value={form.units_required}
                  onChangeText={(v) => update("units_required", String(v))}
                  keyboardType="numeric"
                  placeholderText="e.g. 2"
                  leftIcon={{
                    name: "droplet",
                    size: 13,
                    color: colors.thirdTextColor,
                  }}
                  height={44}
                  inputContainerStyle={{ borderRadius: moderateScale(10) }}
                  returnKeyType="next"
                  onSubmitEditing={() => descRef.current?.focus()}
                  maxLength={3}
                />
                <FieldError
                  message={formErrors.units_required}
                  colors={colors}
                />
              </View>

              <View
                style={[
                  styles.card,
                  { flex: 1 },
                  formErrors.needed_by_datetime && styles.cardError,
                ]}
              >
                <SectionLabel colors={colors}>Needed By</SectionLabel>
                <DateTimeInput
                  value={form.needed_by_datetime}
                  onChange={(v) => update("needed_by_datetime", v)}
                  colors={colors}
                />
                <FieldError
                  message={formErrors.needed_by_datetime}
                  colors={colors}
                />
              </View>
            </View>

            {/* ── Patient Type ── */}
            <View style={styles.card}>
              <SectionLabel colors={colors}>Patient Type</SectionLabel>
              <ChipRow
                options={patientTypes}
                selected={form.patient_type}
                onSelect={(v) => update("patient_type", v)}
                colors={colors}
              />
              <FieldError message={formErrors.patient_type} colors={colors} />
            </View>

            {/* ── Description ── */}
            <View style={styles.card}>
              <SectionLabel colors={colors}>Description</SectionLabel>
              <TextInputField
                {...inputTheme}
                ref={descRef}
                value={form.description}
                onChangeText={(v) => update("description", String(v))}
                placeholderText="Add any extra info for donors…"
                leftIcon={{
                  name: "pen-to-square",
                  size: 13,
                  color: colors.thirdTextColor,
                }}
                height={90}
                multiline
                inputContainerStyle={{
                  borderRadius: moderateScale(10),
                  alignItems: "flex-start",
                  paddingTop: moderateScale(8),
                }}
                inputStyle={{ textAlignVertical: "top" }}
              />
            </View>

            {/* ── Location ── */}
            <View
              style={[styles.card, formErrors.location && styles.cardError]}
            >
              <SectionLabel colors={colors}>Location</SectionLabel>
              <TouchableOpacity
                style={styles.locationBtn}
                onPress={() => setShowMap(true)}
                activeOpacity={0.8}
              >
                <View style={styles.locationLeft}>
                  <Text style={styles.locationPinIcon}>📍</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.locationTitle}>
                      {form.lat ? "Location Selected" : "Tap to pick location"}
                    </Text>
                    {form.lat ? (
                      <View style={styles.coordPair}>
                        <View style={{ flex: 1 }}>
                          <TextInputField
                            {...inputTheme}
                            value={form.lat.toFixed(5)}
                            label={{
                              show: true,
                              text: "Lat",
                              textColor: colors.thirdTextColor,
                              textStyle: { fontSize: moderateScale(9) },
                            }}
                            height={32}
                            inputTextSize={11}
                            inputTextColor={colors.secondaryColor}
                            inputContainerStyle={{
                              borderRadius: moderateScale(6),
                            }}
                            editable={false}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <TextInputField
                            {...inputTheme}
                            value={form.lng!.toFixed(5)}
                            label={{
                              show: true,
                              text: "Lng",
                              textColor: colors.thirdTextColor,
                              textStyle: { fontSize: moderateScale(9) },
                            }}
                            height={32}
                            inputTextSize={11}
                            inputTextColor={colors.secondaryColor}
                            inputContainerStyle={{
                              borderRadius: moderateScale(6),
                            }}
                            editable={false}
                          />
                        </View>
                      </View>
                    ) : (
                      <Text style={styles.locationSub}>
                        Search or drop a pin on the map
                      </Text>
                    )}
                  </View>
                </View>
                {!form.lat && <Text style={styles.locationArrow}>→</Text>}
              </TouchableOpacity>
              <FieldError message={formErrors.location} colors={colors} />
            </View>

            {/* ── Submit ── */}
            <TouchableOpacity
              style={[styles.submitBtn, isSubmitting && { opacity: 0.7 }]}
              onPress={handleSubmit}
              activeOpacity={0.85}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.submitIcon}>🩸</Text>
                  <Text style={styles.submitText}>Submit Request</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={{ height: moderateScale(40) }} />
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>

      {/* ── Map Overlay ── */}
      {showMap && (
        <MapPicker
          lat={form.lat ?? 23.8103}
          lng={form.lng ?? 90.4125}
          onConfirm={(lat, lng) => {
            update("lat", lat);
            update("lng", lng);
            setShowMap(false);
          }}
          onClose={() => setShowMap(false)}
          colors={colors}
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const createStyles = (colors: ThemeColors) =>
  ScaledSheet.create({
    root: { flex: 1, backgroundColor: colors.bodyBackground },
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: "16@ms", paddingTop: "16@ms" },

    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: "12@ms",
      marginBottom: "20@ms",
    },
    headerAccent: {
      width: "4@ms",
      height: "48@ms",
      borderRadius: "4@ms",
      backgroundColor: colors.primaryColor,
    },
    headerTitle: {
      fontSize: "22@ms",
      fontWeight: "800",
      color: colors.textColor,
      letterSpacing: -0.5,
    },
    headerSub: {
      fontSize: "12@ms",
      color: colors.thirdTextColor,
      marginTop: "2@ms",
    },

    card: {
      backgroundColor: colors.secondBackgroundColor,
      borderRadius: "16@ms",
      borderWidth: 1,
      borderColor: colors.cardBorderColor,
      padding: "16@ms",
      marginBottom: "12@ms",
    },
    // Red border highlight on cards with validation errors
    cardError: {
      borderColor: withOpacity(URGENCY_COLORS.critical, 0.5),
    },

    twoCol: { flexDirection: "row", gap: "12@ms" },
    urgencyRow: { flexDirection: "row", gap: "8@ms" },

    locationBtn: {
      backgroundColor: colors.thirdBackgroundColor,
      borderRadius: "12@ms",
      borderWidth: 1,
      borderColor: colors.cardBorderColor,
      padding: "14@ms",
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
    },
    locationLeft: { flexDirection: "row", gap: "12@ms", flex: 1 },
    locationPinIcon: { fontSize: "22@ms", marginTop: "2@ms" },
    locationTitle: {
      fontSize: "14@ms",
      fontWeight: "600",
      color: colors.textColor,
    },
    locationSub: {
      fontSize: "11@ms",
      color: colors.thirdTextColor,
      marginTop: "4@ms",
    },
    locationArrow: {
      fontSize: "16@ms",
      color: colors.thirdTextColor,
      marginTop: "2@ms",
    },
    coordPair: { flexDirection: "row", gap: "6@ms", marginTop: "8@ms" },

    submitBtn: {
      backgroundColor: colors.primaryColor,
      borderRadius: "16@ms",
      paddingVertical: "16@ms",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: "10@ms",
      shadowColor: colors.primaryColor,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
      elevation: 8,
      marginTop: "8@ms",
    },
    submitIcon: { fontSize: "18@ms" },
    submitText: {
      fontSize: "16@ms",
      fontWeight: "800",
      color: "#FFFFFF",
      letterSpacing: 0.5,
    },
  });
