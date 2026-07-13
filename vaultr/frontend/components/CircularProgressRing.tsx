import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '../constants/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface CircularProgressRingProps {
  /** 0–1 */
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  children?: React.ReactNode;
}

/**
 * Gold circular progress ring built on react-native-svg (not Skia — the
 * balance-history chart already showed Skia's web canvas isn't wired up for
 * this project, so SVG is the safe choice for something that must render on
 * iOS, Android, and web alike).
 *
 * Animates the stroke in on mount/progress-change with a single, subtle
 * timing tween — no bounce/looping, per the "don't overfocus on animation"
 * guidance.
 */
export default function CircularProgressRing({
  progress,
  size = 64,
  strokeWidth = 6,
  color = colors.accentGold,
  trackColor = colors.border,
  children,
}: CircularProgressRingProps) {
  const clamped = Math.max(0, Math.min(progress, 1));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const animatedProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedProgress, {
      toValue: clamped,
      duration: 700,
      useNativeDriver: false, // strokeDashoffset isn't a "native driver" transform/opacity prop
    }).start();
  }, [clamped, animatedProgress]);

  const strokeDashoffset = animatedProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={styles.svg}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
        />
      </Svg>
      {children ? <View style={styles.center}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  svg: {
    // SVG circles are drawn starting at 3 o'clock, going clockwise — rotate
    // -90deg so progress starts at 12 o'clock, the conventional orientation.
    transform: [{ rotate: '-90deg' }],
  },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
