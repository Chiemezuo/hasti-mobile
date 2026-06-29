import { io, Socket } from "socket.io-client";
import Constants from "expo-constants";
import { apiFetch } from "@/api/client";
import { queryClient } from "@/api/queryClient";

const BASE_URL: string =
  (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined) ??
  "http://localhost:3100";

type ServerEvent =
  | { event: "message:new"; data: { conversationId: string; message: unknown } }
  | { event: "message:update"; data: { conversationId: string; message: unknown } }
  | { event: "message:read"; data: { conversationId: string; readerId: string; upToMessageId: string; readAt: string } }
  | { event: "typing"; data: { conversationId: string; userId: string; typing: boolean } }
  | { event: "presence"; data: { userId: string; online: boolean } }
  | { event: "conversation:locked"; data: { conversationId: string } }
  | { event: "offer:update"; data: { conversationId: string; offer: unknown } }
  | { event: "notification:new"; data: unknown };

let socket: Socket | null = null;
let realtimeTokenExpiry = 0;
let renewTimer: ReturnType<typeof setTimeout> | null = null;

async function fetchRealtimeToken(): Promise<string> {
  const { token } = await apiFetch<{ token: string }>({ path: "/realtime/token" });
  return token;
}

function scheduleRenewal(socket: Socket, ttlSeconds: number) {
  if (renewTimer) clearTimeout(renewTimer);
  // Renew at 80% of TTL
  const delay = ttlSeconds * 0.8 * 1000;
  renewTimer = setTimeout(async () => {
    try {
      const newToken = await fetchRealtimeToken();
      socket.emit("auth:renew", { token: newToken }, (ack: { ok: boolean }) => {
        if (ack.ok) {
          scheduleRenewal(socket, ttlSeconds);
        } else {
          reconnect();
        }
      });
    } catch {
      reconnect();
    }
  }, delay);
}

async function reconnect() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  await connect();
}

export async function connect(): Promise<void> {
  if (socket?.connected) return;

  let token: string;
  try {
    token = await fetchRealtimeToken();
  } catch {
    return;
  }

  socket = io(BASE_URL, {
    auth: { token },
    transports: ["websocket"],
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 10_000,
  });

  socket.on("connect", () => {
    scheduleRenewal(socket!, 300); // 5-min token TTL
  });

  socket.on("disconnect", () => {
    if (renewTimer) clearTimeout(renewTimer);
  });

  socket.on("message:new", (data) => {
    queryClient.invalidateQueries({ queryKey: ["messages", data.conversationId] });
    queryClient.invalidateQueries({ queryKey: ["conversations"] });
  });

  socket.on("message:update", (data) => {
    queryClient.invalidateQueries({ queryKey: ["messages", data.conversationId] });
  });

  socket.on("offer:update", (data) => {
    queryClient.invalidateQueries({ queryKey: ["offers", data.conversationId] });
  });

  socket.on("conversation:locked", (data) => {
    queryClient.invalidateQueries({ queryKey: ["conversation", data.conversationId] });
  });

  socket.on("notification:new", () => {
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
    queryClient.invalidateQueries({ queryKey: ["unread-count"] });
  });

  socket.on("reconnect", async () => {
    // Gap-fill: invalidate all live queries
    queryClient.invalidateQueries({ queryKey: ["messages"] });
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
    queryClient.invalidateQueries({ queryKey: ["unread-count"] });
  });
}

export function joinConversation(conversationId: string): void {
  socket?.emit("conversation:join", { conversationId });
}

export function leaveConversation(conversationId: string): void {
  socket?.emit("conversation:leave", { conversationId });
}

export function sendTyping(conversationId: string, typing: boolean): void {
  socket?.emit("typing", { conversationId, typing });
}

export function disconnect(): void {
  if (renewTimer) clearTimeout(renewTimer);
  socket?.disconnect();
  socket = null;
}

export function onTyping(
  cb: (data: { conversationId: string; userId: string; typing: boolean }) => void
): () => void {
  socket?.on("typing", cb);
  return () => socket?.off("typing", cb);
}

export function onPresence(
  cb: (data: { userId: string; online: boolean }) => void
): () => void {
  socket?.on("presence", cb);
  return () => socket?.off("presence", cb);
}
