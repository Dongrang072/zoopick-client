import { authService } from "@/api/services/auth";
import ProfileEditModal from "@/components/ProfileEditModal";
import { ROUTES } from "@/constants/url";
import { useProfile } from "@/hooks/queries/useUserQueries";
import { useAuthStore } from "@/store/authStore";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import {
  Bell,
  Camera,
  ChevronRight,
  LogOut,
  MessageCircle,
  QrCode,
  ShieldCheck,
  TrendingUp,
  User,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function MyPageScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: profile, isLoading } = useProfile();
  const { clearToken } = useAuthStore();
  const queryClient = useQueryClient();

  const [pushEnabled, setPushEnabled] = useState(true);
  const [chatOnlyMode, setChatOnlyMode] = useState(true);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  const handleLogout = async () => {
    Alert.alert("로그아웃", "정말 로그아웃 하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "확인",
        onPress: async () => {
          try {
            await authService.logout();
          } catch {
            // 서버 실패해도 로컬 정리 진행
          } finally {
            clearToken(); // 토큰 먼저 제거 → enabled: !!token = false
            queryClient.clear(); // 이후 캐시 정리 (re-fetch 시도 안 함)
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <Text className="text-gray-500 font-pretendard-medium">로딩 중...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-4 py-4 flex-row items-center justify-between bg-white border-b border-gray-100">
        <Text className="text-xl font-pretendard-bold text-gray-900">
          내 정보
        </Text>
        <TouchableOpacity
          className="relative p-2"
          onPress={() => router.push(ROUTES.NOTIFICATION as any)}
        >
          <Bell size={24} color="#1F2937" />
          {profile && profile.unreadNotificationCount > 0 && (
            <View className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View className="bg-white px-4 py-6 border-b border-gray-100">
          <View className="flex-row items-center">
            <View className="relative">
              <View className="w-20 h-20 rounded-full bg-indigo-50 items-center justify-center border-2 border-indigo-100 overflow-hidden">
                <User size={32} color="#818CF8" />
              </View>
            </View>

            <View className="flex-1 ml-5">
              <Text className="text-xl font-pretendard-bold text-gray-900">
                {profile?.nickname ?? "사용자"}
              </Text>
              <Text className="text-sm font-pretendard-medium text-indigo-600 mt-1">
                {profile?.department ?? "학과 정보 없음"}
              </Text>
              <Text className="text-xs font-pretendard-regular text-gray-400 mt-1">
                명지대학교 자연캠퍼스
              </Text>
            </View>

            <TouchableOpacity
              className="flex-row items-center bg-indigo-50 px-3 py-2 rounded-full"
              onPress={() => setIsEditModalVisible(true)}
            >
              <Text className="text-xs font-pretendard-semibold text-indigo-600 mr-1">
                프로필 수정
              </Text>
              <ChevronRight size={12} color="#4F6EF7" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Section */}
        <View className="flex-row bg-white border-b border-gray-100">
          {[
            { label: "주은 물품", value: profile?.postCount ?? 0 },
            { label: "채팅방 수", value: profile?.chatRoomCount ?? 0 },
            {
              label: "읽지 않은 알림",
              value: profile?.unreadNotificationCount ?? 0,
            },
          ].map((stat, idx) => (
            <View
              key={stat.label}
              className={`flex-1 items-center py-4 ${idx < 2 ? "border-r border-gray-50" : ""}`}
            >
              <Text className="text-lg font-pretendard-bold text-gray-900">
                {stat.value}
              </Text>
              <Text className="text-xs font-pretendard-medium text-gray-400 mt-1">
                {stat.label}
              </Text>
            </View>
          ))}
        </View>

        {/* AI 매칭 + CCTV 분석 섹션 */}
        <View className="flex-row gap-3 mx-4 mt-4">
          {/* AI 매칭 카드 */}
          <TouchableOpacity
            className="flex-1 bg-white rounded-3xl p-4 border border-gray-100 shadow-sm overflow-hidden"
            onPress={() => router.push(ROUTES.MATCHES)}
            activeOpacity={0.85}
          >
            <View className="w-11 h-11 rounded-2xl bg-indigo-500 items-center justify-center mb-3">
              <TrendingUp size={22} color="#fff" />
            </View>
            {/* 배경 원 장식 */}
            <View
              className="absolute top-3 right-3 w-16 h-16 rounded-full bg-indigo-100"
              style={{ opacity: 0.4 }}
            />
            <Text className="text-sm font-pretendard-bold text-gray-900 mb-0.5">
              AI 매칭
            </Text>
            <Text className="text-xs font-pretendard-regular text-gray-400 mb-2">
              유사 분실물 자동 분석
            </Text>
            <View className="flex-row items-center gap-1">
              <View className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            </View>
          </TouchableOpacity>

          {/* CCTV 분석 카드 */}
          <TouchableOpacity
            className="flex-1 bg-white rounded-3xl p-4 border border-gray-100 shadow-sm overflow-hidden"
            onPress={() => router.push(ROUTES.CCTV_ITEMS)}
            activeOpacity={0.85}
          >
            <View className="w-11 h-11 rounded-2xl bg-red-400 items-center justify-center mb-3">
              <Camera size={22} color="#fff" />
            </View>
            {/* 배경 원 장식 */}
            <View
              className="absolute top-3 right-3 w-16 h-16 rounded-full bg-red-100"
              style={{ opacity: 0.4 }}
            />
            <Text className="text-sm font-pretendard-bold text-gray-900 mb-0.5">
              CCTV 분석
            </Text>
            <Text className="text-xs font-pretendard-regular text-gray-400 mb-2">
              도난 영상 분석 현황
            </Text>
            <View className="flex-row items-center gap-1">
              <View className="w-1.5 h-1.5 rounded-full bg-gray-300" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Settings Section */}
        <View className="mt-4 mx-4 bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
          <Text className="text-sm font-pretendard-bold text-gray-800 px-5 pt-5 pb-3">
            설정
          </Text>

          <View className="flex-row items-center justify-between px-5 py-4 border-t border-gray-50">
            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-xl bg-blue-50 items-center justify-center mr-3">
                <Bell size={18} color="#3B82F6" />
              </View>
              <Text className="text-sm font-pretendard-medium text-gray-700">
                푸시 알림 설정
              </Text>
            </View>
            <Switch
              value={pushEnabled}
              onValueChange={setPushEnabled}
              trackColor={{ false: "#E5E7EB", true: "#C7D2FE" }}
              thumbColor={pushEnabled ? "#4F6EF7" : "#F9FAFB"}
            />
          </View>

          <View className="flex-row items-center justify-between px-5 py-4 border-t border-gray-50">
            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-xl bg-indigo-50 items-center justify-center mr-3">
                <MessageCircle size={18} color="#6366F1" />
              </View>
              <Text className="text-sm font-pretendard-medium text-gray-700">
                매칭 채팅만 받기
              </Text>
            </View>
            <Switch
              value={chatOnlyMode}
              onValueChange={setChatOnlyMode}
              trackColor={{ false: "#E5E7EB", true: "#C7D2FE" }}
              thumbColor={chatOnlyMode ? "#4F6EF7" : "#F9FAFB"}
            />
          </View>

          <TouchableOpacity className="flex-row items-center justify-between px-5 py-4 border-t border-gray-50">
            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-xl bg-purple-50 items-center justify-center mr-3">
                <ShieldCheck size={18} color="#A855F7" />
              </View>
              <Text className="text-sm font-pretendard-medium text-gray-700">
                개인정보 처리방침
              </Text>
            </View>
            <ChevronRight size={18} color="#D1D5DB" />
          </TouchableOpacity>
        </View>

        {/* Account Section */}
        <View className="mt-4 mx-4 mb-10 bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
          <Text className="text-sm font-pretendard-bold text-gray-800 px-5 pt-5 pb-3">
            계정
          </Text>

          <TouchableOpacity
            className="flex-row items-center justify-between px-5 py-4 border-t border-gray-50"
            onPress={() => router.push(ROUTES.MY_QR as any)}
          >
            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-xl bg-indigo-50 items-center justify-center mr-3">
                <QrCode size={18} color="#6366F1" />
              </View>
              <Text className="text-sm font-pretendard-medium text-gray-700">
                내 QR코드 발급
              </Text>
            </View>
            <ChevronRight size={18} color="#D1D5DB" />
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center justify-between px-5 py-4 border-t border-gray-50"
            onPress={handleLogout}
          >
            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-xl bg-red-50 items-center justify-center mr-3">
                <LogOut size={18} color="#EF4444" />
              </View>
              <Text className="text-sm font-pretendard-medium text-red-500">
                로그아웃
              </Text>
            </View>
            <ChevronRight size={18} color="#FEE2E2" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      <ProfileEditModal
        isVisible={isEditModalVisible}
        onClose={() => setIsEditModalVisible(false)}
        profile={profile}
      />
    </View>
  );
}
