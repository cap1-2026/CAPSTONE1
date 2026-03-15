// utils/logout.ts
import { Alert } from "react-native";
import { UserStorage } from "./userStorage";

export function confirmLogout(router: any, destination: string = "/") {
  Alert.alert(
    "Logout",
    "Are you sure you want to log out?",
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await UserStorage.clearUser();
          router.replace(destination);
        },
      },
    ]
  );
}