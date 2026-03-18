import { Alert, Platform } from "react-native";

/**
 * Cross-platform alert utility that works on both web and mobile
 * @param title Alert title
 * @param msg Optional alert message
 */
export function showAlert(title: string, msg?: string) {
  if (Platform.OS === "web") {
    window.alert(msg ? `${title}\n\n${msg}` : title);
  } else {
    Alert.alert(title, msg);
  }
}