import { fonts } from "@/constants/typography";
import { ROUTES } from "@/constants/url";
import { useLogin } from "@/hooks/mutations/useAuthMutations";
import { getFCMToken, sendTokenToServer } from "@/hooks/use-notifications";
import { useAuthStore } from "@/store/authStore";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { AlertCircle, Eye, EyeOff, Lock, Mail, X } from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const isSchoolEmail = (email: string) =>
  email.endsWith(".ac.kr") || email.endsWith(".edu");

export default function LoginPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");

  const loginMutation = useLogin();
  const isLoading = loginMutation.isPending;

  const isValid = isSchoolEmail(email) && password.length > 0;

  const handleLogin = async () => {
    setError("");
    if (!email) {
      setError("이메일을 입력해주세요.");
      return;
    }
    if (!isSchoolEmail(email)) {
      setError("학교 이메일(@*.ac.kr 또는 @*.edu)을 사용해주세요.");
      return;
    }
    if (!password) {
      setError("비밀번호를 입력해주세요.");
      return;
    }

    loginMutation.mutate(
      { schoolEmail: email, password },
      {
        onSuccess: async (result) => {
          if (result.success) {
            Keyboard.dismiss();
            console.log(
              "Login Success! Received Token:",
              result.data.accessToken,
            );
            // zustand 스토어 사용 (자동으로 AsyncStorage에 저장됨)
            useAuthStore.getState().setToken(result.data.accessToken);

            await getFCMToken(sendTokenToServer);

            // _layout.tsx의 가드 로직이 리다이렉트를 처리하지만,
            // 사용자 경험을 위해 명시적으로 이동합니다.
            router.replace(ROUTES.MAP);
          } else {
            setError(
              result.error || "이메일 또는 비밀번호가 올바르지 않습니다.",
            );
          }
        },
        onError: (e: any) => {
          if (e.response?.status === 401) {
            setError("이메일 또는 비밀번호가 올바르지 않습니다.");
          } else {
            setError("서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.");
          }
        },
      },
    );
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View
        style={[
          styles.container,
          { paddingTop: insets.top, paddingBottom: insets.bottom + 8 },
        ]}
      >
        <View style={styles.topArea}>
          <View style={styles.logoRow}>
            <LinearGradient
              colors={["#6366f1", "#818cf8"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoBox}
            >
              <Mail size={20} color="#fff" />
            </LinearGradient>
            <Text style={styles.appName}>줍줍</Text>
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>학교 이메일</Text>
            <View
              style={[styles.inputBox, emailError ? styles.inputError : null]}
            >
              <Mail size={18} color="#aaa" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="example@university.ac.kr"
                placeholderTextColor="#ccc"
                value={email}
                onChangeText={(v) => {
                  setEmail(v);
                  setError("");
                  setEmailError("");
                }}
                onBlur={() => {
                  if (email.length > 0 && !isSchoolEmail(email)) {
                    setEmailError("학교 이메일 형식이 아닙니다.");
                  }
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                spellCheck={false}
              />
              {email.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    setEmail("");
                    setEmailError("");
                    setError("");
                  }}
                >
                  <X size={18} color="#ccc" />
                </TouchableOpacity>
              )}
            </View>
            {emailError ? (
              <View style={styles.errorBox}>
                <AlertCircle size={13} color="#f87171" />
                <Text style={styles.errorText}>{emailError}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>비밀번호</Text>
            <View
              style={[
                styles.inputBox,
                error && !password ? styles.inputError : null,
              ]}
            >
              <Lock size={18} color="#aaa" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="비밀번호를 입력하세요"
                placeholderTextColor="#ccc"
                value={password}
                onChangeText={(v) => {
                  setPassword(v);
                  setError("");
                }}
                secureTextEntry={!showPassword}
                textContentType="oneTimeCode"
                autoComplete="off"
              />
              <TouchableOpacity onPress={() => setShowPassword((v) => !v)}>
                {showPassword ? (
                  <EyeOff size={20} color="#ccc" />
                ) : (
                  <Eye size={20} color="#ccc" />
                )}
              </TouchableOpacity>
              {password.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    setPassword("");
                    setError("");
                  }}
                  style={{ marginLeft: 8 }}
                >
                  <X size={18} color="#ccc" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <AlertCircle size={13} color="#f87171" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.buttonWrapper}>
            <TouchableOpacity
              onPress={handleLogin}
              disabled={!isValid || isLoading}
              style={styles.loginButtonWrapper}
              activeOpacity={0.85}
            >
              {isValid ? (
                <LinearGradient
                  colors={["#6366f1", "#818cf8"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[
                    styles.loginButton,
                    isLoading && styles.disabledButton,
                  ]}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.loginButtonText}>로그인</Text>
                  )}
                </LinearGradient>
              ) : (
                <View style={[styles.loginButton, styles.loginButtonInactive]}>
                  <Text
                    style={[
                      styles.loginButtonText,
                      styles.loginButtonTextInactive,
                    ]}
                  >
                    로그인
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.linkRow}>
            <TouchableOpacity onPress={() => router.push(ROUTES.SIGNUP)}>
              <Text style={styles.linkTextBold}>회원가입</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.termsRow}>
          <TouchableOpacity>
            <Text style={styles.termsText}>이용약관</Text>
          </TouchableOpacity>
          <Text style={styles.termsDivider}>·</Text>
          <TouchableOpacity>
            <Text style={styles.termsText}>개인정보 처리방침</Text>
          </TouchableOpacity>
          <Text style={styles.termsDivider}>·</Text>
          <TouchableOpacity>
            <Text style={styles.termsText}>문의하기</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingHorizontal: 28 },
  topArea: { flex: 1, justifyContent: "flex-start", paddingTop: 50 },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 56,
  },
  logoBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  appName: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#111",
    fontFamily: fonts.bold,
  },
  inputWrapper: { marginBottom: 13 },
  label: {
    fontSize: 13,
    color: "#666",
    marginBottom: 8,
    fontFamily: fonts.medium,
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    height: 50,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: "#f5f6f8",
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
    height: "100%",
    paddingVertical: 0,
    textAlignVertical: "center",
    includeFontPadding: false,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 6,
  },
  errorText: { fontSize: 13, color: "#f87171", fontFamily: fonts.regular },
  buttonWrapper: { marginTop: 24, marginBottom: 16 },
  loginButtonWrapper: { borderRadius: 14, overflow: "hidden" },
  loginButton: { height: 58, alignItems: "center", justifyContent: "center" },
  loginButtonInactive: { backgroundColor: "#e5e5e5" },
  disabledButton: { opacity: 0.6 },
  loginButtonText: {
    fontWeight: "700",
    fontSize: 16,
    fontFamily: fonts.bold,
    color: "#fff",
  },
  loginButtonTextInactive: { color: "#aaa" },
  linkRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  linkText: { fontSize: 13, color: "#aaa", fontFamily: fonts.regular },
  linkTextBold: { fontSize: 13, color: "#6366f1", fontFamily: fonts.bold },
  termsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    paddingBottom: 8,
  },
  termsText: { fontSize: 12, color: "#aaa", fontFamily: fonts.regular },
  termsDivider: { fontSize: 12, color: "#ddd" },
});
