// /@/app/(otherPage)/(register.tsx)
import React from "react";
import SafeScreen from "@/components/SafeScreen";
import Register from "@/Pages/auth/registration/Registration";

export default function register() {
  return (
    <>
      <SafeScreen>
        <Register />
      </SafeScreen>
    </>
  );
}
