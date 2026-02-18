import SafeScreen from "@/components/SafeScreen";
import Login from "@/Pages/auth/login/Login";
import OtpVerification from "@/Pages/auth/otp_varification/OtpVerification";
import Register from "@/Pages/auth/registration/Registration";

export default function Index() {
  return (
    <SafeScreen>
      <OtpVerification />
    </SafeScreen>
  );
}
