import { Platform } from "react-native";

/** Cross-platform shadow helper.
 *  On web  → returns { boxShadow } (React Native Web prefers this).
 *  On native → returns shadow* props (iOS/Android).
 */
export function shadow(
  color: string,
  opacity: number,
  radius: number,
  elevation = 2,
  offset: { width: number; height: number } = { width: 0, height: 2 },
) {
  if (Platform.OS === "web") {
    // Parse hex color (#rrggbb or #rgb)
    let r = 0, g = 0, b = 0;
    const hex = color.replace("#", "");
    if (hex.length === 6) {
      r = parseInt(hex.slice(0, 2), 16);
      g = parseInt(hex.slice(2, 4), 16);
      b = parseInt(hex.slice(4, 6), 16);
    } else if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    }
    return {
      boxShadow: `${offset.width}px ${offset.height}px ${radius}px rgba(${r},${g},${b},${opacity})`,
    } as any;
  }
  return {
    shadowColor:   color,
    shadowOpacity: opacity,
    shadowRadius:  radius,
    shadowOffset:  offset,
    elevation,
  };
}
