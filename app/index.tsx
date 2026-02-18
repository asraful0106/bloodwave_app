import SafeScreen from "@/components/SafeScreen";
import ForgotPassword from "@/Pages/auth/forgetPassword/ForgotPassword";
import Login from "@/Pages/auth/login/Login";
import OtpVerification from "@/Pages/auth/otp_varification/OtpVerification";
import Register from "@/Pages/auth/registration/Registration";
import ResetPassword from "@/Pages/auth/resetPassword/ResetPassword";

export default function Index() {
  return (
    <SafeScreen>
      <ForgotPassword />
    </SafeScreen>
  );
}
