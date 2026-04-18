// /@/app/(otherPage)/(register.tsx)
import React from "react";
import SafeScreen from "@/components/SafeScreen";
import Login from "@/Pages/auth/login/Login";

export default function login() {
  return (
    <>
      <SafeScreen>
        <Login />
      </SafeScreen>
    </>
  );
}
