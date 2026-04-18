import CustomTitleBar from "@/components/CustomTitleBar";
import SafeScreen from "@/components/SafeScreen";
import BloodRequestForm from "@/Pages/home/BloodRequestForm";
import React from "react";
import { useTranslation } from "react-i18next";

export default function requestBlood() {
  const { t } = useTranslation();
  return (
    <>
      <SafeScreen>
        <BloodRequestForm />
      </SafeScreen>
    </>
  );
}
