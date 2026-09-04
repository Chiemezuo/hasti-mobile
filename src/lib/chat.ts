interface OwnershipInput {
  senderId: string | null;
  mine: boolean;
}

// The server's `mine` flag is unreliable for some message shapes (notably
// offer-linked messages), the same way it was for Offer.mine. Prefer the
// stable senderId comparison whenever both sides are known.
export function isMessageMine(message: OwnershipInput, currentUserId: string | undefined): boolean {
  if (message.senderId != null && currentUserId != null) {
    return message.senderId === currentUserId;
  }
  return message.mine;
}
