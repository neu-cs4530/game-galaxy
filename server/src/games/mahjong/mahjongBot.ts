import type {
  MahjongTile,
  MahjongMeld,
  MahjongMove,
  MahjongState,
} from "@gamegalaxy/shared/src/games/mahjong.types.ts";
import { getSuit, getValue, removeOne } from "./mahjongTiles.ts";
import { isWinningHand } from "./mahjongWin.ts";

/**
 * Find two hand tiles that form a valid sequence with the given discard tile.
 * Inputs: concealed hand, discard tile
 * Returns: [t1, t2] pair of hand tiles, or null if no seung is available
 */
function findSeungWith(
  hand: MahjongTile[],
  discard: MahjongTile,
): [MahjongTile, MahjongTile] | null {
  const suit = getSuit(discard);
  const value = getValue(discard);
  if (!suit || value === null) return null;

  const combos = (
    [
      [value + 1, value + 2],
      [value - 1, value + 1],
      [value - 2, value - 1],
    ] as [number, number][]
  ).filter(([a, b]) => a >= 1 && a <= 9 && b >= 1 && b <= 9);

  for (const [a, b] of combos) {
    const t1 = `${a}${suit}`;
    const t2 = `${b}${suit}`;
    if (hand.includes(t1) && removeOne(hand, t1).includes(t2)) {
      return [t1, t2];
    }
  }
  return null;
}

/**
 * Choose the bot's response during the meld window.
 * Wins if possible, melds if possible, otherwise passes.
 * Meld priority: win > kong > pong > seung > pass.
 *
 * @param hand - the bot's concealed tiles
 * @param melds - the bot's declared melds
 * @param discard - the tile that was discarded
 * @param playerIndex - the bot's seat index
 * @param discarderIndex - the discarding player's seat index
 * @returns the move to submit
 */
export function getBotMeldResponse(
  hand: MahjongTile[],
  melds: MahjongMeld[],
  discard: MahjongTile,
  playerIndex: number,
  discarderIndex: number,
): MahjongMove {
  if (isWinningHand([...hand, discard], melds)) {
    return { type: "win" };
  }

  if (hand.filter((t) => t === discard).length >= 3) {
    return { type: "meld", with: [discard, discard, discard] };
  }

  if (hand.filter((t) => t === discard).length >= 2) {
    return { type: "meld", with: [discard, discard] };
  }

  if (playerIndex === (discarderIndex + 1) % 4) {
    const seungTiles = findSeungWith(hand, discard);
    if (seungTiles) {
      return { type: "meld", with: seungTiles };
    }
  }

  return { type: "pass" };
}

/**
 * Determine the bot's move for the current game state.
 * Returns null if it is not this bot's turn to act.
 *
 * In the discard phase the bot wins if possible, otherwise discards a random
 * tile from its hand.
 * In the meld window the bot wins or melds if able, otherwise passes.
 *
 * @param state - current game state
 * @param playerIndex - the bot's seat index
 * @returns the move to submit, or null if the bot need not act
 */
export function getBotMove(state: MahjongState, playerIndex: number): MahjongMove | null {
  if (state.phase === "ended") return null;

  // auto-vote yes during voting phase
  if (state.phase === "voting") {
    if (state.playAgainVotes[playerIndex] !== null) return null;
    return { type: "playAgain", vote: true };
  }

  const hand = state.hands[playerIndex];
  const melds = state.melds[playerIndex];

  if (state.phase === "discard") {
    if (state.currentPlayer !== playerIndex) return null;
    if (isWinningHand(hand, melds)) return { type: "win" };
    // discard a random tile from hand
    const tile = hand[Math.floor(Math.random() * hand.length)];
    return { type: "discard", tile };
  }

  if (state.phase === "meld_window") {
    if (state.currentPlayer === playerIndex) return null;
    if (state.meldResponses[playerIndex] !== null) return null;
    return getBotMeldResponse(hand, melds, state.lastDiscard!, playerIndex, state.currentPlayer);
  }

  return null;
}
