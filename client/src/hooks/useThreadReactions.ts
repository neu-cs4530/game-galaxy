import { useState } from "react";
import { REACTION_EMOJIS, type ReactionEmoji, type ThreadInfo } from "@gamegalaxy/shared";
import useAuth from "@gamegalaxy/client/src/hooks/useAuth.ts";
import useLoginContext from "@gamegalaxy/client/src/hooks/useLoginContext.ts";
import { reactToThread } from "@gamegalaxy/client/src/services/threadService.ts";

/**
 * A single reaction emoji's aggregate state for display.
 * - `emoji`: the emoji
 * - `count`: how many users reacted with it
 * - `reacted`: whether the current user reacted with it
 */
export interface ReactionTally {
  emoji: ReactionEmoji;
  count: number;
  reacted: boolean;
}

/**
 * Custom hook to manage emoji reactions on a thread.
 * @param thread - the thread being viewed
 * @param setThread - callback to update the parent page when reactions change
 * @returns an object containing
 *  - `tallies`: one entry per allowed emoji with its count and whether the
 *    current user reacted with it
 *  - `err`: a possibly-null error message
 *  - `toggle`: a callback that toggles the current user's reaction for an emoji
 */
export default function useThreadReactions(
  thread: ThreadInfo,
  setThread: (thread: ThreadInfo) => void,
) {
  const auth = useAuth();
  const { user, socket } = useLoginContext();
  const [err, setErr] = useState<string | null>(null);

  const tallies: ReactionTally[] = REACTION_EMOJIS.map((emoji) => {
    const forEmoji = thread.reactions.filter((r) => r.emoji === emoji);
    return {
      emoji,
      count: forEmoji.length,
      reacted: forEmoji.some((r) => r.user.username === user.username),
    };
  });

  async function toggle(emoji: ReactionEmoji) {
    try {
      const updated = await reactToThread(auth, thread.threadId, emoji);
      setErr(null);
      setThread(updated);
      socket.emit("threadInteraction", {
        auth,
        payload: {
          threadId: thread.threadId,
          displayName: user.display,
          threadName: thread.title,
          eventType: emoji,
        },
      });
    } catch (e) {
      setErr(`${e}`);
    }
  }

  return { tallies, err, toggle };
}
