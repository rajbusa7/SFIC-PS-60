import { apiClient } from "@/services/apiClient";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }
  try {
    const reg = await navigator.serviceWorker.register("/sw.js");
    return reg;
  } catch (err) {
    console.warn("[PWA] Service worker registration failed:", err);
    return null;
  }
}

export function getPushPermissionStatus(): NotificationPermission | "unsupported" {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  return Notification.permission;
}

export async function subscribeToPushNotifications(): Promise<{
  success: boolean;
  status: NotificationPermission | "unsupported";
  error?: string;
}> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
    return { success: false, status: "unsupported", error: "Push notifications not supported in this browser." };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return { success: false, status: permission, error: "Notification permission denied." };
    }

    const reg = await navigator.serviceWorker.ready;
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

    let sub: PushSubscription;
    if (vapidKey) {
      const convertedVapidKey = urlBase64ToUint8Array(vapidKey);
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey as unknown as BufferSource,
      });
    } else {
      // In local/test mode without live VAPID keys, use existing or local subscription
      const existing = await reg.pushManager.getSubscription();
      if (existing) {
        sub = existing;
      } else {
        // Mock payload for browser dev testing
        return { success: true, status: "granted" };
      }
    }

    const json = sub.toJSON();
    if (json.endpoint && json.keys?.p256dh && json.keys?.auth) {
      await apiClient.subscribePush({
        endpoint: json.endpoint,
        keys: {
          p256dh: json.keys.p256dh,
          auth: json.keys.auth,
        },
      });
    }

    return { success: true, status: "granted" };
  } catch (err: any) {
    console.error("[PWA] Push subscription failed:", err);
    return { success: false, status: "denied", error: err.message };
  }
}
