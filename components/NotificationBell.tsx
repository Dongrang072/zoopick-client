import { ROUTES } from "@/constants/url";
import { useProfile } from "@/hooks/queries/useUserQueries";
import { useRouter } from "expo-router";
import { Bell } from "lucide-react-native";
import { StyleSheet, TouchableOpacity, View } from "react-native";

export default function NotificationBell({
  color = "#444",
  size = 20,
}: {
  color?: string;
  size?: number;
}) {
  const router = useRouter();
  const { data: profile } = useProfile();
  const hasUnread = (profile?.unreadNotificationCount ?? 0) > 0;

  return (
    <TouchableOpacity
      style={styles.wrap}
      onPress={() => router.push(ROUTES.NOTIFICATION)}
    >
      <Bell size={size} color={color} />
      {hasUnread && <View style={styles.dot} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ef4444",
    borderWidth: 1.5,
    borderColor: "#fff",
  },
});
