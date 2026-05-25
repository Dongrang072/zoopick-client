import { BASE_BUILDINGS } from "@/constants/buildings";
import {
  CATEGORY_ICON_MAP,
  CATEGORY_MAP,
  ITEM_STATUS_STYLE,
  ITEM_TYPE_MAP,
} from "@/constants/categories";
import { fonts } from "@/constants/typography";
import { ROUTES, BASE_URL } from "@/constants/url";
import { useItemQueries } from "@/hooks/queries/useItemQueries";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import NotificationBell from "@/components/NotificationBell";
import {
  ChevronRight,
  Crosshair,
  Package,
  Plus,
  Search,
  User,
} from "lucide-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

const KAKAO_API_KEY = "7488059674373cdf0eb9299fef1ec2ec";

type ApiItem = {
  id: number;
  type: string;
  status: string;
  category: string;
  title?: string;
  building_id: number;
  data_address?: string;
  created_at: string;
  reported_at: string;
  image_url?: string;
};

type Building = {
  id: number;
  name: string;
  lat: number;
  lng: number;
  items: ApiItem[];
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 60) return `${min}분 전`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}시간 전`;
  return `${Math.floor(hour / 24)}일 전`;
}

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const webViewRef = useRef<WebView>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(
    null,
  );
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const { data: response } = useItemQueries.useItems(0, 1000); // 맵을 위해 대량 조회
  const apiItems = response?.success ? response.data.item_posts : [];

  const buildings: Building[] = BASE_BUILDINGS.map((b) => ({
    ...b,
    items: apiItems.filter((item) => item.building_id === b.id),
  }));

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;

        const location = await Location.getCurrentPositionAsync({});
        setUserLocation({
          lat: location.coords.latitude,
          lng: location.coords.longitude,
        });

        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 3000,
            distanceInterval: 5,
          },
          (loc) =>
            setUserLocation({
              lat: loc.coords.latitude,
              lng: loc.coords.longitude,
            }),
        );
      } catch (e) {
        console.warn("[Map] location unavailable", e);
      }
    })();
    return () => {
      subscription?.remove();
    };
  }, []);

  useEffect(() => {
    if (userLocation && webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        updateMyLocation(${userLocation.lat}, ${userLocation.lng});
        true;
      `);
    }
  }, [userLocation]);

  const moveToMyLocation = () => {
    if (userLocation && webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        map.setCenter(new kakao.maps.LatLng(${userLocation.lat}, ${userLocation.lng}));
        map.setLevel(3);
        true;
      `);
    }
  };

  const filteredItems = selectedBuilding
    ? selectedBuilding.items.filter((item) => {
        if (searchQuery.trim() === "") return true;
        const korCategory = CATEGORY_MAP[item.category] ?? "기타";
        return (
          item.title?.includes(searchQuery) ||
          korCategory.includes(searchQuery) ||
          item.data_address?.includes(searchQuery)
        );
      })
    : [];

  const mapHTML = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
   <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body, #map { width: 100%; height: 100%; }
      .pin-wrap { display: flex; flex-direction: column; align-items: center; cursor: pointer; position: relative; padding: 12px; margin: -12px; }
      .pin-circle { width: 14px; height: 14px; border-radius: 50%; border: 2.5px solid #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.2); }
      .pin-label { display: none; position: absolute; bottom: 38px; left: 50%; transform: translateX(-50%); background: #fff; border-radius: 10px; padding: 4px 10px; font-size: 11px; font-weight: 700; color: #111; white-space: nowrap; box-shadow: 0 2px 8px rgba(0,0,0,0.15); }
      .pin-label.visible { display: block; }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script type="text/javascript" src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_API_KEY}&autoload=true"></script>
    <script>
      var map = new kakao.maps.Map(document.getElementById('map'), {
        center: new kakao.maps.LatLng(37.22185, 127.1865),
        level: 4
      });
      var buildings = ${JSON.stringify(buildings)};
      var overlays = [];
      var myLocationOverlay = null;
      var activeId = null;
      var CAMPUS_CENTER = new kakao.maps.LatLng(37.22185, 127.1865);
      var CAMPUS_BOUNDS = { minLat: 37.208, maxLat: 37.233, minLng: 127.173, maxLng: 127.210 };

      buildings.forEach(function(building) {
        var position = new kakao.maps.LatLng(building.lat, building.lng);
        var hasItems = building.items.length > 0;
        var pinColor = hasItems ? '#6366f1' : '#ccc';
        var content =
          '<div class="pin-wrap" id="pin-' + building.id + '">' +
            '<div class="pin-label" id="label-' + building.id + '">' + building.name + '</div>' +
            '<div class="pin-circle" style="background:' + pinColor + '"></div>' +
          '</div>';
        var overlay = new kakao.maps.CustomOverlay({ position: position, content: content, yAnchor: 1.0 });
        overlay.setMap(map);
        overlays.push({ overlay: overlay, building: building });
      });

      function updateMyLocation(lat, lng) {
        if (myLocationOverlay) myLocationOverlay.setMap(null);
        var content = '<div style="width:14px;height:14px;background:#6366f1;border-radius:50%;border:3px solid #fff;box-shadow:0 0 0 4px rgba(99,102,241,0.25);"></div>';
        myLocationOverlay = new kakao.maps.CustomOverlay({ position: new kakao.maps.LatLng(lat, lng), content: content, zIndex: 10 });
        myLocationOverlay.setMap(map);
      }

      document.addEventListener('touchstart', function(e) {
        if (!e.target.closest('.pin-wrap')) {
          if (activeId !== null) {
            var prevLabel = document.getElementById('label-' + activeId);
            if (prevLabel) prevLabel.classList.remove('visible');
            activeId = null;
          }
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MAP_CLICK' }));
        }
      }, { passive: true });

      kakao.maps.event.addListener(map, 'tilesloaded', function() {
        overlays.forEach(function(item) {
          item.overlay.setMap(map);
          var el = document.getElementById('pin-' + item.building.id);
          if (el) {
            el.addEventListener('click', function() {
              if (activeId !== null) {
                var prevLabel = document.getElementById('label-' + activeId);
                if (prevLabel) prevLabel.classList.remove('visible');
              }
              var label = document.getElementById('label-' + item.building.id);
              if (label) label.classList.add('visible');
              activeId = item.building.id;
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'BUILDING_CLICK', buildingId: item.building.id }));
            });
          }
        });
      });

      kakao.maps.event.addListener(map, 'dragend', function() {
        var center = map.getCenter();
        var lat = center.getLat(); var lng = center.getLng();
        if (lat < CAMPUS_BOUNDS.minLat || lat > CAMPUS_BOUNDS.maxLat || lng < CAMPUS_BOUNDS.minLng || lng > CAMPUS_BOUNDS.maxLng) {
          map.setCenter(CAMPUS_CENTER); map.setLevel(4);
        }
      });
    </script>
  </body>
  </html>
  `;

  const handleMessage = useCallback(
    (event: any) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.type === "BUILDING_CLICK") {
          Keyboard.dismiss();
          const building = buildings.find((b) => b.id === data.buildingId);
          if (building) {
            setSelectedBuilding(building);
            bottomSheetRef.current?.snapToIndex(0);
          }
        } else if (data.type === "MAP_CLICK") {
          Keyboard.dismiss();
          bottomSheetRef.current?.close();
          setSelectedBuilding(null);
        }
      } catch (e) {}
    },
    [buildings],
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Text style={styles.headerTitle}>캠퍼스 지도</Text>
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

      <View style={styles.mapContainer}>
        <WebView
          ref={webViewRef}
          style={styles.map}
          source={{ html: mapHTML }}
          onMessage={handleMessage}
          javaScriptEnabled
          domStorageEnabled
          originWhitelist={["*"]}
        />

        {searchFocused && (
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={Keyboard.dismiss}
            activeOpacity={1}
          />
        )}

        <View style={styles.searchBar}>
          <Search size={15} color="#aaa" />
          <TextInput
            style={styles.searchInput}
            placeholder="찾으시는 물건이나 장소를 검색하세요"
            placeholderTextColor="#bbb"
            autoCorrect={false}
            autoCapitalize="none"
            spellCheck={false}
            returnKeyType="search"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={Keyboard.dismiss}
            blurOnSubmit={true}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Text style={{ fontSize: 18, color: "#aaa" }}>×</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push(ROUTES.LOST_ITEM_REGISTER)}
        >
          <Plus size={22} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.locationBtn} onPress={moveToMyLocation}>
          <Crosshair size={18} color={userLocation ? "#6366f1" : "#aaa"} />
        </TouchableOpacity>
      </View>

      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={["25%", "70%"]}
        enablePanDownToClose
        backgroundStyle={styles.bottomSheetBg}
        handleIndicatorStyle={styles.indicator}
        style={styles.bottomSheetShadow}
        onClose={() => setSelectedBuilding(null)}
      >
        <BottomSheetScrollView
          contentContainerStyle={styles.bottomSheetContent}
        >
          {selectedBuilding && (
            <>
              <View style={styles.buildingHeader}>
                <View>
                  <Text style={styles.buildingName}>
                    {selectedBuilding.name}
                  </Text>
                  <Text style={styles.buildingCount}>
                    분실물 {selectedBuilding.items.length}건
                  </Text>
                </View>
              </View>

              {filteredItems.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyText}>
                    {searchQuery
                      ? "검색 결과가 없어요"
                      : "등록된 분실물이 없어요"}
                  </Text>
                </View>
              ) : (
                filteredItems.map((item) => {
                  const korCategory = CATEGORY_MAP[item.category] ?? "기타";
                  const korStatus = ITEM_TYPE_MAP[item.type] ?? item.type;
                  const statusStyle = ITEM_STATUS_STYLE[item.type] ?? {
                    dot: "#aaa",
                  };
                  const IconComponent =
                    CATEGORY_ICON_MAP[item.category] ?? Package;
                  const buildingName =
                    BASE_BUILDINGS.find((b) => b.id === item.building_id)
                      ?.name ?? "";

                  // 이미지 URL 처리 (절대 경로가 아닐 경우 BASE_URL 결합)
                  const imageUrl = item.image_url
                    ? item.image_url.startsWith("http")
                      ? item.image_url
                      : `${BASE_URL}${item.image_url}`
                    : null;

                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.itemCard}
                      onPress={() =>
                        router.push(`${ROUTES.LOST_ITEM_DETAIL}?id=${item.id}`)
                      }
                    >
                      <View style={styles.itemThumb}>
                        {imageUrl ? (
                          <Image
                            source={{ uri: imageUrl }}
                            style={{ width: "100%", height: "100%" }}
                            resizeMode="cover"
                          />
                        ) : (
                          <IconComponent size={22} color="#6366f1" />
                        )}
                      </View>
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemCategory}>{korCategory}</Text>
                        <Text style={styles.itemTitle} numberOfLines={1}>
                          {item.title ||
                            `${buildingName} ${item.data_address ?? ""}`}
                        </Text>
                        <Text style={styles.itemMeta}>
                          {timeAgo(item.reported_at)}
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
                        <ChevronRight
                          size={14}
                          color="#ccc"
                          style={{ marginTop: 4 }}
                        />
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </>
          )}
        </BottomSheetScrollView>
      </BottomSheet>
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
  headerTitle: { fontSize: 18, color: "#111", fontFamily: fonts.bold },
  headerIcons: { flexDirection: "row", gap: 6 },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  mapContainer: { flex: 1, position: "relative" },
  map: { flex: 1 },
  searchBar: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 44,
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
  fab: {
    position: "absolute",
    bottom: 20,
    left: 16,
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#6366f1",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  locationBtn: {
    position: "absolute",
    bottom: 20,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  bottomSheetBg: {
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.92)",
  },
  indicator: { backgroundColor: "#ddd", width: 40 },
  bottomSheetContent: { paddingHorizontal: 20, paddingBottom: 40 },
  bottomSheetShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  buildingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    marginTop: 4,
  },
  buildingName: { fontSize: 16, fontFamily: fonts.bold, color: "#111" },
  buildingCount: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: "#aaa",
    marginTop: 2,
  },
  emptyBox: { alignItems: "center", paddingVertical: 40 },
  emptyText: { fontSize: 14, color: "#aaa", fontFamily: fonts.regular },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
    gap: 12,
  },
  itemThumb: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#eef2ff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#6366f130",
    overflow: "hidden",
  },
  itemInfo: { flex: 1 },
  itemCategory: {
    fontSize: 11,
    color: "#bbb",
    fontFamily: fonts.regular,
    marginBottom: 3,
  },
  itemTitle: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: "#111",
    marginBottom: 3,
  },
  itemMeta: { fontSize: 11, fontFamily: fonts.regular, color: "#bbb" },
  itemRight: { alignItems: "flex-end", gap: 2 },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f6f8",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 4,
  },
  statusDot: { width: 5, height: 5, borderRadius: 3 },
  statusText: { fontSize: 10, fontFamily: fonts.bold, color: "#555" },
});