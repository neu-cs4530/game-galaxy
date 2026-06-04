import { z } from "zod";
import { type SafeUserInfo } from "./user.types.ts";

/**
 * The emoji a user is allowed to react to a forum post with. A user may react
 * with any number of distinct emojis, but at most once per emoji.
 */
export const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢"] as const;

/**
 * A single allowed reaction emoji.
 */
export type ReactionEmoji = (typeof REACTION_EMOJIS)[number];
export const zReactionEmoji = z.enum(REACTION_EMOJIS);

/**
 * Represents a single reaction on a forum post as exposed to the client.
 * - `emoji`: which emoji was used
 * - `user`: the reacting user
 */
export interface ReactionInfo {
  emoji: ReactionEmoji;
  user: SafeUserInfo;
}

/*** TYPES USED IN THE REACTION API ***/

/**
 * Relevant information for reacting to a post. Sending an emoji the user has
 * not yet reacted with adds said emoji, while sending one they already reacted with removes
 * that emoji.
 */
export type ReactMessage = z.infer<typeof zReactMessage>;
export const zReactMessage = z.object({
  emoji: zReactionEmoji,
});
