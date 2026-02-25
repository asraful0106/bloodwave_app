import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Image, StyleSheet, Animated } from "react-native";
import { moderateScale } from "react-native-size-matters";
import { StyledText } from "./StyledText";
import { Buffer } from "buffer";

interface AvatarProps {
  imageUrl?: string;
  size?: number;
  borderRadius?: number;
  borderWidth?: number;
  borderColor?: string;
  backgroundColor?: string;
}

const DEFAULT_SIZE = moderateScale(40);
const DEFAULT_BORDER_WIDTH = moderateScale(2);

const Avatar: React.FC<AvatarProps> = ({
  // Optional override (e.g. remote URL). If not provided, we use user.image.
  imageUrl,
  size = DEFAULT_SIZE,
  borderRadius,
  borderWidth = DEFAULT_BORDER_WIDTH,
  borderColor = "#3b82f6",
  backgroundColor = "#f5f5f5",
}) => {
  const outerRadius = borderRadius ?? size / 2;
  const innerSize = size - borderWidth * 2;
  const innerRadius = innerSize / 2;

  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);


  const imageSource = useMemo(() => {
    if (imageUrl) return { uri: imageUrl };
    return require("@/assets/images/default-avatar.jpeg");
  }, [imageUrl]);

  // Reset loading state when the image changes
  useEffect(() => {
    setLoaded(false);
    setError(false);
  }, [imageUrl]);

  // For skeleton pulse
  const skeletonOpacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (loaded || error) return;

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(skeletonOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(skeletonOpacity, {
          toValue: 0.3,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();
    return () => loop.stop();
  }, [loaded, error, skeletonOpacity]);

  const showSkeleton = !loaded && !error;

  return (
    <View style={styles.avatar}>
      <View
        style={[
          styles.ringWrapper,
          {
            width: size,
            height: size,
            borderRadius: outerRadius,
            borderWidth,
            borderColor,
            backgroundColor,
          },
        ]}
      >
        {showSkeleton && (
          <Animated.View
            style={[
              styles.skeleton,
              {
                width: innerSize,
                height: innerSize,
                borderRadius: innerRadius,
                opacity: skeletonOpacity,
              },
            ]}
          />
        )}

        {!error && (
          <Image
            source={imageSource}
            style={[
              styles.image,
              {
                width: innerSize,
                height: innerSize,
                borderRadius: innerRadius,
                opacity: loaded ? 1 : 0,
              },
            ]}
            onLoad={() => setLoaded(true)}
            onError={() => setError(true)}
          />
        )}

        {error && (
          <View
            style={[
              styles.fallback,
              {
                width: innerSize,
                height: innerSize,
                borderRadius: innerRadius,
              },
            ]}
          >
            <StyledText style={styles.fallbackText}>?</StyledText>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  avatar: {},
  ringWrapper: {
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    resizeMode: "cover",
    position: "absolute",
  },
  skeleton: {
    backgroundColor: "#e5e7eb",
  },
  fallback: {
    backgroundColor: "#e5e7eb",
    justifyContent: "center",
    alignItems: "center",
  },
  fallbackText: {
    fontWeight: "600",
    color: "#6b7280",
  },
});

export default Avatar;
