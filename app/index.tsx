import SafeScreen from "@/components/SafeScreen";
import ForgotPassword from "@/Pages/auth/forgetPassword/ForgotPassword";

export default function Index() {
  return (
    <SafeScreen>
      <ForgotPassword />
    </SafeScreen>
  );
}
