import React from "react";
import { Image, View } from "react-native";
import { useRoute, RouteProp } from "@react-navigation/native";
import OtpVerificationView from "@/components/screen/OTPvarifiactionScreen";
import { moderateScale } from "react-native-size-matters";

type RouteParams = {
  destination?: string;
};

// If you have a proper RootStackParamList, use it instead.
// This is a minimal safe typing:
type OtpRoute = RouteProp<{ OtpVerification: RouteParams }, "OtpVerification">;

export default function OtpVerification() {
  const route = useRoute<OtpRoute>();
  const destination = route.params?.destination ?? "";

  return (
    <View style={{ flex:1}}>
        {/* Brand */}
              <View
                style={{
                  height: moderateScale(100),
                  width: "100%",
                  marginTop: moderateScale(30),
                }}
              >
                <Image
                  source={require("@/assets/other_images/brandicon.png")}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="cover"
                />
              </View>
        
      <OtpVerificationView
        destination={destination}
        onVerify={async (code) => {
          // await api.verifyOtp({ code, destination })
        }}
        onResend={async () => {
          // await api.resendOtp({ destination })
        }}
      />
    </View>
  );
}
