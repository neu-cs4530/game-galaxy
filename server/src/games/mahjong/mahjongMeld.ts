import {
  type MahjongState,
  type MahjongMeldResponse,
} from "@gamenite/shared/src/games/mahjong.types.ts";
import { removeOne } from "./mahjongTiles.ts";
import { drawForPlayer } from "./mahjongDraw.ts";

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
      // update hand
      for (let i = 0; i < 3; i++) {
        state.hands[p] = removeOne(state.hands[p], discard);
      }

      // update melds
      state.melds[p].push({
        type: "kong",
        tiles: [discard, discard, discard, discard],
        concealed: false,
      });

      //update remaining state fields
      state.lastDiscard = null;
      state.currentPlayer = p;
      state.phase = "discard";
      state.meldResponses = [null, null, null, null];

      // kong requires a replacement draw from the dead wall
      const next = drawForPlayer(state, p, true);
      return next;
    }
  }
}
