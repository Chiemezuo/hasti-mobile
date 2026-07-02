import React, { useState, useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import {
  getMessages,
  sendMessage,
  markRead,
  presignAttachment,
  type Message,
  type MessagesResponse,
  type ConversationsResponse,
} from "@/api/endpoints/conversations";
import { getConversation } from "@/api/endpoints/conversations";
import { getOffers, makeOffer, acceptOffer, counterOffer, rejectOffer, withdrawOffer } from "@/api/endpoints/offers";
import { openTransaction } from "@/api/endpoints/transactions";
import { colors, spacing, radii, fonts } from "@/theme";
import { Text } from "@/components/ui/Text";
import { formatNaira } from "@/lib/money";
import { OFFER_STATUS_LABELS, OFFER_STATUS_CHIP_FAMILY } from "@/lib/escrow-labels";
import { StatusChip } from "@/components/ui/StatusChip";
import { joinConversation, leaveConversation, sendTyping } from "@/auth/realtime";
import { putToStorage, getContentType } from "@/lib/upload";
import { getAccessToken } from "@/auth/token-store";
import { API_BASE, ApiError } from "@/api/client";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useAuthStore } from "@/auth/store";

export function ConversationThreadScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { id } = route.params;
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const [text, setText] = useState("");
  const [showOfferSheet, setShowOfferSheet] = useState(false);
  const [offerAmount, setOfferAmount] = useState("");
  const [offerMode, setOfferMode] = useState<"new" | "counter">("new");
  const [attachmentUploading, setAttachmentUploading] = useState(false);
  const [lockedTxId, setLockedTxId] = useState<string | null>(null);
  const [authHeader, setAuthHeader] = useState<Record<string, string>>({});
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    getAccessToken().then((token) => {
      if (token) setAuthHeader({ Authorization: `Bearer ${token}` });
    });
  }, []);

  const { data: conversationDetail } = useQuery({
    queryKey: ["conversation", id],
    queryFn: () => getConversation(id),
  });
  const conversation = conversationDetail?.conversation;

  const { data: offersData } = useQuery({
    queryKey: ["offers", id],
    queryFn: () => getOffers(id),
  });

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ["messages", id],
    queryFn: ({ pageParam }) =>
      getMessages(id, { before: pageParam as string | undefined }),
    getNextPageParam: (last) => last.olderCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
    select: (d) => ({
      ...d,
      pages: [...d.pages].reverse(),
    }),
  });

  const messages = data?.pages.flatMap((p) => [...p.messages].reverse()) ?? [];
  const latestMessageId = messages[0]?.id;

  // Poll every 3 s while any image attachment is still processing so the
  // "Processing…" pill flips to the actual thumbnail without needing a new message.
  const hasPendingImages = messages.some(
    (m) => m.attachment?.type === "IMAGE" && m.attachment?.status === "PENDING"
  );
  useEffect(() => {
    if (!hasPendingImages) return;
    const timer = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["messages", id] });
    }, 3000);
    return () => clearInterval(timer);
  }, [hasPendingImages, id]);

  useEffect(() => {
    joinConversation(id);
    return () => leaveConversation(id);
  }, [id]);

  useEffect(() => {
    if (conversation) {
      navigation.setOptions({ title: conversation.counterpart.displayName });
    }
  }, [conversation]);

  // Eagerly zero the badge in local cache so it clears the moment the screen opens.
  useEffect(() => {
    queryClient.setQueriesData<InfiniteData<ConversationsResponse>>(
      { queryKey: ["conversations"] },
      (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            items: page.items.map((item) =>
              item.id === id ? { ...item, unreadCount: 0 } : item
            ),
          })),
        };
      }
    );
  }, [id]);

  // Tell the server which message we've read up to. Runs once messages load and
  // again whenever a newer message appears (latestMessageId changes). Without a
  // valid upToMessageId the server returns 422 and never persists the read state,
  // which causes the badge to reappear on the next polling refetch.
  useEffect(() => {
    if (!latestMessageId) return;
    markRead(id, latestMessageId).catch((err) => console.warn("[markRead]", err));
  }, [id, latestMessageId]);

  const sendMutation = useMutation({
    mutationFn: (t: string) => sendMessage(id, { body: t }),
    onMutate: async (t: string) => {
      await queryClient.cancelQueries({ queryKey: ["messages", id] });
      const optimistic: Message = {
        id: `opt-${Date.now()}`,
        conversationId: id,
        senderId: null,
        senderType: "USER",
        body: t,
        offerId: null,
        moderationFlags: [],
        attachment: null,
        readAt: null,
        createdAt: new Date().toISOString(),
        mine: true,
      };
      queryClient.setQueryData(
        ["messages", id],
        (old: InfiniteData<MessagesResponse> | undefined) => {
          if (!old?.pages.length) return old;
          const pages = [...old.pages];
          // pages[0] is the most-recent page (no `before` cursor); append newest message to end
          pages[0] = { ...pages[0], messages: [...pages[0].messages, optimistic] };
          return { ...old, pages };
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", id] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", id] });
    },
  });

  const offerMutation = useMutation({
    mutationFn: (amount: string) => makeOffer(id, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offers", id] });
      queryClient.invalidateQueries({ queryKey: ["messages", id] });
      setShowOfferSheet(false);
      setOfferAmount("");
      setOfferMode("new");
    },
  });

  const acceptMutation = useMutation({
    mutationFn: (offerId: string) => acceptOffer(offerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offers", id] });
      queryClient.invalidateQueries({ queryKey: ["messages", id] });
    },
  });

  const counterMutation = useMutation({
    mutationFn: ({ offerId, amount }: { offerId: string; amount: string }) =>
      counterOffer(offerId, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offers", id] });
      queryClient.invalidateQueries({ queryKey: ["messages", id] });
      setShowOfferSheet(false);
      setOfferAmount("");
      setOfferMode("new");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (offerId: string) => rejectOffer(offerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offers", id] });
      queryClient.invalidateQueries({ queryKey: ["messages", id] });
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: (offerId: string) => withdrawOffer(offerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offers", id] });
      queryClient.invalidateQueries({ queryKey: ["messages", id] });
    },
  });

  const lockDealMutation = useMutation({
    mutationFn: (offerId: string) => openTransaction(offerId),
    onSuccess: (tx) => {
      setLockedTxId(tx.id);
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["offers", id] });
      // getParent() targets the Tab navigator directly; navigate("DealsTab") from
      // inside ChatsStack can silently fail if the action doesn't bubble correctly.
      navigation.getParent()?.navigate("DealsTab");
    },
    onError: (err) => {
      if (err instanceof ApiError && err.problem.status === 409) {
        // Deal already exists — invalidate so Deals tab shows it, then go there.
        queryClient.invalidateQueries({ queryKey: ["transactions"] });
        navigation.getParent()?.navigate("DealsTab");
      } else if (err instanceof ApiError && err.problem.status === 403) {
        // KYC not approved — offer to take the buyer to the verification screen.
        Alert.alert(
          "Identity verification required",
          "You need to complete identity verification before initiating a deal.",
          [
            { text: "Not now", style: "cancel" },
            {
              text: "Verify identity",
              onPress: () =>
                navigation.getParent()?.navigate("AccountTab", { screen: "Kyc" }),
            },
          ]
        );
      } else {
        const msg = err instanceof ApiError
          ? err.problem.title
          : "Network error — please try again.";
        Alert.alert("Could not start deal", msg);
      }
    },
  });

  function handleSend() {
    if (!text.trim()) return;
    sendMutation.mutate(text.trim());
    setText("");
  }

  async function handleAttachment() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const contentType = asset.mimeType ?? getContentType(asset.uri);
    setAttachmentUploading(true);
    try {
      const { url, key } = await presignAttachment(id, contentType);
      await putToStorage(url, asset.uri, contentType);
      const name = asset.fileName ?? asset.uri.split("/").pop() ?? "photo.jpg";
      await sendMessage(id, {
        attachment: { key, type: "IMAGE", name },
      });
      queryClient.invalidateQueries({ queryKey: ["messages", id] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    } catch (err) {
      console.error("[attachment]", err);
      Alert.alert("Upload failed", "Could not send the photo. Please try again.");
    } finally {
      setAttachmentUploading(false);
    }
  }

  const isLocked = conversation?.status === "LOCKED";
  const activeOffer = offersData?.active ?? null;
  const agreedOffer = offersData?.agreed ?? null;
  // Derive ownership from makerId rather than the server's `mine` flag, which
  // can be unreliable depending on how the backend computes it per role.
  const activeOfferIsMine =
    activeOffer !== null && currentUserId !== undefined && activeOffer.makerId === currentUserId;
  const isBuyer = conversation?.role === "buyer";

  function renderMessage({ item }: { item: Message }) {
    const isOwn = item.mine;
    return (
      <View
        style={[
          styles.messageRow,
          isOwn ? styles.ownRow : styles.theirRow,
        ]}
      >
        <View
          style={[
            styles.bubble,
            isOwn ? styles.ownBubble : styles.theirBubble,
          ]}
        >
          {item.body && (
            <Text
              variant="body"
              style={isOwn ? styles.ownText : styles.theirText}
            >
              {item.body}
            </Text>
          )}
          {item.attachment && (
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("AttachmentViewer", {
                  objectId: item.attachment!.objectId,
                  conversationId: id,
                })
              }
              activeOpacity={0.85}
            >
              {item.attachment.type === "IMAGE" && item.attachment.status === "READY" ? (
                <Image
                  source={{
                    uri: `${API_BASE}/conversations/${id}/attachments/${item.attachment.objectId}?v=thumb`,
                    headers: authHeader,
                  }}
                  style={styles.attachmentImage}
                  contentFit="cover"
                  cachePolicy="none"
                />
              ) : (
                <View style={styles.attachmentPill}>
                  <Text style={[styles.attachmentLabel, isOwn ? styles.ownText : {}]}>
                    {item.attachment.type === "IMAGE" ? "🖼️" : "📄"}{" "}
                    {item.attachment.status === "PENDING" ? "Processing…" : item.attachment.type === "IMAGE" ? "Photo" : "Document"}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}
          <Text style={styles.timestamp}>
            {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={88}
    >
      {/* Active offer banner */}
      {activeOffer && (
        <View style={styles.offerBanner}>
          <View style={styles.offerBannerLeft}>
            <Text variant="bodySm" style={{ fontWeight: "600" }}>
              {activeOfferIsMine ? "Your offer" : "Offer received"}: {formatNaira(activeOffer.amount)}
            </Text>
            <StatusChip
              label={OFFER_STATUS_LABELS[activeOffer.status]}
              family={OFFER_STATUS_CHIP_FAMILY[activeOffer.status]}
            />
          </View>
          {activeOffer.status === "PENDING" && !activeOfferIsMine && (
            <View style={styles.offerBannerActions}>
              <TouchableOpacity
                style={styles.offerActionBtn}
                onPress={() => acceptMutation.mutate(activeOffer.id)}
                disabled={acceptMutation.isPending || rejectMutation.isPending}
              >
                <Text style={styles.offerActionAccept}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.offerActionBtn}
                onPress={() => {
                  setOfferMode("counter");
                  setShowOfferSheet(true);
                }}
              >
                <Text style={styles.offerActionCounter}>Counter</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.offerActionBtn}
                onPress={() => rejectMutation.mutate(activeOffer.id)}
                disabled={acceptMutation.isPending || rejectMutation.isPending}
              >
                <Text style={styles.offerActionReject}>Reject</Text>
              </TouchableOpacity>
            </View>
          )}
          {activeOffer.status === "PENDING" && activeOfferIsMine && (
            <TouchableOpacity
              style={styles.offerActionBtn}
              onPress={() => withdrawMutation.mutate(activeOffer.id)}
              disabled={withdrawMutation.isPending}
            >
              <Text style={styles.offerActionWithdraw}>Withdraw</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Agreed offer — offer accepted, awaiting escrow initiation */}
      {agreedOffer && !activeOffer && (
        <View style={styles.agreedBanner}>
          <View style={styles.offerBannerLeft}>
            <Text variant="bodySm" style={{ fontWeight: "600" }}>
              Agreed: {formatNaira(agreedOffer.amount)}
            </Text>
            <StatusChip
              label={OFFER_STATUS_LABELS[agreedOffer.status]}
              family={OFFER_STATUS_CHIP_FAMILY[agreedOffer.status]}
            />
          </View>
          {isBuyer ? (
            lockedTxId ? (
              <Text variant="bodySm" style={{ color: "#22a861", fontWeight: "600" }}>
                Deal initiated ✓
              </Text>
            ) : (
              <TouchableOpacity
                style={styles.lockDealBtn}
                onPress={() => lockDealMutation.mutate(agreedOffer.id)}
                disabled={lockDealMutation.isPending}
              >
                <Text style={styles.lockDealText}>
                  {lockDealMutation.isPending ? "Initiating…" : "Lock in deal"}
                </Text>
              </TouchableOpacity>
            )
          ) : (
            <Text variant="bodySm" muted>Awaiting buyer</Text>
          )}
        </View>
      )}

      <FlatList
        ref={listRef}
        data={isLoading ? [] : messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messageList}
        inverted
        onEndReached={() => { if (hasNextPage) fetchNextPage(); }}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          isLoading ? (
            <ActivityIndicator color={colors.blue} style={{ padding: 20 }} />
          ) : null
        }
      />

      {/* Offer sheet */}
      {showOfferSheet && !isLocked && (
        <View style={styles.offerSheet}>
          <Text variant="label" style={{ marginBottom: 8 }}>
            {offerMode === "counter" ? "Counter offer" : "Make an offer"}
          </Text>
          <View style={styles.offerInput}>
            <Text style={styles.nairaPrefix}>₦</Text>
            <TextInput
              style={styles.offerTextField}
              placeholder="500,000,000"
              keyboardType="numeric"
              value={offerAmount}
              onChangeText={setOfferAmount}
              placeholderTextColor={colors.placeholder}
            />
          </View>
          <View style={styles.offerActions}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => {
                setShowOfferSheet(false);
                setOfferAmount("");
                setOfferMode("new");
              }}
            >
              <Text variant="bodySm" muted>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.sendOfferBtn}
              onPress={() => {
                if (offerMode === "counter" && activeOffer) {
                  counterMutation.mutate({ offerId: activeOffer.id, amount: offerAmount });
                } else {
                  offerMutation.mutate(offerAmount);
                }
              }}
              disabled={offerMutation.isPending || counterMutation.isPending}
            >
              <Text style={styles.sendOfferText}>
                {offerMutation.isPending || counterMutation.isPending ? "Sending…" : "Send"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Composer */}
      {!isLocked ? (
        <View style={styles.composer}>
          {!activeOffer && (
            <TouchableOpacity
              style={styles.composerIconBtn}
              onPress={() => {
                setOfferMode("new");
                setShowOfferSheet(!showOfferSheet);
              }}
            >
              <Text style={styles.composerIcon}>💰</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.composerIconBtn}
            onPress={handleAttachment}
            disabled={attachmentUploading}
          >
            {attachmentUploading ? (
              <ActivityIndicator size="small" color={colors.blue} />
            ) : (
              <Text style={styles.composerIcon}>📎</Text>
            )}
          </TouchableOpacity>
          <TextInput
            style={[styles.composerInput, { maxHeight: 100 }]}
            placeholder="Message…"
            placeholderTextColor={colors.placeholder}
            value={text}
            onChangeText={(t) => {
              setText(t);
              sendTyping(id, t.length > 0);
            }}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!text.trim() || sendMutation.isPending}
          >
            <Text style={styles.sendIcon}>➤</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.lockedBanner}>
          <Text variant="bodySm" muted center>
            🔒 This conversation is locked
          </Text>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  offerBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.base,
    backgroundColor: colors.goldSoft,
    borderBottomWidth: 1,
    borderColor: colors.line,
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  offerBannerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 1,
  },
  offerBannerActions: {
    flexDirection: "row",
    gap: 6,
  },
  offerActionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paper,
  },
  offerActionAccept: { color: "#22a861", fontWeight: "700", fontSize: 13 },
  offerActionCounter: { color: colors.blueDeep, fontWeight: "700", fontSize: 13 },
  offerActionReject: { color: colors.error, fontWeight: "700", fontSize: 13 },
  offerActionWithdraw: { color: colors.muted, fontWeight: "600", fontSize: 13 },
  agreedBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.base,
    backgroundColor: "#eaf7ef",
    borderBottomWidth: 1,
    borderColor: colors.line,
    gap: spacing.sm,
  },
  lockDealBtn: {
    backgroundColor: "#22a861",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  lockDealText: { color: colors.paper, fontWeight: "700", fontSize: 13 },
  messageList: { padding: spacing.base, paddingBottom: spacing.xl },
  messageRow: { marginBottom: 8 },
  ownRow: { alignItems: "flex-end" },
  theirRow: { alignItems: "flex-start" },
  bubble: {
    maxWidth: "78%",
    padding: spacing.sm,
    borderRadius: radii.card,
  },
  ownBubble: {
    backgroundColor: colors.blueSoft,
    borderBottomRightRadius: 4,
  },
  theirBubble: {
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderBottomLeftRadius: 4,
  },
  ownText: { color: colors.blueInk },
  theirText: { color: colors.ink },
  attachmentLabel: { color: colors.blue, fontWeight: "600" },
  timestamp: { fontSize: 11, color: colors.muted, marginTop: 4, alignSelf: "flex-end" },
  offerSheet: {
    backgroundColor: colors.paper,
    padding: spacing.base,
    borderTopWidth: 1,
    borderColor: colors.line,
  },
  offerInput: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bg,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: spacing.base,
    height: 48,
    marginBottom: spacing.sm,
  },
  nairaPrefix: { color: colors.muted, marginRight: 4, fontSize: 16 },
  offerTextField: {
    flex: 1,
    fontFamily: fonts.hankenRegular,
    fontSize: 18,
    color: colors.ink,
  },
  offerActions: { flexDirection: "row", justifyContent: "flex-end", gap: 12 },
  cancelBtn: { padding: 8 },
  sendOfferBtn: {
    backgroundColor: colors.blueDeep,
    borderRadius: radii.chip,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sendOfferText: { color: colors.paper, fontWeight: "600" },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: spacing.sm,
    backgroundColor: "rgba(246,248,250,0.92)",
    borderTopWidth: 1,
    borderColor: colors.line,
    gap: spacing.sm,
  },
  composerIconBtn: {
    width: 36,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  composerIcon: { fontSize: 20 },
  attachmentImage: {
    width: 200,
    height: 150,
    borderRadius: radii.card,
    marginBottom: 4,
  },
  attachmentPill: {
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  composerInput: {
    flex: 1,
    backgroundColor: colors.paper,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: spacing.base,
    paddingVertical: 10,
    fontFamily: fonts.hankenRegular,
    fontSize: 15,
    color: colors.ink,
    minHeight: 40,
  },
  sendBtn: {
    width: 40,
    height: 40,
    backgroundColor: colors.blueDeep,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendIcon: { color: colors.paper, fontSize: 16 },
  lockedBanner: {
    padding: spacing.base,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderColor: colors.line,
  },
});
