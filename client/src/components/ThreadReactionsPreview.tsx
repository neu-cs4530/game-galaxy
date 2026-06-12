import "./ThreadReactions.css";
import type { ThreadInfo } from "@gamenite/shared";
import useThreadReactions from "../hooks/useThreadReactions.ts";

interface ThreadReactionsProps {
  thread: ThreadInfo;
  setThread: (newThread: ThreadInfo) => void;
}

/**
 * Shows the emoji reactions on a forum post and lets the logged-in user add,
 * switch, or remove their own reaction.
 */
export default function ThreadReactionsPreview({ thread, setThread }: ThreadReactionsProps) {
  const { tallies, err } = useThreadReactions(thread, setThread);

  return (
    <div className="threadReactions">
      <div className="reactionButtons" role="group" aria-label="Reactions">
        {tallies
          .filter(({ count }) => count > 0)
          .map(({ emoji, count, reacted }) => (
            <button
              type="button"
              key={emoji}
              className={`reactionButton${reacted ? " reacted" : ""}`}
              aria-pressed={reacted}
              aria-label={`React with ${emoji}`}
            >
              <span className="reactionEmoji">{emoji}</span>
              {count > 0 && <span className="reactionCount">{count}</span>}
            </button>
          ))}
      </div>
      {err && <p className="error-message">{err}</p>}
    </div>
  );
}
