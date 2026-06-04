import {
  type MahjongState,
  type MahjongMeldResponse,
} from "@gamenite/shared/src/games/mahjong.types.ts";
import { removeOne, sortBySuit } from "./mahjongTiles.ts";
import { drawForPlayer } from "./mahjongDraw.ts";

/**
 * cleans up the parts of state that need to be reset after a meld action (pong, kong, or seung)
 * @param state - current state
 * @param player - player index of the player who performed the meld action
 * @returns updated state with the current player set to the meld action player, phase set to 'discard',
 * and meld responses reset to null
 */
function meldActionCleanup(state: MahjongState, player: number): MahjongState {
  return {
    ...state,
    lastDiscard: null,
    currentPlayer: player,
    phase: "discard",
    meldResponses: [null, null, null, null],
  };
}

/**
 * Resolve the meld window once all four players have responded.
 *
 * Priority order: win > kong > pong > seung.
 * Within the same priority level the player closest in counter-clockwise
 * Seung is only available to the player immediately left of the discarder.
 * If nobody melded and the wall is empty the game ends in a draw.
 *
 * During the meld window, the most recently discarded tile should be in state.lastDiscard
 * but NOT state.discardPile, the tile will be added to the discard pile only after the
 * window resolves with no melds.
 *
 * resolveMeldWindow assumes that all meldResponses are valid and non-null
 * and does NOT perform additional validation.
 *
 * @input state - state in which meldResponses has no null entries
 * @returns new state after applying the highest-priority response
 */
export function resolveMeldWindow(state: MahjongState): MahjongState {
  // All responses must be non-null to resolve the meld phase, so this is safe to assert
  const responses = state.meldResponses as MahjongMeldResponse[];
  const discarder = state.currentPlayer;
  // there muse be a discard to enter the meld phase, so this is safe to assert
  const discard = state.lastDiscard as string;

  // counter-clockwise turn order from the player after the discarder
  const turnOrder = [1, 2, 3].map((offset) => (discarder + offset) % 4);

  // ── win ──────────────────────────────────────────
  for (const p of turnOrder) {
    if (responses[p].type === "win") {
      return { ...state, phase: "done", winner: p };
    }
  }

  // ── kong ─────────────────────────────────────────
  for (const p of turnOrder) {
    if (responses[p].type === "kong") {
      let hand = [...state.hands[p]];
      for (let i = 0; i < 3; i++) hand = removeOne(hand, discard);

      const newMelds = [
        ...state.melds[p],
        { type: "kong" as const, tiles: [discard, discard, discard, discard], concealed: false },
      ];

      let next = meldActionCleanup(
        {
          ...state,
          hands: state.hands.map((h, i) => (i === p ? hand : [...h])),
          melds: state.melds.map((m, i) => (i === p ? newMelds : [...m])),
        },
        p,
      );

      // kong requires a replacement draw from the dead wall
      next = drawForPlayer(next, p, true);
      return next;
    }
  }

  // ── pong ─────────────────────────────────────────
  for (const p of turnOrder) {
    if (responses[p].type === "pong") {
      let hand = [...state.hands[p]];
      for (let i = 0; i < 2; i++) hand = removeOne(hand, discard);

      const newMelds = [
        ...state.melds[p],
        { type: "pong" as const, tiles: [discard, discard, discard], concealed: false },
      ];

      return meldActionCleanup(
        {
          ...state,
          hands: state.hands.map((h, i) => (i === p ? hand : [...h])),
          melds: state.melds.map((m, i) => (i === p ? newMelds : [...m])),
        },
        p,
      );
    }
  }

  // ── seung (left-of-discarder only) ───────────────
  for (const p of turnOrder) {
    if (responses[p].type === "seung") {
      const [t1, t2] = responses[p].with;
      let hand = [...state.hands[p]];
      hand = removeOne(hand, t1);
      hand = removeOne(hand, t2);

      const newMelds = [
        ...state.melds[p],
        { type: "seung" as const, tiles: sortBySuit([discard, t1, t2]), concealed: false },
      ];

      return meldActionCleanup(
        {
          ...state,
          hands: state.hands.map((h, i) => (i === p ? hand : [...h])),
          melds: state.melds.map((m, i) => (i === p ? newMelds : [...m])),
        },
        p,
      );
    }
  }

  // ── nobody melded ─────────────────────────────────
  if (state.wall.length === 0) {
    // wall exhausted — draw game
    return { ...state, phase: "done", winner: null };
  }

  const nextPlayer = (discarder + 1) % 4;
  let next: MahjongState = {
    ...state,
    discardPile: [...state.discardPile, discard],
    lastDiscard: null,
    currentPlayer: nextPlayer,
    phase: "discard",
    meldResponses: [null, null, null, null],
  };
  next = drawForPlayer(next, nextPlayer);
  return next;
}
