/**
 * ShikshaSetu AI - Universal Data Synchronization & Broadcast System
 * 
 * Provides cross-component and cross-tab realtime synchronization for Next.js.
 * When any mutation occurs (student added, assessment scored, gap resolved,
 * remedial plan updated), affected views automatically re-fetch without full-page reloads.
 */

export type DataEntity =
  | "students"
  | "assessments"
  | "results"
  | "gaps"
  | "plans"
  | "activities"
  | "notices"
  | "settings"
  | "all";

export interface DataUpdatePayload {
  entity: DataEntity;
  action?: "create" | "update" | "delete" | "reassess" | "reset";
  id?: string;
  timestamp: number;
}

const EVENT_NAME = "shikshasetu_data_updated";
const CHANNEL_NAME = "shikshasetu_sync_channel";

let broadcastChannel: BroadcastChannel | null = null;

if (typeof window !== "undefined" && "BroadcastChannel" in window) {
  try {
    broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
  } catch (e) {
    console.warn("[ShikshaSetu Events] BroadcastChannel not supported in current environment", e);
  }
}

/**
 * Broadcasts a mutation event to the current window and all other browser tabs
 */
export function broadcastDataUpdate(
  entity: DataEntity = "all",
  action: DataUpdatePayload["action"] = "update",
  id?: string
) {
  if (typeof window === "undefined") return;

  const payload: DataUpdatePayload = {
    entity,
    action,
    id,
    timestamp: Date.now(),
  };

  // 1. Dispatch custom DOM event in the current window
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: payload }));

  // Legacy student compatibility event
  if (entity === "students" || entity === "all") {
    window.dispatchEvent(new CustomEvent("shikshasetu_student_updated", { detail: payload }));
  }

  // 2. Broadcast to other open browser tabs
  try {
    if (broadcastChannel) {
      broadcastChannel.postMessage(payload);
    }
  } catch (err) {
    console.warn("[ShikshaSetu Events] Error posting to BroadcastChannel:", err);
  }
}

/**
 * React Hook for components to subscribe to data mutations
 */
export function subscribeToDataUpdates(
  callback: (payload: DataUpdatePayload) => void,
  filterEntities?: DataEntity[]
): () => void {
  if (typeof window === "undefined") return () => {};

  const handleEvent = (e: Event) => {
    const customEvent = e as CustomEvent<DataUpdatePayload>;
    const payload = customEvent.detail || { entity: "all", timestamp: Date.now() };

    if (!filterEntities || filterEntities.includes(payload.entity) || payload.entity === "all") {
      callback(payload);
    }
  };

  const handleBroadcastMessage = (event: MessageEvent<DataUpdatePayload>) => {
    const payload = event.data;
    if (payload && (!filterEntities || filterEntities.includes(payload.entity) || payload.entity === "all")) {
      callback(payload);
    }
  };

  // Listen to local DOM events
  window.addEventListener(EVENT_NAME, handleEvent);

  // Listen to cross-tab messages
  if (broadcastChannel) {
    broadcastChannel.addEventListener("message", handleBroadcastMessage);
  }

  // Also refresh when tab regains focus
  const handleFocus = () => {
    callback({ entity: "all", action: "update", timestamp: Date.now() });
  };
  window.addEventListener("focus", handleFocus);

  return () => {
    window.removeEventListener(EVENT_NAME, handleEvent);
    if (broadcastChannel) {
      broadcastChannel.removeEventListener("message", handleBroadcastMessage);
    }
    window.removeEventListener("focus", handleFocus);
  };
}

