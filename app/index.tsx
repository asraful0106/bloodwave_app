import SafeScreen from "@/components/SafeScreen";
import Login from "@/Pages/login/Login";
import Register from "@/Pages/registration/Registration";

export default function Index() {
  return (
    <SafeScreen>
      <Register />
    </SafeScreen>
  );
}
