import { type MahjongTile, type MahjongMeld } from "@gamenite/shared/src/games/mahjong.types.ts";
import { nextTile, removeOne, sortBySuit } from "./mahjongTiles.ts";

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
 * already-declared melds, constitute a complete winning hand (4 sets + 1 pair).
 * Does not consider special hands or fan scoring.
 * @input hand - concealed hand tiles
 * @input melds - declared melds
 * @returns true if the hand is complete
 */
export function isWinningHand(hand: MahjongTile[], melds: MahjongMeld[]): boolean {
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
