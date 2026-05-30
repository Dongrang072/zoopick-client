# ZooPick — 캠퍼스 분실물 플랫폼

[![Expo](https://img.shields.io/badge/Expo-54.0-000020?logo=expo)](https://expo.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![React Native](https://img.shields.io/badge/React%20Native-0.79-61DAFB?logo=react&logoColor=black)](https://reactnative.dev)

> 명지대학교 자연 캠퍼스 학생들을 위한 분실물 신고·조회 모바일 애플리케이션

---

## 프로젝트 소개

캠퍼스에서 물건을 잃어버리거나 주운 경험이 있으신가요? ZooPick은 분실물 등록부터 AI 기반 자동 매칭, CCTV 연동 탐지, 실시간 채팅까지 하나의 앱에서 해결할 수 있도록 만들어진 서비스입니다.

- 분실물과 습득물을 지도 위에 직접 등록하고 위치를 시각적으로 확인
- AI가 분실물-습득물 쌍을 자동으로 분석해 매칭 제안
- 당사자 간 1:1 실시간 채팅으로 빠른 소통

---

## 주요 기능

| 기능 | 설명 |
|------|------|
| 지도 기반 분실물 등록 | 카카오맵 위에서 위치를 지정하고 사진·카테고리와 함께 등록 |
| AI 매칭 | 등록된 분실물과 습득물을 AI가 분석해 자동으로 매칭 제안 |
| 실시간 채팅 | WebSocket 기반 1:1 채팅으로 당사자 간 직접 소통 |
| 내 QR코드 발급 | 내 정보 페이지에서 개인 QR 코드를 조회하고 갤러리에 이미지 저장 |
| QR 코드 스캔 | 물건에 부착된 QR 코드를 스캔해 소유자 정보 즉시 조회 |
| IoT 사물함 제어 | QR 코드 스캔으로 교내 IoT 사물함 원격 개폐 |
| CCTV 연동 | 교내 CCTV 영상에서 AI가 분실물을 탐지하고 결과를 제공 |
| 푸시 알림 | Firebase FCM을 통해 매칭·채팅·분실물 알림 실시간 수신 |
| 시간표 연동 | 수업 정보와 캠퍼스 건물 위치를 지도와 함께 확인 |

---

## 기술 스택

| 분류 | 기술 |
|------|------|
| 프레임워크 | Expo 54 (React Native), Expo Router v6 |
| 언어 | TypeScript 5.9 |
| 상태 관리 | Zustand 5 (클라이언트), TanStack Query v5 (서버) |
| 스타일링 | NativeWind 4 (Tailwind CSS), React Native StyleSheet |
| API 통신 | Axios 1.15 (인터셉터·토큰 주입), WebSocket |
| 지도 | Kakao Maps API (WebView) |
| 알림 | Firebase Cloud Messaging (FCM) |
| 폼 / 유효성 | React Hook Form 7, Zod 4 |
| 날짜 처리 | dayjs |
| 오프라인 캐시 | AsyncStorage + React Query AsyncStorage Persister |

---

## 시작하기

> 이 프로젝트는 **Expo Go가 아닌 개발 빌드(Development Build)** 방식으로 실행합니다.

### 사전 준비

- Node.js LTS (v24.14.1 이상)
- Android Studio (Android SDK, Platform-Tools 포함)
- Android 기기 또는 에뮬레이터

### 빠른 시작

```bash
# 1. 레포 클론
git clone https://github.com/2026-mju-capstone/front.git
cd front

# 2. 패키지 설치
npm install

# 3. 환경변수 설정
# 프로젝트 루트에 .env 파일을 생성하고 아래 두 값을 입력하세요
EXPO_PUBLIC_BASE_URL=http://52.63.7.132:8080
EXPO_PUBLIC_KAKAO_API_KEY=your_kakao_api_key_here


# 4. Android 기기를 USB로 연결한 뒤 앱 빌드 및 실행
npx expo run:android
```

> 네이티브 패키지를 새로 설치한 경우 `npx expo start`가 아니라 반드시 `npx expo run:android`를 다시 실행해야 합니다.

<details>
<summary>Android 기기 설정 (USB 디버깅 활성화)</summary>

1. 설정 → 휴대전화 정보 → 소프트웨어 정보
2. 빌드 번호를 7번 터치 → 개발자 옵션 활성화
3. 설정 → 개발자 옵션 → USB 디버깅 ON
4. USB 연결 후 기기에서 "USB 디버깅 허용" 팝업 허용

</details>

<details>
<summary>앱 권한 안내</summary>

앱 실행 후 아래 권한을 허용해야 정상 동작합니다.

- 카메라 — 분실물 사진 촬영 및 QR 코드 스캔
- 사진/미디어 — 갤러리에서 사진 선택 및 QR 코드 이미지 저장
- 위치 — 캠퍼스 지도에서 현재 위치 표시

</details>

<details>
<summary>자주 발생하는 문제</summary>

**QR을 찍었는데 Expo Go에서 열리지 않아요**
이 프로젝트는 Expo Go가 아닌 개발 빌드 앱으로 실행해야 합니다. `npx expo run:android`로 앱을 먼저 설치해주세요.

**`localhost:8081` 화면이 떠요**
휴대폰과 PC가 같은 네트워크에 있는지 확인하세요. 학교 와이파이처럼 기기 간 통신이 막힌 환경이라면 핫스팟을 사용하세요.

**네이티브 모듈 오류 (Cannot find native module)**
새로운 네이티브 패키지가 추가된 경우입니다. `npx expo run:android`로 다시 빌드하세요.

**앱 설치가 안 돼요**
USB 디버깅 활성화 여부, USB 케이블의 데이터 전송 지원 여부, Android Studio SDK 설치 여부를 확인하세요.

</details>

---

## 프로젝트 구조

```
front/
├── app/                # Expo Router 화면 (파일 기반 라우팅)
│   ├── (auth)/         # 로그인, 회원가입 플로우
│   ├── (tabs)/         # 메인 탭 화면 (지도, 게시판, 스캔, 시간표, 채팅)
│   └── _layout.tsx     # 루트 레이아웃 및 전역 프로바이더
├── api/
│   ├── client.ts       # Axios 인스턴스 (토큰 주입, 401 처리)
│   ├── types.ts        # 모든 API 응답/요청 TypeScript 타입
│   └── services/       # 도메인별 API 함수 (auth, item, chat, match...)
├── components/         # 재사용 UI 컴포넌트
├── hooks/
│   ├── queries/        # React Query 조회 훅
│   └── mutations/      # React Query 변경 훅
├── store/              # Zustand 전역 상태 (auth, loading, timetable)
├── constants/          # 테마, URL, 카테고리, 건물 좌표 등 상수
└── utils/              # 순수 유틸 함수 (날짜 포맷, 지도 마커 등)
```

---

## 아키텍처

### 데이터 흐름

```
화면 (app/)
    |
    | 훅 호출
    v
hooks/queries · mutations/   <-->   Zustand store (auth, loading)
    |
    | 서비스 호출
    v
api/services/                <-->   api/types.ts (공유 타입)
    |
    | HTTP / WebSocket
    v
백엔드 서버
```

### 규칙

- `app/` 화면 파일에는 UI 로직과 훅 호출만 작성합니다. `axios.get` / `axios.post`를 직접 사용하지 않습니다.
- 새 기능을 추가할 때는 `api/types.ts` → `api/services/` → `hooks/queries` 또는 `hooks/mutations/` 순서로 작성합니다.
- `utils/`는 순수 함수(사이드 이펙트 없음)만 허용합니다. API 호출이나 React 훅을 넣지 않습니다.
- `any` 타입 사용을 금지합니다. API 응답 타입은 반드시 `api/types.ts`에서 가져옵니다.

---

## 팀원

| 이름 | GitHub | 역할 |
|------|--------|------|
| Dongrang072 | [@Dongrang072](https://github.com/Dongrang072) | 프론트엔드 |
| wonjumini | [@wonjumini](https://github.com/wonjumini) | 프론트엔드 |
| lalaalal | [@lalaalal](https://github.com/lalaalal) | 프론트엔드 |
