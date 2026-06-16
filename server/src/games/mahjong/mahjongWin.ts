import { type MahjongTile, type MahjongMeld } from "@gamenite/shared/src/games/mahjong.types.ts";
import { nextTile, removeOne, sortBySuit, getSuit, getValue } from "./mahjongTiles.ts";

/**
 * Recursively determine whether a sorted tile list decomposes entirely
 * into valid sets (triplets or consecutive same-suit sequences of three).
 * @input tiles - sorted tile array whose length must be a multiple of 3
 * @returns true if the tiles form valid sets
 */
function canFormSets(tiles: MahjongTile[]): boolean {
  if (tiles.length === 0) return true;
  if (tiles.length % 3 !== 0) return false;

  const sorted = sortBySuit(tiles);
  const first = sorted[0];

  // attempt triplet with the first tile
  let count = 0;
  const afterTriplet = sorted.filter((t) => {
    if (t === first && count < 3) {
      count++;
      return false;
    }
    return true;
  });
  if (count === 3 && canFormSets(afterTriplet)) return true;

  // attempt sequence starting at the first tile
  const n1 = nextTile(first);
  const n2 = n1 ? nextTile(n1) : null;
  if (n1 && n2 && sorted.includes(n1) && sorted.includes(n2)) {
    let rest = removeOne(sorted, first);
    rest = removeOne(rest, n1);
    rest = removeOne(rest, n2);
    if (canFormSets(rest)) return true;
  }

  return false;
}

/**
 * Determine whether the player's concealed hand tiles, together with their
 * already-declared melds, constitute a complete winning hand.
 * Covers standard hands (4 sets + 1 pair), Thirteen Orphans, and Nine Gates.
 * @input hand - concealed hand tiles
 * @input melds - declared melds
 * @returns true if the hand is complete
 */
export function isWinningHand(hand: MahjongTile[], melds: MahjongMeld[]): boolean {
  // ── Thirteen Orphans ─────────────────────────────────────────────
  // one each of every terminal (1&9) and honour tile, plus a pair of any one of them
  if (melds.length === 0 && hand.length === 14) {
    const required = ["1d", "9d", "1b", "9b", "1c", "9c", "ew", "sw", "ww", "nw", "rd", "gd", "wd"];
    if (required.every((t) => hand.includes(t)) && new Set(hand).size === 13) {
      return true;
    }
  }

  // ── Nine Gates ──────────────────────────────────────────────────
  // concealed 1112345678999 in a single suit, which accepts any tile 1–9 of that suit
  if (melds.length === 0 && hand.length === 14) {
    const suits = new Set(hand.map((t) => getSuit(t)).filter(Boolean));
    if (suits.size === 1) {
      const vals = hand.map((t) => getValue(t)).filter((v) => v !== null);
      if (vals.length === 14) {
        const sorted = [...vals].sort((a, b) => a - b);
        const base = [1, 1, 1, 2, 3, 4, 5, 6, 7, 8, 9, 9, 9];
        for (let extra = 1; extra <= 9; extra++) {
          const expected = [...base, extra].sort((a, b) => a - b);
          if (JSON.stringify(sorted) === JSON.stringify(expected)) return true;
        }
      }
    }
  }

  // ── Standard hand (4 sets + 1 pair) ──────────────────────────────────────
  const setsNeeded = 4 - melds.length;

  // try each unique tile as the pair and see if the rest can form the required sets
  const tried = new Set<MahjongTile>();
  for (const tile of hand) {
    if (tried.has(tile)) continue;
    tried.add(tile);
    if (hand.filter((t) => t === tile).length >= 2) {
      let rest = removeOne(hand, tile);
      rest = removeOne(rest, tile);
      if (rest.length === setsNeeded * 3 && canFormSets(rest)) return true;
    }
  }
  return false;
}
