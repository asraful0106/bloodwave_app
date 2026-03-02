/**
 * PrivacySection.tsx
 * Privacy toggles + contact/links management
 */
import { StyledText } from "@/components/StyledText";
import { ThemeColors } from "@/constants/themeCollorConstant";
import { withOpacity } from "@/helpers/withOpacity";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Alert, Modal, TextInput, TouchableOpacity, View } from "react-native";
import { moderateScale } from "react-native-size-matters";

interface PrivacySettings {
  show_name: boolean; show_gender: boolean; show_age: boolean;
  show_phone: boolean; show_last_donation: boolean; emergency_only: boolean;
  allow_inapp_call: boolean; allow_chat: boolean;
}
interface Contact {
  id: string; type: "phone" | "website" | "social";
  title: string; value: string; is_public: boolean;
}
interface PrivacySectionProps {
  privacy: PrivacySettings; contacts: Contact[];
  onPrivacyChange: (u: PrivacySettings) => void;
  onContactsChange: (u: Contact[]) => void;
  colors: ThemeColors;
}

const Card = ({ children, colors }: { children: React.ReactNode; colors: ThemeColors }) => (
  <View style={{ backgroundColor: colors.secondBackgroundColor, borderRadius: moderateScale(16), borderWidth: 1, borderColor: colors.cardBorderColor, padding: moderateScale(16), marginBottom: moderateScale(12) }}>
    {children}
  </View>
);

const STitle = ({ icon, title, colors }: { icon: string; title: string; colors: ThemeColors }) => (
  <View style={{ flexDirection: "row", alignItems: "center", gap: moderateScale(8), marginBottom: moderateScale(14) }}>
    <View style={{ width: moderateScale(3), height: moderateScale(14), borderRadius: 2, backgroundColor: "#E53935" }} />
    <MaterialCommunityIcons name={icon as any} size={moderateScale(14)} color={colors.thirdTextColor} />
    <StyledText style={{ color: colors.thirdTextColor, fontSize: moderateScale(10, 0.3), fontWeight: "700", letterSpacing: 1, textTransform: "uppercase" }}>{title}</StyledText>
  </View>
);

const ToggleRow = ({ label, sublabel, value, onToggle, colors }: { label: string; sublabel?: string; value: boolean; onToggle: () => void; colors: ThemeColors }) => (
  <TouchableOpacity onPress={onToggle} activeOpacity={0.7} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: moderateScale(10), borderBottomWidth: 1, borderBottomColor: colors.cardBorderColor }}>
    <View style={{ flex: 1, paddingRight: moderateScale(12) }}>
      <StyledText style={{ color: colors.textColor, fontSize: moderateScale(13, 0.3), fontWeight: "500" }}>{label}</StyledText>
      {sublabel && <StyledText style={{ color: colors.thirdTextColor, fontSize: moderateScale(10, 0.3), marginTop: 2 }}>{sublabel}</StyledText>}
    </View>
    <View style={{ width: moderateScale(42), height: moderateScale(24), borderRadius: moderateScale(12), backgroundColor: value ? "#2eb97b" : colors.thirdBackgroundColor, justifyContent: "center", paddingHorizontal: moderateScale(2), borderWidth: 1, borderColor: value ? "#2eb97b" : colors.cardBorderColor }}>
      <View style={{ width: moderateScale(18), height: moderateScale(18), borderRadius: moderateScale(9), backgroundColor: "white", alignSelf: value ? "flex-end" : "flex-start", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 2, elevation: 2 }} />
    </View>
  </TouchableOpacity>
);

const CONTACT_ICONS: Record<string, string> = { phone: "phone", website: "globe", social: "share-2" };

export const PrivacySection = ({ privacy, contacts, onPrivacyChange, onContactsChange, colors }: PrivacySectionProps) => {
  const [lp, setLp] = useState(privacy);
  const [lc, setLc] = useState(contacts);
  const [showAdd, setShowAdd] = useState(false);
  const [nc, setNc] = useState<Partial<Contact>>({ type: "phone", title: "", value: "", is_public: true });

  const toggle = (key: keyof PrivacySettings) => {
    const u = { ...lp, [key]: !lp[key] };
    setLp(u); onPrivacyChange(u);
  };

  const deleteContact = (id: string) => {
    const c = lc.find(x => x.id === id);
    const pubPhones = lc.filter(x => x.type === "phone" && x.is_public);
    if (c?.type === "phone" && c.is_public && pubPhones.length <= 1) {
      Alert.alert("Cannot Delete", "You need at least one public phone number."); return;
    }
    Alert.alert("Delete?", `Remove "${c?.title || c?.value}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => { const u = lc.filter(x => x.id !== id); setLc(u); onContactsChange(u); } },
    ]);
  };

  const togglePublic = (id: string) => {
    const c = lc.find(x => x.id === id);
    if (c?.is_public && c.type === "phone" && lc.filter(x => x.type === "phone" && x.is_public).length <= 1) {
      Alert.alert("Required", "At least one phone number must stay public."); return;
    }
    const u = lc.map(x => x.id === id ? { ...x, is_public: !x.is_public } : x);
    setLc(u); onContactsChange(u);
  };

  const addContact = () => {
    if (!nc.value?.trim()) { Alert.alert("Error", "Value is required."); return; }
    if (nc.type !== "phone" && nc.value && !nc.value.startsWith("http")) { Alert.alert("Invalid URL", "Links must start with http:// or https://"); return; }
    const entry: Contact = { id: `con-${Date.now()}`, type: nc.type as Contact["type"], title: nc.title || nc.type!, value: nc.value!, is_public: nc.is_public ?? true };
    const u = [...lc, entry]; setLc(u); onContactsChange(u);
    setShowAdd(false); setNc({ type: "phone", title: "", value: "", is_public: true });
  };

  return (
    <>
      <Card colors={colors}>
        <STitle icon="shield-account" title="Privacy" colors={colors} />
        {lp.emergency_only && (
          <View style={{ backgroundColor: withOpacity("#E53935", 0.08), borderRadius: moderateScale(8), padding: moderateScale(10), flexDirection: "row", alignItems: "center", gap: moderateScale(8), marginBottom: moderateScale(10), borderWidth: 1, borderColor: withOpacity("#E53935", 0.2) }}>
            <MaterialCommunityIcons name="shield-alert" size={moderateScale(14)} color="#E53935" />
            <StyledText style={{ color: "#E53935", fontSize: moderateScale(10, 0.3), flex: 1 }}>Emergency-only mode is ON. Only emergency requests can see your profile.</StyledText>
          </View>
        )}
        <ToggleRow label="Show Name" sublabel="Your name is visible to donors" value={lp.show_name} onToggle={() => toggle("show_name")} colors={colors} />
        <ToggleRow label="Show Gender" value={lp.show_gender} onToggle={() => toggle("show_gender")} colors={colors} />
        <ToggleRow label="Show Age" value={lp.show_age} onToggle={() => toggle("show_age")} colors={colors} />
        <ToggleRow label="Show Phone Number" sublabel="Required so donors can contact you" value={lp.show_phone} onToggle={() => toggle("show_phone")} colors={colors} />
        <ToggleRow label="Show Last Donation Date" value={lp.show_last_donation} onToggle={() => toggle("show_last_donation")} colors={colors} />
        <ToggleRow label="Allow In-App Call" sublabel="Requesters can call within the app" value={lp.allow_inapp_call} onToggle={() => toggle("allow_inapp_call")} colors={colors} />
        <ToggleRow label="Allow Chat" value={lp.allow_chat} onToggle={() => toggle("allow_chat")} colors={colors} />
        <ToggleRow label="Emergency Requests Only" sublabel="Hide from normal & urgent requests" value={lp.emergency_only} onToggle={() => toggle("emergency_only")} colors={colors} />
      </Card>

      <Card colors={colors}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: moderateScale(14) }}>
          <STitle icon="contacts" title="Contacts & Links" colors={colors} />
          <TouchableOpacity onPress={() => setShowAdd(true)} style={{ flexDirection: "row", alignItems: "center", gap: moderateScale(4), backgroundColor: withOpacity("#E53935", 0.1), borderRadius: moderateScale(8), paddingHorizontal: moderateScale(9), paddingVertical: moderateScale(4) }}>
            <Feather name="plus" size={moderateScale(12)} color="#E53935" />
            <StyledText style={{ color: "#E53935", fontWeight: "600", fontSize: moderateScale(11, 0.3) }}>Add</StyledText>
          </TouchableOpacity>
        </View>
        {lc.length === 0 && <StyledText style={{ color: colors.thirdTextColor, fontSize: moderateScale(12, 0.3), textAlign: "center", paddingVertical: moderateScale(16) }}>No contacts added</StyledText>}
        {lc.map((c, idx) => (
          <View key={c.id} style={{ flexDirection: "row", alignItems: "center", paddingVertical: moderateScale(10), borderBottomWidth: idx < lc.length - 1 ? 1 : 0, borderBottomColor: colors.cardBorderColor, gap: moderateScale(10) }}>
            <View style={{ width: moderateScale(34), height: moderateScale(34), borderRadius: moderateScale(10), backgroundColor: colors.thirdBackgroundColor, alignItems: "center", justifyContent: "center" }}>
              <Feather name={CONTACT_ICONS[c.type] as any} size={moderateScale(15)} color={colors.thirdTextColor} />
            </View>
            <View style={{ flex: 1 }}>
              <StyledText style={{ color: colors.thirdTextColor, fontSize: moderateScale(9, 0.3) }}>{c.title}</StyledText>
              <StyledText style={{ color: colors.textColor, fontSize: moderateScale(12, 0.3), fontWeight: "500" }} numberOfLines={1}>{c.value}</StyledText>
            </View>
            <TouchableOpacity onPress={() => togglePublic(c.id)}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: moderateScale(3), backgroundColor: c.is_public ? withOpacity("#2eb97b", 0.1) : colors.thirdBackgroundColor, borderRadius: moderateScale(8), paddingHorizontal: moderateScale(6), paddingVertical: moderateScale(3) }}>
                <Feather name={c.is_public ? "eye" : "eye-off"} size={moderateScale(10)} color={c.is_public ? "#2eb97b" : colors.thirdTextColor} />
                <StyledText style={{ color: c.is_public ? "#2eb97b" : colors.thirdTextColor, fontSize: moderateScale(9, 0.3) }}>{c.is_public ? "Public" : "Private"}</StyledText>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => deleteContact(c.id)} hitSlop={8}>
              <Feather name="trash-2" size={moderateScale(14)} color="#E53935" />
            </TouchableOpacity>
          </View>
        ))}
      </Card>

      <Modal visible={showAdd} transparent animationType="slide" onRequestClose={() => setShowAdd(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: colors.bodyBackground, borderTopLeftRadius: moderateScale(20), borderTopRightRadius: moderateScale(20), padding: moderateScale(20), gap: moderateScale(12) }}>
            <StyledText style={{ color: colors.textColor, fontWeight: "700", fontSize: moderateScale(15, 0.3) }}>Add Contact</StyledText>
            <View style={{ flexDirection: "row", gap: moderateScale(8) }}>
              {(["phone", "website", "social"] as const).map(t => (
                <TouchableOpacity key={t} onPress={() => setNc(p => ({ ...p, type: t }))} style={{ flex: 1, padding: moderateScale(8), borderRadius: moderateScale(8), backgroundColor: nc.type === t ? withOpacity("#E53935", 0.1) : colors.thirdBackgroundColor, borderWidth: 1, borderColor: nc.type === t ? "#E53935" : colors.cardBorderColor, alignItems: "center" }}>
                  <StyledText style={{ color: nc.type === t ? "#E53935" : colors.textColor, fontSize: moderateScale(11, 0.3), fontWeight: "600", textTransform: "capitalize" }}>{t}</StyledText>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput placeholder="Label (e.g. Facebook)" value={nc.title} onChangeText={v => setNc(p => ({ ...p, title: v }))} style={{ backgroundColor: colors.thirdBackgroundColor, borderRadius: moderateScale(10), padding: moderateScale(12), color: colors.textColor, fontSize: moderateScale(13, 0.3), borderWidth: 1, borderColor: colors.cardBorderColor }} placeholderTextColor={colors.thirdTextColor} />
            <TextInput placeholder={nc.type === "phone" ? "+880..." : "https://"} value={nc.value} onChangeText={v => setNc(p => ({ ...p, value: v }))} keyboardType={nc.type === "phone" ? "phone-pad" : "url"} style={{ backgroundColor: colors.thirdBackgroundColor, borderRadius: moderateScale(10), padding: moderateScale(12), color: colors.textColor, fontSize: moderateScale(13, 0.3), borderWidth: 1, borderColor: colors.cardBorderColor }} placeholderTextColor={colors.thirdTextColor} />
            <TouchableOpacity onPress={() => setNc(p => ({ ...p, is_public: !p.is_public }))} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: moderateScale(12), backgroundColor: colors.thirdBackgroundColor, borderRadius: moderateScale(10), borderWidth: 1, borderColor: colors.cardBorderColor }}>
              <StyledText style={{ color: colors.textColor, fontSize: moderateScale(13, 0.3) }}>Visible to public</StyledText>
              <View style={{ width: moderateScale(38), height: moderateScale(22), borderRadius: moderateScale(11), backgroundColor: nc.is_public ? "#2eb97b" : colors.cardBorderColor, justifyContent: "center", paddingHorizontal: moderateScale(2) }}>
                <View style={{ width: moderateScale(16), height: moderateScale(16), borderRadius: moderateScale(8), backgroundColor: "white", alignSelf: nc.is_public ? "flex-end" : "flex-start" }} />
              </View>
            </TouchableOpacity>
            <View style={{ flexDirection: "row", gap: moderateScale(8) }}>
              <TouchableOpacity onPress={() => setShowAdd(false)} style={{ flex: 1, borderRadius: moderateScale(10), paddingVertical: moderateScale(12), alignItems: "center", borderWidth: 1, borderColor: colors.cardBorderColor }}>
                <StyledText style={{ color: colors.thirdTextColor, fontWeight: "600" }}>Cancel</StyledText>
              </TouchableOpacity>
              <TouchableOpacity onPress={addContact} style={{ flex: 1, backgroundColor: "#E53935", borderRadius: moderateScale(10), paddingVertical: moderateScale(12), alignItems: "center" }}>
                <StyledText style={{ color: "white", fontWeight: "700" }}>Add</StyledText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};
