import { BASE_URL, ROUTES } from "@/constants/url";
import { useCctvQueries } from "@/hooks/queries/useCctvQueries";
import { fonts } from "@/constants/typography";
import { CATEGORY_MAP } from "@/constants/categories";
import { mockCctvItems } from "@/mocks/cctv";
import { Camera, ChevronLeft, ChevronRight, Package } from "lucide-react-native";
import {
    ActivityIndicator,
    FlatList,
    Image,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";
import { useRouter } from "expo-router";

export default function CctvItemsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [isRefreshing, setIsRefreshing] = useState(false);

    const { data, isLoading, refetch } = useCctvQueries.useMyItems();
    const USE_MOCK = true;
    const items = USE_MOCK ? mockCctvItems : (data?.data?.data?.matched_lost_items ?? []);

    const onRefresh = async () => {
        setIsRefreshing(true);
        await refetch();
        setIsRefreshing(false);
    };

    if (!USE_MOCK && isLoading) {
        return (
            <View style={[styles.container, { alignItems: "center", justifyContent: "center" }]}>
                <ActivityIndicator color="#ef4444" size="large" />
            </View>
        );
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <ChevronLeft size={22} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>CCTV 탐지 내역</Text>
                <View style={{ width: 36 }} />
            </View>

            <FlatList
                data={items}
                keyExtractor={(item) => String(item.lost_item_id)}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={["#ef4444"]} tintColor="#ef4444" />
                }
                ListEmptyComponent={
                    <View style={styles.emptyBox}>
                        <View style={styles.emptyIconWrap}>
                            <Camera size={36} color="#ef4444" />
                        </View>
                        <Text style={styles.emptyTitle}>탐지된 물건이 없어요</Text>
                        <Text style={styles.emptyDesc}>CCTV에서 분실물이 탐지되면 여기에 표시돼요</Text>
                    </View>
                }
                renderItem={({ item }) => {
                    const imageUrl = item.image_url
                        ? item.image_url.startsWith("http") ? item.image_url : `${BASE_URL}${item.image_url}`
                        : null;

                    return (
                        <TouchableOpacity
                            style={styles.card}
                            activeOpacity={0.85}
                            onPress={() =>
                                router.push({ pathname: ROUTES.CCTV_RESULT, params: { itemId: String(item.lost_item_id) } })
                            }
                        >
                            <View style={styles.thumbnail}>
                                {imageUrl ? (
                                    <Image source={{ uri: imageUrl }} style={styles.thumbnailImage} resizeMode="cover" />
                                ) : (
                                    <Package size={28} color="#ef4444" />
                                )}
                            </View>

                            <View style={styles.info}>
                                <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
                                <View style={styles.categoryBadge}>
                                    <Text style={styles.categoryText}>{CATEGORY_MAP[item.category] ?? item.category}</Text>
                                </View>
                                <Text style={styles.reportedAt}>{item.reported_at}</Text>
                            </View>

                            <View style={styles.right}>
                                <View style={styles.countBadge}>
                                    <Text style={styles.countText}>{item.match_count}건 탐지</Text>
                                </View>
                                <ChevronRight size={16} color="#ccc" style={{ marginTop: 8 }} />
                            </View>
                        </TouchableOpacity>
                    );
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#fff" },
    header: {
        flexDirection: "row", alignItems: "center", justifyContent: "space-between",
        paddingHorizontal: 16, paddingVertical: 12,
        borderBottomWidth: 0.5, borderBottomColor: "#f0f0f0",
    },
    backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
    headerTitle: { fontSize: 16, fontFamily: fonts.bold, color: "#111" },
    listContent: { padding: 16, paddingBottom: 40, gap: 12 },
    card: {
        flexDirection: "row", alignItems: "center", backgroundColor: "#fff",
        borderRadius: 14, borderWidth: 1, borderColor: "#f0f0f0",
        padding: 14, gap: 12, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
    },
    thumbnail: {
        width: 90, height: 90, borderRadius: 14, backgroundColor: "#fef2f2",
        alignItems: "center", justifyContent: "center", overflow: "hidden",
    },
    thumbnailImage: { width: 90, height: 90 },
    info: { flex: 1, gap: 4 },
    title: { fontSize: 14, fontFamily: fonts.bold, color: "#111" },
    categoryBadge: { alignSelf: "flex-start", backgroundColor: "#eef2ff", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
    categoryText: { fontSize: 10, fontFamily: fonts.bold, color: "#6366f1" },
    reportedAt: { fontSize: 11, fontFamily: fonts.regular, color: "#aaa" },
    right: { alignItems: "center" },
    countBadge: { backgroundColor: "#fef2f2", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
    countText: { fontSize: 11, fontFamily: fonts.bold, color: "#ef4444" },
    emptyBox: { alignItems: "center", paddingVertical: 80, gap: 12 },
    emptyIconWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: "#fef2f2", alignItems: "center", justifyContent: "center", marginBottom: 4 },
    emptyTitle: { fontSize: 16, fontFamily: fonts.bold, color: "#333" },
    emptyDesc: { fontSize: 13, fontFamily: fonts.regular, color: "#aaa", textAlign: "center" },
});
