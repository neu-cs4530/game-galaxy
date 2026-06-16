import type {
  MahjongState,
  MahjongMeldResponse,
  WinInfo,
} from "@gamenite/shared/src/games/mahjong.types.ts";
import { removeOne, sortBySuit, getSuit, getValue } from "./mahjongTiles.ts";
import { drawForPlayer } from "./mahjongDraw.ts";
import { resolveHandWin } from "./mahjongScoring.ts";

/**
 * Clean up state fields that must reset after any meld action (pong, seung, or kong).
 * Resets kong-tracking fields so they only apply within a single turn's chain of kongs.
 */
function meldActionCleanup(state: MahjongState, player: number): MahjongState {
  return {
    ...state,
    lastDiscard: null,
    currentPlayer: player,
    phase: "discard",
    meldResponses: [null, null, null, null],
    afterKong: false,
    consecutiveKongsThisTurn: 0,
  };
}

/**
 * Resolve the meld portion of a kong action: add the kong meld, draw a
 * replacement tile from the dead wall, and update kong-tracking fields.
 * Does NOT edit the player's hand — callers must remove the four tiles first.
 *
 * @param state - state before resolving the kong (hand already updated)
 * @param player - player index performing the kong
 * @param tile - the tile being konged
 * @param concealed - true for concealed or promoted kongs
 */
export function resolveKong(
  state: MahjongState,
  player: number,
  tile: string,
  concealed: boolean = false,
): MahjongState {
  const newMelds = [
    ...state.melds[player],
    { type: "kong" as const, tiles: [tile, tile, tile, tile], concealed },
  ];

  // save consecutive count before meldActionCleanup resets it
  const prevConsecutive = state.consecutiveKongsThisTurn;

  let next = meldActionCleanup(
    {
      ...state,
      melds: state.melds.map((m, i) => (i === player ? newMelds : [...m])),
    },
    player,
  );

  // re-apply kong tracking after cleanup
  next = { ...next, afterKong: true, consecutiveKongsThisTurn: prevConsecutive + 1 };

  // draw replacement tile from the dead wall
  next = drawForPlayer(next, player, true);
  return next;
}

/**
 * Resolve the meld window once all four players have responded.
 *
 * Priority: win > kong > pong > seung.
 * Seung is only available to the player immediately left of the discarder.
 * If nobody melds and the wall is empty, the game ends in a draw.
 *
 * The discarded tile lives in `state.lastDiscard` (NOT yet in `state.discardPile`)
 * until the window resolves with no meld — then it is added to discardPile.
 *
 * Assumes all meldResponses are valid and non-null.
 */
export function resolveMeldWindow(state: MahjongState): MahjongState {
  const responses = state.meldResponses as MahjongMeldResponse[];
  const discarder = state.currentPlayer;
  const discard = state.lastDiscard as string;

  // counter-clockwise turn order from the player after the discarder (depends on # players)
  const numPlayers = state.meldResponses.length;
  const turnOrder = Array.from(
    { length: numPlayers - 1 },
    (_, i) => (discarder + i + 1) % numPlayers,
  );

  // ── win ──────────────────────────────────────────────────────────────────
  for (const p of turnOrder) {
    if (responses[p].type === "win") {
      const winInfo: WinInfo = {
        selfDraw: false,
        afterKong: false,
        afterMultipleKongs: false,
        finalTile: state.wall.length === 0,
        robbingKong: false,
        discarderIndex: discarder,
        winningTile: discard,
      };
      return resolveHandWin(state, p, winInfo);
    }
  }

  // ── kong ──────────────────────────────────────────────────────────────────
  for (const p of turnOrder) {
    if (responses[p].type === "kong") {
      let hand = [...state.hands[p]];
      for (let i = 0; i < 3; i++) hand = removeOne(hand, discard);

      return resolveKong(
        { ...state, hands: state.hands.map((h, i) => (i === p ? hand : [...h])) },
        p,
        discard,
      );
    }
  }

  // ── pong ──────────────────────────────────────────────────────────────────
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

  // ── seung (left-of-discarder only) ────────────────────────────────────────
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

  // ── nobody melded ─────────────────────────────────────────────────────────
  if (state.wall.length === 0) {
    // wall exhausted: draw — no scoring, dealer stays, players vote to continue
    return {
      ...state,
      phase: "voting",
      winner: null,
      lastScoring: undefined,
      playAgainVotes: [null, null, null, null],
    };
  }

  const nextPlayer = (discarder + 1) % numPlayers;
  let next: MahjongState = {
    ...state,
    discardPile: [...state.discardPile, discard],
    lastDiscard: null,
    currentPlayer: nextPlayer,
    phase: "discard",
    meldResponses: Array<MahjongMeldResponse | null>(numPlayers).fill(null),
  };
  next = drawForPlayer(next, nextPlayer);
  return next;
}

/**
 * Validate that two hand tiles plus the discarded tile form a valid sequence.
 * Seung is only available to the player immediately left of the discarder.
 *
 * @param playerIndex - the claiming player's index
 * @param state - current game state
 * @param t1 - first hand tile
 * @param t2 - second hand tile
 * @param t3 - the discarded tile
 */
export function isValidSeung(
  playerIndex: number,
  state: MahjongState,
  t1: string,
  t2: string,
  t3: string,
): boolean {
  // seung is only available to the player immediately left of the discarder
  const numPlayers = state.meldResponses.length;
  if (playerIndex !== (state.currentPlayer + 1) % numPlayers) return false;
  // verify that {discard, t1, t2} form a valid same-suit sequence
  const three = [t1, t2, t3].sort();
  const suit = getSuit(three[0]);
  return (
    suit !== null &&
    getSuit(three[1]) === suit &&
    getSuit(three[2]) === suit &&
    getValue(three[1]) === getValue(three[0])! + 1 &&
    getValue(three[2]) === getValue(three[0])! + 2
  );
}
