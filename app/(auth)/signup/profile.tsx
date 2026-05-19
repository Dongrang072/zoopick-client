import SignupHeader from "@/components/SignupHeader";
import { DEPARTMENTS } from "@/constants/departments";
import { fonts } from "@/constants/typography";
import { ROUTES } from "@/constants/url";
import { useSignup } from "@/hooks/mutations/useAuthMutations";
import { useCheckNickname } from "@/hooks/queries/useAuthQueries";
import { useAuthStore } from "@/store/authStore";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  AlertCircle,
  Building2,
  Check,
  ChevronDown,
  Search,
  User,
  X,
} from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSignup as useSignupData } from "./_layout";

const GRADES = ["1학년", "2학년", "3학년", "4학년"];

export default function ProfilePage() {
  const { data, updateData } = useSignupData();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [isNicknameAvailable, setIsNicknameAvailable] = useState<
    boolean | null
  >(null);
  const [isDeptModalVisible, setIsDeptModalVisible] = useState(false);

  const signupMutation = useSignup();
  const nicknameQuery = useCheckNickname(data.nickname);
  const isLoading = signupMutation.isPending;

  useEffect(() => {
    if (data.nickname.length > 0 && nicknameQuery.data) {
      setIsNicknameAvailable(
        nicknameQuery.data.success && nicknameQuery.data.data.available,
      );
    } else {
      setIsNicknameAvailable(null);
    }
  }, [nicknameQuery.data, data.nickname]);

  // 검색어 기반 학과 필터링
  const filteredDepartments = useMemo(
    () => DEPARTMENTS.filter((dept) => dept.includes(searchQuery.trim())),
    [searchQuery],
  );

  const openDeptModal = () => {
    Keyboard.dismiss();
    setSearchQuery("");
    setIsDeptModalVisible(true);
  };

  const closeDeptModal = () => {
    setIsDeptModalVisible(false);
    setSearchQuery("");
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!data.nickname.trim()) e.nickname = "닉네임을 입력해주세요.";
    if (isNicknameAvailable === false)
      e.nickname = "이미 사용 중인 닉네임입니다.";
    if (!data.department) e.department = "학과를 선택해주세요.";
    if (!data.grade) e.grade = "학년을 선택해주세요.";
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }
    signupMutation.mutate(
      {
        schoolEmail: data.email,
        password: data.password,
        nickname: data.nickname,
        department: data.department,
        grade: data.grade,
      },
      {
        onSuccess: async (result) => {
          if (result.success) {
            if (result.data.access_token) {
              useAuthStore.getState().setToken(result.data.access_token);
            }
            router.replace(ROUTES.MAP);
          } else {
            setErrors({ nickname: result.error || "회원가입에 실패했습니다." });
          }
        },
        onError: () => {
          setErrors({
            nickname: "서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.",
          });
        },
      },
    );
  };

  const isValid =
    data.nickname.trim().length > 0 &&
    isNicknameAvailable === true &&
    !!data.department &&
    !!data.grade;

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <SignupHeader stepIndex={3} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={{
            paddingHorizontal: 28,
            paddingTop: 20,
            paddingBottom: insets.bottom + 40,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          <View style={styles.titleArea}>
            <Text style={styles.title}>프로필 설정</Text>
            <Text style={styles.subtitle}>
              서비스에서 사용할 정보를 입력해주세요
            </Text>
          </View>

          {/* 닉네임 */}
          <Text style={styles.label}>닉네임</Text>
          <View
            style={[
              styles.inputBox,
              errors.nickname ? styles.inputError : null,
            ]}
          >
            <User size={18} color="#aaa" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="닉네임을 입력해주세요"
              placeholderTextColor="#ccc"
              value={data.nickname}
              onChangeText={(v) => {
                updateData({ nickname: v });
                setErrors((p) => ({ ...p, nickname: "" }));
              }}
              autoCorrect={false}
              spellCheck={false}
            />
            {data.nickname.length > 0 && (
              <TouchableOpacity onPress={() => updateData({ nickname: "" })}>
                <X size={18} color="#ccc" />
              </TouchableOpacity>
            )}
          </View>
          {errors.nickname ? (
            <View style={styles.errorBox}>
              <AlertCircle size={13} color="#f87171" />
              <Text style={styles.errorText}>{errors.nickname}</Text>
            </View>
          ) : null}

          {/* 학과 */}
          <Text style={styles.label}>학과</Text>
          <TouchableOpacity
            style={[
              styles.inputBox,
              errors.department ? styles.inputError : null,
            ]}
            onPress={openDeptModal}
          >
            <Building2 size={18} color="#aaa" style={styles.inputIcon} />
            <Text
              style={[
                styles.input,
                !data.department && { color: "#ccc" },
                { textAlignVertical: "center", lineHeight: 50 },
              ]}
            >
              {data.department || "학과를 선택하세요"}
            </Text>
            <ChevronDown size={16} color="#aaa" />
          </TouchableOpacity>
          {errors.department ? (
            <View style={styles.errorBox}>
              <AlertCircle size={13} color="#f87171" />
              <Text style={styles.errorText}>{errors.department}</Text>
            </View>
          ) : null}

          {/* 학년 */}
          <Text style={styles.label}>학년</Text>
          <View style={styles.gradeRow}>
            {GRADES.map((grade) => (
              <TouchableOpacity
                key={grade}
                style={[
                  styles.gradeButton,
                  data.grade === grade && styles.gradeButtonActive,
                ]}
                onPress={() => {
                  updateData({ grade });
                  setErrors((p) => ({ ...p, grade: "" }));
                }}
              >
                <Text
                  style={[
                    styles.gradeText,
                    data.grade === grade && styles.gradeTextActive,
                  ]}
                >
                  {grade}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.grade ? (
            <View style={styles.errorBox}>
              <AlertCircle size={13} color="#f87171" />
              <Text style={styles.errorText}>{errors.grade}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!isValid || isLoading}
            activeOpacity={0.85}
            style={[styles.buttonWrapper, { marginTop: 32 }]}
          >
            {isValid ? (
              <LinearGradient
                colors={["#6366f1", "#818cf8"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.button, isLoading && styles.disabledButton]}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>회원가입 완료</Text>
                )}
              </LinearGradient>
            ) : (
              <View style={[styles.button, styles.buttonInactive]}>
                <Text style={[styles.buttonText, styles.buttonTextInactive]}>
                  회원가입 완료
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* 학과 선택 모달 */}
      <Modal
        visible={isDeptModalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeDeptModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            {/* Handle */}
            <View style={styles.handleWrap}>
              <View style={styles.handle} />
            </View>

            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>학과 선택</Text>
              <TouchableOpacity onPress={closeDeptModal}>
                <X size={22} color="#333" />
              </TouchableOpacity>
            </View>

            {/* Search */}
            <View style={styles.searchBox}>
              <Search size={16} color="#aaa" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="학과 검색"
                placeholderTextColor="#ccc"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCorrect={false}
                autoCapitalize="none"
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <X size={16} color="#ccc" />
                </TouchableOpacity>
              )}
            </View>

            {/* List */}
            <ScrollView
              style={{ flex: 1 }}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
            >
              {filteredDepartments.length > 0 ? (
                filteredDepartments.map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={[
                      styles.deptItem,
                      data.department === item && styles.deptItemSelected,
                    ]}
                    onPress={() => {
                      updateData({ department: item });
                      setErrors((p) => ({ ...p, department: "" }));
                      closeDeptModal();
                    }}
                  >
                    <Text
                      style={[
                        styles.deptItemText,
                        data.department === item && styles.deptItemTextSelected,
                      ]}
                    >
                      {item}
                    </Text>
                    {data.department === item && (
                      <Check size={18} color="#6366f1" />
                    )}
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyText}>검색 결과가 없어요</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  titleArea: { marginBottom: 28 },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111",
    fontFamily: fonts.bold,
    lineHeight: 34,
    marginBottom: 8,
  },
  subtitle: { fontSize: 15, color: "#aaa", fontFamily: fonts.regular },
  label: {
    fontSize: 13,
    color: "#666",
    marginBottom: 6,
    fontFamily: fonts.medium,
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    height: 50,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: "#f5f6f8",
    marginBottom: 8,
  },
  inputError: {
    backgroundColor: "#fef2f2",
    borderWidth: 1.5,
    borderColor: "#f87171",
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#222",
    fontFamily: fonts.regular,
    letterSpacing: 0,
    height: "100%",
    paddingVertical: 0,
    textAlignVertical: "center",
    includeFontPadding: false,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 8,
    marginTop: 2,
  },
  errorText: { fontSize: 13, color: "#f87171", fontFamily: fonts.regular },
  gradeRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  gradeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#f5f6f8",
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  gradeButtonActive: { backgroundColor: "#eef2ff", borderColor: "#6366f1" },
  gradeText: { fontSize: 14, color: "#aaa", fontFamily: fonts.medium },
  gradeTextActive: { color: "#6366f1", fontFamily: fonts.bold },
  buttonWrapper: { borderRadius: 14, overflow: "hidden" },
  button: { height: 54, alignItems: "center", justifyContent: "center" },
  buttonInactive: { backgroundColor: "#e5e5e5" },
  disabledButton: { opacity: 0.6 },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
    fontFamily: fonts.bold,
  },
  buttonTextInactive: { color: "#aaa" },
  // 모달 스타일
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: "90%",
  },
  handleWrap: { alignItems: "center", paddingTop: 12, paddingBottom: 4 },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#e5e5e5",
    borderRadius: 2,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
    fontFamily: fonts.bold,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginVertical: 12,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#f5f6f8",
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#222",
    fontFamily: fonts.regular,
    letterSpacing: 0,
    paddingVertical: 0,
    includeFontPadding: false,
  },
  deptItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  deptItemSelected: { backgroundColor: "#f0f4ff" },
  deptItemText: { fontSize: 15, color: "#333", fontFamily: fonts.regular },
  deptItemTextSelected: { color: "#6366f1", fontFamily: fonts.bold },
  emptyBox: { alignItems: "center", paddingVertical: 40 },
  emptyText: { fontSize: 14, color: "#aaa", fontFamily: fonts.regular },
});
