import type { ItemMatchResultResponse } from "@/api/types";
import { fonts } from "@/constants/typography";
import { BASE_URL, ROUTES } from "@/constants/url";
import { useChatMutations } from "@/hooks/mutations/useChatMutations";
import { useMatchMutations } from "@/hooks/mutations/useMatchMutations";
import { useMatchQueries } from "@/hooks/queries/useMatchQueries";
import { useRouter } from "expo-router";
import {
  Archive,
  Award,
  Building2,
  CheckCircle,
  CheckCircle2,
  ChevronLeft,
  MessageCircle,
  QrCode,
  Sparkles,
  XCircle,
} from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

// ── 수락 완료 후 안내 바텀시트 ───────────────────────────
interface AcceptedSheetProps {
  match: ItemMatchResultResponse;
  matchType: "CHAT" | "LOCKER";
  onClose: () => void;
  onGoChat: () => void;
  onGoLocker: () => void;
}

function AcceptedSheet({
  match,
  matchType,
  onClose,
  onGoChat,
  onGoLocker,
}: AcceptedSheetProps) {
  const isChat = matchType === "CHAT";

  return (
    <Modal visible transparent animationType="slide">
      <Pressable style={sheetStyles.overlay} onPress={onClose} />
      <View style={sheetStyles.wrap}>
        <View style={sheetStyles.handle} />

        {/* 매칭 확인 배너 */}
        <View style={sheetStyles.banner}>
          <View style={sheetStyles.bannerIcon}>
            <CheckCircle size={20} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={sheetStyles.bannerTitle}>매칭 확인됐어요!</Text>
            <Text style={sheetStyles.bannerDesc} numberOfLines={1}>
              {match.found_post_title} · {match.found_nickname}님이 보유 중
            </Text>
          </View>
        </View>

        {isChat ? (
          <>
            <View style={sheetStyles.infoBox}>
              <View style={sheetStyles.finderRow}>
                <View style={sheetStyles.finderAvatar}>
                  <Text style={sheetStyles.finderAvatarText}>
                    {match.found_nickname?.charAt(0) ?? "?"}
                  </Text>
                </View>
                <View>
                  <Text style={sheetStyles.finderName}>
                    {match.found_nickname}
                  </Text>
                  <Text style={sheetStyles.finderDept}>
                    {match.found_department}
                  </Text>
                </View>
              </View>
              <Text style={sheetStyles.infoDesc}>
                채팅으로 {match.found_nickname}님과 직접 연락해서{"\n"}만날
                장소와 시간을 조율하세요.
              </Text>
            </View>
            <TouchableOpacity
              style={[sheetStyles.actionBtn, { backgroundColor: "#10b981" }]}
              onPress={onGoChat}
              activeOpacity={0.85}
            >
              <View style={sheetStyles.actionIconWrap}>
                <MessageCircle size={18} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={sheetStyles.actionTitle}>
                  {match.found_nickname}님과 채팅하기
                </Text>
                <Text style={sheetStyles.actionDesc}>
                  채팅방으로 바로 이동해요
                </Text>
              </View>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={sheetStyles.infoBox}>
              <View style={sheetStyles.lockerHeader}>
                <View style={sheetStyles.lockerIcon}>
                  <Archive size={16} color="#666" />
                </View>
                <Text style={sheetStyles.lockerTitle}>사물함 회수 방식</Text>
              </View>
              <Text style={sheetStyles.infoDesc}>
                {match.found_nickname}님이 AI 사물함에 물건을 보관했어요.{"\n"}
                QR 코드로 직접 꺼내가세요.
              </Text>
            </View>
            <TouchableOpacity
              style={[sheetStyles.actionBtn, { backgroundColor: "#6366f1" }]}
              onPress={onGoLocker}
              activeOpacity={0.85}
            >
              <View style={sheetStyles.actionIconWrap}>
                <QrCode size={18} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={sheetStyles.actionTitle}>사물함 QR 코드 열기</Text>
                <Text style={sheetStyles.actionDesc}>
                  QR 스캔으로 사물함 열기
                </Text>
              </View>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity
          style={sheetStyles.laterBtn}
          onPress={onClose}
          activeOpacity={0.85}
        >
          <Text style={sheetStyles.laterBtnText}>나중에 하기</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

export default function MatchesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
  const [modalType, setModalType] = useState<"reject" | null>(null);
  const [acceptedIds, setAcceptedIds] = useState<number[]>([]);
  const [rejectedIds, setRejectedIds] = useState<number[]>([]);
  // 수락 후 바텀시트
  const [acceptedSheet, setAcceptedSheet] = useState<{
    match: ItemMatchResultResponse;
    matchType: "CHAT" | "LOCKER";
  } | null>(null);

  const { data, isLoading, refetch } = useMatchQueries.useMyMatches();
  const confirmMutation = useMatchMutations.useConfirmMatch();
  const rejectMutation = useMatchMutations.useRejectMatch();
  const createChatRoomMutation = useChatMutations.useCreateChatRoom();

  const matches = data?.success ? data.data : [];

  // 진행 중 매칭 (수락/거절 안 한 것)
  const pendingMatches = matches
    .filter((m) => m.status === "CANDIDATE" || m.status === "NOTIFIED")
    .filter((m) => !rejectedIds.includes(m.match_id)) // 거절된 것 제외
    .filter((m) => !acceptedIds.includes(m.match_id)) // 수락된 것 제외 (완료 섹션으로 이동)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  // 완료된 매칭 (수락된 것들)
  const completedMatches = matches.filter((m) =>
    acceptedIds.includes(m.match_id),
  );

  const onRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const openRejectModal = (matchId: number) => {
    setSelectedMatchId(matchId);
    setModalType("reject");
  };

  const closeModal = () => {
    setSelectedMatchId(null);
    setModalType(null);
  };

  const handleConfirm = (match: ItemMatchResultResponse) => {
    confirmMutation.mutate(match.match_id, {
      onSuccess: (res) => {
        if (!res.success) {
          Toast.show({
            type: "error",
            text1: "매칭 수락 실패",
            text2: "다시 시도해주세요.",
            position: "bottom",
            visibilityTime: 2500,
          });
          return;
        }

        const { match_type, counterpart_id } = res.data;
        setAcceptedIds((prev) => [...prev, match.match_id]);

        // 수락 후 바텀시트 표시
        setAcceptedSheet({ match, matchType: match_type });
      },
      onError: () => {
        Toast.show({
          type: "error",
          text1: "매칭 수락 실패",
          text2: "다시 시도해주세요.",
          position: "bottom",
          visibilityTime: 2500,
        });
      },
    });
  };

  const handleReject = () => {
    if (!selectedMatchId) return;
    const targetId = selectedMatchId;
    closeModal();
    // 거절 즉시 카드 제거
    setRejectedIds((prev) => [...prev, targetId]);

    rejectMutation.mutate(targetId, {
      onSuccess: () => {
        Toast.show({
          type: "success",
          text1: "매칭을 거절했어요",
          position: "bottom",
          visibilityTime: 2000,
        });
      },
      onError: () => {
        // API 실패 시 복원
        setRejectedIds((prev) => prev.filter((id) => id !== targetId));
        Toast.show({
          type: "error",
          text1: "매칭 거절 실패",
          position: "bottom",
          visibilityTime: 2000,
        });
      },
    });
  };

  // 바텀시트 - 채팅하기
  const handleGoChat = () => {
    if (!acceptedSheet) return;
    const { match } = acceptedSheet;
    createChatRoomMutation.mutate(
      {
        item_id: match.found_item_id,
        counterpart_id: match.counterpart_id,
      },
      {
        onSuccess: (chatRes) => {
          if (chatRes.success && chatRes.data.room_data) {
            setAcceptedSheet(null);
            router.push({
              pathname: "/chat-room",
              params: { roomId: chatRes.data.room_data.room_id },
            });
          }
        },
        onError: () => {
          Toast.show({
            type: "error",
            text1: "채팅방 생성 실패",
            text2: "다시 시도해주세요.",
            position: "bottom",
            visibilityTime: 2500,
          });
        },
      },
    );
  };

  // 바텀시트 - 사물함 QR
  const handleGoLocker = () => {
    setAcceptedSheet(null);
    router.push(ROUTES.SCAN);
    // TODO: locker_id 활용하여 사물함 안내 화면으로 이동
  };

  if (isLoading) {
    return (
      <View
        style={[
          styles.container,
          { alignItems: "center", justifyContent: "center" },
        ]}
      >
        <ActivityIndicator color="#6366f1" size="large" />
      </View>
    );
  }

  // FlatList 데이터: 진행 중 + 구분선 + 완료된 것
  const listData: (
    | { type: "match"; data: ItemMatchResultResponse; isCompleted: boolean }
    | { type: "divider" }
  )[] = [
    ...pendingMatches.map((m) => ({
      type: "match" as const,
      data: m,
      isCompleted: false,
    })),
    ...(completedMatches.length > 0 && pendingMatches.length > 0
      ? [{ type: "divider" as const }]
      : []),
    ...completedMatches.map((m) => ({
      type: "match" as const,
      data: m,
      isCompleted: true,
    })),
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={22} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI 매칭 결과</Text>
        <View style={{ width: 36 }} />
      </View>

      <FlatList
        data={listData}
        keyExtractor={(item, idx) =>
          item.type === "divider"
            ? `divider-${idx}`
            : String(item.data.match_id)
        }
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
        ListHeaderComponent={
          <View>
            {pendingMatches.length > 0 && (
              <View style={styles.intro}>
                <View style={styles.introIcon}>
                  <Sparkles size={20} color="#6366f1" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.introTitle}>
                    분실물과 유사한 습득물 {pendingMatches.length}개를
                    발견했어요
                  </Text>
                  <Text style={styles.introDesc}>
                    유사도 높은 순으로 최대 5개를 보여드려요
                  </Text>
                </View>
              </View>
            )}
            {completedMatches.length > 0 && (
              <View style={styles.completedBadgeWrap}>
                <View style={styles.completedBadge}>
                  <CheckCircle size={12} color="#10b981" />
                  <Text style={styles.completedBadgeText}>
                    {completedMatches.length}건 완료
                  </Text>
                </View>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <View style={styles.emptyIconWrap}>
              <Sparkles size={36} color="#6366f1" />
            </View>
            <Text style={styles.emptyTitle}>매칭 후보가 없어요</Text>
            <Text style={styles.emptyDesc}>
              새로운 매칭이 생기면 알림으로 알려드릴게요
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          if (item.type === "divider") {
            return (
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>반환 완료된 매칭</Text>
                <View style={styles.dividerLine} />
              </View>
            );
          }

          const match = item.data;
          const imageUrl = match.found_image_url
            ? match.found_image_url.startsWith("http")
              ? match.found_image_url
              : `${BASE_URL}${match.found_image_url}`
            : null;
          const scorePercent = Math.round(match.score * 100);
          const isConfirming = confirmMutation.isPending;

          // 완료된 카드
          if (item.isCompleted) {
            return (
              <View style={[styles.card, styles.completedCard]}>
                <View style={styles.imageWrap}>
                  {imageUrl ? (
                    <Image
                      source={{ uri: imageUrl }}
                      style={[styles.image, { opacity: 0.6 }]}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <Sparkles size={32} color="#6366f1" />
                    </View>
                  )}
                  <View style={styles.completedOverlay}>
                    <View style={styles.completedCheckCircle}>
                      <CheckCircle size={28} color="#fff" />
                    </View>
                    <Text style={styles.completedOverlayText}>매칭 완료</Text>
                  </View>
                </View>
                <View style={styles.completedBanner}>
                  <CheckCircle2 size={14} color="#fff" />
                  <Text style={styles.completedBannerText}>
                    매칭이 성공적으로 처리됐어요
                  </Text>
                </View>
                <View style={styles.info}>
                  <Text style={styles.title} numberOfLines={1}>
                    {match.found_post_title}
                  </Text>
                  {match.location_name ? (
                    <View style={styles.locationRow}>
                      <Building2 size={13} color="#888" />
                      <Text style={styles.location} numberOfLines={1}>
                        {match.location_name}
                      </Text>
                    </View>
                  ) : null}
                  <View style={styles.finderBox}>
                    <View style={styles.finderAvatar}>
                      <Text style={styles.finderAvatarText}>
                        {match.found_nickname?.charAt(0) ?? "?"}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.finderName}>
                        {match.found_nickname}
                      </Text>
                      {match.found_department ? (
                        <Text style={styles.finderDept}>
                          {match.found_department}
                        </Text>
                      ) : null}
                    </View>
                    <View style={styles.completedTag}>
                      <CheckCircle size={11} color="#10b981" />
                      <Text style={styles.completedTagText}>완료</Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          }

          // 진행 중 카드
          return (
            <View style={styles.card}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() =>
                  router.push({
                    pathname: ROUTES.LOST_ITEM_DETAIL,
                    params: { id: match.found_post_id },
                  })
                }
              >
                <View style={styles.imageWrap}>
                  {imageUrl ? (
                    <Image
                      source={{ uri: imageUrl }}
                      style={styles.image}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <Sparkles size={32} color="#6366f1" />
                    </View>
                  )}
                  <View style={styles.scoreBadgeOverlay}>
                    <Award size={11} color="#fff" />
                    <Text style={styles.scoreBadgeText}>
                      유사도 {scorePercent}%
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>

              <View style={styles.info}>
                <Text style={styles.title} numberOfLines={1}>
                  {match.found_post_title}
                </Text>
                {match.location_name ? (
                  <View style={styles.locationRow}>
                    <Building2 size={13} color="#888" />
                    <Text style={styles.location} numberOfLines={1}>
                      {match.location_name}
                    </Text>
                  </View>
                ) : null}
                <View style={styles.finderBox}>
                  <View style={styles.finderAvatar}>
                    <Text style={styles.finderAvatarText}>
                      {match.found_nickname?.charAt(0) ?? "?"}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.finderName}>
                      {match.found_nickname}
                    </Text>
                    {match.found_department ? (
                      <Text style={styles.finderDept}>
                        {match.found_department}
                      </Text>
                    ) : null}
                  </View>
                </View>
              </View>

              <View style={styles.btnRow}>
                <TouchableOpacity
                  style={styles.rejectBtn}
                  onPress={() => openRejectModal(match.match_id)}
                  activeOpacity={0.85}
                  disabled={isConfirming}
                >
                  <XCircle size={16} color="#888" />
                  <Text style={styles.rejectBtnText}>내 거 아니에요</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmBtn, isConfirming && { opacity: 0.6 }]}
                  onPress={() => handleConfirm(match)}
                  activeOpacity={0.85}
                  disabled={isConfirming}
                >
                  {isConfirming ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <CheckCircle2 size={16} color="#fff" />
                      <Text style={styles.confirmBtnText}>내 물건이에요</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />

      {/* 거절 확인 모달 */}
      <Modal visible={modalType === "reject"} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={closeModal} />
        <View style={styles.modalWrap}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>매칭을 거절하시겠어요?</Text>
            <Text style={styles.modalDesc}>
              거절한 매칭은 다시 받을 수 없어요.
            </Text>
            <TouchableOpacity
              style={[styles.modalBtn, styles.modalBtnDanger]}
              onPress={handleReject}
            >
              <Text style={styles.modalBtnText}>거절하기</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={closeModal}>
              <Text style={styles.cancelBtnText}>취소</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 수락 후 바텀시트 */}
      {acceptedSheet && (
        <AcceptedSheet
          match={acceptedSheet.match}
          matchType={acceptedSheet.matchType}
          onClose={() => setAcceptedSheet(null)}
          onGoChat={handleGoChat}
          onGoLocker={handleGoLocker}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#f0f0f0",
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 16, fontFamily: fonts.bold, color: "#111" },
  listContent: { padding: 16, paddingBottom: 40, gap: 16 },
  intro: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eef2ff",
    borderRadius: 14,
    padding: 14,
    gap: 12,
    marginBottom: 4,
  },
  introIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  introTitle: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: "#6366f1",
    marginBottom: 2,
  },
  introDesc: {
    fontSize: 11,
    fontFamily: fonts.regular,
    color: "#6366f1",
    opacity: 0.8,
  },
  completedBadgeWrap: { alignItems: "flex-end", marginTop: 8, marginBottom: 4 },
  completedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#ecfdf5",
    borderWidth: 1,
    borderColor: "#a7f3d0",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  completedBadgeText: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: "#10b981",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  completedCard: { borderColor: "#a7f3d0" },
  imageWrap: { position: "relative" },
  image: { width: "100%", height: 200, backgroundColor: "#f5f6f8" },
  imagePlaceholder: {
    width: "100%",
    height: 200,
    backgroundColor: "#eef2ff",
    alignItems: "center",
    justifyContent: "center",
  },
  scoreBadgeOverlay: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  scoreBadgeText: { fontSize: 11, fontFamily: fonts.bold, color: "#fff" },
  // 완료 카드 오버레이
  completedOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(16,185,129,0.4)",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  completedCheckCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#10b981",
    alignItems: "center",
    justifyContent: "center",
  },
  completedOverlayText: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: "#fff",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  completedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#10b981",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  completedBannerText: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: "#fff",
    flex: 1,
  },
  info: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 14, gap: 6 },
  title: { fontSize: 16, fontFamily: fonts.bold, color: "#111" },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  location: { fontSize: 12, fontFamily: fonts.regular, color: "#888" },
  finderBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#f8f8fa",
    borderRadius: 12,
    padding: 10,
    marginTop: 4,
  },
  finderAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#eef2ff",
    alignItems: "center",
    justifyContent: "center",
  },
  finderAvatarText: { fontSize: 13, fontFamily: fonts.bold, color: "#6366f1" },
  finderName: { fontSize: 12, fontFamily: fonts.bold, color: "#333" },
  finderDept: {
    fontSize: 11,
    fontFamily: fonts.regular,
    color: "#aaa",
    marginTop: 1,
  },
  completedTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  completedTagText: { fontSize: 10, fontFamily: fonts.bold, color: "#10b981" },
  btnRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  rejectBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#f5f6f8",
  },
  rejectBtnText: { fontSize: 13, fontFamily: fonts.bold, color: "#888" },
  confirmBtn: {
    flex: 1.4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#6366f1",
    shadowColor: "#6366f1",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  confirmBtnText: { fontSize: 13, fontFamily: fonts.bold, color: "#fff" },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginVertical: 8,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#f0f0f0" },
  dividerText: { fontSize: 11, fontFamily: fonts.medium, color: "#aaa" },
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
  emptyDesc: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: "#aaa",
    textAlign: "center",
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modalWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  modalCard: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  modalTitle: { fontSize: 17, fontFamily: fonts.bold, color: "#111" },
  modalDesc: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: "#666",
    lineHeight: 19,
  },
  modalBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  modalBtnDanger: { backgroundColor: "#f87171" },
  modalBtnText: { fontSize: 15, fontFamily: fonts.bold, color: "#fff" },
  cancelBtn: { paddingVertical: 10, alignItems: "center" },
  cancelBtnText: { fontSize: 14, fontFamily: fonts.regular, color: "#aaa" },
});

// 바텀시트 스타일
const sheetStyles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  wrap: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 32,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#e5e5e5",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    backgroundColor: "#ecfdf5",
    borderWidth: 1,
    borderColor: "#a7f3d0",
    borderRadius: 16,
    marginBottom: 16,
  },
  bannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#10b981",
    alignItems: "center",
    justifyContent: "center",
  },
  bannerTitle: { fontSize: 14, fontFamily: fonts.bold, color: "#065f46" },
  bannerDesc: {
    fontSize: 11,
    fontFamily: fonts.regular,
    color: "#10b981",
    marginTop: 2,
  },
  infoBox: {
    backgroundColor: "#f8f8fa",
    borderWidth: 1,
    borderColor: "#f0f0f0",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  finderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  finderAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#eef2ff",
    alignItems: "center",
    justifyContent: "center",
  },
  finderAvatarText: { fontSize: 16, fontFamily: fonts.bold, color: "#6366f1" },
  finderName: { fontSize: 14, fontFamily: fonts.bold, color: "#111" },
  finderDept: {
    fontSize: 11,
    fontFamily: fonts.regular,
    color: "#888",
    marginTop: 2,
  },
  infoDesc: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: "#666",
    lineHeight: 18,
  },
  lockerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  lockerIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
  },
  lockerTitle: { fontSize: 13, fontFamily: fonts.bold, color: "#333" },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  actionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  actionTitle: { fontSize: 14, fontFamily: fonts.bold, color: "#fff" },
  actionDesc: {
    fontSize: 11,
    fontFamily: fonts.regular,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
  laterBtn: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
  },
  laterBtnText: { fontSize: 13, fontFamily: fonts.medium, color: "#888" },
});
