// components/StyledText.tsx
import { Text, TextProps } from "react-native";
import { useLanguage } from "@/hooks/language/LanguageContext";
import { getFontFamily } from "@/helpers/getFontFamily";

export function StyledText(props: TextProps) {
  const { lang } = useLanguage();
  const fontFamily = getFontFamily(lang);

  return <Text {...props} style={[{ fontFamily }, props.style]} />;
}
