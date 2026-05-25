import axiosInstance from "../client";
import {
    ApiResponse,
    CreateItemRequest,
    CreateItemResponse,
    ItemFilter,
    ItemListResponse,
    ItemOwnerInfoResult,
    ItemPost,
    ItemType,
} from "../types";
import {
    ITEM_BY_ITEM_ID,
    ITEM_OWNER_INFO_URL,
    ITEMS_CREATE_URL,
    ITEMS_DETAIL_URL,
    ITEMS_LIST_URL,
    MY_ITEMS_URL,
} from "@/constants/url";

export const itemService = {

    getItems: async (page = 0, size = 20, filter: ItemFilter = {}) => {
        const response = await axiosInstance.post<ApiResponse<ItemListResponse>>(
            `${ITEMS_LIST_URL}?page=${page}&size=${size}`,
            filter,
        );
        return response.data;
    },

    getItemPost: async (id: number | string) => {
        const response = await axiosInstance.get<ApiResponse<ItemPost>>(
            `${ITEMS_LIST_URL}/${id}`, // Swagger docs: /api/items/post/list/{id}
        );
        return response.data;
    },

    getItemPostByItemId: async (itemId: number | string) => {
        const response = await axiosInstance.get<ApiResponse<ItemPost>>(
            `${ITEM_BY_ITEM_ID}/${itemId}`, // Swagger docs: /api/items/post/by-item/{itemId}
        );
        return response.data;
    },

    createItem: async (data: CreateItemRequest) => {
        const response = await axiosInstance.post<ApiResponse<CreateItemResponse>>(
            ITEMS_CREATE_URL,
            data,
        );
        console.log(response.data);
        return response.data;
    },

    getMyItems: async (type: ItemType) => {
        const response = await axiosInstance.get<ApiResponse<ItemPost[]>>(
            `${MY_ITEMS_URL}?type=${type}`,
        );
        return response.data;
    },

    getItemOwnerInfo: async (itemId: number) => {
        const response = await axiosInstance.get<ApiResponse<ItemOwnerInfoResult>>(
            `${ITEM_OWNER_INFO_URL}/${itemId}/owner-info`,
        );
        return response.data;
    },
};
