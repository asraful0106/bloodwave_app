import "i18next";
import { resources } from "./hooks/language/i18n";
declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "translation";
    // 👇 This makes keys from resources.en.translation available in t("...")
    resources: (typeof resources)["en"];
  }
}
