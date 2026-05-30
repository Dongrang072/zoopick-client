import { authService } from "@/api/services/auth";
import messaging from "@react-native-firebase/messaging";
import { useEffect } from "react";
import { Platform } from "react-native";
import notifee, { AuthorizationStatus } from '@notifee/react-native';
import { TokenCallback } from "@/utils/notifications/types";
import { displayNotification } from "@/utils/notifications/display";
import { notificationEventHandler } from "@/utils/notifications/handlers";

export * from "@/utils/notifications/types";
export { displayNotification } from "@/utils/notifications/display";
export { handleNotificationRouting } from "@/utils/notifications/routing";

// 로그인 성공 시 호출
export const getFCMToken = async (callback: TokenCallback) => {
    try {
        const token: string = await messaging().getToken();
        if (token) {
            console.log("FCM Token:", token);
            callback(token);
        }
    } catch (error) {
        console.error("Failed to get FCM Token");
    }
};

export const sendTokenToServer: TokenCallback = async (token: string) => {
    try {
        const result = await authService.registerDeviceToken({ token });
        if (!result.success) {
            console.error(`Failed to register token: ${result.error}`);
        }
    } catch (error) {
        console.error("Error sending token to server:", error);
    }
};

const requestNotificationPermission = async () => {
    if (Platform.OS === "ios") {
        const authStatus = await messaging().requestPermission();
        return (
            authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
            authStatus === messaging.AuthorizationStatus.PROVISIONAL
        );
    } else if (Platform.OS === "android") {
        const settings = await notifee.requestPermission();
        return settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED;
    }
    return false;
};

export function useNotifications() {
    useEffect(() => {
        messaging().setBackgroundMessageHandler(displayNotification);
        messaging().registerDeviceForRemoteMessages();

        requestNotificationPermission().then(granted => {
            if (!granted) console.log("Notification permission denied");
        });

        const unsubscribeOnMessage = messaging().onMessage(displayNotification);
        const unsubscribeTokenRefresh = messaging().onTokenRefresh(sendTokenToServer);
        const unsubscribeForegroundEvent = notifee.onForegroundEvent(notificationEventHandler);
        notifee.onBackgroundEvent(notificationEventHandler);

        return () => {
            unsubscribeOnMessage();
            unsubscribeTokenRefresh();
            unsubscribeForegroundEvent();
        };
    }, []);
}
