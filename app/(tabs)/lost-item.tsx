import { BASE_BUILDINGS } from "@/constants/buildings";
import {
  CATEGORY_ICON_MAP,
  CATEGORY_MAP,
  CATEGORY_TO_API,
  ITEM_STATUS_LABEL,
  ITEM_STATUS_STYLE,
  ITEM_TYPE_MAP,
} from "@/constants/categories";
import { fonts } from "@/constants/typography";
import { BASE_URL, ROUTES } from "@/constants/url";
import { useItemQueries } from "@/hooks/queries/useItemQueries";
import { useMetadataQueries } from "@/hooks/queries/useMetadataQueries";
import { useRouter } from "expo-router";
import NotificationBell from "@/components/NotificationBell";
import {
  ChevronDown,
  MapPin,
  Package,
  Plus,
  Search,
  User,
  X,
} from "lucide-react-native";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const CATEGORY_OPTIONS = [
  "전체",
  "스마트폰",
  "이어폰",
  "가방",
  "지갑",
  "카드",
  "학생증",
  "교재",
  "노트",
  "우산",
  "물병",
  "필통",
  "인형",
];
const STATUS_OPTIONS = ["전체", "찾는중", "발견됨"];

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 60) return `${min}분 전`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}시간 전`;
  return `${Math.floor(hour / 24)}일 전`;
}

export default function LostItemBoard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [typeFilter, setTypeFilter] = useState("전체");
  const [category, setCategory] = useState("전체");
  const [searchQuery, setSearchQuery] = useState("");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const filterBody = useMemo(() => {
    const body: Record<string, string> = {};
    if (typeFilter === "찾는중") body.status = "REPORTED";
    if (CATEGORY_TO_API[category]) body.category = CATEGORY_TO_API[category];
    return body;
  }, [typeFilter, category]);

  const {
    data,
    isLoading,
    isRefetching,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    refetch,
  } = useItemQueries.useInfiniteItems(20, filterBody);

  const { data: buildingsRes } = useMetadataQueries.useBuildings();
  const apiBuildings = buildingsRes?.data?.data ?? [];

  const items = useMemo(() => {
    return (
      data?.pages.flatMap((page) =>
        page.success ? page.data.item_posts : [],
      ) ?? []
    );
  }, [data]);

  const filtered = useMemo(() => {
    return (
      items
        .filter((item) => {
          const korCategory = CATEGORY_MAP[item.category] ?? "기타";
          const buildingName =
            apiBuildings.find((b) => b.id === item.building_id)?.name ?? "";
          const matchType =
            typeFilter === "전체" ||
            (typeFilter === "찾는중" && item.type === "LOST") ||
            (typeFilter === "발견됨" && item.type === "FOUND");
          const matchCategory =
            category === "전체" || CATEGORY_TO_API[category] === item.category;
          const matchSearch =
            searchQuery === "" ||
            item.title?.includes(searchQuery) ||
            korCategory.includes(searchQuery) ||
            buildingName.includes(searchQuery) ||
            item.data_address?.includes(searchQuery);
          return matchType && matchCategory && matchSearch;
        })
        // 최신순 정렬 추가
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )
    );
  }, [items, typeFilter, category, searchQuery, apiBuildings]);

  const closeDropdowns = () => {
    setShowStatusDropdown(false);
    setShowCategoryDropdown(false);
  };

  const onRefresh = async () => {
    await refetch();
  };

  const loadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  return (
    <TouchableWithoutFeedback onPress={closeDropdowns}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>분실물 게시판</Text>
          <View style={styles.headerIcons}>
            <NotificationBell />
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => router.push(ROUTES.MYPAGE)}
            >
              <User size={20} color="#444" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.searchBar}>
          <Search size={15} color="#aaa" />
          <TextInput
            style={styles.searchInput}
            placeholder="물품명, 카테고리, 장소 검색"
            placeholderTextColor="#bbb"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <X size={14} color="#aaa" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.filterRow}>
          <View>
            <TouchableOpacity
              style={[
                styles.filterBtn,
                typeFilter !== "전체" && styles.filterBtnActive,
              ]}
              onPress={() => {
                setShowStatusDropdown((v) => !v);
                setShowCategoryDropdown(false);
              }}
            >
              <Text
                style={[
                  styles.filterBtnText,
                  typeFilter !== "전체" && styles.filterBtnTextActive,
                ]}
              >
                {typeFilter === "전체" ? "상태" : typeFilter}
              </Text>
              <ChevronDown
                size={12}
                color={typeFilter !== "전체" ? "#6366f1" : "#999"}
              />
            </TouchableOpacity>
            {showStatusDropdown && (
              <View style={styles.dropdown}>
                {STATUS_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.dropdownItem,
                      typeFilter === option && styles.dropdownItemActive,
                    ]}
                    onPress={() => {
                      setTypeFilter(option);
                      setShowStatusDropdown(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        typeFilter === option && styles.dropdownItemTextActive,
                      ]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View>
            <TouchableOpacity
              style={[
                styles.filterBtn,
                category !== "전체" && styles.filterBtnActive,
              ]}
              onPress={() => {
                setShowCategoryDropdown((v) => !v);
                setShowStatusDropdown(false);
              }}
            >
              <Text
                style={[
                  styles.filterBtnText,
                  category !== "전체" && styles.filterBtnTextActive,
                ]}
              >
                {category === "전체" ? "카테고리" : category}
              </Text>
              <ChevronDown
                size={12}
                color={category !== "전체" ? "#6366f1" : "#999"}
              />
            </TouchableOpacity>
            {showCategoryDropdown && (
              <View style={styles.dropdown}>
                {CATEGORY_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.dropdownItem,
                      category === option && styles.dropdownItemActive,
                    ]}
                    onPress={() => {
                      setCategory(option);
                      setShowCategoryDropdown(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        category === option && styles.dropdownItemTextActive,
                      ]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {(typeFilter !== "전체" || category !== "전체") && (
            <TouchableOpacity
              style={styles.resetBtn}
              onPress={() => {
                setTypeFilter("전체");
                setCategory("전체");
              }}
            >
              <X size={11} color="#999" />
              <Text style={styles.resetBtnText}>초기화</Text>
            </TouchableOpacity>
          )}
        </View>

        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color="#6366f1" />
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            onScrollBeginDrag={closeDropdowns}
            onEndReached={loadMore}
            onEndReachedThreshold={0.3}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={onRefresh}
                colors={["#6366f1"]}
                tintColor="#6366f1"
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>등록된 분실물이 없어요</Text>
              </View>
            }
            ListFooterComponent={
              isFetchingNextPage ? (
                <ActivityIndicator
                  color="#6366f1"
                  style={{ paddingVertical: 20 }}
                />
              ) : null
            }
            renderItem={({ item }) => {
              const korCategory = CATEGORY_MAP[item.category] ?? "기타";
              const isTheftConfirmed = item.status === "THEFT_CONFIRMED";
              const korStatus = isTheftConfirmed
                ? ITEM_STATUS_LABEL.THEFT_CONFIRMED
                : (ITEM_TYPE_MAP[item.type] ?? item.type);
              const statusStyle = (isTheftConfirmed
                ? ITEM_STATUS_STYLE.THEFT_CONFIRMED
                : ITEM_STATUS_STYLE[item.type]) ?? { dot: "#aaa" };
              const IconComponent = CATEGORY_ICON_MAP[item.category] ?? Package;
              const buildingName =
                apiBuildings.find((b) => b.id === item.building_id)?.name ??
                "";
              const locationText = item.data_address
                ? `${buildingName} · ${item.data_address}`
                : buildingName;

              const imageUrl = item.image_url
                ? item.image_url.startsWith("http")
                  ? item.image_url
                  : `${BASE_URL}${item.image_url}`
                : null;

              return (
                <TouchableOpacity
                  style={styles.itemCard}
                  onPress={() => {
                    closeDropdowns();
                    router.push(`${ROUTES.LOST_ITEM_DETAIL}?id=${item.id}`);
                  }}
                  activeOpacity={0.6}
                >
                  {imageUrl ? (
                    <Image
                      source={{ uri: imageUrl }}
                      style={styles.itemThumbImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.itemThumb}>
                      <IconComponent size={30} color="#6366f1" />
                    </View>
                  )}
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemCategory}>{korCategory}</Text>
                    <Text style={styles.itemTitle} numberOfLines={1}>
                      {item.title || locationText}
                    </Text>
                    <View style={styles.itemMetaRow}>
                      <MapPin size={11} color="#bbb" />
                      <Text style={styles.itemMeta} numberOfLines={1}>
                        {locationText}
                      </Text>
                    </View>
                    <Text style={styles.itemTime}>
                      {(item.type === "FOUND" ? "발견 " : "분실 ") + timeAgo(item.reported_at)} · 게시 {timeAgo(item.created_at)}
                    </Text>
                  </View>
                  <View style={styles.itemRight}>
                    <View style={styles.statusBadge}>
                      <View
                        style={[
                          styles.statusDot,
                          { backgroundColor: statusStyle.dot },
                        ]}
                      />
                      <Text style={styles.statusText}>{korStatus}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        )}

        <TouchableOpacity
          style={[styles.fab, { bottom: insets.bottom + 10 }]}
          onPress={() => router.push(ROUTES.LOST_ITEM_REGISTER)}
        >
          <Plus size={18} color="#fff" />
          <Text style={styles.fabText}>분실물 등록</Text>
        </TouchableOpacity>
      </View>
    </TouchableWithoutFeedback>
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
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 12,
    marginBottom: 10,
    paddingHorizontal: 14,
    height: 44,
    backgroundColor: "#fff",
    borderRadius: 14,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: "#222",
    fontFamily: fonts.regular,
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
    alignItems: "center",
    zIndex: 100,
  },
  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
    gap: 3,
  },
  filterBtnActive: { backgroundColor: "#eef2ff", borderColor: "#6366f1" },
  filterBtnText: { fontSize: 12, fontFamily: fonts.bold, color: "#999" },
  filterBtnTextActive: { color: "#6366f1" },
  dropdown: {
    position: "absolute",
    top: 38,
    left: 0,
    backgroundColor: "#fff",
    borderRadius: 10,
    minWidth: 110,
    zIndex: 999,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
    overflow: "hidden",
  },
  dropdownItem: { paddingHorizontal: 16, paddingVertical: 11 },
  dropdownItemActive: { backgroundColor: "#eef2ff" },
  dropdownItemText: { fontSize: 13, fontFamily: fonts.bold, color: "#666" },
  dropdownItemTextActive: { color: "#6366f1" },
  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
    gap: 3,
  },
  resetBtnText: { fontSize: 11, color: "#999", fontFamily: fonts.bold },
  loadingBox: { flex: 1, alignItems: "center", justifyContent: "center" },
  listContent: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 100 },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 20,
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  itemThumb: {
    width: 100,
    height: 100,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#eef2ff",
    borderWidth: 1.5,
    borderColor: "#6366f130",
  },
  itemThumbImage: { width: 100, height: 100, borderRadius: 14 },
  itemInfo: { flex: 1, gap: 4 },
  itemCategory: { fontSize: 11, fontFamily: fonts.regular, color: "#bbb" },
  itemTitle: { fontSize: 15, fontFamily: fonts.bold, color: "#111" },
  itemMetaRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  itemMeta: { fontSize: 12, fontFamily: fonts.regular, color: "#bbb", flex: 1 },
  itemTime: { fontSize: 11, fontFamily: fonts.regular, color: "#ccc" },
  itemRight: { alignItems: "flex-end" },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f6f8",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontFamily: fonts.bold, color: "#555" },
  emptyBox: { alignItems: "center", paddingVertical: 60 },
  emptyText: { fontSize: 14, color: "#aaa", fontFamily: fonts.regular },
  fab: {
    position: "absolute",
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#6366f1",
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 14,
    gap: 6,
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: { fontSize: 14, fontFamily: fonts.bold, color: "#fff" },
});
