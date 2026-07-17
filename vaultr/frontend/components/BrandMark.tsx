import React from 'react';
import { Image, StyleSheet } from 'react-native';

// The Vaultr logo — a circular obsidian badge with the gold vault/chevron mark.
// The artwork already includes its own circular background, so it's rendered
// as-is wherever the brand needs to appear (dashboard header, auth screens).
const LOGO = require('../assets/brandmark.png');

interface BrandMarkProps {
  size?: number;
}

export default function BrandMark({ size = 48 }: BrandMarkProps) {
  return (
    <Image
      source={LOGO}
      style={[styles.mark, { width: size, height: size, borderRadius: size / 2 }]}
      resizeMode="contain"
      accessibilityLabel="Vaultr"
    />
  );
}

const styles = StyleSheet.create({
  mark: {
    // Circular clip is a no-op for the already-round artwork, but guards
    // against any stray edge pixels at small sizes.
    overflow: 'hidden',
  },
});
