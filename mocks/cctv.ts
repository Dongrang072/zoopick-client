import { CctvDetection, CctvMatchedLostItem } from "@/api/types";

export const mockCctvItems: CctvMatchedLostItem[] = [
    {
        lost_item_id: 1,
        title: "파란 우산",
        category: "UMBRELLA",
        match_count: 3,
        reported_at: "2026-05-14",
        image_url: "https://picsum.photos/seed/umbrella/200",
    },
    {
        lost_item_id: 2,
        title: "에어팟 프로 케이스",
        category: "EARPHONES",
        match_count: 1,
        reported_at: "2026-05-15",
        image_url: "https://picsum.photos/seed/airpods/200",
    },
    {
        lost_item_id: 3,
        title: "갈색 반지갑",
        category: "WALLET",
        match_count: 5,
        reported_at: "2026-05-16",
        image_url: "https://picsum.photos/seed/wallet/200",
    },
];

// /api/cctv/detections/me?itemId={id} — 특정 분실물 하나에 대한 CCTV 탐지 상세 목록
// lost_item_id 기준으로 탐지 건수가 match_count와 일치해야 함
export const mockCctvDetectionsByItemId: Record<number, CctvDetection[]> = {
    // lost_item_id: 1 (파란 우산) — match_count: 3
    1: [
        {
            match_id: 101,
            score: 0.92,
            detected_at: "2026-05-15T09:30:00",
            building_name: "공학관",
            room_name: "201호",
            item_snapshot_url: "https://picsum.photos/seed/item101/400/300",
            moment_snapshot_url: "https://picsum.photos/seed/moment101/400/300",
        },
        {
            match_id: 102,
            score: 0.75,
            detected_at: "2026-05-15T14:20:00",
            building_name: "도서관",
            room_name: "1열람실",
            item_snapshot_url: "https://picsum.photos/seed/item102/400/300",
            moment_snapshot_url: "https://picsum.photos/seed/moment102/400/300",
        },
        {
            match_id: 103,
            score: 0.61,
            detected_at: "2026-05-16T10:05:00",
            building_name: "학생회관",
            room_name: "1층 로비",
            item_snapshot_url: "https://picsum.photos/seed/item103/400/300",
            moment_snapshot_url: "https://picsum.photos/seed/moment103/400/300",
        },
    ],

    // lost_item_id: 2 (에어팟 프로 케이스) — match_count: 1
    2: [
        {
            match_id: 201,
            score: 0.88,
            detected_at: "2026-05-15T11:45:00",
            building_name: "인문관",
            room_name: "세미나실",
            item_snapshot_url: "https://picsum.photos/seed/item201/400/300",
            moment_snapshot_url: "https://picsum.photos/seed/moment201/400/300",
        },
    ],

    // lost_item_id: 3 (갈색 반지갑) — match_count: 5
    3: [
        {
            match_id: 301,
            score: 0.95,
            detected_at: "2026-05-14T08:10:00",
            building_name: "중앙도서관",
            room_name: "2층 열람실",
            item_snapshot_url: "https://picsum.photos/seed/item301/400/300",
            moment_snapshot_url: "https://picsum.photos/seed/moment301/400/300",
        },
        {
            match_id: 302,
            score: 0.83,
            detected_at: "2026-05-14T13:30:00",
            building_name: "공학관",
            room_name: "302호",
            item_snapshot_url: "https://picsum.photos/seed/item302/400/300",
            moment_snapshot_url: "https://picsum.photos/seed/moment302/400/300",
        },
        {
            match_id: 303,
            score: 0.71,
            detected_at: "2026-05-15T09:55:00",
            building_name: "학생식당",
            room_name: "1층",
            item_snapshot_url: "https://picsum.photos/seed/item303/400/300",
            moment_snapshot_url: "https://picsum.photos/seed/moment303/400/300",
        },
        {
            match_id: 304,
            score: 0.65,
            detected_at: "2026-05-15T16:20:00",
            building_name: "체육관",
            room_name: "로비",
            item_snapshot_url: "https://picsum.photos/seed/item304/400/300",
            moment_snapshot_url: "https://picsum.photos/seed/moment304/400/300",
        },
        {
            match_id: 305,
            score: 0.58,
            detected_at: "2026-05-16T07:50:00",
            building_name: "정문",
            room_name: "경비실 앞",
            item_snapshot_url: "https://picsum.photos/seed/item305/400/300",
            moment_snapshot_url: "https://picsum.photos/seed/moment305/400/300",
        },
    ],
};
