import CustomTitleBar from "@/components/CustomTitleBar";
import SafeScreen from "@/components/SafeScreen";
import MyDonations from "@/Pages/donated/MyDonations";
import React from "react";
import { useTranslation } from "react-i18next";

export default function index() {
  const { t } = useTranslation();
  return (
    <>
      <SafeScreen>
        <CustomTitleBar />
          <MyDonations />
      </SafeScreen>
    </>
  );
}
