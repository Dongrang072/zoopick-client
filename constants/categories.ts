import {
    Backpack,
    BookOpen,
    CreditCard,
    GlassWater,
    Headphones,
    Package,
    PawPrint,
    PencilRuler,
    Smartphone,
    Umbrella,
    Wallet,
} from "lucide-react-native";

export const CATEGORY_MAP: Record<string, string> = {
  SMARTPHONE: "스마트폰",
  EARPHONES: "이어폰",
  BAG: "가방",
  WALLET: "지갑",
  CREDIT_CARD: "카드",
  TEXTBOOK: "책",
  UMBRELLA: "우산",
  WATER_BOTTLE: "물병",
  PENCIL_CASE: "필통",
  PLUSH_TOY: "인형",
  OTHER: "기타",
};

export const CATEGORY_ICON_MAP: Record<string, any> = {
  SMARTPHONE: Smartphone,
  EARPHONES: Headphones,
  BAG: Backpack,
  WALLET: Wallet,
  CREDIT_CARD: CreditCard,
  TEXTBOOK: BookOpen,
  UMBRELLA: Umbrella,
  WATER_BOTTLE: GlassWater,
  PENCIL_CASE: PencilRuler,
  PLUSH_TOY: PawPrint,
  OTHER: Package,
};

export const ITEM_TYPE_MAP: Record<string, string> = {
  LOST: "찾는중",
  FOUND: "발견됨",
};

export const ITEM_STATUS_STYLE: Record<
  string,
  { bg: string; text: string; dot: string }
> = {
  LOST: { bg: "#fff7ed", text: "#f97316", dot: "#f97316" },
  FOUND: { bg: "#dcfce7", text: "#16a34a", dot: "#22c55e" },
  THEFT_CONFIRMED: { bg: "#fee2e2", text: "#dc2626", dot: "#ef4444" },
};

export const ITEM_STATUS_LABEL: Record<string, string> = {
  THEFT_CONFIRMED: "도난 확정",
};

export const CATEGORIES: { label: string; value: string }[] = [
  { label: "스마트폰", value: "SMARTPHONE" },
  { label: "이어폰", value: "EARPHONES" },
  { label: "가방", value: "BAG" },
  { label: "지갑", value: "WALLET" },
  { label: "카드", value: "CREDIT_CARD" },
  { label: "책", value: "TEXTBOOK" },
  { label: "우산", value: "UMBRELLA" },
  { label: "물병", value: "WATER_BOTTLE" },
  { label: "필통", value: "PENCIL_CASE" },
  { label: "인형", value: "PLUSH_TOY" },
];

export const COLORS: { label: string; value: string }[] = [
  { label: "검정", value: "BLACK" },
  { label: "흰색", value: "WHITE" },
  { label: "회색", value: "GRAY" },
  { label: "빨강", value: "RED" },
  { label: "파랑", value: "BLUE" },
  { label: "초록", value: "GREEN" },
  { label: "노랑", value: "YELLOW" },
  { label: "갈색", value: "BROWN" },
  { label: "분홍", value: "PINK" },
  { label: "보라", value: "PURPLE" },
  { label: "주황", value: "ORANGE" },
  { label: "베이지", value: "BEIGE" },
];

export const CATEGORY_TO_API: Record<string, string> = {
  전체: "",
  스마트폰: "SMARTPHONE",
  이어폰: "EARPHONES",
  가방: "BAG",
  지갑: "WALLET",
  카드: "CREDIT_CARD",
  책: "TEXTBOOK",
  우산: "UMBRELLA",
  물병: "WATER_BOTTLE",
  필통: "PENCIL_CASE",
  인형: "PLUSH_TOY",
};

export const CATEGORY_OPTIONS = [
  "전체",
  "스마트폰",
  "이어폰",
  "가방",
  "지갑",
  "카드",
  "책",
  "우산",
  "물병",
  "필통",
  "인형",
];
