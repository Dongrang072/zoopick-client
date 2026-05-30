import { chatService } from "@/api/services/chat";
import { ChatRoomRecord } from "@/api/types";
import { fonts } from "@/constants/typography";
import { ROUTES } from "@/constants/url";
import { useChatQueries } from "@/hooks/queries/useChatQueries";
import { useProfile } from "@/hooks/queries/useUserQueries";
import { useFocusEffect, useRouter } from "expo-router";
import NotificationBell from "@/components/NotificationBell";
import { MessageCircle, User } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "방금 전";
  if (min < 60) return `${min}분 전`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}시간 전`;
  return "어제";
}

const ChatRoomSkeleton = () => (
  <View style={styles.chatCard}>
    <View style={[styles.avatar, styles.skeleton]} />
    <View style={styles.chatInfo}>
      <View
        style={[
          styles.skeletonLine,
          { width: "40%", height: 15, marginBottom: 6 },
        ]}
      />
      <View
        style={[
          styles.skeletonLine,
          { width: "60%", height: 12, marginBottom: 6 },
        ]}
      />
      <View style={[styles.skeletonLine, { width: "30%", height: 12 }]} />
    </View>
  </View>
);

export default function ChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: profile } = useProfile();
  const [chatRooms, setChatRooms] = useState<ChatRoomRecord[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const { data: roomListData, refetch } = useChatQueries.useChatRooms();

  const loadChatRooms = useCallback(async () => {
    setIsLoading(true);
    const ids = roomListData?.data?.chatRoomIds;
    if (!ids?.length) {
      setChatRooms([]);
      setIsLoading(false);
      return;
    }
    try {
      const rooms = await Promise.all(
        ids.map(async (id) => {
          const res = await chatService.getChatRoom(id);
          return res.success ? res.data : null;
        }),
      );
      setChatRooms((rooms.filter(Boolean) as ChatRoomRecord[]).sort((a, b) => b.room_id - a.room_id));
    } catch (e) {
      console.error("채팅방 목록 조회 실패", e);
      setChatRooms([]);
    } finally {
      setIsLoading(false);
    }
  }, [roomListData]);

  // 채팅방 ID 목록 변경 시 (새 채팅방 생성 등)
  useEffect(() => {
    loadChatRooms();
  }, [loadChatRooms]);

  // 채팅 탭으로 돌아올 때 방 상태 갱신 (거래 완료 등 상태 변경 반영)
  useFocusEffect(
    useCallback(() => {
      loadChatRooms();
    }, [loadChatRooms]),
  );

  const onRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>채팅</Text>
        <View style={styles.headerIcons}>
          <NotificationBell />
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.push(ROUTES.MYPAGE as any)}
          >
            <User size={20} color="#444" />
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <View>
          <ChatRoomSkeleton />
          <ChatRoomSkeleton />
          <ChatRoomSkeleton />
          <ChatRoomSkeleton />
          <ChatRoomSkeleton />
        </View>
      ) : (
        <FlatList
          data={chatRooms}
          keyExtractor={(item) => String(item.room_id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              colors={["#6366f1"]}
              tintColor="#6366f1"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <View style={styles.emptyIconWrap}>
                <MessageCircle size={36} color="#6366f1" />
              </View>
              <Text style={styles.emptyTitle}>채팅이 없어요</Text>
              <Text style={styles.emptyDesc}>
                분실물 게시글에서 채팅으로 문의해보세요
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const counterpartNickname =
              profile?.nickname === item.owner_nickname
                ? item.finder_nickname
                : item.owner_nickname;

            return (
              <TouchableOpacity
                style={styles.chatCard}
                onPress={() =>
                  router.push({
                    pathname: "/chat-room",
                    params: { roomId: item.room_id },
                  })
                }
                activeOpacity={0.6}
              >
                <View style={styles.avatar}>
                  <User size={24} color="#aaa" />
                </View>
                <View style={styles.chatInfo}>
                  <View style={styles.chatTopRow}>
                    <Text style={styles.chatNickname} numberOfLines={1}>
                      {counterpartNickname}
                    </Text>
                  </View>
                  <Text style={styles.chatItemDetail} numberOfLines={1}>
                    {item.item_name}
                  </Text>
                  <View style={styles.chatBottomRow}>
                    <Text style={styles.chatStatus} numberOfLines={1}>
                      {item.status === "OPEN"
                        ? "진행 중"
                        : item.status === "RESOLVED_RETURNED"
                          ? "반환 완료"
                          : "종료"}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#fff",
  },
  headerTitle: { fontSize: 18, fontFamily: fonts.bold, color: "#111" },
  headerIcons: { flexDirection: "row", gap: 6 },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: { paddingTop: 4, paddingBottom: 100 },
  chatCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#eef2ff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#6366f130",
  },
  skeleton: {
    backgroundColor: "#f0f0f0",
    borderWidth: 0,
  },
  skeletonLine: {
    backgroundColor: "#f0f0f0",
    borderRadius: 6,
  },
  chatInfo: { flex: 1, gap: 3 },
  chatTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  chatNickname: { fontSize: 15, fontFamily: fonts.bold, color: "#111" },
  chatItemDetail: { fontSize: 12, fontFamily: fonts.regular, color: "#6366f1" },
  chatBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  chatStatus: { fontSize: 13, fontFamily: fonts.regular, color: "#aaa" },
  emptyBox: { alignItems: "center", paddingVertical: 80, gap: 12 },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#eef2ff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 16, fontFamily: fonts.bold, color: "#333" },
  emptyDesc: { fontSize: 13, fontFamily: fonts.regular, color: "#aaa" },
});
